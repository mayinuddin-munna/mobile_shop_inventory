import type { Metadata } from "next";
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
      <body>{children}</body>
    </html>
  );
}
