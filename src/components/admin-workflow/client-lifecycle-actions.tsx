"use client";

import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import type { ClientDetailView } from "@/server/queries/admin-clients";
import {
  archiveClientAction,
  deleteClientAction,
  refundClientPaymentAction,
  resendClientOnboardingAction,
  restoreClientAction,
} from "@/server/actions/admin-clients";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type ClientLifecycleActionsProps = {
  client: ClientDetailView;
};

type LifecycleDialogMode = "archive" | "restore" | null;

export function ClientLifecycleActions({ client }: ClientLifecycleActionsProps) {
  const router = useRouter();
  const [dialogMode, setDialogMode] = useState<LifecycleDialogMode>(null);
  const [resendOpen, setResendOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [note, setNote] = useState("");
  const [resendRecipientEmail, setResendRecipientEmail] = useState(
    client.onboarding.ownerEmail ?? client.client.email,
  );
  const [resendNote, setResendNote] = useState("");
  const [refundConfirmedAt, setRefundConfirmedAt] = useState(
    toDateTimeLocalValue(new Date().toISOString()),
  );
  const [refundReference, setRefundReference] = useState("");
  const [refundNote, setRefundNote] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleteNote, setDeleteNote] = useState("");

  const mutation = useMutation({
    mutationFn: async (mode: Exclude<LifecycleDialogMode, null>) => {
      if (mode === "archive") {
        return archiveClientAction({
          clientId: client.id,
          note,
        });
      }

      return restoreClientAction({
        clientId: client.id,
        note: note || undefined,
      });
    },
    onSuccess: (result, mode) => {
      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success(mode === "archive" ? "Client archived." : "Client restored.");
      setDialogMode(null);
      setNote("");
      router.refresh();
    },
    onError: () => {
      toast.error("The client lifecycle action failed.");
    },
  });

  const resendMutation = useMutation({
    mutationFn: () =>
      resendClientOnboardingAction({
        clientId: client.id,
        note: resendNote || undefined,
        recipientEmail:
          resendRecipientEmail && resendRecipientEmail !== client.onboarding.ownerEmail
            ? resendRecipientEmail
            : undefined,
      }),
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success("Client access reset email triggered.");
      for (const warning of result.data.warnings ?? []) {
        toast.warning(warning);
      }
      setResendOpen(false);
      setResendNote("");
      router.refresh();
    },
    onError: () => {
      toast.error("The client access email could not be sent.");
    },
  });

  const refundMutation = useMutation({
    mutationFn: () =>
      refundClientPaymentAction({
        clientId: client.id,
        confirmedAt: refundConfirmedAt ? new Date(refundConfirmedAt).toISOString() : undefined,
        note: refundNote,
        referenceNumber: refundReference || undefined,
      }),
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success("Client refund recorded.");
      for (const warning of result.data.warnings ?? []) {
        toast.warning(warning);
      }
      setRefundOpen(false);
      setRefundNote("");
      setRefundReference("");
      router.refresh();
    },
    onError: () => {
      toast.error("The refund could not be recorded.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () =>
      deleteClientAction({
        clientId: client.id,
        confirmation: deleteConfirmation,
        note: deleteNote || undefined,
      }),
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success("Client deleted.");
      router.push("/admin/clients");
      router.refresh();
    },
    onError: () => {
      toast.error("The client could not be deleted.");
    },
  });

  const canArchive = client.client.status !== "archived";
  const canRestore = client.client.status === "archived";
  const canResendOnboarding = Boolean(
    (client.onboarding.ownerEmail || client.client.email) && client.event.id,
  );
  const canRefund = client.payment.status === "paid";
  const canDelete = client.cleanup.deleteEligible;
  const deleteReason = client.cleanup.deleteEligibilityReason;
  const deletePreview = buildDeletePreview(client);

  function submitLifecycleAction() {
    if (dialogMode === "archive" && !note.trim()) {
      toast.error("An archive note is required.");
      return;
    }

    if (!dialogMode) {
      return;
    }

    mutation.mutate(dialogMode);
  }

  return (
    <>
      <Alert>
        <AlertTitle>Secondary lifecycle actions</AlertTitle>
        <AlertDescription className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={!canResendOnboarding || resendMutation.isPending}
              onClick={() => setResendOpen(true)}
            >
              {resendMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Reset and resend access
            </Button>

            {canArchive ? (
              <Button type="button" variant="outline" onClick={() => setDialogMode("archive")}>
                Archive client
              </Button>
            ) : null}

            {canRestore ? (
              <Button
                type="button"
                className="bg-rsvp-brand text-rsvp-brand-foreground hover:bg-rsvp-brand/90"
                onClick={() => setDialogMode("restore")}
              >
                Restore client
              </Button>
            ) : null}

            <Button
              type="button"
              variant="outline"
              disabled={!canRefund}
              onClick={() => setRefundOpen(true)}
            >
              Refund client
            </Button>

            <Button
              type="button"
              variant="outline"
              title={!canDelete ? deleteReason : undefined}
              onClick={() => setDeleteOpen(true)}
            >
              Delete client
            </Button>
          </div>
        </AlertDescription>
      </Alert>

      <Alert className="border-amber-200 bg-amber-50 text-amber-900">
        <AlertTitle>Delete eligibility</AlertTitle>
        <AlertDescription>
          {client.cleanup.deleteEligible
            ? "This client meets the current guarded delete rules."
            : deleteReason}
        </AlertDescription>
      </Alert>

      <Dialog
        open={dialogMode !== null}
        onOpenChange={(open) => setDialogMode(open ? dialogMode : null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "archive" ? "Archive client" : "Restore client"}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === "archive"
                ? "Archive keeps the record intact while removing it from the active lifecycle."
                : "Restore returns the client to the active lifecycle while preserving current access coverage."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="client-lifecycle-note">
              {dialogMode === "archive" ? "Required note" : "Optional note"}
            </Label>
            <Textarea
              id="client-lifecycle-note"
              value={note}
              onChange={(event) => setNote(event.currentTarget.value)}
              placeholder={
                dialogMode === "archive"
                  ? "Explain why this client is being archived."
                  : "Optional note for the restore."
              }
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogMode(null)}>
              Back
            </Button>
            <Button
              type="button"
              disabled={mutation.isPending}
              className="bg-rsvp-brand text-rsvp-brand-foreground hover:bg-rsvp-brand/90"
              onClick={submitLifecycleAction}
            >
              {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              {dialogMode === "archive" ? "Archive client" : "Restore client"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={resendOpen} onOpenChange={setResendOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Reset and resend dashboard access</DialogTitle>
            <DialogDescription>
              Generate a new temporary password and send a fresh dashboard access email. A custom
              recipient receives the new login details for this client workspace.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="client-onboarding-recipient">Recipient email</Label>
              <Input
                id="client-onboarding-recipient"
                type="email"
                value={resendRecipientEmail}
                onChange={(event) => setResendRecipientEmail(event.currentTarget.value)}
                placeholder={client.onboarding.ownerEmail ?? "client@example.com"}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-onboarding-note">Optional note</Label>
              <Textarea
                id="client-onboarding-note"
                value={resendNote}
                onChange={(event) => setResendNote(event.currentTarget.value)}
                placeholder="Optional internal note for this access reset"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setResendOpen(false)}>
              Back
            </Button>
            <Button
              type="button"
              disabled={resendMutation.isPending || !resendRecipientEmail}
              className="bg-rsvp-brand text-rsvp-brand-foreground hover:bg-rsvp-brand/90"
              onClick={() => resendMutation.mutate()}
            >
              {resendMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Send new temporary password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={refundOpen} onOpenChange={setRefundOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Refund client payment</DialogTitle>
            <DialogDescription>
              This records a full refund against the confirmed client payment and preserves the
              payment history.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Refund amount</Label>
              <Input value={formatCurrency(client.payment.amountPaid)} readOnly />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-refund-confirmed-at">Confirmed at</Label>
              <Input
                id="client-refund-confirmed-at"
                type="datetime-local"
                value={refundConfirmedAt}
                onChange={(event) => setRefundConfirmedAt(event.currentTarget.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-refund-reference">Reference number</Label>
              <Input
                id="client-refund-reference"
                value={refundReference}
                onChange={(event) => setRefundReference(event.currentTarget.value)}
                placeholder="Optional"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-refund-note">Refund note</Label>
              <Textarea
                id="client-refund-note"
                value={refundNote}
                onChange={(event) => setRefundNote(event.currentTarget.value)}
                placeholder="Explain why this payment is being refunded."
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRefundOpen(false)}>
              Back
            </Button>
            <Button
              type="button"
              disabled={refundMutation.isPending || !refundNote.trim()}
              onClick={() => refundMutation.mutate()}
            >
              {refundMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Confirm refund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Delete client</DialogTitle>
            <DialogDescription>
              Review the current eligibility, deletion scope, and preserved records before
              confirming this permanent cleanup action.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Eligibility state</Label>
              <Input value={canDelete ? "Eligible for deletion" : "Not eligible"} readOnly />
            </div>
            <div className="space-y-2">
              <Label>Current rule result</Label>
              <Input value={deleteReason} readOnly />
            </div>
            <div className="space-y-2">
              <Label>What will be deleted</Label>
              <div className="rounded-md border px-3 py-2 text-sm">
                <ul className="list-disc space-y-1 pl-5">
                  {deletePreview.deletes.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="space-y-2">
              <Label>What will be preserved</Label>
              <div className="rounded-md border px-3 py-2 text-sm">
                <ul className="list-disc space-y-1 pl-5">
                  {deletePreview.preserves.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-delete-confirmation">Type DELETE to confirm</Label>
              <Input
                id="client-delete-confirmation"
                value={deleteConfirmation}
                onChange={(event) => setDeleteConfirmation(event.currentTarget.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-delete-note">Optional note</Label>
              <Textarea
                id="client-delete-note"
                value={deleteNote}
                onChange={(event) => setDeleteNote(event.currentTarget.value)}
                placeholder="Optional deletion note"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)}>
              Back
            </Button>
            <Button
              type="button"
              disabled={deleteMutation.isPending || deleteConfirmation !== "DELETE" || !canDelete}
              onClick={() => deleteMutation.mutate()}
            >
              {deleteMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Delete client
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function toDateTimeLocalValue(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().slice(0, 16);
}

function formatCurrency(value: number | null) {
  if (value === null) {
    return "—";
  }

  return new Intl.NumberFormat("en-PH", {
    currency: "PHP",
    style: "currency",
  }).format(value);
}

function buildDeletePreview(client: ClientDetailView) {
  const deletes = ["Client record"];
  const preserves = [
    "Deletion tombstone with client, event, and payment summary",
    "Audit trail entries with client/event references nulled by foreign keys",
    "Approved application history with client/event references nulled by foreign keys",
  ];

  if (client.event.id) {
    deletes.push("Draft/private RSVP event and linked event content");
  }

  if (client.payment.id) {
    if (client.payment.status === "paid") {
      preserves.push("Paid non-refunded payment history, which currently blocks deletion");
    } else if (client.payment.status === "refunded" || client.payment.refund) {
      deletes.push("Refunded payment rows after refund proof is copied into the tombstone");
      preserves.push("Refund proof captured in tombstone metadata before row deletion");
    } else {
      deletes.push("Non-paid payment rows linked to this client");
    }
  }

  if (client.client.customFrontendUrl || client.client.customFrontendStatus === "connected") {
    preserves.push("Live website access remains blocked until disabled first");
  }

  return {
    deletes,
    preserves,
  };
}
