import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TravelBio - Share Your Travel Journey",
  description: "A minimalist social network for travelers to share the countries and cities they've lived in and visited.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 dark:bg-gray-950">
        {children}
      </body>
    </html>
  );
}