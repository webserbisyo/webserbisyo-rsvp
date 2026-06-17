# WebSerbisyo RSVP - Project Status

> Last Updated: 2026-04-29
> Current Phase: Phase E.2B complete — Admin Shell, Admin Home, and Applications Read-Only Workflow
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

## Completed Today — 2026-04-27

### RSVP Supabase Project and Database Foundation

- Created and verified the dedicated RSVP Supabase project.
- Supabase project ref: `wxnwyuzgjptkwtrrvfwr`
- Supabase project URL: `https://wxnwyuzgjptkwtrrvfwr.supabase.co`
- Confirmed this is separate from the old POS/F&B project.
- Supabase MCP was connected and verified against the correct RSVP project.
- Phase 1 database migrations were applied successfully.
- Generated Supabase TypeScript types exist at `src/lib/supabase/types.ts`.

Phase 1 public tables now exist:

- `clients`
- `profiles`
- `rsvp_applications`
- `rsvp_events`
- `event_content`
- `payments`
- `email_logs`
- `audit_logs`
- `meta_pixels`

Phase 1 migration set includes:

- `20260427010100_phase1_extensions_helpers_and_base_guards`
- `20260427010200_phase1_clients`
- `20260427010300_phase1_profiles`
- `20260427010400_phase1_rsvp_applications`
- `20260427010500_phase1_rsvp_events`
- `20260427010600_phase1_rsvp_applications_approved_event_fk`
- `20260427010700_phase1_event_content`
- `20260427010800_phase1_payments`
- `20260427010900_phase1_email_logs`
- `20260427011000_phase1_audit_logs`
- `20260427011100_phase1_meta_pixels`
- `20260427011200_phase1_indexes`
- `20260427011300_phase1_rls_and_grants`

### RSVP Phase 1 Backend Foundation

Implemented the Phase 1 backend/service foundation for the admin-first workflow.

Core backend services/actions now cover:

- server-only Supabase admin client
- Supabase browser/server/route-handler client split
- auth callback handling
- auth/profile/permission helpers
- Zod schemas for application, approval/payment, event/content, and Meta Pixel config
- application submit/review/approval services
- client provisioning service
- client owner profile/invite creation
- draft RSVP event creation
- `event_content` creation
- manual one-time payment recording
- client hosting mirror update
- onboarding email and email log flow
- audit log writing
- Meta CAPI purchase stub
- safe public event DTO helper
- admin/dashboard/public query helpers

Relevant backend/database commits:

- `8387863 db: apply RSVP phase 1 schema and generate types`
- `7ed9714 db: tighten RSVP phase 1 RLS validation config`
- `279690b db: add RSVP phase 1 foundation migrations`
- `99e901e feat: add RSVP phase 1 backend services`

### Phase A — Auth Foundation and Login UX

Implemented the real shared `/login` experience for both platform admins and client users.

Completed:

- Replaced `/login` placeholder with real Supabase email/password login.
- Added role-aware redirect after sign-in.
- Added signed-in redirect behavior from `/login`.
- Improved `/callback` route to exchange session and redirect by profile role.
- Added protected admin and dashboard layouts.
- Added `/admin` index route so successful admin login no longer lands on 404.
- Added route/session guard behavior through `src/proxy.ts`.
- Added clean Sonner toast feedback for invalid login.
- Removed duplicate inline login error alert.
- Styled global toast behavior as top-center with reusable neutral/error tokens.
- Added autofill/input contrast fixes for login fields.
- Confirmed no service-role/admin Supabase client is used in login UI.
- Confirmed no schema or Supabase database changes were made during Phase A.

Auth role behavior:

- `platform_admin` → `/admin`
- `client_owner` → `/dashboard`
- `client_staff` → `/dashboard`
- missing/inactive/unknown profile → safe error and sign out

Created login assets:

- `public/images/auth/login-bg-rsvp.jpeg`
- `public/images/brand/webserbisyo-logo.jpeg`

Created/updated Phase A files include:

- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/callback/route.ts`
- `src/app/(admin)/admin/page.tsx`
- `src/app/(admin)/admin/layout.tsx`
- `src/app/(dashboard)/dashboard/layout.tsx`
- `src/components/auth/auth-shell.tsx`
- `src/components/auth/login-form.tsx`
- `src/components/layout/app-providers.tsx`
- `src/components/ui/sonner.tsx`
- `src/lib/auth/redirects.ts`
- `src/proxy.ts`
- `src/styles/themes.css`
- `src/styles/components.css`
- `src/app/globals.css`

### Runtime Test Accounts

Platform admin test profile:

- Auth user email: `webserbisyo@gmail.com`
- Auth user id: `f9174e92-cd19-4b0b-b9de-1a01b1ba3059`
- `profiles.role`: `platform_admin`
- `profiles.client_id`: `null`
- `profiles.is_active`: `true`

Client owner guard-test profile:

- Auth user email: `official.onemarketing@gmail.com`
- Auth user id: `c1f2ac01-c41d-4676-8a21-a69df4decc0a`
- `profiles.role`: `client_owner`
- `profiles.client_id`: linked to temporary `One Marketing Test Client`
- `profiles.is_active`: `true`
- Purpose: temporary Phase B route guard testing account

Do not store passwords or secrets in this file.

### Phase A/B/C Manual Test Results

Verified:

- Invalid login shows safe toast: `Invalid email or password.`
- Platform admin can sign in.
- Platform admin redirects to `/admin`, then `/admin/clients`.
- Platform admin can access:
  - `/admin/clients`
  - `/admin/meta-pixels`
  - `/admin/sales`
- Signed-out users are redirected to `/login` when accessing protected routes.
- Client owner signs in and redirects to `/dashboard`.
- Client owner attempting to access `/admin` or `/admin/*` is redirected back to `/dashboard`.
- `/dashboard` currently loads the dashboard placeholder for the client owner.
- Mobile login layout was checked and did not overflow horizontally.
- Google OAuth remains intentionally deferred until Supabase provider/callback settings are configured.

Current status:

- Phase A — Auth Foundation and Login UX: complete
- Phase B — Proxy and Route Guards: complete for current admin/client role checks
- Phase C — Platform Admin Account Seed/Confirmation: complete

### Validation Commands

Latest validation status before commit:

- `npm run format:check` — passed after Prettier formatting fix
- `npm run lint` — passed
- `npm run typecheck` — passed
- `npm run build` — passed

Build confirms these runtime routes exist:

- `/login`
- `/callback`
- `/admin`
- `/admin/clients`
- `/admin/meta-pixels`
- `/admin/sales`
- `/dashboard`
- `/apply`

### Remaining Notes

- `/apply` still exists only as a placeholder.
- Admin pages are still placeholders.
- Client dashboard pages are still placeholders.
- Google OAuth is not implemented yet.
- No client dashboard UI, public RSVP guest submission, guestbook, gift wallets, realtime, push notifications, payment gateway, NestJS, or custom frontend delivery was built in this phase.
- Next roadmap target: Phase B/Admin Shell Foundation or the admin-first application workflow, depending on the next implementation plan.

## Completed Today — 2026-04-29

### Phase E.1 — Minimal Platform Admin Shell

- Built the protected `/admin` shell foundation for platform-admin use.
- Added reusable admin shell structure with desktop sidebar, mobile navigation, page container, page header, feedback states, and shared cards/badges.
- Added safe placeholder admin routes for Events, Payments, Logs, Settings, More, and Offline.
- Preserved `src/proxy.ts` route protection and the server-side admin layout guard.
- Added shell styling through `src/styles/admin-shell.css` and global CSS integration.
- Added shadcn sidebar/avatar primitives and supporting mobile hook.
- Confirmed admin routes remain focused on platform-admin operations only, with no client dashboard UI.

### Phase E.2A — Admin Home Operational Snapshot

- Wired `/admin` to a real read-only operational snapshot pattern.
- Added server-side admin home query structure through `src/server/queries/admin-home.ts`.
- Added Admin Home stat cards, Needs Attention list, Recent Applications grid, and Quick Actions.
- Kept the home page concise and operational rather than turning it into an analytics dashboard.
- Kept counts and summaries read-only and safe for the current phase.

### Phase E.2B — Applications List + Detail Read-Only Workflow

- Finalized `/admin/applications` as the real read-only application review queue.
- Finalized `/admin/applications/[id]` as the real read-only application detail page.
- Added server-only application queries through `src/server/queries/admin-applications.ts`.
- Added typed DTO-style mapping instead of passing raw Supabase rows directly to UI components.
- Implemented status tabs, search, plan/payment filters, sort, pagination, empty/error/loading states, desktop table, and mobile card list.
- Added consistent badges for Pro, Max, GCash, Maya, Not selected, and application statuses.
- Added detail sections for applicant summary, event request, plan/payment preference, review state, activity/audit preview, linked records, and future action context.
- Kept approval, rejection, payment confirmation, provisioning, email sending, audit mutations, and Meta CAPI calls intentionally out of this phase.
- Preserved server-side auth/RLS boundaries with no service-role exposure and no schema/RLS changes.

### Checkpoint Commit

- Created checkpoint commit:

```text
d8e38c0 feat: finalize RSVP admin shell and applications read-only workflow
```
