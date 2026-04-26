---
description: ESLint, Prettier, TypeScript, and check rules for WebSerbisyo RSVP
globs: ["eslint.config.*", "prettier.config.*", ".prettierrc*", "tsconfig.json", "package.json"]
alwaysApply: false
---

# Linting & Code Quality Rules - WebSerbisyo RSVP

Verified against official Next.js, ESLint, TypeScript ESLint, Prettier, and Tailwind Prettier plugin sources as of 2026-04-27.

Use installed `package.json` / `package-lock.json` as source of truth. Do not upgrade lint/format tooling blindly.

Current reference versions:

```txt
eslint: 10.x latest, but keep project-installed version unless intentionally upgrading
eslint-config-next: 16.2.x
typescript-eslint: 8.59.x
prettier: 3.8.x
prettier-plugin-tailwindcss: 0.7.x
husky: 9.1.x, optional
lint-staged: 16.4.x, optional
```

This RSVP project uses **npm**, not pnpm.

---

## 1. Next.js 16 Lint Rule

Do not use:

```bash
next lint
npx next lint
```

Next.js 16 removed `next lint`, and `next build` no longer runs linting automatically.

Use project scripts instead:

```bash
npm run lint
npm run typecheck
npm run build
```

Do not add `eslint` options to `next.config.ts`; that config option is removed.

---

## 2. Required Checks

Before marking real code work complete, run:

```bash
npm run format:check
npm run lint
npm run typecheck
npm run build
```

For formatting changes, run:

```bash
npm run format
```

Rules:

- Never claim checks passed unless they were actually run.
- If a script does not exist, report it clearly.
- Do not commit broken lint/type/build unless the user explicitly approves a checkpoint commit.
- `npm run build` is required before deployment-related commits.

---

## 3. package.json Script Baseline

Preferred scripts:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint . --max-warnings 0",
    "lint:fix": "eslint . --fix",
    "typecheck": "tsc --noEmit",
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md,css}\"",
    "format:check": "prettier --check \"**/*.{ts,tsx,js,jsx,json,md,css}\"",
    "check": "npm run format:check && npm run lint && npm run typecheck && npm run build"
  }
}
```

Use the actual existing script names if the scaffold already differs. Do not rename scripts unnecessarily during feature work.

---

## 4. ESLint Rules

Use ESLint flat config.

Rules:

- Keep generated Next.js ESLint config unless there is a real reason to change it.
- Use `eslint.config.mjs` / `eslint.config.js`, not `.eslintrc`.
- Do not add heavy typed linting until the project needs it.
- Do not add Biome unless explicitly approved.
- Do not silence rules globally to pass quickly.

Recommended rule preferences:

```txt
no unused variables
no accidental console.log
prefer const
type-only imports when configured
warn or block explicit any depending on current project config
React Hooks rules enabled
Next.js rules enabled
```

Allowed console methods:

```txt
console.warn
console.error
```

Avoid:

```txt
console.log
console.debug
```

Temporary debug logs must be removed before commit.

---

## 5. TypeScript Rules

Keep TypeScript strict.

Rules:

- Minimize `any`.
- Prefer explicit domain types for server actions, services, queries, and API responses.
- Use `import type` for type-only imports when the config enforces it.
- Do not weaken `tsconfig.json` just to make code pass.
- Do not change Next-managed `jsx` settings without a clear reason.
- Keep `skipLibCheck` as generated unless intentionally changing project-wide type strictness.

For critical backend code:

```txt
server actions
services
queries
RLS-related helpers
payment/approval logic
email/audit/meta services
```

Prefer explicit input/output types.

---

## 6. Prettier Rules

Use Prettier for formatting.

Recommended `.prettierrc` baseline:

```json
{
  "semi": true,
  "singleQuote": false,
  "tabWidth": 2,
  "trailingComma": "all",
  "printWidth": 80,
  "plugins": ["prettier-plugin-tailwindcss"],
  "tailwindStylesheet": "./src/app/globals.css"
}
```

Rules:

- Use whatever formatting style is already committed if the scaffold differs.
- Do not fight Prettier formatting manually.
- For Tailwind CSS v4, configure `tailwindStylesheet` so class sorting understands the CSS entry file.
- Keep Tailwind class sorting enabled if `prettier-plugin-tailwindcss` is installed.
- Do not add multiple class sorting tools.

---

## 7. Tailwind Class Formatting

Use Prettier Tailwind plugin when installed.

Rules:

- Let the plugin sort classes.
- Do not manually reorder classes after formatting.
- Keep `cn()`, `cva()`, and `clsx()` compatible with plugin sorting when configured.
- Prefer readable component extraction over extremely long class strings.

If class names become too large, extract a component or use `cva` only if the project already uses it.

---

## 8. Husky and lint-staged

Do not add Husky/lint-staged by default during scaffold or admin MVP work.

Add only when the user approves pre-commit automation.

If approved:

```bash
npm install -D husky lint-staged
npx husky init
```

Minimal lint-staged config:

```json
{
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md,css}": ["prettier --write"]
  }
}
```

Rules:

- Keep hooks lightweight.
- Do not make commits painfully slow.
- Full `npm run build` belongs before push/deploy, not necessarily pre-commit.

---

## 9. Common Fixes

Unused variable:

```ts
const { data, error: _error } = result;
```

Type-only import:

```ts
import type { Application } from "@/types/rsvp";
```

Intentional floating promise:

```ts
void sendNonBlockingMetaEvent();
```

Effect dependency:

```tsx
useEffect(() => {
  refreshData(clientId);
}, [clientId]);
```

Do not suppress warnings with comments unless there is a documented reason.

---

## 10. Security and Secrets

Linting/checking must protect against accidental leaks.

Rules:

- Do not commit `.env.local`.
- Do not hardcode API keys.
- Do not expose service-role keys in `NEXT_PUBLIC_*`.
- Do not leave debug logs with personal data.
- Do not log full application payloads, payment references, or auth tokens.
- Do not show raw Supabase errors to public users.

---

## 11. Deployment Checklist

Before Vercel deployment or production checkpoint:

```bash
git status -sb
npm run format:check
npm run lint
npm run typecheck
npm run build
npm audit
```

Also verify:

```txt
.env.example is safe and updated
.env.local is untracked
no console.log left behind
no hardcoded secrets
PROJECT_STATUS.md reflects meaningful completed work
```

---

## 12. Anti-Patterns

Avoid:

```txt
next lint
pnpm commands in this npm project
eslint config in next.config.ts
weakening tsconfig to hide errors
disabling rules globally to rush
committing formatting-only noise with feature changes when avoidable
leaving console.log
using any for approval/payment/security flows
adding Husky/lint-staged before approved
claiming checks passed without running them
copying POS monorepo lint assumptions
```

---

## 13. MVP Priority

For the RSVP MVP, code quality priority is:

```txt
1. Keep generated scaffold checks passing
2. Use npm scripts only
3. Keep ESLint flat config
4. Keep Prettier + Tailwind class sorting
5. Keep TypeScript strict for backend/auth/payment/email/audit code
6. Add pre-commit automation later only if useful
```
