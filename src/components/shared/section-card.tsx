import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type SectionCardProps = {
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  description?: string;
  title: string;
};

export function SectionCard({
  actions,
  children,
  className,
  description,
  title,
}: SectionCardProps) {
  return (
    <Card className={cn("border-border/80 shadow-none", className)}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle>{title}</CardTitle>
            {description ? <CardDescription>{description}</CardDescription> : null}
          </div>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
