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

  const statusBadgeVariant =
    websiteAccessData.workflowStatus.tone === "success"
      ? "secondary"
      : websiteAccessData.workflowStatus.tone === "warning"
        ? "outline"
        : "outline";

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
              <Badge variant={statusBadgeVariant} className={getStatusBadgeClassName(websiteAccessData.workflowStatus.tone)}>
                {websiteAccessData.workflowStatus.label}
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
                <p className="mt-1 text-xs text-muted-foreground">
                  Current MVP sharing uses this exact fallback route for direct links and QR codes.
                </p>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">Visibility behavior</dt>
                <dd className="font-medium">{getVisibilityLabel(websiteAccessData.visibility)}</dd>
                <p className="mt-1 text-xs text-muted-foreground">
                  {getVisibilityDescription(websiteAccessData.visibility)}
                </p>
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

            {websiteAccessData.eventId ? (
              <WebsiteAccessControls
                eventId={websiteAccessData.eventId}
                publishState={websiteAccessData.publishState}
                workflowStatus={websiteAccessData.workflowStatus}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                Save a draft in Event Website before publishing a public snapshot.
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Invite-code restricted access is planned for a later phase and is not active in the
              current fallback page flow.
            </p>
          </CardContent>
        </Card>

        <Card className="rsvp-panel border-border/70 rounded-3xl">
          <CardHeader className="space-y-2">
            <CardTitle className="text-xl">Draft snapshot status</CardTitle>
            <CardDescription>
              This summary tracks the saved dashboard draft and how it relates to the current
              published snapshot.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={statusBadgeVariant} className={getStatusBadgeClassName(websiteAccessData.workflowStatus.tone)}>
                {websiteAccessData.workflowStatus.label}
              </Badge>
              {websiteAccessData.hasPublishedSnapshot ? (
                <Badge variant="outline">Published snapshot saved</Badge>
              ) : (
                <Badge variant="outline">No published snapshot yet</Badge>
              )}
            </div>

            {websiteAccessData.sectionSummary ? (
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">Active sections</dt>
                  <dd className="font-medium">
                    {websiteAccessData.sectionSummary.activeSectionCount}/
                    {websiteAccessData.sectionSummary.totalSectionCount}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Progress</dt>
                  <dd className="font-medium">{websiteAccessData.sectionSummary.progressPercent}%</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Draft saved</dt>
                  <dd className="font-medium">{formatDateTime(websiteAccessData.draftSavedAt)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Live snapshot</dt>
                  <dd className="font-medium">
                    {formatDateTime(websiteAccessData.snapshotPublishedAt ?? websiteAccessData.publishedAt)}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="text-sm text-muted-foreground">
                No saved Event Website draft is available yet.
              </p>
            )}

            <p className="text-sm text-muted-foreground">{websiteAccessData.workflowStatus.description}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function getStatusBadgeClassName(tone: "neutral" | "success" | "warning") {
  switch (tone) {
    case "success":
      return "border-emerald-200 bg-emerald-50 text-emerald-900";
    case "warning":
      return "border-amber-200 bg-amber-50 text-amber-900";
    default:
      return "border-slate-200 bg-slate-100 text-slate-700";
  }
}

function getVisibilityLabel(visibility: string | null) {
  switch (visibility) {
    case "public":
      return "Public";
    case "unlisted":
      return "Unlisted direct link";
    case "private":
      return "Private direct link";
    default:
      return "Visibility pending";
  }
}

function getVisibilityDescription(visibility: string | null) {
  switch (visibility) {
    case "public":
      return "Anyone with the fallback page link can open the published RSVP page.";
    case "unlisted":
      return "The page is shared by direct link and is not treated as a broadly public listing.";
    case "private":
      return "Only guests with the direct URL or QR link can open the page in the current MVP.";
    default:
      return "Visibility will reflect the current fallback page access mode once configured.";
  }
}
