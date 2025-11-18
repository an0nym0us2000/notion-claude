import React from 'react';

export const CommentSkeleton: React.FC = () => {
  return (
    <div className="animate-pulse space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-3">
          {/* Avatar skeleton */}
          <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0" />

          {/* Content skeleton */}
          <div className="flex-1">
            <div className="bg-notion-bg rounded-lg p-3">
              {/* Header skeleton */}
              <div className="flex items-center gap-2 mb-2">
                <div className="h-3 bg-gray-200 rounded w-24" />
                <div className="h-2 bg-gray-200 rounded w-16" />
              </div>

              {/* Text skeleton */}
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded w-full" />
                <div className="h-3 bg-gray-200 rounded w-3/4" />
              </div>
            </div>

            {/* Actions skeleton */}
            <div className="flex gap-3 mt-1 px-3">
              <div className="h-2 bg-gray-200 rounded w-12" />
              <div className="h-2 bg-gray-200 rounded w-14" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
