import { ApplySuccess } from "@/components/apply/apply-success";
import { PublicMetaPixelScripts } from "@/components/meta-pixels/public-meta-pixel-scripts";
import { isApplicationReferenceCode } from "@/lib/apply/reference";
import {
  getPublicApplyConfig,
  getPublicApplicationSuccessSummary,
} from "@/server/queries/public-apply";
import { getPublicMetaPixelsForRoute } from "@/server/queries/public-meta-pixels";

export const dynamic = "force-dynamic";

type ApplySuccessPageProps = {
  searchParams: Promise<{
    ref?: string;
  }>;
};

export default async function ApplySuccessPage({ searchParams }: ApplySuccessPageProps) {
  const params = await searchParams;
  const referenceCode = isApplicationReferenceCode(params.ref) ? params.ref : null;

  const [config, summary, pixels] = await Promise.all([
    getPublicApplyConfig(),
    referenceCode ? getPublicApplicationSuccessSummary(referenceCode) : Promise.resolve(null),
    getPublicMetaPixelsForRoute({ route: "application" }),
  ]);

  return (
    <>
      <ApplySuccess
        messengerPageUrl={config.messengerPageUrl}
        paymentOption={summary?.preferred_manual_payment_option ?? null}
        plan={summary?.preferred_plan ?? null}
        referenceCode={referenceCode}
      />
      <PublicMetaPixelScripts eventName={["Lead", "CompleteRegistration"]} pixels={pixels} />
    </>
  );
}
