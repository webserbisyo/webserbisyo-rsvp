"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  mapAppVisibilityToDb,
  mapDbVisibilityToApp,
} from "@/components/dashboard/website-access/website-access-utils";
import { sanitizePublicRsvpSlug, validatePublicRsvpSlug } from "@/lib/public-rsvp-slugs";
import { PermissionError, requireTenantMember } from "@/lib/permissions";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  publishEventWebsite,
  unpublishEventWebsite,
  updateWebsiteAccessDraftSlug,
  updateWebsiteAccessDraftSubdomain,
  updateWebsiteAccessDraftVisibility,
} from "@/server/services/publish-event-website";
import { ServiceError } from "@/server/services/service-error";
import { actionFailure, actionSuccess, parseActionInput } from "./action-utils";

const UpdateWebsiteAccessDraftVisibilityActionSchema = z.object({
  eventId: z.uuid(),
  visibility: z.enum(["private", "open"]),
});

const UpdateWebsiteAccessDraftSlugActionSchema = z.object({
  eventId: z.uuid(),
  slug: z.string().trim().min(1),
});

const UpdateWebsiteAccessDraftSubdomainActionSchema = z.object({
  eventId: z.uuid(),
  subdomain: z.string().trim(),
});

const PublishEventWebsiteActionSchema = z.object({
  confirmWarnings: z.boolean().optional(),
  eventId: z.uuid(),
});

const UnpublishEventWebsiteActionSchema = z.object({
  eventId: z.uuid(),
});

export async function updateWebsiteAccessDraftVisibilityAction(input: unknown) {
  try {
    const profile = await requireTenantMember();
    const payload = parseActionInput(UpdateWebsiteAccessDraftVisibilityActionSchema, input);
    const event = await requireOwnedEvent(payload.eventId, profile.client_id ?? "");
    const mappedVisibility = mapAppVisibilityToDb(payload.visibility);

    if (!mappedVisibility) {
      throw new ServiceError("Restricted access is not available yet.");
    }

    if (mappedVisibility !== "private" && mappedVisibility !== "public") {
      throw new ServiceError("The selected guest access mode is not supported.");
    }

    const result = await updateWebsiteAccessDraftVisibility({
      actorUserId: profile.id,
      clientId: profile.client_id ?? "",
      draftVisibility: mappedVisibility,
      eventId: event.id,
    });

    return actionSuccess({
      draftVisibility: mapDbVisibilityToApp(result.draftVisibility),
      updatedAt: result.updatedAt,
    });
  } catch (error) {
    return actionFailure(error);
  }
}

export async function updateWebsiteAccessDraftSlugAction(input: unknown) {
  try {
    const profile = await requireTenantMember();
    const payload = parseActionInput(UpdateWebsiteAccessDraftSlugActionSchema, input);
    const event = await requireOwnedEvent(payload.eventId, profile.client_id ?? "");
    const draftSlug = sanitizePublicRsvpSlug(payload.slug);
    const slugError = validatePublicRsvpSlug(draftSlug);

    if (slugError) {
      throw new ServiceError(slugError);
    }

    const result = await updateWebsiteAccessDraftSlug({
      actorUserId: profile.id,
      clientId: profile.client_id ?? "",
      draftSlug,
      eventId: event.id,
    });

    return actionSuccess({
      draftSlug: result.draftSlug,
      updatedAt: result.updatedAt,
    });
  } catch (error) {
    return actionFailure(error);
  }
}

export async function updateWebsiteAccessDraftSubdomainAction(input: unknown) {
  try {
    const profile = await requireTenantMember();
    const payload = parseActionInput(UpdateWebsiteAccessDraftSubdomainActionSchema, input);
    const event = await requireOwnedEvent(payload.eventId, profile.client_id ?? "");
    const draftSubdomain = sanitizePublicRsvpSlug(payload.subdomain);
    const subdomainError = validatePublicRsvpSlug(draftSubdomain);

    if (draftSubdomain && subdomainError) {
      throw new ServiceError(subdomainError);
    }

    const result = await updateWebsiteAccessDraftSubdomain({
      actorUserId: profile.id,
      clientId: profile.client_id ?? "",
      draftSubdomain: draftSubdomain || null,
      eventId: event.id,
    });

    return actionSuccess({
      draftSubdomain: result.draftSubdomain,
      updatedAt: result.updatedAt,
    });
  } catch (error) {
    return actionFailure(error);
  }
}

export async function publishEventWebsiteAction(input: unknown) {
  try {
    const profile = await requireTenantMember();
    const payload = parseActionInput(PublishEventWebsiteActionSchema, input);
    const event = await requireOwnedEvent(payload.eventId, profile.client_id ?? "");
    const result = await publishEventWebsite({
      actorUserId: profile.id,
      clientId: profile.client_id ?? "",
      confirmWarnings: payload.confirmWarnings,
      eventId: event.id,
    });

    revalidatePath("/dashboard/website-access");
    revalidatePath("/dashboard/event");

    const publicPaths = new Set<string>();
    if (event.event_slug) {
      publicPaths.add(`/r/${event.event_slug}`);
    }
    if (result.previousPublishedSlug) {
      publicPaths.add(`/r/${result.previousPublishedSlug}`);
    }
    if (result.publishedSlug) {
      publicPaths.add(`/r/${result.publishedSlug}`);
    }

    for (const path of publicPaths) {
      revalidatePath(path);
    }

    return actionSuccess(result);
  } catch (error) {
    return actionFailure(error);
  }
}

export async function unpublishEventWebsiteAction(input: unknown) {
  try {
    const profile = await requireTenantMember();
    const payload = parseActionInput(UnpublishEventWebsiteActionSchema, input);
    const event = await requireOwnedEvent(payload.eventId, profile.client_id ?? "");
    const result = await unpublishEventWebsite({
      actorUserId: profile.id,
      clientId: profile.client_id ?? "",
      eventId: event.id,
    });

    revalidatePath("/dashboard/website-access");
    revalidatePath("/dashboard/event");

    const publicPaths = new Set<string>();
    if (event.event_slug) {
      publicPaths.add(`/r/${event.event_slug}`);
    }
    if (result.previousPublishedSlug) {
      publicPaths.add(`/r/${result.previousPublishedSlug}`);
    }

    for (const path of publicPaths) {
      revalidatePath(path);
    }

    return actionSuccess(result);
  } catch (error) {
    return actionFailure(error);
  }
}

async function requireOwnedEvent(eventId: string, clientId: string) {
  const supabase = await createServerSupabaseClient();
  const { data: event, error } = await supabase
    .from("rsvp_events")
    .select("id, client_id, event_slug")
    .eq("id", eventId)
    .eq("client_id", clientId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!clientId || !event || event.client_id !== clientId) {
    throw new PermissionError("The requested event does not belong to the current tenant.");
  }

  return event;
}
