# 03 — Phase 1 RLS, Public Access, and Security Plan

**Project:** `webserbisyo-rsvp`  
**Status:** Planning document, not a migration file  
**Use:** Give this to Codex when planning RLS, public access, and security for Phase 1.

---

## 1. Purpose

This document isolates the access-control, public API, RLS, service-role, and security rules for the WebSerbisyo RSVP MVP.

It exists because the main migration risks are not table names; they are trust-boundary mistakes such as:

- broad anonymous INSERT policies
- anonymous base-table SELECT exposing private columns
- service-role code leaking outside server-only services
- client users accessing another tenant's records
- payment/admin fields being user-writable

This is **not** a SQL migration file.

---

## 2. Core Security Rules

### 2.1 RLS on all app tables

Enable RLS for all application tables from Phase 1.

Tables:

- `clients`
- `profiles`
- `rsvp_applications`
- `rsvp_events`
- `event_content`
- `payments`
- `email_logs`
- `audit_logs`
- `meta_pixels`

Route guards are not enough. RLS is the database safety layer.

---

### 2.2 Tenant boundary

The table name remains:

```txt
clients
```

Tenant boundary:

```txt
clients.id
```

Tenant-owned rows should use `client_id`.

Client RLS must resolve client access from `profiles.client_id` by `auth.uid()`. Never trust `client_id` from request input.

---

### 2.3 Public route boundary

Public data is resolved by:

```txt
event_slug
```

Public users and custom frontend repos must not submit or receive `client_id` or tenant IDs.

---

### 2.4 Service-role isolation

The Supabase service-role key bypasses RLS.

It must only be used in server-only service files, never in:

- Client Components
- browser code
- custom frontend repos
- public JS bundles
- Supabase SSR client with user cookies

Server-only files using service-role must start with:

```ts
import "server-only";
```

---

## 3. Roles and Access Model

### 3.1 Platform Admin

Platform admins can manage all operational records.

Allowed:

- read/write clients
- read/write applications
- read/write events/content
- read/write payments
- read email logs
- read audit logs
- manage Meta Pixel config
- provision clients through server workflows

Policy idea:

```sql
exists (
  select 1
  from profiles
  where profiles.id = auth.uid()
    and profiles.role = 'platform_admin'
    and profiles.is_active = true
)
```

Use final SQL later.

---

### 3.2 Client Owner

Client owners can access only their own tenant data.

Allowed:

- read own client record
- read/update own event records, with restrictions
- read/update own event content
- read own payment summary only
- later read own responses/guestbook/gift wallets

Not allowed:

- change `clients.status`
- change `clients.plan_type`
- change hosting coverage fields
- write payment records
- access another client
- read audit logs
- read email logs in v1
- access Meta Pixel tokens
- approve applications

---

### 3.3 Client Staff

`client_staff` is reserved for future role-based access.

Phase 1 decision:

- do not actively use `client_staff` in product flows
- if a `client_staff` profile exists, treat it as read-only own-tenant access
- do not build complex RBAC yet
- keep role in CHECK constraint for future compatibility
- do not expand write permissions unless explicitly approved later

---

### 3.4 Public Applicant

Public applicant may submit `/apply` only through a Server Action or Route Handler.

No direct broad anon INSERT policy for v1.

Public applicant must never set:

- status beyond default submitted
- review notes
- approved client/event IDs
- role
- payment fields
- audit fields

---

### 3.5 Public Guest

Public RSVP guest access is mostly Phase 3.

For v1 planning:

- guest reads public-safe event DTOs by `event_slug`
- guest submits RSVP later through server handler
- guestbook submission later through server handler
- no guest login in v1

---

### 3.6 Service Role

Service role is used only for trusted workflows:

- application approval
- client provisioning
- profile creation/linking
- draft event creation
- event_content creation
- payment record creation/update
- email log writes
- audit log writes
- optional Meta CAPI token reads

Service role writes should be called only after app-level permission checks.

---

## 4. Public Write Strategy

### 4.1 Public application submission

For `/apply`:

```txt
Client browser form
→ Next.js Server Action / Route Handler
→ Zod validation
→ server-only service
→ insert rsvp_applications
```

Rules:

- no raw FormData insert
- normalize email/phone/name
- ignore admin-only fields from client payload
- apply rate limiting before ads/production
- add Turnstile if spam risk appears
- write only allowed fields

Because v1 avoids broad anonymous INSERT policies, the `/apply` Server Action or Route
Handler must insert through an isolated server-only admin/service client after validation. An
anonymous SSR or browser Supabase client will not be able to insert into `rsvp_applications`
without an anonymous INSERT policy. This is intentional for v1.

Allowed public application fields:

- `full_name`
- `email`
- `phone`
- `event_type`
- `event_date`
- `event_location`
- `preferred_plan`
- `estimated_guest_count`
- `message`

Fields set by server/default only:

- `status = submitted`
- `submitted_at`
- `created_at`
- `updated_at`

Admin/service-only fields:

- `review_notes`
- `approved_client_id`
- `approved_event_id`
- `reviewed_at`
- `approved_at`
- `rejected_at`

---

### 4.2 Public RSVP response submission later

For Phase 3:

```txt
Public RSVP form
→ Server Action / Route Handler
→ resolve event by event_slug
→ verify event is published/public/open
→ server resolves client_id/event_id
→ insert rsvp_responses
→ generate guest_edit_token
```

Never accept `client_id` from public request bodies.

---

### 4.3 Public guestbook submission later

For Phase 3:

```txt
Guestbook form
→ Server Action / Route Handler
→ resolve event by event_slug
→ insert guestbook_messages(status=pending)
```

Public user cannot set status to approved.

---

## 5. Public Read Strategy

### 5.1 Avoid anon base-table SELECT

Avoid direct anonymous base-table SELECT on:

- `rsvp_events`
- `event_content`
- `guestbook_messages`
- `gift_wallets`

Reason:

```txt
RLS is row-level, not column-level.
```

A public SELECT policy may expose columns not intended for public use.

---

### 5.2 Preferred public read boundary

Use route handlers or server-built DTOs:

```txt
GET /api/public/events/[eventSlug]
```

The server:

1. validates `eventSlug`
2. finds published/public event
3. selects only needed fields
4. returns public-safe DTO

Alternative later:

- public-safe database view/function that exposes only whitelisted fields

If public-safe database views are used, prefer `security_invoker = true` where supported.
Alternatively, place views/functions in a private or unexposed schema and expose them only
through route handlers or explicit grants. Avoid broad `SECURITY DEFINER` functions in exposed
schemas. Public-safe views/functions must expose only whitelisted public fields.

GRANT/Data API posture:

- `anon` and `authenticated` roles should not receive broad base-table privileges beyond the
  intended policy surface.
- Public route handlers can avoid direct public Data API exposure by assembling DTOs
  server-side.
- Base-table grants and policies must be audited before launch.

---

### 5.3 Public-safe event DTO fields

Allowed:

- `event_slug`
- `title`
- `event_type`
- `event_date`
- `event_time`
- `venue_name`
- `venue_address`
- `rsvp_open_at`
- `rsvp_close_at`

Allowed content fields:

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

Later guestbook display fields:

- `guest_name`
- `message`
- `submitted_at`

Later gift wallet display fields:

- `wallet_type`
- `display_name`
- `account_name`
- `account_number`
- `qr_image_url`
- `instructions`

---

### 5.4 Never public

Never expose publicly:

- `client_id`
- tenant ID
- internal event ID unless absolutely required
- payment records
- email logs
- audit logs
- admin notes
- application review notes
- repository URL
- encrypted tokens
- Meta CAPI access token
- service-role-only fields
- guest edit token hash
- private status fields not needed by public UI

---

## 6. RLS Policy Planning by Table

### 6.0 RLS helper recursion caution

Policies that query `profiles` from `profiles` policies can recurse. SQL planning should use
safe non-recursive helper functions or carefully separated profile policies. Platform-admin
checks must be designed to avoid circular profile policy dependencies.

### 6.1 `clients`

Platform admin:

- SELECT, INSERT, UPDATE allowed

Client owner:

- SELECT own row
- no update for admin-controlled fields

Public:

- no access

Service role:

- creates/updates during provisioning/payment confirmation

---

### 6.2 `profiles`

Platform admin:

- full read/manage

User:

- read own profile
- limited update only if approved later

Client owner:

- no role/client_id self-modification

Public:

- no access

Service role:

- creates profile rows during provisioning

---

### 6.3 `rsvp_applications`

Platform admin:

- read/write all

Public:

- no broad base-table anon INSERT in v1
- submission through server action/route handler only

Client:

- no access in v1

Service role:

- updates approval conversion fields

---

### 6.4 `rsvp_events`

Platform admin:

- full access

Client owner:

- read/update own events
- cannot mutate `event_slug`
- cannot break tenant ownership

Public:

- no direct anon base-table SELECT in v1
- public reads through DTO/view only

Service role:

- creates draft event on approval

---

### 6.5 `event_content`

Platform admin:

- full access

Client owner:

- read/update own event content via event ownership

Public:

- no direct anon base-table SELECT in v1
- public reads through DTO/view only

Service role:

- creates empty content row during provisioning

---

### 6.6 `payments`

Platform admin:

- read/write all

Client owner:

- read own payment summary only
- no writes

Public:

- no access

Service role:

- creates/updates payment records after admin permission check

Payment writes are admin/server-only.

---

### 6.7 `email_logs`

Platform admin:

- read all
- optional resend workflow later

Client:

- no access in v1

Public:

- no access

Service role:

- writes email log rows

---

### 6.8 `audit_logs`

Platform admin:

- SELECT only

Service role:

- INSERT only

All other roles:

- no access

No UPDATE or DELETE policies.

---

### 6.9 `meta_pixels`

Platform admin:

- full access

Client:

- no access by default in v1

Public:

- no access to table
- public Pixel ID may be rendered by server if needed

Service role:

- reads encrypted CAPI token for server-side CAPI call

---

## 7. Immutability Rules

### 7.1 `event_slug`

Immutable after creation.

Codex should plan either:

- trigger protection
- or strict policy/service-layer protection

Trigger is safer.

---

### 7.2 `audit_logs`

Append-only.

No normal update/delete.

---

### 7.3 Admin-only application fields

Public submission path must never update:

- `status`
- `review_notes`
- `approved_client_id`
- `approved_event_id`
- `reviewed_at`
- `approved_at`
- `rejected_at`

---

### 7.4 Payment confirmation fields

Only admin/server workflow may update:

- `payment_status`
- `paid_at`
- `confirmed_by`
- `hosting_starts_at`
- `hosting_ends_at`
- `renewal_required_at`
- `notes`

---

## 8. Security and Privacy

### 8.1 Secrets

Never expose:

- Supabase service-role key
- Supabase secret key
- Resend API key
- Meta CAPI access token
- database password
- OAuth tokens

---

### 8.2 Meta CAPI token

`meta_pixels.access_token_encrypted` must be server-only.

Never return it from any client/public API.

---

### 8.3 IP handling

Do not store raw IP addresses by default.

If needed for abuse/debugging:

- hash IP, or
- truncate IP

`public_api_logs` must receive privacy review before Phase 3.

---

### 8.4 Guest PII retention

Before Phase 3, finalize guest RSVP/guestbook retention policy.

Draft direction:

```txt
retain for 12 months after event completion/archive unless deletion is requested earlier
```

---

### 8.5 Payment privacy

Do not store:

- card numbers
- OTP values
- full bank credentials
- payment secrets

Only store manual reference numbers and admin notes for v1.

---

## 9. RLS Test Matrix

Codex should later produce test cases for:

### Platform admin

- can read all clients
- can read all applications
- can approve/reject application
- can read/write payments
- can read audit/email logs
- can manage meta pixels

### Client owner

- can read own client record
- can read/update own event
- can read/update own event content
- can read own payment summary
- cannot access another client
- cannot write payment fields
- cannot read audit logs
- cannot read email logs in v1

### Anonymous/public

- cannot select private base tables
- cannot select clients/profiles/payments/logs
- cannot set admin fields during application submit
- can receive only public-safe DTO for published event slug later

### Service role

- can perform provisioning through server-only services
- can write audit/email logs
- must not appear in client bundle

---

## 10. Codex Usage Rule

For RLS/security planning, Codex should output:

- policy strategy
- grant strategy
- public API boundary plan
- test matrix
- risks before SQL

Do not let Codex apply migrations until the RLS plan is reviewed.

---

_Not a migration file. Use for planning/review before SQL implementation._
