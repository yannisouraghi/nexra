import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  title: "Nexra - AI-Powered League of Legends Coach",
  description: "Advanced AI coaching for League of Legends. Record your games, get personalized analysis, and climb the ranks.",
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
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
