import "server-only";

import { formatUserRoleLabel } from "@/lib/auth/role-labels";
import { requireTenantMember } from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type DashboardChecklistState = {
  eventDetailsCompleted: boolean;
  paymentConfirmed: boolean;
  websiteContentCompleted: boolean;
  websitePublished: boolean;
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
    eventDateTime?: string;
    guestLimitLabel: string;
    isPublished: boolean;
    rsvpDeadlineLabel: string;
    slug?: string;
    title: string;
    venueLabel: string;
    websiteDescription: string;
    websiteStatus: string;
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
        "id, event_slug, title, event_type, event_date, event_time, status, visibility, venue_name, max_guest_count, published_at",
      )
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .limit(1),
    supabase
      .from("payments")
      .select("id, amount_due, amount_paid, currency, paid_at, payment_method, payment_status, updated_at")
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

  const [{ data: packageSettings, error: packageSettingsError }, eventContentResult] = await Promise.all([
    adminSupabase
      .from("platform_package_settings")
      .select("default_amount, default_hosting_days")
      .eq("plan_type", client.plan_type)
      .maybeSingle(),
    event?.id
      ? supabase
          .from("event_content")
          .select("hero_title, hero_subtitle, couple_or_celebrant_names, event_story, theme_key")
          .eq("event_id", event.id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (packageSettingsError) throw packageSettingsError;
  if (eventContentResult.error) throw eventContentResult.error;

  const displayName = profile.full_name ?? client.contact_name ?? client.name ?? "there";
  const venueLabel = event?.venue_name ?? application?.event_location ?? "Venue pending";
  const planLabel = formatPlanLabel(client.plan_type);
  const defaultAccessDays =
    packageSettings?.default_hosting_days ??
    getCoverageDays(client.hosting_starts_at, client.hosting_ends_at) ??
    365;
  const defaultAmount = packageSettings?.default_amount ?? null;
  const paymentStatus = normalizePaymentStatus(payment?.payment_status, payment?.amount_paid);
  const paymentAmount = payment?.amount_paid ?? payment?.amount_due ?? defaultAmount;
  const websitePublished = isPublishedEvent(event?.status, event?.published_at);
  const eventContent = eventContentResult.data;
  const websiteContentCompleted = Boolean(
    eventContent?.hero_title &&
      eventContent?.couple_or_celebrant_names &&
      eventContent?.event_story &&
      eventContent?.theme_key,
  );
  const eventDetailsCompleted = Boolean(event?.event_date && venueLabel !== "Venue pending");
  const roleLabel = profile.role === "client_staff" ? "Client Staff" : "Client Admin";

  return {
    checklist: {
      eventDetailsCompleted,
      paymentConfirmed: paymentStatus.isConfirmed,
      websiteContentCompleted,
      websitePublished,
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
      eventDateTime: buildEventDateTime(event?.event_date, event?.event_time),
      guestLimitLabel: event?.max_guest_count ? `${event.max_guest_count}` : "Guest limit pending",
      isPublished: websitePublished,
      rsvpDeadlineLabel: formatDeadlineLabel(event?.event_date),
      slug: event?.event_slug ?? undefined,
      title: event?.title ?? `${client.name} RSVP`,
      venueLabel,
      websiteDescription: websitePublished
        ? "Your RSVP website is live and ready to share."
        : "Our team is currently building and preparing your RSVP website.",
      websiteStatus: websitePublished ? "Published" : "In development",
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
      guestLimitLabel: event?.max_guest_count ? `${event.max_guest_count}` : "To be finalized",
      responsesLabel: "0 so far",
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
      : "Confirmed payment received."
  }

  if (paymentAmount !== null) {
    return `Awaiting confirmation for ${formatCurrency(paymentAmount)}. Follow up on Messenger or contact our Facebook page for payment assistance.`;
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
  return status === "published" || Boolean(publishedAt);
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
