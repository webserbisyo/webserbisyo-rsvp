"use client";

import { useTransition } from "react";
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
  workflowStatus: WebsiteAccessData["workflowStatus"];
};

export function WebsiteAccessControls({
  eventId,
  publishState,
  workflowStatus,
}: WebsiteAccessControlsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handlePublish() {
    startTransition(async () => {
      const result = await publishEventWebsiteAction({
        eventId,
      });

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success(
        publishState === "published"
          ? "Published snapshot updated."
          : "Event Website published.",
      );
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

      toast.success("Event Website unpublished.");
      router.refresh();
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

      <p className="text-sm text-muted-foreground">{workflowStatus.description}</p>
    </div>
  );
}
