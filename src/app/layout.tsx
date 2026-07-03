import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppProviders } from "@/components/layout/app-providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://rsvp.webserbisyo.com"),
  title: {
    default: "WebSerbisyo RSVP",
    template: "%s | WebSerbisyo RSVP",
  },
  description:
    "Premium digital RSVP websites for Filipino couples. Preview your wedding website first before paying.",
  applicationName: "WebSerbisyo RSVP",
  creator: "WebSerbisyo",
  publisher: "WebSerbisyo",
  openGraph: {
    description:
      "Premium digital RSVP websites for Filipino couples. Preview your wedding website first before paying.",
    images: [
      {
        alt: "WebSerbisyo RSVP premium digital RSVP websites",
        height: 630,
        url: "/opengraph-image",
        width: 1200,
      },
    ],
    locale: "en_PH",
    siteName: "WebSerbisyo RSVP",
    title: "WebSerbisyo RSVP",
    type: "website",
    url: "https://rsvp.webserbisyo.com",
  },
  twitter: {
    card: "summary_large_image",
    description:
      "Premium digital RSVP websites for Filipino couples. Preview your wedding website first before paying.",
    images: ["/opengraph-image"],
    title: "WebSerbisyo RSVP",
  },
  icons: {
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
    ],
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#c96b48",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
