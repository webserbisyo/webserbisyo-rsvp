import { Inbox } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  action?: React.ReactNode;
  className?: string;
  description: string;
  icon?: React.ReactNode;
  title: string;
};

export function EmptyState({ action, className, description, icon, title }: EmptyStateProps) {
  return (
    <Card className={cn("bg-card/70 border-dashed shadow-none", className)}>
      <CardContent className="flex flex-col items-center gap-4 px-4 py-10 text-center">
        <div className="bg-muted text-muted-foreground flex size-12 items-center justify-center rounded-lg">
          {icon ?? <Inbox className="size-5" />}
        </div>
        <div className="max-w-md space-y-2">
          <h2 className="text-base font-semibold">{title}</h2>
          <p className="text-muted-foreground text-sm leading-6">{description}</p>
        </div>
        {action ? <div>{action}</div> : null}
      </CardContent>
    </Card>
  );
}
