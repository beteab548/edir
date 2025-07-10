"use client";

import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import * as XLSX from "xlsx";
import ReportLayout from "./ReportLayout";

interface ReportShellProps {
  title: string;
  data: Record<string, any>[];
  columns: { label: string; accessor: string }[];
  filename: string;
  children?: React.ReactNode;
}

export default function ReportShell({
  title,
  data,
  columns,
  filename,
  children,
}: ReportShellProps) {
  const exportToPDF = async () => {
    const element = document.getElementById("report-content");
    if (!element) return;
    const canvas = await html2canvas(element);
    const pdf = new jsPDF();
    const imgData = canvas.toDataURL("image/png");
    const width = pdf.internal.pageSize.getWidth();
    const height = (canvas.height * width) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, width, height);
    pdf.save(`${filename}.pdf`);
  };
// console.log("data is",data);
  const exportToExcel = () => {
    const sheetData = data;
    const worksheet = XLSX.utils.json_to_sheet(sheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, title);
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  };

  return (
    <div className="space-y-4">
      {/* Filters or extra controls */}
      {children}

      {/* Export buttons */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={exportToPDF}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Export to PDF
        </button>
        <button
          onClick={exportToExcel}
          className="px-4 py-2 bg-green-600 text-white rounded"
        >
          Export to Excel
        </button>
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-gray-700 text-white rounded"
        >
          Print
        </button>
      </div>

      {/* Report table inside layout */}
      <ReportLayout>
        <table className="w-full text-sm border-collapse mt-4">
          <thead className="bg-gray-100">
            <tr>
              {columns.map((col) => (
                <th key={col.label} className="border p-2">
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
              data.map((row, i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td key={col.label} className="border p-2">
                      {row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </ReportLayout>
    </div>
  );
}
