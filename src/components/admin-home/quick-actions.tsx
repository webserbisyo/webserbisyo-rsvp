import Link from "next/link";
import { FileText, ListChecks, Settings2, Users } from "lucide-react";
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
    href: "/admin/settings",
    icon: Settings2,
    label: "Package Settings",
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
      description="Navigation shortcuts for the main admin workflow areas."
      className="h-full"
    >
      <div className="grid min-h-[15.5rem] gap-3 sm:grid-cols-2 xl:grid-cols-1">
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
