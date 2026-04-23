import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Stats Card Skeleton Component
 * Used for dashboard stats cards loading state
 */
export function StatsCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-16" />
      </CardContent>
    </Card>
  );
}

/**
 * Table Skeleton Component
 * Used for data tables loading state
 * @param props.rowCount - Number of rows to display (default: 5)
 * @param props.columnCount - Number of columns to display (default: 4)
 */
interface TableSkeletonProps {
  rowCount?: number;
  columnCount?: number;
}

export function TableSkeleton({
  rowCount = 5,
  columnCount = 4,
}: TableSkeletonProps) {
  return (
    <div className="space-y-4">
      {/* Search bar skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 max-w-sm">
          <Skeleton className="h-4 w-4" /> {/* Search icon */}
          <Skeleton className="h-9 w-64" /> {/* Input */}
        </div>
        <Skeleton className="h-9 w-28" /> {/* Add button */}
      </div>

      {/* Table skeleton */}
      <div className="rounded-md border">
        <div className="border-b">
          <div className="flex">
            {Array.from({ length: columnCount }).map((_, i) => (
              <div key={i} className="flex-1 p-4">
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </div>
        <div>
          {Array.from({ length: rowCount }).map((_, rowIndex) => (
            <div key={rowIndex} className="flex border-b last:border-0">
              {Array.from({ length: columnCount }).map((_, colIndex) => (
                <div key={colIndex} className="flex-1 p-4">
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Pagination skeleton */}
      <div className="flex items-center justify-end space-x-2">
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-9 w-16" />
      </div>
    </div>
  );
}

/**
 * Form Skeleton Component
 * Used for form pages loading state
 * @param props.fieldCount - Number of form fields to display (default: 4)
 */
interface FormSkeletonProps {
  fieldCount?: number;
}

export function FormSkeleton({ fieldCount = 4 }: FormSkeletonProps) {
  return (
    <div className="space-y-4">
      {Array.from({ length: fieldCount }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" /> {/* Label */}
          <Skeleton className="h-10 w-full" /> {/* Input */}
        </div>
      ))}
      <Skeleton className="h-10 w-full mt-6" /> {/* Submit button */}
    </div>
  );
}

/**
 * Detail Page Skeleton Component
 * Used for detail/shipment detail pages loading state
 */
export function DetailPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" /> {/* Back button */}
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" /> {/* Title */}
          <Skeleton className="h-4 w-32" /> {/* Subtitle */}
        </div>
        <Skeleton className="h-6 w-20 ml-auto" /> {/* Status badge */}
      </div>

      {/* Main content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Shipment details card */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-5 w-32" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-5 w-32" />
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-5 w-48" />
              </div>
            </CardContent>
          </Card>

          {/* Journey legs card */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-20" />
                      <Skeleton className="h-4 w-40" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar skeleton */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-24" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-4 w-4 mt-1" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-20" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

/**
 * Step Indicator Skeleton Component
 * Used for multi-step forms loading state
 * @param props.stepCount - Number of steps to display (default: 3)
 */
interface StepIndicatorSkeletonProps {
  stepCount?: number;
}

export function StepIndicatorSkeleton({
  stepCount = 3,
}: StepIndicatorSkeletonProps) {
  return (
    <div className="flex items-center justify-between">
      {Array.from({ length: stepCount }).map((_, index) => (
        <div key={index} className="flex items-center">
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="ml-2 h-4 w-20 hidden sm:block" />
          {index < stepCount - 1 && (
            <Skeleton className="w-12 sm:w-24 h-px mx-2 sm:mx-4" />
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * Card Grid Skeleton Component
 * Used for dashboard or list card views loading state
 * @param props.cardCount - Number of cards to display (default: 4)
 */
interface CardGridSkeletonProps {
  cardCount?: number;
}

export function CardGridSkeleton({ cardCount = 4 }: CardGridSkeletonProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: cardCount }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * List Item Skeleton Component
 * Used for list views loading state
 * @param props.itemCount - Number of items to display (default: 5)
 */
interface ListSkeletonProps {
  itemCount?: number;
}

export function ListSkeleton({ itemCount = 5 }: ListSkeletonProps) {
  return (
    <div className="space-y-4">
      {Array.from({ length: itemCount }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between border-b pb-4 last:border-0"
        >
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
      ))}
    </div>
  );
}

/**
 * Simple Skeleton Wrapper
 * Re-export for convenience
 */
export { Skeleton };
