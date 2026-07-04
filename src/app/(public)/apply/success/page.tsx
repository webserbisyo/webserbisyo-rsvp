import type { Metadata } from "next";
import { ApplySuccess } from "@/components/apply/apply-success";
import { PublicMetaPixelScripts } from "@/components/meta-pixels/public-meta-pixel-scripts";
import { isApplicationReferenceCode } from "@/lib/apply/reference";
import {
  getPublicApplyConfig,
  getPublicApplicationSuccessSummary,
} from "@/server/queries/public-apply";
import { getPublicMetaPixelsForRoute } from "@/server/queries/public-meta-pixels";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  alternates: {
    canonical: "https://rsvp.webserbisyo.com/apply/success",
  },
  description:
    "Your WebSerbisyo RSVP application has been received. Save your reference code and continue through Messenger for the next steps.",
  robots: {
    follow: false,
    index: false,
  },
  title: {
    absolute: "Application Received | WebSerbisyo RSVP",
  },
};

type ApplySuccessPageProps = {
  searchParams: Promise<{
    ref?: string;
  }>;
};

function getSuccessEventParams(plan: string | null | undefined) {
  const baseParams = {
    content_category: "RSVP Website Lead",
    content_name: "WebSerbisyo RSVP Application Submitted",
    source_route: "/apply/success",
  };

  if (plan === "max") {
    return {
      ...baseParams,
      currency: "PHP",
      plan: "max",
      value: 3599,
    };
  }

  if (plan === "pro") {
    return {
      ...baseParams,
      currency: "PHP",
      plan: "pro",
      value: 1599,
    };
  }

  return baseParams;
}

export default async function ApplySuccessPage({ searchParams }: ApplySuccessPageProps) {
  const params = await searchParams;
  const referenceCode = isApplicationReferenceCode(params.ref) ? params.ref : null;
  const leadEventId = referenceCode ? `Lead:${referenceCode}` : null;

  const [config, summary, pixels] = await Promise.all([
    getPublicApplyConfig(),
    referenceCode ? getPublicApplicationSuccessSummary(referenceCode) : Promise.resolve(null),
    getPublicMetaPixelsForRoute({ route: "application" }),
  ]);

  return (
    <main className="landing-theme-dark relative isolate min-h-screen w-full overflow-x-hidden bg-[var(--landing-bg)] pt-16 pb-20">
      {/* Background Dashed Grid with Fade */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='64' height='64' viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M 64 0 L 0 0 0 64' fill='none' stroke='rgba(255,138,92,0.12)' stroke-width='1' stroke-dasharray='4 4' /%3E%3C/svg%3E")`,
          maskImage:
            "radial-gradient(ellipse at 50% 50%, transparent 15%, black 50%, black 85%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at 50% 50%, transparent 15%, black 50%, black 85%, transparent 100%)",
        }}
      />

      {/* Decorative dark background glows */}
      {/* Gold/coral glow center-left */}
      <div
        className="pointer-events-none absolute top-1/4 left-1/4 z-0 size-[600px] -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(234,179,8,0.03)_0%,rgba(255,138,92,0.02)_40%,transparent_70%)] blur-3xl"
        aria-hidden="true"
      />
      {/* Plum/espresso glow bottom-right */}
      <div
        className="pointer-events-none absolute right-1/4 bottom-10 z-0 size-[600px] rounded-full bg-[radial-gradient(circle_at_center,rgba(60,20,40,0.18)_0%,transparent_70%)] blur-3xl"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <ApplySuccess
          messengerPageUrl={config.messengerPageUrl}
          paymentOption={summary?.preferred_manual_payment_option ?? null}
          plan={summary?.preferred_plan ?? null}
          referenceCode={referenceCode}
        />
      </div>
      <PublicMetaPixelScripts
        eventName={["Lead", "CompleteRegistration"]}
        eventOptionsByName={leadEventId ? { Lead: { eventID: leadEventId } } : undefined}
        eventParams={getSuccessEventParams(summary?.preferred_plan)}
        executionKey={`apply-success-${referenceCode ?? "missing"}`}
        pixels={pixels}
      />
    </main>
  );
}
