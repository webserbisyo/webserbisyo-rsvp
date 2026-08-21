export type BillingPlanType = "pro" | "max" | "unknown";

export type BillingPaymentStatus =
  | "confirmed"
  | "pending"
  | "partial"
  | "unpaid"
  | "refunded"
  | "expired"
  | "missing";

export type BillingServiceState =
  | "active"
  | "ending_soon"
  | "expired"
  | "unpaid"
  | "missing_date"
  | "refunded";

export type BillingPaymentOption = {
  accountName: string | null;
  accountNumber: string | null;
  provider: string;
  qrImagePath?: string | null;
  qrImageUrl?: string | null;
};

export type BillingPageData = {
  amountPaid: number;
  clientId: string;
  currency: "PHP" | string;
  latestPayment: {
    amount: number | null;
    confirmedAt: string | null;
    customerEmail?: string | null;
    customerFullName?: string | null;
    customerPhone?: string | null;
    id: string;
    method: string | null;
    paidAt: string | null;
    reference: string | null;
    status: BillingPaymentStatus;
  } | null;
  paymentInstructions: {
    description: string;
    options: BillingPaymentOption[];
    title: string;
  };
  paymentStatus: BillingPaymentStatus;
  planDescription: string;
  planName: string;
  planType: BillingPlanType;
  remainingBalance: number | null;
  serviceDescription: string;
  servicePeriod: {
    endsAt: string | null;
    renewalAt: string | null;
    startsAt: string | null;
  };
  serviceState: BillingServiceState;
  support: {
    isEnabled: boolean;
    label: "Contact Support";
    url: string | null;
  };
  totalPackageAmount: number | null;
};
