import { cn } from "@/lib/utils";

type ClientPageHeaderProps = {
  className?: string;
  description: string;
  title: string;
};

export function ClientPageHeader({ className, description, title }: ClientPageHeaderProps) {
  return (
    <header className={cn("space-y-3", className)}>
      <p className="text-xs font-semibold tracking-[0.24em] text-[var(--client-text-soft)] uppercase">
        RSVP client portal
      </p>
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--client-text)] sm:text-4xl">
          {title}
        </h1>
        <p className="max-w-2xl text-sm leading-7 text-[var(--client-text-muted)] sm:text-base">
          {description}
        </p>
      </div>
    </header>
  );
}
