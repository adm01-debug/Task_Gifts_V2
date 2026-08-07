import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface MobileSkeletonProps {
  variant?: "card" | "list" | "stats" | "header" | "profile" | "feed";
  count?: number;
  className?: string;
}

export function MobileSkeleton({ variant = "card", count = 1, className }: MobileSkeletonProps) {
  const items = Array.from({ length: count }, (_, i) => i);

  const renderVariant = () => {
    switch (variant) {
      case "header":
        return (
          <div className="flex items-center justify-between p-4">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
        );

      case "stats":
        return (
          <div className="grid grid-cols-2 gap-3 p-4">
            {items.map((i) => (
              <div key={i} className="bg-card rounded-xl p-4 border border-border">
                <Skeleton className="h-4 w-16 mb-2" />
                <Skeleton className="h-8 w-24 mb-1" />
                <Skeleton className="h-3 w-20" />
              </div>
            ))}
          </div>
        );

      case "list":
        return (
          <div className="space-y-3 p-4">
            {items.map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border">
                <Skeleton className="h-12 w-12 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-8 w-16 rounded-lg" />
              </div>
            ))}
          </div>
        );

      case "profile":
        return (
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-20 w-20 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-card rounded-xl p-3 border border-border text-center">
                  <Skeleton className="h-6 w-12 mx-auto mb-1" />
                  <Skeleton className="h-3 w-16 mx-auto" />
                </div>
              ))}
            </div>
          </div>
        );

      case "feed":
        return (
          <div className="space-y-4 p-4">
            {items.map((i) => (
              <div key={i} className="bg-card rounded-xl p-4 border border-border space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <Skeleton className="h-16 w-full rounded-lg" />
                <div className="flex gap-4">
                  <Skeleton className="h-8 w-16 rounded-lg" />
                  <Skeleton className="h-8 w-16 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        );

      case "card":
      default:
        return (
          <div className={cn("space-y-3 p-4", className)}>
            {items.map((i) => (
              <div key={i} className="bg-card rounded-xl p-4 border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <div className="flex gap-2 pt-2">
                  <Skeleton className="h-8 flex-1 rounded-lg" />
                  <Skeleton className="h-8 w-8 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        );
    }
  };

  return <div className={className}>{renderVariant()}</div>;
}

// Preset exports for common use cases
export function MobileHeaderSkeleton() {
  return <MobileSkeleton variant="header" />;
}

export function MobileStatsSkeleton({ count = 4 }: { count?: number }) {
  return <MobileSkeleton variant="stats" count={count} />;
}

export function MobileListSkeleton({ count = 5 }: { count?: number }) {
  return <MobileSkeleton variant="list" count={count} />;
}

export function MobileProfileSkeleton() {
  return <MobileSkeleton variant="profile" />;
}

export function MobileFeedSkeleton({ count = 3 }: { count?: number }) {
  return <MobileSkeleton variant="feed" count={count} />;
}

export function MobileCardSkeleton({ count = 3 }: { count?: number }) {
  return <MobileSkeleton variant="card" count={count} />;
}
