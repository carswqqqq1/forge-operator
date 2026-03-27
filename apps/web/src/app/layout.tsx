import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
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
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${cormorant.variable} h-full antialiased`}
      style={{ colorScheme: "light", backgroundColor: "#f7f5f1" }}
    >
      <body className="min-h-full bg-[var(--forge-bg)] text-[var(--forge-ink)]">{children}</body>
    </html>
  );
}
