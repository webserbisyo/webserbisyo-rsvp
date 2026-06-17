# 01 — Phase E.1: Admin Shell Foundation

**Project:** `webserbisyo-rsvp` (standalone)
**Path:** `~/webserbisyo-rsvp`
**Supabase project ref:** `wxnwyuzgjptkwtrrvfwr`
**Phase:** E.1 — Minimal Platform Admin Shell Foundation
**Depends on:** Phase D public apply form wiring (functionally complete)
**Status:** Ready for implementation

---

## Goal

Build the production-shaped **admin shell foundation only**. No real feature behavior. No data mutations. The shell must be layout-correct, responsive, auth-guarded, token-driven, and placeholder-safe before any admin workflow is wired.

The Figma prototype is approved as a **visual reference for layout rhythm only**. Do not copy it directly. Route names, placeholder states, tokenized styling, and reusable shell components must be established here first.

---

## Non-Goals

The following must not be built in this task:

- Real application approval or rejection
- Real client provisioning or status writes
- Real payment confirmation
- Real Meta Pixel CRUD
- Real sales calculations or revenue aggregation
- Public guest RSVP UI
- Payment gateway behavior
- Offline mutation queue or background sync
- Advanced charts or analytics
- Command menu or keyboard shortcut system
- Template library
- Multi-role staff management
- Any Phase 2 or Phase 3 client dashboard feature

---

## Context

This is a standalone RSVP project at `~/webserbisyo-rsvp`. It is completely separate from the old WebSerbisyo POS/F&B monorepo and any earlier overbuilt RSVP branch. The Supabase project is dedicated (`wxnwyuzgjptkwtrrvfwr`) and must not be confused with any previous project.

Phase D wired the public apply form. Phase E.1 begins the admin side. The first real admin workflow after this shell task is application review — so the route foundation must reflect that `applications` is the primary admin object in MVP, not `clients` (clients appear after approval).

---

## Required Pre-Implementation Scan

Run all of the following and include full output in the plan before touching any file.

```bash
pwd
git status -sb
git log --oneline -n 8
cat package.json
```

Then inspect these files and report what each currently contains:

```
CLAUDE.md                                  # if present
README.md                                  # if present
next.config.*
middleware.ts                              # if present
src/proxy.ts                               # if present — report which is active
components.json
src/styles/themes.css
src/app/globals.css  or  app/globals.css   # whichever exists
src/app/                                   # full route tree, all folders and layout files
src/components/ui/                         # all existing shadcn components
src/lib/auth/                              # existing auth/session/guard utilities
src/lib/supabase/                          # existing Supabase client/server helpers
.claude/docs/                              # all local docs if present
```

**Important — auth/proxy convention:**
Report whether the project uses `middleware.ts` or `src/proxy.ts` as the route guard. Do not create a parallel guard system. Do not rename or replace whichever is active. All auth guard work in this task must extend or preserve the existing convention exactly as it is.

---

## Required Docs Reload

Before writing any implementation plan, read these local files if present:

```
.claude/docs/nextjs.md or similar
.claude/docs/supabase.md or similar
.claude/docs/shadcn.md or similar
.claude/docs/tailwind.md or similar
.claude/docs/security.md or similar
.claude/docs/pwa.md or similar
.claude/docs/state.md or similar
```

If local docs are absent, inspect the actual repo files directly. Do not invent conventions.

---

## shadcn / Registry Strategy

Follow this order strictly:

1. Inspect `components.json` — note current style, baseColor, aliases, and Tailwind version.
2. Inspect `src/components/ui/` — list every component already installed.
3. Check whether the shadcn MCP is available in the current environment.
4. If MCP is available, use it to query the registry before installing anything.
5. Install **only** primitives that are missing and genuinely needed for the shell.
6. **Do not reinitialize shadcn.**
7. **Do not change aliases, preset, registry URL, or baseColor** unless a specific blocking reason is found and explained.

### Components needed for Phase E.1 shell

**Check first, install only if missing:**

| Component       | Purpose                                      |
| --------------- | -------------------------------------------- |
| `sidebar`       | Desktop collapsible sidebar shell            |
| `button`        | Nav items, actions, placeholders             |
| `card`          | Stat cards, section cards, placeholder cards |
| `badge`         | Status indicators                            |
| `separator`     | Sidebar and section dividers                 |
| `dropdown-menu` | Admin identity menu, More overflow           |
| `avatar`        | Admin identity display                       |
| `tooltip`       | Collapsed sidebar icon labels                |
| `sheet`         | Mobile More drawer (if needed)               |
| `skeleton`      | Loading states for list/card areas           |
| `alert`         | Error, offline, and permission denied states |
| `sonner`        | Toast feedback (replaces deprecated Toast)   |

**Do not install in this task:**

`chart`, `calendar`, `command`, `resizable`, `data-table`, `date-picker`

**Do not use:**

Deprecated shadcn `Toast` component — use `Sonner` only.

---

## Critical Implementation Plan First

**Before modifying a single file**, write a short plan covering:

1. Current route structure — what admin routes exist today and in what state
2. Current guard/auth structure — which file is active (`middleware.ts` or `proxy.ts`), what it currently protects, and what it does not yet protect
3. Proposed admin shell component structure — where each new component will live
4. Proposed route placeholder list — which routes to create or refine
5. CSS/token strategy — how admin shell styles will be organized without scattering hardcoded values
6. Risk areas — files that are fragile, auth logic that could break, existing routes that might conflict
7. Files likely to change — complete list before implementation starts

**Do not proceed to implementation until this plan is written and the full scan is complete.**

---

## Decomposed Implementation Steps

Work through these steps in order. Do not skip ahead.

### Step 1 — Confirm current admin/auth guard

- Identify which file (`middleware.ts` or `proxy.ts`) currently guards `/admin`
- Confirm `/admin` requires `platform_admin` role
- Confirm `/login` and `/callback` remain public
- Do not change the guard logic — extend only if a specific gap is found
- Report current behavior and any gaps

### Step 2 — Create or refine the admin shell layout

- Create `src/components/app-shell/admin-shell.tsx`
- Composes `DesktopSidebar` + `MainArea` on desktop
- Composes `MobileTopHeader` + `PageContent` + `MobileBottomNav` on mobile
- Includes `<Toaster />` (Sonner) once at shell level
- Must not re-render nav chrome on every route change

### Step 3 — Create or refine the desktop sidebar

- Create `src/components/app-shell/desktop-sidebar.tsx`
- Use shadcn `Sidebar` component as the base — check if already installed
- Collapsible behavior: expanded (240px) and collapsed (64px, icons + tooltips)
- Destinations:
  - Home
  - Applications
  - Clients
  - Payments
  - Events
  - Logs
  - Settings
  - Meta Pixels (placeholder only — defer if adding it is non-trivial at this stage)
- Active route clearly highlighted
- Admin identity section at bottom with avatar, name, and sign-out affordance (only if session is already safely accessible)
- Collapse toggle button visible

### Step 4 — Create or refine mobile top header and bottom nav

- Create `src/components/app-shell/mobile-top-header.tsx`
  - Sticky, 56px height
  - Current page title (center or leading)
  - One contextual action slot (right)
- Create `src/components/app-shell/mobile-bottom-nav.tsx`
  - 4 destinations: Home, Applications, Payments, More
  - Icons + visible text labels (never icon-only)
  - Active state: brand primary color
  - **Must include `padding-bottom: env(safe-area-inset-bottom)`** — non-negotiable for iOS PWA
  - Must not overlap page content
- Create `src/components/app-shell/admin-more-menu.tsx`
  - Route or sheet/drawer for: Clients, Events, Logs, Settings, Offline
  - Sign out affordance only if already safely supported by existing session utilities

### Step 5 — Create or refine page container and header components

- Create `src/components/app-shell/page-header.tsx`
  - Props: `title`, optional `description`, optional `actions` slot
  - Consistent across all admin pages
- Create `src/components/app-shell/page-container.tsx`
  - Consistent padding and max-width
  - Max-width: `1280px` on wide desktop — do not stretch content endlessly
  - Responsive horizontal padding: `16px` mobile, `24px` tablet, `32px` desktop

### Step 6 — Create feedback components

Create each component. Do not skip any. These prevent inconsistent one-off layouts.

| Component          | File                                            | Purpose                  |
| ------------------ | ----------------------------------------------- | ------------------------ |
| `EmptyState`       | `src/components/feedback/empty-state.tsx`       | No data, first-run       |
| `ComingSoonCard`   | `src/components/feedback/coming-soon-card.tsx`  | Deferred features        |
| `PermissionDenied` | `src/components/feedback/permission-denied.tsx` | Unauthorized access      |
| `OfflineBanner`    | `src/components/feedback/offline-banner.tsx`    | Full-width offline strip |
| `LoadingSkeleton`  | `src/components/feedback/loading-skeleton.tsx`  | List and card loading    |
| `ErrorState`       | `src/components/feedback/error-state.tsx`       | Fetch/server errors      |

And these shared display components:

| Component     | File                                     | Purpose                  |
| ------------- | ---------------------------------------- | ------------------------ |
| `SectionCard` | `src/components/shared/section-card.tsx` | Consistent card wrapper  |
| `StatusBadge` | `src/components/shared/status-badge.tsx` | Color-coded status pills |
| `StatCard`    | `src/components/shared/stat-card.tsx`    | Admin home stat tiles    |

**Adapt all paths to actual repo conventions.** If a component already exists under a different path, reuse it — do not duplicate.

### Step 7 — Create placeholder routes

Create each route as a minimal shell page. See [Placeholder Page Requirements](#placeholder-page-requirements) below for per-route content rules.

```
src/app/(admin)/admin/page.tsx
src/app/(admin)/admin/applications/page.tsx
src/app/(admin)/admin/applications/[id]/page.tsx
src/app/(admin)/admin/clients/page.tsx
src/app/(admin)/admin/payments/page.tsx
src/app/(admin)/admin/events/page.tsx
src/app/(admin)/admin/logs/page.tsx
src/app/(admin)/admin/settings/page.tsx
src/app/(admin)/admin/more/page.tsx
src/app/(admin)/admin/offline/page.tsx
```

**If routes already exist** from earlier experiments (e.g. `/admin/clients`, `/admin/sales`): do not delete them blindly. Report what exists, decide whether to keep or replace, and document the decision in the plan.

**If the repo uses a different route group convention** (e.g. no route group, or a different layout file structure): adapt to match the existing convention.

### Step 8 — Apply CSS and token strategy

- Use existing RSVP semantic tokens from `src/styles/themes.css`
- Create `src/styles/admin-shell.css` only if shell-specific utilities are needed and cannot be expressed cleanly in component-scoped Tailwind
- If `admin-shell.css` is created, it must contain only:
  - Sidebar width variables
  - Page container max-width variables
  - Mobile nav height variables
  - Safe-area padding utilities
  - Sticky header height variables
- Import it in the global CSS entry point
- Do not scatter hardcoded `#E11D48` or one-off rose/red values across components — always reference the semantic token
- If Tailwind v4 is active, keep token strategy compatible with the `@theme` / CSS-variable workflow

### Step 9 — Add noindex metadata to all admin routes

Every admin route must declare `noindex` metadata. This is non-negotiable for a production admin app.

Apply to every page under `/admin` using Next.js App Router metadata:

```ts
export const metadata: Metadata = {
  title: "[Page Name] · RSVP Admin",
  robots: { index: false, follow: false },
};
```

- Apply at the admin layout level where possible to avoid repeating it per page
- Confirm the metadata is not overridden by a parent layout that sets `index: true`
- `robots.txt` alone is not sufficient — the `noindex` meta tag or header is required per Google's guidance

### Step 10 — Validate responsive behavior

Before running build commands, manually check layout at these widths:

| Breakpoint | Expected behavior                                               |
| ---------- | --------------------------------------------------------------- |
| 390px      | Bottom nav visible, sidebar hidden, stacked cards, no overflow  |
| 640px      | Bottom nav still acceptable, two-column stat cards              |
| 900px      | Sidebar begins, no broken wide tables                           |
| 1024px     | Full desktop sidebar, sticky header, content max-width enforced |
| 1440px     | Content does not stretch — max-width cap applied                |

### Step 11 — Run validation commands

Inspect `package.json` scripts first. Then run whichever of the following exist:

```bash
npm run format:check   # if present
npm run lint
npm run typecheck      # if present
npm run build
```

If a command is missing from `package.json`, report it — do not invent it.
If a command fails due to a pre-existing issue unrelated to this task, report the error clearly. Do not hide it, and do not silently fix unrelated code.

---

## Target Routes

```
/admin                         — Admin home shell
/admin/applications            — Applications list shell
/admin/applications/[id]       — Application detail shell
/admin/clients                 — Clients shell
/admin/payments                — Payments shell
/admin/events                  — Events shell
/admin/logs                    — Logs shell
/admin/settings                — Settings shell
/admin/more                    — Mobile overflow nav page
/admin/offline                 — Branded offline fallback
```

---

## Navigation Model

### Desktop sidebar destinations

```
Home
Applications
Clients
Payments
Events
Logs
Settings
[Meta Pixels — placeholder only if cheap, otherwise defer]
```

### Mobile bottom nav (4 items max)

```
Home
Applications
Payments
More
```

### Mobile More page/sheet destinations

```
Clients
Events
Logs
Settings
Offline
[Sign out — only if already safely supported]
```

---

## Responsive Layout Requirements

| Breakpoint | Layout rule                                               |
| ---------- | --------------------------------------------------------- |
| 0–639px    | Single column, bottom nav, stacked cards, no wide tables  |
| 640–899px  | Bottom nav still acceptable, two-column stat cards        |
| 900–1023px | Compact sidebar or stable transition state                |
| 1024px+    | Desktop sidebar, sticky header, tables permitted          |
| 1440px+    | Hard max-width cap on content (~1280px), never full-bleed |

- Mobile bottom nav **must** use `padding-bottom: env(safe-area-inset-bottom)` — required for iOS PWA safe area
- Content must never be obscured by the bottom nav or sticky top bar
- No horizontal overflow at any breakpoint

---

## Placeholder Page Requirements

Every placeholder page must use `PageHeader`, a short description, and a `ComingSoonCard` or `EmptyState`. No destructive actions. No fake real data unless it is **explicitly labeled as a sample/placeholder in both the UI and the code comment**.

### `/admin` — Admin Home

Include placeholder `StatCard` tiles:

- Pending Applications — `0` or `—` (not fake inflated numbers)
- Payments Needing Review — `0` or `—`
- Active Clients — `0` or `—`

Include quick-link cards to Applications, Clients, Payments.

**Data rule:** Stat values must show `—` or `0` unless a real safe server query is already established. Do not display invented counts.

### `/admin/applications` — Applications List

- Search/filter visual shell (input + filter button — not wired)
- `EmptyState` as default content
- Mobile: stacked card placeholder layout
- Desktop: table shell (headers only, `EmptyState` body)
- No real data fetching unless a safe existing pattern already exists and is explicitly in scope for this task

### `/admin/applications/[id]` — Application Detail

- Back link to `/admin/applications`
- `SectionCard` blocks (layout only, no data):
  - Applicant Summary
  - Event Details
  - Selected Plan
  - Manual Payment Preference
- Disabled/placeholder action buttons with `ComingSoonCard` label
- **No mutation behavior whatsoever**

### `/admin/clients`, `/admin/payments`, `/admin/events`, `/admin/logs`

- `PageHeader` with route title and short description
- `ComingSoonCard` or `EmptyState` as body content
- Explain in UI copy what will appear here

### `/admin/settings`

- Profile/session display only
- Sign out affordance only if existing session utilities already support it safely

### `/admin/more`

- Navigation list to: Clients, Events, Logs, Settings, Offline
- Sign out only if safely supported

### `/admin/offline`

- Branded full-screen fallback
- Logo + offline icon
- Heading: "You're offline"
- Brief explanation of what is unavailable
- "Try Again" button (navigates to `/admin`)

---

## Auth and Security Requirements

- **Existing `platform_admin` route guard must remain fully enforced.** This task must not weaken it.
- Non-admin authenticated users must not access any `/admin` route.
- Unauthenticated requests must redirect to `/login`.
- Do not create a parallel guard system — extend or preserve the existing `middleware.ts` or `proxy.ts` convention.
- Do not expose the Supabase service-role key in any client component, client bundle, or shell layout.
- Do not add broad `anon` or `public` RLS policies.
- UI hiding (conditional rendering) is not a security boundary — it is decoration only. Real security lives in RLS and server-side checks.
- **All admin routes must declare `noindex, nofollow` metadata** to prevent indexing of authenticated admin pages. Apply at the admin layout level where possible.

---

## PWA Requirements (Shell Only)

- Keep or create the `/admin/offline` placeholder page as a branded fallback.
- Do not implement an offline mutation queue.
- Do not cache sensitive admin data.
- If a PWA manifest or service worker already exists: inspect and report its current state. Do not modify PWA configuration unless the change is small, clearly scoped to the `/admin` shell, and non-breaking.
- If no manifest or service worker exists: report it and defer PWA hardening to a later dedicated task.

---

## CSS and Theme Strategy

- Use existing RSVP semantic tokens defined in `src/styles/themes.css`.
- Do not scatter hardcoded `#E11D48`, rose, or red values across components — reference semantic tokens only.
- Create `src/styles/admin-shell.css` only for shell-specific layout utilities that cannot be cleanly expressed in component-scoped Tailwind. Limit its contents to variables and utilities listed in Step 8.
- Support light/dark tokens if the project already defines them — do not introduce a new theming system.
- tweakcn may be used as a **reference tool** for exploring token values, but its generated output must not be pasted directly into the project without manual review and normalization.
- If Tailwind v4 is active, use the `@theme` / CSS-variable workflow already established in the project — do not introduce a conflicting `tailwind.config.ts` theme extension.

---

## Validation Commands

Inspect `package.json` scripts section before running anything. Then run whichever commands exist:

```bash
npm run format:check
npm run lint
npm run typecheck
npm run build
```

- If a command does not exist, report it explicitly.
- If a command fails due to a pre-existing unrelated issue, report the error verbatim. Do not silently fix it, and do not hide the failure.
- All four commands must pass (or be explained) before the final report is submitted.

---

## Manual Test URLs

After `npm run dev`, confirm each URL loads correctly:

```
http://localhost:3000/admin
http://localhost:3000/admin/applications
http://localhost:3000/admin/applications/test-placeholder
http://localhost:3000/admin/clients
http://localhost:3000/admin/payments
http://localhost:3000/admin/events
http://localhost:3000/admin/logs
http://localhost:3000/admin/settings
http://localhost:3000/admin/more
http://localhost:3000/admin/offline
http://localhost:3000/login           — confirm redirect for unauthenticated admin routes
```

For each URL, report: loads correctly / crashes / redirects unexpectedly / layout broken.

---

## Final Report Requirements

Codex must return a report with all of the following sections. Do not omit any section.

```
## Phase E.1 — Implementation Report

### 1. Scan Summary
- pwd output
- git status output
- git log output (last 8)
- Route tree found (before changes)
- Guard file active: middleware.ts or proxy.ts
- Current guard behavior summary
- shadcn components already installed
- Existing admin routes found (if any from prior experiments)
- themes.css token summary
- Local .claude/docs found: yes / no / partial

### 2. Implementation Plan
- Component structure decided
- Route strategy decided
- CSS/token strategy decided
- Risk areas identified
- Files expected to change

### 3. shadcn MCP / Registry Findings
- MCP available: yes / no
- Components already installed (no action)
- Components installed in this task (list each)
- Components deferred (not needed for shell)

### 4. Files Changed
- Every file created or modified with a one-line description

### 5. Files Unchanged
- Files scanned but not modified, and why

### 6. Route Summary
- Each route created/refined and its current placeholder state

### 7. Auth/Guard Summary
- What the guard does before and after this task
- Confirmation that existing convention was preserved (not replaced)
- Confirmation that noindex metadata is applied to all admin routes

### 8. CSS/Theme Summary
- What tokens are used from themes.css
- Whether admin-shell.css was created and what it contains
- Confirmation that no hardcoded color values were scattered in components

### 9. Data Integrity Confirmation
- Confirm: no fake real data displayed without explicit sample/placeholder label
- Confirm: no mutation behavior was added
- Confirm: no RLS weakening
- Confirm: no service-role key exposed

### 10. Validation Results
- npm run format:check: PASS / FAIL / NOT FOUND
- npm run lint: PASS / FAIL
- npm run typecheck: PASS / FAIL / NOT FOUND
- npm run build: PASS / FAIL
- Paste any errors verbatim

### 11. Manual Test Results
- Result for each URL in the manual test list

### 12. Known Limitations
- Anything incomplete, deferred, or requiring a follow-up decision

### 13. Next Recommended Task
- What Phase E.2 should focus on based on current state
```

---

## Phase Sequence Reference

| Phase         | Scope                                       | Status                   |
| ------------- | ------------------------------------------- | ------------------------ |
| Phase 1       | Database and backend foundation             | ✅ Complete              |
| Phase A       | Auth Foundation and Login UX                | ✅ Complete              |
| Phase D       | Public apply form wiring                    | ✅ Functionally complete |
| **Phase E.1** | **Admin Shell Foundation**                  | 🔄 This task             |
| Phase E.2     | Applications List + Detail (read-only data) | Pending E.1              |
| Phase E.3     | Approval/Rejection workflow                 | Pending E.2              |
| Phase E.4     | Manual Payment Confirmation                 | Pending E.3              |
| Phase F       | Meta Pixels, Sales, Hardening               | Pending E.4              |
