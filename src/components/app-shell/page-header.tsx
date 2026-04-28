import { cn } from "@/lib/utils";

type PageHeaderProps = {
  actions?: React.ReactNode;
  className?: string;
  description?: string;
  title: string;
};

export function PageHeader({ actions, className, description, title }: PageHeaderProps) {
  return (
    <header
      className={cn("flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between", className)}
    >
      <div className="min-w-0 space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        {description ? (
          <p className="text-muted-foreground max-w-3xl text-sm leading-6 sm:text-base">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}
