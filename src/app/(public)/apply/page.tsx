import { ApplyLanding } from "@/components/apply/apply-landing";
import { PublicMetaPixelScripts } from "@/components/meta-pixels/public-meta-pixel-scripts";
import { getPublicApplyConfig } from "@/server/queries/public-apply";
import { getPublicMetaPixelsForRoute } from "@/server/queries/public-meta-pixels";

export const dynamic = "force-dynamic";

export default async function ApplyPage() {
  const [config, pixels] = await Promise.all([
    getPublicApplyConfig(),
    getPublicMetaPixelsForRoute({ route: "application" }),
  ]);

  return (
    <>
      <ApplyLanding config={config} />
      <PublicMetaPixelScripts eventName="ViewContent" pixels={pixels} />
    </>
  );
}
