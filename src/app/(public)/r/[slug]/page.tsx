import { PublicMetaPixelScripts } from "@/components/meta-pixels/public-meta-pixel-scripts";
import { getPublicMetaPixelsForRoute } from "@/server/queries/public-meta-pixels";

type PublicRsvpPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function PublicRsvpPage({ params }: PublicRsvpPageProps) {
  const { slug } = await params;
  const pixels = await getPublicMetaPixelsForRoute({
    eventSlug: slug,
    route: "event_page",
  });

  return (
    <main className="p-6">
      Public RSVP placeholder for {slug}.
      <PublicMetaPixelScripts eventName="ViewContent" pixels={pixels} />
    </main>
  );
}
