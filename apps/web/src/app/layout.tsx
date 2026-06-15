import type { Metadata } from "next";
import { Geist, Geist_Mono, Press_Start_2P } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Pixel display font — used by the CORE OS-style boot/loading screens.
// Mirrors core-website's setup so the visual language stays consistent
// across the marketing site and the town app.
const pressStart2P = Press_Start_2P({
  variable: "--font-press-start-2p",
  subsets: ["latin"],
  weight: "400",
});

// metadataBase resolves relative URLs in per-route `generateMetadata`
// (e.g. og:image: "/api/towns/<slug>/postcard.png") to absolute URLs.
// Falls back to localhost during dev when NEXT_PUBLIC_SITE_URL isn't
// configured.
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "core town",
  description: "the CORE town — earn points, grow your memory, climb the leaderboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${pressStart2P.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
