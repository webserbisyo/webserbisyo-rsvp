import { Check } from "lucide-react";
import Link from "next/link";

export function SetupChecklistCard({
  optionalContent,
  requiredItems,
}: {
  optionalContent: {
    completedEnabledSectionCount: number;
    enabledSectionCount: number;
    href: string;
  };
  requiredItems: Array<{
    completed: boolean;
    href: string;
    id: string;
    label: string;
  }>;
}) {
  const completedCount = requiredItems.filter((item) => item.completed).length;
  const totalCount = requiredItems.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const nextItemIndex = requiredItems.findIndex((item) => !item.completed && item.href);
  const optionalSummary =
    optionalContent.enabledSectionCount > 0
      ? `${optionalContent.completedEnabledSectionCount} of ${optionalContent.enabledSectionCount} enabled sections completed`
      : "No optional sections enabled yet";

  return (
    <section className="ws-checklist">
      <div className="ws-panel-header">
        <div>
          <h3>Setup Checklist</h3>
          <p>{completedCount} of {totalCount} required items completed</p>
        </div>
        <strong>{progress}%</strong>
      </div>
      <div className="ws-check-progress" aria-hidden="true">
        <span className="ws-check-progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="rounded-2xl border border-[var(--dash-divider)] bg-[var(--dash-surface-muted)]/75 px-4 py-3 text-sm text-[var(--dash-muted)]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold text-[var(--dash-foreground)]">Website Content</p>
            <p className="mt-1 text-xs leading-5 text-[var(--dash-muted)]">{optionalSummary}</p>
            <p className="mt-1 text-xs leading-5 text-[var(--dash-subtle)]">
              Optional sections that are turned off are not counted.
            </p>
          </div>
          <Link href={optionalContent.href} className="ws-check-review whitespace-nowrap">
            Review <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
      <div className="ws-check-rows">
        {requiredItems.map((item, index) => {
          const isNext = index === nextItemIndex;

          return (
            <div
              key={item.id}
              className={`ws-check-row ${item.completed ? "done" : ""} ${isNext ? "next" : ""}`}
            >
              <span className="ws-check-circle">
                {item.completed ? <Check size={13} strokeWidth={3} /> : null}
              </span>
              <span className="ws-check-label">{item.label}</span>
              {isNext ? (
                <Link href={item.href} className="ws-check-review">
                  Review <span aria-hidden="true">→</span>
                </Link>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
