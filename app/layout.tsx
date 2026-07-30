import type { Metadata } from "next";
import "./globals.css";

import AuthProvider from "@/components/providers/session-provider";

export const metadata: Metadata = {
  title: "SkillQuest",
  description: "Learn through gamification",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}