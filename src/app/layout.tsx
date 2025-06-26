import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TravelBio - Share Your Travel Journey",
  description: "A minimalist social network for travelers to share the countries they've lived in and visited.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-800">
                <a href="/">TravelBio</a>
              </h1>
              <nav className="space-x-4">
                <a href="/" className="text-gray-600 hover:text-gray-800">Home</a>
                <a href="/discover" className="text-gray-600 hover:text-gray-800">Discover</a>
                <a href="/profile" className="text-gray-600 hover:text-gray-800">Profile</a>
              </nav>
            </div>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}