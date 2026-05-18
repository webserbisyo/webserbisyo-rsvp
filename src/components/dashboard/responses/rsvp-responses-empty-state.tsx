import { SearchX, Users } from "lucide-react";
import { EmptyState } from "@/components/feedback/empty-state";

type RsvpResponsesEmptyStateProps = {
  variant: "empty" | "no-results";
};

export function RsvpResponsesEmptyState({ variant }: RsvpResponsesEmptyStateProps) {
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
