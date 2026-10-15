import { AdminLoginForm } from "./AdminLoginForm";

export const metadata = {
  title: "Administrative Access Portal | Nutricious System",
  description: "Restricted administrative console authentication.",
  robots: "noindex, nofollow",
};

export default function AdminLoginPage() {
  return (
    <main className="admin-login-page">
      <AdminLoginForm />
    </main>
  );
}
