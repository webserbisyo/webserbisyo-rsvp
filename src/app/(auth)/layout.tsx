import type { Metadata } from "next";
import { SOCIAL_PREVIEWS } from "@/config/social-previews";
import { AuthProviders } from "@/components/auth/auth-providers";

export const metadata: Metadata = {
  description: SOCIAL_PREVIEWS.neutral.description,
  openGraph: {
    images: [],
  },
  robots: {
    follow: false,
    index: false,
  },
  title: {
    default: SOCIAL_PREVIEWS.neutral.title,
    template: `%s | ${SOCIAL_PREVIEWS.neutral.title}`,
  },
  twitter: {
    images: [],
  },
};

export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <AuthProviders>{children}</AuthProviders>;
}
