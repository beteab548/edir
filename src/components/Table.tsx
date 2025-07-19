interface TableProps {
  columns: { 
    header: React.ReactNode; // Changed from string to ReactNode to support sortable headers
    accessor: string 
  }[];
  renderRow: (item: any) => React.ReactNode;
  data: any[];
  selectable?: boolean;
  selectedIds?: number[];
  onSelect?: (id: number, checked: boolean) => void;
  onSelectAll?: (checked: boolean) => void;
  headerClassName?: string;
  rowClassName?: string;
  emptyState?: React.ReactNode; 
}

const Table = ({
  columns,
  renderRow,
  data,
  selectable = false,
  selectedIds = [],
  onSelect = () => {},
  onSelectAll = () => {},
  headerClassName = "",
  rowClassName = "",
  emptyState = null, 
}: TableProps) => {
  return (
    <div className="rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {selectable && (
              <th scope="col" className="relative w-12 px-6">
                <input
                  type="checkbox"
                  className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={selectedIds.length === data.length && data.length > 0}
                  onChange={(e) => onSelectAll(e.target.checked)}
                />
              </th>
            )}
            {columns.map((col) => (
              <th
                key={col.accessor}
                scope="col"
                className={`px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${headerClassName}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {data.length > 0 ? (
            data.map((item) => (
              <tr
                key={item.id}
                className={`hover:bg-gray-50 transition-colors ${rowClassName}`}
              >
                {selectable && (
                  <td className="relative w-12 px-6">
                    <input
                      type="checkbox"
                      className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      checked={selectedIds.includes(item.id)}
                      onChange={(e) => onSelect(item.id, e.target.checked)}
                    />
                  </td>
                )}
                {renderRow(item)}
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={columns.length + (selectable ? 1 : 0)}
                className=" py-12 text-center text-sm text-gray-500"
              >
                {emptyState || (
                  <div className="flex flex-col items-center justify-center gap-2">
                    <svg
                      className="w-10 h-10 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p>No data available</p>
                  </div>
                )}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;