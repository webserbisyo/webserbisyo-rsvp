"use client";

import { useTransition } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { emitDashboardSyncEvent } from "@/lib/dashboard/dashboard-sync";
import { dashboardKeys } from "@/lib/dashboard/dashboard-query-keys";
import type { WebsiteAccessData } from "@/server/queries/website-access";
import {
  publishEventWebsiteAction,
  unpublishEventWebsiteAction,
} from "@/server/actions/website-access";

type WebsiteAccessControlsProps = {
  eventId: string;
  publishState: WebsiteAccessData["publishState"];
  savedRevision: number;
  workflowStatus: WebsiteAccessData["workflowStatus"];
};

export function WebsiteAccessControls({
  eventId,
  publishState,
  savedRevision,
  workflowStatus,
}: WebsiteAccessControlsProps) {
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();

  function handlePublish() {
    startTransition(async () => {
      const result = await publishEventWebsiteAction({
        eventId,
        expectedSavedRevision: savedRevision,
      });

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success(
        publishState === "published" ? "Published snapshot updated." : "Event Website published.",
      );
      emitDashboardSyncEvent({
        eventId,
        name: "event-website:published",
      });
      invalidateAccessQueries(queryClient);
    });
  }

  function handleUnpublish() {
    startTransition(async () => {
      const result = await unpublishEventWebsiteAction({ eventId });

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success("Event Website unpublished.");
      emitDashboardSyncEvent({
        eventId,
        name: "event-website:unpublished",
      });
      invalidateAccessQueries(queryClient);
    });
  }

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" disabled={isPending} onClick={handlePublish}>
          {isPending
            ? publishState === "published"
              ? "Publishing latest draft..."
              : "Publishing..."
            : publishState === "published"
              ? "Publish latest draft"
              : "Publish"}
        </Button>
        {publishState === "published" ? (
          <Button type="button" variant="outline" disabled={isPending} onClick={handleUnpublish}>
            {isPending ? "Unpublishing..." : "Unpublish"}
          </Button>
        ) : null}
      </div>

      <p className="text-muted-foreground text-sm">{workflowStatus.description}</p>
    </div>
  );
}

function invalidateAccessQueries(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: dashboardKeys.event() });
  void queryClient.invalidateQueries({ queryKey: dashboardKeys.websiteAccess() });
  void queryClient.invalidateQueries({ queryKey: dashboardKeys.home() });
}
