import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ClientButtonProps = React.ComponentProps<typeof Button> & {
  tone?: "accent" | "ghost" | "outline" | "soft";
};

export function ClientButton({ className, tone = "soft", variant, ...props }: ClientButtonProps) {
  return (
    <Button
      variant={variant ?? (tone === "ghost" ? "ghost" : tone === "outline" ? "outline" : "default")}
      className={cn(
        "client-focus-ring rounded-[var(--client-radius-md)] transition-all",
        tone === "accent" &&
          "border-transparent bg-[var(--client-accent)] text-white hover:bg-[var(--client-accent-hover)]",
        tone === "soft" &&
          "border-transparent bg-[var(--client-accent-soft)] text-[var(--client-accent-hover)] hover:bg-[color-mix(in_srgb,var(--client-accent-soft)_76%,white_24%)]",
        tone === "outline" &&
          "border-[var(--client-border)] bg-white/80 text-[var(--client-text)] hover:bg-white",
        tone === "ghost" &&
          "text-[var(--client-text-muted)] hover:bg-white/72 hover:text-[var(--client-text)]",
        className,
      )}
      {...props}
    />
  );
}
