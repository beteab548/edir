"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  FiAlertCircle,
  FiBarChart2,
  FiDownload,
  FiRefreshCw,
  FiCalendar,
  FiTrendingUp,
  FiMoreVertical,
} from "react-icons/fi";
import { FaMoneyBillWave } from "react-icons/fa";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

interface PenaltyData {
  name: string;
  auto_expected: number;
  auto_collected: number;
  manual_expected: number;
  manual_collected: number;
}
const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 3 }, (_, i) => currentYear - i);

export default function PenaltyChart() {
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedType, setSelectedType] = useState("all");
  const [data, setData] = useState<PenaltyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const url = `/api/reports/penalty?year=${selectedYear}${
          selectedType !== "all" ? `&type=${selectedType}` : ""
        }`;
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch data");
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
        console.error("Fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedYear, selectedType]);

  const totals = data.reduce(
    (acc, month) => ({
      auto_expected: acc.auto_expected + month.auto_expected,
      auto_collected: acc.auto_collected + month.auto_collected,
      manual_expected: acc.manual_expected + month.manual_expected,
      manual_collected: acc.manual_collected + month.manual_collected,
    }),
    {
      auto_expected: 0,
      auto_collected: 0,
      manual_expected: 0,
      manual_collected: 0,
    }
  );

  const handleExport = (format: string) => {
    setShowExportMenu(false);
    console.log(`Exporting as ${format}...`);
  };

  return (
    <div className="bg-white rounded-xl w-full h-[550px] p-6 relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-amber-100 text-amber-700 rounded-full">
            <FiBarChart2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">
              Monthly Penalties Chart
            </h1>
            <p className="text-sm text-gray-500">
              {selectedYear} •{" "}
              {selectedType === "all" ? "All Penalties" : selectedType}
            </p>
          </div>
        </div>

        {/* Filters & Export */}
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {/* Year Selector */}
          <div className="relative w-full sm:w-auto">
            <div className="absolute inset-y-0 left-0 flex items-center pl-2 text-gray-400 pointer-events-none">
              <FiCalendar />
            </div>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="pl-9 pr-4 py-2 rounded-lg border border-gray-300 text-gray-700 bg-white focus:ring-2 focus:ring-amber-500 w-full sm:w-auto appearance-none shadow-sm"
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          {/* Export */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
              aria-label="Export options"
            >
              <FiMoreVertical size={20} />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                <div className="py-1">
                  {["csv", "excel", "pdf"].map((format) => (
                    <button
                      key={format}
                      onClick={() => handleExport(format)}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                    >
                      Export as {format.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary */}
      {!isLoading && !error && data.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-100 flex items-center gap-4">
            <FaMoneyBillWave className="text-amber-500 w-6 h-6" />
            <div>
              <h3 className="text-sm font-medium text-amber-800">
                System Expected
              </h3>
              <p className="text-xl font-bold text-amber-900 mt-1">
                {totals.auto_expected.toLocaleString()} birr
              </p>
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-100 flex items-center gap-4">
            <FaMoneyBillWave className="text-green-500 w-6 h-6" />
            <div>
              <h3 className="text-sm font-medium text-green-800">
                System Collected
              </h3>
              <p className="text-xl font-bold text-green-900 mt-1">
                {totals.auto_collected.toLocaleString()} birr
              </p>
            </div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg border border-red-100 flex items-center gap-4">
            <FaMoneyBillWave className="text-red-500 w-6 h-6" />
            <div>
              <h3 className="text-sm font-medium text-red-800">
                Manual Expected
              </h3>
              <p className="text-xl font-bold text-red-900 mt-1">
                {totals.manual_expected.toLocaleString()} birr
              </p>
            </div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-center gap-4">
            <FaMoneyBillWave className="text-blue-500 w-6 h-6" />
            <div>
              <h3 className="text-sm font-medium text-blue-800">
                Manual Collected
              </h3>
              <p className="text-xl font-bold text-blue-900 mt-1">
                {totals.manual_collected.toLocaleString()} birr
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="h-[calc(100%-210px)] min-h-[300px] bg-gray-50 rounded-lg px-4 py-6">
        {isLoading ? (
          <div className="h-full flex flex-col items-center justify-center gap-4">
            <Skeleton height={300} width="100%" />
            <p className="text-gray-400 text-sm">Loading chart data...</p>
          </div>
        ) : error ? (
          <div className="h-full flex flex-col items-center justify-center gap-3 text-red-500">
            <FiAlertCircle size={24} />
            <p className="font-medium">Error loading data</p>
            <p className="text-sm text-center max-w-md">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 px-4 py-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200 transition"
            >
              Retry
            </button>
          </div>
        ) : data.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-3 text-gray-400">
            <FiBarChart2 size={24} />
            <p className="font-medium">No data available</p>
            <p className="text-sm">
              Try selecting a different year or penalty type
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 30, right: 40, bottom: 5, left: 20 }}
              barGap={10}
              barCategoryGap={45}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e5e7eb"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tick={{ fill: "#6b7280", fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: "#e5e7eb" }}
              />
              <YAxis
                tick={{ fill: "#6b7280", fontSize: 12 }}
                tickFormatter={(value) => `${value.toLocaleString()} birr`}
              />
              <Tooltip
                contentStyle={{
                  background: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }}
                formatter={(value) => `${value.toLocaleString()} birr`}
              />
              <Legend
                wrapperStyle={{ paddingTop: "20px" }}
                formatter={(value) => (
                  <span className="text-sm text-gray-600">{value}</span>
                )}
              />
              <Bar
                dataKey="auto_expected"
                name="System Generated Penalty expected"
                fill="#f59e0b"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="auto_collected"
                name="System Generated Penalty Collected"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="manual_expected"
                name="Admin Generated Penalty Expected"
                fill="#ef4444"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="manual_collected"
                name="Admin Generated Penalty Collected"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
              />0
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
