---
description: Tailwind CSS v4 and shadcn styling rules for WebSerbisyo RSVP MVP
globs: ["**/*.css", "**/*.tsx", "postcss.config.*", "components.json"]
alwaysApply: true
---

# Tailwind CSS v4 Rules - WebSerbisyo RSVP

Verified against official Tailwind CSS v4 docs/releases as of 2026-04-27.

Use the installed `package.json` / `package-lock.json` as the project source of truth. Do not upgrade Tailwind packages blindly. If upgrading Tailwind, shadcn, or animation CSS packages, check official release notes and run all checks.

Current target: Tailwind CSS `4.2.x`.

---

## 1. Styling Direction

For the RSVP MVP, start with:

```txt
Tailwind v4 defaults
+ generated shadcn/ui tokens
+ current radix-nova / neutral preset from components.json
```

Do not add custom RSVP brand colors to `globals.css` yet.

Brand/theme work belongs later in:

```txt
src/styles/themes.css
markdown/rsvp-theme-brand.md
```

Rules:

- Keep `src/app/globals.css` minimal.
- Keep shadcn global tokens intact.
- Use component-scoped Tailwind classes for normal UI.
- Do not hardcode Pro/Max wedding/debut theme colors into global tokens yet.
- Do not copy POS brand colors.
- Do not create a large custom `@theme` until reusable RSVP themes are planned.

---

## 2. Tailwind v4 Import

Use:

```css
@import "tailwindcss";
```

Do not use old v3 directives:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

---

## 3. shadcn/ui Integration

This project should follow the generated shadcn setup.

Expected pattern:

```css
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
}
```

Rules:

- Use `@theme inline` for shadcn CSS variables.
- Keep current generated neutral/radix-nova tokens unless intentionally changing theme.
- Do not replace shadcn variables with custom brand values during backend/admin MVP work.
- Use `tw-animate-css` if the generated shadcn setup uses it.
- Do not add `tailwindcss-animate` unless the current shadcn setup requires it.

---

## 4. CSS File Boundaries

Use this structure:

```txt
src/app/globals.css        -> Tailwind import, shadcn tokens, base defaults only
src/styles/themes.css      -> future RSVP theme presets
src/styles/components.css  -> shared component-level patterns only when needed
```

Rules:

- Do not dump page-specific styles into `globals.css`.
- Do not add large theme systems before actual reusable templates exist.
- Prefer Tailwind classes in components.
- Use CSS files only for global tokens, repeated patterns, or cases Tailwind cannot express cleanly.

---

## 5. PostCSS

For Tailwind v4 with PostCSS:

```js
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

Rules:

- Do not add old Tailwind v3 PostCSS setup.
- Do not add `autoprefixer` unless the project specifically needs it.
- Do not add `postcss-import`; Tailwind v4 handles imports.
- Do not add `@tailwindcss/container-queries`; container queries are built in.

---

## 6. Important v4 Syntax

Use v4 syntax:

```txt
bg-black/50              not bg-opacity-50
text-black/70            not text-opacity-70
border-black/20          not border-opacity-20
bg-linear-to-r           not bg-gradient-to-r
shadow-xs                not old shadow-sm assumptions
rounded-xs               not old rounded-sm assumptions
outline-hidden           not outline-none for forced-colors hiding
bg-(--my-color)          not bg-[--my-color]
flex!                    not !flex
*:first:pt-0             not first:*:pt-0
bg-top-left              not bg-left-top
object-top-left          not object-left-top
```

---

## 7. Useful v4 / v4.1 Features

Allowed when useful:

```txt
@container and @sm/@lg container queries
text-shadow-* for hero/marketing text
mask-* for RSVP visual polish
drop-shadow-<color> for icon/image polish
wrap-anywhere for long names/emails/URLs
field-sizing-content for textareas
pointer-coarse / pointer-fine for touch-specific UI
user-valid / user-invalid for native form states
noscript:block for no-JS fallback messaging
```

Do not use these just to look modern. Use them only when they solve a real UI problem.

---

## 8. Container Queries

Container queries are built in.

```tsx
<div className="@container">
  <div className="grid grid-cols-1 @md:grid-cols-2 @lg:grid-cols-3">{/* cards */}</div>
</div>
```

Good RSVP uses:

- dashboard cards
- application/admin tables
- responsive event setup panels
- future RSVP public sections

---

## 9. Forms and Admin UI

For MVP forms/tables:

- Use shadcn components first.
- Use Tailwind utilities directly.
- Keep spacing and typography simple.
- Do not introduce heavy theme abstractions.
- Use `text-muted-foreground`, `bg-card`, `border-border`, `text-foreground`, etc. from shadcn tokens.
- Avoid raw hex colors unless inside a later approved theme file.

Preferred examples:

```tsx
<Card className="border-border bg-card text-card-foreground">
  <CardHeader>
    <CardTitle>Applications</CardTitle>
    <CardDescription className="text-muted-foreground">
      Review submitted RSVP website applications.
    </CardDescription>
  </CardHeader>
</Card>
```

---

## 10. Brand Theme Rule

Do not set final RSVP brand colors in this file.

For now:

```txt
Use default shadcn neutral/radix-nova tokens.
Keep UI clean and production-readable.
Add RSVP brand theme later after backend/admin MVP is stable.
```

When branding begins later:

- Define theme options in `src/styles/themes.css`.
- Document decisions in `markdown/rsvp-theme-brand.md`.
- Keep themes reusable for future Basic/Premium Basic template library.
- Do not overwrite default shadcn tokens globally without approval.

---

## 11. Migration Notes

If migrating old Tailwind v3 code:

- Replace `@tailwind` directives with `@import "tailwindcss"`.
- Move JS config values to CSS-first `@theme` only when needed.
- Replace removed opacity utilities with slash opacity.
- Update renamed utilities.
- Replace `tailwindcss-animate` with `tw-animate-css` only if matching shadcn setup.
- Use the official upgrade tool only on a branch and review the diff.

```bash
npx @tailwindcss/upgrade
```

Do not run migration tools blindly on this RSVP scaffold.

---

## 12. Anti-Patterns

Avoid:

```txt
custom brand colors in globals.css too early
copying POS color tokens
large @theme blocks with unused tokens
hardcoded hex colors across components
tailwind.config.js for normal v4 setup
old @tailwind directives
old opacity utilities
old bg-gradient-* syntax
page-specific CSS in globals.css
overusing masks/text shadows in admin UI
adding animation/theme libraries before needed
```

---

## 13. Checks

After styling/config changes, run:

```bash
npm run format:check
npm run lint
npm run typecheck
npm run build
```

After visual changes, also smoke test affected routes in the browser.
