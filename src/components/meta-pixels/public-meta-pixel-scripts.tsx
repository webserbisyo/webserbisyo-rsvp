import Script from "next/script";
import type { PublicMetaPixelConfig } from "@/server/queries/public-meta-pixels";

export type MetaPixelEventName =
  | "CompleteRegistration"
  | "Contact"
  | "InitiateCheckout"
  | "Lead"
  | "RSVPSubmitted"
  | "ViewContent";

const META_STANDARD_EVENTS = new Set<MetaPixelEventName>([
  "CompleteRegistration",
  "Contact",
  "InitiateCheckout",
  "Lead",
  "ViewContent",
]);

export type MetaPixelEventParams = Record<string, unknown>;

type PublicMetaPixelScriptsProps = {
  eventName?: MetaPixelEventName | MetaPixelEventName[];
  eventParams?: MetaPixelEventParams;
  eventParamsByName?: Partial<Record<MetaPixelEventName, MetaPixelEventParams>>;
  pixels: PublicMetaPixelConfig[];
};

export function PublicMetaPixelScripts({
  eventName,
  eventParams,
  eventParamsByName,
  pixels,
}: PublicMetaPixelScriptsProps) {
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
        {buildInitScript(uniquePixelIds, eventName, eventParams, eventParamsByName)}
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

function buildInitScript(
  pixelIds: string[],
  eventName: PublicMetaPixelScriptsProps["eventName"],
  eventParams: PublicMetaPixelScriptsProps["eventParams"],
  eventParamsByName: PublicMetaPixelScriptsProps["eventParamsByName"],
) {
  const initLines = pixelIds.map((pixelId) => `fbq('init', ${JSON.stringify(pixelId)});`);
  const eventLines = [`fbq('track', 'PageView');`];
  const names = eventName ? (Array.isArray(eventName) ? eventName : [eventName]) : [];

  for (const name of names) {
    eventLines.push(buildEventLine(name, eventParamsByName?.[name] ?? eventParams));
  }

  return [...initLines, ...eventLines].join("\n");
}

function buildEventLine(name: MetaPixelEventName, eventParams?: MetaPixelEventParams) {
  const method = META_STANDARD_EVENTS.has(name) ? "track" : "trackCustom";
  const sanitizedParams = sanitizeEventParams(eventParams);

  if (sanitizedParams) {
    return `fbq('${method}', ${JSON.stringify(name)}, ${JSON.stringify(sanitizedParams)});`;
  }

  return `fbq('${method}', ${JSON.stringify(name)});`;
}

function sanitizeEventParams(eventParams?: MetaPixelEventParams) {
  if (!eventParams) {
    return null;
  }

  const entries = Object.entries(eventParams).filter((entry): entry is [
    string,
    string | number | boolean | null,
  ] => {
    const value = entry[1];

    return (
      value === null ||
      typeof value === "string" ||
      typeof value === "boolean" ||
      (typeof value === "number" && Number.isFinite(value))
    );
  });

  return entries.length > 0 ? Object.fromEntries(entries) : null;
}

function isNumericPixelId(pixelId: string) {
  return /^\d{5,30}$/.test(pixelId);
}
