import { ApplyForm } from "@/components/apply/apply-form";
import { getPublicApplyConfig } from "@/server/queries/public-apply";

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
  const config = await getPublicApplyConfig();
  const initialPlan = normalizePlan(params.plan);

  return (
    <main className="rsvp-shell min-h-screen">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <section className="space-y-3">
          <p className="text-rsvp-brand text-sm font-semibold tracking-[0.22em] uppercase">
            Application
          </p>
          <h1 className="text-4xl font-semibold tracking-tight">
            Start your WebSerbisyo RSVP setup
          </h1>
          <p className="text-muted-foreground max-w-3xl text-base leading-7">
            Submit your event details, choose your preferred plan, and pick the manual payment
            option that best fits your follow-up conversation with the team.
          </p>
        </section>
        <ApplyForm config={config} initialPlan={initialPlan} />
      </div>
    </main>
  );
}
