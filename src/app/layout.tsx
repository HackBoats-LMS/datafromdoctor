import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { getDoctorFromSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Portal",
  description: "A fast, secure, version-controlled patient logging system with live autocomplete.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getDoctorFromSession();

  return (
    <html lang="en">
      <body>
        <header className="header">
          <div className="nav-container">
            <Link href="/" className="logo">
              <span>🩺</span>
            </Link>
            {session && (
              <>
                <nav className="nav-links">
                  <Link href="/" className="nav-link">
                    ➕ New Case
                  </Link>
                  <Link href="/cases" className="nav-link">
                    📋 Past Cases
                  </Link>
                </nav>
                <div className="user-session">
                  <span className="user-name">
                    Dr. <strong>{session.name}</strong>
                  </span>
                  <LogoutButton />
                </div>
              </>
            )}
          </div>
        </header>
        <main className="container">{children}</main>
      </body>
    </html>
  );
}

// Inline Client Component for Logout to keep layout fast and clean
import LogoutButton from "./LogoutButton";
