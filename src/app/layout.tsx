import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Apex Cloud • VPS Hosting Discord Bot & Enterprise Management Dashboard",
  description: "Enterprise management and AI-augmented technical support dashboard for VPS hosting Discord communities.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-foreground antialiased selection:bg-accent selection:text-black">
        {children}
      </body>
    </html>
  );
}
