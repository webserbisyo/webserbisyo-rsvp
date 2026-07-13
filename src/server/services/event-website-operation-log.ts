import "server-only";

type EventWebsiteOperationLog = {
  category?: string;
  clientSequence?: number;
  eventId: string;
  expectedRevision?: number;
  operation: "draft_preview" | "draft_save" | "publish";
  returnedRevision?: number;
  stage: "authorization_failed" | "failed" | "started" | "succeeded" | "conflict";
};

export function logEventWebsiteOperation(
  level: "error" | "info" | "warn",
  entry: EventWebsiteOperationLog,
) {
  const payload = {
    scope: "event_website",
    ...entry,
  };

  if (level === "error") {
    console.error(JSON.stringify(payload));
    return;
  }

  console.warn(JSON.stringify(payload));
}
