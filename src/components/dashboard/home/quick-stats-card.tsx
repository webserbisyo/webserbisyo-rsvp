import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Users, MessageSquareQuote } from "lucide-react";

export function QuickStatsCard({
  coverageDays,
  guestLimit,
  responsesCount,
}: {
  coverageDays: number | string;
  guestLimit: number | string;
  responsesCount: number;
}) {
  return (
    <Card className="rounded-3xl border-[var(--dash-border)] bg-[var(--dash-surface)] shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-[var(--dash-muted)]">
          QUICK STATS
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-[var(--dash-muted)]">
            <CalendarDays className="h-4 w-4" />
            <span className="text-sm">RSVP Coverage</span>
          </div>
          <span className="text-sm font-medium text-[var(--dash-foreground)]">{coverageDays} days</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-[var(--dash-muted)]">
            <Users className="h-4 w-4" />
            <span className="text-sm">Guest Limit</span>
          </div>
          <span className="text-sm font-medium text-[var(--dash-foreground)]">{guestLimit}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-[var(--dash-muted)]">
            <MessageSquareQuote className="h-4 w-4" />
            <span className="text-sm">Responses</span>
          </div>
          <span className="text-sm font-medium text-[var(--dash-foreground)]">{responsesCount} so far</span>
        </div>
      </CardContent>
    </Card>
  );
}
