import type { MetadataRoute } from "next";

const SITE_URL = "https://rsvp.webserbisyo.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      changeFrequency: "monthly",
      lastModified,
      priority: 1,
      url: SITE_URL,
    },
    {
      changeFrequency: "monthly",
      lastModified,
      priority: 0.8,
      url: `${SITE_URL}/apply`,
    },
  ];
}
