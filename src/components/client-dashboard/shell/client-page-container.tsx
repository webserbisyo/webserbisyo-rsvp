import { cn } from "@/lib/utils";

type ClientPageContainerProps = {
  children: React.ReactNode;
  className?: string;
};

export function ClientPageContainer({ children, className }: ClientPageContainerProps) {
  return (
    <main
      className={cn(
        "mx-auto flex w-full max-w-[var(--client-content-max-width)] flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8",
        className,
      )}
    >
      {children}
    </main>
  );
}
