import { ApplyLanding } from "@/components/apply/apply-landing";
import { getPublicApplyConfig } from "@/server/queries/public-apply";

export const dynamic = "force-dynamic";

export default async function ApplyPage() {
  const config = await getPublicApplyConfig();

  return <ApplyLanding config={config} />;
}
