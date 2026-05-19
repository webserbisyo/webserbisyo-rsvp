import type { CSSProperties } from "react";

export const RESPONSES_PORTAL_THEME_STYLE = {
  "--responses-surface": "#fcfaf6",
  "--responses-surface-muted": "#f8f4ed",
  "--responses-surface-hover": "#f3ede4",
  "--responses-foreground": "#241d19",
  "--responses-muted": "#71675f",
  "--responses-heading-muted": "#938273",
  "--responses-subtle": "#a6998d",
  "--responses-border": "#e7ddd1",
  "--responses-divider": "#eee5da",
  "--responses-brand": "var(--dash-brand, #c96b48)",
  "--responses-brand-active": "var(--dash-brand-active, #a34f32)",
  "--responses-brand-subtle": "#f7e6dd",
  "--responses-success": "#6b9537",
  "--responses-success-subtle": "#edf3e3",
  "--responses-destructive": "#9f5a5a",
  "--responses-destructive-subtle": "#f7ebea",
  "--responses-warning": "var(--dash-warning, #ba7517)",
  "--responses-warning-subtle": "#faf0df",
  "--responses-overlay": "rgba(34, 24, 18, 0.34)",
  "--responses-shadow-sm":
    "0 10px 26px rgba(64, 45, 28, 0.04), 0 1px 2px rgba(64, 45, 28, 0.03), inset 0 1px 0 rgba(255, 255, 255, 0.78)",
  "--responses-shadow-md":
    "0 14px 32px rgba(64, 45, 28, 0.05), 0 1px 3px rgba(64, 45, 28, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.8)",
  "--responses-shadow-lg":
    "0 22px 54px rgba(64, 45, 28, 0.08), 0 1px 3px rgba(64, 45, 28, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.88)",
} satisfies Record<string, string> as CSSProperties;
