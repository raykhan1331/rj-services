import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { ChatWidgetProvider } from "@/components/chat/ChatWidgetContext";
import ChatWidget from "@/components/chat/ChatWidget";
import { SITE_URL, SITE_NAME, DEFAULT_KEYWORDS } from "@/lib/seo";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const DEFAULT_DESCRIPTION =
  "RJ Services helps entrepreneurs and businesses across the UK and Pakistan with UK company formation, virtual addresses, bank account assistance, KYC support, eBay and Shopify stores, AdSense, digital marketing, and business finance introductions.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — UK Company Formation, Banking & Business Setup`,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  keywords: DEFAULT_KEYWORDS,
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
  // Search Console (SEO Agent Step 3) requires proving ownership of the
  // property before the API can be used. Setting GOOGLE_SITE_VERIFICATION
  // to the meta-tag value Search Console gives you (Settings > Ownership
  // verification > HTML tag) is the easiest method for a vercel.app
  // subdomain, since domain/DNS verification isn't possible without
  // owning the whole domain. Omitted entirely when unset.
  ...(process.env.GOOGLE_SITE_VERIFICATION
    ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } }
    : {}),
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `${SITE_NAME} — UK Company Formation, Banking & Business Setup`,
    description: DEFAULT_DESCRIPTION,
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — UK Company Formation, Banking & Business Setup`,
    description: DEFAULT_DESCRIPTION,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased scroll-smooth`}
    >
      <body className="min-h-full flex flex-col">
        <ChatWidgetProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <ChatWidget />
        </ChatWidgetProvider>
      </body>
    </html>
  );
}
