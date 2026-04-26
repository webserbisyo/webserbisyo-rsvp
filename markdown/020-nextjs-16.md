---
description: Next.js 16 rules for the clean WebSerbisyo RSVP MVP
globs: ["src/app/**/*.tsx", "src/app/**/*.ts", "src/proxy.ts", "next.config.ts"]
alwaysApply: true
---

# Next.js 16 Rules - WebSerbisyo RSVP

Verified against official Next.js 16/16.2 docs and releases as of 2026-04-27.

Use the installed `package.json` / `package-lock.json` as the project source of truth. Do not upgrade packages blindly. If upgrading Next.js, React, or related tooling, check official release notes first and run all checks.

Current stable target: Next.js `16.2.x` unless the repo intentionally pins another stable version.

---

## 1. Runtime and Tooling

Required:

- Node.js `20.9.0+`
- TypeScript `5.1.0+`
- React `19.2.x`
- npm for this project

Rules:

- Do not use Node 18.
- Do not use `next lint`; it was removed.
- Use ESLint CLI through project scripts.
- `next build` does not replace linting.
- Turbopack is the default for `next dev` and `next build`.
- Use `--webpack` only as a temporary fallback when Turbopack blocks development.

Preferred checks:

```bash
npm run format:check
npm run lint
npm run typecheck
npm run build
```

---

## 2. Proxy Replaces Middleware

Use:

```txt
src/proxy.ts
```

Do not create new `middleware.ts`.

Next.js 16 renames Middleware to Proxy. `proxy.ts` runs before routes render and is appropriate for auth redirects, request filtering, logging, and lightweight request-boundary work.

Rules:

- Prefer named export: `export function proxy(request: NextRequest)`.
- A default export is supported, but named `proxy` is clearer.
- `proxy.ts` uses Node.js runtime only.
- Do not configure Edge runtime for `proxy.ts`.
- Avoid heavy business logic in proxy.
- Do not use proxy as the only security layer.
- Server Actions, services, queries, and Supabase RLS must still enforce access.

Minimal pattern:

```ts
import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*"],
};
```

For scaffold/testing, proxy must not crash when Supabase env values are missing.

---

## 3. Async Request APIs

In Next.js 16, request-time APIs are async-only.

Always await:

- `cookies()`
- `headers()`
- `draftMode()`
- `params`
- `searchParams`

Page pattern:

```ts
type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Page({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const query = searchParams ? await searchParams : {};

  return <main>{slug}</main>;
}
```

Route handler dynamic params pattern:

```ts
export async function GET(request: Request, context: { params: Promise<{ eventSlug: string }> }) {
  const { eventSlug } = await context.params;

  return Response.json({ eventSlug });
}
```

Do not use old sync access like:

```ts
const { slug } = params;
const cookieStore = cookies();
```

---

## 4. App Router Rules

Use App Router patterns only.

For RSVP MVP:

- Prefer Server Components by default.
- Use Client Components only for interaction, form state, browser APIs, or local UI state.
- Keep route handlers in `src/app/api/**/route.ts`.
- Keep business logic out of pages/components.
- Put business logic in `src/server/services`.
- Put server actions in `src/server/actions`.
- Put data reads in `src/server/queries`.

Do not overuse parallel routes for the MVP. If parallel routes are used, every slot needs a `default.tsx`.

Example:

```txt
src/app/(admin)/admin/@modal/default.tsx
```

```ts
export default function Default() {
  return null;
}
```

---

## 5. Server Actions

Use Server Actions for trusted app mutations such as admin approval, application review, dashboard updates, and client settings.

Rules:

- Add `"use server"`.
- Validate external input with Zod.
- Check permissions server-side.
- Keep service-role Supabase calls inside `server-only` services.
- Return typed action states for forms.
- Use `redirect()` only after successful mutations when navigation is intended.

Pattern:

```ts
"use server";

import { z } from "zod";

const Schema = z.object({
  applicationId: z.string().uuid(),
});

export async function approveApplicationAction(input: unknown) {
  const parsed = Schema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, error: "Invalid input" };
  }

  // Check admin permission, then call service.
  return { ok: true };
}
```

---

## 6. Route Handlers

Use Route Handlers for public API boundaries and external integrations.

RSVP v1 route examples:

```txt
src/app/api/public/events/[eventSlug]/route.ts
src/app/api/public/events/[eventSlug]/responses/route.ts
```

Rules:

- Validate request body/query params with Zod.
- Keep API responses data-only.
- Do not leak private dashboard/admin data.
- Do not call service-role Supabase from client code.
- Add rate limiting later for public write endpoints.

Pattern:

```ts
import { NextResponse } from "next/server";

export async function GET(request: Request, context: { params: Promise<{ eventSlug: string }> }) {
  const { eventSlug } = await context.params;

  return NextResponse.json({ eventSlug });
}
```

---

## 7. Cache Rules

Caching is explicit in Next.js 16.

For the RSVP MVP, start simple:

- Do not add Cache Components everywhere.
- Do not enable complex caching until real data flows exist.
- Admin/dashboard data should usually be fresh and permission-checked.
- Public event pages may use cache later when publishing is implemented.

If using tag invalidation:

- `revalidateTag(tag, "max")` = stale-while-revalidate behavior.
- `updateTag(tag)` = Server Actions only, immediate read-your-writes.
- `refresh()` = Server Actions only, refreshes Router Cache.

Use `updateTag()` for admin/dashboard mutations where the user expects immediate updated data.

Use `revalidateTag(tag, "max")` for public/content data where slight delay is acceptable.

Do not use `updateTag()` in Route Handlers.

---

## 8. Cache Components

`cacheComponents: true` enables the new Cache Components model.

Do not enable it just because it exists.

For this project:

- Leave off unless a real public RSVP/content performance need appears.
- If enabled, document why in `PROJECT_STATUS.md`.
- Use `"use cache"` only for safe, non-private, cacheable reads.
- Never cache user-specific or permission-sensitive admin/client data unless using the correct private caching pattern.

If using cache helpers:

```ts
import { cacheLife, cacheTag } from "next/cache";
```

The stable names are `cacheLife` and `cacheTag`, not `unstable_cacheLife` / `unstable_cacheTag`.

---

## 9. Images

Use `next/image`.

Rules:

- Use `images.remotePatterns`, not old broad `domains`.
- Configure allowed remote image hosts only when actually needed.
- If using custom quality values, include them in `images.qualities`.
- Do not enable `dangerouslyAllowLocalIP` unless specifically needed for a private-network deployment.

Example:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
    qualities: [50, 75, 100],
  },
};

export default nextConfig;
```

Do not add Cloudinary patterns unless Cloudinary is actually used in this RSVP app.

---

## 10. next.config.ts Rules

Keep config minimal.

Acceptable baseline:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverActions: {
    bodySizeLimit: "2mb",
  },
};

export default nextConfig;
```

Only add options when needed.

Rules:

- Do not add `experimental.ppr`; use `cacheComponents` only if approved.
- Do not add old `eslint` config; it was removed.
- Do not use `serverRuntimeConfig` or `publicRuntimeConfig`; use environment variables.
- Use top-level `turbopack` only if Turbopack config is actually needed.
- React Compiler is optional; do not enable until tested and approved.

---

## 11. Metadata

Use typed metadata for SEO/social sharing.

Dynamic public RSVP pages should use async params:

```ts
import type { Metadata } from "next";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  return {
    title: `${slug} RSVP`,
  };
}
```

Do not fetch private/admin-only data in public metadata.

---

## 12. Error, Loading, and Not Found

Use route-level files when useful:

```txt
loading.tsx
error.tsx
not-found.tsx
global-error.tsx
```

Rules:

- `error.tsx` must be a Client Component.
- Use simple placeholders first.
- Do not overdesign before real flows exist.

Example:

```tsx
"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main>
      <h2>Something went wrong.</h2>
      <button onClick={reset}>Try again</button>
    </main>
  );
}
```

---

## 13. DevTools / Agents

Next.js DevTools MCP is configured outside `next.config.ts`.

Do not add fake `devTools` config to `next.config.ts`.

If an AI coding agent supports MCP, configure it through the agent/tool settings, not through app code.

---

## 14. Security Maintenance

Keep Next.js and React on patched stable versions.

Before deployment:

```bash
npm outdated
npm audit
npm run lint
npm run typecheck
npm run build
```

If official Next.js or React security advisories are published, patch immediately and document the package update in `PROJECT_STATUS.md`.

Do not pin known vulnerable `next`, `react`, or `react-dom` versions.

---

## 15. Anti-Patterns

Avoid:

```txt
middleware.ts for new code
next lint
sync params/searchParams/cookies/headers access
business logic inside pages/components
service-role Supabase in client code
proxy-only security
overusing Cache Components too early
copying POS routes/patterns into RSVP
turning on React Compiler without approval
adding Cloudinary/image hosts before needed
using old runtimeConfig values
```

---

## 16. MVP Usage Priority

For the next RSVP implementation phases, focus on:

```txt
1. src/proxy.ts scaffold/auth safety
2. route smoke testing
3. admin schema/RLS planning
4. Server Actions for application/admin approval
5. Route Handlers for public API later
6. minimal next.config.ts only
```
