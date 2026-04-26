# Architecture

This project is a single Next.js application structured to keep routing, UI, reads, writes, and
integrations separated so the service layer can be extracted later if NestJS becomes necessary.

## Responsibilities

- `src/app`: routing and thin route handlers only.
- `src/components`: UI components and route-level composition.
- `src/server/actions`: mutation entry points for server actions.
- `src/server/services`: framework-light business logic placeholders.
- `src/server/queries`: read-only query placeholders.
- `src/lib/supabase`: execution-context-specific Supabase client helpers.
- `src/lib/validations`: Zod schema placeholders shared by client and server.
- `src/lib/permissions`: future authz guards.
- `src/lib/public-api`: shared route-handler response helpers.
- `src/types`: shared type placeholders.
- `public`: static assets, manifest, and service worker.
- `tests/e2e`: Playwright end-to-end test directory.

## Notes

- The project intentionally does not contain RSVP feature implementations yet.
- `src/lib/supabase/admin.ts`, `src/lib/resend/index.ts`, and `src/lib/meta/capi.ts` are
  server-only placeholders.
- PWA setup is manual and minimal by design at this stage.
