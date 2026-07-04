"use client";

import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { ClientListItem } from "@/server/queries/admin-clients";
import {
  bulkArchiveClientsAction,
  bulkCancelClientsAction,
  bulkDeleteClientsAction,
  bulkMarkClientsPaidAction,
  bulkRefundClientPaymentsAction,
} from "@/server/actions/admin-clients";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type ClientBulkActionsProps = {
  isPlatformAdmin: boolean;
  packageDefaultAvailability: Record<"max" | "pro", boolean>;
  selectedClients: ClientListItem[];
  onClearSelection: () => void;
};

type BulkDialog = "archive" | "cancel" | "delete" | "paid" | "refund" | null;
type PaymentMethod = "gcash" | "maya" | "manual";
type BulkDeleteResultData = {
  failed: Array<{ clientId: string; error: string }>;
  failedCount: number;
  forceDeletedCount: number;
  normalDeletedCount: number;
  selectedCount: number;
  skipped: Array<{ clientId: string; reason: string }>;
  skippedCount: number;
  succeeded: Array<{ clientId: string; mode?: "force" | "normal"; warnings: string[] }>;
  total: number;
};

const PAYMENT_METHODS: Array<{ label: string; value: PaymentMethod }> = [
  { label: "GCash", value: "gcash" },
  { label: "Maya", value: "maya" },
  { label: "Manual / bank transfer", value: "manual" },
];

export function ClientBulkActions({
  isPlatformAdmin,
  packageDefaultAvailability,
  selectedClients,
  onClearSelection,
}: ClientBulkActionsProps) {
  const router = useRouter();
  const [dialog, setDialog] = useState<BulkDialog>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("manual");
  const [paidAt, setPaidAt] = useState(toDateTimeLocalValue(new Date().toISOString()));
  const [referencePrefix, setReferencePrefix] = useState("");
  const [paidNote, setPaidNote] = useState("");
  const [cancelConfirmation, setCancelConfirmation] = useState("");
  const [cancelNote, setCancelNote] = useState("");
  const [archiveNote, setArchiveNote] = useState("");
  const [refundConfirmation, setRefundConfirmation] = useState("");
  const [refundConfirmedAt, setRefundConfirmedAt] = useState(
    toDateTimeLocalValue(new Date().toISOString()),
  );
  const [refundReferencePrefix, setRefundReferencePrefix] = useState("");
  const [refundNote, setRefundNote] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleteNote, setDeleteNote] = useState("");

  const selectedIds = useMemo(() => selectedClients.map((client) => client.id), [selectedClients]);
  const markEligible = selectedClients.filter(
    (client) =>
      client.paymentStatus === "pending" &&
      client.clientStatus !== "archived" &&
      client.clientStatus !== "cancelled",
  );
  const cancelEligible = selectedClients.filter(
    (client) =>
      client.paymentStatus === "pending" &&
      client.clientStatus !== "archived" &&
      client.clientStatus !== "cancelled",
  );
  const archiveEligible = selectedClients.filter((client) => client.clientStatus !== "archived");
  const refundEligible = selectedClients.filter((client) => client.paymentStatus === "paid");
  const deleteEligible = selectedClients.filter((client) => client.deleteEligible);
  const deleteSkipped = selectedClients.filter((client) => !client.deleteEligible);
  const deleteReasonGroups = groupDeleteReasons(deleteSkipped);
  const markDefaultMissing = markEligible.some(
    (client) =>
      (client.plan !== "max" && client.plan !== "pro") ||
      (client.plan === "max" && !packageDefaultAvailability.max) ||
      (client.plan === "pro" && !packageDefaultAvailability.pro),
  );

  const markPaidMutation = useMutation({
    mutationFn: () =>
      bulkMarkClientsPaidAction({
        clientIds: selectedIds,
        note: paidNote || undefined,
        paidAt: paidAt ? new Date(paidAt).toISOString() : undefined,
        paymentMethod,
        referencePrefix: referencePrefix || undefined,
      }),
    onSuccess: (result) => handleBulkResult(result, "marked as paid"),
    onError: () => toast.error("Bulk Mark as Paid failed."),
  });

  const cancelMutation = useMutation({
    mutationFn: () =>
      bulkCancelClientsAction({
        clientIds: selectedIds,
        confirmation: cancelConfirmation,
        note: cancelNote || undefined,
      }),
    onSuccess: (result) => {
      setCancelConfirmation("");
      handleBulkResult(result, "cancelled");
    },
    onError: () => toast.error("Bulk Cancel failed."),
  });

  const archiveMutation = useMutation({
    mutationFn: () =>
      bulkArchiveClientsAction({
        clientIds: selectedIds,
        note: archiveNote,
      }),
    onSuccess: (result) => handleBulkResult(result, "archived"),
    onError: () => toast.error("Bulk Archive failed."),
  });

  const refundMutation = useMutation({
    mutationFn: () =>
      bulkRefundClientPaymentsAction({
        clientIds: selectedIds,
        confirmation: refundConfirmation,
        confirmedAt: refundConfirmedAt ? new Date(refundConfirmedAt).toISOString() : undefined,
        note: refundNote || undefined,
        paymentMethod,
        referencePrefix: refundReferencePrefix || undefined,
      }),
    onSuccess: (result) => {
      setRefundConfirmation("");
      handleBulkResult(result, "refunded");
    },
    onError: () => toast.error("Bulk Refund failed."),
  });

  const deleteMutation = useMutation({
    mutationFn: (force: boolean) =>
      bulkDeleteClientsAction({
        clientIds: selectedIds,
        confirmation: deleteConfirmation,
        force,
        note: deleteNote || undefined,
      }),
    onSuccess: (result) => {
      setDeleteConfirmation("");
      handleBulkDeleteResult(result);
    },
    onError: () => toast.error("Bulk Delete failed."),
  });

  const isPending =
    markPaidMutation.isPending ||
    cancelMutation.isPending ||
    archiveMutation.isPending ||
    refundMutation.isPending ||
    deleteMutation.isPending;

  if (selectedClients.length === 0) {
    return null;
  }

  function handleBulkResult(
    result: Awaited<ReturnType<typeof bulkArchiveClientsAction>>,
    actionLabel: string,
  ) {
    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    const message = buildBulkMessage(actionLabel, result.data);

    if (result.data.succeeded.length === 0) {
      toast.error(message);
    } else if (result.data.failed.length > 0 || result.data.skipped.length > 0) {
      toast(message);
    } else {
      toast.success(message);
    }

    if (result.data.succeeded.length > 0) {
      onClearSelection();
    }

    setDialog(null);
    router.refresh();
  }

  function handleBulkDeleteResult(result: Awaited<ReturnType<typeof bulkDeleteClientsAction>>) {
    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    const message = buildBulkDeleteMessage(result.data);

    if (result.data.succeeded.length === 0) {
      toast.error(message);
    } else if (result.data.failed.length > 0 || result.data.skipped.length > 0) {
      toast(message);
    } else {
      toast.success(message);
    }

    if (result.data.succeeded.length > 0) {
      onClearSelection();
    }

    setDialog(null);
    router.refresh();
  }

  return (
    <>
      <div className="bg-muted/30 flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3">
        <div className="space-y-1">
          <p className="text-sm font-medium">{selectedClients.length} selected</p>
          <p className="text-muted-foreground text-xs">
            Bulk actions preserve client, application, event, and payment records.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isPending || markEligible.length === 0 || markDefaultMissing}
            title={
              markDefaultMissing
                ? "Bulk Mark as Paid requires configured package default amounts. Use single Mark as Paid for manual confirmation."
                : undefined
            }
            onClick={() => setDialog("paid")}
          >
            Mark selected as paid
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isPending || cancelEligible.length === 0}
            onClick={() => setDialog("cancel")}
          >
            Cancel selected
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isPending || archiveEligible.length === 0}
            onClick={() => setDialog("archive")}
          >
            Archive selected
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isPending || refundEligible.length === 0}
            onClick={() => setDialog("refund")}
          >
            Refund selected
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isPending}
            title={
              deleteEligible.length === 0
                ? "Selected clients are not yet delete-eligible."
                : undefined
            }
            onClick={() => setDialog("delete")}
          >
            Delete selected
          </Button>
        </div>
        {markDefaultMissing ? (
          <p className="basis-full text-xs text-amber-700">
            Bulk Mark as Paid requires configured package default amounts. Use single Mark as Paid
            for manual confirmation.
          </p>
        ) : null}
      </div>

      <Dialog open={dialog === "paid"} onOpenChange={(open) => setDialog(open ? "paid" : null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Mark selected clients as paid</DialogTitle>
            <DialogDescription>
              {markEligible.length} eligible, {selectedClients.length - markEligible.length} will be
              skipped. Package default amounts will be used per client. Each client will use their
              saved payment preference where available.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="bulk-payment-method">Fallback payment method</Label>
              <Select
                value={paymentMethod}
                onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
              >
                <SelectTrigger id="bulk-payment-method">
                  <SelectValue placeholder="Payment method" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bulk-paid-at">Confirmed at</Label>
              <Input
                id="bulk-paid-at"
                type="datetime-local"
                value={paidAt}
                onChange={(event) => setPaidAt(event.currentTarget.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="bulk-reference-prefix">Reference prefix</Label>
              <Input
                id="bulk-reference-prefix"
                value={referencePrefix}
                onChange={(event) => setReferencePrefix(event.currentTarget.value)}
                placeholder="Optional"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="bulk-paid-note">Optional shared note</Label>
              <Textarea
                id="bulk-paid-note"
                value={paidNote}
                onChange={(event) => setPaidNote(event.currentTarget.value)}
                placeholder="Shared note written to each payment"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialog(null)}>
              Back
            </Button>
            <Button
              type="button"
              disabled={markPaidMutation.isPending || markDefaultMissing}
              className="bg-rsvp-brand text-rsvp-brand-foreground hover:bg-rsvp-brand/90"
              onClick={() => markPaidMutation.mutate()}
            >
              {markPaidMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Confirm bulk payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "refund"} onOpenChange={(open) => setDialog(open ? "refund" : null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Refund selected clients</DialogTitle>
            <DialogDescription>
              {refundEligible.length} eligible, {selectedClients.length - refundEligible.length}{" "}
              will be skipped. Refunds are recorded per client payment.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bulk-refund-confirmation">Type REFUND to confirm</Label>
              <Input
                id="bulk-refund-confirmation"
                value={refundConfirmation}
                onChange={(event) => setRefundConfirmation(event.currentTarget.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bulk-refund-confirmed-at">Confirmed at</Label>
              <Input
                id="bulk-refund-confirmed-at"
                type="datetime-local"
                value={refundConfirmedAt}
                onChange={(event) => setRefundConfirmedAt(event.currentTarget.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bulk-refund-payment-method">Fallback refund method</Label>
              <Select
                value={paymentMethod}
                onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
              >
                <SelectTrigger id="bulk-refund-payment-method">
                  <SelectValue placeholder="Refund method" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bulk-refund-reference-prefix">Reference prefix</Label>
              <Input
                id="bulk-refund-reference-prefix"
                value={refundReferencePrefix}
                onChange={(event) => setRefundReferencePrefix(event.currentTarget.value)}
                placeholder="Optional"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bulk-refund-note">Shared note</Label>
              <Textarea
                id="bulk-refund-note"
                value={refundNote}
                onChange={(event) => setRefundNote(event.currentTarget.value)}
                placeholder="Reason for these refunds"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialog(null)}>
              Back
            </Button>
            <Button
              type="button"
              disabled={refundMutation.isPending || refundConfirmation !== "REFUND"}
              onClick={() => refundMutation.mutate()}
            >
              {refundMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Confirm refunds
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "cancel"} onOpenChange={(open) => setDialog(open ? "cancel" : null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Cancel selected clients</DialogTitle>
            <DialogDescription>
              {cancelEligible.length} eligible, {selectedClients.length - cancelEligible.length}{" "}
              will be skipped. Paid, archived, and already cancelled clients are blocked.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bulk-cancel-confirmation">Type CANCEL to confirm</Label>
              <Input
                id="bulk-cancel-confirmation"
                value={cancelConfirmation}
                onChange={(event) => setCancelConfirmation(event.currentTarget.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bulk-cancel-note">Optional note</Label>
              <Textarea
                id="bulk-cancel-note"
                value={cancelNote}
                onChange={(event) => setCancelNote(event.currentTarget.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialog(null)}>
              Back
            </Button>
            <Button
              type="button"
              disabled={cancelMutation.isPending || cancelConfirmation !== "CANCEL"}
              onClick={() => cancelMutation.mutate()}
            >
              {cancelMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Cancel selected
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={dialog === "archive"}
        onOpenChange={(open) => setDialog(open ? "archive" : null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Archive selected clients</DialogTitle>
            <DialogDescription>
              {archiveEligible.length} eligible, {selectedClients.length - archiveEligible.length}{" "}
              already archived clients will be skipped. Records are preserved.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="bulk-archive-note">Required archive note</Label>
            <Textarea
              id="bulk-archive-note"
              value={archiveNote}
              onChange={(event) => setArchiveNote(event.currentTarget.value)}
              placeholder="Explain why these clients are being archived."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialog(null)}>
              Back
            </Button>
            <Button
              type="button"
              disabled={archiveMutation.isPending || !archiveNote.trim()}
              className="bg-rsvp-brand text-rsvp-brand-foreground hover:bg-rsvp-brand/90"
              onClick={() => archiveMutation.mutate()}
            >
              {archiveMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Archive selected
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "delete"} onOpenChange={(open) => setDialog(open ? "delete" : null)}>
        <DialogContent className="flex max-h-[90dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
          <DialogHeader className="shrink-0 border-b px-6 py-4">
            <DialogTitle>Delete selected clients</DialogTitle>
            <DialogDescription>
              Normal delete still follows the existing safety rules. Platform Admin force delete can
              only override cleanup-safe blockers and still refuses paid clients, live RSVP records,
              and persisted guest data.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
            <div className="grid gap-3 rounded-md border px-3 py-3 text-sm sm:grid-cols-3">
              <div>
                <p className="text-muted-foreground text-xs font-medium">Selected</p>
                <p className="font-medium">{selectedClients.length}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs font-medium">Eligible</p>
                <p className="font-medium">{deleteEligible.length}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs font-medium">Skipped</p>
                <p className="font-medium">{deleteSkipped.length}</p>
              </div>
            </div>
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-900">
              Normal delete removes only clients that are already eligible under the current cleanup
              rules. Typing <span className="font-semibold">DELETE</span> does not override blocked
              clients by itself.
            </div>
            <div className="space-y-2">
              <Label>Normal delete</Label>
              <div className="rounded-md border px-3 py-2 text-sm">
                <ul className="list-disc space-y-1 pl-5">
                  <li>Eligible client records only</li>
                  <li>Draft/private RSVP events and linked event content for eligible clients</li>
                  <li>
                    Non-paid payments, plus refunded payment rows only after tombstone proof is
                    preserved
                  </li>
                  <li>Linked Meta Pixel records for eligible clients</li>
                </ul>
              </div>
            </div>
            {isPlatformAdmin && deleteSkipped.length > 0 ? (
              <div className="space-y-2">
                <Label>Platform Admin force delete v1</Label>
                <div className="rounded-md border border-destructive/25 px-3 py-2 text-sm">
                  <ul className="list-disc space-y-1 pl-5">
                    <li>Can override archive/cancel, active status, active hosting/access, and setup blockers</li>
                    <li>Still blocks paid non-refunded clients, live RSVP records, and persisted guest data</li>
                    <li>Tombstones and preserved history remain mandatory before final deletion</li>
                  </ul>
                </div>
              </div>
            ) : null}
            <div className="space-y-2">
              <Label>What will be preserved</Label>
              <div className="rounded-md border px-3 py-2 text-sm">
                <ul className="list-disc space-y-1 pl-5">
                  <li>Client deletion tombstone written before each final delete</li>
                  <li>Audit/email/application/profile history through FK nulling</li>
                  <li>
                    Paid non-refunded clients, live RSVP clients, and active hosting/access clients
                    remain blocked
                  </li>
                </ul>
              </div>
            </div>
            {deleteReasonGroups.length > 0 ? (
              <div className="space-y-2">
                <Label>Blocked by normal delete rules</Label>
                <div className="space-y-2 rounded-md border px-3 py-2 text-sm">
                  {deleteReasonGroups.map((group) => (
                    <div key={group.reason} className="space-y-1">
                      <p className="font-medium">{group.reason}</p>
                      <p className="text-muted-foreground text-xs">{group.clients.join(", ")}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="bulk-delete-confirmation">Type DELETE to confirm</Label>
              <Input
                id="bulk-delete-confirmation"
                value={deleteConfirmation}
                onChange={(event) => setDeleteConfirmation(event.currentTarget.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bulk-delete-note">Optional note</Label>
              <Textarea
                id="bulk-delete-note"
                value={deleteNote}
                onChange={(event) => setDeleteNote(event.currentTarget.value)}
                placeholder="Reason for deleting these client records"
              />
            </div>
          </div>

          <DialogFooter className="shrink-0 rounded-none rounded-b-xl px-6 py-4">
            <Button type="button" variant="outline" onClick={() => setDialog(null)}>
              Back
            </Button>
            <Button
              type="button"
              disabled={
                deleteMutation.isPending ||
                deleteConfirmation !== "DELETE" ||
                deleteEligible.length === 0
              }
              onClick={() => deleteMutation.mutate(false)}
            >
              {deleteMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Delete eligible
            </Button>
            {isPlatformAdmin && deleteSkipped.length > 0 ? (
              <Button
                type="button"
                variant="destructive"
                disabled={deleteMutation.isPending || deleteConfirmation !== "DELETE"}
                onClick={() => deleteMutation.mutate(true)}
              >
                {deleteMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                Force delete selected
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function buildBulkMessage(
  actionLabel: string,
  result: {
    failed: Array<{ error: string }>;
    skipped: Array<{ reason: string }>;
    succeeded: Array<{ warnings: string[] }>;
    total: number;
  },
) {
  const warningCount = result.succeeded.reduce((count, item) => count + item.warnings.length, 0);
  const eligibleCount = result.succeeded.length + result.failed.length;
  const reasons = Array.from(
    new Set([
      ...result.skipped.map((item) => item.reason),
      ...result.failed.map((item) => item.error),
    ]),
  )
    .filter(Boolean)
    .slice(0, 2)
    .join("; ");

  const base = `${result.succeeded.length}/${result.total} clients ${actionLabel}. ${eligibleCount} eligible, ${result.skipped.length} skipped, ${result.failed.length} failed.`;

  if (warningCount > 0) {
    return `${base} ${warningCount} warning${warningCount === 1 ? "" : "s"}.`;
  }

  return reasons ? `${base} ${reasons}.` : base;
}

function buildBulkDeleteMessage(result: BulkDeleteResultData) {
  const reasons = Array.from(
    new Set([
      ...result.skipped.map((item) => item.reason),
      ...result.failed.map((item) => item.error),
    ]),
  )
    .filter(Boolean)
    .slice(0, 2)
    .join("; ");

  const base = `${result.normalDeletedCount + result.forceDeletedCount}/${result.selectedCount} clients deleted. ${result.normalDeletedCount} normal, ${result.forceDeletedCount} force, ${result.skippedCount} skipped, ${result.failedCount} failed.`;
  return reasons ? `${base} ${reasons}.` : base;
}

function groupDeleteReasons(selectedClients: ClientListItem[]) {
  const groups = new Map<string, string[]>();

  for (const client of selectedClients) {
    const existing = groups.get(client.deleteEligibilityReason) ?? [];
    existing.push(client.clientName);
    groups.set(client.deleteEligibilityReason, existing);
  }

  return Array.from(groups.entries()).map(([reason, clients]) => ({
    clients,
    reason,
  }));
}

function toDateTimeLocalValue(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}
