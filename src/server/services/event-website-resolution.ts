import "server-only";

export type EventWebsiteResolutionCode =
  | "EVENT_CONTENT_INVALID"
  | "PREVIEW_CONTENT_INVALID";

export class EventWebsiteContentIntegrityError extends Error {
  readonly code: EventWebsiteResolutionCode;
  readonly eventId: string;
  readonly issuePaths: string[];

  constructor(input: {
    code: EventWebsiteResolutionCode;
    eventId: string;
    issuePaths: string[];
  }) {
    super("Persisted Event Website content failed integrity validation.");
    this.name = "EventWebsiteContentIntegrityError";
    this.code = input.code;
    this.eventId = input.eventId;
    this.issuePaths = input.issuePaths.slice(0, 10);
  }
}
