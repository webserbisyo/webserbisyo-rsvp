import { readFile } from "node:fs/promises";
import { ImageResponse } from "next/og";
import { marketingHero } from "@/config/marketing-hero";

export const alt = marketingHero.social.alt;
export const contentType = "image/png";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const size = {
  height: 630,
  width: 1200,
};

export default async function Image() {
  const artwork = await loadArtwork();

  return new ImageResponse(
    <div
      style={{
        background:
          "radial-gradient(circle at 86% 17%, rgba(150,200,255,0.20), transparent 26%), radial-gradient(circle at 75% 85%, rgba(255,90,31,0.20), transparent 32%), linear-gradient(125deg, #050505 0%, #090909 57%, #11100f 100%)",
        color: "#f8f8f8",
        display: "flex",
        height: "100%",
        overflow: "hidden",
        padding: "54px 58px 52px 68px",
        position: "relative",
        width: "100%",
      }}
    >
      <div
        style={{
          background:
            "linear-gradient(135deg, transparent 20%, rgba(234,179,8,0.10) 48%, transparent 70%)",
          bottom: 0,
          display: "flex",
          left: 0,
          opacity: 0.9,
          position: "absolute",
          right: 0,
          top: 0,
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          maxWidth: 650,
          position: "relative",
        }}
      >
        <div style={{ alignItems: "center", display: "flex", gap: 12 }}>
          <div
            style={{
              background: "#ff5a1f",
              borderRadius: 999,
              display: "flex",
              fontSize: 20,
              fontWeight: 800,
              padding: "9px 16px",
            }}
          >
            {marketingHero.promotion.discountLabel}
          </div>
          <div style={{ color: "#f4c857", display: "flex", fontSize: 20, fontWeight: 700 }}>
            {marketingHero.promotion.offerLabel}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: -0.4,
            marginTop: 37,
          }}
        >
          {marketingHero.brand}
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 58,
            fontWeight: 800,
            letterSpacing: -2.4,
            lineHeight: 1.02,
            marginTop: 14,
            maxWidth: 625,
          }}
        >
          {marketingHero.headline}
        </div>

        <div
          style={{
            borderLeft: "4px solid #ff5a1f",
            display: "flex",
            flexDirection: "column",
            marginTop: 26,
            paddingLeft: 18,
          }}
        >
          <div style={{ display: "flex", fontSize: 27, fontWeight: 800 }}>
            {marketingHero.trust.title} {marketingHero.trust.emoji}
          </div>
          <div
            style={{
              color: "rgba(248,248,248,0.78)",
              display: "flex",
              fontSize: 21,
              marginTop: 8,
            }}
          >
            {marketingHero.trust.description}
          </div>
        </div>

        <div
          style={{
            color: "rgba(248,248,248,0.62)",
            display: "flex",
            fontSize: 18,
            fontWeight: 600,
            marginTop: 28,
          }}
        >
          {marketingHero.social.valueLine}
        </div>
      </div>

      <div
        style={{
          alignItems: "center",
          display: "flex",
          height: 570,
          justifyContent: "center",
          position: "absolute",
          right: 24,
          top: 35,
          width: 425,
        }}
      >
        <div
          style={{
            background: "rgba(255,90,31,0.20)",
            borderRadius: 999,
            filter: "blur(44px)",
            height: 380,
            position: "absolute",
            width: 330,
          }}
        />
        <img
          alt=""
          height="520"
          src={artwork}
          style={{
            display: "flex",
            height: 520,
            objectFit: "contain",
            position: "relative",
            width: 416,
          }}
          width="416"
        />
      </div>
    </div>,
    size,
  );
}

async function loadArtwork() {
  const imageBuffer = await readFile(
    new URL("../../../public/images/landing/rsvp-og-artwork.png", import.meta.url),
  );
  return `data:image/png;base64,${imageBuffer.toString("base64")}`;
}
