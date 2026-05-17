import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WebsiteAccessControls } from "@/components/dashboard/event/website-access-controls";
import { getWebsiteAccessData } from "@/server/queries/website-access";

function formatDateTime(value: string | null) {
  if (!value) {
    return "Not set";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(date);
}

export default async function DashboardWebsiteAccessPage() {
  const websiteAccessData = await getWebsiteAccessData();

  if (!websiteAccessData.eventId) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-medium" style={{ color: "var(--dash-foreground)" }}>
          Website Access
        </h1>
        <p className="text-sm" style={{ color: "var(--dash-muted)" }}>
          No event is available for publish controls yet.
        </p>
      </div>
    );
  }

  const readiness = websiteAccessData.readiness;
  const readinessLabel =
    !readiness || readiness.blockerCount > 0
      ? "Needs review"
      : readiness.warningCount > 0
        ? "Ready with warnings"
        : "Ready";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-medium" style={{ color: "var(--dash-foreground)" }}>
        Website Access
      </h1>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <Card className="rsvp-panel border-border/70 rounded-3xl">
          <CardHeader className="space-y-2">
            <CardTitle className="text-xl">Publish controls</CardTitle>
            <CardDescription>
              Website Access controls the live publish state. Draft editing stays in Event Website.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={websiteAccessData.publishState === "published" ? "default" : "outline"}>
                {websiteAccessData.publishState === "published" ? "Published" : "Not published"}
              </Badge>
              <Badge variant="outline">{websiteAccessData.visibility ?? "Visibility pending"}</Badge>
              <Badge variant="outline">{websiteAccessData.status ?? "Draft"}</Badge>
            </div>

            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Slug</dt>
                <dd className="font-medium">{websiteAccessData.eventSlug ?? "Not set"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Fallback page</dt>
                <dd className="font-medium">
                  {websiteAccessData.fallbackPageEnabled ? "Enabled" : "Disabled"}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">Public path</dt>
                <dd className="font-medium">/r/{websiteAccessData.eventSlug ?? "event-slug"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Published at</dt>
                <dd className="font-medium">{formatDateTime(websiteAccessData.publishedAt)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Snapshot updated</dt>
                <dd className="font-medium">
                  {formatDateTime(websiteAccessData.snapshotPublishedAt)}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Custom frontend</dt>
                <dd className="font-medium">
                  {websiteAccessData.customFrontendEnabled ? "Enabled" : "Disabled"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Custom frontend URL</dt>
                <dd className="font-medium break-all">
                  {websiteAccessData.customFrontendUrl ?? "Not connected"}
                </dd>
              </div>
            </dl>

            {readiness ? (
              <WebsiteAccessControls
                eventId={websiteAccessData.eventId}
                publishState={websiteAccessData.publishState}
                readiness={readiness}
              />
            ) : null}
          </CardContent>
        </Card>

        <Card className="rsvp-panel border-border/70 rounded-3xl">
          <CardHeader className="space-y-2">
            <CardTitle className="text-xl">Saved draft readiness</CardTitle>
            <CardDescription>
              This summary checks the saved dashboard draft that will be used for publishing.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant={
                  !readiness || readiness.blockerCount > 0
                    ? "destructive"
                    : readiness.warningCount > 0
                      ? "outline"
                      : "secondary"
                }
              >
                {readinessLabel}
              </Badge>
              {websiteAccessData.hasPublishedSnapshot ? (
                <Badge variant="outline">Published snapshot saved</Badge>
              ) : (
                <Badge variant="outline">No published snapshot yet</Badge>
              )}
            </div>

            {readiness ? (
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">Ready sections</dt>
                  <dd className="font-medium">
                    {readiness.readySectionCount}/{readiness.totalSectionCount}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Progress</dt>
                  <dd className="font-medium">{readiness.progressPercent}%</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Blockers</dt>
                  <dd className="font-medium text-[var(--dash-destructive)]">
                    {readiness.blockerCount}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Warnings</dt>
                  <dd className="font-medium text-[var(--dash-warning)]">
                    {readiness.warningCount}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="text-sm text-muted-foreground">
                No saved Event Website draft is available yet.
              </p>
            )}

            <p className="text-sm text-muted-foreground">
              Public rendering is still disabled in this phase. Publishing only creates or clears
              the approved snapshot and live status metadata.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
