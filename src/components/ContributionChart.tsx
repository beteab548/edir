"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  FiCalendar,
  FiDollarSign,
  FiTrendingUp,
  FiAlertCircle,
  FiBarChart2,
  FiMoreVertical,
} from "react-icons/fi";
import { FaMoneyBillWave } from "react-icons/fa";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

interface ChartData {
  name: string;
  expected: number;
  paid: number;
}

interface ContributionType {
  name: string;
}

interface FinanceChartProps {
  contributionTypes: ContributionType[];
}

const FinanceChart = ({ contributionTypes }: FinanceChartProps) => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedType, setSelectedType] = useState("all");
  const [data, setData] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const typeOptions = [
    {
      name: "All Contributions",
      value: "all",
      icon: <FiDollarSign className="mr-2" />,
    },
    ...contributionTypes.map((type) => ({
      name: type.name,
      value: type.name,
      icon: <FiTrendingUp className="mr-2" />,
    })),
  ];

  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const url = `/api/reports/monthly?year=${selectedYear}${
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
      expected: acc.expected + month.expected,
      paid: acc.paid + month.paid,
    }),
    { expected: 0, paid: 0 }
  );

  return (
    <div className="bg-white rounded-xl w-full h-[570px]  p-6 shadow-md relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-purple-100 text-purple-700 rounded-full">
            <FiBarChart2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">
              Monthly Contributions Chart
            </h1>
            <p className="text-sm text-gray-500">
              {selectedYear} •{" "}
              {selectedType === "all" ? "All Contributions" : selectedType}
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
              className="pl-9 pr-4 py-2 rounded-lg border border-gray-300 text-gray-700 bg-white focus:ring-2 focus:ring-blue-500 w-full sm:w-auto appearance-none shadow-sm"
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {/* Type Selector */}
          <div className="relative w-full sm:w-auto">
            <div className="absolute inset-y-0 left-0 flex items-center pl-2 text-gray-400 pointer-events-none">
              <FiTrendingUp />
            </div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-lg border border-gray-300 text-gray-700 bg-white focus:ring-2 focus:ring-blue-500 w-full sm:w-auto appearance-none shadow-sm"
            >
              {typeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary */}
      {!isLoading && !error && data.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-center gap-4">
            <FaMoneyBillWave className="text-blue-500 w-6 h-6" />
            <div>
              <h3 className="text-sm font-medium text-blue-800">
                Total Expected
              </h3>
              <p className="text-2xl font-bold text-blue-900 mt-1">
                {totals.expected.toLocaleString()} birr
              </p>
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-100 flex items-center gap-4">
            <FaMoneyBillWave className="text-green-500 w-6 h-6" />
            <div>
              <h3 className="text-sm font-medium text-green-800">Total Paid</h3>
              <p className="text-2xl font-bold text-green-900 mt-1">
                {totals.paid.toLocaleString()} birr
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="h-[calc(100%-180px)] min-h-[300px] bg-gray-50 rounded-lg px-4 py-6">
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
            <FiDollarSign size={24} />
            <p className="font-medium">No data available</p>
            <p className="text-sm">
              Try selecting a different year or contribution type
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 30, right: 40, bottom: 5, left: 20 }}
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
              />
              <Legend
                wrapperStyle={{ paddingTop: "20px" }}
                formatter={(value) => (
                  <span className="text-sm text-gray-600">{value}</span>
                )}
              />
              <Line
                type="monotone"
                dataKey="expected"
                stroke="#3b82f6"
                strokeWidth={3}
                name="Expected"
                dot={{ r: 4 }}
                activeDot={{
                  r: 6,
                  stroke: "#3b82f6",
                  strokeWidth: 2,
                  fill: "#ffffff",
                }}
              />
              <Line
                type="monotone"
                dataKey="paid"
                stroke="#10b981"
                strokeWidth={3}
                name="Paid"
                dot={{ r: 4 }}
                activeDot={{
                  r: 6,
                  stroke: "#10b981",
                  strokeWidth: 2,
                  fill: "#ffffff",
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default FinanceChart;
