import { CalendarDays, MessageSquare } from "lucide-react";
import { EditableGuestLimitStat } from "@/components/dashboard/home/editable-guest-limit-stat";

export function QuickStatsCard({
  coverageLabel,
  eventId,
  guestLimitValue,
  responsesLabel,
}: {
  coverageLabel: string;
  eventId: string | null;
  guestLimitValue: number | null;
  responsesLabel: string;
}) {
  return (
    <section className="ws-quick-stats">
      <h3>Quick Stats</h3>
      <div className="ws-stat-list">
        <div className="ws-stat-row">
          <CalendarDays size={18} />
          <span>RSVP Coverage</span>
          <strong title={coverageLabel}>{coverageLabel}</strong>
        </div>
        <EditableGuestLimitStat eventId={eventId} initialGuestLimit={guestLimitValue} />
        <div className="ws-stat-row">
          <MessageSquare size={18} />
          <span>Responses</span>
          <strong title={responsesLabel}>{responsesLabel}</strong>
        </div>
      </div>
    </section>
  );
}
