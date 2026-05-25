import { CalendarOff, SearchX, Users } from "lucide-react";
import { EmptyState } from "@/components/feedback/empty-state";

type RsvpResponsesEmptyStateProps = {
  variant:
    | "empty"
    | "guestbook-empty"
    | "messages-empty"
    | "needs-review-empty"
    | "no-event"
    | "no-results";
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

  if (variant === "messages-empty") {
    return (
      <EmptyState
        className="border-none bg-transparent shadow-none"
        icon={<Users className="size-5" />}
        title="No guest messages yet."
        description="Messages will appear here once guests leave a note with their RSVP."
      />
    );
  }

  if (variant === "guestbook-empty") {
    return (
      <EmptyState
        className="border-none bg-transparent shadow-none"
        icon={<Users className="size-5" />}
        title="No approved guestbook messages yet."
        description="Approve guest messages from the Messages or Needs review tabs to show them here."
      />
    );
  }

  if (variant === "needs-review-empty") {
    return (
      <EmptyState
        className="border-none bg-transparent shadow-none"
        icon={<Users className="size-5" />}
        title="No guest messages waiting for review."
        description="New RSVP messages that are not yet shown publicly will appear here."
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
