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
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: "24px", height: "24px" }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
              </svg>
            </Link>
            {session && (
              <>
                <nav className="nav-links">
                  <Link href="/" className="nav-link">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: "18px", height: "18px" }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    New Case
                  </Link>
                  <Link href="/cases" className="nav-link">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: "18px", height: "18px" }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801-1c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.03 0 1.9.732 2.076 1.704m-5.82 0a2.23 2.23 0 0 0 2.245-2.245v-.018c0-.077-.008-.153-.024-.227M4.5 19.5h15V6a2.25 2.25 0 0 0-2.25-2.25h-10.5A2.25 2.25 0 0 0 4.5 6v13.5Z" />
                    </svg>
                    Past Cases
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
