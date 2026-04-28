import { cn } from "@/lib/utils";

type MobileTopHeaderProps = {
  actions?: React.ReactNode;
  className?: string;
  title: string;
};

export function MobileTopHeader({ actions, className, title }: MobileTopHeaderProps) {
  return (
    <header
      className={cn(
        "bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-30 flex h-[var(--admin-mobile-header-height)] items-center justify-between border-b px-4 backdrop-blur md:hidden",
        className,
      )}
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{title}</p>
      </div>
      <div className="flex min-w-8 justify-end">{actions}</div>
    </header>
  );
}
