import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Taught To Teach · ERP",
  description: "School of Music, Art and Dance — management system",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
