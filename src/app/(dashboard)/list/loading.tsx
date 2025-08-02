


const Loading = () => {
  return (
    // The main container with the pulse animation class
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 animate-pulse">
      {/* Header Section */}
      <div className="p-6 pb-4 border-b border-gray-100">
        <div className="flex items-center justify-between gap-4">
          {/* Left Side: "Family Directory" and "families found" */}
          <div className="space-y-2">
            <div className="h-8 bg-gray-300 rounded-md w-48"></div> {/* Title */}
            <div className="h-4 bg-gray-200 rounded-md w-32"></div> {/* Subtitle */}
          </div>

          {/* Right Side: Search field and Button */}
          <div className="flex items-center gap-3">
            <div className="h-10 bg-gray-200 rounded-lg w-64"></div> {/* Search Field */}
            <div className="h-10 bg-gray-300 rounded-lg w-32"></div> {/* Add Member Button */}
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="overflow-x-auto">
        <div className="min-w-full">
          {/* Table Header Placeholder */}
          <div className="flex px-5 py-4 border-b border-gray-100">
            <div className="w-16 h-4 bg-gray-200 rounded-md"></div>
            <div className="flex-1 ml-4 h-4 bg-gray-200 rounded-md"></div>
            <div className="flex-1 ml-4 h-4 bg-gray-200 rounded-md"></div>
            <div className="flex-1 ml-4 h-4 bg-gray-200 rounded-md"></div>
            <div className="w-16 ml-4 h-4 bg-gray-200 rounded-md"></div>
            <div className="w-24 ml-4 h-4 bg-gray-200 rounded-md"></div>
            <div className="flex-1 ml-4 h-4 bg-gray-200 rounded-md"></div>
            <div className="w-24 ml-4 h-4 bg-gray-200 rounded-md"></div>
          </div>

          {/* Table Body Placeholder Rows (Repeating 5 times) */}
          <div className="divide-y divide-gray-100">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center px-5 py-2">
                {/* ID Column */}
                <div className="w-16 h-4 bg-gray-200 rounded-md"></div>
                
                {/* Member Column (Avatar + 2 lines of text) */}
                <div className="flex-1 ml-4 flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-300 rounded-md w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded-md w-1/2"></div>
                  </div>
                </div>
                
                {/* Profession Column */}
                <div className="flex-1 ml-4 h-4 bg-gray-200 rounded-md"></div>
                
                {/* Contact Column */}
                <div className="flex-1 ml-4 h-4 bg-gray-200 rounded-md"></div>
                
                {/* Age Column */}
                <div className="w-16 ml-4 h-4 bg-gray-200 rounded-md"></div>
                
                {/* Status Column (Badge) */}
                <div className="w-24 ml-4 h-6 bg-gray-200 rounded-full"></div>
                
                {/* Registered Date Column */}
                <div className="flex-1 ml-4 h-4 bg-gray-200 rounded-md"></div>
                
                {/* Action Column (Two small buttons) */}
                <div className="w-24 ml-4 flex justify-end gap-2">
                  <div className="h-8 w-8 bg-gray-200 rounded-md"></div>
                  <div className="h-8 w-8 bg-gray-200 rounded-md"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
       {/* Pagination Section */}
       <div className="p-6 pt-4 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center justify-between">
              <div className="h-6 w-1/4 bg-gray-200 rounded-md"></div>
              <div className="h-8 w-1/3 bg-gray-200 rounded-md"></div>
          </div>
       </div>
    </div>
  );
};

export default Loading;
