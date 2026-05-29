export default function OfflinePage() {
  return (
    <main
      style={{
        alignItems: "center",
        background:
          "radial-gradient(circle at top, rgba(255,229,208,0.78), transparent 48%), linear-gradient(180deg, #fffdf9 0%, #fffaf4 42%, #fff4ea 100%)",
        color: "#1f1a17",
        display: "grid",
        minHeight: "100svh",
        padding: "28px 18px",
        placeItems: "center",
      }}
    >
      <section
        style={{
          backdropFilter: "blur(14px)",
          background: "rgba(255,255,255,0.92)",
          border: "1px solid rgba(213,187,164,0.42)",
          borderRadius: "30px",
          boxShadow: "0 24px 60px rgba(120,84,58,0.16)",
          padding: "28px 24px 24px",
          textAlign: "center",
          width: "min(100%, 430px)",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            background: "linear-gradient(145deg, #fff7ef 0%, #ffe6d7 100%)",
            border: "1px solid rgba(225,198,174,0.8)",
            borderRadius: "28px",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.88)",
            display: "grid",
            height: "88px",
            margin: "0 auto",
            placeItems: "center",
            position: "relative",
            width: "88px",
          }}
        >
          <div
            style={{
              display: "grid",
              height: "56px",
              placeItems: "center",
              width: "56px",
            }}
          >
            <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="4" y="4" width="48" height="48" rx="16" fill="#FFF4EA" />
              <path
                d="M15 18.5L21.1 37L28 24.2L34.9 37L41 18.5"
                stroke="#C96B48"
                strokeWidth="4.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div
            style={{
              backgroundImage: "url('/icons/icon-192.png')",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              backgroundSize: "cover",
              borderRadius: "18px",
              boxShadow: "0 10px 22px rgba(87,59,39,0.14)",
              inset: "16px",
              position: "absolute",
            }}
          />
          <object
            aria-label="WebSerbisyo RSVP"
            data="/icons/icon-192.png"
            height="56"
            type="image/png"
            width="56"
            style={{
              border: 0,
              clip: "rect(0 0 0 0)",
              height: "1px",
              margin: "-1px",
              overflow: "hidden",
              padding: 0,
              position: "absolute",
              whiteSpace: "nowrap",
              width: "1px",
            }}
          />
        </div>
        <div
          aria-hidden="true"
          style={{
            background: "linear-gradient(180deg, #fce8de 0%, #f9ddcf 100%)",
            borderRadius: "999px",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7)",
            display: "grid",
            height: "58px",
            margin: "18px auto 0",
            placeItems: "center",
            width: "58px",
          }}
        >
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M3.5 9.4C6.47 6.71 10.13 5.25 14 5.25C17.87 5.25 21.53 6.71 24.5 9.4M6.55 13.05C8.77 11.1 11.3 10.12 14 10.12C16.7 10.12 19.23 11.1 21.45 13.05M10.15 16.85C11.23 16.01 12.57 15.56 14 15.56C15.43 15.56 16.77 16.01 17.85 16.85M13.96 21.08H14.04M4.2 4.2L23.8 23.8"
              stroke="#C96B48"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h1
          style={{
            fontSize: "clamp(2rem, 5vw, 2.35rem)",
            fontWeight: 900,
            letterSpacing: "-0.045em",
            lineHeight: 1,
            margin: "18px 0 0",
          }}
        >
          You&apos;re offline
        </h1>
        <p
          style={{
            color: "#78675d",
            fontSize: "0.98rem",
            fontWeight: 600,
            lineHeight: 1.7,
            margin: "14px auto 0",
            maxWidth: "31ch",
          }}
        >
          WebSerbisyo RSVP needs internet to sync your dashboard.
        </p>
        <div style={{ marginTop: "24px" }}>
          <a
            href="/dashboard"
            style={{
              background: "linear-gradient(180deg, #d97a57 0%, #c96b48 100%)",
              borderRadius: "20px",
              boxShadow: "0 18px 30px rgba(201,107,72,0.24)",
              color: "#fff",
              display: "inline-flex",
              fontSize: "0.96rem",
              fontWeight: 800,
              justifyContent: "center",
              letterSpacing: "0.01em",
              minHeight: "52px",
              padding: "14px 18px",
              textDecoration: "none",
              width: "100%",
            }}
          >
            Try again
          </a>
        </div>
        <p
          style={{
            color: "#9a8578",
            fontSize: "0.86rem",
            fontWeight: 600,
            lineHeight: 1.65,
            margin: "14px auto 0",
            maxWidth: "34ch",
          }}
        >
          Your dashboard will reconnect when your internet is back.
        </p>
        <p
          style={{
            color: "#b49a89",
            fontSize: "0.75rem",
            fontWeight: 800,
            letterSpacing: "0.16em",
            margin: "18px 0 0",
            textTransform: "uppercase",
          }}
        >
          WebSerbisyo RSVP
        </p>
      </section>
    </main>
  );
}
