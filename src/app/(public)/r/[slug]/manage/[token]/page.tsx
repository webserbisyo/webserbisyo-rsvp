import type { Metadata } from "next";
import { SOCIAL_PREVIEWS } from "@/config/social-previews";

export const metadata: Metadata = {
  description: SOCIAL_PREVIEWS.neutral.description,
  openGraph: {
    images: [],
  },
  robots: {
    follow: false,
    index: false,
  },
  title: `RSVP Management | ${SOCIAL_PREVIEWS.neutral.title}`,
  twitter: {
    images: [],
  },
};

type ManageRsvpPageProps = {
  params: Promise<{ slug: string; token: string }>;
};

export default async function ManageRsvpPage({ params }: ManageRsvpPageProps) {
  const { slug, token } = await params;

  return (
    <main className="p-6">
      RSVP manage placeholder for {slug} / {token}.
    </main>
  );
}
