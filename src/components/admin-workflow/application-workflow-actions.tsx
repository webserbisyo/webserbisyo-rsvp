"use client";

import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { ApplicationDetailView } from "@/server/queries/admin-applications";
import type { AdminPackageSettingsView } from "@/server/queries/platform-package-settings";
import {
  approveApplicationForPaymentAction,
  cancelApplicationAction,
  markApplicationReviewingAction,
  rejectApplicationAction,
} from "@/server/actions/admin-applications";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type ApplicationWorkflowActionsProps = {
  application: ApplicationDetailView;
  packageSettings: AdminPackageSettingsView;
};

type DialogMode = "approve" | "cancel" | "reject" | null;

export function ApplicationWorkflowActions({
  application,
  packageSettings,
}: ApplicationWorkflowActionsProps) {
  const router = useRouter();
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [note, setNote] = useState("");
  const [reviewingPending, setReviewingPending] = useState(false);

  const currentPlanSettings =
    application.plan.preferredPlan === "max" ? packageSettings.max : packageSettings.pro;
  const paymentStatus = application.linkedRecords.paymentStatus;

  const hasConfiguredPlanDefaults = useMemo(
    () =>
      currentPlanSettings.isActive &&
      currentPlanSettings.defaultAmount !== null &&
      currentPlanSettings.defaultHostingDays !== null &&
      currentPlanSettings.renewalNoticeDays !== null,
    [currentPlanSettings],
  );

  const actionMutation = useMutation({
    mutationFn: async ({
      mode,
      nextNote,
    }: {
      mode: Exclude<DialogMode, null>;
      nextNote: string;
    }) => {
      switch (mode) {
        case "approve":
          return approveApplicationForPaymentAction({
            applicationId: application.id,
            note: nextNote || undefined,
          });
        case "cancel":
          return cancelApplicationAction({
            applicationId: application.id,
            note: nextNote,
          });
        case "reject":
          return rejectApplicationAction({
            applicationId: application.id,
            note: nextNote,
          });
      }
    },
    onSuccess: (result, variables) => {
      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      const successMessage =
        variables.mode === "approve"
          ? "Application approved for payment."
          : variables.mode === "cancel"
            ? "Application cancelled."
            : "Application rejected.";

      toast.success(successMessage);
      setDialogMode(null);
      setNote("");
      router.refresh();
    },
    onError: () => {
      toast.error("The application workflow action failed.");
    },
  });

  const showMarkReviewing = application.review.status === "submitted";
  const showReject = ["submitted", "reviewing"].includes(application.review.status);
  const showCancel =
    ["submitted", "reviewing", "approved"].includes(application.review.status) &&
    paymentStatus !== "paid";
  const showApprove =
    ["submitted", "reviewing"].includes(application.review.status) ||
    (application.review.status === "approved" &&
      paymentStatus !== "pending" &&
      paymentStatus !== "paid");

  async function markReviewing() {
    setReviewingPending(true);

    try {
      const result = await markApplicationReviewingAction({
        applicationId: application.id,
      });

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success("Application moved to reviewing.");
      router.refresh();
    } catch {
      toast.error("The application could not be moved to reviewing.");
    } finally {
      setReviewingPending(false);
    }
  }

  function submitDialogAction() {
    if (!dialogMode) {
      return;
    }

    if ((dialogMode === "cancel" || dialogMode === "reject") && !note.trim()) {
      toast.error("A note is required for this action.");
      return;
    }

    actionMutation.mutate({
      mode: dialogMode,
      nextNote: note.trim(),
    });
  }

  return (
    <>
      <Alert>
        <AlertTitle>Workflow actions</AlertTitle>
        <AlertDescription className="space-y-4">
          <p>
            Applications decide the request. Sales confirms the money. Provisioning happens only
            after manual payment confirmation.
          </p>

          {!hasConfiguredPlanDefaults ? (
            <p>
              {application.plan.preferredPlanLabel} defaults are not configured yet. Update{" "}
              <Link href="/admin/settings" className="underline underline-offset-4">
                package settings
              </Link>{" "}
              before approving this application for payment.
            </p>
          ) : null}

          <div className="flex flex-wrap gap-3">
            {showMarkReviewing ? (
              <Button
                type="button"
                variant="outline"
                disabled={reviewingPending}
                onClick={markReviewing}
              >
                {reviewingPending ? <Loader2 className="size-4 animate-spin" /> : null}
                Mark reviewing
              </Button>
            ) : null}

            {showReject ? (
              <Button type="button" variant="destructive" onClick={() => setDialogMode("reject")}>
                Reject
              </Button>
            ) : null}

            {showCancel ? (
              <Button type="button" variant="outline" onClick={() => setDialogMode("cancel")}>
                Cancel
              </Button>
            ) : null}

            {showApprove ? (
              <Button
                type="button"
                className="bg-rsvp-brand text-rsvp-brand-foreground hover:bg-rsvp-brand/90"
                disabled={!hasConfiguredPlanDefaults}
                onClick={() => setDialogMode("approve")}
              >
                Approve for payment
              </Button>
            ) : null}

            {paymentStatus ? (
              <Button asChild type="button" variant="outline">
                <Link href="/admin/sales">View payment in Sales</Link>
              </Button>
            ) : null}
          </div>
        </AlertDescription>
      </Alert>

      <Dialog
        open={dialogMode === "approve"}
        onOpenChange={(open) => setDialogMode(open ? "approve" : null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Approve for payment</DialogTitle>
            <DialogDescription>
              This sets the application to approved, then creates or refreshes a pending manual
              payment record using the active {application.plan.preferredPlanLabel} defaults.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-3 rounded-2xl border p-4 text-sm sm:grid-cols-3">
              <div>
                <p className="text-muted-foreground text-xs">Default amount</p>
                <p className="font-medium">{formatCurrency(currentPlanSettings.defaultAmount)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Hosting days</p>
                <p className="font-medium">{currentPlanSettings.defaultHostingDays ?? "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Renewal notice</p>
                <p className="font-medium">
                  {currentPlanSettings.renewalNoticeDays !== null
                    ? `${currentPlanSettings.renewalNoticeDays} days`
                    : "—"}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="approval-note">Internal note</Label>
              <Textarea
                id="approval-note"
                value={note}
                onChange={(event) => setNote(event.currentTarget.value)}
                placeholder="Optional note for this approval."
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogMode(null)}>
              Back
            </Button>
            <Button
              type="button"
              disabled={actionMutation.isPending}
              className="bg-rsvp-brand text-rsvp-brand-foreground hover:bg-rsvp-brand/90"
              onClick={submitDialogAction}
            >
              {actionMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Create pending payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={dialogMode === "reject" || dialogMode === "cancel"}
        onOpenChange={(open) => setDialogMode(open ? dialogMode : null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {dialogMode === "reject" ? "Reject application" : "Cancel application"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {dialogMode === "reject"
                ? "A rejection note is required and will be stored with the application audit trail."
                : "A cancellation note is required. Pending payments, if present, will be cancelled too."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-2">
            <Label htmlFor="workflow-note">Required note</Label>
            <Textarea
              id="workflow-note"
              value={note}
              onChange={(event) => setNote(event.currentTarget.value)}
              placeholder="Enter the reason for this decision."
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setNote("")}>Back</AlertDialogCancel>
            <AlertDialogAction onClick={submitDialogAction}>
              {actionMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function formatCurrency(value: number | null) {
  if (value === null) {
    return "Not configured";
  }

  return new Intl.NumberFormat("en-PH", {
    currency: "PHP",
    style: "currency",
  }).format(value);
}
