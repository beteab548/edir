"use client";

interface TableProps {
  columns: {
    header: string;
    accessor: string;
    className?: string;
  }[];
  data: any[];
  renderRow: (item: any) => React.ReactNode;
  selectable?: boolean;
  selectedIds?: number[];
  onSelect?: (id: number, checked: boolean) => void;
  onSelectAll?: (checked: boolean) => void;
}

const Table = ({
  columns,
  data,
  renderRow,
  selectable = false,
  selectedIds = [],
  onSelect,
  onSelectAll,
}: TableProps) => {
  const allSelected = data.length > 0 && data.every(item => selectedIds.includes(item.id));

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="border-b">
          <tr>
            {selectable && (
              <th className="p-4 w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => onSelectAll?.(e.target.checked)}
                  className="checkbox checkbox-sm"
                />
              </th>
            )}
            {columns.map((column) => (
              <th key={column.accessor} className={`p-4 text-left ${column.className || ''}`}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.id} className="border-b hover:bg-gray-50">
              {selectable && (
                <td className="p-4">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(item.id)}
                    onChange={(e) => onSelect?.(item.id, e.target.checked)}
                    className="checkbox checkbox-sm"
                  />
                </td>
              )}
              {renderRow(item)}
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan={columns.length + (selectable ? 1 : 0)} className="p-4 text-center text-gray-500">
                No data found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;