import "server-only";

import { randomBytes } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizePrivateAccessToken } from "@/lib/private-access";
import { ServiceError } from "./service-error";
import { writeAuditLog } from "./write-audit-log";

const MAX_GENERATION_ATTEMPTS = 5;

type RotatePrivateAccessTokenInput = {
  actorUserId: string;
  clientId: string;
  eventId: string;
  previousToken?: string | null;
};

type EnsurePrivateAccessTokenInput = {
  clientId: string;
  currentToken?: string | null;
  eventId: string;
};

export async function ensurePrivateAccessToken(input: EnsurePrivateAccessTokenInput) {
  const existingToken = normalizePrivateAccessToken(input.currentToken);

  if (existingToken) {
    return existingToken;
  }

  const supabase = createAdminClient();

  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt += 1) {
    const nextToken = generatePrivateAccessToken();
    const rotatedAt = new Date().toISOString();
    const { data, error } = await supabase
      .from("rsvp_events")
      .update({
        private_access_token: nextToken,
        private_access_token_rotated_at: rotatedAt,
      })
      .eq("id", input.eventId)
      .eq("client_id", input.clientId)
      .is("private_access_token", null)
      .select("private_access_token")
      .maybeSingle();

    if (!error && data?.private_access_token) {
      return data.private_access_token;
    }

    if (!isPrivateTokenUniqueViolation(error)) {
      if (!error) {
        const { data: currentRow, error: currentError } = await supabase
          .from("rsvp_events")
          .select("private_access_token")
          .eq("id", input.eventId)
          .eq("client_id", input.clientId)
          .maybeSingle();

        if (currentError) {
          throw new ServiceError("Failed to verify the event private link.");
        }

        const persistedToken = normalizePrivateAccessToken(
          currentRow?.private_access_token ?? null,
        );

        if (persistedToken) {
          return persistedToken;
        }
      }

      throw new ServiceError("Failed to prepare the event private link.");
    }
  }

  throw new ServiceError("Could not generate a unique private link.");
}

export async function rotatePrivateAccessToken(input: RotatePrivateAccessTokenInput) {
  const supabase = createAdminClient();

  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt += 1) {
    const nextToken = generatePrivateAccessToken();
    const rotatedAt = new Date().toISOString();
    const { data, error } = await supabase
      .from("rsvp_events")
      .update({
        private_access_token: nextToken,
        private_access_token_rotated_at: rotatedAt,
        website_access_updated_at: rotatedAt,
      })
      .eq("id", input.eventId)
      .eq("client_id", input.clientId)
      .select("private_access_token, private_access_token_rotated_at, website_access_updated_at")
      .single();

    if (error) {
      if (isPrivateTokenUniqueViolation(error)) {
        continue;
      }

      throw new ServiceError("Failed to regenerate the private link.", error);
    }

    await writeAuditLog({
      action: "website_access_private_link_regenerated",
      actorUserId: input.actorUserId,
      clientId: input.clientId,
      entityId: input.eventId,
      entityType: "rsvp_events",
      eventId: input.eventId,
      metadata: {
        previous_private_access_token_preview: previewToken(input.previousToken),
        next_private_access_token_preview: previewToken(data.private_access_token),
      },
    });

    const privateAccessToken = normalizePrivateAccessToken(data.private_access_token);

    if (!privateAccessToken) {
      throw new ServiceError("Failed to regenerate the private link.");
    }

    return {
      privateAccessToken,
      rotatedAt: data.private_access_token_rotated_at,
      updatedAt: data.website_access_updated_at,
    };
  }

  throw new ServiceError("Could not generate a unique private link.");
}

function generatePrivateAccessToken() {
  return randomBytes(32).toString("base64url");
}

function isPrivateTokenUniqueViolation(error: unknown) {
  return Boolean(
    error &&
    typeof error === "object" &&
    "code" in error &&
    (error as { code?: string }).code === "23505",
  );
}

function previewToken(value?: string | null) {
  const token = normalizePrivateAccessToken(value);

  if (!token) {
    return null;
  }

  return `${token.slice(0, 6)}…${token.slice(-4)}`;
}
