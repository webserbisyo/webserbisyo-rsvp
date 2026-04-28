import { redirect } from "next/navigation";
import { ApplySuccess } from "@/components/apply/apply-success";
import { isApplicationReferenceCode } from "@/lib/apply/reference";
import {
  getPublicApplyConfig,
  getPublicApplicationSuccessSummary,
} from "@/server/queries/public-apply";

export const dynamic = "force-dynamic";

type ApplySuccessPageProps = {
  searchParams: Promise<{
    ref?: string;
  }>;
};

export default async function ApplySuccessPage({ searchParams }: ApplySuccessPageProps) {
  const params = await searchParams;
  const referenceCode = params.ref;

  if (!isApplicationReferenceCode(referenceCode)) {
    redirect("/apply");
  }

  const [config, summary] = await Promise.all([
    getPublicApplyConfig(),
    getPublicApplicationSuccessSummary(referenceCode),
  ]);

  return (
    <ApplySuccess
      messengerPageUrl={config.messengerPageUrl}
      paymentOption={summary?.preferred_manual_payment_option ?? null}
      plan={summary?.preferred_plan ?? null}
      referenceCode={referenceCode}
    />
  );
}
