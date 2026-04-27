# WebSerbisyo RSVP Database Blueprint Ledger

**Version:** 1.0
**Date:** April 2026
**Status:** Planning Ledger — Review Before Migration
**Project:** `webserbisyo-rsvp` (standalone Next.js + Supabase, single app)

---

> **Important:** This document is the planning ledger, not the final SQL migration.
> Review all sections, answer the open questions, and get team sign-off before running any migration.
> Do not begin migration until Phase 1 is fully approved.

---

## Table of Contents

1. [Purpose](#1-purpose)
2. [Product and Architecture Context](#2-product-and-architecture-context)
3. [Scope Boundaries](#3-scope-boundaries)
4. [Database Design Principles](#4-database-design-principles)
5. [Normalization Strategy](#5-normalization-strategy)
6. [Core Entity Relationship Overview](#6-core-entity-relationship-overview)
7. [Table Groups](#7-table-groups)
8. [Status and Enum Strategy](#8-status-and-enum-strategy)
9. [Primary Key and Foreign Key Strategy](#9-primary-key-and-foreign-key-strategy)
10. [Row Level Security Strategy](#10-row-level-security-strategy)
11. [Indexing Recommendations](#11-indexing-recommendations)
12. [Security and Privacy Notes](#12-security-and-privacy-notes)
13. [Phased Implementation Plan](#13-phased-implementation-plan)
14. [Migration Sequencing](#14-migration-sequencing)
15. [Implementation Checklist](#15-implementation-checklist)
16. [Open Questions Before Migration](#16-open-questions-before-migration)
17. [Deferred Tables and Features](#17-deferred-tables-and-features)
18. [Service Boundary Map](#18-service-boundary-map)

---

## 1. Purpose

This document is the database blueprint ledger for the WebSerbisyo RSVP MVP. It defines the
planned schema structure, field-level decisions, normalization rationale, RLS strategy, indexing
recommendations, and phased implementation plan.

The goal is to design the database correctly before writing migrations, building UI pages, or
implementing business logic. This blueprint should directly guide:

- Supabase schema design and migration files
- Row Level Security (RLS) policies
- Server Actions and service layer functions
- Public API route handlers for custom frontend repos
- Future NestJS service extraction if needed

This is **not** the final SQL migration. It is the reviewed, signed-off planning document that
migrations will be written from.

---

## 2. Product and Architecture Context

### What WebSerbisyo RSVP Is

WebSerbisyo RSVP is a multi-tenant RSVP platform for event clients in the Philippines. The
central platform is a standalone Next.js application deployed on Vercel, backed by Supabase
for database, authentication, and Row Level Security.

**First launch supports Pro and Max packages only.** Basic and template-based tiers are
deferred until Pro and Max designs can be generalized into reusable templates.

### What the Central Platform Owns

- Admin dashboard: client management, application review, payment confirmation, Meta Pixel
- Client dashboard: event setup, page content, responses, guestbook, gift wallets
- Supabase backend: all data, auth, RLS policies, and server actions
- Public fallback RSVP page: `webserbisyo.com/r/[eventSlug]`
- Public RSVP API: endpoint set consumed by both the fallback page and custom frontend repos

### What Custom Frontend Repos Are

Custom frontend repos (built for Pro and Max clients) are **public design shells only**. They:

- Connect to the central backend using `event_slug` via public API routes
- Render the client's event design, RSVP form, guestbook section, and gift wallet display
- Do not own the database, auth, payments, admin dashboard, or client dashboard
- Must never receive `tenant_id` or `client_id` directly from the browser — the backend
  resolves tenant context server-side from `event_slug` only

### Technology Stack

| Layer                 | Technology                                         |
| --------------------- | -------------------------------------------------- |
| Application framework | Next.js 16 (App Router, TypeScript)                |
| Database and auth     | Supabase (PostgreSQL, Supabase Auth, RLS)          |
| Deployment            | Vercel                                             |
| Transactional email   | Resend                                             |
| Marketing tracking    | Meta Pixel (client-side) + Meta CAPI (server-side) |

---

## 3. Scope Boundaries

### In Scope for MVP (Phases 1–3)

- Public service landing page with application form
- Admin approval workflow: review, manual payment confirmation, client provisioning
- Client account and profile creation via Supabase Auth
- Draft RSVP event creation on approval
- Client dashboard: event setup, page content, responses, guestbook, gift wallets
- Fallback public RSVP page at `/r/[eventSlug]`
- Public RSVP submission (no guest login)
- Guest private edit/cancel via hashed edit token
- Guestbook submission and moderation
- Gift wallet display (client-managed details)
- Custom frontend connection tracking
- Meta Pixel (PageView, Lead) and optional Meta CAPI (Purchase)
- Email logs (Resend) and audit logs
- Manual payment records (Pro and Max one-time payments)
- Hosting coverage date tracking

### Deferred Features (Not in v1)

- Basic and Premium Basic template tiers
- Payment gateway (PayMongo, Stripe, Xendit)
- Subscription or recurring billing
- NestJS backend extraction
- Scheduled reminders (cron-based)
- Guest login or guest accounts
- Push notifications (dashboard or guest)
- Dashboard-level Supabase Realtime (can be added post-launch)
- Full seating chart manager
- Cloudinary or media upload manager
- QR photo upload (URLs only in v1)
- LED display module
- Advanced analytics or reporting charts
- Multi-event support per client (one event per client in v1 unless deliberately extended)
- Wildcard subdomain routing
- Public API rate-limit tables (planned, not built yet)

### Not Included

- POS tables or product catalog
- Subscription plan tables
- Old archived RSVP branch schema (clean rebuild only)
- Guest push subscription tables (v2+)
- SMS logs

---

## 4. Database Design Principles

### Multi-Tenant Structure

Every client account is a tenant. The table name remains `clients`, and `clients.id` is the
canonical tenant boundary for the multi-tenant RSVP system. Data is isolated at the
`client_id` level across all tables. No data should ever cross tenant boundaries unless
explicitly permitted by admin-level policy.

### UUID Primary Keys

All tables use `uuid` primary keys, generated via `gen_random_uuid()` or the Supabase default.
UUIDs are preferred over serial integers because:

- They do not expose row counts or insertion order to the public
- They are safe to generate client-side or service-side without collisions
- They are compatible with distributed systems and future NestJS extraction

### Timestamps

All tables include `created_at timestamptz default now()`. Most mutable tables also include
`updated_at timestamptz default now()`. Where meaningful, phase-specific timestamps are
added: `published_at`, `archived_at`, `paid_at`, `submitted_at`, `approved_at`, etc.

### Row Level Security

RLS is enabled on all tables from the start. Route guards in Next.js layouts are not
sufficient — database-level RLS is the safety net that protects tenant data even if application
code has a bug or is bypassed.

### Service Role Isolation

The Supabase service role key bypasses RLS. It must only be used inside server-only service
files (`lib/supabase/admin.ts`) and must never appear in browser code, client components, or
custom frontend repos. All provisioning, payment confirmation, and admin approval workflows
use the service role only through server-side code with `import "server-only"`.

### Audit Logging

Important admin and system actions must always write a row to `audit_logs`. This includes
application approval, client provisioning, payment confirmation, event publishing, and
guestbook moderation. Audit logs are append-only and must never be deleted.

### Soft Archive Over Hard Delete

Records should not be hard-deleted in production. Instead, use status transitions:
`archived`, `cancelled`, `rejected`, `disabled`. This preserves audit trails, prevents
accidental data loss, and supports future reporting.

### Public Data Separation

Public-facing data (event details, approved guestbook messages, gift wallet entries) must only
be exposed when the event `status = 'published'` and `visibility = 'public'`. Unpublished or
private events must never appear in public API responses, regardless of how the request is
constructed.

RLS is row-level, not column-level. Because of that, v1 should avoid direct anonymous
base-table `SELECT` on `rsvp_events`, `event_content`, `guestbook_messages`, and
`gift_wallets`. Public reads should be returned through public-safe API route DTOs or
public-safe database views/functions that expose only the whitelisted fields documented in
this ledger.

---

## 5. Normalization Strategy

The schema is designed to comply with First, Second, and Third Normal Form. Deviations are
only permitted under controlled circumstances and documented explicitly.

### First Normal Form (1NF)

**Rule:** Each column must contain atomic values. No repeating groups or comma-separated
lists within a single column.

**How this schema satisfies 1NF:**

- Each guest response is a **separate row** in `rsvp_responses`. Guest count is a numeric
  field, not a list.
- Each gift wallet entry is a **separate row** in `gift_wallets`. Multiple wallet types (GCash,
  Maya, bank transfer) each get their own record with `sort_order` for display ordering.
- Each guestbook message is a **separate row** in `guestbook_messages`.
- Each email attempt is a **separate row** in `email_logs`, including resends.
- Each audit event is a **separate row** in `audit_logs`.
- Structured but variable content (like entourage data, schedule blocks, or custom answers)
  is stored as `jsonb` with a defined shape documented in this ledger, not as free-form
  comma-separated strings.

**Where jsonb is used deliberately:**

Some fields use `jsonb` (`content_json`, `custom_answers`, `metadata`). This is acceptable in
1NF because the column itself is atomic at the row level — the internal structure is typed and
validated at the application layer via Zod schemas before writing. It is not a repeating-group
violation; it is a structured document field.

### Second Normal Form (2NF)

**Rule:** Every non-key attribute must depend on the **whole** primary key, not just part of it.

**How this schema satisfies 2NF:**

Since all primary keys are single-column UUIDs, partial dependency is not possible by
definition. However, the spirit of 2NF is enforced through proper table decomposition:

- `rsvp_applications` stores only application-time facts (what the applicant submitted).
  It does not store client account details — those live in `clients`.
- `rsvp_events` stores only event-level facts. It does not store the client's contact email —
  that lives in `clients`.
- `rsvp_responses` stores only what the guest submitted. It does not duplicate the event
  title or venue — those are joined from `rsvp_events`.
- `payments` stores payment-specific facts. It does not store the client's name —
  that lives in `clients`.
- `email_logs` stores email-specific facts. It does not store the full client profile —
  it references `client_id`.

### Third Normal Form (3NF)

**Rule:** No non-key attribute should depend on another non-key attribute (no transitive
dependencies).

**How this schema satisfies 3NF:**

- Client contact details live in `clients`, not duplicated across `rsvp_events`, `payments`,
  or `rsvp_responses`. Every table that needs the client name or email joins `clients`.
- Event details (title, venue, date) live in `rsvp_events` and `event_content`, not
  duplicated in `rsvp_responses` or `guestbook_messages`.
- Payment status and amounts live in `payments`, not in `clients` or `rsvp_applications`.
  The `clients` table only stores current package type and status, not payment history.
- Hosting coverage dates appear in both `payments` (as the record of what was paid) and
  `clients` (as the current derived coverage window). This is a controlled, intentional
  duplication — see the note on controlled denormalization below.
- Audit and email log data live in their own tables and are never embedded in the records
  they describe.

### Controlled Denormalization Later

Strict normalization is maintained for v1. As the product scales, selective denormalization
may be introduced for **reporting performance only**, with strict documentation:

- Materializing monthly sales totals in a `sales_summaries` table (instead of aggregating
  `payments` on every admin dashboard load).
- Caching `attending_count`, `not_attending_count`, and `maybe_count` as derived fields
  on `rsvp_events` to avoid full response table scans on the dashboard overview.
- Storing a `hosting_status` text field on `clients` derived from `hosting_ends_at` for
  fast dashboard queries, updated by a service on payment confirmation.

Any denormalization introduced later must be documented, kept in sync through the service
layer, and never relied upon as the source of truth for critical operations.

---

## 6. Core Entity Relationship Overview

The following describes the canonical data flow from initial interest through active client usage:

```
Visitor submits application
  → rsvp_applications (status: submitted)

Admin reviews and confirms manual payment
  → rsvp_applications (status: approved)
  → payments (payment_status: paid)

System provisions client account
  → clients (status: active, plan_type: pro|max)
  → profiles (role: client_owner, linked to auth.users)

System creates draft event
  → rsvp_events (status: draft, event_slug: auto-generated)
  → event_content (empty, ready for client to fill)

System sends onboarding email
  → email_logs (email_type: client_onboarding, status: sent|failed)
  → audit_logs (action: client_created, event_created, onboarding_email_sent)

Optional: Meta CAPI Purchase event fires
  → audit_logs (action: meta_capi_purchase_sent)

Client logs in and fills event details
  → rsvp_events (updated fields)
  → event_content (filled by client)

Client enables guestbook and gift wallets
  → guestbook_messages (controlled by client moderation)
  → gift_wallets (managed by client)

Developer creates custom frontend repo
  → custom_frontend_connections (status: in_progress → connected)
  → rsvp_events.custom_frontend_enabled = true

Client publishes event and shares link
  → rsvp_events (status: published, visibility: public)

Guests submit RSVPs
  → rsvp_responses (attendance_status: attending|not_attending|maybe)
  → guest_edit_tokens (token_hash stored, raw token sent to guest only once)

Guests submit guestbook messages
  → guestbook_messages (status: pending → approved|rejected|hidden)

Client monitors dashboard
  → rsvp_responses, guestbook_messages, gift_wallets, custom_frontend_connections
```

---

## 7. Table Groups

---

### Group 1: Authentication and Profiles

#### `profiles`

**Purpose:** Stores app-specific profile data for platform admins and client users, linked to
Supabase Auth `auth.users`.

**Phase:** 1

| Field        | Type                        | Notes                                               |
| ------------ | --------------------------- | --------------------------------------------------- |
| `id`         | `uuid` PK                   | References `auth.users(id)` — not an independent PK |
| `email`      | `text NOT NULL`             | Mirrors auth email; used for display and search     |
| `full_name`  | `text`                      | Display name                                        |
| `role`       | `text NOT NULL`             | `platform_admin`, `client_owner`, `client_staff`    |
| `client_id`  | `uuid` nullable             | FK → `clients(id)`. Null for platform admins.       |
| `is_active`  | `boolean DEFAULT true`      | Soft disable without deleting                       |
| `created_at` | `timestamptz DEFAULT now()` |                                                     |
| `updated_at` | `timestamptz DEFAULT now()` |                                                     |

**Role values:** `platform_admin` · `client_owner` · `client_staff` (reserved)

**Relationships:** One profile per auth user. One client can have multiple profiles (future
multi-seat support).

**Admin features:** View/manage all profiles, assign roles, deactivate users.

**Client features:** View own profile. Cannot change own role.

**RLS notes:**

- Platform admins: full read/write on all profiles.
- Client users: read their own row only, cannot update `role`, `client_id`, or `is_active`.
- Service role: creates profile rows during provisioning.
- Public users: no access.

**Implementation notes:** The `id` field matches `auth.users(id)` exactly. Profile rows are
created by the provisioning service using the service role client, not by the user themselves.

---

### Group 2: Clients

#### `clients`

**Purpose:** Represents a paying RSVP client account. This is the tenant boundary for all
multi-tenant data isolation.

**Phase:** 1

| Field                    | Type                             | Notes                                                                |
| ------------------------ | -------------------------------- | -------------------------------------------------------------------- |
| `id`                     | `uuid` PK                        |                                                                      |
| `name`                   | `text NOT NULL`                  | Client/event business name or couple name                            |
| `contact_name`           | `text`                           | Primary contact person                                               |
| `contact_email`          | `text NOT NULL`                  | Main email for communication                                         |
| `contact_phone`          | `text`                           | Optional phone                                                       |
| `status`                 | `text NOT NULL DEFAULT 'active'` | `active`, `paused`, `expired`, `archived`                            |
| `plan_type`              | `text NOT NULL`                  | `pro`, `max`                                                         |
| `hosting_starts_at`      | `timestamptz`                    | When hosting coverage begins                                         |
| `hosting_ends_at`        | `timestamptz`                    | When hosting coverage ends                                           |
| `renewal_required_at`    | `timestamptz`                    | When admin should follow up for renewal                              |
| `custom_frontend_status` | `text DEFAULT 'not_started'`     | `not_started`, `in_progress`, `connected`, `maintenance`, `disabled` |
| `custom_frontend_url`    | `text`                           | Live URL of connected custom site                                    |
| `notes`                  | `text`                           | Internal admin notes                                                 |
| `created_at`             | `timestamptz DEFAULT now()`      |                                                                      |
| `updated_at`             | `timestamptz DEFAULT now()`      |                                                                      |

**Relationships:** `clients.id` is the tenant boundary referenced by all tenant-scoped data.
V1 supports one active/non-archived RSVP event per client, while still allowing future archived
historical events if that becomes necessary. One client has one active payment record per
package cycle.

**Admin features:** Client list, hosting coverage tracking, custom frontend status, renewal monitoring.

**Client features:** Own dashboard, event management, scoped data access.

**RLS notes:**

- Platform admins: full read/write.
- Client users: read own row only. Cannot modify `status`, `plan_type`, or hosting fields.
- Service role: creates and updates during provisioning and payment confirmation.

**Implementation notes:** The table name remains `clients` for business clarity and will not
be renamed to `tenants`. `hosting_starts_at` and `hosting_ends_at` are duplicated from the
corresponding `payments` record as a convenience field for fast dashboard queries. The
`payments` table remains the source of truth.

---

### Group 3: Applications and Approval Workflow

#### `rsvp_applications`

**Purpose:** Stores all submitted applications from the public `/apply` form. This is the
lead record before a client account exists.

**Phase:** 1

| Field                   | Type                                | Notes                                                         |
| ----------------------- | ----------------------------------- | ------------------------------------------------------------- |
| `id`                    | `uuid` PK                           |                                                               |
| `full_name`             | `text NOT NULL`                     | Applicant's name                                              |
| `email`                 | `text NOT NULL`                     | Contact email                                                 |
| `phone`                 | `text`                              | Phone or Messenger                                            |
| `event_type`            | `text NOT NULL`                     | `wedding`, `debut`, `birthday`, `corporate`, `other`          |
| `event_date`            | `date`                              | Approximate event date from applicant                         |
| `event_location`        | `text`                              | Venue name or location from applicant                         |
| `preferred_plan`        | `text NOT NULL`                     | `pro`, `max`                                                  |
| `estimated_guest_count` | `integer`                           | Estimated guests                                              |
| `message`               | `text`                              | Optional message from applicant                               |
| `status`                | `text NOT NULL DEFAULT 'submitted'` | `submitted`, `reviewing`, `approved`, `rejected`, `cancelled` |
| `review_notes`          | `text`                              | Internal admin notes                                          |
| `approved_client_id`    | `uuid` nullable                     | FK → `clients(id)`. Set after approval.                       |
| `approved_event_id`     | `uuid` nullable                     | FK → `rsvp_events(id)`. Set after approval.                   |
| `submitted_at`          | `timestamptz DEFAULT now()`         |                                                               |
| `reviewed_at`           | `timestamptz`                       |                                                               |
| `approved_at`           | `timestamptz`                       |                                                               |
| `rejected_at`           | `timestamptz`                       |                                                               |
| `created_at`            | `timestamptz DEFAULT now()`         |                                                               |
| `updated_at`            | `timestamptz DEFAULT now()`         |                                                               |

**Security rule:** `status`, `review_notes`, `approved_client_id`, `approved_event_id`,
`reviewed_at`, `approved_at`, and `rejected_at` are **admin/service-only fields**. Public
submission must go through a Next.js Server Action or Route Handler backed by a server-only
service function. The public write path must never allow these fields to be set or updated.

**Admin features:** View, filter, review, approve, reject, convert to client + event.

**RLS notes:**

- Public submission goes through a server action or route handler only. In v1, do not use a
  broad anonymous base-table `INSERT` policy. Validate with Zod, honeypot, and rate limiting.
- If direct anonymous `INSERT` is ever introduced later, it must be extremely narrow and must
  not allow public users to set any admin/service-only fields.
- Platform admins: full read/write.
- Client users: no access.
- Service role: updates `approved_client_id`, `approved_event_id`, and status on approval.

---

### Group 4: RSVP Events

#### `rsvp_events`

**Purpose:** Represents a single RSVP event owned by a client. This is the central entity
that everything else hangs off.

**Phase:** 1 (structure), 2–3 (full usage)

| Field                     | Type                              | Notes                                                              |
| ------------------------- | --------------------------------- | ------------------------------------------------------------------ |
| `id`                      | `uuid` PK                         |                                                                    |
| `client_id`               | `uuid NOT NULL`                   | FK → `clients(id)`                                                 |
| `event_slug`              | `text UNIQUE NOT NULL`            | URL-safe identifier. Globally unique and immutable after creation. |
| `title`                   | `text NOT NULL`                   | Event title                                                        |
| `event_type`              | `text NOT NULL`                   | `wedding`, `debut`, `birthday`, `corporate`, `other`               |
| `event_date`              | `date`                            |                                                                    |
| `event_time`              | `time`                            |                                                                    |
| `venue_name`              | `text`                            |                                                                    |
| `venue_address`           | `text`                            |                                                                    |
| `status`                  | `text NOT NULL DEFAULT 'draft'`   | `draft`, `setup_in_progress`, `ready`, `published`, `archived`     |
| `visibility`              | `text NOT NULL DEFAULT 'private'` | `private`, `public`, `unlisted`                                    |
| `fallback_page_enabled`   | `boolean DEFAULT true`            | Whether `/r/[slug]` is live                                        |
| `custom_frontend_enabled` | `boolean DEFAULT false`           | Whether custom repo is the primary URL                             |
| `custom_frontend_url`     | `text`                            | URL of deployed custom frontend                                    |
| `rsvp_open_at`            | `timestamptz`                     | When RSVP form opens                                               |
| `rsvp_close_at`           | `timestamptz`                     | When RSVP form closes                                              |
| `max_guest_count`         | `integer`                         | Optional capacity cap                                              |
| `created_at`              | `timestamptz DEFAULT now()`       |                                                                    |
| `updated_at`              | `timestamptz DEFAULT now()`       |                                                                    |
| `published_at`            | `timestamptz`                     | Set when status changes to `published`                             |
| `archived_at`             | `timestamptz`                     | Set when status changes to `archived`                              |

**Relationships:** V1 supports one active/non-archived event per client. Archived historical
events may be retained later if needed. One `event_content` record per event. Many
`rsvp_responses`, `guestbook_messages`, and `gift_wallets` per event.

**Admin features:** View all events, monitor setup status, connect custom frontend, archive.

**Client features:** Edit event details, manage RSVP window, publish/unpublish.

**Public features:** `/r/[slug]` fallback page (when `status = published` and
`visibility = public`). Public API lookup is resolved by `event_slug` only.

**RLS notes:**

- Platform admins: full read/write.
- Client users: read/write own events only (matched by `client_id` via `profiles.client_id`).
- Public users: no direct anonymous base-table `SELECT` in v1. Public reads should flow
  through public-safe API route DTOs or public-safe database views/functions that expose only
  whitelisted fields for rows where `status = 'published'` AND `visibility = 'public'`.
- Service role: creates draft event row on approval.

**Implementation notes:** `event_slug` is enforced as globally unique at the database level.
The slug is auto-generated by the provisioning service from the client name and event type.
`event_slug` is immutable after creation and must never be user-editable, because public routes
and custom frontend repos resolve public event data through `event_slug`. During SQL planning,
prefer a partial unique index for "one active/non-archived event per client" if archived
historical rows should remain allowed later. A full unique constraint on `client_id` is only
appropriate if the system should forbid any second event row for a client, including archived
history.

---

### Group 5: Event Content

#### `event_content`

**Purpose:** Stores the editable content fields for the public RSVP page. One row per event.

**Phase:** 1 (created empty on approval), 2 (filled by client)

| Field                       | Type                        | Notes                                                           |
| --------------------------- | --------------------------- | --------------------------------------------------------------- |
| `id`                        | `uuid` PK                   |                                                                 |
| `event_id`                  | `uuid NOT NULL UNIQUE`      | FK → `rsvp_events(id)`. One-to-one.                             |
| `hero_title`                | `text`                      | Headline on the public page                                     |
| `hero_subtitle`             | `text`                      | Subheadline                                                     |
| `couple_or_celebrant_names` | `text`                      | Display names                                                   |
| `event_story`               | `text`                      | Narrative/story section                                         |
| `dress_code`                | `text`                      |                                                                 |
| `schedule_note`             | `text`                      | Plain text schedule description                                 |
| `venue_note`                | `text`                      | Directions, parking, etc.                                       |
| `rsvp_note`                 | `text`                      | Instructions for guests                                         |
| `gift_note`                 | `text`                      | Guidance on gifts                                               |
| `contact_note`              | `text`                      | Contact info for guests                                         |
| `theme_key`                 | `text`                      | Template/theme identifier (future)                              |
| `content_json`              | `jsonb DEFAULT '{}'`        | Structured content: entourage, schedule blocks, custom sections |
| `created_at`                | `timestamptz DEFAULT now()` |                                                                 |
| `updated_at`                | `timestamptz DEFAULT now()` |                                                                 |

**`content_json` schema (v1 documented shape):**

```json
{
  "entourage": [{ "sectionTitle": "Principal Sponsors", "members": ["Name 1", "Name 2"] }],
  "scheduleBlocks": [{ "time": "3:00 PM", "label": "Guest Arrival" }]
}
```

**Admin features:** View content completeness, assist with setup debugging.

**Client features:** Edit all content fields, prepare data for custom frontend.

**Public features:** Fallback RSVP page content. Public API data for custom frontend repos.

**RLS notes:** Same isolation as `rsvp_events`. Client users write their own event content.
In v1, avoid direct anonymous base-table `SELECT`. Public reads should be returned through
public-safe API DTOs or public-safe database views/functions tied to published public events.

#### Public-Safe Field Whitelist

Public reads for `/r/[slug]` and custom frontend repos must be restricted to a documented safe
subset of fields. These reads should be assembled by server-side DTOs or by public-safe
database views/functions, not by exposing raw base-table rows.

**Public-safe event fields:**

- `event_slug`
- `title`
- `event_type`
- `event_date`
- `event_time`
- `venue_name`
- `venue_address`
- `rsvp_open_at`
- `rsvp_close_at`

**Public-safe `event_content` fields:**

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

**Approved guestbook display fields later:**

- `guest_name`
- `message`
- `submitted_at`

**Enabled gift wallet display fields later:**

- `wallet_type`
- `display_name`
- `account_name`
- `account_number`
- `qr_image_url`
- `instructions`

**Never expose publicly:**

- `client_id`
- internal `event_id` unless absolutely required
- payment records
- email logs
- audit logs
- admin notes
- review notes
- `repo_url`
- service/internal status fields not needed by the public UI
- encrypted tokens
- Meta CAPI access token
- raw edit token hash

---

#### `event_page_sections` _(Deferred — Phase 3+)_

**Purpose:** More granular, sortable page sections for future template support.

| Field           | Type                        | Notes                                              |
| --------------- | --------------------------- | -------------------------------------------------- |
| `id`            | `uuid` PK                   |                                                    |
| `event_id`      | `uuid NOT NULL`             | FK → `rsvp_events(id)`                             |
| `section_type`  | `text NOT NULL`             | e.g. `entourage`, `schedule`, `gallery`, `message` |
| `title`         | `text`                      |                                                    |
| `body`          | `text`                      |                                                    |
| `media_url`     | `text`                      |                                                    |
| `sort_order`    | `integer DEFAULT 0`         |                                                    |
| `is_enabled`    | `boolean DEFAULT true`      |                                                    |
| `settings_json` | `jsonb DEFAULT '{}'`        | Section-specific config                            |
| `created_at`    | `timestamptz DEFAULT now()` |                                                    |
| `updated_at`    | `timestamptz DEFAULT now()` |                                                    |

Defer until custom website template features require it.

---

### Group 6: Payments and Hosting Coverage

#### `payments`

**Purpose:** Stores manual one-time Pro/Max payment business records for v1. Payment gateway
webhook/provider ledger data is deferred and does not belong in the Phase 1 `payments` table.

**Phase:** 1

| Field                 | Type                              | Notes                                                |
| --------------------- | --------------------------------- | ---------------------------------------------------- |
| `id`                  | `uuid` PK                         |                                                      |
| `client_id`           | `uuid`                            | FK → `clients(id)`                                   |
| `application_id`      | `uuid`                            | FK → `rsvp_applications(id)`                         |
| `event_id`            | `uuid`                            | FK → `rsvp_events(id)`                               |
| `plan_type`           | `text NOT NULL`                   | `pro`, `max`                                         |
| `amount_due`          | `numeric(12,2)`                   | Invoice amount                                       |
| `amount_paid`         | `numeric(12,2)`                   | Confirmed paid amount                                |
| `currency`            | `text DEFAULT 'PHP'`              |                                                      |
| `payment_status`      | `text NOT NULL DEFAULT 'pending'` | `pending`, `paid`, `failed`, `refunded`, `cancelled` |
| `payment_method`      | `text`                            | `gcash`, `bank_transfer`, `cash`, `maya`, `other`    |
| `reference_number`    | `text`                            | Client-provided receipt or reference                 |
| `paid_at`             | `timestamptz`                     | Set when admin confirms payment                      |
| `confirmed_by`        | `uuid`                            | FK → `profiles(id)`. Admin who confirmed.            |
| `hosting_starts_at`   | `timestamptz`                     | Coverage start date                                  |
| `hosting_ends_at`     | `timestamptz`                     | Coverage end date                                    |
| `renewal_required_at` | `timestamptz`                     | Renewal follow-up reminder date                      |
| `notes`               | `text`                            | Internal notes                                       |
| `created_at`          | `timestamptz DEFAULT now()`       |                                                      |
| `updated_at`          | `timestamptz DEFAULT now()`       |                                                      |

**Security rule:** `payment_status`, `paid_at`, `confirmed_by`, `hosting_starts_at`,
`hosting_ends_at`, `renewal_required_at`, and internal `notes` must only be written by
admin/service-role workflows. Client users have read-only access to their own payment records.

**Admin features:** Manual payment confirmation, sales summary, payment history, hosting
renewal tracking.

**Client features:** View own package and hosting coverage status (read only).

**Gateway-readiness note:** Keep `payments` as the canonical business payment record in v1.
When a gateway is introduced later, add a separate `payment_transactions` table for provider
and webhook details such as `provider`, `provider_payment_id`, `provider_checkout_id`,
`provider_event_id`, `external_reference`, `idempotency_key`, `webhook_received_at`,
`gateway_status`, and raw payload metadata (`raw_payload_json` / `metadata_json`).

**RLS notes:**

- Platform admins: full read/write.
- Client users: read own rows only. Cannot write any field.
- Service role: creates row on approval, updates `payment_status` and timestamps.

---

### Group 7: RSVP Responses

#### `rsvp_responses`

**Purpose:** Stores all guest RSVP submissions for an event.

**Phase:** 2 (structure), 3 (public writes active)

| Field               | Type                           | Notes                                                          |
| ------------------- | ------------------------------ | -------------------------------------------------------------- |
| `id`                | `uuid` PK                      |                                                                |
| `event_id`          | `uuid NOT NULL`                | FK → `rsvp_events(id)`                                         |
| `client_id`         | `uuid NOT NULL`                | FK → `clients(id)`. Denormalized from event for faster RLS.    |
| `guest_name`        | `text NOT NULL`                |                                                                |
| `guest_email`       | `text`                         | Optional in v1                                                 |
| `guest_phone`       | `text`                         | Optional                                                       |
| `attendance_status` | `text NOT NULL`                | `attending`, `not_attending`, `maybe`, `cancelled`             |
| `guest_count`       | `integer DEFAULT 1`            | Party size                                                     |
| `message`           | `text`                         | Optional guest message                                         |
| `meal_preference`   | `text`                         | Optional meal choice                                           |
| `custom_answers`    | `jsonb DEFAULT '{}'`           | Future: custom form questions                                  |
| `source`            | `text DEFAULT 'fallback_page'` | `fallback_page`, `custom_frontend`, `admin_manual`, `imported` |
| `submitted_at`      | `timestamptz DEFAULT now()`    |                                                                |
| `updated_at`        | `timestamptz DEFAULT now()`    |                                                                |
| `cancelled_at`      | `timestamptz`                  | Set when guest cancels                                         |

**Security rule:** Public submission is only allowed when the event is published and the RSVP
window is open. Submission must go through a Next.js Server Action or Route Handler backed by
a server-only service function. The server validates `event_id`, `status`, and
`rsvp_open_at`/`rsvp_close_at` before writing. `client_id` is resolved server-side from
`event_id` and is never accepted from the client.

**Admin features:** Monitor responses across all clients and events.

**Client features:** Response dashboard, guest list, attendance counts, filter by status.

**Public features:** RSVP form submission on fallback page and custom frontend.

**RLS notes:**

- Platform admins: full read on all.
- Client users: read own event responses only.
- Public users: no broad anonymous base-table `INSERT` policy in v1. Writes go through
  server-side validated actions/handlers only. No public `SELECT` on response data.
- If direct anonymous `INSERT` is ever introduced later, it must be extremely narrow and must
  not allow public users to set server/admin-only fields.
- Service role: used for admin manual entry.

---

#### `guest_edit_tokens`

**Purpose:** Allows guests to update or cancel their RSVP without login, using a private token
sent to them on submission.

**Phase:** 2–3

| Field         | Type                        | Notes                                                     |
| ------------- | --------------------------- | --------------------------------------------------------- |
| `id`          | `uuid` PK                   |                                                           |
| `response_id` | `uuid NOT NULL`             | FK → `rsvp_responses(id)`                                 |
| `event_id`    | `uuid NOT NULL`             | FK → `rsvp_events(id)`. Denormalized for faster lookup.   |
| `token_hash`  | `text NOT NULL`             | SHA-256 hash of the raw token. Raw token is never stored. |
| `expires_at`  | `timestamptz`               | Token expiry (e.g. 30 days after event date)              |
| `used_at`     | `timestamptz`               | Set when guest successfully uses the token                |
| `created_at`  | `timestamptz DEFAULT now()` |                                                           |

**Security rule:** The raw token is generated server-side, sent to the guest once (in the
success page URL and optionally via email), and immediately discarded. Only `token_hash` is
persisted. On verification, the server hashes the provided token and compares to `token_hash`.

**RLS notes:** No direct public access to this table. Token lookup goes through a server
action/route handler that handles hashing internally.

---

### Group 8: Guestbook

#### `guestbook_messages`

**Purpose:** Stores guestbook messages submitted by guests. All messages are moderated
before public display.

**Phase:** 3

| Field          | Type                              | Notes                                       |
| -------------- | --------------------------------- | ------------------------------------------- |
| `id`           | `uuid` PK                         |                                             |
| `event_id`     | `uuid NOT NULL`                   | FK → `rsvp_events(id)`                      |
| `client_id`    | `uuid NOT NULL`                   | FK → `clients(id)`. Denormalized for RLS.   |
| `guest_name`   | `text NOT NULL`                   |                                             |
| `message`      | `text NOT NULL`                   |                                             |
| `status`       | `text NOT NULL DEFAULT 'pending'` | `pending`, `approved`, `rejected`, `hidden` |
| `submitted_at` | `timestamptz DEFAULT now()`       |                                             |
| `approved_at`  | `timestamptz`                     | Set on approval                             |
| `rejected_at`  | `timestamptz`                     | Set on rejection                            |
| `moderated_by` | `uuid`                            | FK → `profiles(id)`. Who approved/rejected. |
| `created_at`   | `timestamptz DEFAULT now()`       |                                             |
| `updated_at`   | `timestamptz DEFAULT now()`       |                                             |

**Default behavior:** Messages default to `pending`. Only `approved` messages appear on
the public RSVP page. Clients cannot set messages directly to `approved` without the moderation
step.

**Admin features:** View all guestbook activity, assist with moderation issues.

**Client features:** View pending/approved/rejected messages, moderate own event's guestbook.

**Public features:** Submit message (saves as `pending`). View approved messages only.

**RLS notes:**

- Client users: read/update status on own event messages.
- Public: in v1, submission should go through a server action or route handler. Avoid broad
  anonymous base-table `INSERT`. Public display should be returned through DTOs or
  public-safe views/functions and limited to approved display fields only.

---

### Group 9: Gift Wallets

#### `gift_wallets`

**Purpose:** Stores client-managed digital wallet display details for the public RSVP page.
Does not process actual payments — display only.

**Phase:** 3

| Field            | Type                        | Notes                                           |
| ---------------- | --------------------------- | ----------------------------------------------- |
| `id`             | `uuid` PK                   |                                                 |
| `event_id`       | `uuid NOT NULL`             | FK → `rsvp_events(id)`                          |
| `client_id`      | `uuid NOT NULL`             | FK → `clients(id)`. Denormalized for RLS.       |
| `wallet_type`    | `text NOT NULL`             | `gcash`, `maya`, `bank_transfer`, `other`       |
| `display_name`   | `text`                      | Label shown to guests (e.g. "GCash")            |
| `account_name`   | `text`                      | Name on the account                             |
| `account_number` | `text`                      | Account number or phone number                  |
| `qr_image_url`   | `text`                      | URL to QR code image. Storage upload is future. |
| `instructions`   | `text`                      | Short instruction note for guests               |
| `is_enabled`     | `boolean DEFAULT false`     | Whether this entry is shown publicly            |
| `sort_order`     | `integer DEFAULT 0`         | Display order                                   |
| `created_at`     | `timestamptz DEFAULT now()` |                                                 |
| `updated_at`     | `timestamptz DEFAULT now()` |                                                 |

**Security rule:** This table never holds payment credentials or processing tokens. It is purely
a display configuration. `account_number` is a display string only (e.g. "09XX XXX XXXX").

**Public features:** Show enabled gift wallet entries on published RSVP pages.

**RLS notes:**

- Client users: full CRUD on own event gift wallets.
- Public: avoid direct anonymous base-table `SELECT` in v1. Public display should be returned
  through DTOs or public-safe views/functions and limited to enabled display fields only.

---

### Group 10: Custom Frontend Connections

#### `custom_frontend_connections`

**Purpose:** Tracks the delivery and connection status of custom Pro/Max frontend repos.

**Phase:** 2

| Field                  | Type                                  | Notes                                                                         |
| ---------------------- | ------------------------------------- | ----------------------------------------------------------------------------- |
| `id`                   | `uuid` PK                             |                                                                               |
| `event_id`             | `uuid NOT NULL`                       | FK → `rsvp_events(id)`                                                        |
| `client_id`            | `uuid NOT NULL`                       | FK → `clients(id)`                                                            |
| `event_slug`           | `text NOT NULL`                       | Denormalized slug for quick reference                                         |
| `frontend_url`         | `text`                                | Live deployment URL                                                           |
| `repo_url`             | `text`                                | GitHub/Git repo URL (admin-visible only)                                      |
| `deployment_provider`  | `text`                                | `vercel`, `netlify`, `other`                                                  |
| `status`               | `text NOT NULL DEFAULT 'not_started'` | `not_started`, `in_progress`, `connected`, `maintenance`, `disabled`, `error` |
| `last_connected_at`    | `timestamptz`                         | Last time a successful API call was detected                                  |
| `last_health_check_at` | `timestamptz`                         | Last health check timestamp                                                   |
| `notes`                | `text`                                | Internal delivery notes                                                       |
| `created_at`           | `timestamptz DEFAULT now()`           |                                                                               |
| `updated_at`           | `timestamptz DEFAULT now()`           |                                                                               |

**Admin features:** Track delivery pipeline, which clients have a live custom site, disable if
needed.

**Client features:** See status of their custom RSVP website. See fallback page as safety net.

**RLS notes:**

- Platform admins: full read/write.
- Client users: read own row only.
- `repo_url` should not be exposed to the client user — admin-visible only.

---

### Group 11: Meta Pixel and Marketing Tracking

#### `meta_pixels`

**Purpose:** Stores Meta Pixel configuration for the service landing page and optional
event-level tracking. CAPI access tokens are stored encrypted server-side.

**Phase:** 1

| Field                    | Type                               | Notes                                               |
| ------------------------ | ---------------------------------- | --------------------------------------------------- |
| `id`                     | `uuid` PK                          |                                                     |
| `client_id`              | `uuid` nullable                    | FK → `clients(id)`. Null for platform-level pixels. |
| `event_id`               | `uuid` nullable                    | FK → `rsvp_events(id)`. Null unless event-scoped.   |
| `pixel_id`               | `text NOT NULL`                    | Meta Pixel ID (safe to be public)                   |
| `access_token_encrypted` | `text`                             | CAPI access token — encrypted, server-only read     |
| `is_active`              | `boolean DEFAULT true`             | Enable/disable without deleting                     |
| `tracking_scope`         | `text NOT NULL DEFAULT 'platform'` | `platform`, `client`, `event`                       |
| `created_at`             | `timestamptz DEFAULT now()`        |                                                     |
| `updated_at`             | `timestamptz DEFAULT now()`        |                                                     |

**Tracking events:** `PageView` and `Lead` (client-side Pixel), `Purchase` (server-side CAPI,
optional, fires on manual approval).

**Security rule:** `access_token_encrypted` must only be decrypted inside server-only CAPI
service code. Never expose to browser or client dashboard.

**RLS notes:**

- Platform admins: full read/write.
- Client users: no access by default. Client-specific pixel is a future paid add-on.
- Service role: reads encrypted CAPI token during CAPI event dispatch.

---

### Group 12: Email Logs

#### `email_logs`

**Purpose:** Tracks every email sent by the system through Resend. Persists on failure so
admins can resend.

**Phase:** 1

| Field                 | Type                             | Notes                                   |
| --------------------- | -------------------------------- | --------------------------------------- |
| `id`                  | `uuid` PK                        |                                         |
| `client_id`           | `uuid` nullable                  | FK → `clients(id)`                      |
| `event_id`            | `uuid` nullable                  | FK → `rsvp_events(id)`                  |
| `application_id`      | `uuid` nullable                  | FK → `rsvp_applications(id)`            |
| `recipient_email`     | `text NOT NULL`                  |                                         |
| `recipient_name`      | `text`                           |                                         |
| `email_type`          | `text NOT NULL`                  | See values below                        |
| `provider`            | `text DEFAULT 'resend'`          |                                         |
| `provider_message_id` | `text`                           | Resend message ID for delivery tracking |
| `status`              | `text NOT NULL DEFAULT 'queued'` | `queued`, `sent`, `failed`, `skipped`   |
| `subject`             | `text`                           | Email subject line                      |
| `error_message`       | `text`                           | Populated on failure                    |
| `sent_at`             | `timestamptz`                    |                                         |
| `created_at`          | `timestamptz DEFAULT now()`      |                                         |
| `updated_at`          | `timestamptz DEFAULT now()`      |                                         |

**Email type values:** `application_received` · `application_approved` · `client_onboarding` ·
`payment_confirmed` · `rsvp_confirmation` · `guest_edit_link` · `renewal_reminder`

**Admin features:** Verify onboarding email delivery, debug failures, trigger resend.

**RLS notes:**

- Platform admins: full read/write.
- Client users: no access in v1. (Future: read own emails related to their events.)
- Service role: writes all email log rows.

---

### Group 13: Audit Logs

#### `audit_logs`

**Purpose:** Append-only log of all important system, admin, and client actions. Immutable.

**Phase:** 1

| Field           | Type                        | Notes                                                                   |
| --------------- | --------------------------- | ----------------------------------------------------------------------- |
| `id`            | `uuid` PK                   |                                                                         |
| `actor_user_id` | `uuid` nullable             | FK → `profiles(id)`. Null for system actions.                           |
| `client_id`     | `uuid` nullable             | FK → `clients(id)`                                                      |
| `event_id`      | `uuid` nullable             | FK → `rsvp_events(id)`                                                  |
| `entity_type`   | `text NOT NULL`             | `application`, `client`, `event`, `payment`, `email`, `guestbook`, etc. |
| `entity_id`     | `uuid`                      | The specific record affected                                            |
| `action`        | `text NOT NULL`             | See action values below                                                 |
| `metadata`      | `jsonb DEFAULT '{}'`        | Key context: old/new values, IDs, plan type                             |
| `ip_address`    | `text`                      | Hashed or truncated requester IP only if needed for abuse/debugging     |
| `user_agent`    | `text`                      |                                                                         |
| `created_at`    | `timestamptz DEFAULT now()` |                                                                         |

**Action values:** `application_submitted` · `application_reviewed` · `application_approved` ·
`application_rejected` · `payment_confirmed` · `client_created` · `event_created` ·
`event_published` · `event_archived` · `onboarding_email_sent` · `meta_capi_purchase_sent` ·
`custom_frontend_connected` · `guestbook_message_moderated`

**Security rule:** Audit logs must never be deleted or updated. They are insert-only.
Any action that provisions a client, confirms a payment, or changes a status must write to
this table.

**RLS notes:**

- Platform admins: read-only access to all rows.
- All other roles: no access.
- Service role: INSERT only. No UPDATE or DELETE policies.

---

### Group 14: Public API Logs

#### `public_api_logs` _(Deferred — Phase 3+)_

**Purpose:** Tracks public API usage by fallback pages and custom frontend repos. Useful
for debugging, abuse detection, and monitoring custom frontend health.

**Phase:** 3 (optional)

| Field           | Type                        | Notes                                            |
| --------------- | --------------------------- | ------------------------------------------------ |
| `id`            | `uuid` PK                   |                                                  |
| `event_id`      | `uuid` nullable             | FK → `rsvp_events(id)`                           |
| `client_id`     | `uuid` nullable             | FK → `clients(id)`                               |
| `event_slug`    | `text`                      | Denormalized for fast search                     |
| `path`          | `text`                      | Request path                                     |
| `method`        | `text`                      | HTTP method                                      |
| `status_code`   | `integer`                   | Response status                                  |
| `source`        | `text`                      | `fallback_page`, `custom_frontend`, `unknown`    |
| `ip_address`    | `text`                      | Hashed or truncated IP only after privacy review |
| `user_agent`    | `text`                      |                                                  |
| `error_message` | `text`                      | On error responses                               |
| `created_at`    | `timestamptz DEFAULT now()` |                                                  |

This table can be deferred until public API routes are built and traffic monitoring is needed.
Consider log rotation or partitioning by month if this table grows large.

---

## 8. Status and Enum Strategy

### Recommended Approach for MVP: Text + Check Constraints

PostgreSQL native `ENUM` types are avoided for MVP status fields. Instead, use `text` columns
with application-level validation (Zod schemas) and required database-level `CHECK`
constraints.

**Reasons:**

- PostgreSQL native ENUMs are hard to alter: adding a new value requires `ALTER TYPE`, which
  can cause migration complexity.
- `text` columns with documented allowed values are easier to extend as the product evolves.
- Zod schemas in `lib/validations/` act as the authoritative enum definition at the
  application layer.
- Required `CHECK` constraints provide database-level safety without locking in a PostgreSQL
  ENUM.

### Required Database-Level Constraints

Phase 1 SQL planning must include database-level constraints for:

- status values
- role values
- `plan_type`
- event `visibility`
- `payment_status`
- `currency`
- positive `amount_due`
- positive `amount_paid`
- `guest_count > 0` when responses are added later
- slug format for `event_slug`

### Status Value Reference

| Table                         | Field                    | Allowed Values                                                                |
| ----------------------------- | ------------------------ | ----------------------------------------------------------------------------- |
| `profiles`                    | `role`                   | `platform_admin`, `client_owner`, `client_staff`                              |
| `clients`                     | `status`                 | `active`, `paused`, `expired`, `archived`                                     |
| `clients`                     | `plan_type`              | `pro`, `max`                                                                  |
| `clients`                     | `custom_frontend_status` | `not_started`, `in_progress`, `connected`, `maintenance`, `disabled`          |
| `rsvp_applications`           | `status`                 | `submitted`, `reviewing`, `approved`, `rejected`, `cancelled`                 |
| `rsvp_events`                 | `status`                 | `draft`, `setup_in_progress`, `ready`, `published`, `archived`                |
| `rsvp_events`                 | `visibility`             | `private`, `public`, `unlisted`                                               |
| `payments`                    | `payment_status`         | `pending`, `paid`, `failed`, `refunded`, `cancelled`                          |
| `custom_frontend_connections` | `status`                 | `not_started`, `in_progress`, `connected`, `maintenance`, `disabled`, `error` |
| `rsvp_responses`              | `attendance_status`      | `attending`, `not_attending`, `maybe`, `cancelled`                            |
| `guestbook_messages`          | `status`                 | `pending`, `approved`, `rejected`, `hidden`                                   |
| `email_logs`                  | `status`                 | `queued`, `sent`, `failed`, `skipped`                                         |
| `meta_pixels`                 | `tracking_scope`         | `platform`, `client`, `event`                                                 |

### Lookup Tables (Future Only)

If the product evolves to support admin-configurable status values, dynamic plan types, or
event type customization, a `lookup_values` table can be introduced. This is not needed for v1.

---

## 9. Primary Key and Foreign Key Strategy

### Primary Keys

- All tables use `uuid` PKs generated with `gen_random_uuid()`.
- Exception: `profiles.id` references `auth.users(id)` directly as both PK and FK.
- UUIDs prevent enumeration attacks through public APIs (no sequential IDs exposed).

### Foreign Key Behavior

| Relationship                           | Delete Behavior | Reasoning                                              |
| -------------------------------------- | --------------- | ------------------------------------------------------ |
| `profiles` → `clients`                 | `SET NULL`      | Client can be archived without deleting admin profiles |
| `rsvp_applications` → `clients`        | `SET NULL`      | Application persists even if client is archived        |
| `rsvp_events` → `clients`              | `RESTRICT`      | Cannot delete a client with active events              |
| `event_content` → `rsvp_events`        | `CASCADE`       | Content is meaningless without its event               |
| `payments` → `clients`                 | `RESTRICT`      | Payment records must be preserved                      |
| `rsvp_responses` → `rsvp_events`       | `RESTRICT`      | Response data must be preserved                        |
| `guest_edit_tokens` → `rsvp_responses` | `CASCADE`       | Tokens are meaningless without their response          |
| `guestbook_messages` → `rsvp_events`   | `RESTRICT`      | Messages must be preserved                             |
| `gift_wallets` → `rsvp_events`         | `CASCADE`       | Wallet entries belong to the event                     |
| `audit_logs` → `profiles`              | `SET NULL`      | Logs must persist even if actor is deleted             |
| `audit_logs` → `clients`               | `SET NULL`      | Logs must persist even if client is archived           |
| `email_logs` → `clients`               | `SET NULL`      | Logs must persist                                      |

### Key Unique Constraints

- `rsvp_events.event_slug` — globally unique, enforced at the database level.
- `rsvp_events.event_slug` — immutable after creation.
- `rsvp_events.client_id` — during SQL planning, prefer a partial unique index that enforces
  one active/non-archived event per client if archived history should remain allowed.
- `event_content.event_id` — one-to-one relationship enforced via UNIQUE.
- `profiles.id` — unique by definition (matches `auth.users`).

---

## 10. Row Level Security Strategy

### Overview

RLS is enabled on **all tables** from Phase 1. Policies are written before any application code
uses the tables. Application-level route guards are a UX convenience, not a security boundary.

### Platform Admin

Platform admins (`profiles.role = 'platform_admin'`) can:

- Read and write all records across all tables.
- Manage applications, clients, events, payments, logs, and Meta Pixel configuration.
- Policy pattern: `USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'platform_admin'))`

### Client User

Client users (`profiles.role = 'client_owner'` or `client_staff`) can:

- Read and update only records where `client_id = (SELECT client_id FROM profiles WHERE id = auth.uid())`.
- Read their own profile row.
- Read/write their own events, event content, responses, guestbook messages, gift wallets.
- Read own payments (no write).
- Cannot access: other clients' data, `meta_pixels`, `audit_logs`, `email_logs`, or any
  admin-only fields.

### Public User (Unauthenticated)

Public users can:

- Submit `rsvp_applications` through a Next.js Server Action or Route Handler.
- Submit `rsvp_responses` through a Next.js Server Action or Route Handler for published
  events only.
- Submit `guestbook_messages` through a Next.js Server Action or Route Handler, saved as
  `pending`.
- Read public event data only through public-safe API DTOs or public-safe database
  views/functions keyed by `event_slug`.

Public users **cannot**:

- Set `client_id`, `status`, `payment_status`, or any admin/server-only field.
- Read unpublished event data.
- Access `profiles`, `clients`, `payments`, `audit_logs`, or `email_logs`.
- Receive `client_id`, `tenant_id`, or internal IDs from public APIs unless absolutely
  required.

### Public Read Safety Rule

RLS is row-level, not column-level. A permissive anonymous `SELECT` on a base table can expose
every selected column on rows that match the policy. For v1:

- Avoid direct anonymous base-table `SELECT` on `rsvp_events`, `event_content`,
  `guestbook_messages`, and `gift_wallets`.
- Return public event data through server-built DTOs or through public-safe database
  views/functions that expose only the whitelisted public fields.
- Keep `event_slug` as the only trusted public resolver for fallback pages and custom frontend
  repos.

### Service Role

The Supabase service role bypasses RLS entirely. It is only used for:

- Client and profile provisioning during approval.
- Payment record creation and status update.
- Audit log writes.
- Email log writes.
- Draft event creation on approval.
- Meta CAPI token reads.

The service role client (`lib/supabase/admin.ts`) must have `import "server-only"` at the top
and must never appear in browser code, client components, or custom frontend repos.

---

## 11. Indexing Recommendations

Index selectively. Over-indexing slows writes and increases storage. Add indexes only for
columns used in `WHERE`, `JOIN`, `ORDER BY`, or `DISTINCT` clauses on frequent queries.

### Phase 1 Indexes

```sql
-- Application lookup by status (admin applications list)
CREATE INDEX idx_rsvp_applications_status ON rsvp_applications(status);
CREATE INDEX idx_rsvp_applications_email ON rsvp_applications(email);

-- Client lookup
CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_clients_plan_type ON clients(plan_type);

-- Event lookup
CREATE UNIQUE INDEX idx_rsvp_events_event_slug ON rsvp_events(event_slug);
CREATE INDEX idx_rsvp_events_client_id ON rsvp_events(client_id);
CREATE INDEX idx_rsvp_events_status ON rsvp_events(status);

-- If archived history should remain allowed, prefer a partial unique index for one
-- active/non-archived event per client during SQL planning.
CREATE UNIQUE INDEX idx_rsvp_events_one_active_per_client
  ON rsvp_events(client_id)
  WHERE status <> 'archived';

-- Payments
CREATE INDEX idx_payments_client_id ON payments(client_id);
CREATE INDEX idx_payments_payment_status ON payments(payment_status);
CREATE INDEX idx_payments_paid_at ON payments(paid_at);

-- Audit logs
CREATE INDEX idx_audit_logs_client_id ON audit_logs(client_id);
CREATE INDEX idx_audit_logs_actor_user_id ON audit_logs(actor_user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Email logs
CREATE INDEX idx_email_logs_client_id ON email_logs(client_id);
CREATE INDEX idx_email_logs_status ON email_logs(status);
```

### Phase 2–3 Indexes

```sql
-- Responses
CREATE INDEX idx_rsvp_responses_event_id ON rsvp_responses(event_id);
CREATE INDEX idx_rsvp_responses_client_id ON rsvp_responses(client_id);
CREATE INDEX idx_rsvp_responses_attendance_status ON rsvp_responses(attendance_status);
CREATE INDEX idx_rsvp_responses_submitted_at ON rsvp_responses(submitted_at DESC);

-- Compound: common dashboard filter
CREATE INDEX idx_rsvp_responses_event_attendance
  ON rsvp_responses(event_id, attendance_status);

-- Guestbook
CREATE INDEX idx_guestbook_messages_event_id ON guestbook_messages(event_id);
CREATE INDEX idx_guestbook_messages_status ON guestbook_messages(status);

-- Gift wallets
CREATE INDEX idx_gift_wallets_event_id ON gift_wallets(event_id);

-- Guest edit tokens
CREATE INDEX idx_guest_edit_tokens_token_hash ON guest_edit_tokens(token_hash);
CREATE INDEX idx_guest_edit_tokens_response_id ON guest_edit_tokens(response_id);
```

---

## 12. Security and Privacy Notes

### Service Role Isolation

The `SUPABASE_SERVICE_ROLE_KEY` must only exist as a server environment variable. Files that
import it must use `import "server-only"`. Custom frontend repos must never receive this key.

### Guest Edit Token Security

- Generate tokens using a cryptographically secure random generator (e.g. `crypto.randomBytes`).
- Store only the SHA-256 hash of the token in `guest_edit_tokens.token_hash`.
- Send the raw token to the guest only once, in the success page URL.
- On verification, hash the provided token and compare to the stored hash.
- Never log the raw token. Never store it.

### Public API Boundaries

- Public API routes resolve tenant context from `event_slug` server-side.
- The `event_slug` is the only trusted public identifier.
- Never accept `client_id`, `event_id`, or `tenant_id` from a public request body.
- Do not expose `client_id`, payment records, email logs, audit logs, admin notes,
  review notes, `repo_url`, service/internal status fields not needed by the public UI,
  encrypted tokens, Meta CAPI access tokens, or raw edit token hashes.
- Prefer server-built DTOs or public-safe database views/functions over direct anonymous
  base-table reads.

### Payment Record Privacy

- Payment records contain only reference numbers and admin notes.
- No card numbers, full bank account numbers, or raw OTP data are ever stored.
- `reference_number` is a transaction reference provided by the client, not a payment credential.

### Meta CAPI Access Token

- `meta_pixels.access_token_encrypted` must be encrypted at rest.
- Only decrypted inside server-only CAPI service code.
- Never return this field in any client-facing query result.

### Personally Identifiable Information

- Guest names, emails, and phone numbers are collected and stored.
- A privacy notice must be displayed on the application form and the public RSVP form.
- Do not store raw IP addresses by default. If needed for abuse prevention or debugging, store
  hashed or truncated IP only.
- Guest RSVP and guestbook PII retention must be finalized before Phase 3. Draft direction:
  retain for 12 months after event archival or event completion unless deletion is requested
  earlier.

### Public API Log Privacy

`public_api_logs` is deferred and must receive a privacy review before Phase 3. If introduced,
it should follow the same hashed/truncated IP rule and avoid collecting unnecessary PII.

### Immutability Requirements

- `rsvp_events.event_slug` is immutable after creation.
- `audit_logs` is append-only and must never allow update or delete operations.
- Admin-only application fields in `rsvp_applications` must never be writable from the public
  submission path.
- Payment confirmation fields in `payments` must only be controlled by admin/service-side
  workflows.

### Idempotency for Provisioning

The admin approval service must be idempotent. If triggered twice for the same application:

- It must not create duplicate `clients`, `profiles`, or `rsvp_events` records.
- Use a unique constraint on `rsvp_applications.approved_client_id` or check existence
  before writing.

---

## 13. Phased Implementation Plan

### Phase 1: Admin Approval Foundation

**Goal:** A functioning admin portal that can receive applications, confirm payments manually,
provision client accounts, create draft events, send onboarding emails, and write audit records.

**Tables to create:**

- `profiles`
- `clients`
- `rsvp_applications`
- `rsvp_events`
- `event_content`
- `payments` (manual/business fields only)
- `email_logs`
- `audit_logs`
- `meta_pixels`

**Explicitly excluded from Phase 1:**

- `rsvp_responses`
- `guest_edit_tokens`
- `guestbook_messages`
- `gift_wallets`
- `custom_frontend_connections`
- `public_api_logs`
- `event_page_sections`
- `payment_transactions`

**Features supported:**

- Public application form → `rsvp_applications`
- Admin applications list with status filter
- Admin review, approve, reject workflow
- Client + profile provisioning on approval
- Draft event creation on approval
- Manual payment confirmation
- Onboarding email via Resend → `email_logs`
- Meta Pixel PageView/Lead on landing page
- Optional Meta CAPI Purchase on approval → `audit_logs`
- Admin sales summary (totals from `payments`)
- Audit log timeline

---

### Phase 2: Client Dashboard Foundation

**Goal:** A working client dashboard where clients can log in, configure their event, and
connect their custom frontend repo.

**Tables to add or extend:**

- `rsvp_responses` (structure ready, public writes locked until Phase 3)
- `guest_edit_tokens`
- `custom_frontend_connections`
- `event_page_sections` (optional, defer if not needed)

**Features supported:**

- Client login and dashboard access
- Event details editing
- Event content editing (`event_content`)
- Dashboard setup checklist
- Custom frontend connection tracking
- Fallback RSVP page at `/r/[eventSlug]` (reads from `event_content` and `rsvp_events`)
- Response monitoring (read-only view of `rsvp_responses`)
- Custom frontend enabled/disabled toggle

---

### Phase 3: Public RSVP and Add-ons

**Goal:** Live guest RSVP submission, guestbook, gift wallets, and public API for custom
frontend repos.

**Tables to add or activate:**

- `guestbook_messages`
- `gift_wallets`
- `public_api_logs` (optional)
- Supabase Storage buckets (if QR image upload is introduced)

**Features supported:**

- Public RSVP form submission → `rsvp_responses`
- Guest private edit/cancel → `guest_edit_tokens`
- Guestbook submission → `guestbook_messages`
- Guestbook moderation in client dashboard
- Gift wallet management in client dashboard
- Gift wallet display on public RSVP page
- Custom frontend public API (all `/api/public/events/[eventSlug]/*` routes active)
- Public API log monitoring

---

## 14. Migration Sequencing

Phase 1 SQL planning should follow this order. Do not combine batches until the previous batch
has been reviewed and verified locally.

1. Extensions, helpers, `updated_at` trigger, and `CHECK` helper decisions
2. `clients`
3. `profiles`
4. `rsvp_applications`
5. `rsvp_events`
6. `event_content`
7. `payments` (trimmed manual/business fields only)
8. `email_logs`
9. `audit_logs`
10. `meta_pixels`
11. Phase 1 indexes
12. Phase 1 RLS policies and grants
13. Platform admin seed only after the auth user exists
14. TypeScript database types generation

Phase 2 and Phase 3 migrations should only be planned after Phase 1 is implemented and
verified.

---

## 15. Implementation Checklist

Use this checklist to verify readiness before each phase goes live.

### Before Any Migration

- [ ] All open questions in Section 16 have been answered and decisions documented
- [ ] Database blueprint has been reviewed by the developer responsible for implementation
- [ ] Supabase project is created (development and production environments)
- [ ] `.env.local` is configured with correct Supabase URL, anon key, and service role key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is confirmed as server-only (never in browser code)

### Phase 1 Checklist

- [ ] `profiles` table created with correct RLS policies
- [ ] `clients` table created
- [ ] `rsvp_applications` table created with server-side validated public submission path and no broad anon base-table `INSERT`
- [ ] `rsvp_events` table created with unique `event_slug` constraint
- [ ] `event_content` table created (one-to-one with `rsvp_events`)
- [ ] `payments` table created with trimmed manual/business fields only
- [ ] `email_logs` table created
- [ ] `audit_logs` table created with insert-only policy
- [ ] `meta_pixels` table created with admin-only policy
- [ ] All Phase 1 RLS policies tested (admin access, client access, public access)
- [ ] Platform admin seed profile created
- [ ] Application form server action validates and inserts without allowing admin fields
- [ ] Approval service is idempotent (safe to run twice without duplicating records)
- [ ] Onboarding email writes to `email_logs` on both success and failure
- [ ] All approval, provisioning, and payment actions write to `audit_logs`
- [ ] TypeScript database types generated: `npm run db:types`
- [ ] All Zod schemas created for Phase 1 tables

### Phase 2 Checklist

- [ ] `rsvp_responses` table created, public INSERT locked until Phase 3
- [ ] `guest_edit_tokens` table created (token_hash only, never raw token)
- [ ] `custom_frontend_connections` table created
- [ ] Client dashboard reads from `rsvp_events` and `event_content` correctly
- [ ] RLS confirmed: client can only see own event data

### Phase 3 Checklist

- [ ] `guestbook_messages` table created with `pending` default and server-side validated public submission path
- [ ] `gift_wallets` table created with public-safe DTO/view reads for enabled entries
- [ ] Public API routes active for all `/api/public/events/[eventSlug]/*` endpoints
- [ ] `event_slug` validation confirmed on every public API request
- [ ] Public-safe field whitelist enforced for fallback page and custom frontend reads
- [ ] Edit token verification tested: expired token rejected, used token rejected
- [ ] Guestbook moderation flow tested end-to-end
- [ ] Full RLS audit: test each table with a non-admin, non-client user
- [ ] No service role key accessible from browser network tab on any page

---

## 16. Open Questions Before Migration

Answer each remaining question before finalizing the migrations.

1. **Plan price storage:** Should plan prices (`pro_price`, `max_price`) be stored in `payments`
   as free-form values only, or should a `plans` catalog table be introduced later for formal
   price management? Decision affects Sales Summary queries.

2. **Guest email requirement:** Should `rsvp_responses.guest_email` be required or optional?
   Required email enables future RSVP confirmation emails but adds friction for guests.

3. **Guestbook default state:** Should guestbook be `disabled` by default and the client
   explicitly enables it, or `enabled` by default? Disabled by default is safer for moderation.

4. **QR image storage:** Should `gift_wallets.qr_image_url` point to a Supabase Storage URL
   from launch, or should v1 accept any URL (client pastes a link from their phone)? Supabase
   Storage adds complexity. Simple URL field is faster to ship.

5. **Hosting coverage tracking:** Should hosting dates be tracked on `clients` only (for fast
   dashboard reads) or only on `payments` (single source of truth)? Current plan: `payments`
   is the source of truth, `clients` mirrors the dates as a convenience field.

6. **Data retention policy:** Is the draft retention target of 12 months after event archival
   or event completion acceptable for `rsvp_responses` and `guestbook_messages`, and what is
   the deletion-request process?

---

## 17. Deferred Tables and Features

These items are documented here so they do not get built prematurely but are not forgotten.

| Item                                | Reason Deferred                  | Notes                                                                                                                                                                  |
| ----------------------------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `event_page_sections`               | Template engine not needed in v1 | Defer until custom frontend templates require structured sections                                                                                                      |
| `public_api_logs`                   | Not critical for Phase 1–2       | Add when custom frontend repos are live and only after privacy review                                                                                                  |
| `push_subscriptions`                | No push in v1                    | Future: opt-in dashboard push for new responses and guestbook messages                                                                                                 |
| `plan_catalog`                      | Prices managed manually in v1    | Future: if pricing tiers become configurable or automated                                                                                                              |
| `rsvp_guests` (preloaded)           | No private invite lists in v1    | Future Max: import guest list, private invite links, QR check-in                                                                                                       |
| `rsvp_guest_assignments` (seating)  | No seating chart in v1           | Future Max: simple table assignment without drag-and-drop                                                                                                              |
| `marketing_event_logs`              | CAPI is optional in v1           | Future: dedicated CAPI event tracking table if CAPI becomes critical                                                                                                   |
| `domain_mappings`                   | Wildcard subdomains not in v1    | Future: `[slug].webserbisyo.com` routing                                                                                                                               |
| `reminder_logs`                     | No scheduled reminders in v1     | Future: RSVP deadline reminders, hosting renewal reminders                                                                                                             |
| Supabase Storage buckets            | No media upload in v1            | Future: QR image upload, event photo sections                                                                                                                          |
| Basic/Premium Basic template tables | No templates in v1               | Future: after Pro/Max designs are generalized                                                                                                                          |
| `payment_transactions`              | No gateway in v1                 | Future: dedicated gateway transaction ledger for provider fields, webhook event IDs, idempotency keys, gateway statuses, and raw payload metadata alongside `payments` |

---

## 18. Service Boundary Map

The following service boundaries are defined now even though all services live inside the
Next.js `server/services/` directory in v1. These boundaries exist so that if traffic, background
jobs, webhooks, scheduled reminders, guest login, or multi-product complexity grows, individual
services can be extracted into NestJS modules without redesigning the database.

**Rule for all service files:** No React imports. No Next.js-specific code. Accept a Supabase
client as a parameter. Return typed results. All side effects (email, CAPI, audit logs) happen
inside the service, not in route handlers or actions.

| Service File                    | NestJS Module (Future)               | Tables Used                           |
| ------------------------------- | ------------------------------------ | ------------------------------------- |
| `provision-client.ts`           | `ClientsModule / ClientsService`     | `clients`                             |
| `create-client-user.ts`         | `AuthModule / ClientAuthService`     | `profiles`, `auth.users`              |
| `record-one-time-payment.ts`    | `PaymentsModule / PaymentsService`   | `payments`                            |
| `create-draft-event.ts`         | `RsvpModule / EventsService`         | `rsvp_events`, `event_content`        |
| `send-onboarding-email.ts`      | `EmailModule / EmailService`         | `email_logs`                          |
| `send-meta-capi-purchase.ts`    | `MarketingModule / MetaCapiService`  | `meta_pixels`, `audit_logs`           |
| `submit-rsvp-response.ts`       | `RsvpModule / RsvpService`           | `rsvp_responses`, `guest_edit_tokens` |
| `update-response-by-token.ts`   | `RsvpModule / RsvpService`           | `rsvp_responses`, `guest_edit_tokens` |
| `submit-guestbook-message.ts`   | `GuestbookModule / GuestbookService` | `guestbook_messages`                  |
| `resolve-public-event.ts`       | `RsvpModule / PublicRsvpService`     | `rsvp_events`, `event_content`        |
| `create-edit-token.ts`          | `RsvpModule / TokenService`          | `guest_edit_tokens`                   |
| `moderate-guestbook-message.ts` | `GuestbookModule / GuestbookService` | `guestbook_messages`, `audit_logs`    |

**Future NestJS Modules:**

```
AuthModule            — Admin + client auth, magic links, session management
ClientsModule         — Client account provisioning, hosting coverage
ApplicationsModule    — Application intake, review, approval workflow
PaymentsModule        — Manual payment records, future gateway webhook handling
RsvpModule            — Events, content, responses, tokens, public API
GuestbookModule       — Guestbook submission, moderation, public display
GiftWalletsModule     — Gift wallet CRUD, public display
EmailModule           — Resend transactional emails, logs, resend support
MarketingModule       — Meta Pixel config, CAPI events, marketing logs
NotificationsModule   — Push subscriptions, notification dispatch
RemindersModule       — Scheduled reminders via cron (hosting, RSVP deadline)
WebhooksModule        — Payment gateway webhook validation and processing
```

---

_End of WebSerbisyo RSVP Database Blueprint Ledger — Version 1.0_

_Review all remaining open questions before writing migrations._
_Do not begin Phase 1 migrations until this document is approved._
