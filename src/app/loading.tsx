import { Skeleton } from "@/components/feedback/Skeleton";

/**
 * Root loading boundary. Routes that have richer skeletons (results, cook)
 * own their own `loading.tsx`; this one fires for plain navigations and
 * stays intentionally neutral so it doesn't promise a layout the next
 * screen won't deliver.
 */
export default function Loading() {
  return (
    <div className="flex flex-col">
      <header className="px-5 pt-[max(env(safe-area-inset-top,1rem),3.5rem)] pb-2">
        <Skeleton className="h-7 w-32" />
      </header>
      <div className="flex flex-col gap-3 px-5 pt-4">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}
