import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nutricious | Plan with purpose",
  description: "Plan meals and keep your nutrition organized.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
