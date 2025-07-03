"use client";

import { usePathname } from "next/navigation";

export default function NotFound() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean); // removes empty strings
  const lastSegment = segments[segments.length - 1]; // e.g., "Monthly"

  return (
    <div className="flex flex-col items-center justify-center h-screen text-center px-4">
      <h1 className="text-5xl font-bold text-red-600">404 - Not Found</h1>
      <p className="mt-4 text-lg text-gray-700">
        Sorry, we couldn’t find anything at <strong>{lastSegment}</strong>.
      </p>
      <a
        href="/"
        className="mt-6 inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Go Home
      </a>
    </div>
  );
}
