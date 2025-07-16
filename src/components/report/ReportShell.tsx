"use client";
import * as XLSX from "xlsx";
import ReportLayout from "./ReportLayout";
import { useRef } from "react";

interface ReportShellProps {
  title: string;
  data: Record<string, any>[];
  columns: { label: string; accessor: string; width?: string }[];
  filename: string;
  children?: React.ReactNode;
  summaryRow?: Record<string, any>;
  searchparams: {
    from?: string;
    to?: string;
  };
}

export default function ReportShell({
  title,
  data,
  columns,
  filename,
  children,
  summaryRow,
  searchparams,
}: ReportShellProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const removeScrollTemporarily = async (
    callback: () => void | Promise<void>
  ) => {
    const el = scrollRef.current;
    if (!el) return;
    const prevClass = el.className;
    el.className = el.className
      .replace("overflow-auto", "overflow-visible")
      .replace(/max-h-\[\d+px\]/, "");
    await callback();
    el.className = prevClass;
  };

  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new();

    const headerRow = columns.map((col) => col.label);

    const bodyRows = data.map((row) =>
      columns.map((col) => row[col.accessor] ?? "")
    );

    const fullData = [headerRow, ...bodyRows];

    const worksheet = XLSX.utils.aoa_to_sheet(fullData);

    const headerRange = XLSX.utils.decode_range(worksheet["!ref"] || "");
    for (let C = headerRange.s.c; C <= headerRange.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
      if (!worksheet[cellAddress]) continue;
      worksheet[cellAddress].s = {
        font: { bold: true },
      };
    }

    const maxColWidths = columns.map((col, index) => {
      const values = [col.label, ...data.map((row) => row[col.accessor] ?? "")];
      const maxLen = Math.max(...values.map((v) => String(v).length));
      return { wch: maxLen + 2 };
    });
    worksheet["!cols"] = maxColWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, title || "Report");
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  };

  const handlePrint = () => {
    removeScrollTemporarily(() => {
      window.print();
    });
  };

  return (
    <div className="space-y-4" id="report-content">
      <div className="flex gap-2 flex-wrap print:hidden m-2 p-2 justify-end">
        <button
          onClick={exportToExcel}
          className="px-4 py-2 bg-green-600 text-white rounded"
        >
          Export to Excel
        </button>
        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-gray-700 text-white rounded"
        >
          Print
        </button>
      </div>
      <ReportLayout title={title} searchParams={searchparams}>
        {children}
        <div
          ref={scrollRef}
          className="overflow-auto border rounded print:overflow-visible print:max-h-none print:h-auto print-table-scale"
        >
          {columns.length > 10 && (
            <div className="text-sm text-yellow-700 bg-yellow-100 border border-yellow-300 rounded p-2 print:hidden">
              This table has many columns. For best results, consider using the{" "}
              <strong>Export to Excel</strong> option.
            </div>
          )}

          <table className="text-sm border-collapse table-fixed min-w-max print:w-full">
            <thead className="bg-gray-100 sticky top-0 z-10">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.label}
                    className={`border p-2 bg-gray-100 text-left truncate ${
                      col.width || "w-[150px]"
                    }`}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="p-4 text-center text-gray-500"
                  >
                    No data found.
                  </td>
                </tr>
              ) : (
                <>
                  {data.map((row, i) => (
                    <tr key={i}>
                      {columns.map((col) => (
                        <td
                          key={col.label}
                          className={`border p-2 truncate ${
                            col.width || "w-[150px]"
                          }`}
                        >
                          {row[col.accessor]}
                        </td>
                      ))}
                    </tr>
                  ))}

                  {summaryRow && (
                    <tr className="bg-gray-200 font-semibold">
                      {columns.map((col, i) => (
                        <td key={i} className="border p-2 truncate">
                          {summaryRow[col.accessor] !== undefined
                            ? summaryRow[col.accessor]
                            : i === 0
                            ? "Total"
                            : ""}
                        </td>
                      ))}
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      </ReportLayout>
    </div>
  );
}
