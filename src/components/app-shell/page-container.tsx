import { cn } from "@/lib/utils";

type PageContainerProps = {
  children: React.ReactNode;
  className?: string;
};

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <main
      className={cn(
        "mx-auto flex w-full max-w-[var(--admin-page-max-width)] flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8",
        className,
      )}
    >
      {children}
    </main>
  );
}
