---
description: Security, rate limiting, CAPTCHA, headers, and sanitization rules for WebSerbisyo RSVP
globs:
  ["src/proxy.ts", "src/lib/**/*.ts", "src/server/**/*.ts", "src/app/api/**/*.ts", "next.config.ts"]
alwaysApply: false
---

# Security Rules - WebSerbisyo RSVP

Verified against official/package docs as of 2026-04-27.

Use installed `package.json` / `package-lock.json` as source of truth. Do not install security dependencies blindly. Add security tooling when the current MVP phase needs it.

Current package references:

```txt
@upstash/ratelimit: 2.0.x
@upstash/redis: 1.37.x
@marsidev/react-turnstile: 1.5.x
isomorphic-dompurify: 3.10.x
dompurify: 3.2.4+ minimum for CVE-2025-26791
```

---

## 1. RSVP MVP Security Priority

Current priority:

```txt
1. No secrets in client code
2. Scaffold-safe proxy without hiding real production requirements
3. Supabase auth and RLS planning
4. Server-side validation for all external input
5. Service-role isolation with server-only
6. Public form protection before ads/production
7. Basic security headers before deployment
```

Do not overbuild security infrastructure before the endpoint exists.

---

## 2. Current Phase Rules

During scaffold/admin-first development:

Allowed now:

- Env validation helpers
- Server-only secret boundaries
- Supabase auth/permission checks
- RLS planning
- Safe proxy behavior
- Server Action validation
- Basic headers

Defer until public endpoints are real:

- Upstash rate limiting
- Cloudflare Turnstile
- DOMPurify HTML sanitization
- Strict nonce-based CSP
- Bot protection tuning
- Public RSVP abuse controls
- Upload/media security

---

## 3. Environment Variable Security

Public env vars may be exposed to the browser:

```env
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
```

Server-only env vars must never use `NEXT_PUBLIC_`:

```env
SUPABASE_SECRET_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
RESEND_FROM_EMAIL=
TURNSTILE_SECRET_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
META_ACCESS_TOKEN=
META_PIXEL_ID=
```

Rules:

- Never commit `.env.local`.
- Never expose service-role/secret keys to client components.
- Prefer new Supabase publishable/secret key names, but keep legacy anon/service-role fallback if the project still uses them.
- Use `server-only` in files that read secrets.

---

## 4. Server-Only Boundary

Any file that uses secrets or service-role Supabase must start with:

```ts
import "server-only";
```

Use server-only for:

```txt
Supabase admin client
tenant/client provisioning
manual payment confirmation
audit log writer
email sender
Meta CAPI sender
Turnstile verification
Upstash server limiter
```

Never import these files into Client Components.

---

## 5. Input Validation

All external input must be validated server-side.

External input includes:

```txt
application form
admin approval forms
login/signup forms
public API bodies
query params
event slugs
Meta Pixel settings
future RSVP responses
future guestbook messages
future gift wallet settings
```

Rules:

- Use Zod for validation.
- Normalize email/phone/name on the server.
- Do not insert raw FormData into database.
- Do not trust hidden fields for price, plan, role, client ID, payment status, or approval status.
- Do not expose raw database errors to public users.
- Return generic public errors and log detailed internal errors.

---

## 6. Supabase and RLS Security

Supabase is the canonical backend.

Rules:

- Enable RLS for tenant/client data.
- Platform admin access must be checked server-side.
- Client users must only access their own client/event records.
- Public insert policies must be narrow and paired with server validation/rate limits.
- Service-role client bypasses RLS and must only live in server-only services.
- Proxy route checks are not enough.
- Server Actions, services, queries, and RLS must also enforce access.

Never use `getSession()` as server authorization truth. Use `getClaims()` or `getUser()` as defined in `030-supabase-ssr.md`.

---

## 7. Proxy Security

Use `src/proxy.ts`, not `middleware.ts`.

Rules:

- Keep proxy lightweight.
- Use it for auth/session boundary and redirects.
- Do not put business workflows in proxy.
- Do not rely on proxy as the only security layer.
- It may temporarily bypass auth when `RSVP_AUTH_GUARD_ENABLED=false` for scaffold testing.
- Production must enable real auth guards and permissions.

---

## 8. Rate Limiting

Do not add Upstash until public write endpoints exist or production ads/traffic are near.

When approved:

```bash
npm install @upstash/ratelimit @upstash/redis
```

Recommended initial limits:

```txt
/apply submission: 3-5 per hour per IP/email
auth attempts: 10 per 15 minutes per IP/email
public RSVP submit later: 5-10 per hour per IP/event
public API read later: 60-100 per minute per IP
admin/client authenticated routes: usually no aggressive IP limit at first
```

Use route-level/server-action limiting first. Avoid putting all rate limits in proxy unless needed.

Pattern:

```ts
import "server-only";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

export const applicationLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 h"),
  analytics: true,
  prefix: "rsvp:apply",
});
```

Rules:

- Key limits by IP plus stable context where possible.
- For public forms, consider IP + normalized email.
- Return 429 with a generic message.
- Do not leak whether an email/account exists.
- Document new limits in `PROJECT_STATUS.md`.

---

## 9. Cloudflare Turnstile

Turnstile is deferred until public forms are close to production or spam risk appears.

When approved:

```bash
npm install @marsidev/react-turnstile
```

Use it for:

```txt
/apply before FB ads or public launch
future public RSVP submit if abused
future guestbook submit if abused
```

Rules:

- Client widget alone is not security.
- Always verify token server-side through Siteverify.
- Tokens are single-use.
- Tokens expire after 300 seconds.
- Keep `TURNSTILE_SECRET_KEY` server-only.
- Do not block scaffold/admin development on Turnstile.

Server verification pattern:

```ts
import "server-only";

type TurnstileResponse = {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  "error-codes"?: string[];
};

export async function verifyTurnstile(token: string, remoteIp?: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!secret) {
    throw new Error("Missing TURNSTILE_SECRET_KEY.");
  }

  const body = new URLSearchParams({
    secret,
    response: token,
  });

  if (remoteIp) {
    body.set("remoteip", remoteIp);
  }

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const data = (await response.json()) as TurnstileResponse;
  return data.success === true;
}
```

---

## 10. Security Headers

Add basic headers before deployment.

Minimal safe baseline in `next.config.ts`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
```

Rules:

- Do not add a strict CSP too early if it breaks Next dev, shadcn, fonts, or Meta Pixel work.
- Add CSP intentionally when deployment surface is known.
- If Turnstile is enabled, allow Cloudflare challenge domains.
- If Meta Pixel is enabled, CSP must account for Meta scripts/connect/image domains.
- If Supabase Realtime is enabled later, allow `wss://*.supabase.co`.

---

## 11. CSP Strategy

For MVP:

```txt
Stage 1: Basic security headers
Stage 2: Report-only CSP if needed
Stage 3: Enforced CSP after scripts/integrations stabilize
Stage 4: Nonce-based CSP only if worth the complexity
```

Do not add nonce-based CSP during scaffold unless explicitly approved.

Static CSP must account for actual integrations only:

```txt
Supabase
Resend has no browser domain requirement
Turnstile, if enabled
Meta Pixel, if enabled
Vercel analytics, if enabled
Fonts, if external fonts are used
```

Avoid broad domains and avoid copying Cloudinary rules unless Cloudinary is actually used in RSVP.

---

## 12. HTML Sanitization

Do not install DOMPurify unless user-generated rich HTML is allowed.

For current admin-first MVP:

```txt
Prefer plain text fields.
Render text as text, not HTML.
Avoid dangerouslySetInnerHTML.
```

Use sanitization only when future features allow rich HTML:

```txt
event story rich text
guestbook rich text
custom page sections with HTML
email template HTML from user input
```

When approved:

```bash
npm install isomorphic-dompurify
```

Rules:

- Use DOMPurify `3.2.4+` minimum.
- Prefer latest `isomorphic-dompurify`.
- Sanitize server-side before storing or before rendering.
- Validate URLs separately.
- Avoid `SAFE_FOR_TEMPLATES` unless reviewed.

---

## 13. URL and Redirect Safety

Rules:

- Validate `next` redirect paths.
- Allow only relative internal paths unless external redirect is explicitly approved.
- Do not trust user-submitted URLs.
- For URLs, allow only `https:` unless `mailto:` is explicitly needed.
- Never redirect to arbitrary user-provided domains.

Pattern:

```ts
export function safeRedirectPath(value: string | null, fallback = "/") {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  return value;
}
```

---

## 14. Public API Security

For public API routes:

```txt
/api/public/events/[eventSlug]/*
```

Rules:

- Return published/public data only.
- Validate `eventSlug`.
- Do not expose admin/client dashboard fields.
- Do not expose internal IDs unless needed.
- Rate limit write endpoints.
- Add Turnstile for high-abuse public writes if needed.
- Use edit tokens for future RSVP update/cancel.
- Log suspicious failures only at a safe level.

---

## 15. Payments and Manual Approval

V1 has manual one-time package payment confirmation.

Rules:

- Users cannot set their own payment status.
- Payment status changes require platform admin permission.
- Store `paid_at`, `amount_paid`, `payment_method`, `reference_number`, and hosting/access coverage dates.
- Write audit logs for payment/approval changes.
- Do not implement payment gateways yet.
- Do not implement subscriptions/downpayments yet.
- Do not trust Meta CAPI Purchase as payment truth.

---

## 16. Meta Pixel / CAPI Security

Meta Pixel is allowed for service landing/application funnel.

Rules:

- Pixel ID can be public.
- Access token must be server-only.
- CAPI Purchase on manual paid approval must be non-blocking.
- Do not fail approval if Meta CAPI fails.
- Do not log sensitive personal data in plain text.
- Hash user data as required by Meta CAPI implementation rules when added.

---

## 17. Dependency Security

Before deployment:

```bash
npm outdated
npm audit
npm run lint
npm run typecheck
npm run build
```

Rules:

- Patch Next.js, React, Supabase, and DOMPurify-related advisories quickly.
- Do not pin known vulnerable versions.
- Document security-driven package updates in `PROJECT_STATUS.md`.
- Do not upgrade major packages without reading official release notes.

---

## 18. Anti-Patterns

Avoid:

```txt
committing .env.local
NEXT_PUBLIC_ service keys
service-role Supabase in client code
auth based only on UI hiding
proxy-only security
getSession() for server authorization
raw FormData inserts
raw database errors shown to users
unvalidated redirect URLs
public write endpoints without validation
public write endpoints without rate limiting before production
Turnstile without server-side Siteverify
strict CSP copied from another app without testing
Cloudinary/photo-upload rules before upload feature exists
dangerouslySetInnerHTML for user content
payment status controlled by client input
```

---

## 19. MVP Security Implementation Order

Use this order:

```txt
1. Env helper and server-only boundaries
2. Scaffold-safe proxy
3. Supabase auth/permission helpers
4. RLS schema planning
5. Server-side validation for /apply
6. Audit logs for approval/payment changes
7. Basic headers before deployment
8. Upstash rate limit for /apply before public ads
9. Turnstile for /apply if needed before public ads
10. CSP once integrations stabilize
11. DOMPurify only if rich HTML is introduced
```

After security changes, run:

```bash
npm run format:check
npm run lint
npm run typecheck
npm run build
```
