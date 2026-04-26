---
description: Server state and client state rules for WebSerbisyo RSVP MVP
globs: ["**/*.tsx", "**/*.ts", "**/stores/**", "**/hooks/**", "**/providers/**"]
alwaysApply: false
---

# State Management Rules - WebSerbisyo RSVP

Verified against TanStack Query and Zustand official docs/releases as of 2026-04-27.

Use installed `package.json` / `package-lock.json` as source of truth. Do not install or upgrade state-management libraries blindly.

Current latest reference:

```txt
@tanstack/react-query: 5.100.x
@tanstack/react-query-devtools: 5.100.x
zustand: 5.0.x
```

This RSVP MVP does not require TanStack Query or Zustand by default.

---

## 1. Default RSVP State Strategy

Prefer built-in Next.js + React patterns first:

```txt
Server Components      -> server reads and page data
Server Actions         -> mutations
Route Handlers         -> public API / integrations
React Hook Form        -> form state
URL searchParams       -> filters/pagination/shareable state
React useState/useMemo -> local component state
```

Only add TanStack Query or Zustand when there is a clear need.

---

## 2. Do Not Install By Default

Do not add these packages just because they existed in POS or old RSVP docs:

```bash
npm install @tanstack/react-query @tanstack/react-query-devtools zustand
```

Install only after approval and only if the current feature benefits from them.

This project uses `npm`, not `pnpm`.

---

## 3. When To Use TanStack Query

Use TanStack Query only for **client-side server state** that needs caching, refetching, invalidation, polling, realtime sync, or complex loading states.

Good future uses:

```txt
Admin applications table with filters/refetch
Admin sales summary with date filters
Client responses table
Dashboard realtime refresh later
Guestbook moderation later
Gift wallet records later
```

Avoid for now:

```txt
Static landing sections
Simple Server Component reads
One-off server actions
Placeholder pages
Initial schema/RLS planning
Basic forms where useActionState is enough
```

For admin-first MVP, start with Server Components + server queries. Add TanStack Query only when the UI becomes interactive enough to justify it.

---

## 4. TanStack Query v5 Rules

If added, use v5 patterns.

Provider pattern:

```tsx
"use client";

import { QueryClient, QueryClientProvider, isServer } from "@tanstack/react-query";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (isServer) return makeQueryClient();

  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={getQueryClient()}>{children}</QueryClientProvider>;
}
```

Rules:

- Use `gcTime`, not old `cacheTime`.
- Use `isPending` for “no data yet” loading states.
- Use `queryOptions()` for reusable query factories.
- Use stable query keys.
- Never mutate cached data in place.
- Keep Supabase/service logic out of UI components when possible.
- Do not use devtools in production UI.

---

## 5. Query Key Pattern

Use scoped keys.

```ts
export const applicationQueryKeys = {
  all: ["admin", "applications"] as const,
  list: (filters: ApplicationFilters) => ["admin", "applications", "list", filters] as const,
  detail: (id: string) => ["admin", "applications", "detail", id] as const,
};
```

Rules:

- Include tenant/client/event scope where relevant.
- Include filters in list keys.
- Avoid vague keys like `["data"]`.
- Avoid putting secrets or raw tokens in query keys.

---

## 6. Query Function Rule

Query functions should call a typed API/query boundary, not random inline database logic.

Preferred:

```ts
const applicationsQuery = queryOptions({
  queryKey: applicationQueryKeys.list(filters),
  queryFn: () => fetchAdminApplications(filters),
});
```

Avoid:

```ts
useQuery({
  queryKey: ["applications"],
  queryFn: async () => {
    const supabase = createClient();
    return supabase.from("rsvp_applications").select("*");
  },
});
```

For MVP, prefer `src/server/queries` for server reads and add client fetch wrappers only when the page needs TanStack Query.

---

## 7. Mutations

For protected mutations, prefer Server Actions first.

Use TanStack mutations only when the client UI needs mutation lifecycle control, optimistic updates, or cache invalidation.

Pattern:

```ts
const queryClient = useQueryClient();

const mutation = useMutation({
  mutationFn: approveApplicationClient,
  onSuccess: () => {
    queryClient.invalidateQueries({
      queryKey: applicationQueryKeys.all,
    });
  },
});
```

Rules:

- Avoid optimistic updates for payment/provisioning approval until rollback is safe.
- Do not trust client mutation input.
- Server must still validate permissions and business rules.
- Invalidate exact query scopes after success.

---

## 8. Suspense and Hydration

Do not add TanStack hydration/prefetch complexity by default.

Use hydration only when:

```txt
Server-rendered initial data is important
and client-side refetch/interaction is also needed
```

For early admin pages, simple Server Components are enough.

Avoid `useSuspenseQuery` unless the route has clear Suspense boundaries and loading states.

---

## 9. Experimental TanStack Features

Avoid experimental features for MVP unless explicitly approved:

```txt
experimental_streamedQuery
broadcastQueryClient
persisted query caches
offline mutations
cross-tab sync
```

These may be useful later, but they are not needed for admin-first RSVP launch.

---

## 10. When To Use Zustand

Use Zustand only for **shared client UI state** that is awkward with props, URL params, or local component state.

Good future uses:

```txt
dashboard sidebar/mobile drawer state
multi-step client setup wizard draft UI
public RSVP editor preview state
temporary design/theme preview state
selected rows across admin table sections
```

Avoid for now:

```txt
server data
form state
auth/session truth
payment/provisioning truth
one-component UI state
data that belongs in URL searchParams
```

Server truth stays in Supabase, not Zustand.

---

## 11. Zustand v5 Rules

If added, use v5 patterns.

Basic store:

```ts
import { create } from "zustand";

type UIState = {
  sidebarOpen: boolean;
  setSidebarOpen: (value: boolean) => void;
};

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  setSidebarOpen: (value) => set({ sidebarOpen: value }),
}));
```

Selectors:

```tsx
const sidebarOpen = useUIStore((state) => state.sidebarOpen);
```

For object/array selectors, use shallow comparison:

```tsx
import { useShallow } from "zustand/react/shallow";

const { sidebarOpen, setSidebarOpen } = useUIStore(
  useShallow((state) => ({
    sidebarOpen: state.sidebarOpen,
    setSidebarOpen: state.setSidebarOpen,
  })),
);
```

Rules:

- Select primitives when possible.
- Use `useShallow` for object/array selector returns.
- Do not store server data in Zustand.
- Do not use Zustand as a replacement for Supabase/RLS.
- Do not create stores for tiny one-component state.

---

## 12. Persisted Zustand State

Use `persist` only for harmless user preferences or local UI drafts.

Good examples:

```txt
sidebar collapsed preference
theme preview preference
dismissed local UI hints
temporary unpublished editor UI draft later
```

Avoid persisting:

```txt
auth/session
roles/permissions
payment status
admin approval state
RSVP response truth
guestbook truth
server data that must sync
```

Pattern:

```ts
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type PrefState = {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (value: boolean) => void;
};

export const usePrefStore = create<PrefState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      setSidebarCollapsed: (value) => set({ sidebarCollapsed: value }),
    }),
    {
      name: "webserbisyo-rsvp-prefs",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    },
  ),
);
```

---

## 13. URL State

Use URL state for filters that should be shareable/bookmarkable.

Good uses:

```txt
admin applications status filter
sales summary date range
responses table search/filter later
guestbook moderation status later
```

Prefer:

```txt
searchParams
Next.js router/navigation
```

Do not add `nuqs` unless URL state becomes complex and approved.

---

## 14. State Ownership Table

| State Type                 | Preferred Owner                    |
| -------------------------- | ---------------------------------- |
| Database records           | Supabase + RLS                     |
| Server reads               | Server Components / server queries |
| Mutations                  | Server Actions / route handlers    |
| Form fields                | React Hook Form                    |
| Form submit state          | useActionState / useFormStatus     |
| Simple UI state            | useState                           |
| Shared UI state            | Zustand, only if needed            |
| Client server-state cache  | TanStack Query, only if needed     |
| Filters/pagination         | URL searchParams                   |
| Auth/session truth         | Supabase auth + server checks      |
| Payment/provisioning truth | Supabase tables + server services  |

---

## 15. Anti-Patterns

Avoid:

```txt
installing TanStack Query/Zustand before actual need
fetching server data in useEffect by default
putting Supabase service-role logic in client hooks
using Zustand for server/database truth
using Zustand for form state
persisting auth/payment/admin state in localStorage
object selectors without useShallow
mutating TanStack query cache in place
optimistic approval/payment updates without rollback
using experimental query features for MVP
copying POS state architecture into RSVP
```

---

## 16. MVP Priority

For the next RSVP phases:

```txt
1. Use Server Components + server queries first
2. Use Server Actions for mutations
3. Use React Hook Form for real forms
4. Use URL searchParams for filters
5. Add TanStack Query only for interactive admin/client tables
6. Add Zustand only for shared UI state
```

After adding or changing state libraries, run:

```bash
npm run format:check
npm run lint
npm run typecheck
npm run build
```

If a new state library is installed, update `PROJECT_STATUS.md` with the reason.
