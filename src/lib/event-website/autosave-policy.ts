export type PersistenceState = "conflict" | "error" | "retrying" | "saved" | "saving" | "unsaved";

export function getAutosaveRetryDelay(attempt: number) {
  return Math.min(4_000, 1_000 * 2 ** Math.max(0, attempt - 1));
}

export function shouldAdoptEventWebsiteServerSnapshot(input: {
  currentEventId: string | null;
  incomingEventId: string | null;
  isDirty: boolean;
  persistenceState: PersistenceState;
}) {
  return (
    input.currentEventId === input.incomingEventId &&
    !input.isDirty &&
    input.persistenceState === "saved"
  );
}

export function shouldAcknowledgeClientSequence(
  acknowledgedSequence: number,
  returnedSequence: number,
) {
  return returnedSequence >= acknowledgedSequence;
}

export function getPublicationRevisionState(input: {
  isPublished: boolean;
  publishedRevision: number;
  savedRevision: number;
}) {
  if (!input.isPublished) {
    return "not_published" as const;
  }

  return input.publishedRevision < input.savedRevision
    ? ("draft_changes_not_published" as const)
    : ("published" as const);
}
