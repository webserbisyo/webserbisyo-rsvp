import { cn } from "@/lib/utils";

type ClientPageHeaderProps = {
  className?: string;
  description: string;
  title: string;
};

export function ClientPageHeader({ className, description, title }: ClientPageHeaderProps) {
  return (
    <header
      className={cn(
        "client-page-band rounded-[var(--client-radius-2xl)] px-5 py-5 sm:px-7 sm:py-6",
        className,
      )}
    >
      <p className="text-xs font-semibold tracking-[0.24em] text-[var(--client-accent-hover)] uppercase">
        RSVP client portal
      </p>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-[var(--client-text)] sm:text-3xl">{title}</h1>
        <p className="max-w-2xl text-sm leading-7 text-[var(--client-text-muted)] sm:text-base">
          {description}
        </p>
      </div>
    </header>
  );
}
