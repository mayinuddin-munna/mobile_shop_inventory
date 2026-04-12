import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Telecom Store Inventory",
  description: "Inventory management app for a telecom store"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <div className="page-shell header-inner">
            <Link href="/" className="logo">
              Telecom Inventory
            </Link>
            <nav className="nav-links">
              <Link href="/">Inventory</Link>
              <Link href="/dashboard">Dashboard</Link>
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
