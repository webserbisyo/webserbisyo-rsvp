import { Clock3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ComingSoonCardProps = {
  className?: string;
  description: string;
  title?: string;
};

export function ComingSoonCard({
  className,
  description,
  title = "Coming soon",
}: ComingSoonCardProps) {
  return (
    <Card className={cn("border-rsvp-border bg-rsvp-surface shadow-none", className)}>
      <CardContent className="flex items-start gap-4 px-4 py-5">
        <div className="bg-rsvp-accent text-rsvp-accent-foreground flex size-10 shrink-0 items-center justify-center rounded-lg">
          <Clock3 className="size-5" />
        </div>
        <div className="space-y-1">
          <h2 className="font-medium">{title}</h2>
          <p className="text-muted-foreground text-sm leading-6">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}
