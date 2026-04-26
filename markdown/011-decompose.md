---
description: RSVP MVP task decomposition, session reload, and status-update rules
globs: ["**/*.tsx", "**/*.ts", "**/*.sql", "**/*.md"]
alwaysApply: true
---

# RSVP MDAP: Decomposition & Session Continuity

Use this file to keep AI-assisted work focused, reviewable, and aligned with the clean **WebSerbisyo RSVP MVP**.

This project is not the old WebSerbisyo POS app and not the old overbuilt RSVP branch.

---

## 1. Default Workflow

For every meaningful task:

```txt
Inspect current state
→ confirm scope
→ decompose only if useful
→ implement one meaningful batch
→ run checks
→ report files changed
→ update PROJECT_STATUS.md only if meaningful
```

Treat pasted summaries as a map, not final truth. Verify with the repo before implementation.

---

## 2. Current Scope Lock

Current priority: **Admin-First RSVP MVP**.

Allowed now:

- Scaffold stability
- Proxy/auth guard safety
- Route smoke testing
- Supabase schema/RLS planning
- Approved admin-first migrations
- Public application form
- Admin applications/clients
- Manual approval/provisioning
- One-time package payment record
- Hosting/access coverage tracking
- Resend onboarding email
- Email logs
- Audit logs
- Admin sales summary
- Admin Meta Pixel PageView/Lead
- Optional non-blocking Meta CAPI Purchase on manual paid approval

Do not start without approval:

- Basic templates
- Full client dashboard content
- Public RSVP guest flow
- Guestbook
- Gift wallet
- Custom frontend repos
- SDK package
- Realtime
- Push notifications
- Payment gateway
- Subscriptions
- Downpayments
- NestJS
- Electron
- QR photo upload
- LED display system

---

## 3. Drift Control

Do not copy assumptions from:

- WebSerbisyo POS
- Old RSVP 51-table schema
- PayMongo/subscription setup
- Old Basic/Standard/Premium hosting tiers
- QR photo upload / LED display system
- White-label reseller workflows
- Template library workflows

Use the current clean RSVP direction:

```txt
Pro/Max only first
Manual one-time package payment
Hosting/access coverage tracked separately
No payment gateway yet
No subscriptions yet
No template library yet
No NestJS yet
```

---

## 4. When to Decompose

Use strict decomposition when the task touches:

- Auth/guards
- Admin/client permissions
- RLS
- Supabase service-role usage
- Database migrations
- Public APIs
- Payments/hosting coverage
- Email sending
- Meta Pixel/CAPI
- Large backend + frontend changes
- New chat or compacted session recovery

Strict mode:

```txt
1. Inspect
2. Plan
3. Implement one batch
4. Run checks
5. Report
```

Skip heavy decomposition for typos, copy updates, formatting, small placeholder edits, or clearly scoped one-file tasks.

---

## 5. Implementation Batch Rule

Prefer one meaningful batch at a time.

Good batches:

```txt
Make proxy scaffold-safe
Create admin-first schema draft
Implement application validation + server action
Implement admin application list query
Implement approve application service
Implement Resend onboarding service
```

Avoid mixed batches:

```txt
Build dashboard, guestbook, payments, templates, public RSVP, and realtime together
```

---

## 6. Required Start Checks

Before editing, inspect relevant files and run:

```bash
git status -sb
git log --oneline -5
```

For real TypeScript/backend/route changes, run appropriate checks before or after:

```bash
npm run format:check
npm run lint
npm run typecheck
npm run build
```

If a script does not exist, report it clearly. Never claim checks passed unless they were actually run.

---

## 7. Report Format

Every implementation report should include:

```txt
Files changed:
- path/to/file

Commands run:
- command

Result:
- passed/failed with exact notes

Deferred:
- anything intentionally left out

Next recommended step:
- one clear next action
```

---

## 8. Documentation Comments

Do not add huge banner comments everywhere.

Add clear comments only for critical or non-obvious logic:

- Approval/provisioning workflow
- Service-role Supabase usage
- RLS-sensitive assumptions
- Manual payment confirmation
- Hosting/access coverage rules
- Email sending/retry behavior
- Meta Pixel/CAPI tracking
- Public API behavior
- Temporary security/scaffold bypasses
- Workarounds

Example:

```ts
/**
 * Approves a submitted RSVP application and provisions the initial client records.
 *
 * This must stay server-only because it uses the Supabase service-role client.
 * The caller must verify platform-admin permissions before invoking this service.
 */
export async function approveApplication(...) {
  // ...
}
```

Avoid comments that only repeat obvious code.

---

## 9. PROJECT_STATUS.md Rule

Use `/PROJECT_STATUS.md` as the current implementation truth.

Update it only after meaningful project changes, such as:

- Real feature added or changed
- Auth/proxy behavior changed
- Database schema/RLS changed
- Migration added
- Route becomes functional beyond placeholder text
- Integration added/configured
- Milestone completed

Do not update it for:

- Formatting only
- Typo fixes
- Placeholder copy changes
- File inspection only
- Failed experiments that were reverted

When updating, include:

```txt
Date
What changed
Area/files affected
Current status
Next recommended step
```

---

## 10. Security Rules

Never rely only on UI hiding.

Security-sensitive work must enforce access through:

- Route/proxy guard where appropriate
- Server Action permission checks
- Service-layer boundaries
- Supabase RLS
- Server-only service-role usage

Service-role Supabase must never be exposed to client code.

---

## 11. New Chat / Compacted Session Reload

At the start of a new or compacted session:

1. Read `markdown/001-workspace.md`.
2. Read this file.
3. Read the relevant rule file for the task:
   - `020-nextjs-16.md`
   - `030-supabase-ssr.md`
   - `040-tailwind-v4.md`
   - `060-forms-validation.md`
   - `080-security.md`
   - `120-linting.md`
4. Read `/PROJECT_STATUS.md`.
5. Inspect current repo files before editing.

---

## 12. RSVP MVP Road

Recommended implementation order:

```txt
1. Proxy/auth guard scaffold safety
2. Placeholder route smoke test
3. Admin-first schema and RLS plan
4. Approved Supabase migrations
5. Application form validation + submission
6. Admin application list/detail
7. Manual approval/provisioning
8. One-time package payment + hosting coverage record
9. Resend onboarding email
10. Email logs + audit logs
11. Admin clients page
12. Admin sales summary
13. Meta Pixel PageView/Lead
14. Optional non-blocking CAPI Purchase
15. Client dashboard foundation
16. Public RSVP fallback
17. Guestbook/gift wallet later
18. Custom frontend repo connection later
```

Do not jump ahead unless explicitly approved.
