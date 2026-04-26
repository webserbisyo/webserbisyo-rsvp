Yes — this should be **RSVP-specific**, not copied from POS. I checked the current package landscape: Next.js latest is `16.2.4`, React latest is `19.2.5`, Tailwind latest is `4.2.4`, `@supabase/ssr` latest is `0.10.2`, `@supabase/supabase-js` latest is `2.104.1`, React Hook Form latest is `7.74.0`, Zod latest is `4.3.6`, Motion latest is `12.38.0`, and Playwright Test latest is `1.59.1`. ([npm][1])

Paste this as the refined `markdown/001-workspace.md`:

````md
# WebSerbisyo RSVP - Project Workspace

You are an expert full-stack developer working on **WebSerbisyo RSVP**, a clean, revenue-focused Digital Invitation and RSVP Management MVP for the Philippine market.

This project is separate from the original WebSerbisyo POS monorepo. Do not copy POS assumptions, POS architecture, POS pricing, POS routes, POS database tables, or POS UI patterns unless explicitly requested.

Follow this workspace file and the referenced markdown rule files before implementing any code.

---

## 1. Project Identity

**Project name:** WebSerbisyo RSVP  
**Repository/app name:** `webserbisyo-rsvp`  
**Project type:** Single-app Next.js RSVP SaaS MVP  
**Primary market:** Philippine events and celebrations  
**Primary business goal:** Fast launch for revenue validation through custom Pro/Max RSVP websites.

WebSerbisyo RSVP provides:

- Public service landing page
- Application form for potential clients
- Internal admin dashboard
- Client dashboard
- Public fallback RSVP page
- Central RSVP backend/API for custom frontend repos
- Email onboarding and operational logs
- Manual payment confirmation for v1

---

## 2. Current MVP Scope

### In scope for first implementation phase

Admin-first MVP only:

1. Public service landing page
2. Client application form
3. Admin applications/clients page
4. Admin approval/provisioning flow
5. One-time Pro/Max payment record
6. Draft RSVP event creation
7. Resend onboarding email
8. Email logs
9. Audit logs
10. Admin sales summary
11. Admin Meta Pixel setup
12. Service landing PageView/Lead tracking
13. Optional non-blocking Meta CAPI Purchase event on manual paid approval

### Explicitly deferred

Do not implement these until approved:

- Basic reusable templates
- Full template library
- Client dashboard content beyond route/data foundation
- Public RSVP guest flow
- Guestbook
- Gift wallet
- Custom frontend repositories
- SDK package
- Realtime dashboard
- Push notifications
- Payment gateway
- Subscription billing
- Downpayments
- NestJS backend
- Electron app
- QR photo upload and LED display system
- Multi-product WebSerbisyo platform merge

---

## 3. Launch Offer Decision

First launch offers **Pro** and **Max** only.

### Pro

Custom frontend repo with a simpler, controlled design connected to the central RSVP backend/API.

### Max

Custom frontend repo with more premium styling, animation, monograms, albums, expanded sections, and stronger visual treatment, connected to the same central RSVP backend/API.

### Deferred Basic / Premium Basic

Basic is deferred because reusable templates do not exist yet. Future Basic/Premium Basic tiers should be created by generalizing finished Pro/Max work into reusable templates.

### Design ownership rule

Pro/Max designs are **non-exclusive by default**. Exclusive design rights must cost extra and must be clearly documented in the client agreement.

---

## 4. Architecture Direction

Use a **single Next.js app** for v1.

Do not use Turborepo or monorepo structure for this project yet.

### Current route structure

The single app should own:

- `/` service landing page
- `/apply` application form
- `/admin/*` internal admin area
- `/dashboard/*` client dashboard area
- `/r/[slug]` fallback RSVP page
- `/api/public/events/[eventSlug]/*` public API routes for custom frontend repos
- `/offline` lightweight PWA offline fallback

### Backend ownership

The central RSVP app owns:

- Admin dashboard
- Client dashboard
- Fallback RSVP page
- Supabase backend
- RSVP API
- Applications
- Tenants/clients
- RSVP events
- Event content
- Responses
- Guestbook records later
- Gift wallet records later
- Email logs
- Audit logs
- Meta Pixel/CAPI infrastructure
- Monitoring and operational reporting

### Custom frontend repo rule

Custom event websites are public design shells only.

They do not own:

- Database
- Auth
- Admin logic
- Client dashboard
- Payment logic
- Email logs
- Audit logs
- RSVP backend

Custom repos connect to the central RSVP app by `event_slug` through public API route handlers.

Default fallback URL:

```txt
https://webserbisyo.com/r/[eventSlug]
```
````

Wildcard subdomains such as `[eventSlug].webserbisyo.com` are possible later, but not a v1 blocker.

---

## 5. Tech Stack Baseline

Use the installed `package.json` and `package-lock.json` as the real source of truth. The versions below are the researched target/latest baseline as of 2026-04-27 and should be re-checked with `npm outdated` before package upgrades.

| Category              | Technology                    | Target / Current Guidance                                                                         |
| --------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------- |
| Framework             | Next.js                       | 16.2.x                                                                                            |
| UI Library            | React                         | 19.2.x                                                                                            |
| Language              | TypeScript                    | Prefer project-verified version; do not upgrade major versions without build/typecheck validation |
| Runtime               | Node.js                       | Use modern LTS compatible with Next.js 16 and Supabase JS                                         |
| Package Manager       | npm                           | Use npm only for v1                                                                               |
| Database              | Supabase PostgreSQL           | Managed Supabase project                                                                          |
| Auth / SSR            | `@supabase/ssr`               | 0.10.x                                                                                            |
| Supabase SDK          | `@supabase/supabase-js`       | 2.104.x                                                                                           |
| Styling               | Tailwind CSS                  | 4.2.x                                                                                             |
| UI Components         | shadcn/ui                     | CLI/registry-driven, current scaffold uses Radix/Nova preset                                      |
| UI Primitives         | Radix via shadcn              | Use generated shadcn components first                                                             |
| Optional UI Primitive | Base UI                       | Do not add unless explicitly needed                                                               |
| Icons                 | `lucide-react`                | 1.x                                                                                               |
| Toasts                | `sonner`                      | 2.0.x                                                                                             |
| Forms                 | React Hook Form               | 7.74.x                                                                                            |
| Validation            | Zod                           | 4.3.x                                                                                             |
| RHF Resolvers         | `@hookform/resolvers`         | 5.2.x                                                                                             |
| Animation             | `motion`                      | 12.38.x, only when animation is needed                                                            |
| Dates                 | `date-fns`                    | 4.1.x                                                                                             |
| Email                 | Resend                        | 6.x                                                                                               |
| Server-only Guard     | `server-only`                 | 0.0.1 marker package                                                                              |
| Testing               | Playwright Test               | 1.59.x                                                                                            |
| Formatting            | Prettier                      | 3.8.x                                                                                             |
| Tailwind Formatting   | `prettier-plugin-tailwindcss` | 0.7.x                                                                                             |
| Rate Limiting         | Upstash Ratelimit + Redis     | Deferred until public forms/API need protection                                                   |
| CAPTCHA               | Cloudflare Turnstile          | Deferred until application/public forms need bot protection                                       |
| Server State          | TanStack Query                | Do not add by default; use only when client-side caching is clearly needed                        |
| Client State          | Zustand                       | Do not add by default; use only for real cross-component interactive state                        |

---

## 6. Dependency Rules

1. Do not add dependencies casually.
2. Prefer built-in Next.js App Router patterns, Server Components, Server Actions, and route handlers first.
3. Use shadcn-generated components before creating custom primitives.
4. Use Zod for all external input validation.
5. Use React Hook Form only for real forms, not simple static pages.
6. Use TanStack Query only if there is a clear client-side server-state need.
7. Use Zustand only if local UI state becomes shared, persistent, or complex.
8. Use Motion only for meaningful Pro/Max design moments, not default page scaffolds.
9. Keep package upgrades intentional. After any package change, run:

```bash
npm run format:check
npm run lint
npm run typecheck
npm run build
```

---

## 7. Supabase and Auth Direction

Supabase is the canonical backend for v1.

Use these helper boundaries:

- Browser client for safe public/client-side reads where allowed
- Server client for authenticated server-side user/session access
- Route handler client for route handlers and API boundaries
- Admin/service-role client only inside `server-only` provisioning services

Never expose service-role keys to the client.

### Required environment variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

RESEND_API_KEY=
RESEND_FROM_EMAIL=

NEXT_PUBLIC_APP_URL=
RSVP_AUTH_GUARD_ENABLED=false
```

`RSVP_AUTH_GUARD_ENABLED=false` may be used during scaffold/page smoke testing, but production must enforce auth and permissions.

---

## 8. Proxy / Auth Guard Rule

Use `src/proxy.ts`, not `src/middleware.ts`, for Next.js 16.

The proxy must not crash when local Supabase environment variables are missing during scaffold testing.

Expected scaffold-safe behavior:

- If auth guard is disabled, allow route rendering.
- If Supabase URL/key are missing, allow route rendering in development.
- Do not call Supabase SSR client creation unless required env values exist.
- Production auth protection must be restored before real deployment.

Protected routes later:

- `/admin/*` requires platform admin
- `/dashboard/*` requires authenticated client user
- Server actions must independently verify permissions
- Route protection alone is not enough

---

## 9. Database Foundation Direction

Do not create migrations until the schema plan is approved.

Initial admin-first schema should likely include:

- `profiles`
- `clients` or `tenants`
- `rsvp_applications`
- `rsvp_events`
- `event_content`
- `payments`
- `email_logs`
- `audit_logs`
- `meta_pixels`

Likely enums/statuses:

- `plan_type`: `pro`, `max`
- `application_status`: `submitted`, `reviewing`, `approved`, `rejected`, `cancelled`
- `payment_status`: `pending`, `paid`, `failed`, `refunded`
- `event_status`: `draft`, `setup_in_progress`, `ready`, `published`, `archived`
- `custom_frontend_status`: `not_started`, `in_progress`, `connected`, `maintenance`, `disabled`

RLS principles:

- Platform admin can manage all RSVP operational records.
- Client users can access only their own client/event records.
- Public users can submit applications.
- Public RSVP read/submit policies should be added later when the public RSVP flow is implemented.
- Service-role access must stay in server-only provisioning services.

---

## 10. Service Layer Direction

Keep business logic inside `src/server/services` and `src/server/actions`.

Expected MVP service boundaries:

- Submit application
- Approve application
- Provision tenant/client
- Create client user or invitation flow
- Record one-time payment
- Create draft RSVP event
- Send onboarding email
- Write email logs
- Write audit logs
- Send optional Meta CAPI Purchase event

Rules:

1. Server Actions validate input with Zod.
2. Server Actions check permissions before calling services.
3. Services own business workflows.
4. Queries live in `src/server/queries`.
5. Public API logic lives in route handlers.
6. Do not mix UI code with provisioning/payment/email logic.
7. Do not call service-role Supabase from components.

---

## 11. UI and Styling Direction

Start simple. Do not overdesign the scaffold.

Use:

- Tailwind v4
- shadcn components
- component-scoped Tailwind classes
- `src/app/globals.css` for global Tailwind/shadcn tokens only
- `src/styles/themes.css` for future reusable RSVP themes
- `src/styles/components.css` for shared component-level patterns only when needed

Do not dump custom brand styling into `globals.css`.

Brand direction belongs in:

```txt
markdown/rsvp-theme-brand.md
src/styles/themes.css
```

---

## 12. Brand Identity Baseline

Current RSVP brand direction should be soft, celebratory, trustworthy, and premium enough for weddings/debuts while still practical for birthdays, baptisms, reunions, anniversaries, and corporate events.

Previous POS branding does not apply.

Default RSVP service brand may use:

- Warm neutral base
- Soft sage or botanical green
- Coral/blush accent
- Elegant dark text
- Optional serif display typography for marketing moments
- Clean sans-serif body text

Do not lock final colors here if `rsvp-theme-brand.md` is being refined separately.

---

## 13. Target Event Types

Initial positioning may support:

- Weddings
- Debuts
- Birthdays
- Baptisms
- Reunions
- Anniversaries
- Corporate events

Do not overbuild event-specific flows yet. The first MVP should keep event content flexible enough to support these without creating seven separate product paths.

---

## 14. PWA Direction

PWA is allowed, but keep it lightweight.

For v1:

- Cache static/app shell only.
- Provide `/offline` fallback.
- Do not queue RSVP submissions offline.
- Do not queue guestbook/admin/client actions offline.
- Do not pretend offline writes are supported.
- Do not add complex sync/conflict handling.

---

## 15. Development Workflow

Before implementation:

```bash
git status -sb
npm run format:check
npm run lint
npm run typecheck
npm run build
```

After implementation:

```bash
npm run format
npm run lint
npm run typecheck
npm run build
```

For route smoke testing:

```bash
npm run dev
```

Test key routes:

- `/`
- `/apply`
- `/admin`
- `/dashboard`
- `/dashboard/event`
- `/dashboard/page-content`
- `/dashboard/responses`
- `/dashboard/guestbook`
- `/dashboard/gift-wallets`
- `/dashboard/settings`
- `/offline`
- `/r/sample-event` if the route exists

---

## 16. Git Rules

Use small commits.

Recommended commit style:

```txt
chore: align scaffold with Next.js proxy convention
chore: make auth proxy safe for scaffold testing
feat: add admin application schema
feat: implement application submission
feat: implement admin approval provisioning
```

Do not commit `.env.local`.

Do not commit secrets.

Do not commit generated experimental code without running checks.

---

## 17. Current Implementation Priority

The next implementation sequence is:

1. Make proxy/auth guard scaffold-safe.
2. Smoke test all placeholder routes.
3. Plan Supabase schema and RLS for admin-first MVP.
4. After approval, create migrations.
5. Implement public application submission.
6. Implement admin applications/clients page.
7. Implement manual approval/provisioning flow.
8. Implement Resend onboarding.
9. Implement payment/email/audit logs.
10. Implement admin sales summary.
11. Implement Meta Pixel PageView/Lead.
12. Optionally add non-blocking Meta CAPI Purchase on manual paid approval.

Do not jump to client dashboard, public RSVP guest features, custom frontend repos, template library, realtime, push notifications, payment gateway, or NestJS until the admin-first vertical slice works.

```

The biggest changes from the old file are: **Basic is deferred**, **Turborepo is removed**, **Base UI is optional instead of default**, **POS/old reseller assumptions are removed**, and the workspace now locks the project into the actual RSVP MVP direction.
::contentReference[oaicite:1]{index=1}
```

[1]: https://www.npmjs.com/package/next?utm_source=chatgpt.com "Next.js"
