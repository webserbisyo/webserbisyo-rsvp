import { CalendarOff, SearchX, Users } from "lucide-react";
import { EmptyState } from "@/components/feedback/empty-state";

type RsvpResponsesEmptyStateProps = {
  variant: "empty" | "no-event" | "no-results";
};

export function RsvpResponsesEmptyState({ variant }: RsvpResponsesEmptyStateProps) {
  if (variant === "no-event") {
    return (
      <EmptyState
        className="border-none bg-transparent shadow-none"
        icon={<CalendarOff className="size-5" />}
        title="No RSVP event found."
        description="Create or restore an active RSVP event first to view guest responses."
      />
    );
  }

  if (variant === "empty") {
    return (
      <EmptyState
        className="border-none bg-transparent shadow-none"
        icon={<Users className="size-5" />}
        title="No RSVP responses yet."
        description="Responses will appear here once guests start replying."
      />
    );
  }

  return (
    <EmptyState
      className="border-none bg-transparent shadow-none"
      icon={<SearchX className="size-5" />}
      title="No responses found."
      description="Try another search or reset your filters."
    />
  );
}
