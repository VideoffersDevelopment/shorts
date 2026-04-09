import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface FeedSkeletonProps {
  count?: number
  className?: string
}

export function FeedSkeleton({ count = 8, className }: FeedSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={cn('relative aspect-[9/16] rounded-2xl overflow-hidden', className)}
        >
          <Skeleton className="absolute inset-0" />

          {/* Stats placeholder */}
          <div className="absolute top-3 left-3 flex gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-12 rounded-full" />
          </div>

          {/* Content placeholder */}
          <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        </div>
      ))}
    </>
  )
}

export function FeedGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      <FeedSkeleton count={10} />
    </div>
  )
}
