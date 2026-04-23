import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="p-4">
      <Skeleton className="h-8 w-48 mb-8" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-6">
            <Skeleton className="h-4 w-32 mb-4" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>

      <div className="border rounded-lg p-6">
        <Skeleton className="h-6 w-40 mb-6" />
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-12 flex-1" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
