# WebSerbisyo RSVP - Project Status

> Last Updated: 2026-04-27  
> Current Phase: Phase A - Auth Foundation and Login UX  
> Current Deployment Target: Vercel + Supabase + Resend  
> Current Package Model: Pro/Max one-time package payment with hosting/access coverage tracking

---

## Current Truth

WebSerbisyo RSVP is a clean standalone Next.js RSVP MVP project.

It is separate from:

- the old WebSerbisyo POS monorepo
- the old overbuilt RSVP branch
- any future NestJS backend
- any future template library

Phase 1 Supabase foundation is complete, including the RSVP base schema, RLS, and backend service layer. The current active implementation milestone is Phase A auth foundation: shared login UX, auth callback handling, and route protection for admin/client areas.

---

## Completed Today - 2026-04-27

### Project direction locked

- Confirmed this RSVP MVP will remain a clean standalone Next.js app for v1.
- Confirmed the old RSVP branch will not be cleaned or reused.
- Confirmed v1 uses Supabase + Vercel + Resend.
- Confirmed NestJS is deferred until backend complexity justifies it.
- Confirmed Turborepo/monorepo is deferred.

### Launch offer direction locked

- First launch offers Pro and Max only.
- Basic is deferred until reusable templates exist.
- Pro/Max are custom frontend repo designs connected to the central RSVP backend/API.
- Pro/Max designs are non-exclusive by default.
- Exclusive design rights should cost extra.
- One-time package payment is for initial setup/delivery.
- One-time payment does not mean lifetime hosting.
- Hosting/access coverage should be tracked separately.

### Architecture direction locked

Single Next.js app owns:

- `/` service landing page
- `/apply` application form
- `/admin/*` internal admin
- `/dashboard/*` client dashboard
- `/r/[slug]` fallback RSVP page
- `/api/public/events/[eventSlug]/*` public API routes
- `/offline` lightweight PWA fallback

Central platform owns:

- Supabase backend/auth/database
- admin dashboard
- client dashboard
- fallback RSVP page
- public API
- applications
- payments
- email logs
- audit logs
- Meta Pixel/CAPI infrastructure

Custom frontend repos only own public event website design shells and connect by `event_slug`.

### Database ledger review

- `RSVP_Database_Blueprint_Ledger.md` was reviewed and trust-boundary corrections were applied.
- Phase 1 RSVP migrations are applied in the connected Supabase project.
- Phase 1 public tables are present: `clients`, `profiles`, `rsvp_applications`, `rsvp_events`, `event_content`, `payments`, `email_logs`, `audit_logs`, `meta_pixels`.
- Next step is building admin-first authenticated flows on top of the completed Phase 1 foundation.

### Auth foundation implemented

- Shared `/login` route now uses the real Supabase email/password sign-in flow.
- Signed-in users are redirected server-side based on their active profile role.
- `/callback` now exchanges auth codes and resolves role-aware redirects safely.
- `src/proxy.ts` is narrowed to `/admin/*` and `/dashboard/*` session gating only.
- Admin and dashboard layouts now enforce role checks server-side instead of relying on proxy profile lookups.
- Google OAuth remains deferred until Supabase dashboard provider configuration is confirmed.

### Documentation/rules created and committed

Created and committed RSVP-specific project rules:

- `markdown/001-workspace.md`
- `markdown/011-decompose.md`
- `markdown/020-nextjs-16.md`
- `markdown/021-react-19.md`
- `markdown/030-supabase-ssr.md`
- `markdown/040-tailwind-v4.md`
- `markdown/060-forms-validation.md`
- `markdown/070-state-management.md`
- `markdown/080-security.md`
- `markdown/111-crud-patterns.mdc`
- `markdown/120-linting.md`
- `markdown/rsvp-theme-brand.md`
- `PROJECT_STATUS.md`

Commit:

```txt
0b1deac docs: align RSVP project rules and status tracking
```
