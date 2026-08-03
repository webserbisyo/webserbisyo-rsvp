import { readFile } from "node:fs/promises";
import { ImageResponse } from "next/og";
import { SOCIAL_PREVIEWS } from "@/config/social-previews";

const size = {
  height: 630,
  width: 1200,
};

export async function createEventFallbackImage() {
  const artwork = await loadWeddingArtwork();
  const preview = SOCIAL_PREVIEWS.eventFallback;

  return new ImageResponse(
    <div
      style={{
        background:
          "radial-gradient(circle at 84% 16%, rgba(216,172,101,0.24), transparent 28%), radial-gradient(circle at 13% 88%, rgba(122,78,55,0.20), transparent 31%), linear-gradient(135deg, #15100e 0%, #0b0908 58%, #19130f 100%)",
        color: "#fffaf2",
        display: "flex",
        height: "100%",
        overflow: "hidden",
        padding: "62px 68px",
        position: "relative",
        width: "100%",
      }}
    >
      <div
        style={{
          border: "1px solid rgba(230,202,154,0.18)",
          borderRadius: 999,
          color: "#e6ca9a",
          display: "flex",
          fontSize: 24,
          fontWeight: 700,
          padding: "10px 18px",
          position: "absolute",
          top: 60,
        }}
      >
        WebSerbisyo RSVP
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          maxWidth: 610,
          paddingTop: 130,
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: 58,
            fontWeight: 800,
            letterSpacing: -2,
            lineHeight: 1.03,
          }}
        >
          {preview.headline}
        </div>
        <div
          style={{
            color: "rgba(255,250,242,0.76)",
            display: "flex",
            fontSize: 25,
            lineHeight: 1.35,
            marginTop: 28,
            maxWidth: 560,
          }}
        >
          {preview.valueLine}
        </div>
        <div
          style={{
            color: "#e6ca9a",
            display: "flex",
            fontSize: 20,
            fontWeight: 700,
            marginTop: 38,
          }}
        >
          Beautifully organized for every guest.
        </div>
      </div>
      <div
        style={{
          alignItems: "center",
          display: "flex",
          height: 560,
          justifyContent: "center",
          position: "absolute",
          right: 25,
          top: 36,
          width: 430,
        }}
      >
        <div
          style={{
            background: "rgba(217,175,105,0.22)",
            borderRadius: 999,
            filter: "blur(44px)",
            height: 370,
            position: "absolute",
            width: 330,
          }}
        />
        {/* next/og renders standard image elements and does not support next/image. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
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

async function loadWeddingArtwork() {
  const imageBuffer = await readFile(
    new URL("../../../public/images/landing/rsvp-og-artwork.png", import.meta.url),
  );
  return `data:image/png;base64,${imageBuffer.toString("base64")}`;
}
