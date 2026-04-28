import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusTone = "default" | "success" | "warning" | "muted" | "danger";

type StatusBadgeProps = {
  children: React.ReactNode;
  className?: string;
  tone?: StatusTone;
};

const toneClasses: Record<StatusTone, string> = {
  danger: "bg-destructive/10 text-destructive hover:bg-destructive/10",
  default: "bg-rsvp-brand text-rsvp-brand-foreground hover:bg-rsvp-brand",
  muted: "bg-muted text-muted-foreground hover:bg-muted",
  success: "bg-rsvp-success/18 text-foreground hover:bg-rsvp-success/18",
  warning: "bg-rsvp-warning/24 text-foreground hover:bg-rsvp-warning/24",
};

export function StatusBadge({ children, className, tone = "default" }: StatusBadgeProps) {
  return <Badge className={cn(toneClasses[tone], className)}>{children}</Badge>;
}
