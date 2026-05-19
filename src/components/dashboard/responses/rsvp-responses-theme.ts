import type { CSSProperties } from "react";

export const RESPONSES_PORTAL_THEME_STYLE = {
  "--responses-surface": "var(--dash-surface, #faf7f2)",
  "--responses-surface-muted": "var(--dash-surface-muted, #f5efe8)",
  "--responses-surface-hover": "var(--dash-surface-hover, #ede5da)",
  "--responses-foreground": "var(--dash-foreground, #1d1b18)",
  "--responses-muted": "var(--dash-muted, #6b6560)",
  "--responses-heading-muted": "var(--dash-heading-muted, #8d796c)",
  "--responses-subtle": "var(--dash-subtle, #9e9189)",
  "--responses-border": "var(--dash-border, #e8e0d6)",
  "--responses-divider": "var(--dash-divider, #eadfd3)",
  "--responses-brand": "var(--dash-brand, #c96b48)",
  "--responses-brand-active": "var(--dash-brand-active, #a34f32)",
  "--responses-brand-subtle": "var(--dash-brand-subtle, #fde8df)",
  "--responses-success": "var(--dash-success, #639922)",
  "--responses-success-subtle": "var(--dash-success-subtle, #eaf3de)",
  "--responses-destructive": "var(--dash-destructive, #a32d2d)",
  "--responses-destructive-subtle": "var(--dash-destructive-subtle, #fcebeb)",
  "--responses-warning": "var(--dash-warning, #ba7517)",
  "--responses-warning-subtle": "var(--dash-warning-subtle, #faeeda)",
  "--responses-overlay": "rgba(34, 24, 18, 0.34)",
  "--responses-shadow-sm":
    "0 12px 26px rgba(62, 39, 23, 0.055), inset 0 1px 0 rgba(255, 255, 255, 0.7)",
  "--responses-shadow-md":
    "0 15px 34px rgba(62, 39, 23, 0.075), inset 0 1px 0 rgba(255, 255, 255, 0.75)",
  "--responses-shadow-lg":
    "0 22px 54px rgba(62, 39, 23, 0.09), 0 1px 3px rgba(62, 39, 23, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.86)",
} satisfies Record<string, string> as CSSProperties;
