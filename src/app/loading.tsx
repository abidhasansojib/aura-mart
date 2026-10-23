import React from "react";

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col animate-pulse">
      {/* Top Announcement Bar Skeleton */}
      <div className="h-9 bg-slate-800 w-full" />

      {/* Header Skeleton */}
      <div className="h-16 sm:h-20 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gray-200" />
            <div className="hidden xs:block space-y-1.5">
              <div className="h-4 w-24 bg-gray-200 rounded" />
              <div className="h-2.5 w-16 bg-gray-100 rounded" />
            </div>
          </div>

          <div className="flex-1 max-w-lg">
            <div className="h-10 w-full rounded-full bg-gray-100" />
          </div>

          <div className="flex items-center gap-2">
            <div className="h-10 w-24 rounded-xl bg-gray-100 hidden md:block" />
            <div className="h-10 w-10 sm:w-20 rounded-xl bg-gray-200" />
          </div>
        </div>
      </div>

      {/* Main Content Skeletons */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero Banner Skeleton */}
        <div className="h-56 sm:h-64 rounded-3xl bg-gray-200 p-8 flex flex-col justify-center space-y-4">
          <div className="h-5 w-40 bg-gray-300 rounded-full" />
          <div className="h-8 sm:h-10 w-3/4 max-w-md bg-gray-300 rounded-xl" />
          <div className="h-4 w-1/2 max-w-sm bg-gray-300 rounded" />
        </div>

        {/* Category Pills Skeleton */}
        <div className="space-y-3">
          <div className="h-6 w-36 bg-gray-200 rounded-lg" />
          <div className="flex gap-2 overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-9 w-20 sm:w-24 bg-gray-200 rounded-full shrink-0" />
            ))}
          </div>
        </div>

        {/* 8-Card Product Grid Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-gray-200 overflow-hidden space-y-3 p-3 sm:p-4"
            >
              {/* Thumbnail */}
              <div className="aspect-square w-full rounded-xl bg-gray-200" />

              {/* Title & Category */}
              <div className="space-y-2">
                <div className="h-3 w-16 bg-gray-100 rounded" />
                <div className="h-4 w-full bg-gray-200 rounded" />
                <div className="h-4 w-2/3 bg-gray-200 rounded" />
              </div>

              {/* Price & Action */}
              <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                <div className="h-5 w-16 bg-gray-200 rounded" />
                <div className="h-9 w-20 bg-gray-200 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
