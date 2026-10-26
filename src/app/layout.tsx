import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cavrix Cloud • Enterprise Cloud Hosting & Management Console",
  description: "Enterprise management, bot gateway, and AI-augmented technical support console for Cavrix Cloud.",
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
