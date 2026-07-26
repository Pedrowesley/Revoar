import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-lg", className)} />;
}

export function PageSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="mx-auto max-w-4xl animate-fade-up space-y-4 px-4 py-10">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-4 w-80" />
      <div className="space-y-3 pt-4">
        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton key={index} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
