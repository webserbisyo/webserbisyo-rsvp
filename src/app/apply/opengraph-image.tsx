import { ImageResponse } from "next/og";
import { APPLY_SOCIAL_PRICING, SOCIAL_PREVIEWS } from "@/config/social-previews";

const socialPreview = SOCIAL_PREVIEWS.apply;

export const alt = socialPreview.alt;
export const contentType = "image/png";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const size = {
  height: 630,
  width: 1200,
};

export default function Image() {
  const { max, pro, promotion } = APPLY_SOCIAL_PRICING;

  return new ImageResponse(
    <div
      style={{
        background:
          "radial-gradient(circle at 86% 18%, rgba(255,138,92,0.22), transparent 25%), radial-gradient(circle at 15% 88%, rgba(234,179,8,0.12), transparent 32%), #050505",
        color: "#f8f8f8",
        display: "flex",
        height: "100%",
        overflow: "hidden",
        padding: "54px 68px",
        position: "relative",
        width: "100%",
      }}
    >
      <div
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,138,92,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,138,92,0.08) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          bottom: 0,
          display: "flex",
          left: 0,
          opacity: 0.5,
          position: "absolute",
          right: 0,
          top: 0,
        }}
      />

      <div
        style={{ display: "flex", flexDirection: "column", maxWidth: 570, position: "relative" }}
      >
        <div style={{ color: "#f8f8f8", display: "flex", fontSize: 28, fontWeight: 700 }}>
          WebSerbisyo RSVP
        </div>
        {promotion.isActive ? (
          <div style={{ alignItems: "center", display: "flex", gap: 10, marginTop: 24 }}>
            <div
              style={{
                background: "#ff5a1f",
                borderRadius: 999,
                display: "flex",
                fontSize: 21,
                fontWeight: 800,
                padding: "9px 16px",
              }}
            >
              {promotion.discountLabel}
            </div>
            <div style={{ color: "#f4c857", display: "flex", fontSize: 21, fontWeight: 700 }}>
              {promotion.offerLabel}
            </div>
          </div>
        ) : null}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: 58,
            fontWeight: 800,
            letterSpacing: -2,
            lineHeight: 1.02,
            marginTop: promotion.isActive ? 30 : 42,
          }}
        >
          <span>{socialPreview.headline}</span>
          <span style={{ color: "#ff9a73", display: "flex", fontSize: 40, marginTop: 6 }}>
            {socialPreview.valueLine}
          </span>
        </div>
        <div
          style={{
            borderLeft: "4px solid #ff5a1f",
            display: "flex",
            fontSize: 25,
            fontWeight: 800,
            marginTop: 30,
            paddingLeft: 16,
          }}
        >
          {socialPreview.trustLine}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 18,
          position: "absolute",
          right: 62,
          top: 144,
        }}
      >
        {[pro, max].map((plan, index) => (
          <div
            key={plan.name}
            style={{
              background:
                index === 1
                  ? "linear-gradient(160deg, rgba(255,138,92,0.23), rgba(255,255,255,0.06))"
                  : "rgba(255,255,255,0.055)",
              border:
                index === 1
                  ? "1px solid rgba(255,138,92,0.48)"
                  : "1px solid rgba(255,255,255,0.14)",
              borderRadius: 24,
              display: "flex",
              flexDirection: "column",
              height: 310,
              padding: "26px 24px",
              width: 220,
            }}
          >
            <div
              style={{
                color: index === 1 ? "#ffb08a" : "#f8f8f8",
                display: "flex",
                fontSize: 30,
                fontWeight: 800,
              }}
            >
              {plan.name}
            </div>
            <div
              style={{
                color: "rgba(248,248,248,0.65)",
                display: "flex",
                fontSize: 17,
                lineHeight: 1.25,
                marginTop: 16,
              }}
            >
              {plan.description}
            </div>
            <div style={{ alignItems: "baseline", display: "flex", gap: 10, marginTop: "auto" }}>
              <div style={{ color: "#ffffff", display: "flex", fontSize: 35, fontWeight: 800 }}>
                {plan.priceLabel}
              </div>
              <div
                style={{
                  color: "rgba(248,248,248,0.42)",
                  display: "flex",
                  fontSize: 16,
                  textDecoration: "line-through",
                }}
              >
                {plan.regularPriceLabel}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>,
    size,
  );
}
