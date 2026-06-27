import "./globals.css";

export const metadata = {
  title: "MobilePoint Inventory",
  description: "Mobile shop inventory, POS, supplier, and customer management system."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
