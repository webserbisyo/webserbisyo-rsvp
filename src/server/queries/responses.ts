import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { RsvpResponseRecord } from "@/components/dashboard/responses/rsvp-responses-types";
import { requireTenantMember } from "@/lib/permissions";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/types";

type RsvpResponsesTableRow = {
  archived_at: string | null;
  attendance_status: "attending" | "not_attending";
  client_id: string;
  dietary_notes: string | null;
  email: string | null;
  event_id: string;
  guest_name: string;
  id: string;
  message: string | null;
  party_size: number;
  phone: string | null;
  source: string | null;
  submitted_at: string;
  updated_at: string;
};

type RsvpResponseCompanionRow = {
  age_label: string | null;
  created_at: string;
  full_name: string;
  id: string;
  response_id: string;
};

type ResponsesDatabase = {
  public: {
    Tables: {
      rsvp_response_companions: {
        Row: RsvpResponseCompanionRow;
        Insert: never;
        Update: never;
        Relationships: [];
      };
      rsvp_responses: {
        Row: RsvpResponsesTableRow;
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

type CurrentEventSummary = Pick<Tables<"rsvp_events">, "event_slug" | "id" | "title">;

export type DashboardResponsesData = {
  currentEvent: CurrentEventSummary | null;
  responses: RsvpResponseRecord[];
};

type ResponsesSupabaseClient = SupabaseClient<ResponsesDatabase>;

export async function getDashboardResponses(): Promise<DashboardResponsesData> {
  const profile = await requireTenantMember();
  const clientId = profile.client_id;

  if (!clientId) {
    throw new Error("Client tenant profile is missing client_id.");
  }

  const supabase = await createServerSupabaseClient();
  const responsesSupabase = asResponsesSupabaseClient(supabase);
  const currentEvent = await getCurrentTenantEvent(supabase, clientId);

  if (!currentEvent) {
    return {
      currentEvent: null,
      responses: [],
    };
  }

  const { data: responseRows, error: responseError } = await responsesSupabase
    .from("rsvp_responses")
    .select(
      "id, client_id, event_id, guest_name, email, phone, attendance_status, party_size, dietary_notes, message, source, submitted_at, updated_at, archived_at",
    )
    .eq("client_id", clientId)
    .eq("event_id", currentEvent.id)
    .is("archived_at", null)
    .order("submitted_at", { ascending: false });

  if (responseError) {
    throw responseError;
  }

  const responseIds = (responseRows ?? []).map((response) => response.id);
  const companionsByResponseId = new Map<string, string[]>();

  if (responseIds.length > 0) {
    const { data: companionRows, error: companionsError } = await responsesSupabase
      .from("rsvp_response_companions")
      .select("id, response_id, full_name, age_label, created_at")
      .in("response_id", responseIds)
      .order("created_at", { ascending: true });

    if (companionsError) {
      throw companionsError;
    }

    for (const companion of companionRows ?? []) {
      const currentCompanions = companionsByResponseId.get(companion.response_id) ?? [];
      currentCompanions.push(companion.full_name);
      companionsByResponseId.set(companion.response_id, currentCompanions);
    }
  }

  return {
    currentEvent,
    responses: (responseRows ?? []).map((response) => ({
      companions: companionsByResponseId.get(response.id) ?? [],
      dietaryNotes: response.dietary_notes,
      email: response.email,
      guestName: response.guest_name,
      id: response.id,
      message: response.message,
      partySize: response.party_size,
      phone: response.phone,
      source: response.source,
      status: response.attendance_status,
      submittedAt: response.submitted_at,
    })),
  };
}

export async function getEventResponseCount({
  clientId,
  eventId,
  supabase,
}: {
  clientId: string;
  eventId: string;
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>;
}) {
  const responsesSupabase = asResponsesSupabaseClient(supabase);
  const { count, error } = await responsesSupabase
    .from("rsvp_responses")
    .select("id", { count: "exact", head: true })
    .eq("client_id", clientId)
    .eq("event_id", eventId)
    .is("archived_at", null);

  if (error) {
    throw error;
  }

  return count ?? 0;
}

async function getCurrentTenantEvent(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  clientId: string,
) {
  const { data: event, error } = await supabase
    .from("rsvp_events")
    .select("id, event_slug, title")
    .eq("client_id", clientId)
    .is("archived_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return event;
}

function asResponsesSupabaseClient(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
) {
  return supabase as unknown as ResponsesSupabaseClient;
}
