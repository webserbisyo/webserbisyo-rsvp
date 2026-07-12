import "server-only";

export const CLIENT_PAYMENT_STATUS_VALUES = ["pending", "paid", "cancelled", "refunded"] as const;

export type ClientPaymentDisplayStatus = (typeof CLIENT_PAYMENT_STATUS_VALUES)[number];
export function deriveClientPaymentStatus(input: {
  clientCancelledAt: string | null;
  clientStatus: string | null;
  paymentStatus: string | null;
}): ClientPaymentDisplayStatus {
  if (
    input.clientStatus === "cancelled" ||
    input.clientCancelledAt ||
    input.paymentStatus === "cancelled"
  ) {
    return "cancelled";
  }

  if (input.paymentStatus === "refunded") {
    return "refunded";
  }

  if (input.paymentStatus === "paid" || input.paymentStatus === "confirmed") {
    return "paid";
  }

  return "pending";
}
