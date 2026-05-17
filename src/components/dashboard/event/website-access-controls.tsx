"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { WebsiteAccessData } from "@/server/queries/website-access";
import {
  publishEventWebsiteAction,
  unpublishEventWebsiteAction,
} from "@/server/actions/website-access";

type WebsiteAccessControlsProps = {
  eventId: string;
  publishState: WebsiteAccessData["publishState"];
  readiness: NonNullable<WebsiteAccessData["readiness"]>;
};

export function WebsiteAccessControls({
  eventId,
  publishState,
  readiness,
}: WebsiteAccessControlsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [requiresWarningConfirmation, setRequiresWarningConfirmation] = useState(false);

  function handlePublish(confirmWarnings = false) {
    startTransition(async () => {
      const result = await publishEventWebsiteAction({
        confirmWarnings,
        eventId,
      });

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      if (result.data.state === "confirmation_required") {
        setRequiresWarningConfirmation(true);
        toast.warning(
          result.data.warnings[0] ??
            `Publishing requires confirmation because ${result.data.warningCount} warnings remain.`,
        );
        return;
      }

      setRequiresWarningConfirmation(false);
      toast.success("Event Website published.");
      router.refresh();
    });
  }

  function handleUnpublish() {
    startTransition(async () => {
      const result = await unpublishEventWebsiteAction({ eventId });

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      setRequiresWarningConfirmation(false);
      toast.success("Event Website unpublished.");
      router.refresh();
    });
  }

  if (publishState === "published") {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" disabled={isPending} onClick={handleUnpublish}>
          {isPending ? "Unpublishing..." : "Unpublish"}
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" disabled={isPending} onClick={() => handlePublish(false)}>
          {isPending ? "Publishing..." : "Publish"}
        </Button>
        {readiness.blockerCount > 0 ? (
          <span className="text-sm text-[var(--dash-destructive)]">
            Resolve blockers in Event Website before publishing.
          </span>
        ) : null}
      </div>

      {requiresWarningConfirmation ? (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <span>
            This draft still has {readiness.warningCount} warning
            {readiness.warningCount === 1 ? "" : "s"}. Publish anyway?
          </span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() => handlePublish(true)}
          >
            Publish with warnings
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={isPending}
            onClick={() => setRequiresWarningConfirmation(false)}
          >
            Cancel
          </Button>
        </div>
      ) : null}
    </div>
  );
}
