import type { Metadata } from "next";
import { ApplyLanding } from "@/components/apply/apply-landing";
import { PublicMetaPixelScripts } from "@/components/meta-pixels/public-meta-pixel-scripts";
import { getPublicApplyConfig } from "@/server/queries/public-apply";
import { getPublicMetaPixelsForRoute } from "@/server/queries/public-meta-pixels";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  alternates: {
    canonical: "https://rsvp.webserbisyo.com/apply",
  },
  description:
    "Choose your WebSerbisyo RSVP package. Start with PRO or upgrade to MAX for a more premium digital wedding RSVP website experience.",
  openGraph: {
    description:
      "Choose your WebSerbisyo RSVP package. Start with PRO or upgrade to MAX for a more premium digital wedding RSVP website experience.",
    images: [
      {
        alt: "WebSerbisyo RSVP premium digital RSVP websites",
        height: 630,
        url: "/opengraph-image",
        width: 1200,
      },
    ],
    siteName: "WebSerbisyo RSVP",
    title: "Pricing Plans | WebSerbisyo RSVP",
    type: "website",
    url: "https://rsvp.webserbisyo.com/apply",
  },
  robots: {
    follow: true,
    index: true,
  },
  title: {
    absolute: "Pricing Plans | WebSerbisyo RSVP",
  },
  twitter: {
    card: "summary_large_image",
    description:
      "Choose your WebSerbisyo RSVP package. Start with PRO or upgrade to MAX for a more premium digital wedding RSVP website experience.",
    images: ["/opengraph-image"],
    title: "Pricing Plans | WebSerbisyo RSVP",
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
        pixels={pixels}
      />
    </>
  );
}
