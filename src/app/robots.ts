import type { MetadataRoute } from "next";

const SITE_URL = "https://rsvp.webserbisyo.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      allow: "/",
      disallow: ["/admin/", "/dashboard/", "/api/", "/callback", "/reset-password"],
      userAgent: "*",
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
