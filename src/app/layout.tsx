import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nexra - League of Legends Stats Tracker",
  description: "Track your League of Legends stats and recent games",
  icons: {
    icon: [
      { url: "/nexra-ico.ico", sizes: "any" },
      { url: "/nexra-logo.png", type: "image/png" },
    ],
    apple: "/nexra-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
