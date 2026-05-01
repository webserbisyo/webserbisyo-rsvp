import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/types";
import { createClientUser } from "@/server/services/create-client-user";
import { createDraftEvent } from "@/server/services/create-draft-event";
import { provisionClient } from "@/server/services/provision-client";
import {
  ServiceError,
  assertServiceData,
  assertServiceSuccess,
} from "@/server/services/service-error";

type EventRecord = Tables<"rsvp_events">;
type EventContentRecord = Tables<"event_content">;

type ApplicationProvisioningRecord = Pick<
  Tables<"rsvp_applications">,
  | "approved_client_id"
  | "approved_event_id"
  | "email"
  | "estimated_guest_count"
  | "event_date"
  | "event_location"
  | "event_type"
  | "full_name"
  | "phone"
  | "reference_code"
>;

export type ProvisionedEventBundle = {
  content: EventContentRecord;
  event: EventRecord;
};

type EnsureClientInput = {
  application: ApplicationProvisioningRecord;
  existingClientId?: string | null;
  planType: "pro" | "max";
};

type EnsureEventBundleInput = {
  application: ApplicationProvisioningRecord;
  clientId: string;
  existingEventId?: string | null;
};

export async function ensureClientForApplication(input: EnsureClientInput) {
  if (input.existingClientId) {
    return getClientById(input.existingClientId);
  }

  if (input.application.approved_client_id) {
    return getClientById(input.application.approved_client_id);
  }

  const supabase = await createServerSupabaseClient();
  const normalizedEmail = input.application.email.trim().toLowerCase();
  const { data: matchingClients, error } = await supabase
    .from("clients")
    .select("*")
    .eq("contact_email", normalizedEmail)
    .order("created_at", { ascending: true })
    .limit(2);

  assertServiceSuccess(error, "Failed to check for an existing client.");

  if ((matchingClients?.length ?? 0) > 1) {
    throw new ServiceError(
      "Multiple client records already use this email. Resolve the client link before approving this application.",
    );
  }

  if (matchingClients?.[0]) {
    return matchingClients[0];
  }

  return provisionClient({
    contactEmail: normalizedEmail,
    contactName: input.application.full_name,
    contactPhone: input.application.phone,
    name: input.application.full_name,
    planType: input.planType,
  });
}

export async function ensureOwnerProfileForClient(input: {
  accessMode?: "invite" | "temporary_password";
  clientId: string;
  email: string;
  fullName?: string | null;
}) {
  return createClientUser(input);
}

export async function ensureEventBundleForClient(input: EnsureEventBundleInput) {
  if (input.existingEventId) {
    const event = await getEventById(input.existingEventId);
    const content = await ensureEventContent(event);
    return { content, event };
  }

  if (input.application.approved_event_id) {
    const event = await getEventById(input.application.approved_event_id);
    const content = await ensureEventContent(event);
    return { content, event };
  }

  const supabase = await createServerSupabaseClient();
  const { data: existingEvents, error } = await supabase
    .from("rsvp_events")
    .select("*")
    .eq("client_id", input.clientId)
    .neq("status", "archived")
    .order("created_at", { ascending: false })
    .limit(1);

  assertServiceSuccess(error, "Failed to check for an existing RSVP event.");

  const existingEvent = existingEvents?.[0] ?? null;

  if (existingEvent) {
    const content = await ensureEventContent(existingEvent);
    return {
      content,
      event: existingEvent,
    };
  }

  return createDraftEvent({
    clientId: input.clientId,
    eventDate: input.application.event_date,
    eventLocation: input.application.event_location,
    eventSlug: buildDefaultEventSlug(input.application),
    eventType: input.application.event_type,
    maxGuestCount: input.application.estimated_guest_count,
    title: buildDefaultEventTitle(input.application),
  });
}

async function ensureEventContent(event: EventRecord) {
  const supabase = await createServerSupabaseClient();
  const { data: existingContent, error: existingContentError } = await supabase
    .from("event_content")
    .select("*")
    .eq("event_id", event.id)
    .maybeSingle();

  assertServiceSuccess(existingContentError, "Failed to load event content.");

  if (existingContent) {
    return existingContent;
  }

  const { data: content, error: contentError } = await supabase
    .from("event_content")
    .insert({
      content_json: {},
      event_id: event.id,
      hero_title: event.title,
    })
    .select("*")
    .single();

  assertServiceSuccess(contentError, "Failed to create event content.");
  assertServiceData(content, "Event content insert returned no row.");

  return content;
}

async function getClientById(clientId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from("clients").select("*").eq("id", clientId).single();

  assertServiceSuccess(error, "Failed to load the linked client.");
  assertServiceData(data, "The linked client no longer exists.");

  return data;
}

async function getEventById(eventId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from("rsvp_events").select("*").eq("id", eventId).single();

  assertServiceSuccess(error, "Failed to load the linked event.");
  assertServiceData(data, "The linked event no longer exists.");

  return data;
}

function buildDefaultEventSlug(application: ApplicationProvisioningRecord) {
  return `${application.full_name}-${application.event_type}-${application.reference_code}`;
}

function buildDefaultEventTitle(application: ApplicationProvisioningRecord) {
  return `${application.full_name} ${formatEventTypeLabel(application.event_type)} RSVP`;
}

function formatEventTypeLabel(eventType: string) {
  return eventType
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
