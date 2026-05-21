import { WebsiteAccessPage } from "@/components/dashboard/website-access/website-access-page";
import { getWebsiteAccessData } from "@/server/queries/website-access";

export default async function DashboardWebsiteAccessPage() {
  const initialData = await getWebsiteAccessData();
  const pageStateKey = [
    initialData.eventId ?? "no-event",
    initialData.publishState,
    initialData.publishedSlug ?? "",
    initialData.draftSlug ?? "",
    initialData.publishedVisibility,
    initialData.draftVisibility,
    initialData.publishedAt ?? "",
    initialData.websiteAccessUpdatedAt ?? "",
    initialData.contentDraftSavedAt ?? "",
  ].join("|");

  return <WebsiteAccessPage key={pageStateKey} initialData={initialData} />;
}
