import * as React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ClientCardProps = React.ComponentProps<typeof Card> & {
  elevation?: "base" | "raised" | "floating";
};

export function ClientCard({ className, elevation = "base", ...props }: ClientCardProps) {
  return (
    <Card
      className={cn(
        "rounded-[var(--client-radius-2xl)] border-[var(--client-border)] text-[var(--client-text)]",
        elevation === "base" && "client-surface-card",
        elevation === "raised" && "client-surface-raised",
        elevation === "floating" && "client-floating-surface",
        className,
      )}
      {...props}
    />
  );
}
