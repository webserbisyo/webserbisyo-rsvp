import { ReactNode } from "react";
import { AlertCircle, Check } from "lucide-react";

type SummaryTheme = "neutral" | "premium" | "warning" | "website";
type SummaryChipTone = "brand" | "neutral" | "success" | "warning";

export function HomeSummaryCard({
  chip,
  chipTone,
  icon,
  label,
  meta,
  subtitle,
  theme,
  title,
}: {
  chip: string;
  chipTone: SummaryChipTone;
  icon: ReactNode;
  label: string;
  meta?: string;
  subtitle: string;
  theme: SummaryTheme;
  title: string;
}) {
  const chipIcon = chipTone === "warning" ? <AlertCircle size={14} /> : <Check size={14} />;

  return (
    <article className={`ws-summary-card ${theme}`}>
      <div className="ws-card-label">{label}</div>
      <div className="ws-card-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{subtitle}</p>
      {meta ? (
        <div className="ws-card-meta" title={meta}>
          {meta}
        </div>
      ) : null}
      <span className={`ws-chip ${chipTone}`}>
        {chipIcon}
        {chip}
      </span>
    </article>
  );
}
