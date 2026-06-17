---
description: RSVP brand and theme planning without overriding default shadcn tokens too early
globs:
  [
    "src/app/globals.css",
    "src/styles/themes.css",
    "src/styles/components.css",
    "src/components/**/*.tsx",
  ]
alwaysApply: false
---

# RSVP Theme & Brand Rules

## 1. Purpose

This document is the source of truth for the **public-facing** WebSerbisyo RSVP visual system. It defines color roles, component patterns, motion rules, accessibility requirements, and the staged token strategy. All public RSVP landing and apply surfaces must follow these rules.

## 2. Scope

**In scope:** Root landing page, `/apply` funnel, public-facing components in `src/components/apply/` and `src/components/landing/`, shared UI used by public pages, style files (`globals.css`, `themes.css`, `components.css`).

**Out of scope:** Admin dashboard, client provisioning, applications/clients/sales admin, Supabase migrations, `src/proxy.ts`, `PROJECT_STATUS.md`, `components.json` (shadcn config).

## 3. Current Implementation Rule

```
Use generated shadcn/ui defaults first.
Keep radix-nova / neutral preset from components.json.
Do not force final RSVP brand colors into globals.css yet.
Document rules here. Implement only after approval.
```

Respect this direction. Do not override shadcn core tokens (`--primary`, `--secondary`, etc.) for RSVP branding. Use the dedicated `--rsvp-*` tokens and local Tailwind classes instead.

## 4. Existing Design Scan

### Strengths to preserve

- **Warm ivory/cream public shell** — `.rsvp-shell` uses a radial/linear gradient blend of `rsvp-accent` and `rsvp-surface` producing a soft ivory canvas.
- **Layered surface system** — `.rsvp-panel` (primary cards) and `.rsvp-panel-muted` (secondary cards) with warm borders and soft shadows.
- **Terracotta RSVP brand CTA** — `bg-rsvp-brand text-rsvp-brand-foreground` consistently used on primary actions.
- **Peach badges and icon chips** — `bg-rsvp-accent text-rsvp-accent-foreground` for labels and icon containers.
- **Large rounded cards** — `rounded-3xl` minimum, `rounded-[2rem]` for hero-level panels.
- **Warm borders** — `border-border/70` throughout, never harsh.
- **Soft shadows** — `box-shadow: 0 22px 50px rgb(15 23 42 / 0.08)` on `.rsvp-panel`.
- **Geist Sans typography** — Clean, modern, consistent heading/body hierarchy.
- **shadcn defaults preserved** — `radix-nova` style, `neutral` base color, CSS variables enabled.
- **Section heading pattern** — `text-rsvp-brand` uppercase tracking label → bold h2 → `text-muted-foreground` body.
- **11 RSVP tokens** centralized in `themes.css` with light/dark variants, bridged via `globals.css` `@theme inline`.

### Known inconsistencies

- **Pro plan card button** falls through to shadcn `default` variant (charcoal) instead of using terracotta. This is a bug, not a design decision.
- **Outline button hover** uses cold `bg-muted` instead of warm peach/ivory.
- **RSVP brand button class string** (`bg-rsvp-brand text-rsvp-brand-foreground hover:bg-rsvp-brand/90`) is copy-pasted 19+ times across the codebase.
- **No `prefers-reduced-motion`** handling exists yet.
- **No semantic `<header>`, `<nav>`, `<footer>`** on public pages — only `<main>` + `<section>`.

## 5. Brand Personality

WebSerbisyo RSVP is a premium digital invitation and RSVP platform for **Filipino celebrations** — weddings, debuts, christenings, birthdays, and more.

The brand feels: **warm, elegant, trustworthy, celebratory, modern but not cold**. Think premium invitation stationery translated to digital — not generic SaaS, not overly playful.

## 6. Visual Keywords

Warm ivory · terracotta · floral elegance · premium invitation feel · soft shadows · spacious layout · Filipino celebration · handcrafted quality · modern but personal

## 7. Color Roles

### Active tokens (defined in `src/styles/themes.css`)

| Token                      | Light value            | Role                                   |
| -------------------------- | ---------------------- | -------------------------------------- |
| `--rsvp-brand`             | `oklch(0.61 0.16 35)`  | Terracotta — primary CTA, brand accent |
| `--rsvp-brand-foreground`  | `oklch(0.99 0.01 85)`  | Warm ivory — text on brand surfaces    |
| `--rsvp-accent`            | `oklch(0.96 0.03 58)`  | Light peach — badge bg, icon chip bg   |
| `--rsvp-accent-foreground` | `oklch(0.31 0.05 32)`  | Dark brown — text on accent surfaces   |
| `--rsvp-surface`           | `oklch(0.99 0.01 85)`  | Near-white ivory — card backgrounds    |
| `--rsvp-surface-muted`     | `oklch(0.97 0.01 85)`  | Deeper ivory — muted card backgrounds  |
| `--rsvp-border`            | `oklch(0.91 0.02 60)`  | Warm beige — borders                   |
| `--rsvp-ring`              | `oklch(0.75 0.1 42)`   | Warm amber — focus rings               |
| `--rsvp-success`           | `oklch(0.73 0.14 152)` | Sage green — confirmed states          |
| `--rsvp-warning`           | `oklch(0.78 0.15 70)`  | Gold/amber — pending states            |

### Planned tokens (document only — do not add to CSS yet)

| Token                 | Suggested value       | Purpose                             |
| --------------------- | --------------------- | ----------------------------------- |
| `--rsvp-brand-hover`  | `oklch(0.53 0.17 33)` | Darker terracotta for CTA hover     |
| `--rsvp-brand-active` | `oklch(0.48 0.17 31)` | Deepest terracotta for active/press |

### Inherited from shadcn (do not duplicate)

Text primary inherits `--foreground`. Text muted inherits `--muted-foreground`. Error/destructive inherits `--destructive`. These do not need separate RSVP tokens.

## 8. Typography

| Role                 | Treatment                                                           |
| -------------------- | ------------------------------------------------------------------- |
| Font family          | Geist Sans (`--font-geist-sans`) for both headings and body         |
| Page title (h1)      | `text-4xl font-semibold tracking-tight` or `sm:text-5xl`            |
| Section heading (h2) | `text-3xl font-semibold tracking-tight`                             |
| Card title           | `text-xl` or `text-2xl` via `CardTitle`                             |
| Section label        | `text-rsvp-brand text-sm font-semibold tracking-[0.22em] uppercase` |
| Body copy            | `text-muted-foreground text-base leading-7` or `text-sm leading-6`  |
| Small/caption        | `text-xs`                                                           |

Heading font (`--font-heading`) currently maps to Geist Sans (same as body). No separate display font is used.

## 9. Layout

| Property              | Value                                                         |
| --------------------- | ------------------------------------------------------------- |
| Page max-width        | `max-w-6xl` (apply landing) or `max-w-5xl` (form pages)       |
| Section vertical gap  | `gap-14` between major sections                               |
| Section padding       | `px-4 sm:px-6 lg:px-8`, `py-10 lg:py-14`                      |
| Card internal padding | `px-4` (CardContent default), `px-6 sm:px-10` for hero panels |
| Grid gap              | `gap-4` to `gap-5` between cards                              |
| Background            | `.rsvp-shell` gradient — not a flat color                     |

## 10. Button System

### Primary RSVP CTA

- **Base:** `bg-rsvp-brand text-rsvp-brand-foreground`
- **Hover:** `hover:bg-rsvp-brand/90` (current, acceptable temporarily)
- **Preferred future hover:** A dedicated `--rsvp-brand-hover` token at `oklch(0.53 0.17 33)` — darker terracotta, not opacity reduction
- **Active:** deeper terracotta (future `--rsvp-brand-active`)
- **Text:** warm ivory
- **Arrow icon:** `transition-transform` → `group-hover:translate-x-[3px]`
- **CRITICAL: No charcoal/black hover.** The orange CTA must never transition to charcoal on hover.

### Secondary RSVP Button (outline)

- **Base:** shadcn `variant="outline"` — `bg-background` with `border-border`
- **Current hover:** `hover:bg-muted` (cold neutral gray — not ideal)
- **Preferred hover:** `hover:bg-rsvp-accent/60` — warm peach tint
- **Text:** charcoal (`text-foreground`)
- **No heavy dark hover**

### Dark RSVP Button (intentional variant only)

- **Base:** `bg-primary text-primary-foreground` (charcoal from shadcn default)
- **Hover:** charcoal at 80% opacity (shadcn default behavior)
- **Use only for:** intentional emphasis in dark/contrast sections
- **NOT for:** primary CTA hover fallback, plan card buttons

### Text / Messenger Button (ghost)

- **Base:** transparent, shadcn `variant="ghost"`
- **Hover:** `hover:bg-muted` or soft background
- **Low-emphasis only** — used for "Message us", "Continue on Messenger"

### Known bug: Pro plan card button

The `PlanCard` component with `tone="default"` applies **no custom className** to its `<Button>`, causing it to fall through to the shadcn `default` variant (charcoal). The `tone="featured"` variant correctly uses `bg-rsvp-brand`. Both plan card CTAs should use the primary RSVP CTA pattern. If differentiation is needed, use secondary/outline for Pro — never charcoal for a public "Apply" action.

## 11. Card System

| Class               | Usage                                                                                                | Properties                                                                                            |
| ------------------- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `.rsvp-panel`       | Primary cards (hero panel, form card, info cards)                                                    | `border: 1px solid var(--rsvp-border)`, warm ivory bg, `box-shadow: 0 22px 50px rgb(15 23 42 / 0.08)` |
| `.rsvp-panel-muted` | Secondary cards (step cards, FAQ card, followup)                                                     | Lighter border at 82% opacity, `rsvp-surface-muted` bg                                                |
| Radius              | `rounded-3xl` standard, `rounded-[2rem]` for hero-level panels, `rounded-[1.75rem]` for nested cards |
| Border              | Always `border-border/70` — never bare `border-border`                                               |
| Featured card       | Add `border-rsvp-brand/40` and warm shadow `rgba(123,63,38,0.18)`                                    |

## 12. Badge / Pill System

| Variant           | Classes                                                           | Usage                                 |
| ----------------- | ----------------------------------------------------------------- | ------------------------------------- |
| Default label     | `bg-rsvp-accent text-rsvp-accent-foreground hover:bg-rsvp-accent` | "WebSerbisyo RSVP" label, "Pro" badge |
| Featured/brand    | `bg-rsvp-brand text-rsvp-brand-foreground hover:bg-rsvp-brand`    | "Max" badge, status badges            |
| Nav wordmark pill | `bg-rsvp-accent text-rsvp-accent-foreground` small pill           | "[RSVP]" in top nav wordmark          |

Always include `w-fit` on badges to prevent stretching.

## 13. Icon Chip System

Rounded containers holding Lucide icons.

| Size         | Classes                                                |
| ------------ | ------------------------------------------------------ |
| Standard     | `flex size-11 items-center justify-center rounded-2xl` |
| Large        | `flex size-12 items-center justify-center rounded-2xl` |
| Fill: accent | `bg-rsvp-accent text-rsvp-accent-foreground`           |
| Fill: brand  | `bg-rsvp-brand text-rsvp-brand-foreground`             |
| Icon size    | `size-5`                                               |

## 14. FAQ / Form System

### FAQ Accordion

- Wrap in a `.rsvp-panel` card with `rounded-3xl`
- Use shadcn `Accordion type="single" collapsible`
- Answers use `text-muted-foreground`
- Default shadcn styling — no custom RSVP overrides needed

### Form

- Wrap in a `.rsvp-panel` card with `rounded-[2rem]`
- Use shadcn `Input`, `Select`, `Textarea`, `Label`
- Error messages: `text-destructive text-sm`
- Submit button: primary RSVP CTA pattern
- Grid layout: `grid gap-5 md:grid-cols-2` for field pairs

## 15. Top Nav Rules

### Structure

```
[WebSerbisyo [RSVP]]   [Features]  [Event Types]  [How It Works]   [Start My RSVP Website →]
```

### Wordmark

"WebSerbisyo" in Geist Sans medium weight. "[RSVP]" as a small `bg-rsvp-accent text-rsvp-accent-foreground` pill badge inline.

### CTA

"Start My RSVP Website" — primary RSVP CTA button (`bg-rsvp-brand`) with `ArrowRight` icon.

### Client Login

Footer-only. Do not place in top nav — it distracts from the public conversion funnel. An existing `/login` route is available at `src/app/(auth)/login/`.

### Glass behavior

| State                | Background           | Blur                  | Border                           |
| -------------------- | -------------------- | --------------------- | -------------------------------- |
| Initial (top)        | `bg-rsvp-surface/70` | `backdrop-blur(8px)`  | none                             |
| After scroll (>50px) | `bg-rsvp-surface/85` | `backdrop-blur(16px)` | `border-b border-rsvp-border/50` |

### Positioning

- `fixed top-4 left-1/2 -translate-x-1/2` — floating island
- `rounded-2xl`, `max-w-5xl`, `w-full`
- Shadow: `0 4px 20px rgb(0 0 0 / 0.06)`
- Text: `text-foreground` (charcoal) — must remain readable against warm glass
- `z-50` to stay above hero content

### Mobile behavior

- Hamburger icon replaces nav links at `md` breakpoint
- Mobile menu via shadcn `Sheet` from top
- Large tap targets (min 44×44px)
- CTA button remains visible in mobile menu
- Glass background on mobile menu panel

## 16. Section 1 Visual Cover Hero Rules

### Assets

| File                                                    | Role                             | Dimensions | Size   |
| ------------------------------------------------------- | -------------------------------- | ---------- | ------ |
| `/images/landing/rsvp-hero-bg-floral-envelope.jpeg`     | Full-bleed background            | 2752×1536  | 2.2 MB |
| `/images/landing/rsvp-hero-object-invitation-phone.png` | Centered floating product object | 2048×1529  | 1.9 MB |

### Layout

- Full viewport height: `min-h-dvh` (with `min-h-screen` fallback)
- Background: fills entire section via CSS `background-image` with `background-size: cover; background-position: center` OR Next.js `Image` with `fill` + `priority`
- Object: centered horizontally, vertically centered or slightly above center
- Object max-width: ~500px desktop, ~280px mobile
- No large headline in Section 1 — the visual IS the statement
- No long subcopy in Section 1

### Optional microcopy

```
Digital RSVP websites for Filipino celebrations
```

`text-sm` or `text-base`, positioned below the object or near viewport bottom. Color depends on background contrast — warm ivory if dark area, charcoal if light area.

### Optional scroll cue

```
Explore ↓
```

Positioned at absolute bottom center. Subtle bounce animation. `text-muted-foreground` or warm ivory.

### Object behavior

- The invitation/phone should feel like a premium physical invitation — not a flat screenshot
- Gentle floating animation on desktop (CSS `@keyframes`)
- Static or minimal motion on mobile for performance

### What Section 1 is NOT

- Not a hero with a headline, subheadline, and CTA grid
- Not a feature overview
- Not a pricing section
- Real product copy and conversion content starts in Section 2 (to be planned later)

## 17. Motion Rules

### Package status

**No motion library installed.** Neither `framer-motion`, `motion`, nor `motion/react` appear in `package.json`. Only `tw-animate-css` exists for shadcn animation utilities.

**Do not install Framer Motion yet.** Use CSS-only animation for the initial landing page implementation.

### Allowed CSS animations

| Element             | Animation                 | Spec                                                                                          |
| ------------------- | ------------------------- | --------------------------------------------------------------------------------------------- |
| Top nav             | Fade in on load           | `opacity 0→1`, `0.4s ease-out`                                                                |
| Top nav glass       | Strengthen on scroll      | JS scroll listener toggles class, CSS transition on bg/blur                                   |
| Hero background     | Very slow scale-in        | `scale(1) → scale(1.03)`, 15s linear, CSS `@keyframes`                                        |
| Hero object         | Gentle floating           | `translateY(0) → translateY(-8px) → translateY(0)`, 6s ease-in-out infinite, CSS `@keyframes` |
| Microcopy           | Fade-up on load           | `opacity 0→1, translateY(12px→0)`, 0.6s, 0.5s delay                                           |
| Scroll cue          | Subtle bounce             | `translateY(0→4px→0)`, 2s ease-in-out infinite                                                |
| CTA arrow           | Translate on hover        | `translateX(0→3px)`, `transition-transform 0.2s`                                              |
| Cards (future)      | Fade-up on viewport entry | IntersectionObserver + CSS class toggle                                                       |
| Card hover (future) | Lift                      | `translateY(0→-2px)` + shadow increase, CSS `transition`                                      |

### Animations to avoid

- ❌ Typewriter / text-reveal effects
- ❌ Particle backgrounds
- ❌ Auto-advancing carousels
- ❌ Heavy parallax on mobile
- ❌ Bouncy spring nav motion
- ❌ Large 3D card tilt
- ❌ Excessive stagger delays (>100ms per item)
- ❌ Page transition animations (premature for MVP)

### Reduced motion

All continuous/decorative animations **must** respect `prefers-reduced-motion: reduce`:

```css
@media (prefers-reduced-motion: reduce) {
  .hero-float,
  .hero-bg-scale,
  .scroll-cue-bounce {
    animation: none;
  }
}
```

Keep instant state changes (color, opacity on hover). Remove transforms and loops.

### Future Framer Motion upgrade path

Framer Motion becomes worthwhile when:

- Staggered card reveals need precise orchestration
- Exit/enter animations are needed for route transitions
- Gesture-driven interactions (drag, swipe) are added
- `AnimatePresence` is needed for conditional UI

Until then, CSS-only is sufficient and avoids a ~30KB bundle addition.

## 18. Accessibility Rules

| Requirement         | Rule                                                                                                                                                                  |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Color contrast      | All text on RSVP surfaces must meet WCAG AA (4.5:1 normal, 3:1 large). Terracotta on ivory passes. Verify microcopy on hero background.                               |
| Focus-visible       | All interactive elements must show `focus-visible` ring. shadcn defaults handle this via `focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50`. |
| Button labels       | Every button must have readable text or `aria-label`. Icon-only buttons require `aria-label`.                                                                         |
| Keyboard navigation | Full tab order through nav links, CTA, plan cards, form fields, FAQ accordion.                                                                                        |
| Mobile tap targets  | Minimum 44×44px for all interactive elements.                                                                                                                         |
| Semantic structure  | Public pages must use `<header>` (nav), `<main>`, `<section>`, `<footer>`. Not just `<div>`.                                                                          |
| FAQ accordion       | Use Radix `Accordion` primitives (already in use) — these provide ARIA roles automatically.                                                                           |
| Hero images         | Background floral image: decorative → `alt=""` or CSS background. Object phone: `alt="RSVP invitation preview on a phone"`.                                           |
| Reduced motion      | See Motion Rules §17.                                                                                                                                                 |

## 19. Performance Rules

| Concern                      | Rule                                                                                                                                                                  |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hero background JPEG (2.2MB) | Use CSS `background-image` or Next.js `Image fill` with `priority`. Consider serving WebP via Next.js image optimization. Do not lazy-load — it's above the fold.     |
| Hero object PNG (1.9MB)      | Use Next.js `<Image>` with `priority` and explicit `width`/`height`. The PNG transparency is needed — cannot convert to JPEG. Consider `quality={85}` to reduce size. |
| Below-fold images            | Lazy-load everything below the hero fold.                                                                                                                             |
| `backdrop-filter`            | Limit to the nav glass effect only. Do not stack multiple blur layers. Keep blur radius ≤16px.                                                                        |
| Scroll listeners             | Use passive scroll listeners for nav glass toggle. Throttle or use `requestAnimationFrame`. No heavy computation in scroll handlers.                                  |
| CSS animations               | Prefer `transform` and `opacity` only (GPU-composited). Avoid animating `width`, `height`, `margin`, `box-shadow` on scroll.                                          |
| Bundle size                  | Do not install Framer Motion until CSS-only proves insufficient. Each new dependency must justify its weight.                                                         |

## 20. Do / Don't List

### Do

- ✅ Use `.rsvp-shell` as the page background for public RSVP pages
- ✅ Use `.rsvp-panel` and `.rsvp-panel-muted` for card containers
- ✅ Use `bg-rsvp-brand text-rsvp-brand-foreground` for primary CTAs
- ✅ Use `bg-rsvp-accent text-rsvp-accent-foreground` for badges and icon chips
- ✅ Use `border-border/70` on card borders
- ✅ Use `rounded-3xl` or larger for cards
- ✅ Use `text-rsvp-brand` for section labels
- ✅ Use semantic HTML (`<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`)
- ✅ Respect `prefers-reduced-motion`
- ✅ Test color contrast on all surfaces
- ✅ Keep motion subtle and purposeful

### Don't

- ❌ Override shadcn core tokens (`--primary`, `--secondary`, etc.) for RSVP branding
- ❌ Let primary orange CTA hover to charcoal/black
- ❌ Use cold `bg-muted` hover on public RSVP outline buttons (use warm peach instead)
- ❌ Use the shadcn `default` button variant as a public RSVP CTA (it's charcoal)
- ❌ Add Framer Motion before CSS-only animation is proven insufficient
- ❌ Use typewriter, particle, or auto-carousel effects
- ❌ Stack multiple `backdrop-filter` layers
- ❌ Add heavy parallax on mobile
- ❌ Put "Client Login" in the top nav
- ❌ Add a large headline or long subcopy to Section 1 hero
- ❌ Modify admin components, backend, migrations, or proxy for theme work
- ❌ Use `rounded-lg` or smaller radii on public RSVP cards (too sharp for the brand)

## 21. Token Strategy / Staged Adoption

| Stage                           | Action                                                                                                                                                                                                   | When                              |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| **1 — Document**                | Document all rules in this file. Keep RSVP-specific styles as local Tailwind classes in component `className` props.                                                                                     | Now (current stage)               |
| **2 — Extract patterns**        | Extract repeated className strings (e.g., the 19× `bg-rsvp-brand text-rsvp-brand-foreground hover:bg-rsvp-brand/90` pattern) into documented constants or CVA variants, only after repetition is proven. | After landing page ships          |
| **3 — Add hover/active tokens** | Add `--rsvp-brand-hover` and `--rsvp-brand-active` to `themes.css` and bridge in `globals.css`, only when the button system is formally consolidated.                                                    | After 2–3 public pages are stable |
| **4 — Protect shadcn defaults** | Do not override shadcn core tokens (`--primary`, `--secondary`, `--accent`, etc.) unless there is a strong, documented reason approved in this file.                                                     | Ongoing rule                      |

## 22. Files Scanned

This document was informed by a visual system scan of the following files:

### Routes

- `src/app/(public)/page.tsx` — root landing placeholder
- `src/app/(public)/apply/page.tsx` — apply landing
- `src/app/(public)/apply/start/page.tsx` — apply form
- `src/app/(public)/apply/success/page.tsx` — apply success

### Components

- `src/components/apply/apply-landing.tsx`
- `src/components/apply/apply-form.tsx`
- `src/components/apply/apply-success.tsx`
- `src/components/apply/how-it-works.tsx`
- `src/components/apply/plan-card.tsx`
- `src/components/apply/messenger-followup.tsx`
- `src/components/apply/payment-option-card.tsx`
- `src/components/apply/payment-option-picker.tsx`
- `src/components/landing/` (empty — `.gitkeep` only)
- `src/components/ui/button.tsx`
- `src/components/ui/card.tsx`
- `src/components/ui/badge.tsx`
- `src/components/ui/accordion.tsx`
- `src/components/ui/input.tsx`

### Style and config

- `src/app/globals.css`
- `src/styles/themes.css`
- `src/styles/components.css`
- `components.json`
- `package.json`
- `postcss.config.mjs`

### Assets

- `public/images/landing/rsvp-hero-bg-floral-envelope.jpeg` (2752×1536, 2.2 MB)
- `public/images/landing/rsvp-hero-object-invitation-phone.png` (2048×1529, 1.9 MB)
- `public/images/brand/webserbisyo-logo.jpeg` (88 KB)

## 23. Next Implementation Plan

The next implementation task should be **landing page top nav + Section 1 visual cover hero only**.

Scope:

- Create nav component(s) in `src/components/landing/`
- Create hero section component in `src/components/landing/`
- Update `src/app/(public)/page.tsx` to render the nav and hero
- Use CSS-only animation (no Framer Motion)
- Follow all rules documented in this file
- Support `prefers-reduced-motion`

Do **not** implement additional landing sections (features, event types, pricing, etc.) in the nav+hero task. Those sections will be planned and implemented separately after Section 1 is approved.
