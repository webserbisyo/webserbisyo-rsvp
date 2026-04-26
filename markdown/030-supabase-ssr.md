---
description: Supabase SSR auth, clients, proxy, RLS, and service-role rules for WebSerbisyo RSVP
globs:
  [
    "src/lib/supabase/**/*.ts",
    "src/proxy.ts",
    "src/server/**/*.ts",
    "src/app/api/**/*.ts",
    "supabase/**/*.sql",
  ]
alwaysApply: true
---

# Supabase SSR Rules - WebSerbisyo RSVP

Verified against official Supabase SSR/auth docs and package releases as of 2026-04-27.

Use installed `package.json` / `package-lock.json` as source of truth. Do not upgrade Supabase packages blindly. Before upgrading `@supabase/ssr` or `@supabase/supabase-js`, check official release notes and run all checks.

Target packages:

- `@supabase/ssr` `0.10.x`
- `@supabase/supabase-js` `2.104.x`

---

## 1. Package Rule

Use:

```bash
npm install @supabase/supabase-js @supabase/ssr
```

Do not use:

```txt
@supabase/auth-helpers-nextjs
@supabase/auth-helpers-react
@supabase/auth-helpers-shared
```

Do not install both old auth helpers and `@supabase/ssr`.

---

## 2. RSVP Client Boundaries

Use separate clients for separate trust boundaries:

```txt
src/lib/supabase/client.ts  -> browser/client components only
src/lib/supabase/server.ts  -> server components/actions/route handlers with user cookies
src/lib/supabase/route.ts   -> route handler helper if needed
src/lib/supabase/proxy.ts   -> proxy session refresh / route boundary
src/lib/supabase/admin.ts   -> service-role admin operations only
```

Rules:

- Browser client uses public publishable/anon key only.
- Server client uses user cookies and RLS.
- Admin client uses secret/service-role key and bypasses RLS.
- Admin client must be imported only from `server-only` files.
- Never expose secret/service-role keys to client code.
- Never create a Supabase client in module/global scope for request-specific auth.

---

## 3. Environment Variables

Prefer new Supabase key names for new projects:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
```

Legacy-compatible fallback during transition:

```env
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

RSVP scaffold flag:

```env
RSVP_AUTH_GUARD_ENABLED=false
```

Rules:

- Use publishable key first, fallback to anon key only for compatibility.
- Use secret key first, fallback to service-role key only for compatibility.
- Do not prefix secret keys with `NEXT_PUBLIC_`.
- `.env.local` must never be committed.
- Production must enable real auth/permission checks before launch.

---

## 4. Env Helper Pattern

Use a small helper so code supports publishable-key migration without scattering env logic.

```ts
export function getSupabasePublicEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return { url, key };
}

export function getSupabaseSecretEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  return { url, key };
}
```

If env values are missing, fail clearly in real server/auth code. For scaffold-only proxy testing, allow a no-op bypass when auth guard is disabled.

---

## 5. Browser Client

```ts
import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

export function createClient() {
  const { url, key } = getSupabasePublicEnv();

  if (!url || !key) {
    throw new Error("Missing Supabase public environment variables.");
  }

  return createBrowserClient(url, key);
}
```

Use browser client only for safe client-side behavior. Do not use it for admin provisioning, payments, audit logs, or private server workflows.

---

## 6. Server Client

Next.js request APIs are async, so `cookies()` must be awaited.

Use `getAll()` and `setAll()`. Do not use old individual `get`, `set`, `remove` cookie methods.

```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

export async function createClient() {
  const { url, key } = getSupabasePublicEnv();

  if (!url || !key) {
    throw new Error("Missing Supabase public environment variables.");
  }

  const cookieStore = await cookies();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot write cookies.
          // Proxy refresh should handle session cookie updates.
        }
      },
    },
  });
}
```

Use this client for authenticated server components, server actions, and route handlers where RLS should apply.

---

## 7. Proxy Session Refresh

Use `src/proxy.ts` for Next.js 16. Do not create new `middleware.ts`.

Recommended structure:

```txt
src/proxy.ts              -> thin wrapper
src/lib/supabase/proxy.ts -> updateSession(request)
```

Rules:

- Create a new Supabase server client per request.
- Use `getAll()` / `setAll()`.
- Preserve `supabaseResponse`.
- Apply headers passed to `setAll` when using `@supabase/ssr` 0.10+.
- Do not put random logic between client creation and auth validation.
- Proxy may redirect unauthenticated users, but it is not the only security layer.
- Server actions, services, queries, and RLS must still enforce permissions.

Scaffold-safe pattern:

```ts
// src/proxy.ts
import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*"],
};
```

```ts
// src/lib/supabase/proxy.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

export async function updateSession(request: NextRequest) {
  const authGuardEnabled = process.env.RSVP_AUTH_GUARD_ENABLED === "true";
  const { url, key } = getSupabasePublicEnv();

  if (!authGuardEnabled || !url || !key) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        supabaseResponse = NextResponse.next({ request });

        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });

        if (headers) {
          Object.entries(headers).forEach(([name, value]) => {
            supabaseResponse.headers.set(name, value);
          });
        }
      },
    },
  });

  const {
    data: { claims },
  } = await supabase.auth.getClaims();

  const pathname = request.nextUrl.pathname;
  const isAdminRoute = pathname.startsWith("/admin");
  const isDashboardRoute = pathname.startsWith("/dashboard");

  if ((isAdminRoute || isDashboardRoute) && !claims) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return supabaseResponse;
}
```

During early scaffold testing, `RSVP_AUTH_GUARD_ENABLED=false` is allowed. Before production, real auth and role checks must be enabled.

---

## 8. getClaims vs getUser vs getSession

Server-side rule:

```txt
getSession() -> never trust for server authorization
getClaims() -> fast JWT validation; good for route protection when asymmetric keys are used
getUser()   -> Auth server verification; use when logout/revocation certainty matters
```

Use:

- `getClaims()` in proxy/high-frequency route checks.
- `getUser()` in sensitive server actions when account revocation/logout certainty matters.
- RLS and permission checks for actual data access.

Never authorize admin/client access from `getSession()` in server code.

---

## 9. Service-Role Admin Client

Service-role/secret key bypasses RLS. Use only in server-only provisioning workflows.

```ts
import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getSupabaseSecretEnv } from "@/lib/supabase/env";
import type { Database } from "@/types/database";

export function createAdminClient() {
  const { url, key } = getSupabaseSecretEnv();

  if (!url || !key) {
    throw new Error("Missing Supabase secret environment variables.");
  }

  return createClient<Database>(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
```

Allowed uses:

- Approve application
- Provision client/tenant
- Create/invite client user
- Create draft RSVP event
- Record manual package payment
- Write audit/email logs when elevated access is required

Forbidden:

- Client components
- Public route handlers without strict validation
- UI helpers
- General reads that should use RLS
- Any file without `server-only`

---

## 10. RSVP RLS Principles

RLS must be enabled for tenant/client data.

Admin-first planned tables:

```txt
profiles
clients / tenants
rsvp_applications
rsvp_events
event_content
payments
email_logs
audit_logs
meta_pixels
```

Policy principles:

- Platform admins can manage operational records.
- Client users can access only their own client/event records.
- Public users can insert applications.
- Public RSVP read/submit policies come later when public RSVP flow is implemented.
- Service-role operations must be isolated in server-only services.

Performance pattern:

```sql
-- Prefer wrapping auth.uid() in SELECT so it is evaluated once per statement.
USING (user_id = (SELECT auth.uid()))
```

Do not use permissive public policies like `WITH CHECK (true)` unless the endpoint/table is intentionally public and server validation/rate limiting are in place.

---

## 11. Auth Flow for RSVP MVP

V1 preferred auth model:

```txt
Admin user:
- manually created or seeded
- platform_admin role in profile/claims/table

Client user:
- created/invited during approved application provisioning
- receives onboarding email through Resend
- logs into /dashboard

Guest:
- no login for v1 RSVP submission
- future edit token for update/cancel
```

Do not implement OAuth, MFA, SSO, or guest login unless approved.

Password auth / magic-link invitation is enough for MVP.

---

## 12. Auth Callback

If using email link or OAuth-style PKCE callback later:

```ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(next, url.origin));
    }
  }

  return NextResponse.redirect(new URL("/login?error=auth", url.origin));
}
```

Keep callback routes simple and validate `next` paths before trusting external redirects.

---

## 13. Public API / Public Form Rules

Public endpoints need stricter validation because guests and applicants are unauthenticated.

For public application form:

- Validate with Zod.
- Normalize email/phone.
- Add rate limiting later.
- Add Turnstile later if spam appears or before production ads.
- Never expose admin/client IDs unnecessarily.
- Store application status as submitted/reviewing/approved/rejected/cancelled.

For future public RSVP API:

- Read only published/active event by slug.
- Insert RSVP response only through server-validated route/action.
- Use edit token for guest update/cancel.
- Do not expose private client dashboard fields.

---

## 14. Caching and Set-Cookie Safety

Do not cache authenticated routes that refresh Supabase sessions.

Rules:

- Do not use ISR on auth/session-refreshing routes.
- Authenticated pages may need `dynamic = "force-dynamic"` if caching risk appears.
- Apply cache headers passed into `setAll` for `@supabase/ssr` 0.10+.
- Never share a request-specific Supabase client across users.

---

## 15. Realtime and Storage

Deferred for MVP unless approved.

Realtime:

- Do not add dashboard realtime until admin-first vertical slice works.
- If added later, use client-specific channels and RLS/private channel rules.

Storage:

- Do not add storage buckets until RSVP event media/uploads are in scope.
- Public/private file access must be designed before bucket policies are created.

---

## 16. Anti-Patterns

Avoid:

```txt
@supabase/auth-helpers-nextjs
server auth based on getSession()
service-role client in client code
global/module-scoped user Supabase clients
RLS disabled on tenant/client data
proxy-only security
middleware.ts for new Next.js 16 code
public policies with no validation/rate limits
ISR/caching on auth-refreshing routes
OAuth/MFA/SSO before MVP needs it
copying old POS or old RSVP 51-table policies
```

---

## 17. Implementation Priority

For RSVP MVP, implement Supabase in this order:

```txt
1. Env helper
2. Browser/server/admin clients
3. Scaffold-safe proxy
4. Auth/permission helpers
5. Admin-first schema/RLS plan
6. Approved migrations
7. Application submit action
8. Admin application queries
9. Approval/provisioning service
10. Payment/email/audit log services
```

Run after changes:

```bash
npm run format:check
npm run lint
npm run typecheck
npm run build
```
