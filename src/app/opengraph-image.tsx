import { ImageResponse } from "next/og";

export const alt = "WebSerbisyo RSVP premium digital RSVP websites";
export const contentType = "image/png";
export const size = {
  height: 630,
  width: 1200,
};

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background:
            "radial-gradient(circle at 82% 18%, rgba(255,138,92,0.24), transparent 28%), radial-gradient(circle at 10% 92%, rgba(234,179,8,0.16), transparent 30%), #050505",
          color: "#fff7ed",
          display: "flex",
          fontFamily: "Arial, Helvetica, sans-serif",
          height: "100%",
          justifyContent: "space-between",
          overflow: "hidden",
          padding: "72px",
          position: "relative",
          width: "100%",
        }}
      >
        <div
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,138,92,0.11) 1px, transparent 1px), linear-gradient(90deg, rgba(255,138,92,0.11) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            bottom: 0,
            left: 0,
            maskImage: "radial-gradient(circle at 50% 50%, black, transparent 74%)",
            opacity: 0.9,
            position: "absolute",
            right: 0,
            top: 0,
          }}
        />
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 690 }}>
          <div
            style={{
              border: "1px solid rgba(255,255,255,0.14)",
              borderRadius: 999,
              color: "#ffb08a",
              display: "flex",
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: 1,
              padding: "12px 22px",
              alignSelf: "flex-start",
            }}
          >
            WEBSERBISYO RSVP
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 76,
              fontWeight: 800,
              letterSpacing: -1,
              lineHeight: 0.96,
              marginTop: 42,
            }}
          >
            <span>Premium digital</span>
            <span>RSVP websites</span>
          </div>
          <div
            style={{
              color: "rgba(255,247,237,0.76)",
              display: "flex",
              fontSize: 34,
              lineHeight: 1.25,
              marginTop: 28,
              maxWidth: 630,
            }}
          >
            For Filipino couples who want a preview-first wedding website process.
          </div>
          <div
            style={{
              background: "linear-gradient(90deg, #ff8a5c, #f59e0b)",
              borderRadius: 999,
              color: "#1c0b05",
              display: "flex",
              fontSize: 30,
              fontWeight: 800,
              marginTop: 46,
              padding: "16px 26px",
              alignSelf: "flex-start",
            }}
          >
            Website muna, bago bayad.
          </div>
        </div>
        <div
          style={{
            alignItems: "center",
            display: "flex",
            height: 486,
            justifyContent: "center",
            position: "relative",
            width: 330,
          }}
        >
          <div
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.16)",
              borderRadius: 44,
              boxShadow: "0 32px 90px rgba(0,0,0,0.45)",
              display: "flex",
              flexDirection: "column",
              height: 466,
              padding: 22,
              width: 286,
            }}
          >
            <div
              style={{
                alignSelf: "center",
                background: "rgba(255,255,255,0.18)",
                borderRadius: 999,
                height: 8,
                marginBottom: 26,
                width: 82,
              }}
            />
            <div
              style={{
                background: "linear-gradient(135deg, rgba(255,138,92,0.95), rgba(234,179,8,0.82))",
                borderRadius: 28,
                display: "flex",
                height: 150,
                width: "100%",
              }}
            />
            <div
              style={{
                color: "#fff7ed",
                display: "flex",
                fontSize: 28,
                fontWeight: 800,
                marginTop: 26,
              }}
            >
              RSVP Preview
            </div>
            <div
              style={{
                background: "rgba(255,255,255,0.16)",
                borderRadius: 999,
                display: "flex",
                height: 12,
                marginTop: 20,
                width: "92%",
              }}
            />
            <div
              style={{
                background: "rgba(255,255,255,0.11)",
                borderRadius: 999,
                display: "flex",
                height: 12,
                marginTop: 14,
                width: "72%",
              }}
            />
            <div
              style={{
                alignItems: "center",
                background: "#ff8a5c",
                borderRadius: 22,
                color: "#180804",
                display: "flex",
                fontSize: 24,
                fontWeight: 800,
                height: 58,
                justifyContent: "center",
                marginTop: "auto",
                width: "100%",
              }}
            >
              Start application
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
