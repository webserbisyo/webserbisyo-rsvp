import Link from "next/link";
import { CreditCard, FileText, ListChecks, Settings2, Users } from "lucide-react";
import { SectionCard } from "@/components/shared/section-card";
import { Button } from "@/components/ui/button";

const quickActions = [
  {
    href: "/admin/applications",
    icon: ListChecks,
    label: "View Applications",
  },
  {
    href: "/admin/clients",
    icon: Users,
    label: "View Clients",
  },
  {
    href: "/admin/payments",
    icon: CreditCard,
    label: "Manual Payments",
  },
  {
    href: "/admin/payment-options",
    icon: Settings2,
    label: "Payment Options",
  },
  {
    href: "/admin/meta-pixels",
    icon: FileText,
    label: "Meta Pixels",
  },
] as const;

export function QuickActions() {
  return (
    <SectionCard
      title="Quick Actions"
      description="Read-only navigation shortcuts for the main admin work areas."
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
        {quickActions.map((action) => (
          <Button key={action.href} asChild variant="outline" className="justify-start">
            <Link href={action.href}>
              <action.icon className="size-4 shrink-0" />
              <span className="truncate">{action.label}</span>
            </Link>
          </Button>
        ))}
      </div>
    </SectionCard>
  );
}
