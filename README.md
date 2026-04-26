# WebSerbisyo RSVP

Foundation-only Next.js 16 project scaffold for the RSVP product. This repository intentionally
stops at project setup and does not include RSVP application flows, Supabase migrations, or
business logic implementations yet.

## Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS v4
- shadcn/ui
- Supabase client helpers
- Resend SDK
- Playwright

## Local setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local`.
3. Fill the environment values for local development.
4. Start the app with `npm run dev`.

## Quality checks

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run format:check`

## Status

This commit is a foundation scaffold only.
