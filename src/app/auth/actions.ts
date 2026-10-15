"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthState = {
  error: string | null;
  success: string | null;
};

function formatAuthError(error: { message: string; status?: number }) {
  if (
    error.message?.includes("Bad Gateway") ||
    error.message?.includes("fetch failed") ||
    error.status === 502 ||
    error.status === 521
  ) {
    return "Unable to connect to Supabase (502 Bad Gateway). Your Supabase project appears to be paused. Please visit https://supabase.com/dashboard and click 'Restore project' to activate it.";
  }
  if (error.message?.includes("Email not confirmed")) {
    return "Your email has not been confirmed yet. Please check your inbox (and spam folder) for the confirmation link from Supabase, or disable 'Confirm email' in Supabase Auth settings to allow instant sign-in.";
  }
  if (error.message?.includes("Invalid login credentials")) {
    return "Invalid email or password. Please verify your credentials and try again.";
  }
  return error.message;
}

export async function login(
  prevState: AuthState | null,
  formData: FormData
): Promise<AuthState> {
  const supabase = await createClient();
  if (!supabase) {
    return {
      error: "Supabase environment variables are not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.",
      success: null,
    };
  }

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !email.includes("@")) {
    return { error: "Please enter a valid email address.", success: null };
  }

  if (!password || password.length < 6) {
    return {
      error: "Password must be at least 6 characters.",
      success: null,
    };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: formatAuthError(error), success: null };
  }

  // Ensure profile row exists for logged in user without overwriting existing role
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    try {
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("id", user.id)
        .maybeSingle();

      if (!existingProfile) {
        await supabase.from("profiles").insert({
          id: user.id,
          display_name: (user.user_metadata?.display_name as string) || email.split("@")[0],
          role: "user",
        });
      }
    } catch {
      // Ignored
    }
  }

  revalidatePath("/", "layout");
  redirect("/");
  return { error: null, success: "Signed in successfully." };
}

export async function signup(
  prevState: AuthState | null,
  formData: FormData
): Promise<AuthState> {
  const supabase = await createClient();
  if (!supabase) {
    return {
      error: "Supabase environment variables are not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.",
      success: null,
    };
  }

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const displayName = formData.get("displayName") as string;

  if (!email || !email.includes("@")) {
    return { error: "Please provide a valid email address.", success: null };
  }

  if (!password || password.length < 6) {
    return {
      error: "Password must be at least 6 characters.",
      success: null,
    };
  }

  const dietaryPreference = (formData.get("dietaryPreference") as string) || "mediterranean";
  const region = (formData.get("region") as string) || "global";

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName?.trim() || email.split("@")[0],
        dietary_preference: dietaryPreference,
        dietary_region: region,
      },
    },
  });

  if (error) {
    return { error: formatAuthError(error), success: null };
  }

  // If email confirmation is enabled on Supabase, session will be null
  if (data?.user && !data?.session) {
    return {
      error: null,
      success:
        "Account created! Please check your email inbox to confirm your registration.",
    };
  }

  // Ensure profile row exists if session is active immediately
  if (data?.user?.id) {
    try {
      await supabase.from("profiles").upsert(
        {
          id: data.user.id,
          display_name: displayName?.trim() || email.split("@")[0],
          role: "user",
        },
        { onConflict: "id" }
      );
    } catch {
      // Ignored if handled by trigger or already exists
    }
  }

  revalidatePath("/", "layout");
  redirect("/");
  return { error: null, success: "Account created successfully." };
}

export async function adminLogin(
  prevState: AuthState | null,
  formData: FormData
): Promise<AuthState> {
  const supabase = await createClient();
  if (!supabase) {
    return {
      error: "Supabase environment variables are not configured.",
      success: null,
    };
  }

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !email.includes("@")) {
    return { error: "Please enter a valid administrator email address.", success: null };
  }

  if (!password || password.length < 6) {
    return {
      error: "Invalid administrative credentials.",
      success: null,
    };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: formatAuthError(error), success: null };
  }

  if (data?.user) {
    // Strictly verify role in profiles table
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .maybeSingle();

    if (profile?.role !== "admin") {
      // Sign them back out immediately
      await supabase.auth.signOut();
      return {
        error: "Access Denied: This administrative console requires verified administrator privileges.",
        success: null,
      };
    }
  }

  revalidatePath("/", "layout");
  redirect("/");
  return { error: null, success: "Administrator session authenticated." };
}

export async function signOut() {
  const supabase = await createClient();
  if (supabase) {
    await supabase.auth.signOut();
  }
  revalidatePath("/", "layout");
  redirect("/login");
}

