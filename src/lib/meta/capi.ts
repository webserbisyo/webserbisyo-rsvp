import "server-only";

export type MetaCapiEventInput = {
  amount: number;
  currency: "PHP";
  eventId: string;
  pixelId?: string | null;
  testEventCode?: string | null;
};

export async function sendMetaCapiEvent(input: MetaCapiEventInput) {
  return {
    eventId: input.eventId,
    reason: "Meta CAPI network delivery is deferred for Phase 1 backend foundation.",
    status: "skipped" as const,
  };
}
