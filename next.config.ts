import type { NextConfig } from "next";

const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : null;

const nextConfig: NextConfig = {
  async headers() {
    const sharedHeaders = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-XSS-Protection", value: "1; mode=block" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=()",
      },
    ];

    return [
      {
        source: "/((?!r/[^/]+/rsvp/embed$).*)",
        headers: [
          ...sharedHeaders,
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
      {
        source: "/r/:slug/rsvp/embed",
        headers: [
          ...sharedHeaders,
          {
            key: "Content-Security-Policy",
            value:
              "frame-ancestors 'self' https://rsvp.webserbisyo.com https://*.rsvp.webserbisyo.com http://localhost:3001 http://127.0.0.1:3001",
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: supabaseHostname
      ? [
          {
            hostname: supabaseHostname,
            pathname: "/storage/v1/object/public/**",
            protocol: "https",
          },
        ]
      : [],
  },
};

export default nextConfig;
