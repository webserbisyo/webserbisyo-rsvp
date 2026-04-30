"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  approveApplicationsBulkAction,
  rejectAndDeleteApplicationsBulkAction,
} from "@/server/actions/admin-applications";
import { ADMIN_APPLICATIONS_QUERY_KEY } from "@/components/applications/use-applications-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ApplicationBulkActionsProps = {
  applicationIds: string[];
  onClearSelection: () => void;
};

export function ApplicationBulkActions({
  applicationIds,
  onClearSelection,
}: ApplicationBulkActionsProps) {
  const queryClient = useQueryClient();
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);

  const approveMutation = useMutation({
    mutationFn: approveApplicationsBulkAction,
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      showBulkToast("approved", result.data.succeeded, result.data.failed);
      onClearSelection();
      void queryClient.invalidateQueries({ queryKey: ADMIN_APPLICATIONS_QUERY_KEY });
    },
    onError: () => {
      toast.error("The selected applications could not be approved.");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: rejectAndDeleteApplicationsBulkAction,
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      showBulkToast("deleted", result.data.succeeded, result.data.failed);
      setDeleteConfirmation("");
      setRejectDialogOpen(false);
      onClearSelection();
      void queryClient.invalidateQueries({ queryKey: ADMIN_APPLICATIONS_QUERY_KEY });
    },
    onError: () => {
      toast.error("The selected applications could not be deleted.");
    },
  });

  if (applicationIds.length === 0) {
    return null;
  }

  return (
    <>
      <div className="bg-muted/30 flex items-center justify-between rounded-lg border px-4 py-3">
        <p className="text-sm font-medium">{applicationIds.length} selected</p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={approveMutation.isPending || rejectMutation.isPending}
            onClick={() => approveMutation.mutate({ applicationIds })}
          >
            {approveMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Approve selected
          </Button>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            disabled={approveMutation.isPending || rejectMutation.isPending}
            onClick={() => setRejectDialogOpen(true)}
          >
            Reject selected
          </Button>
        </div>
      </div>

      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject and delete selected applications?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the selected applications from the queue.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-2">
            <p className="text-sm font-medium">Type DELETE to confirm.</p>
            <Input
              value={deleteConfirmation}
              onChange={(event) => setDeleteConfirmation(event.currentTarget.value)}
              placeholder="DELETE"
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setDeleteConfirmation("");
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteConfirmation !== "DELETE" || rejectMutation.isPending}
              onClick={(event) => {
                event.preventDefault();
                rejectMutation.mutate({
                  applicationIds,
                  confirmation: deleteConfirmation,
                });
              }}
            >
              {rejectMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Delete selected
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function showBulkToast(
  action: "approved" | "deleted",
  succeeded: Array<
    | { applicationId: string; href?: string; ok: true; warnings?: string[] }
    | { applicationId: string; ok: true; warnings?: string[] }
  >,
  failed: Array<{ applicationId: string; error: string; ok: false }>,
) {
  const message = buildBulkMessage(action, succeeded, failed);

  if (succeeded.length === 0) {
    toast.error(message);
    return;
  }

  if (failed.length > 0) {
    toast(message);
    return;
  }

  toast.success(message);
}

function buildBulkMessage(
  action: "approved" | "deleted",
  succeeded: Array<
    | { applicationId: string; href?: string; ok: true; warnings?: string[] }
    | { applicationId: string; ok: true; warnings?: string[] }
  >,
  failed: Array<{ applicationId: string; error: string; ok: false }>,
) {
  const actionLabel = action === "approved" ? "approved" : "deleted";
  const warnings = succeeded.flatMap((item) => item.warnings ?? []);

  if (failed.length === 0 && warnings.length === 0) {
    return `${succeeded.length} application${succeeded.length === 1 ? "" : "s"} ${actionLabel}.`;
  }

  if (failed.length === 0 && warnings.length > 0) {
    const warningLabel =
      warnings.length === 1 ? "onboarding warning" : `${warnings.length} warnings`;

    return `${succeeded.length} application${succeeded.length === 1 ? "" : "s"} ${actionLabel}, ${warningLabel}: ${warnings[0]}`;
  }

  const summary = summarizeFailureReasons(failed);

  if (succeeded.length === 0) {
    return `No applications were ${actionLabel}: ${summary}.`;
  }

  return `${succeeded.length} application${succeeded.length === 1 ? "" : "s"} ${actionLabel}, ${failed.length} skipped: ${summary}.`;
}

function summarizeFailureReasons(
  failed: Array<{ applicationId: string; error: string; ok: false }>,
) {
  const uniqueReasons = Array.from(
    new Set(failed.map((item) => item.error.trim()).filter(Boolean)),
  );

  return uniqueReasons.slice(0, 2).join("; ");
}
