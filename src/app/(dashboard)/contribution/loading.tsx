// app/contribute/loading.tsx
export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 animate-pulse">
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="h-8 w-3/4 mx-auto bg-gray-200  mb-4"></div>
          <div className="h-4 w-2/3 mx-auto bg-gray-200 rounded"></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl shadow-md overflow-hidden"
            >
              <div className="p-6 flex flex-col items-center text-center">
                <div className="h-20 w-20 bg-gray-200 rounded-full mb-4"></div>
                <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
              </div>
              <div className="px-6 py-4 bg-gray-100 text-right">
                <div className="h-4 w-1/3 bg-gray-300 rounded ml-auto"></div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
