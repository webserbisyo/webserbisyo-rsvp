# 02 — Phase 1 Schema, Constraints, Indexes, and Migration Order

**Project:** `webserbisyo-rsvp`  
**Status:** Planning document, not a migration file  
**Use:** Give this to Codex when asking for a Phase 1 SQL migration plan.

---

## 1. Purpose

This document isolates the Phase 1 database implementation scope for the WebSerbisyo RSVP MVP.

It covers:

- Phase 1 tables only
- fields per table
- primary keys and foreign keys
- status/check constraints
- immutability rules
- indexes
- migration order

This file intentionally excludes Phase 2/3 tables except as deferred references.

---

## 2. Phase 1 Scope

Phase 1 goal:

```txt
Public application submission
→ admin review
→ manual payment confirmation
→ client/profile provisioning
→ draft RSVP event creation
→ event_content row creation
→ onboarding email log
→ audit log
```

Phase 1 tables:

1. `clients`
2. `profiles`
3. `rsvp_applications`
4. `rsvp_events`
5. `event_content`
6. `payments` trimmed to manual/business fields
7. `email_logs`
8. `audit_logs`
9. `meta_pixels`

Explicitly excluded from Phase 1:

- `rsvp_responses`
- `guest_edit_tokens`
- `guestbook_messages`
- `gift_wallets`
- `custom_frontend_connections`
- `public_api_logs`
- `event_page_sections`
- `payment_transactions`

---

## 3. Phase 1 Migration Order

Recommended SQL planning order:

1. Extensions, helper functions, `updated_at` trigger, and check helper decisions
2. `clients`
3. `profiles`
4. `rsvp_applications`
5. `rsvp_events`
6. `event_content`
7. `payments` trimmed to manual/business fields only
8. `email_logs`
9. `audit_logs`
10. `meta_pixels`
11. Phase 1 indexes
12. Phase 1 RLS policies and grants
13. Platform admin seed only after the auth user exists
14. TypeScript database type generation

Phase 2 and Phase 3 migrations must wait until Phase 1 is implemented and verified.

---

## 4. Shared Table Conventions

### 4.1 IDs

Use UUID primary keys.

Exception:

```txt
profiles.id references auth.users(id)
```

### 4.2 Timestamps

All Phase 1 tables should include:

```txt
created_at timestamptz default now()
```

Mutable tables should include:

```txt
updated_at timestamptz default now()
```

Use a shared `updated_at` trigger if appropriate.

### 4.3 Status fields

Use `text` with required database-level `CHECK` constraints, not PostgreSQL enum types.

Reason:

- easier to evolve during MVP
- still safe with check constraints
- matches Zod application validation

### 4.4 Currency and amounts

Use:

```txt
currency text default 'PHP'
amount_due numeric(12,2)
amount_paid numeric(12,2)
```

Amounts must be non-negative. Confirm whether zero is valid for draft/pending records.

---

## 5. Table: `clients`

### Purpose

Represents a paying RSVP client account. `clients.id` is the canonical tenant boundary.

### Fields

| Field                    | Type                             | Notes                                           |
| ------------------------ | -------------------------------- | ----------------------------------------------- |
| `id`                     | `uuid` PK                        | generated                                       |
| `name`                   | `text not null`                  | business/couple/client display name             |
| `contact_name`           | `text`                           | primary contact                                 |
| `contact_email`          | `text not null`                  | main contact email                              |
| `contact_phone`          | `text`                           | optional                                        |
| `status`                 | `text not null default 'active'` | check constraint                                |
| `plan_type`              | `text not null`                  | `pro` or `max`                                  |
| `hosting_starts_at`      | `timestamptz`                    | mirrored from payment for dashboard convenience |
| `hosting_ends_at`        | `timestamptz`                    | mirrored from payment for dashboard convenience |
| `renewal_required_at`    | `timestamptz`                    | follow-up date                                  |
| `custom_frontend_status` | `text default 'not_started'`     | delivery status                                 |
| `custom_frontend_url`    | `text`                           | live custom site URL                            |
| `notes`                  | `text`                           | internal admin notes                            |
| `created_at`             | `timestamptz default now()`      |                                                 |
| `updated_at`             | `timestamptz default now()`      |                                                 |

### Check constraints

- `status in ('active','paused','expired','archived')`
- `plan_type in ('pro','max')`
- `custom_frontend_status in ('not_started','in_progress','connected','maintenance','disabled')`
- if both hosting dates exist, `hosting_ends_at >= hosting_starts_at`

### Indexes

- `clients(status)`
- `clients(plan_type)`
- consider normalized/lowercase email index for `contact_email`

### Notes

`payments` remains the source of truth for payment/coverage. `clients` may mirror current hosting coverage for fast dashboard reads, but that mirror must be updated only by service workflows.

---

## 6. Table: `profiles`

### Purpose

Stores app-specific profile data for Supabase Auth users.

### Fields

| Field        | Type                                             | Notes                    |
| ------------ | ------------------------------------------------ | ------------------------ |
| `id`         | `uuid` PK/FK to `auth.users(id)`                 | exact auth user ID       |
| `email`      | `text not null`                                  | display/search mirror    |
| `full_name`  | `text`                                           | display name             |
| `role`       | `text not null`                                  | platform/client role     |
| `client_id`  | `uuid references clients(id) on delete set null` | null for platform admins |
| `is_active`  | `boolean default true`                           | soft disable             |
| `created_at` | `timestamptz default now()`                      |                          |
| `updated_at` | `timestamptz default now()`                      |                          |

### Check constraints

- `role in ('platform_admin','client_owner','client_staff')`

### Indexes

- `profiles(client_id)`
- `profiles(role)`
- consider normalized/lowercase email index

### Notes

Profile rows are created by server-side provisioning, not self-created from the browser.

---

## 7. Table: `rsvp_applications`

### Purpose

Stores application leads from `/apply` before a client account exists.

### Fields

| Field                   | Type                                                 | Notes              |
| ----------------------- | ---------------------------------------------------- | ------------------ |
| `id`                    | `uuid` PK                                            | generated          |
| `full_name`             | `text not null`                                      | applicant          |
| `email`                 | `text not null`                                      | applicant email    |
| `phone`                 | `text`                                               | phone/Messenger    |
| `event_type`            | `text not null`                                      | event category     |
| `event_date`            | `date`                                               | approximate        |
| `event_location`        | `text`                                               | venue/location     |
| `preferred_plan`        | `text not null`                                      | `pro` or `max`     |
| `estimated_guest_count` | `integer`                                            | optional estimate  |
| `message`               | `text`                                               | optional           |
| `status`                | `text not null default 'submitted'`                  | workflow status    |
| `review_notes`          | `text`                                               | admin-only         |
| `approved_client_id`    | `uuid references clients(id) on delete set null`     | set after approval |
| `approved_event_id`     | `uuid references rsvp_events(id) on delete set null` | set after approval |
| `submitted_at`          | `timestamptz default now()`                          |                    |
| `reviewed_at`           | `timestamptz`                                        | admin workflow     |
| `approved_at`           | `timestamptz`                                        | admin workflow     |
| `rejected_at`           | `timestamptz`                                        | admin workflow     |
| `created_at`            | `timestamptz default now()`                          |                    |
| `updated_at`            | `timestamptz default now()`                          |                    |

### Check constraints

- `preferred_plan in ('pro','max')`
- `status in ('submitted','reviewing','approved','rejected','cancelled')`
- `estimated_guest_count is null or estimated_guest_count > 0`
- event type values should match product-supported event types

Suggested event types:

```txt
wedding, debut, birthday, baptism, reunion, anniversary, corporate, other
```

### Indexes

- `rsvp_applications(status)`
- `rsvp_applications(email)`
- consider partial index for pending/reviewing applications
- consider `rsvp_applications(created_at desc)` or `submitted_at desc`

### Admin-only fields

These must not be set by public submission paths:

- `status`, except default submitted
- `review_notes`
- `approved_client_id`
- `approved_event_id`
- `reviewed_at`
- `approved_at`
- `rejected_at`

---

## 8. Table: `rsvp_events`

### Purpose

Represents one RSVP event owned by a client.

### Fields

| Field                     | Type                                   | Notes                      |
| ------------------------- | -------------------------------------- | -------------------------- |
| `id`                      | `uuid` PK                              | generated                  |
| `client_id`               | `uuid not null references clients(id)` | tenant owner               |
| `event_slug`              | `text unique not null`                 | public resolver, immutable |
| `title`                   | `text not null`                        | event title                |
| `event_type`              | `text not null`                        | event category             |
| `event_date`              | `date`                                 | optional until setup       |
| `event_time`              | `time`                                 | optional until setup       |
| `venue_name`              | `text`                                 | optional                   |
| `venue_address`           | `text`                                 | optional                   |
| `status`                  | `text not null default 'draft'`        | event workflow             |
| `visibility`              | `text not null default 'private'`      | public visibility          |
| `fallback_page_enabled`   | `boolean default true`                 | fallback route             |
| `custom_frontend_enabled` | `boolean default false`                | future custom shell        |
| `custom_frontend_url`     | `text`                                 | future live URL            |
| `rsvp_open_at`            | `timestamptz`                          | future public RSVP         |
| `rsvp_close_at`           | `timestamptz`                          | future public RSVP         |
| `max_guest_count`         | `integer`                              | optional capacity          |
| `created_at`              | `timestamptz default now()`            |                            |
| `updated_at`              | `timestamptz default now()`            |                            |
| `published_at`            | `timestamptz`                          | set on publish             |
| `archived_at`             | `timestamptz`                          | set on archive             |

### Check constraints

- `status in ('draft','setup_in_progress','ready','published','archived')`
- `visibility in ('private','public','unlisted')`
- `max_guest_count is null or max_guest_count > 0`
- if both RSVP dates exist, `rsvp_close_at >= rsvp_open_at`
- `event_slug` matches URL-safe slug format

Suggested slug format:

```txt
lowercase letters, numbers, hyphens only
```

### Unique constraints / indexes

- unique index on `event_slug`
- index on `client_id`
- index on `status`
- partial unique index for one active/non-archived event per client if archived history should remain allowed

### Immutability

`event_slug` is immutable after creation.

SQL planning should include either:

- trigger protection for slug updates, or
- strict service/policy design preventing updates

Trigger protection is safer.

---

## 9. Table: `event_content`

### Purpose

Stores editable public-facing content for one RSVP event.

### Fields

| Field                       | Type                                                                | Notes                 |
| --------------------------- | ------------------------------------------------------------------- | --------------------- |
| `id`                        | `uuid` PK                                                           | generated             |
| `event_id`                  | `uuid not null unique references rsvp_events(id) on delete cascade` | one-to-one            |
| `hero_title`                | `text`                                                              | public heading        |
| `hero_subtitle`             | `text`                                                              | public subheading     |
| `couple_or_celebrant_names` | `text`                                                              | display names         |
| `event_story`               | `text`                                                              | narrative             |
| `dress_code`                | `text`                                                              | optional              |
| `schedule_note`             | `text`                                                              | optional              |
| `venue_note`                | `text`                                                              | optional              |
| `rsvp_note`                 | `text`                                                              | optional              |
| `gift_note`                 | `text`                                                              | optional              |
| `contact_note`              | `text`                                                              | optional              |
| `theme_key`                 | `text`                                                              | future template/theme |
| `content_json`              | `jsonb default '{}'`                                                | structured content    |
| `created_at`                | `timestamptz default now()`                                         |                       |
| `updated_at`                | `timestamptz default now()`                                         |                       |

### Constraints

- `event_id` unique
- `content_json` default object

### Notes

Public reads should never expose raw base-table rows. Use route handler DTOs or public-safe views/functions.

---

## 10. Table: `payments`

### Purpose

Stores v1 manual Pro/Max business payment records.

Gateway/provider/webhook ledger fields are deferred to future `payment_transactions`.

### Fields

| Field                 | Type                                    | Notes                          |
| --------------------- | --------------------------------------- | ------------------------------ |
| `id`                  | `uuid` PK                               | generated                      |
| `client_id`           | `uuid references clients(id) restrict`  | paying client                  |
| `application_id`      | `uuid references rsvp_applications(id)` | source application             |
| `event_id`            | `uuid references rsvp_events(id)`       | related event                  |
| `plan_type`           | `text not null`                         | `pro` or `max`                 |
| `amount_due`          | `numeric(12,2)`                         | manual invoice amount          |
| `amount_paid`         | `numeric(12,2)`                         | confirmed amount               |
| `currency`            | `text default 'PHP'`                    | currency                       |
| `payment_status`      | `text not null default 'pending'`       | workflow                       |
| `payment_method`      | `text`                                  | GCash, bank, cash, Maya, other |
| `reference_number`    | `text`                                  | manual payment reference       |
| `paid_at`             | `timestamptz`                           | admin confirmation timestamp   |
| `confirmed_by`        | `uuid references profiles(id)`          | platform admin                 |
| `hosting_starts_at`   | `timestamptz`                           | coverage start                 |
| `hosting_ends_at`     | `timestamptz`                           | coverage end                   |
| `renewal_required_at` | `timestamptz`                           | follow-up date                 |
| `notes`               | `text`                                  | internal admin notes           |
| `created_at`          | `timestamptz default now()`             |                                |
| `updated_at`          | `timestamptz default now()`             |                                |

### Check constraints

- `plan_type in ('pro','max')`
- `payment_status in ('pending','paid','failed','refunded','cancelled')`
- `currency = 'PHP'` for v1, or approved currency list
- `amount_due is null or amount_due >= 0`
- `amount_paid is null or amount_paid >= 0`
- if both hosting dates exist, `hosting_ends_at >= hosting_starts_at`

### Indexes

- `payments(client_id)`
- `payments(payment_status)`
- `payments(paid_at)`
- consider partial index for paid payments

### Admin-only fields

Only admin/server workflows may write:

- `payment_status`
- `paid_at`
- `confirmed_by`
- `hosting_starts_at`
- `hosting_ends_at`
- `renewal_required_at`
- `notes`

---

## 11. Table: `email_logs`

### Purpose

Tracks transactional emails sent by the system.

### Fields

| Field                 | Type                                                       | Notes             |
| --------------------- | ---------------------------------------------------------- | ----------------- |
| `id`                  | `uuid` PK                                                  | generated         |
| `client_id`           | `uuid references clients(id) on delete set null`           | optional          |
| `event_id`            | `uuid references rsvp_events(id) on delete set null`       | optional          |
| `application_id`      | `uuid references rsvp_applications(id) on delete set null` | optional          |
| `recipient_email`     | `text not null`                                            | recipient         |
| `recipient_name`      | `text`                                                     | optional          |
| `email_type`          | `text not null`                                            | type              |
| `provider`            | `text default 'resend'`                                    | provider          |
| `provider_message_id` | `text`                                                     | provider ID       |
| `status`              | `text not null default 'queued'`                           | send status       |
| `subject`             | `text`                                                     | email subject     |
| `error_message`       | `text`                                                     | failure reason    |
| `sent_at`             | `timestamptz`                                              | success timestamp |
| `created_at`          | `timestamptz default now()`                                |                   |
| `updated_at`          | `timestamptz default now()`                                |                   |

### Check constraints

Email types:

- `application_received`
- `application_approved`
- `client_onboarding`
- `payment_confirmed`
- `rsvp_confirmation`
- `guest_edit_link`
- `renewal_reminder`

Statuses:

- `queued`
- `sent`
- `failed`
- `skipped`

### Indexes

- `email_logs(client_id)`
- `email_logs(status)`
- consider `email_logs(created_at desc)`

---

## 12. Table: `audit_logs`

### Purpose

Append-only log of important system/admin/client actions.

### Fields

| Field           | Type                                                 | Notes                           |
| --------------- | ---------------------------------------------------- | ------------------------------- |
| `id`            | `uuid` PK                                            | generated                       |
| `actor_user_id` | `uuid references profiles(id) on delete set null`    | null for system actions         |
| `client_id`     | `uuid references clients(id) on delete set null`     | optional                        |
| `event_id`      | `uuid references rsvp_events(id) on delete set null` | optional                        |
| `entity_type`   | `text not null`                                      | record type                     |
| `entity_id`     | `uuid`                                               | affected record                 |
| `action`        | `text not null`                                      | action name                     |
| `metadata`      | `jsonb default '{}'`                                 | context                         |
| `ip_address`    | `text`                                               | hashed/truncated only if needed |
| `user_agent`    | `text`                                               | optional                        |
| `created_at`    | `timestamptz default now()`                          | immutable timestamp             |

### Immutability

Audit logs must be append-only:

- no normal UPDATE
- no normal DELETE
- admin can SELECT only
- service role can INSERT

### Indexes

- `audit_logs(client_id)`
- `audit_logs(actor_user_id)`
- `audit_logs(created_at desc)`
- consider `audit_logs(entity_type, entity_id)`

---

## 13. Table: `meta_pixels`

### Purpose

Stores platform/client/event Meta Pixel configuration. For v1, mainly platform/service landing tracking.

### Fields

| Field                    | Type                                       | Notes                            |
| ------------------------ | ------------------------------------------ | -------------------------------- |
| `id`                     | `uuid` PK                                  | generated                        |
| `client_id`              | `uuid references clients(id) nullable`     | null for platform-level          |
| `event_id`               | `uuid references rsvp_events(id) nullable` | optional event-level             |
| `pixel_id`               | `text not null`                            | safe public ID                   |
| `access_token_encrypted` | `text`                                     | server-only encrypted CAPI token |
| `is_active`              | `boolean default true`                     | toggle                           |
| `tracking_scope`         | `text not null default 'platform'`         | scope                            |
| `created_at`             | `timestamptz default now()`                |                                  |
| `updated_at`             | `timestamptz default now()`                |                                  |

### Check constraints

- `tracking_scope in ('platform','client','event')`

### Security notes

- `pixel_id` may be used publicly.
- `access_token_encrypted` must never be exposed to the browser or client dashboard.

---

## 14. Phase 1 Index Plan

Required or strongly recommended indexes:

```sql
-- Concept only. Codex must write final SQL during migration phase.

-- Applications
rsvp_applications(status)
rsvp_applications(email)
rsvp_applications(created_at desc or submitted_at desc)

-- Clients
clients(status)
clients(plan_type)
clients(contact_email or lower(contact_email))

-- Profiles
profiles(client_id)
profiles(role)
profiles(email or lower(email))

-- Events
unique rsvp_events(event_slug)
rsvp_events(client_id)
rsvp_events(status)
partial unique rsvp_events(client_id) where status <> 'archived'

-- Payments
payments(client_id)
payments(payment_status)
payments(paid_at)

-- Audit logs
audit_logs(client_id)
audit_logs(actor_user_id)
audit_logs(created_at desc)
audit_logs(entity_type, entity_id)

-- Email logs
email_logs(client_id)
email_logs(status)
email_logs(created_at desc)
```

Avoid over-indexing before real query patterns exist.

---

## 15. Future Tables Deferred

Do not include these in Phase 1 SQL:

- `rsvp_responses`
- `guest_edit_tokens`
- `guestbook_messages`
- `gift_wallets`
- `custom_frontend_connections`
- `public_api_logs`
- `event_page_sections`
- `payment_transactions`
- `plan_catalog`

---

## 16. Phase 1 SQL Planning Output Expected from Codex

When Codex is asked for SQL planning, expected output should be a plan only:

- migration file names/order
- table definitions
- constraints/checks
- indexes
- RLS policy plan
- seed/admin setup plan
- type generation plan
- risks or unresolved questions

Do not let Codex apply migrations until the SQL plan is reviewed.

---

_Not a migration file. Use for planning/review before SQL implementation._
