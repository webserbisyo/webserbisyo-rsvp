import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatCardProps = {
  caption?: string;
  className?: string;
  icon: LucideIcon;
  label: string;
  value: string;
};

export function StatCard({ caption, className, icon: Icon, label, value }: StatCardProps) {
  return (
    <Card className={cn("border-border/80 shadow-none", className)}>
      <CardContent className="flex items-start justify-between gap-4 px-4 py-5">
        <div className="space-y-2">
          <p className="text-muted-foreground text-sm">{label}</p>
          <p className="text-3xl font-semibold tracking-tight">{value}</p>
          {caption ? <p className="text-muted-foreground text-xs leading-5">{caption}</p> : null}
        </div>
        <div className="bg-rsvp-accent text-rsvp-accent-foreground flex size-10 items-center justify-center rounded-lg">
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  );
}
