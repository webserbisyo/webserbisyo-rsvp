import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { getBestPublicRsvpUrl } from "@/lib/public-rsvp-url";
import type { Database, Tables } from "@/lib/supabase/types";
import {
  type ClientPaymentDisplayStatus,
  type DeleteEligibilityReasonCode,
  deriveClientPaymentStatus,
  deriveDeleteEligibility,
} from "@/server/services/admin-workflow/client-rules";

export const CLIENTS_PAGE_SIZE = 20;

export const PARAM_STATUS = "status";
export const PARAM_PLAN = "plan";
export const PARAM_PAYMENT = "payment";
export const PARAM_HOSTING = "hosting";
export const PARAM_EVENT = "event";
export const PARAM_SEARCH = "search";
export const PARAM_EVENT_FROM = "eventFrom";
export const PARAM_EVENT_TO = "eventTo";
export const PARAM_HOSTING_ENDS_FROM = "hostingEndsFrom";
export const PARAM_HOSTING_ENDS_TO = "hostingEndsTo";
export const PARAM_APPROVED_FROM = "approvedFrom";
export const PARAM_APPROVED_TO = "approvedTo";
export const PARAM_SORT = "sort";
export const PARAM_PAGE = "page";
export const CLIENT_EVENT_SOON_WINDOW_DAYS = 30;

export const CLIENT_STATUS_VALUES = [
  "active",
  "event_soon",
  "event_passed",
  "archived",
  "cleanup_eligible",
  "cancelled",
  "unknown",
] as const;

export const CLIENT_STATUS_TAB_VALUES = [
  "active",
  "event_soon",
  "event_passed",
  "archived",
  "cleanup_eligible",
] as const;

export const CLIENT_PLAN_VALUES = ["pro", "max"] as const;
export const CLIENT_PAYMENT_FILTER_VALUES = ["paid", "pending", "cancelled", "refunded"] as const;
export const CLIENT_HOSTING_FILTER_VALUES = ["active", "expired", "unknown"] as const;
export const CLIENT_EVENT_FILTER_VALUES = [
  "event_soon",
  "upcoming",
  "event_passed",
  "unknown",
] as const;
export const CLIENT_SORT_VALUES = [
  "updated_desc",
  "approved_desc",
  "event_date_asc",
  "access_ends_asc",
  "client_name_asc",
] as const;

export type ClientListStatus = (typeof CLIENT_STATUS_VALUES)[number];
export type ClientListStatusFilter = ClientListStatus | "all";
export type ClientPlan = (typeof CLIENT_PLAN_VALUES)[number];
export type ClientPlanFilter = ClientPlan | "all";
export type ClientPaymentStatus = ClientPaymentDisplayStatus;
export type ClientPaymentFilter = (typeof CLIENT_PAYMENT_FILTER_VALUES)[number] | "all";
export type ClientHostingLifecycle = (typeof CLIENT_HOSTING_FILTER_VALUES)[number];
export type ClientHostingFilter = ClientHostingLifecycle | "all";
export type ClientEventLifecycle = (typeof CLIENT_EVENT_FILTER_VALUES)[number];
export type ClientEventFilter = ClientEventLifecycle | "all";
export type ClientEventSetupStatus = "not_configured" | "published" | "setup_pending";
export type ClientSort = (typeof CLIENT_SORT_VALUES)[number];

export type AdminClientsSearchParams = {
  approvedFrom: string;
  approvedTo: string;
  event: ClientEventFilter;
  eventFrom: string;
  eventTo: string;
  hosting: ClientHostingFilter;
  hostingEndsFrom: string;
  hostingEndsTo: string;
  page: number;
  payment: ClientPaymentFilter;
  plan: ClientPlanFilter;
  search: string;
  sort: ClientSort;
  status: ClientListStatusFilter;
};

export type ClientListItem = {
  approvedApplicationId: string | null;
  approvedApplicationReferenceCode: string | null;
  approvedAt: string | null;
  clientName: string;
  clientStatus: string | null;
  clientStatusLabel: string;
  createdAt: string;
  deleteEligible: boolean;
  deleteEligibilityReasonCode: DeleteEligibilityReasonCode;
  deleteEligibilityReason: string;
  email: string;
  eventDate: string | null;
  eventId: string | null;
  eventLifecycle: ClientEventLifecycle;
  eventLifecycleLabel: string;
  eventSlug: string | null;
  eventStatus: string | null;
  eventTitle: string | null;
  eventTypeLabel: string | null;
  hostingEndsAt: string | null;
  hostingLifecycle: ClientHostingLifecycle;
  hostingLifecycleLabel: string;
  hostingStartsAt: string | null;
  href: string;
  id: string;
  paymentId: string | null;
  paymentMethod: string | null;
  paymentReferenceNumber: string | null;
  paymentStatus: ClientPaymentStatus;
  paymentStatusLabel: string;
  phone: string | null;
  plan: string | null;
  planLabel: string;
  renewalRequiredAt: string | null;
  status: ClientListStatus;
  statusLabel: string;
  updatedAt: string;
};

export type ClientStatusCounts = Record<ClientListStatusFilter, number>;

export type ClientListResult = {
  counts: ClientStatusCounts;
  error?: string;
  generatedAt: string;
  items: ClientListItem[];
  page: number;
  pageCount: number;
  pageSize: number;
  total: number;
};

export type ClientActivityItem = {
  action: string;
  actionLabel: string;
  createdAt: string;
  id: string;
  source: "audit" | "email";
};

export type ClientDetailView = {
  activity: ClientActivityItem[];
  application: {
    approvedAt: string | null;
    estimatedGuestCount: number | null;
    eventLocation: string | null;
    href: string | null;
    id: string | null;
    preferredPaymentMethod: string | null;
    referenceCode: string | null;
    status: string | null;
    statusLabel: string | null;
    submittedAt: string | null;
  };
  cleanup: {
    archiveEligible: boolean;
    deleteEligible: boolean;
    deleteEligibleAt: string | null;
    deleteEligibilityReasonCode: DeleteEligibilityReasonCode;
    deleteEligibilityReason: string;
    eventPassed: boolean;
    hostingExpired: boolean;
  };
  client: {
    archivedAt: string | null;
    cancelledAt: string | null;
    createdAt: string;
    customFrontendStatus: string | null;
    customFrontendStatusLabel: string;
    customFrontendUrl: string | null;
    email: string;
    name: string;
    phone: string | null;
    plan: string | null;
    planLabel: string;
    status: string | null;
    statusLabel: string;
    updatedAt: string;
  };
  event: {
    date: string | null;
    id: string | null;
    lifecycle: ClientEventLifecycle;
    lifecycleLabel: string;
    publicUrl: string | null;
    publicPreviewLabel: string;
    setupStatus: ClientEventSetupStatus;
    setupStatusLabel: string;
    guestCount: number | null;
    location: string | null;
    slug: string | null;
    status: string | null;
    statusLabel: string | null;
    title: string | null;
    type: string | null;
    visibility: string | null;
  };
  hosting: {
    endsAt: string | null;
    lifecycle: ClientHostingLifecycle;
    lifecycleLabel: string;
    renewalRequiredAt: string | null;
    startsAt: string | null;
  };
  id: string;
  onboarding: {
    emailStatus: string | null;
    lastEmailSentAt: string | null;
    ownerEmail: string | null;
    ownerName: string | null;
    ownerProfileId: string | null;
    profileRole: string | null;
  };
  payment: {
    amountDue: number | null;
    amountPaid: number | null;
    id: string | null;
    method: string | null;
    methodLabel: string;
    paidAt: string | null;
    referenceNumber: string | null;
    refund: {
      amount: number | null;
      confirmedAt: string | null;
      id: string | null;
      method: string | null;
      methodLabel: string;
      note: string | null;
      referenceNumber: string | null;
    } | null;
    status: ClientPaymentStatus;
    statusLabel: string;
  };
  status: {
    label: string;
    value: ClientListStatus;
  };
};

export type ClientDetailResult = {
  client: ClientDetailView | null;
  errors?: Partial<Record<"activity" | "application" | "event" | "onboarding" | "payment", string>>;
  generatedAt: string;
  notFound?: boolean;
};

type SearchParamsInput = Record<string, string | string[] | undefined>;
type ClientRow = Pick<
  Tables<"clients">,
  | "archived_at"
  | "cancelled_at"
  | "contact_email"
  | "contact_name"
  | "contact_phone"
  | "created_at"
  | "custom_frontend_status"
  | "custom_frontend_url"
  | "hosting_ends_at"
  | "hosting_starts_at"
  | "id"
  | "last_activity_at"
  | "name"
  | "plan_type"
  | "renewal_required_at"
  | "status"
  | "updated_at"
>;
type ApplicationRow = Pick<
  Tables<"rsvp_applications">,
  | "approved_at"
  | "approved_client_id"
  | "estimated_guest_count"
  | "event_location"
  | "id"
  | "preferred_manual_payment_option"
  | "reference_code"
  | "status"
  | "submitted_at"
  | "updated_at"
>;
type EventRow = Pick<
  Tables<"rsvp_events">,
  | "client_id"
  | "custom_frontend_enabled"
  | "custom_frontend_url"
  | "event_date"
  | "event_slug"
  | "event_type"
  | "id"
  | "max_guest_count"
  | "published_at"
  | "status"
  | "subdomain_slug"
  | "title"
  | "updated_at"
  | "venue_address"
  | "venue_name"
  | "visibility"
>;
type PaymentRow = Pick<
  Tables<"payments">,
  | "amount_due"
  | "amount_paid"
  | "application_id"
  | "client_id"
  | "created_at"
  | "hosting_ends_at"
  | "hosting_starts_at"
  | "id"
  | "paid_at"
  | "payment_method"
  | "payment_status"
  | "plan_type"
  | "reference_number"
  | "renewal_required_at"
  | "updated_at"
>;
type ProfileRow = Pick<
  Tables<"profiles">,
  "client_id" | "created_at" | "email" | "full_name" | "id" | "role" | "updated_at"
>;
type RefundRow = Pick<
  Tables<"payment_refunds">,
  | "amount"
  | "client_id"
  | "confirmed_at"
  | "created_at"
  | "id"
  | "method"
  | "payment_id"
  | "reason_note"
  | "reference_number"
>;
type EmailLogRow = Pick<
  Tables<"email_logs">,
  | "application_id"
  | "client_id"
  | "created_at"
  | "email_type"
  | "error_message"
  | "event_id"
  | "id"
  | "recipient_email"
  | "sent_at"
  | "status"
  | "updated_at"
>;
type AuditRow = Pick<
  Tables<"audit_logs">,
  "action" | "client_id" | "created_at" | "entity_id" | "entity_type" | "event_id" | "id"
>;

type ClientSnapshot = {
  application: ApplicationRow | null;
  client: ClientRow;
  event: EventRow | null;
  eventLifecycle: ClientEventLifecycle;
  hostingEndsAt: string | null;
  hostingLifecycle: ClientHostingLifecycle;
  hostingStartsAt: string | null;
  isCleanupEligible: boolean;
  payment: PaymentRow | null;
  refund: RefundRow | null;
  paymentStatus: ClientPaymentStatus;
  plan: string | null;
  renewalRequiredAt: string | null;
  status: ClientListStatus;
};

type EnrichedClientRecord = ClientSnapshot & {
  applications: ApplicationRow[];
  events: EventRow[];
  payments: PaymentRow[];
  refunds: RefundRow[];
};

const LIST_ERROR_MESSAGE = "Clients could not be loaded.";
const RELATED_APPLICATION_ERROR_MESSAGE = "Linked application could not be loaded.";
const EVENT_ERROR_MESSAGE = "Linked event could not be loaded.";
const PAYMENT_ERROR_MESSAGE = "Payment and access details could not be loaded.";
const ONBOARDING_ERROR_MESSAGE = "Onboarding records could not be loaded.";
const ACTIVITY_ERROR_MESSAGE = "Activity could not be loaded.";
const ACTIVITY_PREVIEW_LIMIT = 6;
const MAX_SEARCH_LENGTH = 120;

const EMPTY_COUNTS: ClientStatusCounts = {
  active: 0,
  all: 0,
  archived: 0,
  cancelled: 0,
  cleanup_eligible: 0,
  event_soon: 0,
  event_passed: 0,
  unknown: 0,
};

const CLIENT_COLUMNS =
  "id, name, contact_name, contact_email, contact_phone, status, plan_type, hosting_starts_at, hosting_ends_at, renewal_required_at, custom_frontend_status, custom_frontend_url, archived_at, cancelled_at, last_activity_at, created_at, updated_at";
const APPLICATION_COLUMNS =
  "id, approved_client_id, reference_code, status, submitted_at, approved_at, updated_at, event_location, estimated_guest_count, preferred_manual_payment_option";
const EVENT_COLUMNS =
  "id, client_id, title, event_type, event_date, event_slug, subdomain_slug, status, visibility, venue_name, venue_address, max_guest_count, published_at, custom_frontend_enabled, custom_frontend_url, updated_at";
const PAYMENT_COLUMNS =
  "id, client_id, application_id, plan_type, amount_due, amount_paid, payment_status, payment_method, reference_number, paid_at, hosting_starts_at, hosting_ends_at, renewal_required_at, created_at, updated_at";
const REFUND_COLUMNS =
  "id, client_id, payment_id, amount, method, reference_number, confirmed_at, reason_note, created_at";
const PROFILE_COLUMNS = "id, client_id, email, full_name, role, created_at, updated_at";
const EMAIL_LOG_COLUMNS =
  "id, client_id, application_id, event_id, recipient_email, email_type, status, error_message, sent_at, created_at, updated_at";
const AUDIT_COLUMNS = "id, client_id, event_id, entity_type, entity_id, action, created_at";

export async function getAdminClients(
  params: AdminClientsSearchParams,
  supabase: SupabaseClient<Database>,
): Promise<ClientListResult> {
  const generatedAt = new Date().toISOString();

  try {
    const clients = await getClients(supabase);
    const clientIds = clients.map((client) => client.id);
    const [applications, events, payments, refunds] = await Promise.all([
      getApprovedApplicationsForClients(supabase, clientIds),
      getEventsForClients(supabase, clientIds),
      getPaymentsForClients(supabase, clientIds),
      getRefundsForClients(supabase, clientIds),
    ]);

    const enriched = buildEnrichedClientRecords(clients, applications, events, payments, refunds);
    const counts = buildStatusCounts(enriched);
    const filtered = filterClientRecords(enriched, params);
    const sorted = sortClientRecords(filtered, params.sort);
    const total = sorted.length;
    const pageCount = Math.max(1, Math.ceil(total / CLIENTS_PAGE_SIZE));
    const page = Math.min(params.page, pageCount);
    const from = (page - 1) * CLIENTS_PAGE_SIZE;
    const items = sorted.slice(from, from + CLIENTS_PAGE_SIZE).map(toClientListItem);

    return {
      counts,
      generatedAt,
      items,
      page,
      pageCount,
      pageSize: CLIENTS_PAGE_SIZE,
      total,
    };
  } catch {
    return {
      counts: { ...EMPTY_COUNTS },
      error: LIST_ERROR_MESSAGE,
      generatedAt,
      items: [],
      page: Math.max(params.page, 1),
      pageCount: 1,
      pageSize: CLIENTS_PAGE_SIZE,
      total: 0,
    };
  }
}

export async function getAdminClientDetail(
  clientId: string,
  supabase: SupabaseClient<Database>,
): Promise<ClientDetailResult> {
  const generatedAt = new Date().toISOString();
  const errors: Partial<
    Record<"activity" | "application" | "event" | "onboarding" | "payment", string>
  > = {};

  try {
    const { data: client, error } = await supabase
      .from("clients")
      .select(CLIENT_COLUMNS)
      .eq("id", clientId)
      .maybeSingle();

    if (error) {
      return {
        client: null,
        generatedAt,
      };
    }

    if (!client) {
      return {
        client: null,
        generatedAt,
        notFound: true,
      };
    }

    const [
      applicationsResult,
      eventsResult,
      paymentsResult,
      refundsResult,
      profilesResult,
      emailsResult,
      auditResult,
    ] = await Promise.allSettled([
      getApprovedApplicationsForClients(supabase, [client.id]),
      getEventsForClients(supabase, [client.id]),
      getPaymentsForClients(supabase, [client.id]),
      getRefundsForClients(supabase, [client.id]),
      getProfilesForClients(supabase, [client.id]),
      getEmailLogsForClients(supabase, [client.id]),
      getAuditLogsForClients(supabase, [client.id]),
    ]);

    const applications = applicationsResult.status === "fulfilled" ? applicationsResult.value : [];
    const events = eventsResult.status === "fulfilled" ? eventsResult.value : [];
    const payments = paymentsResult.status === "fulfilled" ? paymentsResult.value : [];
    const refunds = refundsResult.status === "fulfilled" ? refundsResult.value : [];
    const profiles = profilesResult.status === "fulfilled" ? profilesResult.value : [];
    const emailLogs = emailsResult.status === "fulfilled" ? emailsResult.value : [];
    const auditLogs = auditResult.status === "fulfilled" ? auditResult.value : [];

    if (applicationsResult.status === "rejected") {
      errors.application = RELATED_APPLICATION_ERROR_MESSAGE;
    }

    if (eventsResult.status === "rejected") {
      errors.event = EVENT_ERROR_MESSAGE;
    }

    if (paymentsResult.status === "rejected") {
      errors.payment = PAYMENT_ERROR_MESSAGE;
    }

    if (refundsResult.status === "rejected") {
      errors.payment = PAYMENT_ERROR_MESSAGE;
    }

    if (profilesResult.status === "rejected" || emailsResult.status === "rejected") {
      errors.onboarding = ONBOARDING_ERROR_MESSAGE;
    }

    if (auditResult.status === "rejected") {
      errors.activity = ACTIVITY_ERROR_MESSAGE;
    }

    const snapshot = buildClientSnapshot(client, applications, events, payments, refunds);
    const ownerProfile = selectOwnerProfile(profiles);
    const onboardingEmail = selectLatestOnboardingEmail(emailLogs);
    const activity = selectActivityItems(auditLogs, emailLogs);

    return {
      client: toClientDetailView(snapshot, ownerProfile, onboardingEmail, activity),
      errors: Object.keys(errors).length > 0 ? errors : undefined,
      generatedAt,
    };
  } catch {
    return {
      client: null,
      generatedAt,
    };
  }
}

export function parseAdminClientsSearchParams(
  searchParams: SearchParamsInput,
): AdminClientsSearchParams {
  return {
    approvedFrom: normalizeDateParam(getSingleParam(searchParams[PARAM_APPROVED_FROM])),
    approvedTo: normalizeDateParam(getSingleParam(searchParams[PARAM_APPROVED_TO])),
    event: normalizeEventFilter(getSingleParam(searchParams[PARAM_EVENT])),
    eventFrom: normalizeDateParam(getSingleParam(searchParams[PARAM_EVENT_FROM])),
    eventTo: normalizeDateParam(getSingleParam(searchParams[PARAM_EVENT_TO])),
    hosting: normalizeHostingFilter(getSingleParam(searchParams[PARAM_HOSTING])),
    hostingEndsFrom: normalizeDateParam(getSingleParam(searchParams[PARAM_HOSTING_ENDS_FROM])),
    hostingEndsTo: normalizeDateParam(getSingleParam(searchParams[PARAM_HOSTING_ENDS_TO])),
    page: normalizePageParam(getSingleParam(searchParams[PARAM_PAGE])),
    payment: normalizePaymentFilter(getSingleParam(searchParams[PARAM_PAYMENT])),
    plan: normalizePlanParam(getSingleParam(searchParams[PARAM_PLAN])),
    search: normalizeSearchParam(getSingleParam(searchParams[PARAM_SEARCH])),
    sort: normalizeSortParam(getSingleParam(searchParams[PARAM_SORT])),
    status: normalizeStatusParam(getSingleParam(searchParams[PARAM_STATUS])),
  };
}

async function getClients(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from("clients")
    .select(CLIENT_COLUMNS)
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

async function getApprovedApplicationsForClients(
  supabase: SupabaseClient<Database>,
  clientIds: string[],
) {
  if (clientIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("rsvp_applications")
    .select(APPLICATION_COLUMNS)
    .in("approved_client_id", clientIds);

  if (error) {
    throw error;
  }

  return data ?? [];
}

async function getEventsForClients(supabase: SupabaseClient<Database>, clientIds: string[]) {
  if (clientIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("rsvp_events")
    .select(EVENT_COLUMNS)
    .in("client_id", clientIds);

  if (error) {
    throw error;
  }

  return data ?? [];
}

async function getPaymentsForClients(supabase: SupabaseClient<Database>, clientIds: string[]) {
  if (clientIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("payments")
    .select(PAYMENT_COLUMNS)
    .in("client_id", clientIds);

  if (error) {
    throw error;
  }

  return data ?? [];
}

async function getRefundsForClients(supabase: SupabaseClient<Database>, clientIds: string[]) {
  if (clientIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("payment_refunds")
    .select(REFUND_COLUMNS)
    .in("client_id", clientIds);

  if (error) {
    throw error;
  }

  return data ?? [];
}

async function getProfilesForClients(supabase: SupabaseClient<Database>, clientIds: string[]) {
  if (clientIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .in("client_id", clientIds);

  if (error) {
    throw error;
  }

  return data ?? [];
}

async function getEmailLogsForClients(supabase: SupabaseClient<Database>, clientIds: string[]) {
  if (clientIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("email_logs")
    .select(EMAIL_LOG_COLUMNS)
    .in("client_id", clientIds)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

async function getAuditLogsForClients(supabase: SupabaseClient<Database>, clientIds: string[]) {
  if (clientIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("audit_logs")
    .select(AUDIT_COLUMNS)
    .in("client_id", clientIds)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    throw error;
  }

  return data ?? [];
}

function buildEnrichedClientRecords(
  clients: ClientRow[],
  applications: ApplicationRow[],
  events: EventRow[],
  payments: PaymentRow[],
  refunds: RefundRow[],
) {
  const applicationsByClientId = groupBy(
    applications,
    (application) => application.approved_client_id,
  );
  const eventsByClientId = groupBy(events, (event) => event.client_id);
  const paymentsByClientId = groupBy(payments, (payment) => payment.client_id);
  const refundsByClientId = groupBy(refunds, (refund) => refund.client_id);

  return clients.map((client) => {
    const clientApplications = applicationsByClientId.get(client.id) ?? [];
    const clientEvents = eventsByClientId.get(client.id) ?? [];
    const clientPayments = paymentsByClientId.get(client.id) ?? [];
    const clientRefunds = refundsByClientId.get(client.id) ?? [];
    const snapshot = buildClientSnapshot(
      client,
      clientApplications,
      clientEvents,
      clientPayments,
      clientRefunds,
    );

    return {
      ...snapshot,
      applications: clientApplications,
      events: clientEvents,
      payments: clientPayments,
      refunds: clientRefunds,
    };
  });
}

function buildClientSnapshot(
  client: ClientRow,
  applications: ApplicationRow[],
  events: EventRow[],
  payments: PaymentRow[],
  refunds: RefundRow[],
): ClientSnapshot {
  const todayInManila = getTodayDateInManila();
  const now = new Date();
  const application = selectApprovedApplication(applications);
  const event = selectSummaryEvent(events, todayInManila);
  const payment = selectSummaryPayment(payments);
  const refund = selectLatestRefund(refunds, payment?.id ?? null);
  const hostingStartsAt = payment?.hosting_starts_at ?? client.hosting_starts_at;
  const hostingEndsAt = payment?.hosting_ends_at ?? client.hosting_ends_at;
  const renewalRequiredAt = payment?.renewal_required_at ?? client.renewal_required_at;
  const eventLifecycle = deriveEventLifecycle(event?.event_date ?? null, todayInManila);
  const hostingLifecycle = deriveHostingLifecycle(hostingEndsAt, renewalRequiredAt, now);
  const rawPaymentStatus =
    payment?.payment_status === "refunded" || refund?.id
      ? "refunded"
      : (payment?.payment_status ?? null);
  const paymentStatus = deriveClientPaymentStatus({
    clientCancelledAt: client.cancelled_at,
    clientStatus: client.status,
    paymentStatus: rawPaymentStatus,
  });
  const plan = client.plan_type ?? payment?.plan_type ?? null;
  const deleteEligibility = deriveDeleteEligibility({
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
    hasPaidNonRefundedPayment: payments.some((payment) => payment.payment_status === "paid"),
    hasRefundedPaymentHistory:
      payments.some((payment) => payment.payment_status === "refunded") || refunds.length > 0,
    hasUnpublishedSetupWork: events.some((event) =>
      ["setup_in_progress", "ready"].includes(event.status),
    ),
    hostingEndsAt,
    lastActivityAt: client.last_activity_at ?? client.updated_at,
    latestPaymentStatus: payment?.payment_status ?? null,
    now,
  });
  const status = deriveClientListStatus(
    client.status,
    eventLifecycle,
    deleteEligibility.deleteEligible,
  );

  return {
    application,
    client,
    event,
    eventLifecycle,
    hostingEndsAt,
    hostingLifecycle,
    hostingStartsAt,
    isCleanupEligible: deleteEligibility.deleteEligible,
    payment,
    refund,
    paymentStatus,
    plan,
    renewalRequiredAt,
    status,
  };
}

function buildStatusCounts(records: EnrichedClientRecord[]): ClientStatusCounts {
  const counts: ClientStatusCounts = {
    ...EMPTY_COUNTS,
    all: records.length,
  };

  for (const record of records) {
    for (const status of CLIENT_STATUS_VALUES) {
      if (matchesClientStatusFilter(record, status)) {
        counts[status] += 1;
      }
    }
  }

  return counts;
}

function filterClientRecords(records: EnrichedClientRecord[], params: AdminClientsSearchParams) {
  return records.filter((record) => matchesClientFilters(record, params));
}

function matchesClientFilters(record: EnrichedClientRecord, params: AdminClientsSearchParams) {
  const eventDate = record.event?.event_date ?? null;
  const approvedAt = record.application?.approved_at ?? null;

  if (params.status !== "all" && !matchesClientStatusFilter(record, params.status)) {
    return false;
  }

  if (params.plan !== "all" && record.plan !== params.plan) {
    return false;
  }

  if (params.payment !== "all" && !matchesPaymentFilter(record.paymentStatus, params.payment)) {
    return false;
  }

  if (params.hosting !== "all" && record.hostingLifecycle !== params.hosting) {
    return false;
  }

  if (params.event !== "all" && record.eventLifecycle !== params.event) {
    return false;
  }

  if (
    params.search &&
    !buildClientSearchBlob(record).includes(normalizeSearchValue(params.search))
  ) {
    return false;
  }

  if (params.eventFrom && compareDateOnly(eventDate, params.eventFrom) < 0) {
    return false;
  }

  if (params.eventTo && !eventDate) {
    return false;
  }

  if (params.eventTo && compareDateOnly(eventDate, params.eventTo) > 0) {
    return false;
  }

  if (
    params.hostingEndsFrom &&
    compareIsoDate(record.hostingEndsAt, startOfDate(params.hostingEndsFrom)) < 0
  ) {
    return false;
  }

  if (params.hostingEndsTo && !record.hostingEndsAt) {
    return false;
  }

  if (
    params.hostingEndsTo &&
    compareIsoDate(record.hostingEndsAt, dayAfter(params.hostingEndsTo)) >= 0
  ) {
    return false;
  }

  if (params.approvedFrom && compareIsoDate(approvedAt, startOfDate(params.approvedFrom)) < 0) {
    return false;
  }

  if (params.approvedTo && !approvedAt) {
    return false;
  }

  if (params.approvedTo && compareIsoDate(approvedAt, dayAfter(params.approvedTo)) >= 0) {
    return false;
  }

  return true;
}

function matchesClientStatusFilter(record: EnrichedClientRecord, status: ClientListStatus) {
  switch (status) {
    case "active":
      return record.client.status === "active";
    case "event_soon":
      return (
        record.eventLifecycle === "event_soon" &&
        !["archived", "cancelled"].includes(record.client.status ?? "")
      );
    case "event_passed":
      return record.eventLifecycle === "event_passed" && record.client.status !== "archived";
    case "archived":
      return record.client.status === "archived";
    case "cleanup_eligible":
      return record.isCleanupEligible;
    case "cancelled":
      return record.client.status === "cancelled";
    case "unknown":
      return record.status === "unknown";
    default:
      return false;
  }
}

function sortClientRecords(records: EnrichedClientRecord[], sort: ClientSort) {
  const next = [...records];

  next.sort((left, right) => {
    switch (sort) {
      case "approved_desc":
        return (
          compareNullableIsoDesc(
            left.application?.approved_at ?? null,
            right.application?.approved_at ?? null,
          ) || compareNullableIsoDesc(left.client.updated_at, right.client.updated_at)
        );
      case "event_date_asc":
        return (
          compareNullableDateOnlyAsc(
            left.event?.event_date ?? null,
            right.event?.event_date ?? null,
          ) || compareNullableIsoDesc(left.client.updated_at, right.client.updated_at)
        );
      case "access_ends_asc":
        return (
          compareNullableIsoAsc(left.hostingEndsAt, right.hostingEndsAt) ||
          compareNullableIsoDesc(left.client.updated_at, right.client.updated_at)
        );
      case "client_name_asc":
        return (
          left.client.name.localeCompare(right.client.name, "en", { sensitivity: "base" }) ||
          compareNullableIsoDesc(left.client.updated_at, right.client.updated_at)
        );
      case "updated_desc":
      default:
        return compareNullableIsoDesc(left.client.updated_at, right.client.updated_at);
    }
  });

  return next;
}

function toClientListItem(record: EnrichedClientRecord): ClientListItem {
  const deleteEligibility = deriveDeleteEligibility({
    archivedAt: record.client.archived_at,
    cancelledAt: record.client.cancelled_at,
    clientCustomFrontendStatus: record.client.custom_frontend_status,
    clientCustomFrontendUrl: record.client.custom_frontend_url,
    clientStatus: record.client.status,
    eventCustomFrontendEnabled: record.event?.custom_frontend_enabled ?? false,
    eventCustomFrontendUrl: record.event?.custom_frontend_url ?? null,
    eventDate: record.event?.event_date ?? null,
    eventPublishedAt: record.event?.published_at ?? null,
    eventStatus: record.event?.status ?? null,
    eventVisibility: record.event?.visibility ?? null,
    hasPaidNonRefundedPayment: record.payments.some((payment) => payment.payment_status === "paid"),
    hasRefundedPaymentHistory:
      record.payments.some((payment) => payment.payment_status === "refunded") ||
      record.refunds.length > 0,
    hasUnpublishedSetupWork: record.events.some((event) =>
      ["setup_in_progress", "ready"].includes(event.status),
    ),
    hostingEndsAt: record.hostingEndsAt,
    lastActivityAt: record.client.last_activity_at ?? record.client.updated_at,
    latestPaymentStatus: record.payment?.payment_status ?? null,
    now: new Date(),
  });

  return {
    approvedApplicationId: record.application?.id ?? null,
    approvedApplicationReferenceCode: record.application?.reference_code ?? null,
    approvedAt: record.application?.approved_at ?? null,
    clientName: record.client.name,
    clientStatus: record.client.status,
    clientStatusLabel: formatClientStoredStatusLabel(record.client.status),
    createdAt: record.client.created_at,
    deleteEligible: deleteEligibility.deleteEligible,
    deleteEligibilityReasonCode: deleteEligibility.reasonCode,
    deleteEligibilityReason: deleteEligibility.reason,
    email: record.client.contact_email,
    eventDate: record.event?.event_date ?? null,
    eventId: record.event?.id ?? null,
    eventLifecycle: record.eventLifecycle,
    eventLifecycleLabel: formatEventLifecycleLabel(record.eventLifecycle),
    eventSlug: record.event?.event_slug ?? null,
    eventStatus: record.event?.status ?? null,
    eventTitle: getEventDisplayTitle(record.event),
    eventTypeLabel: record.event?.event_type ? formatEventTypeLabel(record.event.event_type) : null,
    hostingEndsAt: record.hostingEndsAt,
    hostingLifecycle: record.hostingLifecycle,
    hostingLifecycleLabel: formatHostingLifecycleLabel(record.hostingLifecycle),
    hostingStartsAt: record.hostingStartsAt,
    href: `/admin/clients/${record.client.id}`,
    id: record.client.id,
    paymentId: record.payment?.id ?? null,
    paymentMethod: record.payment?.payment_method ?? null,
    paymentReferenceNumber: record.payment?.reference_number ?? null,
    paymentStatus: record.paymentStatus,
    paymentStatusLabel: formatPaymentStatusLabel(record.paymentStatus),
    phone: record.client.contact_phone,
    plan: record.plan,
    planLabel: formatPlanLabel(record.plan),
    renewalRequiredAt: record.renewalRequiredAt,
    status: record.status,
    statusLabel: formatClientListStatusLabel(record.status),
    updatedAt: record.client.updated_at,
  };
}

function toClientDetailView(
  snapshot: ClientSnapshot,
  ownerProfile: ProfileRow | null,
  onboardingEmail: EmailLogRow | null,
  activity: ClientActivityItem[],
): ClientDetailView {
  const paymentStatus = snapshot.paymentStatus;
  const applicationStatus = snapshot.application?.status ?? null;
  const eventSetupStatus = deriveEventSetupStatus(snapshot.event);
  const publicUrl = getPublishedEventPublicUrl(snapshot.event);
  const eventLocation = getEventLocation(snapshot.event, snapshot.application);
  const guestCount =
    snapshot.event?.max_guest_count ?? snapshot.application?.estimated_guest_count ?? null;
  const paymentMethod =
    snapshot.payment?.payment_method ??
    snapshot.application?.preferred_manual_payment_option ??
    null;
  const deleteEligibility = deriveDeleteEligibility({
    archivedAt: snapshot.client.archived_at,
    cancelledAt: snapshot.client.cancelled_at,
    clientCustomFrontendStatus: snapshot.client.custom_frontend_status,
    clientCustomFrontendUrl: snapshot.client.custom_frontend_url,
    clientStatus: snapshot.client.status,
    eventCustomFrontendEnabled: snapshot.event?.custom_frontend_enabled ?? false,
    eventCustomFrontendUrl: snapshot.event?.custom_frontend_url ?? null,
    eventDate: snapshot.event?.event_date ?? null,
    eventPublishedAt: snapshot.event?.published_at ?? null,
    eventStatus: snapshot.event?.status ?? null,
    eventVisibility: snapshot.event?.visibility ?? null,
    hasPaidNonRefundedPayment: snapshot.payment?.payment_status === "paid",
    hasRefundedPaymentHistory: paymentStatus === "refunded",
    hasUnpublishedSetupWork: ["setup_in_progress", "ready"].includes(snapshot.event?.status ?? ""),
    hostingEndsAt: snapshot.hostingEndsAt,
    lastActivityAt: snapshot.client.last_activity_at ?? snapshot.client.updated_at,
    latestPaymentStatus: snapshot.payment?.payment_status ?? null,
    now: new Date(),
  });

  return {
    activity,
    application: {
      approvedAt: snapshot.application?.approved_at ?? null,
      estimatedGuestCount: snapshot.application?.estimated_guest_count ?? null,
      eventLocation: snapshot.application?.event_location ?? null,
      href: snapshot.application ? `/admin/applications/${snapshot.application.id}` : null,
      id: snapshot.application?.id ?? null,
      preferredPaymentMethod: snapshot.application?.preferred_manual_payment_option ?? null,
      referenceCode: snapshot.application?.reference_code ?? null,
      status: applicationStatus,
      statusLabel: applicationStatus ? formatApplicationStatusLabel(applicationStatus) : null,
      submittedAt: snapshot.application?.submitted_at ?? null,
    },
    cleanup: {
      archiveEligible:
        snapshot.status !== "archived" &&
        (snapshot.eventLifecycle === "event_passed" || snapshot.hostingLifecycle === "expired"),
      deleteEligible: deleteEligibility.deleteEligible,
      deleteEligibleAt: deleteEligibility.deleteEligibleAt,
      deleteEligibilityReasonCode: deleteEligibility.reasonCode,
      deleteEligibilityReason: deleteEligibility.reason,
      eventPassed: snapshot.eventLifecycle === "event_passed",
      hostingExpired: snapshot.hostingLifecycle === "expired",
    },
    client: {
      archivedAt: snapshot.client.archived_at,
      cancelledAt: snapshot.client.cancelled_at,
      createdAt: snapshot.client.created_at,
      customFrontendStatus: snapshot.client.custom_frontend_status,
      customFrontendStatusLabel: formatFrontendStatusLabel(snapshot.client.custom_frontend_status),
      customFrontendUrl: snapshot.client.custom_frontend_url,
      email: snapshot.client.contact_email,
      name: snapshot.client.name,
      phone: snapshot.client.contact_phone,
      plan: snapshot.plan,
      planLabel: formatPlanLabel(snapshot.plan),
      status: snapshot.client.status,
      statusLabel: formatClientStoredStatusLabel(snapshot.client.status),
      updatedAt: snapshot.client.updated_at,
    },
    event: {
      date: snapshot.event?.event_date ?? null,
      id: snapshot.event?.id ?? null,
      lifecycle: snapshot.eventLifecycle,
      lifecycleLabel: formatEventLifecycleLabel(snapshot.eventLifecycle),
      publicUrl,
      publicPreviewLabel: formatPublicPreviewLabel(snapshot.event, publicUrl),
      setupStatus: eventSetupStatus,
      setupStatusLabel: formatEventSetupStatusLabel(eventSetupStatus),
      guestCount,
      location: eventLocation,
      slug: snapshot.event?.event_slug ?? null,
      status: snapshot.event?.status ?? null,
      statusLabel: snapshot.event?.status ? formatEventStatusLabel(snapshot.event.status) : null,
      title: getEventDisplayTitle(snapshot.event),
      type: snapshot.event?.event_type ? formatEventTypeLabel(snapshot.event.event_type) : null,
      visibility: snapshot.event?.visibility ?? null,
    },
    hosting: {
      endsAt: snapshot.hostingEndsAt,
      lifecycle: snapshot.hostingLifecycle,
      lifecycleLabel: formatHostingLifecycleLabel(snapshot.hostingLifecycle),
      renewalRequiredAt: snapshot.renewalRequiredAt,
      startsAt: snapshot.hostingStartsAt,
    },
    id: snapshot.client.id,
    onboarding: {
      emailStatus: onboardingEmail?.status ?? null,
      lastEmailSentAt: onboardingEmail?.sent_at ?? null,
      ownerEmail: ownerProfile?.email ?? onboardingEmail?.recipient_email ?? null,
      ownerName: ownerProfile?.full_name ?? null,
      ownerProfileId: ownerProfile?.id ?? null,
      profileRole: ownerProfile?.role ?? null,
    },
    payment: {
      amountDue: snapshot.payment?.amount_due ?? null,
      amountPaid: snapshot.payment?.amount_paid ?? null,
      id: snapshot.payment?.id ?? null,
      method: paymentMethod,
      methodLabel: formatPaymentMethodLabel(paymentMethod),
      paidAt: snapshot.payment?.paid_at ?? null,
      referenceNumber: snapshot.payment?.reference_number ?? null,
      refund: snapshot.refund
        ? {
            amount: snapshot.refund.amount,
            confirmedAt: snapshot.refund.confirmed_at,
            id: snapshot.refund.id,
            method: snapshot.refund.method,
            methodLabel: formatPaymentMethodLabel(snapshot.refund.method),
            note: snapshot.refund.reason_note,
            referenceNumber: snapshot.refund.reference_number,
          }
        : null,
      status: paymentStatus,
      statusLabel: formatPaymentStatusLabel(paymentStatus),
    },
    status: {
      label: formatClientListStatusLabel(snapshot.status),
      value: snapshot.status,
    },
  };
}

function selectApprovedApplication(applications: ApplicationRow[]) {
  return (
    [...applications].sort((left, right) => {
      return (
        compareNullableIsoDesc(left.approved_at, right.approved_at) ||
        compareNullableIsoDesc(left.updated_at, right.updated_at)
      );
    })[0] ?? null
  );
}

function selectSummaryEvent(events: EventRow[], todayInManila: string) {
  const upcoming = [...events]
    .filter(
      (event) =>
        event.status !== "archived" && event.event_date && event.event_date >= todayInManila,
    )
    .sort((left, right) => {
      return (
        compareNullableDateOnlyAsc(left.event_date, right.event_date) ||
        compareNullableIsoDesc(left.updated_at, right.updated_at)
      );
    });

  if (upcoming.length > 0) {
    return upcoming[0] ?? null;
  }

  return (
    [...events].sort((left, right) => {
      return (
        compareNullableDateOnlyDesc(left.event_date, right.event_date) ||
        compareNullableIsoDesc(left.updated_at, right.updated_at)
      );
    })[0] ?? null
  );
}

function selectSummaryPayment(payments: PaymentRow[]) {
  return (
    [...payments].sort((left, right) => {
      return (
        compareNullableIsoDesc(left.updated_at, right.updated_at) ||
        compareNullableIsoDesc(left.paid_at, right.paid_at) ||
        compareNullableIsoDesc(left.created_at, right.created_at)
      );
    })[0] ?? null
  );
}

function selectLatestRefund(refunds: RefundRow[], paymentId: string | null) {
  const candidates = paymentId
    ? refunds.filter((refund) => refund.payment_id === paymentId)
    : refunds;

  return (
    [...candidates].sort((left, right) => {
      return (
        compareNullableIsoDesc(left.confirmed_at, right.confirmed_at) ||
        compareNullableIsoDesc(left.created_at, right.created_at)
      );
    })[0] ?? null
  );
}

function selectOwnerProfile(profiles: ProfileRow[]) {
  return (
    [...profiles].sort((left, right) => {
      return (
        compareOwnerRole(left.role, right.role) ||
        compareNullableIsoDesc(left.updated_at, right.updated_at) ||
        compareNullableIsoDesc(left.created_at, right.created_at)
      );
    })[0] ?? null
  );
}

function selectLatestOnboardingEmail(emailLogs: EmailLogRow[]) {
  return (
    [...emailLogs]
      .filter((log) => log.email_type === "client_onboarding")
      .sort((left, right) => {
        return (
          compareNullableIsoDesc(left.sent_at, right.sent_at) ||
          compareNullableIsoDesc(left.updated_at, right.updated_at) ||
          compareNullableIsoDesc(left.created_at, right.created_at)
        );
      })[0] ?? null
  );
}

function selectActivityItems(auditLogs: AuditRow[], emailLogs: EmailLogRow[]) {
  const auditItems = auditLogs.map(toAuditActivityItem);
  const emailItems = emailLogs
    .filter((log) => log.email_type === "client_onboarding")
    .map(toEmailActivityItem);

  return [...auditItems, ...emailItems]
    .sort((left, right) => compareNullableIsoDesc(left.createdAt, right.createdAt))
    .slice(0, ACTIVITY_PREVIEW_LIMIT);
}

function toAuditActivityItem(log: AuditRow): ClientActivityItem {
  return {
    action: log.action,
    actionLabel: formatAuditActionLabel(log.action),
    createdAt: log.created_at,
    id: log.id,
    source: "audit",
  };
}

function toEmailActivityItem(log: EmailLogRow): ClientActivityItem {
  return {
    action: log.status,
    actionLabel: formatEmailActivityLabel(log.status),
    createdAt: log.sent_at ?? log.updated_at ?? log.created_at,
    id: log.id,
    source: "email",
  };
}

function buildClientSearchBlob(record: EnrichedClientRecord) {
  const values = [
    record.client.name,
    record.client.contact_name,
    record.client.contact_email,
    record.client.contact_phone,
    record.application?.reference_code ?? "",
    ...record.applications.map((application) => application.reference_code),
    ...record.events.flatMap((event) => [event.title, event.event_slug, event.event_type]),
  ];

  return normalizeSearchValue(values.filter(Boolean).join(" "));
}

function matchesPaymentFilter(status: ClientPaymentStatus, filter: ClientPaymentFilter) {
  return status === filter;
}

function deriveEventLifecycle(
  eventDate: string | null,
  todayInManila: string,
): ClientEventLifecycle {
  if (!eventDate) {
    return "unknown";
  }

  if (eventDate < todayInManila) {
    return "event_passed";
  }

  if (eventDate <= addDaysToDateOnly(todayInManila, CLIENT_EVENT_SOON_WINDOW_DAYS)) {
    return "event_soon";
  }

  return "upcoming";
}

function deriveHostingLifecycle(
  hostingEndsAt: string | null,
  renewalRequiredAt: string | null,
  now: Date,
): ClientHostingLifecycle {
  if (hostingEndsAt && new Date(hostingEndsAt).getTime() < now.getTime()) {
    return "expired";
  }

  if (hostingEndsAt || renewalRequiredAt) {
    return "active";
  }

  return "unknown";
}

function deriveClientListStatus(
  storedStatus: string | null,
  eventLifecycle: ClientEventLifecycle,
  isCleanupEligible: boolean,
): ClientListStatus {
  if (isCleanupEligible) {
    return "cleanup_eligible";
  }

  if (storedStatus === "cancelled") {
    return "cancelled";
  }

  if (storedStatus === "archived") {
    return "archived";
  }

  if (eventLifecycle === "event_soon") {
    return "event_soon";
  }

  if (eventLifecycle === "event_passed") {
    return "event_passed";
  }

  if (storedStatus === "active") {
    return "active";
  }

  return "unknown";
}

export function formatPlanLabel(plan: string | null) {
  switch (plan) {
    case "pro":
      return "Pro";
    case "max":
      return "Max";
    default:
      return "—";
  }
}

export function formatPaymentStatusLabel(status: string | null) {
  switch (status) {
    case "paid":
      return "Paid";
    case "refunded":
      return "Refunded";
    case "cancelled":
      return "Cancelled";
    case "pending":
    default:
      return "Pending";
  }
}

export function formatClientStoredStatusLabel(status: string | null) {
  switch (status) {
    case "active":
      return "Active";
    case "paused":
      return "Paused";
    case "expired":
      return "Access Expired";
    case "archived":
      return "Archived";
    case "cancelled":
      return "Cancelled";
    default:
      return "Active";
  }
}

export function formatClientListStatusLabel(status: ClientListStatus) {
  switch (status) {
    case "active":
      return "Active";
    case "event_soon":
      return "Event Soon";
    case "event_passed":
      return "Event Passed";
    case "archived":
      return "Archived";
    case "cleanup_eligible":
      return "Cleanup Eligible";
    case "cancelled":
      return "Cancelled";
    case "unknown":
    default:
      return "Active";
  }
}

export function formatEventLifecycleLabel(lifecycle: ClientEventLifecycle) {
  switch (lifecycle) {
    case "event_soon":
      return "Event Soon";
    case "upcoming":
      return "Upcoming";
    case "event_passed":
      return "Event Passed";
    case "unknown":
    default:
      return "No Event";
  }
}

export function formatHostingLifecycleLabel(lifecycle: ClientHostingLifecycle) {
  switch (lifecycle) {
    case "active":
      return "Access Active";
    case "expired":
      return "Access Expired";
    case "unknown":
    default:
      return "Not Configured";
  }
}

export function formatEventSetupStatusLabel(status: ClientEventSetupStatus) {
  switch (status) {
    case "published":
      return "Published";
    case "setup_pending":
      return "Setup Pending";
    case "not_configured":
    default:
      return "Not Configured";
  }
}

export function formatApplicationStatusLabel(status: string) {
  switch (status) {
    case "submitted":
      return "Pending Review";
    case "reviewing":
      return "In Review";
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

export function formatEventStatusLabel(status: string) {
  return formatWords(status);
}

export function formatFrontendStatusLabel(status: string | null) {
  switch (status) {
    case "not_started":
      return "Not configured";
    case "in_progress":
      return "In progress";
    case "connected":
      return "Connected";
    case "maintenance":
      return "Maintenance";
    case "disabled":
      return "Disabled";
    default:
      return "Not configured";
  }
}

function deriveEventSetupStatus(event: EventRow | null): ClientEventSetupStatus {
  if (!event) {
    return "not_configured";
  }

  if (getPublishedEventPublicUrl(event)) {
    return "published";
  }

  return "setup_pending";
}

function getPublishedEventPublicUrl(event: EventRow | null) {
  if (
    !event?.event_slug ||
    event.status !== "published" ||
    !event.published_at
  ) {
    return null;
  }

  return getBestPublicRsvpUrl({
    slug: event.event_slug,
    subdomain: event.subdomain_slug,
  });
}

function formatPublicPreviewLabel(event: EventRow | null, publicUrl: string | null) {
  if (publicUrl) {
    return "Published";
  }

  if (!event) {
    return "Not configured";
  }

  return "Not published yet";
}

function getEventLocation(event: EventRow | null, application: ApplicationRow | null) {
  const location = [event?.venue_name, event?.venue_address]
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(", ");

  return location || application?.event_location || null;
}

function formatPaymentMethodLabel(method: string | null) {
  switch (method) {
    case "gcash":
      return "GCash";
    case "maya":
      return "Maya";
    case "manual":
      return "Manual";
    default:
      return "Not selected";
  }
}

function formatEventTypeLabel(value: string) {
  return formatWords(value);
}

function formatAuditActionLabel(value: string) {
  return formatWords(value);
}

function formatEmailActivityLabel(status: string) {
  switch (status) {
    case "sent":
      return "Onboarding email sent";
    case "queued":
      return "Onboarding email queued";
    case "failed":
      return "Onboarding email failed";
    case "skipped":
      return "Onboarding email skipped";
    default:
      return `Onboarding email ${status}`;
  }
}

function formatWords(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getEventDisplayTitle(event: EventRow | null) {
  if (!event) {
    return null;
  }

  return event.title || formatEventTypeLabel(event.event_type);
}

function getSingleParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function normalizeStatusParam(value: string | undefined): ClientListStatusFilter {
  if (value && CLIENT_STATUS_VALUES.includes(value as ClientListStatus)) {
    return value as ClientListStatus;
  }

  return "all";
}

function normalizePlanParam(value: string | undefined): ClientPlanFilter {
  if (value && CLIENT_PLAN_VALUES.includes(value as ClientPlan)) {
    return value as ClientPlan;
  }

  return "all";
}

function normalizePaymentFilter(value: string | undefined): ClientPaymentFilter {
  if (
    value &&
    CLIENT_PAYMENT_FILTER_VALUES.includes(value as (typeof CLIENT_PAYMENT_FILTER_VALUES)[number])
  ) {
    return value as ClientPaymentFilter;
  }

  return "all";
}

function normalizeHostingFilter(value: string | undefined): ClientHostingFilter {
  if (
    value &&
    CLIENT_HOSTING_FILTER_VALUES.includes(value as (typeof CLIENT_HOSTING_FILTER_VALUES)[number])
  ) {
    return value as ClientHostingFilter;
  }

  return "all";
}

function normalizeEventFilter(value: string | undefined): ClientEventFilter {
  if (
    value &&
    CLIENT_EVENT_FILTER_VALUES.includes(value as (typeof CLIENT_EVENT_FILTER_VALUES)[number])
  ) {
    return value as ClientEventFilter;
  }

  return "all";
}

function normalizeSortParam(value: string | undefined): ClientSort {
  if (value === "hosting_ends_asc") {
    return "access_ends_asc";
  }

  if (value && CLIENT_SORT_VALUES.includes(value as ClientSort)) {
    return value as ClientSort;
  }

  return "updated_desc";
}

function normalizePageParam(value: string | undefined) {
  const page = Number.parseInt(value ?? "", 10);

  if (Number.isNaN(page) || page < 1) {
    return 1;
  }

  return page;
}

function normalizeSearchParam(value: string | undefined) {
  return (value ?? "").trim().slice(0, MAX_SEARCH_LENGTH);
}

function normalizeDateParam(value: string | undefined) {
  const trimmed = (value ?? "").trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return "";
  }

  return trimmed;
}

function normalizeSearchValue(value: string) {
  return value.toLowerCase().replaceAll(/\s+/g, " ").trim();
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

function compareOwnerRole(left: string, right: string) {
  return getOwnerRoleRank(left) - getOwnerRoleRank(right);
}

function getOwnerRoleRank(role: string) {
  switch (role) {
    case "client_owner":
      return 0;
    case "client_staff":
      return 1;
    default:
      return 2;
  }
}

function compareDateOnly(value: string | null, against: string) {
  if (!value) {
    return -1;
  }

  return value.localeCompare(against);
}

function compareIsoDate(value: string | null, against: string) {
  if (!value) {
    return -1;
  }

  return new Date(value).getTime() - new Date(against).getTime();
}

function compareNullableIsoDesc(left: string | null, right: string | null) {
  if (!left && !right) {
    return 0;
  }

  if (!left) {
    return 1;
  }

  if (!right) {
    return -1;
  }

  return new Date(right).getTime() - new Date(left).getTime();
}

function compareNullableIsoAsc(left: string | null, right: string | null) {
  if (!left && !right) {
    return 0;
  }

  if (!left) {
    return 1;
  }

  if (!right) {
    return -1;
  }

  return new Date(left).getTime() - new Date(right).getTime();
}

function compareNullableDateOnlyAsc(left: string | null, right: string | null) {
  if (!left && !right) {
    return 0;
  }

  if (!left) {
    return 1;
  }

  if (!right) {
    return -1;
  }

  return left.localeCompare(right);
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

function getTodayDateInManila() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Manila",
    year: "numeric",
  });

  return formatter.format(new Date());
}

function addDaysToDateOnly(date: string, days: number) {
  const nextDate = new Date(`${date}T00:00:00.000Z`);
  nextDate.setUTCDate(nextDate.getUTCDate() + days);
  return nextDate.toISOString().slice(0, 10);
}

function startOfDate(date: string) {
  return `${date}T00:00:00.000Z`;
}

function dayAfter(date: string) {
  const nextDate = new Date(`${date}T00:00:00.000Z`);
  nextDate.setUTCDate(nextDate.getUTCDate() + 1);
  return nextDate.toISOString();
}
