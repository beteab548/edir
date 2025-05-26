
 const Table = ({
  columns,
  renderRow,
  data,
  selectable = false,
  selectedIds = [],
  onSelect = () => {},
  onSelectAll = () => {},
}: {
  columns: { header: string; accessor: string; className?: string }[];
  renderRow: (item: any) => React.ReactNode;
  data: any[];
  selectable?: boolean;
  selectedIds?: number[];
  onSelect?: (id: number, checked: boolean) => void;
  onSelectAll?: (checked: boolean) => void;
}) => {
  return (
    <table className="w-full mt-4">
      <thead>
        <tr className="text-left text-gray-500 text-sm">
          {selectable && (
            <th>
              <input
                type="checkbox"
                checked={selectedIds.length === data.length && data.length > 0}
                onChange={(e) => onSelectAll(e.target.checked)}
                className="checkbox"
              />
            </th>
          )}
          {columns.map((col) => (
            <th key={col.accessor} className={col.className}>
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((item) => (
          <tr key={item.id}>
            {selectable && (
              <td>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(item.id)}
                  onChange={(e) => onSelect(item.id, e.target.checked)}
                  className="checkbox"
                />
              </td>
            )}
            {renderRow(item)}
          </tr>
        ))}
      </tbody>
    </table>
  );
};
export default Table