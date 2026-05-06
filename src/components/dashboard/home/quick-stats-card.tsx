import { CalendarDays, MessageSquare, Users } from "lucide-react";

export function QuickStatsCard({
  coverageLabel,
  guestLimitLabel,
  responsesLabel,
}: {
  coverageLabel: string;
  guestLimitLabel: string;
  responsesLabel: string;
}) {
  const rows = [
    {
      icon: <CalendarDays size={18} />,
      label: "RSVP Coverage",
      value: coverageLabel,
    },
    {
      icon: <Users size={18} />,
      label: "Guest Limit",
      value: guestLimitLabel,
    },
    {
      icon: <MessageSquare size={18} />,
      label: "Responses",
      value: responsesLabel,
    },
  ];

  return (
    <section className="ws-quick-stats">
      <h3>Quick Stats</h3>
      <div className="ws-stat-list">
        {rows.map((row) => (
          <div className="ws-stat-row" key={row.label}>
            {row.icon}
            <span>{row.label}</span>
            <strong title={row.value}>{row.value}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
