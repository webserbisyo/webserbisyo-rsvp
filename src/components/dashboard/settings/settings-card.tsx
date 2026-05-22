import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type SettingsCardProps = {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function SettingsCard({ children, className, contentClassName }: SettingsCardProps) {
  return (
    <Card
      className={cn(
        "rounded-[1.75rem] border border-[#eadfd4] bg-[linear-gradient(180deg,#fffdf8_0%,#fffaf4_100%)] py-0 shadow-[0_16px_42px_rgba(112,78,51,0.05),0_2px_0_rgba(255,255,255,0.78)_inset]",
        className,
      )}
    >
      <CardContent className={cn("px-6 py-7 sm:px-7", contentClassName)}>{children}</CardContent>
    </Card>
  );
}
