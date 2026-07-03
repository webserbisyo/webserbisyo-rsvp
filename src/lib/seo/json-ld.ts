const SITE_URL = "https://rsvp.webserbisyo.com";

export function getMarketingJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@id": `${SITE_URL}/#organization`,
        "@type": "Organization",
        name: "WebSerbisyo",
        url: SITE_URL,
      },
      {
        "@id": `${SITE_URL}/#website`,
        "@type": "WebSite",
        name: "WebSerbisyo RSVP",
        publisher: {
          "@id": `${SITE_URL}/#organization`,
        },
        url: SITE_URL,
      },
      {
        "@id": `${SITE_URL}/#service`,
        "@type": "Service",
        description: "Premium digital RSVP websites for Filipino couples",
        name: "WebSerbisyo RSVP Website Service",
        offers: [
          {
            "@type": "Offer",
            availability: "https://schema.org/InStock",
            name: "PRO Plan",
            price: "1599",
            priceCurrency: "PHP",
            url: `${SITE_URL}/apply/start?plan=pro`,
          },
          {
            "@type": "Offer",
            availability: "https://schema.org/InStock",
            name: "MAX Plan",
            price: "3599",
            priceCurrency: "PHP",
            url: `${SITE_URL}/apply/start?plan=max`,
          },
        ],
        provider: {
          "@id": `${SITE_URL}/#organization`,
        },
        url: SITE_URL,
      },
    ],
  };
}
