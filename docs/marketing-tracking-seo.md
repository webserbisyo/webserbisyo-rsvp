# WebSerbisyo RSVP Marketing Tracking and SEO

This document covers the public marketing funnel for `https://rsvp.webserbisyo.com`.

## Public Route Map

| Route            | Purpose                           | Indexing            |
| ---------------- | --------------------------------- | ------------------- |
| `/`              | Main marketing landing page       | `index, follow`     |
| `/apply`         | Public pricing and plan selection | `index, follow`     |
| `/apply/start`   | Application form step             | `noindex, follow`   |
| `/apply/success` | Submitted application state       | `noindex, nofollow` |

Query variants such as `/apply/start?plan=pro` and `/apply/start?plan=max` canonicalize to `/apply/start`. Hash URLs such as `/#pricing`, `/#features`, and `/#faq` are section anchors, not separate canonical pages.

## SEO Metadata Map

| Route            | Title                                                                   | Canonical                                    | Robots              |
| ---------------- | ----------------------------------------------------------------------- | -------------------------------------------- | ------------------- |
| `/`              | `WebSerbisyo RSVP — Premium Digital RSVP Websites for Filipino Couples` | `https://rsvp.webserbisyo.com`               | `index, follow`     |
| `/apply`         | `Pricing Plans \| WebSerbisyo RSVP`                                     | `https://rsvp.webserbisyo.com/apply`         | `index, follow`     |
| `/apply/start`   | `Start Your RSVP Website Application \| WebSerbisyo RSVP`               | `https://rsvp.webserbisyo.com/apply/start`   | `noindex, follow`   |
| `/apply/success` | `Application Received \| WebSerbisyo RSVP`                              | `https://rsvp.webserbisyo.com/apply/success` | `noindex, nofollow` |

## robots.txt and Sitemap

`/robots.txt` allows normal crawling and disallows private or system routes:

- `/admin/`
- `/dashboard/`
- `/api/`
- `/callback`
- `/reset-password`

`/sitemap.xml` includes only indexable public marketing URLs:

- `https://rsvp.webserbisyo.com`
- `https://rsvp.webserbisyo.com/apply`

The form and success routes are excluded from the sitemap and use page-level noindex metadata.

## Open Graph Image Strategy

The app uses a generated Next.js Open Graph image route at `/opengraph-image`.

Requirements preserved in the generated image:

- 1200 x 630 PNG
- dark premium WebSerbisyo RSVP theme
- no remote assets
- no external fonts
- no copyrighted third-party image dependencies
- core copy: `Website muna, bago bayad.`

Twitter uses `summary_large_image` and shares the same image.

## JSON-LD Schema Map

The landing page renders a conservative JSON-LD graph:

- `Organization`: `WebSerbisyo`
- `WebSite`: `WebSerbisyo RSVP`
- `Service`: `WebSerbisyo RSVP Website Service`
- `Offer`: PRO Plan, PHP 1599
- `Offer`: MAX Plan, PHP 3599

No reviews, ratings, aggregate ratings, or unsupported FAQ schema are included. FAQ schema should only be added if the structured data exactly matches visible FAQ content.

## Meta Pixel Browser Event Map

| Route or action         | Event                  | Type     | Parameters                                             |
| ----------------------- | ---------------------- | -------- | ------------------------------------------------------ |
| `/`                     | `ViewContent`          | Standard | content name/category and source route                 |
| `/apply`                | `ViewContent`          | Standard | content name/category and source route                 |
| `/apply/start?plan=pro` | `InitiateCheckout`     | Standard | value `1599`, currency `PHP`, plan `pro`               |
| `/apply/start?plan=max` | `InitiateCheckout`     | Standard | value `3599`, currency `PHP`, plan `max`               |
| `/apply/success`        | `Lead`                 | Standard | lead category, source route, plan/value when available |
| `/apply/success`        | `CompleteRegistration` | Standard | lead category, source route, plan/value when available |

Pixel initialization is guarded per browser session and per pixel ID. Browser PageView and configured
route events use deterministic execution keys so they fire on both hard loads and client-side App
Router transitions, including `/apply/start` form submission redirects to `/apply/success?ref=...`.
Numeric pixel ID filtering and pixel ID de-duplication remain active.

## Meta Pixel Route Scope

The WebSerbisyo marketing Pixel is scoped to the sales/application funnel only:

| Route                            | Marketing Pixel                                                 |
| -------------------------------- | --------------------------------------------------------------- |
| `/`                              | Present                                                         |
| `/apply`                         | Present                                                         |
| `/apply/start`                   | Present                                                         |
| `/apply/success`                 | Present                                                         |
| `/r/[slug]`                      | Absent unless a route/event-specific client pixel is configured |
| `/r/[slug]/rsvp`                 | Absent unless a route/event-specific client pixel is configured |
| `/admin`, `/dashboard`, `/login` | Absent                                                          |

The `global_public` tracking scope is intentionally treated as the WebSerbisyo public marketing
scope. Client wedding websites should use route-specific or event-specific pixels instead of the
WebSerbisyo sales Pixel.

## CTA Tracking Event Map

| CTA                     | Event                   | Notes                                              |
| ----------------------- | ----------------------- | -------------------------------------------------- |
| Hero create website     | `StartApplicationClick` | source `hero`, destination `/apply`                |
| Navbar get started      | `StartApplicationClick` | source `navbar`, destination `/apply`              |
| Footer get started      | `StartApplicationClick` | source `footer`, destination `/apply`              |
| Landing pricing PRO     | `SelectPlan`            | source `landing_pricing`, plan `pro`, value `1599` |
| Landing pricing MAX     | `SelectPlan`            | source `landing_pricing`, plan `max`, value `3599` |
| Apply pricing PRO       | `SelectPlan`            | source `apply_pricing`, plan `pro`, value `1599`   |
| Apply pricing MAX       | `SelectPlan`            | source `apply_pricing`, plan `max`, value `3599`   |
| Messenger links/buttons | `Contact`               | contact method `messenger`, source-specific        |

The app intentionally does not track hovers, accordion opens, scroll depth, decorative motion, countdown views, or every navigation link.

## CAPI Status

### Protected Lead baseline

Server-side Lead CAPI is the protected, proven Pixel+CAPI implementation. It remains behind the
server-only `META_CAPI_LEAD_ENABLED` feature flag. If the flag is missing or is not exactly
`true`, server Lead CAPI is skipped safely and the browser Pixel Lead remains active.

Lead browser/server deduplication uses the existing public application reference code:

- Browser event name: `Lead`
- Browser Pixel event option: `eventID = Lead:${reference_code}`
- Server CAPI event name: `Lead`
- Server CAPI event ID: `event_id = Lead:${reference_code}`

`/apply/success?ref=RSVP-...` reuses the same deterministic Lead event ID on refresh. If the
reference code is missing or invalid, the browser events keep their existing params-only behavior
and no random deduplication ID is generated.

Lead CAPI writes sanitized audit log actions without blocking application submission:

- `meta_capi_lead_sent`
- `meta_capi_lead_skipped`
- `meta_capi_lead_failed`

Audit metadata includes safe delivery context such as provider, event name, event ID, status,
pixel source, reference code, HTTP status, and a sanitized response summary. It must not include
raw email, phone, full name, IP address, user agent, access tokens, test event codes, or full
request payloads.

No Supabase migration is used for Lead CAPI. The application `reference_code` supplies the stable
deduplication ID, and `audit_logs.metadata` stores sanitized delivery status.

### Server-only manual Purchase

Purchase is server-only and remains secondary to the payment-confirmation workflow. The temporary
manual process is external: a customer pays through GCash or bank transfer, staff verifies it,
and a super admin marks the payment paid. Accordingly, the Purchase event uses:

- deterministic event ID `Purchase:${payment_id}`;
- the stored payment amount and currency;
- `action_source: other`, because the economic conversion did not occur on a WebSerbisyo checkout;
- matching data legitimately collected with the application, including persisted `_fbp` and `_fbc`
  when available;
- no super-admin request IP address or user agent; and
- no fictional `/apply/success` event-source URL.

`META_CAPI_PURCHASE_ENABLED` is independent from Lead. It is backward-compatible during rollout:
Purchase stays enabled when the variable is unset, while an explicit `false` disables only Purchase
CAPI. Set it explicitly to `true` after validating the deployed environment so the operating state
is obvious. A CAPI failure, disabled configuration, duplicate event, or active delivery claim must
never undo payment confirmation.

Purchase uses the additive `meta_capi_deliveries` delivery ledger. Its unique identity is
`(provider, event_name, event_id)`, and the server atomically claims a delivery before calling
Meta. States record pending, sending, sent, or failed delivery without storing PII, tokens, raw
browser identifiers, or raw CAPI payloads. Failed or stale claims can be recovered by a later
authorized manual confirmation; if Meta accepted a request but the local sent update failed, the
same deterministic event ID provides Meta-side deduplication as a secondary safeguard. This is
durable at-least-once delivery control, not a claim of mathematically exactly-once external HTTP
delivery.

When a real payment gateway or webhook is introduced, revisit Purchase event time, source context,
and customer browser context using the gateway's authoritative transaction information.

### CAPI test mode

`META_CAPI_TEST_EVENT_CODE` applies only to server CAPI requests. It does not make browser `fbq`
traffic test-only. A server event includes the test code only when both of these are configured:

- `META_CAPI_TEST_MODE=true`
- a non-empty `META_CAPI_TEST_EVENT_CODE`

This supports controlled testing against the deployed production application without changing the
live Pixel ID or CAPI token. A test code present while test mode is disabled is ignored and emits a
sanitized configuration warning; test mode enabled without a code also emits a sanitized warning
and sends ordinary server traffic. Never log the test code. After a test window, set
`META_CAPI_TEST_MODE=false` (or remove the mode/code variables) and redeploy. Event feature flags
remain independent from test mode.

To test in Meta Events Manager, enable `META_CAPI_LEAD_ENABLED=true` in the target environment and
enable explicit test mode only during a safe test window. Confirm that browser Lead and server Lead
arrive with the same event ID and are deduplicated. Confirm that Purchase CAPI remains independent.

For DevTools verification, filter Network requests by `facebook.com/tr`. Browser Lead is present
when the request includes `ev=Lead`; browser/server dedup is configured when the same request
includes `eid=Lead%3ARSVP-...`.

### Deferred CAPI expansion and rollback

Server CAPI counterparts for InitiateCheckout, SelectPlan, ViewContent, StartApplicationClick,
CompleteRegistration, Contact, and PageView are intentionally deferred. Do not add them without a
separate Meta Test Events validation phase.

For an emergency code rollback, use `git revert` on the Meta foundation commits in newest-first
order and push the resulting normal history. The additive `meta_capi_deliveries` table and claim
functions should remain unused if code is reverted; do not drop them as part of an urgent rollback.
Operationally, Lead can be disabled independently with `META_CAPI_LEAD_ENABLED=false`, and Purchase
can be disabled independently with `META_CAPI_PURCHASE_ENABLED=false`. Browser Pixel events remain
separate from both server flags.

## Environment Variables

Relevant environment variable names:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`
- `SITE_URL`
- `APP_BASE_URL`
- `META_PIXEL_ID`
- `META_CAPI_LEAD_ENABLED`
- `META_CAPI_PURCHASE_ENABLED`
- `META_CAPI_ACCESS_TOKEN`
- `META_CAPI_API_VERSION`
- `META_CAPI_TEST_MODE`
- `META_CAPI_TEST_EVENT_CODE`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `RSVP_WILDCARD_DOMAIN`

Secret values must never be printed in logs, docs, screenshots, issue comments, or pull request descriptions.

Recommended production URL values for source URLs, auth redirects, onboarding links, and public
absolute URLs:

- `NEXT_PUBLIC_APP_URL=https://rsvp.webserbisyo.com`
- `SITE_URL=https://rsvp.webserbisyo.com`
- `APP_BASE_URL=https://rsvp.webserbisyo.com`
- `NEXT_PUBLIC_SITE_URL=https://rsvp.webserbisyo.com` if configured

Vercel environment changes require a redeploy. Server-side Lead CAPI now prefers non-Vercel
configured origins and falls back to `https://rsvp.webserbisyo.com` in Vercel Production. Purchase
CAPI is server-only for the current external manual-payment workflow and therefore does not use a
fictional website conversion URL.

## Manual QA Checklist

- `/` loads the finalized landing page.
- `/apply` loads pricing and displays PRO `₱1,599 / ₱3,200` and MAX `₱3,599 / ₱7,200`.
- `/apply/start?plan=pro` renders the application form and PRO review pricing.
- `/apply/start?plan=max` renders the application form and MAX review pricing.
- `/apply/success?ref=RSVP-20260703-TEST` renders without a production submission.
- `/robots.txt` loads and includes the sitemap.
- `/sitemap.xml` lists only `/` and `/apply`.
- `/opengraph-image` returns a PNG image.
- `/apply/start` contains `noindex, follow`.
- `/apply/success` contains `noindex, nofollow`.
- Pixel scripts render without console errors.
- Submit one safe test application from `/apply/start` and confirm Browser Lead plus Server Lead
  appear in Meta Events Manager with the same `Lead:${reference_code}` event ID.
- On `/apply/success?ref=RSVP-20260704-TEST`, DevTools Network should show `facebook.com/tr` with
  `ev=Lead` and `eid=Lead%3ARSVP-20260704-TEST`.
- Official Meta Pixel Helper should not detect the WebSerbisyo marketing Pixel on client RSVP pages
  such as `/r/[slug]` or `/r/[slug]/rsvp`.
- CTA tracking does not block navigation or Messenger opening.
- `/admin` and `/dashboard` redirect unauthenticated users to login.

## Vercel Deployment Notes

This branch is intended for normal PR and Preview deployment review. Do not manually deploy, promote, rollback, or change Vercel settings as part of SEO/tracking work unless a later approved task explicitly requires it.
