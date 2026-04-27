# 01 — RSVP Database Decisions and Scope

**Project:** `webserbisyo-rsvp`  
**Status:** Planning document, not a migration file  
**Source:** Finalized RSVP Database Blueprint Ledger, April 2026  
**Use:** Give this to Codex before any database planning so it understands the locked product/database decisions.

---

## 1. Purpose

This document captures the **locked database direction** for the WebSerbisyo RSVP MVP. It combines the ledger sections on purpose, product context, scope boundaries, database principles, normalization, the core entity flow, deferred features, and remaining open questions.

This file should be used before writing any SQL so Codex does not reopen already-decided issues such as tenant naming, event slug behavior, public access style, or Phase 1 scope.

This document is **not** a SQL migration file.

---

## 2. Product Context

WebSerbisyo RSVP is a clean standalone RSVP platform for event clients in the Philippines.

The v1 stack is:

| Layer               | Technology                                |
| ------------------- | ----------------------------------------- |
| App framework       | Next.js 16 App Router + TypeScript        |
| UI/runtime          | React 19                                  |
| Database/auth       | Supabase PostgreSQL + Supabase Auth + RLS |
| Deployment          | Vercel later                              |
| Transactional email | Resend                                    |
| Marketing tracking  | Meta Pixel + optional Meta CAPI           |

The current project is separate from:

- the old WebSerbisyo POS/F&B project
- the old overbuilt RSVP branch
- any future NestJS backend
- future Basic/template-library products

Supabase is the canonical database and auth backend. Custom frontend repos are public design shells only.

---

## 3. Launch Model

First launch supports **Pro** and **Max** only.

Basic/template packages are deferred because reusable templates do not exist yet. Pro/Max are custom frontend repo designs connected to the central RSVP platform through `event_slug` and public API routes.

Payment model for v1:

- manual one-time Pro/Max package payment
- hosting/access coverage tracked separately
- no payment gateway yet
- no subscription billing yet
- no downpayments yet

Important distinction:

```txt
One-time package payment = delivery/setup package.
Hosting/access coverage = tracked with dates and may require renewal later.
```

---

## 4. Platform Ownership Model

The central RSVP platform owns:

- Supabase backend and database
- Supabase Auth
- admin dashboard
- client dashboard
- fallback RSVP page `/r/[eventSlug]`
- public API routes for custom repos
- applications
- payment records
- email logs
- audit logs
- Meta Pixel/CAPI configuration
- guest responses later
- guestbook later
- gift wallets later

Custom frontend repos own only:

- public event website design
- animations/visual styling
- custom layout sections
- frontend display logic

Custom frontend repos must not own:

- database tables
- auth
- payments
- admin dashboard
- client dashboard
- service-role keys
- private tenant IDs

Public custom frontends connect by `event_slug`. The server resolves tenant/client context from the slug.

---

## 5. Locked Database Decisions

### 5.1 Table Name and Tenant Boundary

Use the table name:

```txt
clients
```

Do not rename it to `tenants` for v1.

Reason:

- `clients` matches the business language and dashboard wording.
- It is easier to understand for the project, school documentation, and future operators.
- It can still be treated technically as the tenant table.

Locked rule:

```txt
clients.id is the tenant boundary.
```

Tenant-owned rows must reference `client_id` where appropriate.

---

### 5.2 Event Ownership

V1 supports:

```txt
one active/non-archived RSVP event per client
```

However, the schema should not block future archived historical event rows if possible.

Recommended SQL planning direction:

- Prefer a partial unique index that enforces one active/non-archived event per client.
- Avoid a full unique constraint on `rsvp_events.client_id` unless the product intentionally forbids even archived historical event rows.

Example concept only:

```sql
-- Planning concept only, not final migration SQL.
CREATE UNIQUE INDEX ... ON rsvp_events(client_id)
WHERE status <> 'archived';
```

---

### 5.3 Event Slug

`event_slug` is:

- globally unique
- public URL-safe
- immutable after creation
- the only trusted public resolver for fallback RSVP pages and custom frontend repos

Public URLs use:

```txt
/r/[eventSlug]
```

Custom frontend repos also resolve data by `event_slug`.

Never expose these through public APIs unless absolutely necessary:

- `client_id`
- tenant/internal IDs
- admin notes
- payment records
- audit logs
- email logs
- Meta CAPI secrets
- raw guest edit token hashes

---

### 5.4 Public Writes

Public form writes must go through:

```txt
Next.js Server Actions or Route Handlers
```

For v1, do not create broad anonymous base-table INSERT policies.

Public writes include:

- `/apply` application submission
- future RSVP response submission
- future guestbook submission

Rules:

- Validate with Zod on the server.
- Normalize email/phone/name on the server.
- Server resolves `client_id` and `event_id` where needed.
- Never trust client-submitted IDs or hidden fields.
- Public users must never set admin/server-only fields.

Admin/server-only fields include:

- `status`
- `client_id`
- `payment_status`
- `approved_client_id`
- `approved_event_id`
- `role`
- audit fields
- moderation fields
- payment confirmation fields
- timestamps controlled by workflow

---

### 5.5 Public Reads

Avoid direct anonymous base-table SELECT in v1.

Reason:

```txt
RLS is row-level, not column-level.
```

If an anonymous user can SELECT from a base table, any granted/selectable column in matching rows may be exposed.

Therefore public reads should use one of these controlled boundaries:

- server-built DTOs in route handlers
- public-safe database views/functions that expose only whitelisted fields

Public read surfaces:

- fallback RSVP page `/r/[eventSlug]`
- custom frontend public API routes

---

## 6. Public-Safe Field Whitelist

Public reads for fallback RSVP pages and custom frontend repos may include only approved display fields.

### Event fields allowed publicly

- `event_slug`
- `title`
- `event_type`
- `event_date`
- `event_time`
- `venue_name`
- `venue_address`
- `rsvp_open_at`
- `rsvp_close_at`

### Event content fields allowed publicly

- `hero_title`
- `hero_subtitle`
- `couple_or_celebrant_names`
- `event_story`
- `dress_code`
- `schedule_note`
- `venue_note`
- `rsvp_note`
- `gift_note`
- `contact_note`
- `content_json`

### Guestbook fields allowed publicly later

Only approved messages may be displayed.

- `guest_name`
- `message`
- `submitted_at`

### Gift wallet fields allowed publicly later

Only enabled wallet entries may be displayed.

- `wallet_type`
- `display_name`
- `account_name`
- `account_number`
- `qr_image_url`
- `instructions`

### Never expose publicly

- `client_id`
- tenant ID
- internal `event_id`, unless absolutely required
- payment records
- email logs
- audit logs
- admin notes
- review notes
- `repo_url`
- internal status fields not needed by the public UI
- encrypted tokens
- Meta CAPI access token
- raw edit token hash
- service-role-derived values

---

## 7. Database Design Principles

### 7.1 Multi-Tenant Structure

Every paying account is a client/tenant.

`clients.id` is the canonical tenant boundary. Tenant data must be isolated using `client_id`.

Platform admins may access all tenant data. Client users may access only their own `client_id` data. Public guests should access only public-safe event data by `event_slug` and only through controlled API/DTO/view boundaries.

---

### 7.2 UUID Primary Keys

Use UUID primary keys for all application tables.

Exception:

```txt
profiles.id references auth.users(id)
```

Reasons:

- avoids sequential ID enumeration
- works well with Supabase Auth
- compatible with future service extraction
- safe for distributed/back-end generated records

---

### 7.3 Timestamps

All tables should include:

```txt
created_at timestamptz default now()
```

Mutable tables should include:

```txt
updated_at timestamptz default now()
```

Workflow-specific timestamps should be added where meaningful:

- `submitted_at`
- `reviewed_at`
- `approved_at`
- `rejected_at`
- `paid_at`
- `published_at`
- `archived_at`
- `sent_at`

---

### 7.4 RLS from the Start

Enable RLS on all application tables.

Route guards are not enough. RLS must protect tenant data even if an app bug, UI bypass, or direct API call happens.

---

### 7.5 Service-Role Isolation

The service-role key bypasses RLS. It must only exist in server-only code.

Allowed service-role workflows:

- approve application
- provision client
- create profile/client user support records
- create draft RSVP event
- create event content row
- record manual payment
- write email logs
- write audit logs
- read encrypted Meta CAPI token

Forbidden:

- client components
- browser code
- custom frontend repos
- SSR user-cookie client mixed with service-role behavior

---

### 7.6 Audit Logging

Audit logs are required for important operational changes.

Audit these actions:

- application submitted
- application reviewed
- application approved/rejected
- payment confirmed
- client created
- draft event created
- onboarding email sent
- event published/archived
- guestbook message moderated later
- custom frontend connected later

Audit logs are append-only.

---

### 7.7 Soft Archive Over Hard Delete

Use status transitions instead of hard delete in production:

- `archived`
- `cancelled`
- `rejected`
- `disabled`
- `hidden`

Hard delete should be limited to local/test data or privacy/legal deletion requests.

---

## 8. Normalization Strategy

The schema follows 1NF, 2NF, and 3NF while allowing controlled denormalization only where it is clearly documented.

### 8.1 First Normal Form

Use separate rows for repeating concepts:

- each RSVP response is one row
- each guestbook message is one row
- each wallet entry is one row
- each email attempt is one row
- each audit event is one row

Avoid comma-separated lists or repeating columns.

`jsonb` is allowed only for structured, validated variable content such as:

- `event_content.content_json`
- future `rsvp_responses.custom_answers`
- `audit_logs.metadata`

These must be validated with Zod/service rules before writing.

---

### 8.2 Second Normal Form

All tables use single UUID primary keys, so partial key dependency is avoided.

The schema also follows the spirit of 2NF:

- application facts stay in `rsvp_applications`
- client facts stay in `clients`
- event facts stay in `rsvp_events`
- content facts stay in `event_content`
- payment facts stay in `payments`
- email attempts stay in `email_logs`
- audit events stay in `audit_logs`

---

### 8.3 Third Normal Form

Avoid transitive dependencies:

- client contact details stay in `clients`, not duplicated across events or payments
- event details stay in `rsvp_events` / `event_content`, not in responses
- payment status and amounts stay in `payments`, not in applications or clients
- logs live in log tables, not embedded in records they describe

Controlled duplication exists for hosting coverage dates:

- `payments` is the source of truth
- `clients` may mirror current hosting coverage for fast dashboard reads

This mirror must be updated only through the payment/provisioning service.

---

### 8.4 Controlled Denormalization Later

Future reporting optimizations may add denormalized tables or counters, but not during Phase 1 unless necessary.

Possible future denormalization:

- monthly sales summaries
- response count caches on events
- hosting status derived field on clients

Rules:

- document the source of truth
- update denormalized fields only through services
- never use denormalized values as final truth for payment/security decisions

---

## 9. Canonical Entity Flow

The database should support this flow:

```txt
Visitor submits application
→ rsvp_applications(status=submitted)

Admin reviews and confirms manual payment
→ rsvp_applications(status=approved)
→ payments(payment_status=paid)

System provisions client account
→ clients(status=active, plan_type=pro|max)
→ profiles(role=client_owner, linked to auth.users)

System creates draft event
→ rsvp_events(status=draft, event_slug generated)
→ event_content(empty row)

System sends onboarding email
→ email_logs
→ audit_logs

Client completes setup later
→ rsvp_events updated
→ event_content updated

Client publishes event later
→ rsvp_events(status=published, visibility=public)

Public RSVP later
→ rsvp_responses
→ guest_edit_tokens

Future custom frontend
→ custom_frontend_connections
→ public API by event_slug
```

---

## 10. Implementation Phases

### Phase 1 — Admin Approval Foundation

Implementation-ready after SQL plan approval.

Tables:

- `clients`
- `profiles`
- `rsvp_applications`
- `rsvp_events`
- `event_content`
- `payments` trimmed to manual/business fields
- `email_logs`
- `audit_logs`
- `meta_pixels`

Goal:

```txt
/apply submission
→ admin review
→ manual payment confirmation
→ client/profile provisioning
→ draft RSVP event creation
→ event_content row creation
→ onboarding email log
→ audit log
```

---

### Phase 2 — Client Dashboard Foundation

Deferred until Phase 1 is implemented and verified.

Future tables/extensions:

- `rsvp_responses`
- `guest_edit_tokens`
- `custom_frontend_connections`
- optional `event_page_sections`

Goal:

- client dashboard setup
- event/content editing
- custom frontend delivery tracking
- response monitoring foundation

---

### Phase 3 — Public RSVP and Add-ons

Deferred until Phase 2 is stable.

Future tables/features:

- active RSVP response submission
- guest edit/cancel token flow
- `guestbook_messages`
- `gift_wallets`
- optional `public_api_logs`
- optional Supabase Storage if QR upload is introduced

---

## 11. Remaining Open Questions

These do not block the trust-boundary corrections, but they should be resolved before or during the relevant phase.

1. **Plan price storage**  
   Should Pro/Max prices stay free-form in `payments`, or should a future `plan_catalog` table be added?

2. **Guest email requirement**  
   Should future RSVP guest email be required or optional?

3. **Guestbook default state**  
   Should guestbook be disabled by default and explicitly enabled by the client?

4. **QR image storage**  
   Should gift wallet QR use simple URL for v1 or Supabase Storage later?

5. **Hosting coverage mirror**  
   Confirm `payments` as source of truth and `clients` as convenience mirror.

6. **Guest data retention**  
   Draft target: retain guest RSVP/guestbook PII for 12 months after event completion/archive unless deletion is requested.

---

## 12. Deferred Features

Do not build these during Phase 1:

- Basic/Premium Basic template tiers
- subscription billing
- payment gateway
- `payment_transactions`
- NestJS backend extraction
- scheduled reminders
- guest login
- push notifications
- realtime dashboard updates
- seating chart
- QR photo upload
- LED display module
- wildcard subdomains
- `public_api_logs`
- `event_page_sections`
- Supabase Storage buckets
- `guestbook_messages`
- `gift_wallets`
- `rsvp_responses`
- `guest_edit_tokens`
- `custom_frontend_connections`

---

## 13. Codex Usage Rule

For Phase 1 SQL planning, Codex should use this file only as the scope and decision source. It should not write migrations until the Phase 1 SQL plan is reviewed.

Required Codex behavior:

```txt
Read this document.
Do not create migrations yet.
Do not modify Supabase.
Use locked decisions as constraints.
Prepare only the requested planning or implementation task.
```

---

_Not a migration file. Use for planning/review before SQL implementation._
