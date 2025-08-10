// app/dashboard/loading.tsx
import React from "react";

const HeaderSkeleton = () => {
  return (
    <header className="mb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="animate-pulse h-8 bg-gray-300 rounded px-32 mb-2"></div>{" "}
          {/* Welcome text */}
          <div className="animate-pulse h-4 bg-gray-300 rounded  px-12 "></div>{" "}
          {/* Date */}
        </div>
        <div className="animate-pulse bg-gray-300 rounded-lg shadow-xs px-14 border border-gray-200 w-10 md:w-auto h-8"></div>{" "}
        {/* Placeholder for "Last Updated" */}
      </div>
    </header>
  );
};

const UserCardSkeleton = () => {
  return (
    <div className="bg-white rounded-lg shadow-md p-5 flex flex-col items-center justify-center h-40">
      {/* Title Skeleton */}
      <div className="flex flex-row items-center mb-4">
        <div className="animate-pulse h-4 px-12 bg-gray-300 rounded mb-2 mr-2"></div>
        {/* Icon Skeleton (Circle) */}
        <div className="animate-pulse w-8 h-8 rounded-full bg-gray-300 mb-3"></div>
      </div>
      {/* Count Skeleton */}
      <div className="animate-pulse h-8 bg-gray-300 rounded items-start justify-start"></div>
    </div>
  );
};

const QuickActionsSkeleton = () => {
  return (
    <div className="bg-white rounded-lg shadow-xs p-5 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-3">
        <div className="animate-pulse p-2 rounded-lg bg-gray-300 w-8 h-8"></div>{" "}
        {/* Icon Placeholder */}
        <div className="animate-pulse h-6 bg-gray-300 rounded w-1/2"></div>{" "}
        {/* Title Placeholder */}
      </h3>
      <div className="space-y-2">
        {/* Placeholder Buttons */}
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="animate-pulse bg-gray-300 rounded-md h-10 w-full"
          ></div>
        ))}
      </div>
    </div>
  );
};

const Loading = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <HeaderSkeleton />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-6">
            {/* User Cards Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
              {Array.from({ length: 8 }).map((_, index) => (
                <UserCardSkeleton key={index} />
              ))}
            </div>

            {/* Placeholder for other content areas */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg shadow-xs p-5 border border-gray-200 lg:col-span-1">
                <div className="animate-pulse h-72 bg-gray-300 rounded" />
              </div>
              <div className="bg-white rounded-lg shadow-xs p-5 border border-gray-200 lg:col-span-2">
                <div className="animate-pulse h-72 bg-gray-300 rounded" />
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-8">
            <QuickActionsSkeleton />

            {/* Placeholder for Activity section */}
            <div className="bg-white rounded-lg shadow-xs p-5 border border-gray-200">
              <div className="animate-pulse h-48 bg-gray-300 rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Loading;
