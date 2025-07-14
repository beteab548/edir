export default function ContributionPageLoading() {
  return (
    <div className="contribution-page p-6 animate-pulse space-y-6">
      <div className="space-y-2">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        <div className="flex justify-end">
          <div className="h-10 w-40 bg-gray-200 rounded-md -mt-8"></div>
        </div>
      </div>


      <div className="flex flex-wrap gap-3 mt-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-8 w-28 rounded-full bg-gray-200"></div>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 mt-2">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              {[
                "Id",
                "Member",
                "Amount",
                "Type",
                "date",
                "Method",
                "balance",
                "Action",
              ].map((header, idx) => (
                <th
                  key={idx}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {Array.from({ length: 6 }).map((_, rowIdx) => (
              <tr key={rowIdx} className="hover:bg-gray-50">
                {Array.from({ length: 8 }).map((_, colIdx) => (
                  <td key={colIdx} className="px-6 py-4 whitespace-nowrap">
                    <div className="h-4 bg-gray-200 rounded w-full max-w-[140px]"></div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
