// app/members/new/loading.tsx
export default function Loading() {
  const fields = Array.from({ length: 4 }, (_, rowIndex) =>
    Array.from({ length: 3 }, (_, colIndex) => `${rowIndex}-${colIndex}`)
  );

  return (
    <div className="min-h-screen p-8 bg-white">
      {/* Tabs */}
      <div className="flex gap-6 mb-6 text-sm font-medium border-b">
        {["Principal Info", "Principal detail", "Principal Relatives"].map(
          (tab, index) => (
            <div
              key={index}
              className={`pb-2 ${
                index === 0
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-500"
              }`}
            >
              {tab}
            </div>
          )
        )}
      </div>

      {/* Input Skeletons */}
      <div className="grid grid-cols-3 gap-6">
        {fields.map((row, rowIndex) =>
          row.map((key) => (
            <div key={key} className="space-y-1">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
            </div>
          ))
        )}
      </div>

      {/* Bottom Buttons */}
      <div className="flex justify-end gap-4 mt-10">
        <div className="h-10 w-24 bg-gray-300 rounded animate-pulse" />
        <div className="h-10 w-36 bg-blue-400 rounded animate-pulse" />
      </div>
    </div>
  );
}
