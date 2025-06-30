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
} from "react-icons/fi";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

interface PenaltyChartData {
  name: string;
  auto_expected: number;
  auto_collected: number;
  manual_expected: number;
  manual_collected: number;
}

const currentYear = new Date().getFullYear();
const availableYears = [currentYear, currentYear - 1, currentYear - 2];

export default function PenaltyChart() {
  const [data, setData] = useState<PenaltyChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  const fetchData = (year = selectedYear) => {
    setLoading(true);
    setError(null);

    fetch(`/api/reports/penalty?year=${year}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch data");
        return res.json();
      })
      .then(setData)
      .catch((err) => {
        console.error("Error fetching penalties", err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [selectedYear]);

  const handleExport = () => {
    console.log("Exporting data...");
  };

  return (
    <div className="bg-white rounded-xl h-[500px] flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-100 text-amber-700 rounded-full">
            <FiBarChart2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">
              Penalties Summary
            </h1>
            <p className="text-sm text-gray-500">
              Overview of auto/manual penalties for {selectedYear}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="text-sm px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
          >
            {availableYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>

          <button
            onClick={() => fetchData()}
            disabled={loading}
            title="Refresh data"
            className={`p-2 rounded-lg transition ${
              loading
                ? "text-gray-400 bg-gray-100 cursor-not-allowed"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            }`}
          >
            <FiRefreshCw
              size={18}
              className={loading ? "animate-spin" : ""}
            />
          </button>

          <button
            onClick={handleExport}
            title="Export data"
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
          >
            <FiDownload size={18} />
          </button>
        </div>
      </div>

      {/* Chart Area */}
      <div className="flex-1 min-h-[300px]">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <Skeleton height={300} width="100%" />
          </div>
        ) : error ? (
          <div className="flex flex-col justify-center items-center h-full text-red-500 gap-2">
            <FiAlertCircle size={24} />
            <p className="font-semibold">Error loading data</p>
            <p className="text-sm text-center">{error}</p>
            <button
              onClick={() => fetchData()}
              className="mt-2 px-4 py-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200 flex items-center gap-2 transition"
            >
              <FiRefreshCw size={16} />
              Retry
            </button>
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-full text-gray-400 gap-2">
            <FiAlertCircle size={24} />
            <p className="font-semibold">No data available</p>
            <p className="text-sm">Try a different year</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
              barGap={10}
              barCategoryGap={45}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="name"
                tick={{ fill: "#6b7280", fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: "#e5e7eb" }}
              />
              <YAxis
                tick={{ fill: "#6b7280", fontSize: 12 }}
                tickFormatter={(value) => value.toLocaleString()}
                axisLine={{ stroke: "#e5e7eb" }}
              />
              <Tooltip
                contentStyle={{
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
                }}
                formatter={(value) => [`${value.toLocaleString()}`, ""]}
                labelFormatter={(label) => `Month: ${label}`}
              />
              <Legend
                wrapperStyle={{ paddingTop: "20px" }}
                formatter={(value) => (
                  <span className="text-sm text-gray-600">{value}</span>
                )}
              />
              <Bar
                dataKey="auto_expected"
                name="Auto Expected"
                fill="#f59e0b"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="auto_collected"
                name="Auto Collected"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="manual_expected"
                name="Manual Expected"
                fill="#ef4444"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="manual_collected"
                name="Manual Collected"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
