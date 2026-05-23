import "server-only";

import { resolveEventWebsiteSections } from "@/config/event-website-sections";
import { formatUserRoleLabel } from "@/lib/auth/role-labels";
import { mergeEventWebsiteContent } from "@/lib/event-website/hydration";
import type { EventWebsiteContent } from "@/lib/event-website/types";
import { requireTenantMember } from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { EventWebsiteContentPatchSchema } from "@/lib/validations/event-website.schema";
import { getEventResponseCount } from "@/server/queries/responses";

type DashboardChecklistItem = {
  completed: boolean;
  href: string;
  id: string;
  label: string;
};

type DashboardChecklistState = {
  items: DashboardChecklistItem[];
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
    countdownStartAt?: string;
    eventId: string | null;
    eventDateTime?: string;
    isPublished: boolean;
    rsvpDeadlineLabel: string;
    statusChipLabel: "Draft" | "Published" | "Unpublished";
    slug?: string;
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
  };
};

export async function getDashboardSummary(): Promise<DashboardHomeData> {
  const profile = await requireTenantMember();
  const supabase = await createServerSupabaseClient();
  const adminSupabase = createAdminClient();
  const clientId = profile.client_id;

  if (!clientId) {
    throw new Error("Client tenant profile is missing client_id.");
  }

  const [
    { data: client, error: clientError },
    { data: events, error: eventError },
    { data: payments, error: paymentError },
    { data: applications, error: applicationError },
  ] = await Promise.all([
    supabase
      .from("clients")
      .select(
        "id, name, contact_email, contact_name, status, plan_type, hosting_starts_at, hosting_ends_at",
      )
      .eq("id", clientId)
      .single(),
    supabase
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
            content_json
          )
        `,
      )
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .limit(1),
    supabase
      .from("payments")
      .select(
        "id, amount_due, amount_paid, currency, paid_at, payment_method, payment_status, updated_at",
      )
      .eq("client_id", clientId)
      .order("updated_at", { ascending: false })
      .limit(1),
    supabase
      .from("rsvp_applications")
      .select("id, event_location")
      .eq("approved_client_id", clientId)
      .order("approved_at", { ascending: false })
      .limit(1),
  ]);

  if (clientError) throw clientError;
  if (eventError) throw eventError;
  if (paymentError) throw paymentError;
  if (applicationError) throw applicationError;

  const event = events?.[0] ?? null;
  const payment = payments?.[0] ?? null;
  const application = applications?.[0] ?? null;

  const [{ data: packageSettings, error: packageSettingsError }, responseCount] = await Promise.all([
    adminSupabase
      .from("platform_package_settings")
      .select("default_amount, default_hosting_days")
      .eq("plan_type", client.plan_type)
      .maybeSingle(),
    event?.id ? getEventResponseCount({ clientId, eventId: event.id, supabase }) : 0,
  ]);

  if (packageSettingsError) throw packageSettingsError;

  const displayName = profile.full_name ?? client.contact_name ?? client.name ?? "there";
  const planLabel = formatPlanLabel(client.plan_type);
  const defaultAccessDays =
    packageSettings?.default_hosting_days ??
    getCoverageDays(client.hosting_starts_at, client.hosting_ends_at) ??
    365;
  const defaultAmount = packageSettings?.default_amount ?? null;
  const paymentStatus = normalizePaymentStatus(payment?.payment_status, payment?.amount_paid);
  const paymentAmount = payment?.amount_paid ?? payment?.amount_due ?? defaultAmount;
  const websitePublished = isPublishedEvent(event?.status, event?.published_at);
  const roleLabel = profile.role === "client_staff" ? "Client Staff" : "Client Admin";
  const rawContentJson = normalizeEventContentRelation(event?.event_content)?.content_json ?? null;
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
  const defaultWebsiteContent = mergeEventWebsiteContent({}, {
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
  const mainEventCompleted = Boolean(event?.event_date && event?.event_time && event?.rsvp_close_at);
  const venueCompleted = Boolean(event?.venue_name && event?.venue_address);
  const eventDetailsCompleted = hostInfoCompleted && mainEventCompleted && venueCompleted;
  const websiteAccessConfigured = hasWebsiteAccessConfigured({
    draftSlug: event?.draft_event_slug,
    draftVisibility: event?.draft_visibility,
    publishedSlug: event?.event_slug,
    visibility: event?.visibility,
  });
  const optionalSectionSummary = summarizeOptionalSections({
    defaultContent: defaultWebsiteContent,
    eventType: event?.event_type,
    parsedContentPatch: parsedContentPatch.success ? parsedContentPatch.data : null,
    savedContent: websiteContent,
  });
  const websiteContentCompleted = optionalSectionSummary.completedCount > 0;
  const checklistItems: DashboardChecklistItem[] = [
    {
      completed: eventDetailsCompleted,
      href: "/dashboard/event",
      id: "event-details",
      label: "Event Details",
    },
    {
      completed: websiteContentCompleted,
      href: "/dashboard/event",
      id: "website-content",
      label: "Website Content",
    },
    {
      completed: paymentStatus.isConfirmed,
      href: "/dashboard/billing",
      id: "payment-status",
      label: "Payment Status",
    },
    {
      completed: websitePublished,
      href: "/dashboard/website-access",
      id: "publish-website",
      label: "Publish Website",
    },
  ];
  const statusChipLabel = websitePublished
    ? "Published"
    : websiteAccessConfigured
      ? "Draft"
      : "Unpublished";

  return {
    checklist: {
      items: checklistItems,
    },
    client: {
      accessDays: defaultAccessDays,
      contactName: client.contact_name ?? client.name,
      name: client.name,
      planDescription: getPlanDescription(client.plan_type),
      planLabel,
      planType: client.plan_type,
      roleLabel,
      status: formatUserRoleLabel(profile.role),
    },
    event: {
      countdownStartAt: getCountdownStartAt(client.hosting_starts_at),
      eventId: event?.id ?? null,
      eventDateTime: buildEventDateTime(event?.event_date, event?.event_time),
      isPublished: websitePublished,
      rsvpDeadlineLabel: formatDeadlineLabel(event?.event_date),
      statusChipLabel,
      slug: event?.event_slug ?? undefined,
    },
    packageDefaults:
      defaultAmount !== null || defaultAccessDays
        ? {
            defaultAccessDays,
            defaultAmount: defaultAmount ?? undefined,
          }
        : undefined,
    payment: {
      amountLabel: paymentAmount !== null ? formatCurrency(paymentAmount) : "Amount pending",
      description: getPaymentDescription(paymentStatus.isConfirmed, paymentAmount),
      isConfirmed: paymentStatus.isConfirmed,
      status: paymentStatus.label,
    },
    profile: {
      displayName,
      email: profile.email,
      firstName: getFirstName(displayName),
      roleLabel,
    },
    stats: {
      eventId: event?.id ?? null,
      guestLimitValue: event?.max_guest_count ?? null,
      guestLimitLabel: event?.max_guest_count ? `${event.max_guest_count}` : "To be finalized",
      responsesLabel: `${responseCount} so far`,
      rsvpCoverageLabel: `${defaultAccessDays} days`,
    },
  };
}

function buildEventDateTime(eventDate?: string | null, eventTime?: string | null) {
  if (!eventDate) return undefined;
  return `${eventDate}T${eventTime || "23:59:59"}`;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-PH", {
    currency: "PHP",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

function formatDeadlineLabel(eventDate?: string | null) {
  if (!eventDate) {
    return "Set your event date to unlock the RSVP timeline.";
  }

  const parsed = parseDateOnly(eventDate);
  if (!parsed) {
    return "Set your event date to unlock the RSVP timeline.";
  }

  parsed.setUTCDate(parsed.getUTCDate() - 30);
  return formatDateOnly(parsed);
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

function getCountdownStartAt(hostingStartsAt?: string | null) {
  return hostingStartsAt ?? undefined;
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

function getFirstName(displayName: string) {
  const trimmed = displayName.trim();
  if (!trimmed) return "there";
  return trimmed.split(/\s+/)[0] ?? "there";
}

function getPaymentDescription(isConfirmed: boolean, paymentAmount: number | null) {
  if (isConfirmed) {
    return paymentAmount !== null
      ? `Confirmed amount: ${formatCurrency(paymentAmount)}.`
      : "Confirmed payment received.";
  }

  if (paymentAmount !== null) {
    return `Awaiting confirmation for ${formatCurrency(paymentAmount)}. Follow up on Messenger.`;
  }

  return "Amount pending. Follow up on Messenger or contact our Facebook page for payment assistance.";
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

function isPublishedEvent(status?: string | null, publishedAt?: string | null) {
  return status === "published" && Boolean(publishedAt);
}

function normalizePaymentStatus(status?: string | null, amountPaid?: number | null) {
  const normalized = status?.toLowerCase() ?? "";
  const isConfirmed = normalized === "paid" || normalized === "confirmed" || Boolean(amountPaid);

  return {
    isConfirmed,
    label: isConfirmed ? "Confirmed" : "Pending",
  };
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

function normalizeEventContentRelation(
  relation:
    | {
        content_json: unknown;
      }
    | Array<{
        content_json: unknown;
      }>
    | null
    | undefined,
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

function hasWebsiteAccessConfigured(input: {
  draftSlug?: string | null;
  draftVisibility?: string | null;
  publishedSlug?: string | null;
  visibility?: string | null;
}) {
  const slug = input.draftSlug ?? input.publishedSlug;
  const visibility = input.draftVisibility ?? input.visibility;

  return Boolean(slug && visibility && ["private", "public", "unlisted"].includes(visibility));
}

function hasAnyNonEmptyText(...values: Array<string | null | undefined>) {
  return values.some((value) => typeof value === "string" && value.trim().length > 0);
}

function summarizeOptionalSections({
  defaultContent,
  eventType,
  parsedContentPatch,
  savedContent,
}: {
  defaultContent: EventWebsiteContent;
  eventType?: string | null;
  parsedContentPatch: {
    layout?: {
      enabledSections?: Record<string, boolean | undefined>;
    };
  } | null;
  savedContent: EventWebsiteContent;
}) {
  const resolvedSections = resolveEventWebsiteSections(eventType);
  const enabledOptionalKeys = resolvedSections.optionalSections
    .map((section) => section.key)
    .filter((key) => parsedContentPatch?.layout?.enabledSections?.[key] === true);
  const completedCount = enabledOptionalKeys.filter((key) =>
    isSectionCustomized(
      savedContent.sections[key as keyof EventWebsiteContent["sections"]],
      defaultContent.sections[key as keyof EventWebsiteContent["sections"]],
    ),
  ).length;

  return {
    completedCount,
    enabledCount: enabledOptionalKeys.length,
  };
}

function isSectionCustomized(
  savedSection: EventWebsiteContent["sections"][keyof EventWebsiteContent["sections"]],
  defaultSection: EventWebsiteContent["sections"][keyof EventWebsiteContent["sections"]],
) {
  return JSON.stringify(savedSection) !== JSON.stringify(defaultSection);
}
