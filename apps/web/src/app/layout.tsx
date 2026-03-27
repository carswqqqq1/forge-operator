import type { Metadata } from "next";
import { Cormorant_Garamond, Sora } from "next/font/google";
import "./globals.css";

const sora = Sora({
  variable: "--font-sans",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Forge",
  description: "A premium operator workspace for async AI execution, approvals, replay, and billing.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sora.variable} ${cormorant.variable} h-full antialiased`}>
      <body className="min-h-full bg-[var(--forge-graphite)] text-[var(--forge-cloud)]">{children}</body>
    </html>
  );
}
