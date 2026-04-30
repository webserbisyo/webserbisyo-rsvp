import Script from "next/script";
import type { PublicMetaPixelConfig } from "@/server/queries/public-meta-pixels";

type PublicMetaPixelScriptsProps = {
  eventName?: "Lead" | "ViewContent" | "CompleteRegistration" | "RSVPSubmitted";
  pixels: PublicMetaPixelConfig[];
};

export function PublicMetaPixelScripts({ eventName, pixels }: PublicMetaPixelScriptsProps) {
  const uniquePixelIds = Array.from(new Set(pixels.map((pixel) => pixel.pixelId))).filter(
    isNumericPixelId,
  );

  if (uniquePixelIds.length === 0) {
    return null;
  }

  return (
    <>
      <Script id="meta-pixel-base" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
        `}
      </Script>
      <Script id={`meta-pixel-init-${uniquePixelIds.join("-")}`} strategy="afterInteractive">
        {buildInitScript(uniquePixelIds, eventName)}
      </Script>
      <noscript>
        {uniquePixelIds.map((pixelId) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={pixelId}
            alt=""
            height="1"
            width="1"
            style={{ display: "none" }}
            src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
          />
        ))}
      </noscript>
    </>
  );
}

function buildInitScript(pixelIds: string[], eventName: PublicMetaPixelScriptsProps["eventName"]) {
  const initLines = pixelIds.map((pixelId) => `fbq('init', ${JSON.stringify(pixelId)});`);
  const eventLines = [`fbq('track', 'PageView');`];

  if (eventName) {
    const method = eventName === "RSVPSubmitted" ? "trackCustom" : "track";

    eventLines.push(`fbq('${method}', ${JSON.stringify(eventName)});`);
  }

  return [...initLines, ...eventLines].join("\n");
}

function isNumericPixelId(pixelId: string) {
  return /^\d{5,30}$/.test(pixelId);
}
