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
export type MetaPixelEventOptions = Record<string, unknown>;

type PublicMetaPixelScriptsProps = {
  eventName?: MetaPixelEventName | MetaPixelEventName[];
  eventOptions?: MetaPixelEventOptions;
  eventOptionsByName?: Partial<Record<MetaPixelEventName, MetaPixelEventOptions>>;
  eventParams?: MetaPixelEventParams;
  eventParamsByName?: Partial<Record<MetaPixelEventName, MetaPixelEventParams>>;
  executionKey?: string;
  pixels: PublicMetaPixelConfig[];
};

export function PublicMetaPixelScripts({
  eventName,
  eventOptions,
  eventOptionsByName,
  eventParams,
  eventParamsByName,
  executionKey,
  pixels,
}: PublicMetaPixelScriptsProps) {
  const uniquePixelIds = Array.from(new Set(pixels.map((pixel) => pixel.pixelId))).filter(
    isNumericPixelId,
  );

  if (uniquePixelIds.length === 0) {
    return null;
  }

  const eventScript = buildEventScript(
    uniquePixelIds,
    eventName,
    eventParams,
    eventParamsByName,
    eventOptions,
    eventOptionsByName,
  );
  const eventScriptId = buildEventScriptId(uniquePixelIds, eventScript, executionKey);

  return (
    <>
      <Script id="meta-pixel-base" strategy="afterInteractive">
        {buildBootstrapScript()}
      </Script>
      <Script id={eventScriptId} strategy="afterInteractive">
        {eventScript}
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

function buildEventScript(
  pixelIds: string[],
  eventName: PublicMetaPixelScriptsProps["eventName"],
  eventParams: PublicMetaPixelScriptsProps["eventParams"],
  eventParamsByName: PublicMetaPixelScriptsProps["eventParamsByName"],
  eventOptions: PublicMetaPixelScriptsProps["eventOptions"],
  eventOptionsByName: PublicMetaPixelScriptsProps["eventOptionsByName"],
) {
  const initLines = [
    buildBootstrapScript(),
    `window.__wsMetaPixelInitialized = window.__wsMetaPixelInitialized || {};`,
    ...pixelIds.map((pixelId) => {
      const id = JSON.stringify(pixelId);
      return `if (!window.__wsMetaPixelInitialized[${id}]) { fbq('init', ${id}); window.__wsMetaPixelInitialized[${id}] = true; }`;
    }),
  ];
  const eventLines = [`fbq('track', 'PageView');`];
  const names = eventName ? (Array.isArray(eventName) ? eventName : [eventName]) : [];

  for (const name of names) {
    eventLines.push(
      buildEventLine(
        name,
        eventParamsByName?.[name] ?? eventParams,
        eventOptionsByName?.[name] ?? eventOptions,
      ),
    );
  }

  return [...initLines, ...eventLines].join("\n");
}

function buildBootstrapScript() {
  return `
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
  `;
}

function buildEventScriptId(pixelIds: string[], eventScript: string, executionKey?: string) {
  const key = sanitizeScriptKey(executionKey) ?? hashString(eventScript);
  return `meta-pixel-events-${pixelIds.join("-")}-${key}`;
}

function buildEventLine(
  name: MetaPixelEventName,
  eventParams?: MetaPixelEventParams,
  eventOptions?: MetaPixelEventOptions,
) {
  const method = META_STANDARD_EVENTS.has(name) ? "track" : "trackCustom";
  const sanitizedParams = sanitizeEventParams(eventParams);
  const sanitizedOptions = sanitizeEventOptions(eventOptions);

  if (sanitizedOptions) {
    return `fbq('${method}', ${JSON.stringify(name)}, ${JSON.stringify(
      sanitizedParams ?? {},
    )}, ${JSON.stringify(sanitizedOptions)});`;
  }

  if (sanitizedParams) {
    return `fbq('${method}', ${JSON.stringify(name)}, ${JSON.stringify(sanitizedParams)});`;
  }

  return `fbq('${method}', ${JSON.stringify(name)});`;
}

function sanitizeEventParams(eventParams?: MetaPixelEventParams) {
  if (!eventParams) {
    return null;
  }

  const entries = Object.entries(eventParams).filter(
    (entry): entry is [string, string | number | boolean | null] => {
      const value = entry[1];

      return (
        value === null ||
        typeof value === "string" ||
        typeof value === "boolean" ||
        (typeof value === "number" && Number.isFinite(value))
      );
    },
  );

  return entries.length > 0 ? Object.fromEntries(entries) : null;
}

function sanitizeEventOptions(eventOptions?: MetaPixelEventOptions) {
  return sanitizeEventParams(eventOptions);
}

function isNumericPixelId(pixelId: string) {
  return /^\d{5,30}$/.test(pixelId);
}

function sanitizeScriptKey(value?: string) {
  const sanitized = value
    ?.trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return sanitized || null;
}

function hashString(value: string) {
  let hash = 5381;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33) ^ value.charCodeAt(index);
  }

  return (hash >>> 0).toString(36);
}
