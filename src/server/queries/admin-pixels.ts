import "server-only";

import { getMetaCapiRuntimeConfig } from "@/lib/meta/capi-config";
import { requireAdmin } from "@/lib/permissions";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type AdminMetaPixelScope =
  | "application"
  | "disabled"
  | "event"
  | "event_page"
  | "global_public"
  | "rsvp_submit";

export type AdminMetaPixelItem = {
  createdAt: string;
  eventId: string | null;
  eventLabel: string | null;
  id: string;
  isActive: boolean;
  maskedPixelId: string;
  name: string;
  notes: string | null;
  pixelId: string;
  trackingScope: AdminMetaPixelScope;
  trackingScopeLabel: string;
  updatedAt: string;
};

export type AdminMetaPixelEventOption = {
  id: string;
  label: string;
};

export type AdminMetaConversionItem = {
  amount: number;
  capiDetail: string;
  capiStatus: "failed" | "not_configured" | "pending" | "sent" | "skipped" | "unknown";
  capiStatusLabel: string;
  clientName: string;
  confirmedAt: string;
  eventLabel: string;
  href: string;
  id: string;
  packageLabel: string;
  paymentMethodLabel: string;
  paymentStatusLabel: string;
};

export type AdminMetaPixelsCapiSummary = {
  configurationWarnings: string[];
  hasAccessToken: boolean;
  hasEligiblePixelSource: boolean;
  isReady: boolean;
  purchaseEnabled: boolean;
};

export type AdminMetaPixelsResult = {
  capi: AdminMetaPixelsCapiSummary;
  eventOptions: AdminMetaPixelEventOption[];
  generatedAt: string;
  paidConversions: AdminMetaConversionItem[];
  pixels: AdminMetaPixelItem[];
};

export async function getAdminPixels(): Promise<AdminMetaPixelsResult> {
  await requireAdmin();
  const supabase = await createServerSupabaseClient();
  const [pixelsResult, eventsResult, paymentsResult, clientsResult, auditLogsResult, deliveriesResult] =
    await Promise.all([
      supabase
        .from("meta_pixels")
        .select(
          "id, event_id, name, notes, pixel_id, is_active, tracking_scope, created_at, updated_at",
        )
        .order("created_at", { ascending: false }),
      supabase
        .from("rsvp_events")
        .select("id, title, event_slug, event_date")
        .order("event_date", { ascending: false }),
      supabase
        .from("payments")
        .select(
          "id, client_id, event_id, amount_paid, payment_method, payment_status, plan_type, paid_at, updated_at",
        )
        .eq("payment_status", "paid")
        .order("paid_at", { ascending: false, nullsFirst: false })
        .order("updated_at", { ascending: false })
        .limit(20),
      supabase.from("clients").select("id, name"),
      supabase
        .from("audit_logs")
        .select("action, entity_id, created_at")
        .in("action", [
          "meta_capi_purchase_failed",
          "meta_capi_purchase_sent",
          "meta_capi_purchase_skipped",
        ])
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("meta_capi_deliveries")
        .select("entity_id, status, last_attempt_at, sent_at, updated_at")
        .eq("entity_type", "payments")
        .eq("event_name", "Purchase")
        .eq("provider", "meta")
        .order("updated_at", { ascending: false })
        .limit(100),
    ]);

  if (pixelsResult.error) {
    throw pixelsResult.error;
  }

  if (eventsResult.error) {
    throw eventsResult.error;
  }

  if (paymentsResult.error) {
    throw paymentsResult.error;
  }

  if (clientsResult.error) {
    throw clientsResult.error;
  }

  if (auditLogsResult.error) {
    throw auditLogsResult.error;
  }

  if (deliveriesResult.error) {
    throw deliveriesResult.error;
  }

  const eventOptions = (eventsResult.data ?? []).map((event) => ({
    id: event.id,
    label: buildEventLabel(event),
  }));
  const eventLabelById = new Map(eventOptions.map((event) => [event.id, event.label]));
  const clientNameById = new Map(
    (clientsResult.data ?? []).map((client) => [client.id, client.name]),
  );
  const latestCapiAuditByPaymentId = new Map<
    string,
    { action: string; created_at: string; entity_id: string }
  >();

  for (const log of auditLogsResult.data ?? []) {
    if (!log.entity_id) {
      continue;
    }

    if (!latestCapiAuditByPaymentId.has(log.entity_id)) {
      latestCapiAuditByPaymentId.set(log.entity_id, {
        action: log.action,
        created_at: log.created_at,
        entity_id: log.entity_id,
      });
    }
  }
  const latestDeliveryByPaymentId = new Map<
    string,
    { last_attempt_at: string | null; sent_at: string | null; status: string; updated_at: string }
  >();

  for (const delivery of deliveriesResult.data ?? []) {
    if (!delivery.entity_id || latestDeliveryByPaymentId.has(delivery.entity_id)) {
      continue;
    }

    latestDeliveryByPaymentId.set(delivery.entity_id, delivery);
  }
  const pixels = (pixelsResult.data ?? []).map((pixel) => ({
    createdAt: pixel.created_at,
    eventId: pixel.event_id,
    eventLabel: pixel.event_id ? (eventLabelById.get(pixel.event_id) ?? null) : null,
    id: pixel.id,
    isActive: pixel.is_active,
    maskedPixelId: maskPixelId(pixel.pixel_id),
    name: pixel.name,
    notes: pixel.notes,
    pixelId: pixel.pixel_id,
    trackingScope: normalizeScope(pixel.tracking_scope),
    trackingScopeLabel: formatScopeLabel(pixel.tracking_scope),
    updatedAt: pixel.updated_at,
  }));
  const capi = getCapiSummary(pixelsResult.data ?? []);

  return {
    capi,
    eventOptions,
    generatedAt: new Date().toISOString(),
    paidConversions: (paymentsResult.data ?? []).map((payment) => {
      const capiAudit = latestCapiAuditByPaymentId.get(payment.id);
      const delivery = latestDeliveryByPaymentId.get(payment.id);
      const capiStatus = getCapiStatus(delivery?.status ?? null, capiAudit?.action ?? null, capi.isReady);
      const statusTimestamp =
        delivery?.sent_at ?? delivery?.last_attempt_at ?? delivery?.updated_at ?? capiAudit?.created_at ?? null;

      return {
        amount: Number(payment.amount_paid ?? 0),
        capiDetail: getCapiDetail(capiStatus, statusTimestamp),
        capiStatus,
        capiStatusLabel: formatCapiStatusLabel(capiStatus),
        clientName: clientNameById.get(payment.client_id ?? "") ?? "Client record",
        confirmedAt: payment.paid_at ?? payment.updated_at,
        eventLabel: payment.event_id
          ? (eventLabelById.get(payment.event_id) ?? "Event record")
          : "No event linked",
        href: payment.client_id ? `/admin/clients/${payment.client_id}` : "/admin/clients",
        id: payment.id,
        packageLabel: formatPlanLabel(payment.plan_type),
        paymentMethodLabel: formatPaymentMethodLabel(payment.payment_method),
        paymentStatusLabel: formatPaymentStatusLabel(payment.payment_status),
      };
    }),
    pixels,
  };
}

function normalizeScope(scope: string): AdminMetaPixelScope {
  switch (scope) {
    case "application":
    case "disabled":
    case "event":
    case "event_page":
    case "global_public":
    case "rsvp_submit":
      return scope;
    default:
      return "global_public";
  }
}

function formatScopeLabel(scope: string) {
  switch (scope) {
    case "global_public":
      return "Global / All public pages";
    case "application":
      return "Application page";
    case "event_page":
      return "RSVP event page";
    case "rsvp_submit":
      return "RSVP submitted / thank-you";
    case "event":
      return "Event-level";
    case "disabled":
      return "Disabled / draft";
    default:
      return "Global / All public pages";
  }
}

function maskPixelId(pixelId: string) {
  return `${"*".repeat(Math.max(0, pixelId.length - 4))}${pixelId.slice(-4)}`;
}

function buildEventLabel(event: { event_date: string | null; event_slug: string; title: string }) {
  const suffix = event.event_date ? ` · ${event.event_date}` : "";
  return `${event.title || event.event_slug}${suffix}`;
}

function formatPlanLabel(plan: string | null) {
  switch (plan) {
    case "pro":
      return "Pro";
    case "max":
      return "Max";
    default:
      return "Unknown package";
  }
}

function formatPaymentMethodLabel(method: string | null) {
  switch (method) {
    case "gcash":
      return "GCash";
    case "maya":
      return "Maya";
    default:
      return "Manual payment";
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
    default:
      return "Pending";
  }
}

function getCapiSummary(
  pixels: Array<{ is_active: boolean; tracking_scope: string }>,
): AdminMetaPixelsCapiSummary {
  const config = getMetaCapiRuntimeConfig();
  const hasAccessToken = Boolean(config.accessToken);
  const hasEligiblePixelSource =
    Boolean(process.env.META_PIXEL_ID) ||
    pixels.some(
      (pixel) =>
        pixel.is_active &&
        ["application", "global_public"].includes(pixel.tracking_scope),
    );

  return {
    configurationWarnings: config.warnings,
    hasAccessToken,
    hasEligiblePixelSource,
    isReady: hasAccessToken && hasEligiblePixelSource && config.purchaseEnabled,
    purchaseEnabled: config.purchaseEnabled,
  };
}

function getCapiStatus(
  deliveryStatus: string | null,
  action: string | null,
  isCapiReady: boolean,
): AdminMetaConversionItem["capiStatus"] {
  switch (deliveryStatus) {
    case "sent":
      return "sent";
    case "failed":
      return "failed";
    case "pending":
    case "sending":
      return "pending";
  }

  switch (action) {
    case "meta_capi_purchase_sent":
      return "sent";
    case "meta_capi_purchase_failed":
      return "failed";
    case "meta_capi_purchase_skipped":
      return "skipped";
    default:
      return isCapiReady ? "unknown" : "not_configured";
  }
}

function formatCapiStatusLabel(status: AdminMetaConversionItem["capiStatus"]) {
  switch (status) {
    case "sent":
      return "Sent";
    case "failed":
      return "Failed";
    case "pending":
      return "In progress";
    case "skipped":
      return "Not sent";
    case "not_configured":
      return "Not configured";
    case "unknown":
    default:
      return "No delivery log";
  }
}

function getCapiDetail(status: AdminMetaConversionItem["capiStatus"], createdAt: string | null) {
  switch (status) {
    case "sent":
      return createdAt ? `Logged ${createdAt}` : "Delivery logged in audit trail.";
    case "failed":
      return createdAt ? `Failed ${createdAt}` : "Latest server-side send failed.";
    case "pending":
      return createdAt ? `Claimed ${createdAt}` : "Delivery is currently claimed by the server.";
    case "skipped":
      return createdAt ? `Skipped ${createdAt}` : "Server-side send was skipped.";
    case "not_configured":
      return "Server-side Purchase is not configured for new paid confirmations.";
    case "unknown":
    default:
      return "Paid record exists, but no durable CAPI delivery log was found.";
  }
}
