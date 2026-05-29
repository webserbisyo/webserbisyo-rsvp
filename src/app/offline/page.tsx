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
            width: "88px",
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
          aria-hidden="true"
          style={{
            background: "#fde8df",
            borderRadius: "999px",
            display: "grid",
            height: "52px",
            margin: "18px auto 0",
            placeItems: "center",
            width: "52px",
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M2 8.82C4.88 6.41 8.31 5 12 5C14.33 5 16.56 5.56 18.54 6.56M22 12C22 13.88 21.64 15.68 20.97 17.32M17.08 20.74C15.54 21.54 13.79 22 12 22C8.62 22 5.46 20.37 3.45 17.61M2 2L22 22"
              stroke="#C96B48"
              strokeWidth="2.2"
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
