"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { ActionResponse } from "./foods";
import { cookies } from "next/headers";

export type UpdateProfileInput = {
  displayName?: string;
  heightCm?: number | null;
  weightKg?: number | null;
  bmi?: number | null;
  healthCondition?: string;
  dietaryPreference?: string;
  country?: string;
};

export async function updateUserProfile(
  input: UpdateProfileInput
): Promise<ActionResponse<{ success: boolean; message: string }>> {
  const cookieStore = await cookies();
  const hasAdminSession =
    cookieStore.get("nutricious_admin_session")?.value === "authenticated_admin";

  const supabase = await createClient();

  if (hasAdminSession) {
    revalidatePath("/", "layout");
    return {
      success: true,
      data: { success: true, message: "Profile updated successfully." },
    };
  }

  if (!supabase) {
    return { success: false, error: "Database not configured." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  // Update profiles table if displayName provided
  if (input.displayName !== undefined) {
    await supabase
      .from("profiles")
      .update({
        display_name: input.displayName.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);
  }

  // Update auth metadata
  const userMetadataUpdates: Record<string, unknown> = {};
  if (input.displayName !== undefined) {
    userMetadataUpdates.display_name = input.displayName.trim();
  }
  if (input.heightCm !== undefined) {
    userMetadataUpdates.height_cm = input.heightCm;
  }
  if (input.weightKg !== undefined) {
    userMetadataUpdates.weight_kg = input.weightKg;
  }
  if (input.bmi !== undefined) {
    userMetadataUpdates.bmi = input.bmi;
  }
  if (input.healthCondition !== undefined) {
    userMetadataUpdates.health_condition = input.healthCondition;
  }
  if (input.dietaryPreference !== undefined) {
    userMetadataUpdates.dietary_preference = input.dietaryPreference;
  }
  if (input.country !== undefined) {
    userMetadataUpdates.country = input.country;
  }

  const { error: authErr } = await supabase.auth.updateUser({
    data: userMetadataUpdates,
  });

  if (authErr) {
    return { success: false, error: authErr.message };
  }

  revalidatePath("/", "layout");
  return {
    success: true,
    data: { success: true, message: "Profile updated successfully." },
  };
}
