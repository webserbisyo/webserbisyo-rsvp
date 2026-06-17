import "server-only";

import type { PostgrestError } from "@supabase/supabase-js";
import { formatUserRoleLabel } from "@/lib/auth/role-labels";
import { buildManilaOffsetDateTime } from "@/lib/event-website/canonical";
import { mergeEventWebsiteContent } from "@/lib/event-website/hydration";
import { getEventWebsiteSavedAt } from "@/lib/event-website/readiness";
import type { EventWebsiteContent } from "@/lib/event-website/types";
import { PermissionError, requireTenantMember, type AuthenticatedProfile } from "@/lib/permissions";
import {
  getPublicAppUrl,
  isPublishedPublicRsvpReady,
  resolvePublicRsvpLinkSet,
} from "@/lib/public-rsvp-url";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { EventWebsiteContentPatchSchema } from "@/lib/validations/event-website.schema";
import { getEventAttendingGuestCount, getEventResponseCount } from "@/server/queries/responses";

type DashboardChecklistItem = {
  completed: boolean;
  href: string;
  id: string;
  label: string;
};

type DashboardChecklistState = {
  items: DashboardChecklistItem[];
};

type DashboardPaymentState =
  | "confirmed"
  | "missing"
  | "partial"
  | "pending"
  | "refunded"
  | "unpaid";

type DashboardPaymentSummary = {
  description: string;
  isConfirmed: boolean;
  label: string;
  state: DashboardPaymentState;
};

type DashboardEventRow = {
  draft_event_slug: string | null;
  draft_subdomain_slug: string | null;
  draft_visibility: string | null;
  event_content:
    | {
        content_json: unknown;
        published_at: string | null;
        published_content_json: unknown;
      }
    | Array<{
        content_json: unknown;
        published_at: string | null;
        published_content_json: unknown;
      }>
    | null;
  event_date: string | null;
  event_slug: string | null;
  event_time: string | null;
  event_type: string | null;
  fallback_page_enabled: boolean | null;
  id: string;
  max_guest_count: number | null;
  published_at: string | null;
  rsvp_close_at: string | null;
  status: string | null;
  subdomain_slug: string | null;
  title: string | null;
  venue_address: string | null;
  venue_name: string | null;
  visibility: string | null;
};

type DashboardPaymentRow = {
  amount_due: number | null;
  amount_paid: number | null;
  created_at: string | null;
  currency: string | null;
  hosting_ends_at: string | null;
  hosting_starts_at: string | null;
  id: string;
  paid_at: string | null;
  payment_method: string | null;
  payment_status: string | null;
  plan_type: string | null;
  updated_at: string | null;
};

type DashboardClientRow = {
  contact_email: string | null;
  contact_name: string | null;
  hosting_ends_at: string | null;
  hosting_starts_at: string | null;
  id: string;
  name: string;
  plan_type: "pro" | "max" | string;
  status: string;
};

type DashboardPackageSettingsRow = {
  default_amount: number | null;
  default_hosting_days: number | null;
};

type DashboardEventResult = {
  row: DashboardEventRow | null;
  subdomainFieldsInstalled: boolean;
};

export type DashboardHomeData = {
  checklist: DashboardChecklistState;
  client: {
    accessDays?: number;
    contactName: string;
    name: string;
    planDescription: string;
    planLabel: string;
    planType: "pro" | "max" | string;
    roleLabel: string;
    status: string;
  };
  event: {
    eventDateLabel?: string;
    eventDateTime?: string;
    eventId: string | null;
    hasEventDate: boolean;
    hasEventTime: boolean;
    isPublished: boolean;
    isShareable: boolean;
    publicUrl: string | null;
    rsvpDeadlineLabel: string;
    shareHint: string;
    slug?: string;
    statusChipLabel: "Draft" | "Published" | "Unpublished";
  };
  packageDefaults?: {
    defaultAccessDays?: number;
    defaultAmount?: number;
  };
  payment: {
    amountLabel: string;
    description: string;
    isConfirmed: boolean;
    status: string;
  };
  profile: {
    displayName: string;
    email: string;
    firstName: string;
    roleLabel: string;
  };
  stats: {
    eventId: string | null;
    guestLimitValue: number | null;
    guestLimitLabel: string;
    responsesLabel: string;
    rsvpCoverageLabel: string;
    attendingGuestCount: number;
    attendingGuestLabel: string;
  };

  warning: string | null;
};

const DEFAULT_PUBLIC_APP_URL = getPublicAppUrl();

export async function getDashboardSummary(): Promise<DashboardHomeData> {
  const profile = await requireTenantMember();
  const clientId = profile.client_id;

  if (!clientId) {
    throw new PermissionError("Client tenant access is required.");
  }

  try {
    return await loadDashboardSummary(profile, clientId);
  } catch (error) {
    logDashboardSummaryError(error);
    return buildFallbackDashboardSummary(profile);
  }
}

async function loadDashboardSummary(
  profile: AuthenticatedProfile,
  clientId: string,
): Promise<DashboardHomeData> {
  const supabase = await createServerSupabaseClient();
  const adminSupabase = createAdminClient();

  const [clientResult, eventResult, paymentsResult, applicationsResult] = await Promise.all([
    supabase
      .from("clients")
      .select(
        "id, name, contact_email, contact_name, status, plan_type, hosting_starts_at, hosting_ends_at",
      )
      .eq("id", clientId)
      .maybeSingle(),
    getLatestDashboardEventRow(supabase, clientId),
    supabase
      .from("payments")
      .select(
        "id, plan_type, amount_due, amount_paid, currency, paid_at, payment_method, payment_status, hosting_starts_at, hosting_ends_at, updated_at, created_at",
      )
      .eq("client_id", clientId)
      .order("updated_at", { ascending: false })
      .order("paid_at", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1),
    supabase
      .from("rsvp_applications")
      .select("id, event_location")
      .eq("approved_client_id", clientId)
      .order("approved_at", { ascending: false })
      .limit(1),
  ]);

  if (clientResult.error) {
    console.error("[dashboard] Failed to load client data", clientResult.error);
    throw clientResult.error;
  }
  if (paymentsResult.error) {
    console.error("[dashboard] Failed to load payments data", paymentsResult.error);
    throw paymentsResult.error;
  }
  if (applicationsResult.error) {
    console.error("[dashboard] Failed to load applications data", applicationsResult.error);
    throw applicationsResult.error;
  }

  const client = clientResult.data;
  if (!client) throw new Error("Dashboard could not load the current tenant client record.");

  const event = eventResult.row;
  const payment = (paymentsResult.data?.[0] ?? null) as DashboardPaymentRow | null;
  const application = applicationsResult.data?.[0] ?? null;
  const eventContent = normalizeEventContentRelation(event?.event_content);

  const [packageSettings, refunds, responseCount, attendingGuestCount] = await Promise.all([
    safeLoadPackageSettings(adminSupabase, client.plan_type),
    safeLoadRefunds(adminSupabase, clientId, payment?.id ?? null),
    event?.id
      ? getEventResponseCount({ clientId, eventId: event.id, supabase })
      : Promise.resolve(0),
    event?.id
      ? getEventAttendingGuestCount({ clientId, eventId: event.id, supabase })
      : Promise.resolve(0),
  ]);

  const displayName = profile.full_name ?? client.contact_name ?? client.name ?? "there";
  const planLabel = formatPlanLabel(client.plan_type);
  const defaultAccessDays = packageSettings?.default_hosting_days ?? null;
  const defaultAmount = packageSettings?.default_amount ?? null;
  const refundTotal = refunds.reduce((sum, refund) => sum + (refund.amount ?? 0), 0);
  const paymentSummary = getDashboardPaymentSummary({
    amountDue: payment?.amount_due ?? defaultAmount,
    amountPaid: payment?.amount_paid ?? 0,
    paymentStatus: payment?.payment_status ?? null,
    refundTotal,
  });
  const netAmountPaid = payment ? Math.max((payment.amount_paid ?? 0) - refundTotal, 0) : 0;
  const paymentAmount = getDashboardPaymentAmount({
    defaultAmount,
    netAmountPaid,
    payment,
    paymentState: paymentSummary.state,
  });
  const publishedSnapshotReady = hasPublishedSnapshot(eventContent);
  const publishState = getDashboardPublishState({
    fallbackPageEnabled: event?.fallback_page_enabled ?? false,
    publishedAt: event?.published_at ?? null,
    status: event?.status ?? null,
  });
  const shareable = isPublishedPublicRsvpReady({
    fallbackPageEnabled: event?.fallback_page_enabled,
    hasPublishedSnapshot: publishedSnapshotReady,
    publishedAt: event?.published_at,
    slug: event?.event_slug,
    status: event?.status,
  });
  const websiteAccessConfigured = hasWebsiteAccessConfigured({
    draftSlug: event?.draft_event_slug,
    draftSubdomain: event?.draft_subdomain_slug,
    draftVisibility: event?.draft_visibility,
    publishedSlug: event?.event_slug,
    publishedSubdomain: event?.subdomain_slug,
    visibility: event?.visibility,
  });
  const publicUrl =
    shareable && event?.event_slug && DEFAULT_PUBLIC_APP_URL
      ? (resolvePublicRsvpLinkSet({
          baseUrl: DEFAULT_PUBLIC_APP_URL,
          slug: event.event_slug,
          subdomain: eventResult.subdomainFieldsInstalled ? event.subdomain_slug : null,
        }).openUrl ?? null)
      : null;
  const roleLabel = profile.role === "client_staff" ? "Client Staff" : "Client Admin";
  const rawContentJson = eventContent?.content_json ?? null;
  const parsedContentPatch = EventWebsiteContentPatchSchema.safeParse(rawContentJson);
  const websiteContent = mergeEventWebsiteContent(rawContentJson, {
    application,
    client: {
      contactName: client.contact_name ?? client.name,
      name: client.name,
    },
    event: {
      eventDate: event?.event_date ?? null,
      eventTime: event?.event_time ?? null,
      eventType: event?.event_type ?? null,
      maxGuestCount: event?.max_guest_count ?? null,
      rsvpCloseAt: event?.rsvp_close_at ?? null,
      title: event?.title ?? null,
      venueAddress: event?.venue_address ?? null,
      venueName: event?.venue_name ?? null,
    },
    profile: {
      email: profile.email,
      fullName: profile.full_name,
    },
  });
  const hostInfoCompleted =
    parsedContentPatch.success && hasHostInfoContent(websiteContent.sections.host_info);
  const mainEventCompleted = Boolean(
    event?.event_date && event?.event_time && event?.rsvp_close_at,
  );
  const venueCompleted = Boolean(event?.venue_name && event?.venue_address);
  const websiteContentCompleted = Boolean(getEventWebsiteSavedAt(websiteContent));
  const checklistItems = buildChecklistItems({
    hostInfoCompleted,
    mainEventCompleted,
    paymentCompleted: paymentSummary.isConfirmed,
    publishCompleted: shareable,
    venueCompleted,
    websiteContentCompleted,
  });
  const statusChipLabel = publishState
    ? "Published"
    : websiteAccessConfigured
      ? "Draft"
      : "Unpublished";

  return {
    checklist: {
      items: checklistItems,
    },
    client: {
      accessDays: defaultAccessDays ?? undefined,
      contactName: client.contact_name ?? client.name,
      name: client.name,
      planDescription: getPlanDescription(client.plan_type),
      planLabel,
      planType: client.plan_type,
      roleLabel,
      status: formatUserRoleLabel(profile.role),
    },
    event: {
      eventDateLabel: formatEventDateLabel(event?.event_date),
      eventDateTime: buildEventDateTime(event?.event_date, event?.event_time),
      eventId: event?.id ?? null,
      hasEventDate: Boolean(event?.event_date),
      hasEventTime: Boolean(event?.event_time),
      isPublished: publishState,
      isShareable: shareable,
      publicUrl,
      rsvpDeadlineLabel: formatDeadlineLabel(event?.rsvp_close_at),
      shareHint: getWebsiteShareHint({
        hasFallbackPageEnabled: event?.fallback_page_enabled ?? false,
        hasPublishedSnapshot: publishedSnapshotReady,
        hasSlug: Boolean(event?.event_slug),
        isPublished: publishState,
      }),
      slug: event?.event_slug ?? undefined,
      statusChipLabel,
    },
    packageDefaults:
      defaultAmount !== null || defaultAccessDays
        ? {
            defaultAccessDays: defaultAccessDays ?? undefined,
            defaultAmount: defaultAmount ?? undefined,
          }
        : undefined,
    payment: {
      amountLabel: paymentAmount !== null ? formatCurrency(paymentAmount) : "Amount pending",
      description: paymentSummary.description,
      isConfirmed: paymentSummary.isConfirmed,
      status: paymentSummary.label,
    },
    profile: {
      displayName,
      email: profile.email,
      firstName: getFirstName(displayName),
      roleLabel,
    },
    stats: {
      eventId: event?.id ?? null,
      guestLimitValue: event?.max_guest_count ?? 1000,
      guestLimitLabel: formatGuestLimit(event?.max_guest_count ?? 1000),
      responsesLabel: `${responseCount} so far`,
      attendingGuestCount,
      attendingGuestLabel: `${attendingGuestCount} confirmed`,
      rsvpCoverageLabel: getCoverageLabel({
        client,
        defaultAccessDays,
        payment,
      }),
    },
    warning: null,
  };
}

function buildFallbackDashboardSummary(profile: AuthenticatedProfile): DashboardHomeData {
  const displayName = profile.full_name ?? "there";
  const roleLabel = profile.role === "client_staff" ? "Client Staff" : "Client Admin";

  return {
    checklist: {
      items: buildChecklistItems({
        hostInfoCompleted: false,
        mainEventCompleted: false,
        paymentCompleted: false,
        publishCompleted: false,
        venueCompleted: false,
        websiteContentCompleted: false,
      }),
    },
    client: {
      contactName: displayName,
      name: displayName,
      planDescription:
        "Your dashboard details are temporarily unavailable while we reconnect your data.",
      planLabel: "Package pending",
      planType: "pro",
      roleLabel,
      status: formatUserRoleLabel(profile.role),
    },
    event: {
      eventDateTime: undefined,
      eventId: null,
      hasEventDate: false,
      hasEventTime: false,
      isPublished: false,
      isShareable: false,
      publicUrl: null,
      rsvpDeadlineLabel: "Set RSVP deadline",
      shareHint: "Publish your website to activate this link.",
      statusChipLabel: "Unpublished",
    },
    packageDefaults: undefined,
    payment: {
      amountLabel: "Amount pending",
      description:
        "Payment details are temporarily unavailable. Please refresh or try again shortly.",
      isConfirmed: false,
      status: "Pending",
    },
    profile: {
      displayName,
      email: profile.email,
      firstName: getFirstName(displayName),
      roleLabel,
    },
    stats: {
      eventId: null,
      guestLimitValue: 1000,
      guestLimitLabel: formatGuestLimit(1000),
      responsesLabel: "0 so far",
      attendingGuestCount: 0,
      attendingGuestLabel: "0 confirmed",
      rsvpCoverageLabel: "Access pending",
    },
    warning:
      "Some dashboard details are temporarily unavailable. Core account access is still active.",
  };
}

function buildChecklistItems(input: {
  hostInfoCompleted: boolean;
  mainEventCompleted: boolean;
  paymentCompleted: boolean;
  publishCompleted: boolean;
  venueCompleted: boolean;
  websiteContentCompleted: boolean;
}) {
  return [
    {
      completed: input.hostInfoCompleted,
      href: buildDashboardEventHref("host_info"),
      id: "couple-info",
      label: "Couple Info",
    },
    {
      completed: input.mainEventCompleted,
      href: buildDashboardEventHref("main_event"),
      id: "ceremony",
      label: "Ceremony",
    },
    {
      completed: input.venueCompleted,
      href: buildDashboardEventHref("venue"),
      id: "venue",
      label: "Venue",
    },
    {
      completed: input.websiteContentCompleted,
      href: buildDashboardEventHref("website_content"),
      id: "website-content",
      label: "Website Content",
    },
    {
      completed: input.paymentCompleted,
      href: "/dashboard/billing",
      id: "payment-status",
      label: "Payment Status",
    },
    {
      completed: input.publishCompleted,
      href: "/dashboard/website-access",
      id: "publish-website",
      label: "Publish Website",
    },
  ] satisfies DashboardChecklistItem[];
}

function buildDashboardEventHref(section: string) {
  return `/dashboard/event?section=${section}`;
}

function buildEventDateTime(eventDate?: string | null, eventTime?: string | null) {
  return buildManilaOffsetDateTime(eventDate, eventTime) ?? undefined;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-PH", {
    currency: "PHP",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

function formatDeadlineLabel(value?: string | null) {
  const parsed = parseDateTime(value);

  if (!parsed) {
    return "Set RSVP deadline";
  }

  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(parsed);
}

function formatEventDateLabel(value?: string | null) {
  const parsed = value ? parseDateOnly(value) : null;
  return parsed ? formatDateOnly(parsed) : undefined;
}

function formatDateOnly(value: Date) {
  return new Intl.DateTimeFormat("en-PH", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  }).format(value);
}

function formatPlanLabel(planType: string | null | undefined) {
  if (planType === "max") return "Max";
  if (planType === "pro") return "Pro";
  return "Package pending";
}

function formatGuestLimit(value: number) {
  const formattedValue = new Intl.NumberFormat("en-PH").format(value);
  return `${formattedValue} guests`;
}

function getCoverageDays(start?: string | null, end?: string | null) {
  if (!start || !end) return null;

  const startDate = new Date(start);
  const endDate = new Date(end);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return null;
  }

  const diff = endDate.getTime() - startDate.getTime();
  if (diff <= 0) return null;

  return Math.round(diff / (1000 * 60 * 60 * 24));
}

function getCoverageLabel(input: {
  client: DashboardClientRow;
  defaultAccessDays: number | null;
  payment: DashboardPaymentRow | null;
}) {
  const servicePeriod = resolveCoveragePeriod(input);

  if (servicePeriod.startsAt && servicePeriod.endsAt) {
    const startsAt = parseDateTime(servicePeriod.startsAt);
    const endsAt = parseDateTime(servicePeriod.endsAt);

    if (startsAt && endsAt) {
      return `${formatCoverageDate(startsAt)} – ${formatCoverageDate(endsAt)}`;
    }
  }

  if (servicePeriod.days) {
    return `${servicePeriod.days}-day package`;
  }

  return "Access pending";
}

function formatCoverageDate(value: Date) {
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    year: "numeric",
    timeZone: "Asia/Manila",
  }).format(value);
}

function resolveCoveragePeriod(input: {
  client: DashboardClientRow;
  defaultAccessDays: number | null;
  payment: DashboardPaymentRow | null;
}) {
  const startsAt =
    input.client.hosting_starts_at ??
    input.payment?.hosting_starts_at ??
    (input.payment?.payment_status === "paid" ? input.payment.paid_at : null) ??
    null;

  const endsAt =
    input.client.hosting_ends_at ??
    input.payment?.hosting_ends_at ??
    computeEndsAt(startsAt, input.defaultAccessDays);

  return {
    days:
      getCoverageDays(input.client.hosting_starts_at, input.client.hosting_ends_at) ??
      getCoverageDays(input.payment?.hosting_starts_at, input.payment?.hosting_ends_at) ??
      input.defaultAccessDays,
    endsAt,
    startsAt,
  };
}

function computeEndsAt(startsAt: string | null, defaultHostingDays: number | null) {
  const startsAtDate = parseDateTime(startsAt);

  if (!startsAtDate || defaultHostingDays === null || defaultHostingDays <= 0) {
    return null;
  }

  const endsAt = new Date(startsAtDate.getTime() + defaultHostingDays * 24 * 60 * 60 * 1000);
  return endsAt.toISOString();
}

function getFirstName(displayName: string) {
  const trimmed = displayName.trim();
  if (!trimmed) return "there";
  return trimmed.split(/\s+/)[0] ?? "there";
}

function getDashboardPaymentSummary(input: {
  amountDue: number | null;
  amountPaid: number;
  paymentStatus: string | null;
  refundTotal: number;
}): DashboardPaymentSummary {
  const state = deriveDashboardPaymentState(input);
  const netAmountPaid = Math.max(input.amountPaid - input.refundTotal, 0);

  switch (state) {
    case "confirmed":
      return {
        description:
          netAmountPaid > 0
            ? `Confirmed amount: ${formatCurrency(netAmountPaid)}.`
            : "Confirmed payment received.",
        isConfirmed: true,
        label: "Confirmed",
        state,
      };
    case "partial":
      return {
        description: "A partial payment is recorded. Review Billing for the remaining balance.",
        isConfirmed: false,
        label: "Partial",
        state,
      };
    case "refunded":
      return {
        description:
          "A refund is recorded on this billing account. Review Billing for the current balance.",
        isConfirmed: false,
        label: "Refunded",
        state,
      };
    case "pending":
      return {
        description: "Payment is pending review. Follow up in Billing if confirmation is delayed.",
        isConfirmed: false,
        label: "Pending",
        state,
      };
    case "unpaid":
      return {
        description:
          "Payment has not been completed yet. Review Billing for the latest instructions.",
        isConfirmed: false,
        label: "Unpaid",
        state,
      };
    case "missing":
    default:
      return {
        description: "Payment details will appear here once your billing setup is ready.",
        isConfirmed: false,
        label: "Pending",
        state: "missing",
      };
  }
}

function deriveDashboardPaymentState(input: {
  amountDue: number | null;
  amountPaid: number;
  paymentStatus: string | null;
  refundTotal: number;
}): DashboardPaymentState {
  const normalizedStatus = input.paymentStatus?.toLowerCase() ?? null;

  if (!normalizedStatus) {
    return "missing";
  }

  if (normalizedStatus === "refunded" || input.refundTotal > 0) {
    return "refunded";
  }

  if (normalizedStatus === "pending") {
    return input.amountPaid > 0 ? "partial" : "pending";
  }

  if (normalizedStatus === "paid" || normalizedStatus === "confirmed") {
    if (input.amountDue !== null && input.amountPaid > 0 && input.amountPaid < input.amountDue) {
      return "partial";
    }

    return "confirmed";
  }

  if (normalizedStatus === "failed" || normalizedStatus === "cancelled") {
    return "unpaid";
  }

  return "missing";
}

function getDashboardPaymentAmount(input: {
  defaultAmount: number | null;
  netAmountPaid: number;
  payment: DashboardPaymentRow | null;
  paymentState: DashboardPaymentState;
}) {
  if (
    input.paymentState === "confirmed" ||
    input.paymentState === "partial" ||
    input.paymentState === "refunded"
  ) {
    return input.netAmountPaid || input.payment?.amount_due || input.defaultAmount;
  }

  return input.payment?.amount_due ?? input.defaultAmount;
}

function getPlanDescription(planType: string | null | undefined) {
  if (planType === "max") {
    return "Premium web experience with richer design and enhanced event customization.";
  }

  if (planType === "pro") {
    return "Elegant RSVP website with essential customization for your event.";
  }

  return "Package assignment is still being finalized for your dashboard.";
}

function getDashboardPublishState(input: {
  fallbackPageEnabled: boolean;
  publishedAt: string | null;
  status: string | null;
}) {
  return input.status === "published" && Boolean(input.publishedAt) && input.fallbackPageEnabled;
}

function getWebsiteShareHint(input: {
  hasFallbackPageEnabled: boolean;
  hasPublishedSnapshot: boolean;
  hasSlug: boolean;
  isPublished: boolean;
}) {
  if (!input.hasSlug) {
    return "Add a website URL in Manage access to activate this link.";
  }

  if (!input.isPublished || !input.hasFallbackPageEnabled) {
    return "Publish your website to activate this link.";
  }

  if (!input.hasPublishedSnapshot) {
    return "Publish your latest website draft to activate this link.";
  }

  return "Your live RSVP website is ready to share.";
}

function parseDateOnly(value: string) {
  const parts = value.split("-").map(Number);
  if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) {
    return null;
  }

  const year = parts[0];
  const month = parts[1];
  const day = parts[2];

  if (year === undefined || month === undefined || day === undefined) {
    return null;
  }

  return new Date(Date.UTC(year, month - 1, day));
}

function parseDateTime(value?: string | null) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalizeEventContentRelation(
  relation: DashboardEventRow["event_content"] | null | undefined,
) {
  if (Array.isArray(relation)) {
    return relation[0] ?? null;
  }

  return relation ?? null;
}

function hasHostInfoContent(section: EventWebsiteContent["sections"]["host_info"]) {
  return hasAnyNonEmptyText(
    section.displayAs,
    section.brideName,
    section.groomName,
    section.hostLine,
  );
}

function hasPublishedSnapshot(
  relation:
    | {
        published_at: string | null;
        published_content_json: unknown;
      }
    | null
    | undefined,
) {
  return Boolean(relation?.published_at && relation.published_content_json);
}

function hasWebsiteAccessConfigured(input: {
  draftSlug?: string | null;
  draftSubdomain?: string | null;
  draftVisibility?: string | null;
  publishedSlug?: string | null;
  publishedSubdomain?: string | null;
  visibility?: string | null;
}) {
  const slug =
    input.draftSubdomain ?? input.publishedSubdomain ?? input.draftSlug ?? input.publishedSlug;
  const visibility = input.draftVisibility ?? input.visibility;

  return Boolean(slug && visibility && ["private", "public", "unlisted"].includes(visibility));
}

function hasAnyNonEmptyText(...values: Array<string | null | undefined>) {
  return values.some((value) => typeof value === "string" && value.trim().length > 0);
}

async function getLatestDashboardEventRow(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  clientId: string,
): Promise<DashboardEventResult> {
  const primaryResult = await supabase
    .from("rsvp_events")
    .select(
      `
        id,
        event_slug,
        draft_event_slug,
        subdomain_slug,
        draft_subdomain_slug,
        event_type,
        event_date,
        event_time,
        fallback_page_enabled,
        max_guest_count,
        published_at,
        rsvp_close_at,
        status,
        title,
        venue_address,
        venue_name,
        visibility,
        draft_visibility,
        event_content (
          content_json,
          published_at,
          published_content_json
        )
      `,
    )
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (!primaryResult.error) {
    return {
      row: (primaryResult.data?.[0] ?? null) as DashboardEventRow | null,
      subdomainFieldsInstalled: true,
    };
  }

  if (
    !isMissingDashboardSubdomainColumnError(primaryResult.error) &&
    !isMissingDashboardDraftColumnError(primaryResult.error)
  ) {
    throw primaryResult.error;
  }

  const fallbackResult = await supabase
    .from("rsvp_events")
    .select(
      `
        id,
        event_slug,
        draft_event_slug,
        event_type,
        event_date,
        event_time,
        fallback_page_enabled,
        max_guest_count,
        published_at,
        rsvp_close_at,
        status,
        title,
        venue_address,
        venue_name,
        visibility,
        draft_visibility,
        event_content (
          content_json,
          published_at,
          published_content_json
        )
      `,
    )
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (!fallbackResult.error) {
    const event = fallbackResult.data?.[0];

    return {
      row: event
        ? ({
            ...event,
            draft_subdomain_slug: event.draft_event_slug ?? event.event_slug,
            subdomain_slug: event.event_slug,
          } as DashboardEventRow)
        : null,
      subdomainFieldsInstalled: false,
    };
  }

  if (!isMissingDashboardDraftColumnError(fallbackResult.error)) {
    throw fallbackResult.error;
  }

  const legacyResult = await supabase
    .from("rsvp_events")
    .select(
      `
        id,
        event_slug,
        event_type,
        event_date,
        event_time,
        fallback_page_enabled,
        max_guest_count,
        published_at,
        rsvp_close_at,
        status,
        title,
        venue_address,
        venue_name,
        visibility,
        event_content (
          content_json,
          published_at,
          published_content_json
        )
      `,
    )
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (legacyResult.error) {
    throw legacyResult.error;
  }

  const legacyEvent = legacyResult.data?.[0];

  return {
    row: legacyEvent
      ? ({
          ...legacyEvent,
          draft_event_slug: legacyEvent.event_slug,
          draft_subdomain_slug: legacyEvent.event_slug,
          draft_visibility: legacyEvent.visibility,
          subdomain_slug: legacyEvent.event_slug,
        } as DashboardEventRow)
      : null,
    subdomainFieldsInstalled: false,
  };
}

function isMissingDashboardDraftColumnError(error: PostgrestError) {
  if (error.code !== "42703") {
    return false;
  }

  return ["draft_event_slug", "draft_visibility"].some((columnName) =>
    error.message.includes(columnName),
  );
}

function isMissingDashboardSubdomainColumnError(error: PostgrestError) {
  if (error.code !== "42703") {
    return false;
  }

  return ["draft_subdomain_slug", "subdomain_slug"].some((columnName) =>
    error.message.includes(columnName),
  );
}

async function safeLoadPackageSettings(
  adminSupabase: ReturnType<typeof createAdminClient>,
  planType: string | null | undefined,
) {
  if (!planType) {
    return null;
  }

  try {
    const { data, error } = await adminSupabase
      .from("platform_package_settings")
      .select("default_amount, default_hosting_days")
      .eq("plan_type", planType)
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data as DashboardPackageSettingsRow | null;
  } catch (error) {
    console.error("[dashboard] Failed to load package settings", error);
    return null;
  }
}

async function safeLoadRefunds(
  adminSupabase: ReturnType<typeof createAdminClient>,
  clientId: string,
  paymentId: string | null,
) {
  if (!paymentId) {
    return [];
  }

  try {
    const { data, error } = await adminSupabase
      .from("payment_refunds")
      .select("amount")
      .eq("client_id", clientId)
      .eq("payment_id", paymentId);

    if (error) {
      throw error;
    }

    return data ?? [];
  } catch (error) {
    console.error("[dashboard] Failed to load payment refunds", error);
    return [];
  }
}

function logDashboardSummaryError(error: unknown) {
  if (error && typeof error === "object") {
    const detail = error as Record<string, unknown>;
    console.error("[dashboard] Failed to load dashboard summary", {
      name: detail.name || "UnknownError",
      message: detail.message || "No message provided",
      code: detail.code || "No code",
      details: detail.details || null,
      hint: detail.hint || null,
      keys: Object.keys(error),
    });
  } else {
    console.error("[dashboard] Failed to load dashboard summary", error);
  }
}
