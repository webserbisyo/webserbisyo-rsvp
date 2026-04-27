# 04 — Phase 1 Services, Testing, and Acceptance Plan

**Project:** `webserbisyo-rsvp`  
**Status:** Planning document, not a migration file  
**Use:** Give this to Codex when planning implementation after schema/RLS planning is approved.

---

## 1. Purpose

This document defines the service workflows, testing checklist, acceptance criteria, and future extraction boundaries for the WebSerbisyo RSVP Phase 1 admin-first backend foundation.

It should be used after the Phase 1 schema/RLS plan is approved, but before actual business implementation begins.

This is **not** a SQL migration file.

---

## 2. Phase 1 Vertical Slice

The Phase 1 product goal is:

```txt
/apply
→ application saved
→ admin sees application
→ admin confirms manual payment
→ client/profile provisioned
→ draft RSVP event created
→ event_content row created
→ onboarding email sent/logged
→ audit logs written
```

This is admin-first. It does not include public RSVP submission, guestbook, gift wallets, custom frontend repo connection, realtime, push, payment gateway, or NestJS.

---

## 3. Service Boundary Rules

All business workflows should live in server-side service files.

Rules:

- no React imports
- no Client Component imports
- no UI logic
- no browser APIs
- no raw secrets in parameters
- accept typed input
- return typed result
- use service-role only inside server-only services
- side effects such as email/logging happen in services, not UI components

Service files that touch secrets or service-role clients must start with:

```ts
import "server-only";
```

---

## 4. Phase 1 Service Map

| Service                      | Purpose                                    | Tables                                       |
| ---------------------------- | ------------------------------------------ | -------------------------------------------- |
| `submit-application.ts`      | validate and save public application       | `rsvp_applications`, optionally `audit_logs` |
| `review-application.ts`      | mark application reviewing/rejected        | `rsvp_applications`, `audit_logs`            |
| `approve-application.ts`     | orchestrate approval workflow              | all Phase 1 operational tables               |
| `provision-client.ts`        | create `clients` row                       | `clients`                                    |
| `create-client-user.ts`      | create/link Supabase Auth user and profile | `auth.users`, `profiles`                     |
| `record-one-time-payment.ts` | create/confirm manual payment              | `payments`, `clients`, `audit_logs`          |
| `create-draft-event.ts`      | create event and event_content             | `rsvp_events`, `event_content`               |
| `send-onboarding-email.ts`   | send Resend onboarding email               | `email_logs`                                 |
| `send-meta-capi-purchase.ts` | optional non-blocking CAPI Purchase        | `meta_pixels`, `audit_logs`                  |
| `write-audit-log.ts`         | append-only audit helper                   | `audit_logs`                                 |
| `write-email-log.ts`         | email log helper                           | `email_logs`                                 |
| `resolve-public-event.ts`    | public DTO later                           | `rsvp_events`, `event_content`               |

Some names may already exist in the scaffold; Codex should reuse current names where possible.

`submit-application.ts` must be server-only if it uses the admin/service client. It should
validate input, strip admin-only fields, and insert the application through the trusted server
path. It must never expose the service-role client to the browser.

---

## 5. Public Application Submission Flow

### Flow

```txt
Public /apply form
→ Server Action or Route Handler
→ Zod validation
→ submit-application service
→ insert rsvp_applications
→ optional audit log: application_submitted
→ user receives success response
```

### Validation

Validate:

- full name required
- email valid
- phone optional
- event type allowed
- preferred plan is `pro` or `max`
- estimated guest count positive if provided
- message length limit

### Security

Public submitter cannot set:

- status except default `submitted`
- review notes
- approved client/event IDs
- payment status
- role
- timestamps beyond server defaults

### Acceptance

- submitting valid application creates one row
- invalid application returns field errors
- public cannot set admin-only fields
- `.env.local` secrets are not exposed

---

## 6. Admin Application Review Flow

### Review workflow

Admin can:

- list submitted/reviewing applications
- open application detail
- mark as reviewing
- reject with internal notes
- approve after manual payment confirmation

### Rejection behavior

On rejection:

- update application status to `rejected`
- set `rejected_at`
- preserve application row
- write audit log

Do not hard delete.

---

## 7. Approval and Provisioning Flow

### Canonical approval flow

```txt
Admin approves application
→ verify platform_admin permission
→ verify application is approvable
→ create client
→ create/link client auth user/profile
→ create draft RSVP event
→ create empty event_content row
→ create/confirm manual payment with application_id, client_id, and event_id
→ update client hosting mirror from payment coverage
→ update application with approved_client_id and approved_event_id
→ send onboarding email
→ write email log
→ write audit logs
→ optionally send Meta CAPI Purchase non-blocking
```

Create or confirm the manual payment record in an order that satisfies the final FK/nullability
choices from Doc 2. If `payments.client_id` and `payments.event_id` are `NOT NULL`, create the
client and draft event before creating the payment row. If a payment record is initially
created earlier from the application, update it after provisioning to set `client_id` and
`event_id`.

Preferred Phase 1 service flow:

```txt
approve application
→ create client/profile
→ create draft event/event_content
→ create/confirm payment with client_id/event_id/application_id
→ update client hosting mirror
→ update application approved IDs
→ send email/log audit
```

`payments` remains the source of truth for hosting coverage.

### Idempotency requirement

The approval service must be safe to run twice.

If triggered twice for the same application:

- do not create duplicate clients
- do not create duplicate profiles
- do not create duplicate active events
- do not create duplicate paid payment records unless explicitly intended
- return existing provisioned records or clear safe error

### Recommended idempotency checks

- application status and approved IDs
- existing client linked to application
- existing event linked to application
- existing payment linked to application
- unique one active/non-archived event per client

---

## 8. Manual Payment Confirmation Flow

### Payment record source

`payments` is the source of truth for manual Pro/Max package payment records.

The Phase 1 payment table is trimmed to manual/business fields only.

Do not implement:

- gateway checkout
- webhook handling
- provider raw payload storage
- `payment_transactions`

### Payment confirmation rules

Only platform admin/server workflow can set:

- `payment_status`
- `paid_at`
- `confirmed_by`
- `hosting_starts_at`
- `hosting_ends_at`
- `renewal_required_at`
- internal notes

### Hosting mirror

`clients` may mirror current hosting dates for dashboard performance, but `payments` remains the source of truth.

The service must update both consistently.

---

## 9. Draft Event Creation Flow

On approval, create:

```txt
rsvp_events(status='draft', visibility='private')
event_content(empty/default row)
```

Rules:

- generate globally unique `event_slug`
- `event_slug` must be immutable after creation
- one active/non-archived event per client
- fallback page enabled by default
- custom frontend disabled by default

---

## 10. Onboarding Email Flow

Use Resend for onboarding email.

Flow:

```txt
send onboarding email
→ record email_logs row as sent or failed
→ do not rollback whole approval if email fails unless explicitly required
→ surface email failure to admin for retry
```

Email log must record:

- recipient email
- recipient name
- email type
- provider
- provider message ID if available
- status
- subject
- error message on failure
- sent timestamp when successful

---

## 11. Audit Log Flow

Audit logs are required for important workflow changes.

Audit on:

- application submitted
- application reviewed
- application approved
- application rejected
- payment confirmed
- client created
- profile/user linked
- draft event created
- event_content created
- onboarding email sent/failed
- Meta CAPI attempted

Audit logs are append-only.

Do not update or delete audit rows.

---

## 12. Meta Pixel and CAPI Behavior

### V1 allowed tracking

- Meta Pixel PageView on service landing page
- Meta Pixel Lead on application submission
- optional Meta CAPI Purchase on manual paid approval

### CAPI rule

Meta CAPI Purchase is non-blocking.

If Meta CAPI fails:

- do not fail approval
- write audit/log metadata
- allow admin to continue workflow

### Security

- Pixel ID can be public
- CAPI access token must be encrypted/server-only
- never expose access token to browser or client dashboard

---

## 13. TypeScript and Validation Plan

After migrations:

- generate Supabase TypeScript database types
- update `src/types/database.ts` or generated database type file
- create Zod schemas for Phase 1 inputs

Phase 1 Zod schemas:

- application submission
- application review/reject
- approval/payment confirmation
- event draft/update basics
- Meta Pixel config

Validation must happen server-side.

---

## 14. Admin Seed Plan

Do not seed platform admin profile until the Supabase Auth user exists.

Recommended safe sequence:

1. create Supabase Auth admin user manually or via approved admin setup flow
2. capture auth user ID locally/securely
3. insert `profiles` row with role `platform_admin`
4. verify admin can access `/admin`

Do not commit secrets or passwords.

---

## 15. Local and MCP Verification Checklist

Before Phase 1 implementation:

- Supabase MCP connected to correct project
- project ref confirmed
- project is not old POS/F&B project
- no existing user public tables unless migrations created them
- no migrations applied accidentally
- `.env.local` exists and is untracked
- `.env.example` contains placeholders only
- service-role key never appears in committed code

Before applying migrations:

- SQL plan reviewed
- RLS plan reviewed
- migration order approved
- rollback or reset approach understood

---

## 16. RLS Test Matrix

After migrations and policies, test these states.

### Platform admin tests

- can read clients
- can read applications
- can review/reject application
- can approve application
- can create payment through service
- can read email logs
- can read audit logs
- can manage Meta Pixel config

### Client owner tests

- can read own client row
- cannot read another client row
- can read own event
- can update allowed own event fields later
- can read own event content
- cannot read applications
- cannot write payment status
- cannot read audit logs
- cannot read email logs in v1

### Public/anonymous tests

- cannot select clients
- cannot select profiles
- cannot select payments
- cannot select logs
- cannot select raw rsvp_events base rows directly in v1
- cannot select raw event_content base rows directly in v1
- cannot direct INSERT into rsvp_applications base table
- can submit application only through validated server path
- cannot set admin-only fields in application payload

### Immutability and append-only tests

- `event_slug` cannot be changed after creation
- `audit_logs` cannot be updated or deleted through normal roles
- payment confirmation fields cannot be changed by client users

### Service-role tests

- service-only workflows can provision records
- service-role code is not imported by client bundle
- service-role client does not use user cookie SSR client
- service-role/admin Supabase client is imported only in server-only service files
- no Client Component imports service-role modules
- no public or custom frontend bundle includes service-role code
- use build/static inspection or code search checks where practical

---

## 17. Acceptance Criteria Before Phase 2

Phase 1 is complete only when:

- Phase 1 migrations applied successfully
- RLS policies pass test matrix
- platform admin seed/profile works
- application submission works
- admin application list/detail works
- approval flow creates client/profile/event/content/payment/log rows
- approval flow is idempotent
- onboarding email is logged on success/failure
- payment confirmation updates payment and client hosting mirror consistently
- audit logs are written for approval/provisioning/payment
- TypeScript database types generated and committed
- no secrets are committed
- build/typecheck pass

Do not start Phase 2 client-dashboard database tables until Phase 1 is accepted.

---

## 18. Future NestJS Extraction Readiness

Services should stay framework-light so they can later move to NestJS modules.

Future module mapping:

| Current service area           | Future NestJS module |
| ------------------------------ | -------------------- |
| clients/provisioning           | `ClientsModule`      |
| auth/profile linking           | `AuthModule`         |
| application approval           | `ApplicationsModule` |
| manual payments/webhooks later | `PaymentsModule`     |
| event/content/RSVP             | `RsvpModule`         |
| email logs/Resend              | `EmailModule`        |
| Meta Pixel/CAPI                | `MarketingModule`    |
| guestbook later                | `GuestbookModule`    |
| gift wallets later             | `GiftWalletsModule`  |
| reminders later                | `RemindersModule`    |
| gateway webhooks later         | `WebhooksModule`     |

Do not add NestJS now.

---

## 19. Codex Usage Rule

When using this file with Codex, ask for focused output:

```txt
Read 04-phase-1-services-testing-and-acceptance.md.
Do not modify Supabase.
Do not create migrations unless explicitly approved.
Plan services/testing only.
```

For implementation, Codex should work in small tasks:

1. schema/RLS migrations
2. type generation
3. server actions/services
4. application form
5. admin applications page
6. approval/provisioning workflow
7. email/audit/payment logs
8. test/acceptance pass

---

_Not a migration file. Use for planning/review before SQL implementation._
