import { Skeleton } from "@/components/ui/skeleton";

type LoadingSkeletonProps = {
  rows?: number;
  variant?: "cards" | "list";
};

export function LoadingSkeleton({ rows = 3, variant = "cards" }: LoadingSkeletonProps) {
  if (variant === "list") {
    return (
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="bg-card flex items-center gap-3 rounded-lg border p-4">
            <Skeleton className="size-10 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="bg-card space-y-3 rounded-lg border p-4">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      ))}
    </div>
  );
}
