import "@/lib/env"; // validate environment on startup
import type { Metadata } from "next";
import { DM_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans" });
const ibmPlexMono = IBM_Plex_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-ibm-plex-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://managedad.com"),
  title: {
    default: "ManagedAd — AI-Powered Ad Management Platform",
    template: "%s | ManagedAd",
  },
  description:
    "Automate 90% of your paid advertising. AI agents handle Google Ads, Meta, LinkedIn & TikTok — optimizing bids, killing waste, and scaling winners autonomously.",
  keywords: [
    "AI ad management", "Google Ads automation", "Meta Ads optimization",
    "performance marketing SaaS", "negative keyword mining", "click fraud detection",
    "ROAS optimization", "ad budget optimization", "India ad management",
  ],
  authors: [{ name: "ManagedAd", url: "https://managedad.com" }],
  creator: "Big Bold Technologies",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://managedad.com",
    siteName: "ManagedAd",
    title: "ManagedAd — AI-Powered Ad Management Platform",
    description: "Automate 90% of your paid advertising. AI agents handle Google Ads and Meta — optimizing bids, killing waste, and scaling winners autonomously.",
  },
  twitter: {
    card: "summary_large_image",
    title: "ManagedAd — AI-Powered Ad Management",
    description: "Automate 90% of your paid advertising with autonomous AI optimization.",
  },
  robots: { index: true, follow: true },
  alternates: { canonical: "https://managedad.com" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${dmSans.variable} ${ibmPlexMono.variable} ${dmSans.className}`}
      >
        {children}
      </body>
    </html>
  );
}
