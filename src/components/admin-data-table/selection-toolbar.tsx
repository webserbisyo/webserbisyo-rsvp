"use client";

import { Button } from "@/components/ui/button";

type SelectionToolbarProps = {
  count: number;
  message?: string;
};

export function SelectionToolbar({
  count,
  message = "Bulk actions are intentionally deferred in this phase.",
}: SelectionToolbarProps) {
  if (count <= 0) {
    return null;
  }

  return (
    <div className="bg-muted/30 flex items-center justify-between rounded-lg border px-4 py-3">
      <p className="text-sm font-medium">{count} selected</p>
      <div className="flex items-center gap-3">
        <p className="text-muted-foreground text-sm">{message}</p>
        <Button type="button" size="sm" variant="outline" disabled>
          Coming later
        </Button>
      </div>
    </div>
  );
}
