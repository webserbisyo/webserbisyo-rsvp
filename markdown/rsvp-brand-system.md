---
name: rsvp-brand-system
description: Source of truth for WebSerbisyo RSVP public and client-facing visual identity. Defines tokens, color ratios, interaction rules, accessibility, motion, dark mode strategy, and component behavior without overriding shadcn defaults too early.
alwaysApply: false
---

# WebSerbisyo RSVP Brand System

## 1. Purpose

This document defines the official visual system for **WebSerbisyo RSVP**.

It exists to ensure all **public-facing pages** and future **client dashboard surfaces** share one premium visual language without inheriting the neutral admin SaaS styling.

This is the brand contract for:

- Public landing pages
- `/apply` funnel
- Public event pages
- Future client dashboard surfaces

This does **not** apply to:

- Platform admin dashboard
- Internal operations UI
- Supabase/backend files
- `src/proxy.ts`
- `PROJECT_STATUS.md`
- `components.json`

---

# 2. Brand Positioning

WebSerbisyo RSVP is a premium digital invitation and RSVP platform designed for **Filipino celebrations**.

Examples:

- Weddings
- Debuts
- Birthdays
- Christenings
- Anniversaries
- Family celebrations

The brand must feel:

- Warm
- Elegant
- Trustworthy
- Editorial
- Handcrafted
- Premium but approachable
- Emotional, not corporate

Avoid:

- Generic SaaS styling
- Startup blue gradients
- Cold grayscale product marketing
- Playful cartoon styling
- Loud neon palettes

Core inspiration:

Premium invitation stationery translated into digital experiences.

---

# 3. Design Principle

## 60 / 30 / 10 Color Rule

All RSVP public surfaces should approximately follow:

## 60% Foundation

Warm ivory / cream surfaces.

Used for:

- Page backgrounds
- Hero shells
- Cards
- Sections
- Forms

Purpose:

Creates warmth, softness, and premium invitation feel.

---

## 30% Structure

Charcoal / cocoa / espresso neutrals.

Used for:

- Headings
- Body text
- Borders
- Navigation text
- Icons

Purpose:

Creates readability and trust.

---

## 10% Accent

Terracotta / coral / warm clay accents.

Used for:

- CTA buttons
- Active states
- Badges
- Focus accents
- Interactive highlights

Purpose:

Creates energy, warmth, and conversion emphasis.

---

# 4. Token Strategy

Do **not** override shadcn core tokens yet.

Keep:

- radix-nova preset
- neutral base
- CSS variables enabled

RSVP uses dedicated tokens:

## Foundation Tokens

```css
--rsvp-surface
--rsvp-surface-muted
--rsvp-shell

Purpose:

Backgrounds and panels.

Structure Tokens
--rsvp-foreground
--rsvp-muted
--rsvp-border

Purpose:

Typography, separators, visual structure.

Accent Tokens
--rsvp-brand
--rsvp-brand-hover
--rsvp-brand-active
--rsvp-ring

Purpose:

CTAs, hover states, focus states.

Feedback Tokens
--rsvp-success
--rsvp-warning
--rsvp-destructive

Purpose:

Status communication.

5. Light Mode Palette
Foundation

Ivory / warm paper surfaces.

Examples:

#faf7f2
#f5efe8
Structure

Charcoal / cocoa text.

Examples:

#1d1b18
#332c27
Accent

Terracotta / coral.

Examples:

#c96b48
#b85a39
Support

Warm gold / sage.

Examples:

Gold for pending
Sage for confirmed
6. Dark Mode Palette

Dark mode must feel like:

Luxury evening invitation.

Not SaaS dark mode.

Avoid:

Blue-black
Tech gray
Neon accents

Use:

Foundation

Espresso / mocha.

Examples:

#171311
#211a17
Structure

Warm ivory text.

Examples:

#f7f2eb
Accent

Muted terracotta.

Examples:

#d97b57
7. Typography

Font system:

Headings

Geist Sans

Traits:

Confident
Clean
Premium
Body

Geist Sans

Traits:

Highly readable
Modern
Consistent

Rules:

H1

Large emotional statements.

Use:

bold
tight tracking
4xl–6xl
H2

Editorial section headings.

Use:

2xl–4xl
Body

Readable and calm.

Use:

16px–18px
Labels

Small uppercase tracking.

Used for:

Section intros
Badges
Step indicators
8. Surface System
Primary Surface

Used for:

Hero cards
Forms
Key sections

Rules:

Warm ivory
Soft shadow
Rounded 3xl minimum
Warm borders
Secondary Surface

Used for:

Supporting cards
FAQs
Empty states

Rules:

Slightly muted ivory
Lower contrast
Featured Surface

Used for:

Highlighted plans
Premium offerings
Important moments

Rules:

Accent border
Slightly warmer glow
9. Button System
Primary CTA

Used for:

Apply
Start
Continue

Rules:

Terracotta background
Ivory text
Hover = darker terracotta

Never:

Hover to black.

Secondary Button

Used for:

Learn more
Back
Optional actions

Rules:

Outline
Warm hover tint

Never:

Cold gray hover.

Ghost Button

Used for:

Messenger
Low emphasis actions

Rules:

Transparent
Soft hover
10. Navigation

Public nav must feel like:

Floating invitation card.

Rules:

Glass surface
Warm blur
Floating island
Rounded corners

Client Login:

Footer only.

Never top nav.

11. Motion Rules

Motion should feel:

Elegant, subtle, premium.

Allowed:

Floating hero objects
Fade-ups
Soft hover lifts
Scroll cue motion

Avoid:

Typewriter effects
Carousels
Particles
Aggressive parallax
Heavy spring motion

Respect:

prefers-reduced-motion

Always.

12. Accessibility Rules

Must always support:

Contrast

WCAG AA minimum.

Focus

Visible keyboard focus.

Tap Targets

Minimum:

44x44.

Semantic Layout

Always use:

<header>
<nav>
<main>
<section>
<footer>

Never div soup.

13. Client Dashboard Rules

Client dashboard inherits RSVP brand system.

It does not inherit admin visual styling.

Client dashboard should feel:

Premium
Warm
Organized
Personal

Examples:

Softer cards
Invitation-inspired empty states
Warm status badges
Celebration-oriented dashboards

But keep:

shadcn behavior, accessibility, and interaction consistency.

14. Admin Rules

Platform admin remains:

Neutral, operational, SaaS-focused.

Do not force RSVP branding into admin.

Admin and RSVP may share:

infrastructure
shadcn primitives
spacing scales
dark/light mechanics

But visual identity stays separate.

15. Implementation Stages
Stage 1

Landing nav + visual hero.

Stage 2

Apply funnel refinement.

Stage 3

Public event pages.

Stage 4

Client dashboard shell.

Stage 5

Token extraction and variant cleanup.

Only extract repeated patterns after real usage proves them.

Final Rule

If a design choice feels:

“generic SaaS”

or

“could belong to any startup”

it is probably wrong for RSVP.

If it feels like:

“premium invitation, handcrafted, warm, personal”

it is likely aligned.


---

This is the version I’d lock moving forward for **WebSerbisyo RSVP**. It gives you:

- separate identity from admin,
- future-safe dark mode,
- easier token extraction,
- cleaner Codex guidance,
- shared engineering foundation but distinct product personality.
```
