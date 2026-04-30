import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import {
  type DeleteEligibilityReasonCode,
  deriveDeleteEligibility,
} from "@/server/services/admin-workflow/client-rules";

export const ADMIN_HOME_NEEDS_ATTENTION_LIMIT = 5;
export const ADMIN_HOME_RECENT_APPLICATIONS_LIMIT = 6;
export const ADMIN_HOME_RECENT_LIST_LIMIT = 8;

type AdminHomeStatusTone = "warning" | "success" | "danger" | "neutral";

type AdminHomeErrorKey = "stats" | "needsAttention" | "recentRecords";

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

export type AdminHomeRecentItem = {
  caption: string;
  href: string;
  id: string;
  meta: string;
  statusLabel: string;
  statusTone: AdminHomeStatusTone;
  title: string;
  timestamp: string;
  type: "application" | "client" | "payment" | "activity";
};

export type AdminHomeSummary = {
  errors?: Partial<Record<AdminHomeErrorKey, string>>;
  generatedAt: string;
  needsAttention: AdminHomeQueueItem[];
  recentRecords: AdminHomeRecentItem[];
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

type HomeClientRow = {
  archived_at: string | null;
  cancelled_at: string | null;
  contact_email: string;
  contact_name: string | null;
  contact_phone: string | null;
  custom_frontend_status: string;
  custom_frontend_url: string | null;
  hosting_ends_at: string | null;
  id: string;
  last_activity_at: string;
  name: string;
  plan_type: string;
  status: string;
  updated_at: string;
};

type HomeEventRow = {
  client_id: string;
  custom_frontend_enabled: boolean;
  custom_frontend_url: string | null;
  event_date: string | null;
  event_slug: string;
  event_type: string;
  id: string;
  published_at: string | null;
  status: string;
  title: string;
  updated_at: string;
  visibility: string;
};

type HomePaymentRow = {
  amount_due: number;
  amount_paid: number;
  application_id: string;
  client_id: string | null;
  created_at: string;
  currency: string;
  event_id: string | null;
  id: string;
  paid_at: string | null;
  payment_status: string;
  plan_type: string;
  reference_number: string | null;
  updated_at: string;
};

type HomeRefundRow = {
  client_id: string | null;
  id: string;
  payment_id: string;
};

const PENDING_APPLICATION_STATUSES = ["submitted", "reviewing"] as const;
const ACTIVE_CLIENT_STATUS = "active";
const APPROVED_APPLICATION_STATUS = "approved";
const PENDING_PAYMENT_STATUS = "pending";

const STATS_ERROR_MESSAGE = "Some summary metrics are unavailable right now.";
const NEEDS_ATTENTION_ERROR_MESSAGE = "Unable to load priority items right now.";
const RECENT_RECORDS_ERROR_MESSAGE = "Unable to load recent records right now.";

export async function getAdminHomeSummary(
  supabase: SupabaseClient<Database>,
): Promise<AdminHomeSummary> {
  const generatedAt = new Date().toISOString();
  const errors: Partial<Record<AdminHomeErrorKey, string>> = {};

  const [
    statsResult,
    needsAttentionResult,
    recentApplicationsResult,
    recentClientsResult,
    recentPaymentsResult,
    recentActivityResult,
  ] = await Promise.allSettled([
    getStats(supabase),
    getNeedsAttention(supabase),
    getRecentApplications(supabase),
    getRecentClients(supabase),
    getRecentPayments(supabase),
    getRecentActivity(supabase),
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

  if (
    recentApplicationsResult.status === "rejected" ||
    recentClientsResult.status === "rejected" ||
    recentPaymentsResult.status === "rejected" ||
    recentActivityResult.status === "rejected"
  ) {
    errors.recentRecords = RECENT_RECORDS_ERROR_MESSAGE;
  }

  return {
    errors: Object.keys(errors).length > 0 ? errors : undefined,
    generatedAt,
    needsAttention: needsAttentionResult.status === "fulfilled" ? needsAttentionResult.value : [],
    recentRecords: buildRecentRecords([
      recentApplicationsResult.status === "fulfilled" ? recentApplicationsResult.value : [],
      recentClientsResult.status === "fulfilled" ? recentClientsResult.value : [],
      recentPaymentsResult.status === "fulfilled" ? recentPaymentsResult.value : [],
      recentActivityResult.status === "fulfilled" ? recentActivityResult.value : [],
    ]),
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
  const [applicationRows, clientRows, eventRows, paymentRows, refundRows] = await Promise.all([
    getApplicationsForNeedsAttention(supabase),
    getHomeClients(supabase),
    getHomeEvents(supabase),
    getHomePayments(supabase),
    getHomeRefunds(supabase),
  ]);

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

  const awaitingPaymentItems = buildAwaitingPaymentItems(clientRows, paymentRows);
  const eventPassedItems = buildEventPassedItems(clientRows, eventRows);
  const cleanupEligibleItems = buildCleanupEligibleItems(
    clientRows,
    eventRows,
    paymentRows,
    refundRows,
  );
  const paymentIssueItems = buildPaymentIssueItems(paymentRows);

  return [
    ...submittedItems,
    ...reviewingItems,
    ...awaitingPaymentItems,
    ...eventPassedItems,
    ...cleanupEligibleItems,
    ...paymentIssueItems,
  ]
    .sort(compareNeedsAttentionItems)
    .slice(0, ADMIN_HOME_NEEDS_ATTENTION_LIMIT);
}

async function getRecentApplications(
  supabase: SupabaseClient<Database>,
): Promise<AdminHomeRecentItem[]> {
  const { data, error } = await supabase
    .from("rsvp_applications")
    .select("id, full_name, email, preferred_plan, status, submitted_at")
    .order("submitted_at", { ascending: false })
    .limit(ADMIN_HOME_RECENT_APPLICATIONS_LIMIT);

  if (error) {
    throw error;
  }

  return (data ?? []).map((application) => ({
    caption: application.email,
    href: buildApplicationSheetHref(application.id),
    id: application.id,
    meta: formatPlanLabel(application.preferred_plan),
    statusLabel: formatApplicationStatusLabel(application.status),
    statusTone: mapApplicationStatusTone(application.status),
    timestamp: application.submitted_at,
    title: application.full_name,
    type: "application",
  }));
}

async function getRecentClients(
  supabase: SupabaseClient<Database>,
): Promise<AdminHomeRecentItem[]> {
  const { data, error } = await supabase
    .from("clients")
    .select("id, name, contact_email, plan_type, status, updated_at")
    .order("updated_at", { ascending: false })
    .limit(ADMIN_HOME_RECENT_LIST_LIMIT);

  if (error) {
    throw error;
  }

  return (data ?? []).map((client) => ({
    caption: client.contact_email,
    href: `/admin/clients/${client.id}`,
    id: client.id,
    meta: formatPlanLabel(client.plan_type),
    statusLabel: formatClientStatusLabel(client.status),
    statusTone: mapClientStatusTone(client.status),
    timestamp: client.updated_at,
    title: client.name,
    type: "client",
  }));
}

async function getRecentPayments(
  supabase: SupabaseClient<Database>,
): Promise<AdminHomeRecentItem[]> {
  const { data, error } = await supabase
    .from("payments")
    .select(
      "id, client_id, amount_paid, amount_due, currency, payment_status, plan_type, reference_number, paid_at, updated_at",
    )
    .order("updated_at", { ascending: false })
    .limit(ADMIN_HOME_RECENT_LIST_LIMIT);

  if (error) {
    throw error;
  }

  return (data ?? []).map((payment) => ({
    caption: payment.reference_number
      ? `Reference ${payment.reference_number}`
      : formatPlanLabel(payment.plan_type),
    href: payment.client_id ? `/admin/clients/${payment.client_id}` : "/admin/clients",
    id: payment.id,
    meta: formatCurrency(payment.amount_paid || payment.amount_due),
    statusLabel: formatPaymentStatusLabel(payment.payment_status),
    statusTone: mapPaymentStatusTone(payment.payment_status),
    timestamp: payment.paid_at ?? payment.updated_at,
    title: "Manual payment",
    type: "payment",
  }));
}

async function getRecentActivity(
  supabase: SupabaseClient<Database>,
): Promise<AdminHomeRecentItem[]> {
  const { data, error } = await supabase
    .from("audit_logs")
    .select("id, action, entity_type, created_at")
    .order("created_at", { ascending: false })
    .limit(ADMIN_HOME_RECENT_LIST_LIMIT);

  if (error) {
    throw error;
  }

  return (data ?? []).map((activity) => ({
    caption: formatWords(activity.entity_type),
    href: "/admin",
    id: activity.id,
    meta: "Audit log",
    statusLabel: "Activity",
    statusTone: "neutral",
    timestamp: activity.created_at,
    title: formatWords(activity.action),
    type: "activity",
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

async function getHomeClients(supabase: SupabaseClient<Database>): Promise<HomeClientRow[]> {
  const { data, error } = await supabase
    .from("clients")
    .select(
      "id, name, contact_name, contact_email, contact_phone, status, plan_type, hosting_ends_at, custom_frontend_status, custom_frontend_url, archived_at, cancelled_at, last_activity_at, updated_at",
    );

  if (error) {
    throw error;
  }

  return data ?? [];
}

async function getHomeEvents(supabase: SupabaseClient<Database>): Promise<HomeEventRow[]> {
  const { data, error } = await supabase
    .from("rsvp_events")
    .select(
      "id, client_id, title, event_type, event_date, event_slug, status, visibility, published_at, custom_frontend_enabled, custom_frontend_url, updated_at",
    );

  if (error) {
    throw error;
  }

  return data ?? [];
}

async function getHomePayments(supabase: SupabaseClient<Database>): Promise<HomePaymentRow[]> {
  const { data, error } = await supabase
    .from("payments")
    .select(
      "id, client_id, application_id, event_id, amount_due, amount_paid, currency, payment_status, plan_type, reference_number, paid_at, created_at, updated_at",
    );

  if (error) {
    throw error;
  }

  return data ?? [];
}

async function getHomeRefunds(supabase: SupabaseClient<Database>): Promise<HomeRefundRow[]> {
  const { data, error } = await supabase
    .from("payment_refunds")
    .select("id, client_id, payment_id");

  if (error) {
    throw error;
  }

  return data ?? [];
}

function buildAwaitingPaymentItems(clients: HomeClientRow[], payments: HomePaymentRow[]) {
  const paymentByClientId = selectLatestPaymentByClientId(payments);

  return clients
    .filter((client) => client.status === ACTIVE_CLIENT_STATUS)
    .filter((client) => {
      const payment = paymentByClientId.get(client.id);
      return !payment || payment.payment_status === PENDING_PAYMENT_STATUS;
    })
    .sort((left, right) => compareAscending(left.updated_at, right.updated_at))
    .slice(0, ADMIN_HOME_NEEDS_ATTENTION_LIMIT)
    .map((client) => ({
      href: `/admin/clients/${client.id}`,
      id: client.id,
      statusLabel: "Awaiting Payment",
      statusTone: "warning" as const,
      subtitle: `${formatPlanLabel(client.plan_type)} client · ${client.contact_email}`,
      title: client.name,
      type: "payment" as const,
      updatedAt: client.updated_at,
    }));
}

function buildEventPassedItems(clients: HomeClientRow[], events: HomeEventRow[]) {
  const clientById = new Map(clients.map((client) => [client.id, client]));
  const todayInManila = getTodayDateInManila();

  return events
    .filter((event) => event.event_date && event.event_date < todayInManila)
    .map((event) => ({ client: clientById.get(event.client_id), event }))
    .filter(({ client }) => client && client.status !== "archived" && client.status !== "cancelled")
    .sort((left, right) =>
      compareAscending(
        left.event.event_date ?? left.event.updated_at,
        right.event.event_date ?? right.event.updated_at,
      ),
    )
    .slice(0, ADMIN_HOME_NEEDS_ATTENTION_LIMIT)
    .map(({ client, event }) => ({
      href: client ? `/admin/clients/${client.id}` : "/admin/clients",
      id: event.id,
      statusLabel: "Event Passed",
      statusTone: "warning" as const,
      subtitle: `${client?.name ?? "Client"} · ${formatDateOnly(event.event_date)}`,
      title: event.title || formatWords(event.event_type),
      type: "client" as const,
      updatedAt: event.event_date ? `${event.event_date}T00:00:00.000Z` : event.updated_at,
    }));
}

function buildCleanupEligibleItems(
  clients: HomeClientRow[],
  events: HomeEventRow[],
  payments: HomePaymentRow[],
  refunds: HomeRefundRow[],
) {
  const eventsByClientId = groupBy(events, (event) => event.client_id);
  const paymentsByClientId = groupBy(payments, (payment) => payment.client_id);
  const refundsByClientId = groupBy(refunds, (refund) => refund.client_id);

  return clients
    .map((client) => {
      const clientEvents = eventsByClientId.get(client.id) ?? [];
      const clientPayments = paymentsByClientId.get(client.id) ?? [];
      const clientRefunds = refundsByClientId.get(client.id) ?? [];
      const event = selectPrimaryHomeEvent(clientEvents);
      const payment = selectLatestPayment(clientPayments);
      const eligibility = deriveDeleteEligibility({
        archivedAt: client.archived_at,
        cancelledAt: client.cancelled_at,
        clientCustomFrontendStatus: client.custom_frontend_status,
        clientCustomFrontendUrl: client.custom_frontend_url,
        clientStatus: client.status,
        eventCustomFrontendEnabled: event?.custom_frontend_enabled ?? false,
        eventCustomFrontendUrl: event?.custom_frontend_url ?? null,
        eventDate: event?.event_date ?? null,
        eventPublishedAt: event?.published_at ?? null,
        eventStatus: event?.status ?? null,
        eventVisibility: event?.visibility ?? null,
        hasPaidNonRefundedPayment: clientPayments.some(
          (payment) => payment.payment_status === "paid",
        ),
        hasRefundedPaymentHistory:
          clientPayments.some((payment) => payment.payment_status === "refunded") ||
          clientRefunds.length > 0,
        hasUnpublishedSetupWork: clientEvents.some((event) =>
          ["setup_in_progress", "ready"].includes(event.status),
        ),
        hostingEndsAt: client.hosting_ends_at,
        lastActivityAt: client.last_activity_at ?? client.updated_at,
        latestPaymentStatus: payment?.payment_status ?? null,
        now: new Date(),
      });

      return { client, eligibility };
    })
    .filter(({ eligibility }) => eligibility.deleteEligible)
    .sort((left, right) => compareAscending(left.client.updated_at, right.client.updated_at))
    .slice(0, ADMIN_HOME_NEEDS_ATTENTION_LIMIT)
    .map(({ client, eligibility }) => ({
      href: `/admin/clients/${client.id}?status=cleanup_eligible`,
      id: client.id,
      statusLabel: "Cleanup Eligible",
      statusTone: "danger" as const,
      subtitle: `${client.contact_email} · ${formatDeleteReason(eligibility.reasonCode)}`,
      title: client.name,
      type: "client" as const,
      updatedAt: eligibility.deleteEligibleAt ?? client.updated_at,
    }));
}

function buildPaymentIssueItems(payments: HomePaymentRow[]) {
  return payments
    .filter((payment) => payment.payment_status === "failed")
    .sort((left, right) => compareAscending(left.updated_at, right.updated_at))
    .slice(0, ADMIN_HOME_NEEDS_ATTENTION_LIMIT)
    .map((payment) => ({
      href: payment.client_id ? `/admin/clients/${payment.client_id}` : "/admin/clients",
      id: payment.id,
      statusLabel: "Payment Issue",
      statusTone: "danger" as const,
      subtitle: `${formatCurrency(payment.amount_due)} · ${formatPlanLabel(payment.plan_type)}`,
      title: "Manual payment needs review",
      type: "payment" as const,
      updatedAt: payment.updated_at,
    }));
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
    href: buildApplicationSheetHref(application.id),
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

function buildRecentRecords(groups: AdminHomeRecentItem[][]) {
  return groups
    .flat()
    .sort((left, right) => compareDescending(left.timestamp, right.timestamp))
    .slice(0, 24);
}

function formatApplicationStatusLabel(status: string) {
  switch (status) {
    case "submitted":
      return "Pending";
    case "reviewing":
      return "Pending";
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

function formatClientStatusLabel(status: string) {
  switch (status) {
    case "active":
      return "Active";
    case "archived":
      return "Archived";
    case "cancelled":
      return "Cancelled";
    case "expired":
      return "Access Expired";
    case "paused":
      return "Paused";
    default:
      return formatWords(status);
  }
}

function formatPaymentStatusLabel(status: string) {
  switch (status) {
    case "paid":
      return "Paid";
    case "refunded":
      return "Refunded";
    case "cancelled":
      return "Cancelled";
    case "failed":
      return "Failed";
    case "pending":
    default:
      return "Pending";
  }
}

function formatDeleteReason(reasonCode: DeleteEligibilityReasonCode) {
  return formatWords(reasonCode);
}

function formatDateOnly(value: string | null) {
  if (!value) {
    return "No event date";
  }

  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeZone: "Asia/Manila",
  }).format(new Date(`${value}T00:00:00.000Z`));
}

function formatCurrency(value: number | null) {
  if (value === null) {
    return "—";
  }

  return new Intl.NumberFormat("en-PH", {
    currency: "PHP",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
    style: "currency",
  }).format(value);
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

function mapClientStatusTone(status: string): AdminHomeStatusTone {
  switch (status) {
    case "active":
      return "success";
    case "cancelled":
    case "expired":
      return "danger";
    case "archived":
    case "paused":
    default:
      return "neutral";
  }
}

function mapPaymentStatusTone(status: string): AdminHomeStatusTone {
  switch (status) {
    case "paid":
      return "success";
    case "failed":
      return "danger";
    case "pending":
      return "warning";
    case "cancelled":
    case "refunded":
    default:
      return "neutral";
  }
}

function selectLatestPaymentByClientId(payments: HomePaymentRow[]) {
  const grouped = groupBy(payments, (payment) => payment.client_id);
  const map = new Map<string, HomePaymentRow>();

  for (const [clientId, clientPayments] of grouped.entries()) {
    const payment = selectLatestPayment(clientPayments);

    if (payment) {
      map.set(clientId, payment);
    }
  }

  return map;
}

function selectLatestPayment(payments: HomePaymentRow[]) {
  return (
    [...payments].sort(
      (left, right) =>
        new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime() ||
        new Date(right.created_at).getTime() - new Date(left.created_at).getTime(),
    )[0] ?? null
  );
}

function selectPrimaryHomeEvent(events: HomeEventRow[]) {
  return (
    [...events].sort((left, right) => {
      if (left.status !== "archived" && right.status === "archived") {
        return -1;
      }

      if (left.status === "archived" && right.status !== "archived") {
        return 1;
      }

      return (
        compareNullableDateOnlyDesc(left.event_date, right.event_date) ||
        new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime()
      );
    })[0] ?? null
  );
}

function compareAscending(left: string, right: string) {
  return new Date(left).getTime() - new Date(right).getTime();
}

function compareDescending(left: string, right: string) {
  return new Date(right).getTime() - new Date(left).getTime();
}

function compareNeedsAttentionItems(left: AdminHomeQueueItem, right: AdminHomeQueueItem) {
  return (
    getNeedsAttentionPriority(right.statusLabel) - getNeedsAttentionPriority(left.statusLabel) ||
    compareDescending(left.updatedAt, right.updatedAt)
  );
}

function getNeedsAttentionPriority(statusLabel: string) {
  switch (statusLabel) {
    case "Refund Issue":
      return 5;
    case "Payment Issue":
      return 4;
    case "Awaiting Payment":
      return 3;
    case "Pending":
      return 2;
    case "Event Passed":
      return 1;
    case "Cleanup Eligible":
    default:
      return 0;
  }
}

function compareNullableDateOnlyDesc(left: string | null, right: string | null) {
  if (!left && !right) {
    return 0;
  }

  if (!left) {
    return 1;
  }

  if (!right) {
    return -1;
  }

  return right.localeCompare(left);
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

function buildApplicationSheetHref(applicationId: string) {
  return `/admin/applications?applicationId=${applicationId}`;
}

function getTodayDateInManila() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Manila",
    year: "numeric",
  });

  return formatter.format(new Date());
}

function formatWords(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function groupBy<T, K extends string | null>(values: T[], getKey: (value: T) => K) {
  const map = new Map<string, T[]>();

  for (const value of values) {
    const key = getKey(value);

    if (!key) {
      continue;
    }

    const current = map.get(key) ?? [];
    current.push(value);
    map.set(key, current);
  }

  return map;
}
