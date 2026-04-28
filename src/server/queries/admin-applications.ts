import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/lib/supabase/types";

export const APPLICATIONS_PAGE_SIZE = 20;

export const PARAM_STATUS = "status";
export const PARAM_PLAN = "plan";
export const PARAM_PAYMENT = "payment";
export const PARAM_SEARCH = "search";
export const PARAM_SUBMITTED_FROM = "submittedFrom";
export const PARAM_SUBMITTED_TO = "submittedTo";
export const PARAM_EVENT_FROM = "eventFrom";
export const PARAM_EVENT_TO = "eventTo";
export const PARAM_SORT = "sort";
export const PARAM_PAGE = "page";

export const APPLICATION_STATUS_VALUES = [
  "submitted",
  "reviewing",
  "approved",
  "rejected",
  "cancelled",
] as const;

export const APPLICATION_PLAN_VALUES = ["pro", "max"] as const;
export const APPLICATION_PAYMENT_VALUES = ["gcash", "maya"] as const;
export const APPLICATION_PAYMENT_FILTER_VALUES = ["gcash", "maya", "not_selected"] as const;
export const APPLICATION_SORT_VALUES = [
  "submitted_desc",
  "submitted_asc",
  "updated_desc",
  "event_date_asc",
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUS_VALUES)[number];
export type ApplicationStatusFilter = ApplicationStatus | "all";
export type ApplicationPlan = (typeof APPLICATION_PLAN_VALUES)[number];
export type ApplicationPlanFilter = ApplicationPlan | "all";
export type ApplicationPaymentPreference = (typeof APPLICATION_PAYMENT_VALUES)[number];
export type ApplicationPaymentFilter = (typeof APPLICATION_PAYMENT_FILTER_VALUES)[number] | "all";
export type ApplicationSort = (typeof APPLICATION_SORT_VALUES)[number];
export type ApplicationStatusTone = "warning" | "success" | "danger" | "neutral";

export type AdminApplicationsSearchParams = {
  eventFrom: string;
  eventTo: string;
  page: number;
  payment: ApplicationPaymentFilter;
  plan: ApplicationPlanFilter;
  search: string;
  sort: ApplicationSort;
  status: ApplicationStatusFilter;
  submittedFrom: string;
  submittedTo: string;
};

export type ApplicationListItem = {
  approvedAt: string | null;
  email: string;
  eventDate: string | null;
  eventLocation: string | null;
  eventType: string;
  fullName: string;
  href: string;
  id: string;
  linkedClientId: string | null;
  linkedEventId: string | null;
  paymentStatus: string | null;
  paymentStatusLabel: string | null;
  phone: string | null;
  preferredManualPaymentOption: string | null;
  preferredManualPaymentOptionLabel: string;
  preferredPlan: string;
  preferredPlanLabel: string;
  referenceCode: string;
  reviewedAt: string | null;
  status: string;
  statusLabel: string;
  statusTone: ApplicationStatusTone;
  submittedAt: string;
  updatedAt: string;
};

export type ApplicationStatusCounts = Record<ApplicationStatusFilter, number>;

export type ApplicationListResult = {
  counts: ApplicationStatusCounts;
  error?: string;
  generatedAt: string;
  items: ApplicationListItem[];
  page: number;
  pageCount: number;
  pageSize: number;
  total: number;
};

export type ApplicationActivityItem = {
  action: string;
  actionLabel: string;
  createdAt: string;
  id: string;
};

export type ApplicationDetailView = {
  activity: ApplicationActivityItem[];
  applicant: {
    email: string;
    fullName: string;
    phone: string | null;
  };
  event: {
    date: string | null;
    estimatedGuestCount: number | null;
    location: string | null;
    message: string | null;
    type: string;
  };
  id: string;
  linkedRecords: {
    clientId: string | null;
    clientName: string | null;
    clientStatus: string | null;
    eventId: string | null;
    eventStatus: string | null;
    eventTitle: string | null;
    paymentId: string | null;
    paymentStatus: string | null;
    paymentStatusLabel: string | null;
  };
  plan: {
    preferredManualPaymentOption: string | null;
    preferredManualPaymentOptionLabel: string;
    preferredPlan: string;
    preferredPlanLabel: string;
  };
  referenceCode: string;
  review: {
    approvedAt: string | null;
    internalNotes: string | null;
    rejectedAt: string | null;
    reviewedAt: string | null;
    status: string;
    statusLabel: string;
    statusTone: ApplicationStatusTone;
  };
  timestamps: {
    submittedAt: string;
    updatedAt: string;
  };
};

export type ApplicationDetailResult = {
  application: ApplicationDetailView | null;
  errors?: Partial<Record<"activity" | "application" | "linkedRecords", string>>;
  generatedAt: string;
  notFound?: boolean;
};

type SearchParamsInput = Record<string, string | string[] | undefined>;
type ApplicationRow = Tables<"rsvp_applications">;
type PaymentRow = Pick<Tables<"payments">, "application_id" | "id" | "payment_status">;
type ClientRow = Pick<Tables<"clients">, "id" | "name" | "status">;
type EventRow = Pick<Tables<"rsvp_events">, "id" | "status" | "title">;
type AuditRow = Pick<Tables<"audit_logs">, "action" | "created_at" | "id">;

const LIST_ERROR_MESSAGE = "Applications could not be loaded.";
const DETAIL_ERROR_MESSAGE = "Application could not be loaded.";
const LINKED_RECORDS_ERROR_MESSAGE = "Linked records could not be loaded.";
const ACTIVITY_ERROR_MESSAGE = "Activity could not be loaded.";
const ACTIVITY_PREVIEW_LIMIT = 5;
const MAX_SEARCH_LENGTH = 120;

const EMPTY_COUNTS: ApplicationStatusCounts = {
  all: 0,
  approved: 0,
  cancelled: 0,
  rejected: 0,
  reviewing: 0,
  submitted: 0,
};

const APPLICATION_LIST_COLUMNS =
  "id, reference_code, full_name, email, phone, event_type, event_date, event_location, preferred_plan, preferred_manual_payment_option, status, submitted_at, updated_at, reviewed_at, approved_at, approved_client_id, approved_event_id";

export async function getAdminApplications(
  params: AdminApplicationsSearchParams,
  supabase: SupabaseClient<Database>,
): Promise<ApplicationListResult> {
  const generatedAt = new Date().toISOString();

  try {
    const counts = await getStatusCounts(supabase);
    const total = await getFilteredApplicationCount(supabase, params);
    const pageCount = Math.max(1, Math.ceil(total / APPLICATIONS_PAGE_SIZE));
    const page = Math.min(params.page, pageCount);
    const from = (page - 1) * APPLICATIONS_PAGE_SIZE;
    const to = from + APPLICATIONS_PAGE_SIZE - 1;

    const applications = await getFilteredApplications(supabase, params, from, to);
    const paymentMap = await getPaymentMapForApplications(
      supabase,
      applications.map((application) => application.id),
    );

    return {
      counts,
      generatedAt,
      items: applications.map((application) =>
        toApplicationListItem(application, paymentMap.get(application.id) ?? null),
      ),
      page,
      pageCount,
      pageSize: APPLICATIONS_PAGE_SIZE,
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
      pageSize: APPLICATIONS_PAGE_SIZE,
      total: 0,
    };
  }
}

export async function getAdminApplicationDetail(
  id: string,
  supabase: SupabaseClient<Database>,
): Promise<ApplicationDetailResult> {
  const generatedAt = new Date().toISOString();
  const errors: Partial<Record<"activity" | "application" | "linkedRecords", string>> = {};

  try {
    const { data: application, error } = await supabase
      .from("rsvp_applications")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      return {
        application: null,
        errors: { application: DETAIL_ERROR_MESSAGE },
        generatedAt,
      };
    }

    if (!application) {
      return {
        application: null,
        generatedAt,
        notFound: true,
      };
    }

    const [paymentResult, clientResult, eventResult, activityResult] = await Promise.allSettled([
      getPaymentForApplication(supabase, application.id),
      getLinkedClient(supabase, application.approved_client_id),
      getLinkedEvent(supabase, application.approved_event_id),
      getApplicationActivity(supabase, application.id),
    ]);

    const payment = paymentResult.status === "fulfilled" ? paymentResult.value : null;
    const client = clientResult.status === "fulfilled" ? clientResult.value : null;
    const event = eventResult.status === "fulfilled" ? eventResult.value : null;
    const activity = activityResult.status === "fulfilled" ? activityResult.value : [];

    if (paymentResult.status === "rejected" || clientResult.status === "rejected") {
      errors.linkedRecords = LINKED_RECORDS_ERROR_MESSAGE;
    }

    if (eventResult.status === "rejected") {
      errors.linkedRecords = LINKED_RECORDS_ERROR_MESSAGE;
    }

    if (activityResult.status === "rejected") {
      errors.activity = ACTIVITY_ERROR_MESSAGE;
    }

    return {
      application: toApplicationDetailView(application, payment, client, event, activity),
      errors: Object.keys(errors).length > 0 ? errors : undefined,
      generatedAt,
    };
  } catch {
    return {
      application: null,
      errors: { application: DETAIL_ERROR_MESSAGE },
      generatedAt,
    };
  }
}

export function parseAdminApplicationsSearchParams(
  searchParams: SearchParamsInput,
): AdminApplicationsSearchParams {
  return {
    eventFrom: normalizeDateParam(getSingleParam(searchParams[PARAM_EVENT_FROM])),
    eventTo: normalizeDateParam(getSingleParam(searchParams[PARAM_EVENT_TO])),
    page: normalizePageParam(getSingleParam(searchParams[PARAM_PAGE])),
    payment: normalizePaymentParam(getSingleParam(searchParams[PARAM_PAYMENT])),
    plan: normalizePlanParam(getSingleParam(searchParams[PARAM_PLAN])),
    search: normalizeSearchParam(getSingleParam(searchParams[PARAM_SEARCH])),
    sort: normalizeSortParam(getSingleParam(searchParams[PARAM_SORT])),
    status: normalizeStatusParam(getSingleParam(searchParams[PARAM_STATUS])),
    submittedFrom: normalizeDateParam(getSingleParam(searchParams[PARAM_SUBMITTED_FROM])),
    submittedTo: normalizeDateParam(getSingleParam(searchParams[PARAM_SUBMITTED_TO])),
  };
}

async function getStatusCounts(
  supabase: SupabaseClient<Database>,
): Promise<ApplicationStatusCounts> {
  const [all, submitted, reviewing, approved, rejected, cancelled] = await Promise.all([
    countApplicationsByStatus(supabase),
    countApplicationsByStatus(supabase, "submitted"),
    countApplicationsByStatus(supabase, "reviewing"),
    countApplicationsByStatus(supabase, "approved"),
    countApplicationsByStatus(supabase, "rejected"),
    countApplicationsByStatus(supabase, "cancelled"),
  ]);

  return {
    all,
    approved,
    cancelled,
    rejected,
    reviewing,
    submitted,
  };
}

async function countApplicationsByStatus(
  supabase: SupabaseClient<Database>,
  status?: ApplicationStatus,
) {
  let query = supabase.from("rsvp_applications").select("id", { count: "exact", head: true });

  if (status) {
    query = query.eq("status", status);
  }

  const { count, error } = await query;

  if (error) {
    throw error;
  }

  return count ?? 0;
}

async function getFilteredApplicationCount(
  supabase: SupabaseClient<Database>,
  params: AdminApplicationsSearchParams,
) {
  let query = supabase.from("rsvp_applications").select("id", { count: "exact", head: true });

  if (params.status !== "all") {
    query = query.eq("status", params.status);
  }

  if (params.plan !== "all") {
    query = query.eq("preferred_plan", params.plan);
  }

  if (params.payment === "not_selected") {
    query = query.is("preferred_manual_payment_option", null);
  } else if (params.payment !== "all") {
    query = query.eq("preferred_manual_payment_option", params.payment);
  }

  if (params.search) {
    query = query.or(buildSearchFilter(params.search));
  }

  if (params.submittedFrom) {
    query = query.gte("submitted_at", startOfDate(params.submittedFrom));
  }

  if (params.submittedTo) {
    query = query.lt("submitted_at", dayAfter(params.submittedTo));
  }

  if (params.eventFrom) {
    query = query.gte("event_date", params.eventFrom);
  }

  if (params.eventTo) {
    query = query.lte("event_date", params.eventTo);
  }

  const { count, error } = await query;

  if (error) {
    throw error;
  }

  return count ?? 0;
}

async function getFilteredApplications(
  supabase: SupabaseClient<Database>,
  params: AdminApplicationsSearchParams,
  from: number,
  to: number,
) {
  let query = supabase.from("rsvp_applications").select(APPLICATION_LIST_COLUMNS).range(from, to);

  if (params.status !== "all") {
    query = query.eq("status", params.status);
  }

  if (params.plan !== "all") {
    query = query.eq("preferred_plan", params.plan);
  }

  if (params.payment === "not_selected") {
    query = query.is("preferred_manual_payment_option", null);
  } else if (params.payment !== "all") {
    query = query.eq("preferred_manual_payment_option", params.payment);
  }

  if (params.search) {
    query = query.or(buildSearchFilter(params.search));
  }

  if (params.submittedFrom) {
    query = query.gte("submitted_at", startOfDate(params.submittedFrom));
  }

  if (params.submittedTo) {
    query = query.lt("submitted_at", dayAfter(params.submittedTo));
  }

  if (params.eventFrom) {
    query = query.gte("event_date", params.eventFrom);
  }

  if (params.eventTo) {
    query = query.lte("event_date", params.eventTo);
  }

  switch (params.sort) {
    case "submitted_asc":
      query = query.order("submitted_at", { ascending: true });
      break;
    case "updated_desc":
      query = query.order("updated_at", { ascending: false });
      break;
    case "event_date_asc":
      query = query
        .order("event_date", { ascending: true, nullsFirst: false })
        .order("submitted_at", { ascending: false });
      break;
    case "submitted_desc":
    default:
      query = query.order("submitted_at", { ascending: false });
      break;
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data ?? [];
}

async function getPaymentMapForApplications(
  supabase: SupabaseClient<Database>,
  applicationIds: string[],
) {
  if (applicationIds.length === 0) {
    return new Map<string, PaymentRow>();
  }

  const { data, error } = await supabase
    .from("payments")
    .select("application_id, id, payment_status")
    .in("application_id", applicationIds);

  if (error) {
    throw error;
  }

  return new Map((data ?? []).map((payment) => [payment.application_id, payment]));
}

async function getPaymentForApplication(
  supabase: SupabaseClient<Database>,
  applicationId: string,
): Promise<PaymentRow | null> {
  const { data, error } = await supabase
    .from("payments")
    .select("application_id, id, payment_status")
    .eq("application_id", applicationId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

async function getLinkedClient(
  supabase: SupabaseClient<Database>,
  clientId: string | null,
): Promise<ClientRow | null> {
  if (!clientId) {
    return null;
  }

  const { data, error } = await supabase
    .from("clients")
    .select("id, name, status")
    .eq("id", clientId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

async function getLinkedEvent(
  supabase: SupabaseClient<Database>,
  eventId: string | null,
): Promise<EventRow | null> {
  if (!eventId) {
    return null;
  }

  const { data, error } = await supabase
    .from("rsvp_events")
    .select("id, title, status")
    .eq("id", eventId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

async function getApplicationActivity(
  supabase: SupabaseClient<Database>,
  applicationId: string,
): Promise<ApplicationActivityItem[]> {
  const { data, error } = await supabase
    .from("audit_logs")
    .select("id, action, created_at")
    .eq("entity_type", "rsvp_applications")
    .eq("entity_id", applicationId)
    .order("created_at", { ascending: false })
    .limit(ACTIVITY_PREVIEW_LIMIT);

  if (error) {
    throw error;
  }

  return (data ?? []).map(toActivityItem);
}

function toApplicationListItem(
  application: Pick<
    ApplicationRow,
    | "approved_at"
    | "approved_client_id"
    | "approved_event_id"
    | "email"
    | "event_date"
    | "event_location"
    | "event_type"
    | "full_name"
    | "id"
    | "phone"
    | "preferred_manual_payment_option"
    | "preferred_plan"
    | "reference_code"
    | "reviewed_at"
    | "status"
    | "submitted_at"
    | "updated_at"
  >,
  payment: PaymentRow | null,
): ApplicationListItem {
  return {
    approvedAt: application.approved_at,
    email: application.email,
    eventDate: application.event_date,
    eventLocation: application.event_location,
    eventType: formatEventTypeLabel(application.event_type),
    fullName: application.full_name,
    href: `/admin/applications/${application.id}`,
    id: application.id,
    linkedClientId: application.approved_client_id,
    linkedEventId: application.approved_event_id,
    paymentStatus: payment?.payment_status ?? null,
    paymentStatusLabel: payment ? formatPaymentStatusLabel(payment.payment_status) : null,
    phone: application.phone,
    preferredManualPaymentOption: application.preferred_manual_payment_option,
    preferredManualPaymentOptionLabel: formatPaymentPreferenceLabel(
      application.preferred_manual_payment_option,
    ),
    preferredPlan: application.preferred_plan,
    preferredPlanLabel: formatPlanLabel(application.preferred_plan),
    referenceCode: application.reference_code,
    reviewedAt: application.reviewed_at,
    status: application.status,
    statusLabel: formatApplicationStatusLabel(application.status),
    statusTone: mapApplicationStatusTone(application.status),
    submittedAt: application.submitted_at,
    updatedAt: application.updated_at,
  };
}

function toApplicationDetailView(
  application: ApplicationRow,
  payment: PaymentRow | null,
  client: ClientRow | null,
  event: EventRow | null,
  activity: ApplicationActivityItem[],
): ApplicationDetailView {
  return {
    activity,
    applicant: {
      email: application.email,
      fullName: application.full_name,
      phone: application.phone,
    },
    event: {
      date: application.event_date,
      estimatedGuestCount: application.estimated_guest_count,
      location: application.event_location,
      message: application.message,
      type: formatEventTypeLabel(application.event_type),
    },
    id: application.id,
    linkedRecords: {
      clientId: application.approved_client_id,
      clientName: client?.name ?? null,
      clientStatus: client?.status ?? null,
      eventId: application.approved_event_id,
      eventStatus: event?.status ?? null,
      eventTitle: event?.title ?? null,
      paymentId: payment?.id ?? null,
      paymentStatus: payment?.payment_status ?? null,
      paymentStatusLabel: payment ? formatPaymentStatusLabel(payment.payment_status) : null,
    },
    plan: {
      preferredManualPaymentOption: application.preferred_manual_payment_option,
      preferredManualPaymentOptionLabel: formatPaymentPreferenceLabel(
        application.preferred_manual_payment_option,
      ),
      preferredPlan: application.preferred_plan,
      preferredPlanLabel: formatPlanLabel(application.preferred_plan),
    },
    referenceCode: application.reference_code,
    review: {
      approvedAt: application.approved_at,
      internalNotes: application.review_notes,
      rejectedAt: application.rejected_at,
      reviewedAt: application.reviewed_at,
      status: application.status,
      statusLabel: formatApplicationStatusLabel(application.status),
      statusTone: mapApplicationStatusTone(application.status),
    },
    timestamps: {
      submittedAt: application.submitted_at,
      updatedAt: application.updated_at,
    },
  };
}

function toActivityItem(row: AuditRow): ApplicationActivityItem {
  return {
    action: row.action,
    actionLabel: formatAuditActionLabel(row.action),
    createdAt: row.created_at,
    id: row.id,
  };
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

export function mapApplicationStatusTone(status: string): ApplicationStatusTone {
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

export function formatPlanLabel(plan: string) {
  switch (plan) {
    case "pro":
      return "Pro";
    case "max":
      return "Max";
    default:
      return plan;
  }
}

export function formatPaymentPreferenceLabel(paymentPreference: string | null) {
  switch (paymentPreference) {
    case "gcash":
      return "GCash";
    case "maya":
      return "Maya";
    case null:
    case "":
      return "Not selected";
    default:
      return paymentPreference;
  }
}

export function formatPaymentStatusLabel(status: string) {
  switch (status) {
    case "pending":
      return "Pending";
    case "paid":
      return "Paid";
    case "failed":
      return "Failed";
    case "refunded":
      return "Refunded";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
}

function formatEventTypeLabel(eventType: string) {
  return eventType
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatAuditActionLabel(action: string) {
  return action
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildSearchFilter(search: string) {
  const term = search.replace(/[%,]/g, " ").trim();
  const value = `%${term}%`;

  return [
    `full_name.ilike.${value}`,
    `email.ilike.${value}`,
    `phone.ilike.${value}`,
    `event_type.ilike.${value}`,
    `event_location.ilike.${value}`,
  ].join(",");
}

function getSingleParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function normalizeStatusParam(value: string | undefined): ApplicationStatusFilter {
  if (value && APPLICATION_STATUS_VALUES.includes(value as ApplicationStatus)) {
    return value as ApplicationStatus;
  }

  return "all";
}

function normalizePlanParam(value: string | undefined): ApplicationPlanFilter {
  if (value && APPLICATION_PLAN_VALUES.includes(value as ApplicationPlan)) {
    return value as ApplicationPlan;
  }

  return "all";
}

function normalizePaymentParam(value: string | undefined): ApplicationPaymentFilter {
  if (
    value &&
    APPLICATION_PAYMENT_FILTER_VALUES.includes(
      value as (typeof APPLICATION_PAYMENT_FILTER_VALUES)[number],
    )
  ) {
    return value as (typeof APPLICATION_PAYMENT_FILTER_VALUES)[number];
  }

  return "all";
}

function normalizeSortParam(value: string | undefined): ApplicationSort {
  if (value && APPLICATION_SORT_VALUES.includes(value as ApplicationSort)) {
    return value as ApplicationSort;
  }

  return "submitted_desc";
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

function startOfDate(date: string) {
  return `${date}T00:00:00.000Z`;
}

function dayAfter(date: string) {
  const nextDate = new Date(`${date}T00:00:00.000Z`);
  nextDate.setUTCDate(nextDate.getUTCDate() + 1);
  return nextDate.toISOString();
}
