import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { FUNNEL_PLAN_VALUES, PAYMENT_STATUS_VALUES } from "@/lib/domain/funnel";
import type { Database, Tables } from "@/lib/supabase/types";

export const SALES_PAGE_SIZE = 20;

export const SALES_PARAM_PAGE = "page";
export const SALES_PARAM_PLAN = "plan";
export const SALES_PARAM_SORT = "sort";
export const SALES_PARAM_STATUS = "status";

export const SALES_PLAN_VALUES = FUNNEL_PLAN_VALUES;
export const SALES_STATUS_VALUES = PAYMENT_STATUS_VALUES;
export const SALES_SORT_VALUES = [
  "created_desc",
  "paid_desc",
  "amount_desc",
  "amount_asc",
] as const;

export type SalesPlan = (typeof SALES_PLAN_VALUES)[number];
export type SalesPlanFilter = SalesPlan | "all";
export type SalesStatus = (typeof SALES_STATUS_VALUES)[number];
export type SalesStatusFilter = SalesStatus | "all";
export type SalesSort = (typeof SALES_SORT_VALUES)[number];

export type AdminSalesSearchParams = {
  page: number;
  plan: SalesPlanFilter;
  sort: SalesSort;
  status: SalesStatusFilter;
};

export type SalesActivityItem = {
  action: string;
  actionLabel: string;
  createdAt: string;
  id: string;
};

export type SalesListItem = {
  activity: SalesActivityItem[];
  amountDue: number;
  amountPaid: number;
  application: {
    email: string | null;
    href: string | null;
    id: string;
    paymentPreferenceLabel: string;
    referenceCode: string | null;
    status: string | null;
    statusLabel: string | null;
    submittedAt: string | null;
    title: string;
  } | null;
  client: {
    email: string | null;
    href: string | null;
    id: string;
    name: string;
    status: string | null;
  } | null;
  createdAt: string;
  currency: string;
  event: {
    href: string | null;
    id: string;
    slug: string | null;
    status: string | null;
    title: string | null;
  } | null;
  hostingEndsAt: string | null;
  hostingStartsAt: string | null;
  id: string;
  notes: string | null;
  paidAt: string | null;
  paymentMethod: string | null;
  paymentStatus: string;
  paymentStatusLabel: string;
  planType: string;
  planTypeLabel: string;
  referenceNumber: string | null;
  renewalRequiredAt: string | null;
};

export type AdminSalesSummary = {
  confirmedPaymentsCount: number;
  maxConfirmedRevenue: number;
  pendingPayments: number;
  proConfirmedRevenue: number;
  totalConfirmedRevenue: number;
};

export type AdminSalesResult = {
  error?: string;
  generatedAt: string;
  items: SalesListItem[];
  page: number;
  pageCount: number;
  pageSize: number;
  summary: AdminSalesSummary;
  total: number;
};

type SearchParamsInput = Record<string, string | string[] | undefined>;
type PaymentRow = Tables<"payments">;
type ApplicationRow = Pick<
  Tables<"rsvp_applications">,
  | "email"
  | "full_name"
  | "id"
  | "preferred_manual_payment_option"
  | "reference_code"
  | "status"
  | "submitted_at"
>;
type ClientRow = Pick<Tables<"clients">, "contact_email" | "id" | "name" | "status">;
type EventRow = Pick<Tables<"rsvp_events">, "event_slug" | "id" | "status" | "title">;
type AuditRow = Pick<Tables<"audit_logs">, "action" | "created_at" | "entity_id" | "id">;

const SALES_ERROR_MESSAGE = "Sales data could not be loaded.";

const EMPTY_SUMMARY: AdminSalesSummary = {
  confirmedPaymentsCount: 0,
  maxConfirmedRevenue: 0,
  pendingPayments: 0,
  proConfirmedRevenue: 0,
  totalConfirmedRevenue: 0,
};

const PAYMENT_COLUMNS =
  "id, application_id, client_id, event_id, plan_type, amount_due, amount_paid, currency, payment_status, payment_method, reference_number, paid_at, confirmed_by, hosting_starts_at, hosting_ends_at, renewal_required_at, notes, created_at, updated_at";

export async function getAdminSales(
  params: AdminSalesSearchParams,
  supabase: SupabaseClient<Database>,
): Promise<AdminSalesResult> {
  const generatedAt = new Date().toISOString();

  try {
    const summary = await getAdminSalesSummary(supabase);
    const total = await countPayments(supabase, params);
    const pageCount = Math.max(1, Math.ceil(total / SALES_PAGE_SIZE));
    const page = Math.min(params.page, pageCount);
    const from = (page - 1) * SALES_PAGE_SIZE;
    const to = from + SALES_PAGE_SIZE - 1;
    const payments = await getPaymentsForPage(supabase, params, from, to);
    const paymentIds = payments.map((payment) => payment.id);
    const applicationIds = distinctStrings(payments.map((payment) => payment.application_id));
    const clientIds = distinctStrings(payments.map((payment) => payment.client_id));
    const eventIds = distinctStrings(payments.map((payment) => payment.event_id));

    const [applications, clients, events, activity] = await Promise.all([
      getApplicationsByIds(supabase, applicationIds),
      getClientsByIds(supabase, clientIds),
      getEventsByIds(supabase, eventIds),
      getActivityByPaymentIds(supabase, paymentIds),
    ]);

    const applicationMap = new Map(applications.map((row) => [row.id, row]));
    const clientMap = new Map(clients.map((row) => [row.id, row]));
    const eventMap = new Map(events.map((row) => [row.id, row]));
    const activityMap = groupBy(activity, (row) => row.entity_id);

    return {
      generatedAt,
      items: payments.map((payment) =>
        toSalesListItem(
          payment,
          applicationMap.get(payment.application_id) ?? null,
          payment.client_id ? (clientMap.get(payment.client_id) ?? null) : null,
          payment.event_id ? (eventMap.get(payment.event_id) ?? null) : null,
          (activityMap.get(payment.id) ?? []).slice(0, 5),
        ),
      ),
      page,
      pageCount,
      pageSize: SALES_PAGE_SIZE,
      summary,
      total,
    };
  } catch {
    return {
      error: SALES_ERROR_MESSAGE,
      generatedAt,
      items: [],
      page: Math.max(params.page, 1),
      pageCount: 1,
      pageSize: SALES_PAGE_SIZE,
      summary: { ...EMPTY_SUMMARY },
      total: 0,
    };
  }
}

export function parseAdminSalesSearchParams(
  searchParams: SearchParamsInput,
): AdminSalesSearchParams {
  return {
    page: normalizePage(getSingleParam(searchParams[SALES_PARAM_PAGE])),
    plan: normalizePlan(getSingleParam(searchParams[SALES_PARAM_PLAN])),
    sort: normalizeSort(getSingleParam(searchParams[SALES_PARAM_SORT])),
    status: normalizeStatus(getSingleParam(searchParams[SALES_PARAM_STATUS])),
  };
}

async function getAdminSalesSummary(
  supabase: SupabaseClient<Database>,
): Promise<AdminSalesSummary> {
  const { data, error } = await supabase
    .from("payments")
    .select("plan_type, payment_status, amount_paid");

  if (error) {
    throw error;
  }

  return (data ?? []).reduce<AdminSalesSummary>(
    (summary, row) => {
      if (row.payment_status === "paid") {
        summary.confirmedPaymentsCount += 1;
        summary.totalConfirmedRevenue += Number(row.amount_paid ?? 0);

        if (row.plan_type === "max") {
          summary.maxConfirmedRevenue += Number(row.amount_paid ?? 0);
        } else {
          summary.proConfirmedRevenue += Number(row.amount_paid ?? 0);
        }
      }

      if (row.payment_status === "pending") {
        summary.pendingPayments += 1;
      }

      return summary;
    },
    { ...EMPTY_SUMMARY },
  );
}

async function countPayments(supabase: SupabaseClient<Database>, params: AdminSalesSearchParams) {
  let query = supabase.from("payments").select("id", { count: "exact", head: true });

  if (params.plan !== "all") {
    query = query.eq("plan_type", params.plan);
  }

  if (params.status !== "all") {
    query = query.eq("payment_status", params.status);
  }

  const { count, error } = await query;

  if (error) {
    throw error;
  }

  return count ?? 0;
}

async function getPaymentsForPage(
  supabase: SupabaseClient<Database>,
  params: AdminSalesSearchParams,
  from: number,
  to: number,
) {
  let query = supabase.from("payments").select(PAYMENT_COLUMNS).range(from, to);

  if (params.plan !== "all") {
    query = query.eq("plan_type", params.plan);
  }

  if (params.status !== "all") {
    query = query.eq("payment_status", params.status);
  }

  switch (params.sort) {
    case "paid_desc":
      query = query
        .order("paid_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });
      break;
    case "amount_asc":
      query = query.order("amount_due", { ascending: true }).order("created_at", {
        ascending: false,
      });
      break;
    case "amount_desc":
      query = query.order("amount_due", { ascending: false }).order("created_at", {
        ascending: false,
      });
      break;
    case "created_desc":
    default:
      query = query.order("created_at", { ascending: false });
      break;
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data ?? [];
}

async function getApplicationsByIds(supabase: SupabaseClient<Database>, applicationIds: string[]) {
  if (applicationIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("rsvp_applications")
    .select(
      "id, full_name, email, preferred_manual_payment_option, reference_code, status, submitted_at",
    )
    .in("id", applicationIds);

  if (error) {
    throw error;
  }

  return data ?? [];
}

async function getClientsByIds(supabase: SupabaseClient<Database>, clientIds: string[]) {
  if (clientIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("clients")
    .select("id, name, contact_email, status")
    .in("id", clientIds);

  if (error) {
    throw error;
  }

  return data ?? [];
}

async function getEventsByIds(supabase: SupabaseClient<Database>, eventIds: string[]) {
  if (eventIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("rsvp_events")
    .select("id, title, event_slug, status")
    .in("id", eventIds);

  if (error) {
    throw error;
  }

  return data ?? [];
}

async function getActivityByPaymentIds(supabase: SupabaseClient<Database>, paymentIds: string[]) {
  if (paymentIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("audit_logs")
    .select("id, entity_id, action, created_at")
    .eq("entity_type", "payments")
    .in("entity_id", paymentIds)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

function toSalesListItem(
  payment: PaymentRow,
  application: ApplicationRow | null,
  client: ClientRow | null,
  event: EventRow | null,
  activityRows: AuditRow[],
): SalesListItem {
  return {
    activity: activityRows.map((row) => ({
      action: row.action,
      actionLabel: formatWords(row.action),
      createdAt: row.created_at,
      id: row.id,
    })),
    amountDue: payment.amount_due,
    amountPaid: payment.amount_paid,
    application: application
      ? {
          email: application.email,
          href: `/admin/applications/${application.id}`,
          id: application.id,
          paymentPreferenceLabel: formatPaymentPreferenceLabel(
            application.preferred_manual_payment_option,
          ),
          referenceCode: application.reference_code,
          status: application.status,
          statusLabel: application.status ? formatApplicationStatusLabel(application.status) : null,
          submittedAt: application.submitted_at,
          title: application.full_name,
        }
      : null,
    client: client
      ? {
          email: client.contact_email,
          href: `/admin/clients/${client.id}`,
          id: client.id,
          name: client.name,
          status: client.status,
        }
      : null,
    createdAt: payment.created_at,
    currency: payment.currency,
    event: event
      ? {
          href: event.event_slug ? `/r/${event.event_slug}` : null,
          id: event.id,
          slug: event.event_slug,
          status: event.status,
          title: event.title,
        }
      : null,
    hostingEndsAt: payment.hosting_ends_at,
    hostingStartsAt: payment.hosting_starts_at,
    id: payment.id,
    notes: payment.notes,
    paidAt: payment.paid_at,
    paymentMethod: payment.payment_method,
    paymentStatus: payment.payment_status,
    paymentStatusLabel: formatPaymentStatusLabel(payment.payment_status),
    planType: payment.plan_type,
    planTypeLabel: formatPlanLabel(payment.plan_type),
    referenceNumber: payment.reference_number,
    renewalRequiredAt: payment.renewal_required_at,
  };
}

function normalizePage(value: string | undefined) {
  const page = Number.parseInt(value ?? "", 10);

  if (Number.isNaN(page) || page < 1) {
    return 1;
  }

  return page;
}

function normalizePlan(value: string | undefined): SalesPlanFilter {
  if (value && SALES_PLAN_VALUES.includes(value as SalesPlan)) {
    return value as SalesPlan;
  }

  return "all";
}

function normalizeStatus(value: string | undefined): SalesStatusFilter {
  if (value && SALES_STATUS_VALUES.includes(value as SalesStatus)) {
    return value as SalesStatus;
  }

  return "all";
}

function normalizeSort(value: string | undefined): SalesSort {
  if (value && SALES_SORT_VALUES.includes(value as SalesSort)) {
    return value as SalesSort;
  }

  return "created_desc";
}

function getSingleParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function distinctStrings(values: Array<string | null>) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

function groupBy<TValue>(
  rows: TValue[],
  getKey: (row: TValue) => string | null,
): Map<string, TValue[]> {
  const map = new Map<string, TValue[]>();

  for (const row of rows) {
    const key = getKey(row);

    if (!key) {
      continue;
    }

    map.set(key, [...(map.get(key) ?? []), row]);
  }

  return map;
}

function formatPlanLabel(planType: string) {
  return planType === "max" ? "Max" : "Pro";
}

function formatPaymentPreferenceLabel(value: string | null) {
  switch (value) {
    case "gcash":
      return "GCash";
    case "maya":
      return "Maya";
    default:
      return "Not selected";
  }
}

function formatPaymentStatusLabel(status: string) {
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

function formatApplicationStatusLabel(status: string) {
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

function formatWords(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
