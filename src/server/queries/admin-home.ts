import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export const ADMIN_HOME_NEEDS_ATTENTION_LIMIT = 5;
export const ADMIN_HOME_RECENT_APPLICATIONS_LIMIT = 6;

type AdminHomeStatusTone = "warning" | "success" | "danger" | "neutral";

type AdminHomeErrorKey = "stats" | "needsAttention" | "recentApplications";

type AdminHomeStats = {
  activeClients: number | null;
  awaitingPayment: number | null;
  pendingApplications: number | null;
  revenueThisMonth: number | null;
};

export type AdminHomeQueueItem = {
  href: string;
  id: string;
  statusLabel: string;
  statusTone: AdminHomeStatusTone;
  subtitle: string;
  title: string;
  type: "application" | "payment" | "client";
  updatedAt: string;
};

export type AdminHomeApplicationItem = {
  email: string;
  href: string;
  id: string;
  name: string;
  plan: string;
  statusLabel: string;
  statusTone: AdminHomeStatusTone;
  submittedAt: string;
};

export type AdminHomeSummary = {
  errors?: Partial<Record<AdminHomeErrorKey, string>>;
  generatedAt: string;
  needsAttention: AdminHomeQueueItem[];
  recentApplications: AdminHomeApplicationItem[];
  stats: AdminHomeStats;
};

type ApplicationRow = {
  approved_at: string | null;
  email: string;
  full_name: string;
  id: string;
  preferred_manual_payment_option: string | null;
  preferred_plan: string;
  reviewed_at: string | null;
  status: string;
  submitted_at: string;
  updated_at: string;
};

type PaymentStatusRow = {
  application_id: string;
  created_at: string;
  payment_status: string;
  updated_at: string;
};

const PENDING_APPLICATION_STATUSES = ["submitted", "reviewing"] as const;
const ACTIVE_CLIENT_STATUS = "active";
const APPROVED_APPLICATION_STATUS = "approved";
const PENDING_PAYMENT_STATUS = "pending";

const STATS_ERROR_MESSAGE = "Some summary metrics are unavailable right now.";
const NEEDS_ATTENTION_ERROR_MESSAGE = "Unable to load priority items right now.";
const RECENT_APPLICATIONS_ERROR_MESSAGE = "Unable to load recent applications right now.";

export async function getAdminHomeSummary(
  supabase: SupabaseClient<Database>,
): Promise<AdminHomeSummary> {
  const generatedAt = new Date().toISOString();
  const errors: Partial<Record<AdminHomeErrorKey, string>> = {};

  const [statsResult, needsAttentionResult, recentApplicationsResult] = await Promise.allSettled([
    getStats(supabase),
    getNeedsAttention(supabase),
    getRecentApplications(supabase),
  ]);

  const stats: AdminHomeStats =
    statsResult.status === "fulfilled"
      ? statsResult.value.stats
      : {
          activeClients: null,
          awaitingPayment: null,
          pendingApplications: null,
          revenueThisMonth: null,
        };

  if (statsResult.status === "rejected") {
    errors.stats = STATS_ERROR_MESSAGE;
  } else if (statsResult.value.hasPartialError) {
    errors.stats = STATS_ERROR_MESSAGE;
  }

  if (needsAttentionResult.status === "rejected") {
    errors.needsAttention = NEEDS_ATTENTION_ERROR_MESSAGE;
  }

  if (recentApplicationsResult.status === "rejected") {
    errors.recentApplications = RECENT_APPLICATIONS_ERROR_MESSAGE;
  }

  return {
    errors: Object.keys(errors).length > 0 ? errors : undefined,
    generatedAt,
    needsAttention: needsAttentionResult.status === "fulfilled" ? needsAttentionResult.value : [],
    recentApplications:
      recentApplicationsResult.status === "fulfilled" ? recentApplicationsResult.value : [],
    stats,
  };
}

async function getStats(supabase: SupabaseClient<Database>) {
  const stats: AdminHomeStats = {
    activeClients: null,
    awaitingPayment: null,
    pendingApplications: null,
    revenueThisMonth: null,
  };

  const [pendingApplicationsResult, activeClientsResult, awaitingPaymentResult, revenueResult] =
    await Promise.allSettled([
      getPendingApplicationsCount(supabase),
      getActiveClientsCount(supabase),
      getAwaitingPaymentCount(supabase),
      getRevenueThisMonth(supabase),
    ]);

  if (pendingApplicationsResult.status === "fulfilled") {
    stats.pendingApplications = pendingApplicationsResult.value;
  }

  if (activeClientsResult.status === "fulfilled") {
    stats.activeClients = activeClientsResult.value;
  }

  if (awaitingPaymentResult.status === "fulfilled") {
    stats.awaitingPayment = awaitingPaymentResult.value;
  }

  if (revenueResult.status === "fulfilled") {
    stats.revenueThisMonth = revenueResult.value;
  }

  return {
    hasPartialError: [
      pendingApplicationsResult,
      activeClientsResult,
      awaitingPaymentResult,
      revenueResult,
    ].some((result) => result.status === "rejected"),
    stats,
  };
}

async function getPendingApplicationsCount(supabase: SupabaseClient<Database>) {
  const { count, error } = await supabase
    .from("rsvp_applications")
    .select("*", { count: "exact", head: true })
    .in("status", [...PENDING_APPLICATION_STATUSES]);

  if (error) {
    throw error;
  }

  return count ?? 0;
}

async function getActiveClientsCount(supabase: SupabaseClient<Database>) {
  const { count, error } = await supabase
    .from("clients")
    .select("*", { count: "exact", head: true })
    .eq("status", ACTIVE_CLIENT_STATUS);

  if (error) {
    throw error;
  }

  return count ?? 0;
}

async function getAwaitingPaymentCount(supabase: SupabaseClient<Database>) {
  const approvedApplications = await getApprovedApplications(supabase);

  if (approvedApplications.length === 0) {
    return 0;
  }

  const paymentRows = await getPaymentsByApplicationIds(
    supabase,
    approvedApplications.map((application) => application.id),
  );

  const paymentMap = new Map(
    paymentRows.map((payment) => [payment.application_id, payment.payment_status]),
  );

  return approvedApplications.reduce((total, application) => {
    const paymentStatus = paymentMap.get(application.id);

    if (!paymentStatus || paymentStatus === PENDING_PAYMENT_STATUS) {
      return total + 1;
    }

    return total;
  }, 0);
}

async function getRevenueThisMonth(supabase: SupabaseClient<Database>) {
  const { startOfMonth, startOfNextMonth } = getCurrentMonthWindow();

  const { data, error } = await supabase
    .from("payments")
    .select("amount_paid")
    .eq("payment_status", "paid")
    .gte("paid_at", startOfMonth)
    .lt("paid_at", startOfNextMonth);

  if (error) {
    throw error;
  }

  return (data ?? []).reduce((total, row) => total + Number(row.amount_paid ?? 0), 0);
}

async function getNeedsAttention(
  supabase: SupabaseClient<Database>,
): Promise<AdminHomeQueueItem[]> {
  const [applicationRows, approvedApplications] = await Promise.all([
    getApplicationsForNeedsAttention(supabase),
    getApprovedApplications(supabase),
  ]);
  const paymentRows = await getPaymentsByApplicationIds(
    supabase,
    approvedApplications.map((application) => application.id),
  );

  const submittedItems = applicationRows
    .filter((application) => application.status === "submitted")
    .sort((left, right) => compareAscending(left.submitted_at, right.submitted_at))
    .map((application) => toApplicationQueueItem(application));

  const reviewingItems = applicationRows
    .filter((application) => application.status === "reviewing")
    .sort((left, right) =>
      compareAscending(
        left.reviewed_at ?? left.updated_at ?? left.submitted_at,
        right.reviewed_at ?? right.updated_at ?? right.submitted_at,
      ),
    )
    .map((application) => toApplicationQueueItem(application));

  const paymentMap = new Map(paymentRows.map((payment) => [payment.application_id, payment]));

  const approvedWithoutPaymentItems = approvedApplications
    .filter((application) => !paymentMap.has(application.id))
    .sort((left, right) =>
      compareAscending(
        left.approved_at ?? left.updated_at ?? left.submitted_at,
        right.approved_at ?? right.updated_at ?? right.submitted_at,
      ),
    )
    .map((application) => toAwaitingPaymentQueueItem(application));

  const pendingPaymentItems = approvedApplications
    .map((application) => {
      const payment = paymentMap.get(application.id);

      if (!payment || payment.payment_status !== PENDING_PAYMENT_STATUS) {
        return null;
      }

      return toPendingPaymentQueueItem(application, payment);
    })
    .filter((item): item is AdminHomeQueueItem => item !== null)
    .sort((left, right) => compareAscending(left.updatedAt, right.updatedAt));

  return [
    ...submittedItems,
    ...reviewingItems,
    ...approvedWithoutPaymentItems,
    ...pendingPaymentItems,
  ].slice(0, ADMIN_HOME_NEEDS_ATTENTION_LIMIT);
}

async function getRecentApplications(
  supabase: SupabaseClient<Database>,
): Promise<AdminHomeApplicationItem[]> {
  const { data, error } = await supabase
    .from("rsvp_applications")
    .select("id, full_name, email, preferred_plan, status, submitted_at")
    .order("submitted_at", { ascending: false })
    .limit(ADMIN_HOME_RECENT_APPLICATIONS_LIMIT);

  if (error) {
    throw error;
  }

  return (data ?? []).map((application) => ({
    email: application.email,
    href: `/admin/applications/${application.id}`,
    id: application.id,
    name: application.full_name,
    plan: formatPlanLabel(application.preferred_plan),
    statusLabel: formatApplicationStatusLabel(application.status),
    statusTone: mapApplicationStatusTone(application.status),
    submittedAt: application.submitted_at,
  }));
}

async function getApplicationsForNeedsAttention(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from("rsvp_applications")
    .select(
      "id, full_name, email, preferred_plan, preferred_manual_payment_option, status, submitted_at, reviewed_at, updated_at",
    )
    .in("status", [...PENDING_APPLICATION_STATUSES]);

  if (error) {
    throw error;
  }

  return data ?? [];
}

async function getApprovedApplications(
  supabase: SupabaseClient<Database>,
): Promise<ApplicationRow[]> {
  const { data, error } = await supabase
    .from("rsvp_applications")
    .select(
      "id, full_name, email, preferred_plan, preferred_manual_payment_option, status, submitted_at, reviewed_at, approved_at, updated_at",
    )
    .eq("status", APPROVED_APPLICATION_STATUS);

  if (error) {
    throw error;
  }

  return data ?? [];
}

async function getPaymentsByApplicationIds(
  supabase: SupabaseClient<Database>,
  applicationIds: string[],
): Promise<PaymentStatusRow[]> {
  if (applicationIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("payments")
    .select("application_id, payment_status, created_at, updated_at")
    .in("application_id", applicationIds);

  if (error) {
    throw error;
  }

  return data ?? [];
}

function toApplicationQueueItem(
  application: Pick<
    ApplicationRow,
    | "email"
    | "full_name"
    | "id"
    | "preferred_plan"
    | "status"
    | "submitted_at"
    | "reviewed_at"
    | "updated_at"
  >,
) {
  return {
    href: `/admin/applications/${application.id}`,
    id: application.id,
    statusLabel: formatApplicationStatusLabel(application.status),
    statusTone: mapApplicationStatusTone(application.status),
    subtitle: `${formatPlanLabel(application.preferred_plan)} application · ${application.email}`,
    title: application.full_name,
    type: "application" as const,
    updatedAt:
      application.status === "reviewing"
        ? (application.reviewed_at ?? application.updated_at ?? application.submitted_at)
        : application.submitted_at,
  };
}

function toAwaitingPaymentQueueItem(
  application: Pick<
    ApplicationRow,
    | "approved_at"
    | "email"
    | "full_name"
    | "id"
    | "preferred_manual_payment_option"
    | "preferred_plan"
    | "submitted_at"
    | "updated_at"
  >,
): AdminHomeQueueItem {
  const paymentOption = application.preferred_manual_payment_option
    ? ` · ${application.preferred_manual_payment_option.toUpperCase()}`
    : "";

  return {
    href: `/admin/applications/${application.id}`,
    id: application.id,
    statusLabel: "Awaiting payment",
    statusTone: "warning",
    subtitle: `${formatPlanLabel(application.preferred_plan)} application${paymentOption} · ${application.email}`,
    title: application.full_name,
    type: "payment",
    updatedAt: application.approved_at ?? application.updated_at ?? application.submitted_at,
  };
}

function toPendingPaymentQueueItem(
  application: Pick<ApplicationRow, "email" | "full_name" | "id" | "preferred_plan">,
  payment: PaymentStatusRow,
): AdminHomeQueueItem {
  return {
    href: `/admin/applications/${application.id}`,
    id: application.id,
    statusLabel: "Payment pending",
    statusTone: "warning",
    subtitle: `${formatPlanLabel(application.preferred_plan)} payment record · ${application.email}`,
    title: application.full_name,
    type: "payment",
    updatedAt: payment.updated_at ?? payment.created_at,
  };
}

function formatApplicationStatusLabel(status: string) {
  switch (status) {
    case "submitted":
      return "Submitted";
    case "reviewing":
      return "Reviewing";
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
}

function formatPlanLabel(plan: string) {
  switch (plan) {
    case "pro":
      return "Pro";
    case "max":
      return "Max";
    default:
      return plan;
  }
}

function mapApplicationStatusTone(status: string): AdminHomeStatusTone {
  switch (status) {
    case "submitted":
    case "reviewing":
      return "warning";
    case "approved":
      return "success";
    case "rejected":
      return "danger";
    case "cancelled":
    default:
      return "neutral";
  }
}

function compareAscending(left: string, right: string) {
  return new Date(left).getTime() - new Date(right).getTime();
}

function getCurrentMonthWindow() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0));

  return {
    startOfMonth: start.toISOString(),
    startOfNextMonth: next.toISOString(),
  };
}
