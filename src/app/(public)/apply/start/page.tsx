import { ApplyForm } from "@/components/apply/apply-form";
import { PublicMetaPixelScripts } from "@/components/meta-pixels/public-meta-pixel-scripts";
import { getPublicApplyConfig } from "@/server/queries/public-apply";
import { getPublicMetaPixelsForRoute } from "@/server/queries/public-meta-pixels";

export const dynamic = "force-dynamic";

type ApplyStartPageProps = {
  searchParams: Promise<{
    plan?: string;
  }>;
};

function normalizePlan(plan: string | undefined): "pro" | "max" {
  return plan === "max" ? "max" : "pro";
}

export default async function ApplyStartPage({ searchParams }: ApplyStartPageProps) {
  const params = await searchParams;
  const [config, pixels] = await Promise.all([
    getPublicApplyConfig(),
    getPublicMetaPixelsForRoute({ route: "application" }),
  ]);
  const initialPlan = normalizePlan(params.plan);

  return (
    <main className="landing-theme-dark relative isolate min-h-screen w-full bg-[var(--landing-bg)] overflow-x-hidden pb-20 pt-16">
      {/* Background Dashed Grid with Fade */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='64' height='64' viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M 64 0 L 0 0 0 64' fill='none' stroke='rgba(255,138,92,0.12)' stroke-width='1' stroke-dasharray='4 4' /%3E%3C/svg%3E")`,
          maskImage: "radial-gradient(ellipse at 50% 50%, transparent 15%, black 50%, black 85%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse at 50% 50%, transparent 15%, black 50%, black 85%, transparent 100%)",
        }}
      />

      {/* Decorative dark background glows */}
      {/* Gold/coral glow center-left */}
      <div
        className="absolute top-1/4 left-1/4 -translate-y-1/2 z-0 size-[600px] rounded-full pointer-events-none bg-[radial-gradient(circle_at_center,rgba(234,179,8,0.03)_0%,rgba(255,138,92,0.02)_40%,transparent_70%)] blur-3xl"
        aria-hidden="true"
      />
      {/* Plum/espresso glow bottom-right */}
      <div
        className="absolute bottom-10 right-1/4 z-0 size-[600px] rounded-full pointer-events-none bg-[radial-gradient(circle_at_center,rgba(60,20,40,0.18)_0%,transparent_70%)] blur-3xl"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <ApplyForm config={config} initialPlan={initialPlan} />
      </div>
      <PublicMetaPixelScripts eventName="InitiateCheckout" pixels={pixels} />
    </main>
  );
}
