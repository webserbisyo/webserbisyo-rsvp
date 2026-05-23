import { Check } from "lucide-react";
import Link from "next/link";

export function SetupChecklistCard({
  items,
}: {
  items: Array<{
    completed: boolean;
    href: string;
    id: string;
    label: string;
  }>;
}) {
  const completedCount = items.filter((item) => item.completed).length;
  const totalCount = items.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const nextItemIndex = items.findIndex((item) => !item.completed && item.href);

  return (
    <section className="ws-checklist">
      <div className="ws-panel-header">
        <div>
          <h3>Setup Checklist</h3>
          <p>{completedCount} of {totalCount} completed</p>
        </div>
        <strong>{progress}%</strong>
      </div>
      <div className="ws-check-progress" aria-hidden="true">
        <span className="ws-check-progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="ws-check-rows">
        {items.map((item, index) => {
          const isNext = index === nextItemIndex;

          return (
            <div key={item.id} className="ws-check-item">
              <div className={`ws-check-row ${item.completed ? "done" : ""} ${isNext ? "next" : ""}`}>
                <span className="ws-check-circle">
                  {item.completed ? <Check size={13} strokeWidth={3} /> : null}
                </span>
                <span className="ws-check-label">{item.label}</span>
                {!item.completed && isNext ? (
                  <Link href={item.href} className="ws-check-review">
                    Review <span aria-hidden="true">→</span>
                  </Link>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
