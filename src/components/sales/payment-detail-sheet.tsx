"use client";

import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import type { SalesListItem } from "@/server/queries/admin-sales";
import {
  confirmManualPaymentAction,
  transitionPaymentStatusAction,
} from "@/server/actions/admin-sales";
import { PaymentStatusBadge } from "@/components/applications/application-badges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";

type PaymentDetailSheetProps = {
  onClose: () => void;
  open: boolean;
  payment: SalesListItem | null;
};

type PaymentStatusTransition = "cancelled" | "failed" | "refunded" | null;

export function PaymentDetailSheet({ onClose, open, payment }: PaymentDetailSheetProps) {
  if (!payment) {
    return null;
  }

  return (
    <PaymentDetailSheetContent key={payment.id} onClose={onClose} open={open} payment={payment} />
  );
}

function PaymentDetailSheetContent({
  onClose,
  open,
  payment,
}: PaymentDetailSheetProps & { payment: SalesListItem }) {
  const router = useRouter();
  const [referenceNumber, setReferenceNumber] = useState(payment.referenceNumber ?? "");
  const [paymentMethod, setPaymentMethod] = useState(payment.paymentMethod ?? "manual");
  const [amountPaid, setAmountPaid] = useState("");
  const [customAmountReason, setCustomAmountReason] = useState("");
  const [note, setNote] = useState(payment.notes ?? "");
  const [transitionStatus, setTransitionStatus] = useState<PaymentStatusTransition>(null);
  const [transitionNote, setTransitionNote] = useState("");

  const confirmMutation = useMutation({
    mutationFn: confirmManualPaymentAction,
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success("Manual payment confirmed.");
      onClose();
      router.refresh();
    },
    onError: () => {
      toast.error("The payment could not be confirmed.");
    },
  });

  const transitionMutation = useMutation({
    mutationFn: transitionPaymentStatusAction,
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success("Payment status updated.");
      setTransitionStatus(null);
      setTransitionNote("");
      router.refresh();
    },
    onError: () => {
      toast.error("The payment status could not be updated.");
    },
  });

  const selectedPayment = payment;
  const isPendingPayment = payment.paymentStatus === "pending";
  const isPaidPayment = payment.paymentStatus === "paid";

  function confirmPayment() {
    if (!referenceNumber.trim()) {
      toast.error("A reference number is required.");
      return;
    }

    confirmMutation.mutate({
      amountPaid: amountPaid.trim() ? Number(amountPaid) : undefined,
      customAmountReason: customAmountReason.trim() || undefined,
      note: note.trim() || undefined,
      paymentId: selectedPayment.id,
      paymentMethod: paymentMethod as "gcash" | "maya" | "manual",
      referenceNumber: referenceNumber.trim(),
    });
  }

  function transitionPayment() {
    if (!transitionStatus || !transitionNote.trim()) {
      toast.error("A note is required for this payment update.");
      return;
    }

    transitionMutation.mutate({
      note: transitionNote.trim(),
      paymentId: selectedPayment.id,
      status: transitionStatus,
    });
  }

  return (
    <Sheet open={open} onOpenChange={(nextOpen) => (!nextOpen ? onClose() : null)}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader className="space-y-2">
          <SheetTitle>Payment details</SheetTitle>
          <SheetDescription>
            Confirm manual payments here. Client provisioning is triggered only after confirmation.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <section className="space-y-3 rounded-2xl border p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">
                  {payment.client?.name ?? payment.application?.title ?? "Pending payment"}
                </p>
                <p className="text-muted-foreground text-xs">
                  {payment.application?.referenceCode ?? payment.id}
                </p>
              </div>
              <PaymentStatusBadge
                label={payment.paymentStatusLabel}
                status={payment.paymentStatus}
              />
            </div>

            <dl className="grid gap-3 text-sm">
              <div className="grid gap-1 sm:grid-cols-[11rem_minmax(0,1fr)]">
                <dt className="text-muted-foreground text-xs font-medium">Package</dt>
                <dd>{payment.planTypeLabel}</dd>
              </div>
              <div className="grid gap-1 sm:grid-cols-[11rem_minmax(0,1fr)]">
                <dt className="text-muted-foreground text-xs font-medium">Amount due</dt>
                <dd>{formatCurrency(payment.amountDue)}</dd>
              </div>
              <div className="grid gap-1 sm:grid-cols-[11rem_minmax(0,1fr)]">
                <dt className="text-muted-foreground text-xs font-medium">Amount paid</dt>
                <dd>{formatCurrency(payment.amountPaid)}</dd>
              </div>
              <div className="grid gap-1 sm:grid-cols-[11rem_minmax(0,1fr)]">
                <dt className="text-muted-foreground text-xs font-medium">Method</dt>
                <dd>{payment.paymentMethod ?? "Not confirmed yet"}</dd>
              </div>
              <div className="grid gap-1 sm:grid-cols-[11rem_minmax(0,1fr)]">
                <dt className="text-muted-foreground text-xs font-medium">Reference</dt>
                <dd>{payment.referenceNumber ?? "Not confirmed yet"}</dd>
              </div>
            </dl>
          </section>

          <section className="space-y-3 rounded-2xl border p-4">
            <p className="text-sm font-medium">Linked records</p>
            <div className="grid gap-3 text-sm">
              <RecordLink
                href={payment.application?.href}
                label="Application"
                primary={payment.application?.title ?? "No linked application"}
                secondary={payment.application?.referenceCode ?? null}
              />
              <RecordLink
                href={payment.client?.href}
                label="Client"
                primary={payment.client?.name ?? "No client provisioned yet"}
                secondary={payment.client?.email ?? null}
              />
              <RecordLink
                href={payment.event?.href}
                label="Event"
                primary={payment.event?.title ?? "No event provisioned yet"}
                secondary={payment.event?.slug ?? null}
              />
            </div>
          </section>

          <section className="space-y-3 rounded-2xl border p-4">
            <p className="text-sm font-medium">Hosting coverage</p>
            <dl className="grid gap-3 text-sm">
              <div className="grid gap-1 sm:grid-cols-[11rem_minmax(0,1fr)]">
                <dt className="text-muted-foreground text-xs font-medium">Starts</dt>
                <dd>{formatDateTime(payment.hostingStartsAt)}</dd>
              </div>
              <div className="grid gap-1 sm:grid-cols-[11rem_minmax(0,1fr)]">
                <dt className="text-muted-foreground text-xs font-medium">Ends</dt>
                <dd>{formatDateTime(payment.hostingEndsAt)}</dd>
              </div>
              <div className="grid gap-1 sm:grid-cols-[11rem_minmax(0,1fr)]">
                <dt className="text-muted-foreground text-xs font-medium">Renewal required</dt>
                <dd>{formatDateTime(payment.renewalRequiredAt)}</dd>
              </div>
            </dl>
          </section>

          <section className="space-y-3 rounded-2xl border p-4">
            <p className="text-sm font-medium">Activity</p>
            {payment.activity.length === 0 ? (
              <p className="text-muted-foreground text-sm">No payment audit activity yet.</p>
            ) : (
              <ol className="space-y-3">
                {payment.activity.map((activity) => (
                  <li key={activity.id} className="flex gap-3">
                    <div className="bg-rsvp-brand mt-1 size-2 rounded-full" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{activity.actionLabel}</p>
                      <p className="text-muted-foreground text-xs">
                        {formatDateTime(activity.createdAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>

          {isPendingPayment ? (
            <section className="space-y-4 rounded-2xl border p-4">
              <p className="text-sm font-medium">Confirm manual payment</p>

              <div className="space-y-2">
                <Label htmlFor="payment-reference-number">Reference number</Label>
                <Input
                  id="payment-reference-number"
                  value={referenceNumber}
                  onChange={(event) => setReferenceNumber(event.currentTarget.value)}
                  placeholder="Enter the confirmed reference number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment-method">Payment method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger id="payment-method">
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="gcash">GCash</SelectItem>
                    <SelectItem value="maya">Maya</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment-amount-paid">Custom amount paid (optional)</Label>
                <Input
                  id="payment-amount-paid"
                  inputMode="decimal"
                  value={amountPaid}
                  onChange={(event) => setAmountPaid(event.currentTarget.value)}
                  placeholder={String(payment.amountDue)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment-custom-reason">Custom amount reason</Label>
                <Textarea
                  id="payment-custom-reason"
                  value={customAmountReason}
                  onChange={(event) => setCustomAmountReason(event.currentTarget.value)}
                  placeholder="Required only if the paid amount differs from the default."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment-note">Internal note</Label>
                <Textarea
                  id="payment-note"
                  value={note}
                  onChange={(event) => setNote(event.currentTarget.value)}
                  placeholder="Optional note for this payment confirmation."
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  disabled={confirmMutation.isPending}
                  className="bg-rsvp-brand text-rsvp-brand-foreground hover:bg-rsvp-brand/90"
                  onClick={confirmPayment}
                >
                  {confirmMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                  Confirm payment
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setTransitionStatus("failed")}
                >
                  Mark failed
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setTransitionStatus("cancelled")}
                >
                  Cancel payment
                </Button>
              </div>
            </section>
          ) : null}

          {isPaidPayment ? (
            <section className="space-y-4 rounded-2xl border p-4">
              <p className="text-sm font-medium">After confirmation</p>
              <p className="text-muted-foreground text-sm">
                This payment is already confirmed. Repeated clicks are idempotent; use refund only
                when the paid record itself must be reversed.
              </p>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setTransitionStatus("refunded")}
                >
                  Mark refunded
                </Button>
              </div>
            </section>
          ) : null}

          {transitionStatus ? (
            <section className="space-y-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-medium">Update payment status</p>
              <div className="space-y-2">
                <Label htmlFor="payment-transition-note">Required note</Label>
                <Textarea
                  id="payment-transition-note"
                  value={transitionNote}
                  onChange={(event) => setTransitionNote(event.currentTarget.value)}
                  placeholder="Explain why this payment is being updated."
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <Button type="button" variant="outline" onClick={() => setTransitionStatus(null)}>
                  Back
                </Button>
                <Button
                  type="button"
                  disabled={transitionMutation.isPending}
                  onClick={transitionPayment}
                >
                  {transitionMutation.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : null}
                  Confirm {transitionStatus}
                </Button>
              </div>
            </section>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function RecordLink({
  href,
  label,
  primary,
  secondary,
}: {
  href: string | null | undefined;
  label: string;
  primary: string;
  secondary: string | null;
}) {
  return (
    <div className="grid gap-1">
      <p className="text-muted-foreground text-xs font-medium">{label}</p>
      {href ? (
        <Link href={href} className="text-sm font-medium underline underline-offset-4">
          {primary}
        </Link>
      ) : (
        <p className="text-sm font-medium">{primary}</p>
      )}
      {secondary ? <p className="text-muted-foreground text-xs">{secondary}</p> : null}
    </div>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-PH", {
    currency: "PHP",
    style: "currency",
  }).format(value);
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(new Date(value));
}
