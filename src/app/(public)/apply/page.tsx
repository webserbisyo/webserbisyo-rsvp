import type { Metadata } from "next";
import { ApplyLanding } from "@/components/apply/apply-landing";
import { PublicMetaPixelScripts } from "@/components/meta-pixels/public-meta-pixel-scripts";
import { getVersionedSocialImage, SOCIAL_PREVIEWS } from "@/config/social-previews";
import { getPublicApplyConfig } from "@/server/queries/public-apply";
import { getPublicMetaPixelsForRoute } from "@/server/queries/public-meta-pixels";

export const dynamic = "force-dynamic";

const socialPreview = SOCIAL_PREVIEWS.apply;

export const metadata: Metadata = {
  alternates: {
    canonical: "https://rsvp.webserbisyo.com/apply",
  },
  description: socialPreview.description,
  openGraph: {
    description: socialPreview.description,
    images: [
      {
        alt: socialPreview.alt,
        height: 630,
        url: getVersionedSocialImage(socialPreview),
        width: 1200,
      },
    ],
    siteName: "WebSerbisyo RSVP",
    title: socialPreview.title,
    type: "website",
    url: "https://rsvp.webserbisyo.com/apply",
  },
  robots: {
    follow: true,
    index: true,
  },
  title: {
    absolute: socialPreview.title,
  },
  twitter: {
    card: "summary_large_image",
    description: socialPreview.description,
    images: [getVersionedSocialImage(socialPreview)],
    title: socialPreview.title,
  },
};

export default async function ApplyPage() {
  const [config, pixels] = await Promise.all([
    getPublicApplyConfig(),
    getPublicMetaPixelsForRoute({ route: "application" }),
  ]);

  return (
    <>
      <ApplyLanding config={config} />
      <PublicMetaPixelScripts
        eventName="ViewContent"
        eventParams={{
          content_category: "RSVP Website Pricing",
          content_name: "WebSerbisyo RSVP Pricing Plans",
          source_route: "/apply",
        }}
        executionKey="apply"
        pixels={pixels}
      />
    </>
  );
}
