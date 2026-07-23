import { Check } from "lucide-react";
import { MAX_PRICING_PLAN } from "@/lib/pricing-plans";

export function MaxPlanFeatureList() {
  return (
    <ul className="mb-8 space-y-3.5" data-pricing-plan-features="max">
      {MAX_PRICING_PLAN.features.map((feature) => (
        <li
          key={feature.label}
          data-feature-emphasis={feature.emphasis}
          className={`flex items-start gap-3 ${
            feature.emphasis === "featured"
              ? "-mx-3 rounded-xl border border-amber-300/10 bg-gradient-to-r from-[#ff8a5c]/10 via-amber-400/[0.06] to-transparent px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
              : ""
          }`}
        >
          <Check
            className={`mt-0.5 size-4 shrink-0 ${
              feature.emphasis === "featured"
                ? "text-amber-300"
                : feature.emphasis === "exclusive"
                  ? "text-[#ff9f7a]"
                  : "text-[#ff8a5c]"
            }`}
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span
                className={`text-sm leading-snug ${
                  feature.emphasis === "featured"
                    ? "font-semibold text-[#ffe1d2]"
                    : feature.emphasis === "exclusive"
                      ? "font-medium text-[#ffc4aa]"
                      : "text-white/80"
                }`}
              >
                {feature.label}
              </span>
              {"badge" in feature ? (
                <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-amber-200/90 uppercase">
                  {feature.badge}
                </span>
              ) : null}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
