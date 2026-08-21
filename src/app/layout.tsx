import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppProviders } from "@/components/layout/app-providers";
import { SOCIAL_PREVIEWS } from "@/config/social-previews";
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
  description: SOCIAL_PREVIEWS.neutral.description,
  applicationName: "WebSerbisyo RSVP",
  creator: "WebSerbisyo",
  publisher: "WebSerbisyo",
  icons: {
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
    ],
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "WebSerbisyo RSVP",
  },
};

export const viewport: Viewport = {
  themeColor: "#c96b48",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full bg-[#fffaf4] text-stone-900 antialiased`}
      style={{ backgroundColor: "#fffaf4" }}
    >
      <body
        className="min-h-full bg-[#fffaf4] text-stone-900"
        style={{ backgroundColor: "#fffaf4" }}
      >
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
