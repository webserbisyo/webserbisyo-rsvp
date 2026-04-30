"use client";

import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { ClientDetailView } from "@/server/queries/admin-clients";
import type { AdminPackageSettingsView } from "@/server/queries/platform-package-settings";
import { cancelClientAction, markClientPaidAction } from "@/server/actions/admin-clients";
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

type ClientPrimaryActionsProps = {
  client: ClientDetailView;
  packageSettings: AdminPackageSettingsView;
};

type PaymentMethod = "gcash" | "maya" | "manual";

const PAYMENT_METHODS: Array<{ label: string; value: PaymentMethod }> = [
  { label: "GCash", value: "gcash" },
  { label: "Maya", value: "maya" },
  { label: "Manual / bank transfer", value: "manual" },
];

export function ClientPrimaryActions({ client, packageSettings }: ClientPrimaryActionsProps) {
  const router = useRouter();
  const packageDefaultAmount = getPackageDefaultAmount(client.client.plan, packageSettings);
  const lockedPreferredMethod = getLockedPreferredMethod(
    client.payment.method,
    client.application.preferredPaymentMethod,
  );
  const [markPaidOpen, setMarkPaidOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [amountDue, setAmountDue] = useState(
    formatMoneyInput(client.payment.amountDue ?? packageDefaultAmount),
  );
  const [amountPaid, setAmountPaid] = useState(
    formatMoneyInput(client.payment.amountPaid ?? packageDefaultAmount),
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    normalizePaymentMethod(lockedPreferredMethod ?? "manual"),
  );
  const [referenceNumber, setReferenceNumber] = useState(client.payment.referenceNumber ?? "");
  const [paidAt, setPaidAt] = useState(toDateTimeLocalValue(client.payment.paidAt));
  const [paymentNote, setPaymentNote] = useState("");
  const [cancelConfirmation, setCancelConfirmation] = useState("");
  const [cancelNote, setCancelNote] = useState("");

  const isPaymentPending = client.payment.status === "pending";
  const isClosedClient =
    client.client.status === "archived" || client.client.status === "cancelled";
  const canMarkPaid = isPaymentPending && !isClosedClient;
  const canCancel = isPaymentPending && !isClosedClient;

  const disabledReason = useMemo(() => {
    if (isClosedClient) {
      return "Archived or cancelled clients cannot use payment actions.";
    }

    if (!isPaymentPending) {
      return "Payment is not pending.";
    }

    return undefined;
  }, [isClosedClient, isPaymentPending]);

  const markPaidMutation = useMutation({
    mutationFn: () =>
      markClientPaidAction({
        amountDue: parseOptionalMoney(amountDue),
        amountPaid: parseOptionalMoney(amountPaid),
        clientId: client.id,
        note: paymentNote || undefined,
        paidAt: paidAt ? new Date(paidAt).toISOString() : undefined,
        paymentMethod: lockedPreferredMethod ? undefined : paymentMethod,
        referenceNumber: referenceNumber.trim() || undefined,
      }),
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success("Payment confirmed.");
      for (const warning of result.data.warnings ?? []) {
        toast.warning(warning);
      }
      setMarkPaidOpen(false);
      router.refresh();
    },
    onError: () => {
      toast.error("The payment could not be confirmed.");
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () =>
      cancelClientAction({
        clientId: client.id,
        confirmation: cancelConfirmation,
        note: cancelNote || undefined,
      }),
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success("Client cancelled.");
      for (const warning of result.data.warnings ?? []) {
        toast.warning(warning);
      }
      setCancelOpen(false);
      setCancelConfirmation("");
      setCancelNote("");
      router.refresh();
    },
    onError: () => {
      toast.error("The client could not be cancelled.");
    },
  });

  function submitMarkPaid() {
    if (!parseOptionalMoney(amountPaid)) {
      toast.error("Enter the amount paid.");
      return;
    }

    markPaidMutation.mutate();
  }

  function submitCancel() {
    if (cancelConfirmation !== "CANCEL") {
      toast.error("Type CANCEL to confirm cancellation.");
      return;
    }

    cancelMutation.mutate();
  }

  return (
    <>
      <div className="flex shrink-0 flex-wrap gap-2 lg:justify-end">
        <Button
          type="button"
          disabled={!canMarkPaid}
          title={disabledReason}
          className="bg-rsvp-brand text-rsvp-brand-foreground hover:bg-rsvp-brand/90"
          onClick={() => setMarkPaidOpen(true)}
        >
          Mark as Paid
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={!canCancel}
          title={disabledReason}
          onClick={() => setCancelOpen(true)}
        >
          Cancel
        </Button>
      </div>

      <Dialog open={markPaidOpen} onOpenChange={setMarkPaidOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Mark client as paid</DialogTitle>
            <DialogDescription>
              Confirm manual payment for {client.client.name}. This does not publish the RSVP
              website.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Client</Label>
              <Input value={client.client.name} readOnly />
            </div>
            <div className="space-y-2">
              <Label>Plan</Label>
              <Input value={client.client.planLabel} readOnly />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-amount-due">Amount due</Label>
              <Input
                id="client-amount-due"
                inputMode="decimal"
                value={amountDue}
                onChange={(event) => setAmountDue(event.currentTarget.value)}
                placeholder="Package default"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-amount-paid">Amount paid</Label>
              <Input
                id="client-amount-paid"
                inputMode="decimal"
                value={amountPaid}
                onChange={(event) => setAmountPaid(event.currentTarget.value)}
                placeholder="Package default"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-payment-method">Payment method</Label>
              {lockedPreferredMethod ? (
                <Input value={formatPaymentMethodLabel(lockedPreferredMethod)} readOnly />
              ) : (
                <Select
                  value={paymentMethod}
                  onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
                >
                  <SelectTrigger id="client-payment-method">
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((method) => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-reference-number">Reference number</Label>
              <Input
                id="client-reference-number"
                value={referenceNumber}
                onChange={(event) => setReferenceNumber(event.currentTarget.value)}
                placeholder="Optional receipt or transfer reference"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="client-paid-at">Confirmed at</Label>
              <Input
                id="client-paid-at"
                type="datetime-local"
                value={paidAt}
                onChange={(event) => setPaidAt(event.currentTarget.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="client-payment-note">Admin note</Label>
              <Textarea
                id="client-payment-note"
                value={paymentNote}
                onChange={(event) => setPaymentNote(event.currentTarget.value)}
                placeholder="Optional note for custom work, discount, or negotiated amount"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setMarkPaidOpen(false)}>
              Back
            </Button>
            <Button
              type="button"
              disabled={markPaidMutation.isPending}
              className="bg-rsvp-brand text-rsvp-brand-foreground hover:bg-rsvp-brand/90"
              onClick={submitMarkPaid}
            >
              {markPaidMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Confirm payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Cancel client path</DialogTitle>
            <DialogDescription>
              This cancels the payment/onboarding path without deleting the client, application,
              event, or payment history.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="client-cancel-confirmation">Type CANCEL to confirm</Label>
              <Input
                id="client-cancel-confirmation"
                value={cancelConfirmation}
                onChange={(event) => setCancelConfirmation(event.currentTarget.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-cancel-note">Optional note</Label>
              <Textarea
                id="client-cancel-note"
                value={cancelNote}
                onChange={(event) => setCancelNote(event.currentTarget.value)}
                placeholder="Reason for cancelling this client path"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCancelOpen(false)}>
              Back
            </Button>
            <Button type="button" disabled={cancelMutation.isPending} onClick={submitCancel}>
              {cancelMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Cancel client
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function getPackageDefaultAmount(
  plan: string | null,
  packageSettings: AdminPackageSettingsView,
): number | null {
  if (plan === "pro") {
    return packageSettings.pro.defaultAmount;
  }

  if (plan === "max") {
    return packageSettings.max.defaultAmount;
  }

  return null;
}

function getLockedPreferredMethod(
  paymentMethod: string | null,
  preferredPaymentMethod: string | null,
) {
  if (paymentMethod === "gcash" || paymentMethod === "maya") {
    return paymentMethod;
  }

  if (preferredPaymentMethod === "gcash" || preferredPaymentMethod === "maya") {
    return preferredPaymentMethod;
  }

  return null;
}

function formatPaymentMethodLabel(value: string) {
  switch (value) {
    case "gcash":
      return "GCash";
    case "maya":
      return "Maya";
    case "manual":
    default:
      return "Manual / bank transfer";
  }
}

function formatMoneyInput(value: number | null) {
  return value === null ? "" : String(value);
}

function parseOptionalMoney(value: string) {
  const normalized = value.trim();

  if (!normalized) {
    return undefined;
  }

  const parsed = Number(normalized);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function normalizePaymentMethod(value: string | null): PaymentMethod {
  if (value === "gcash" || value === "maya" || value === "manual") {
    return value;
  }

  return "manual";
}

function toDateTimeLocalValue(value: string | null) {
  const date = value ? new Date(value) : new Date();

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}
