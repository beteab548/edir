"use client";
import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { FiAlertCircle, FiDownload, FiRefreshCw } from "react-icons/fi";
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
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch data");
        return res.json();
      })
      .then(setData)
      .catch(err => {
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
    <div className="bg-white rounded-xl shadow-sm  p-6 h-full flex flex-col">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Penalties Summary</h1>
          <p className="text-sm text-gray-500 mt-1">Penalty overview by year</p>
        </div>
        <div className="flex gap-2 items-center">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="text-sm rounded px-3 py-1 bg-white shadow-sm"
          >
            {availableYears.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <button 
            onClick={() => fetchData()}
            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-lg transition-colors"
            title="Refresh data"
            disabled={loading}
          >
            <FiRefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
          <button 
            onClick={handleExport}
            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-lg transition-colors"
            title="Export data"
          >
            <FiDownload size={18} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Skeleton height={300} width="100%" />
        </div>
      ) : error ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-red-500">
          <FiAlertCircle size={24} />
          <p className="font-medium">Error loading data</p>
          <p className="text-sm text-center max-w-md">{error}</p>
          <button
            onClick={() => fetchData()}
            className="mt-2 px-4 py-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200 transition flex items-center gap-2"
          >
            <FiRefreshCw size={16} />
            Retry
          </button>
        </div>
      ) : data.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-gray-400">
          <FiAlertCircle size={24} />
          <p className="font-medium">No data available</p>
          <p className="text-sm">Try selecting a different year</p>
        </div>
      ) : (
        <div className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={data} 
              margin={{ top: 20, right: 20, left: 0, bottom: 5 }}
              barGap={12}
              barCategoryGap={8}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis 
                dataKey="name" 
                tick={{ fill: "#6b7280", fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: "#e5e7eb" }}
              />
              <YAxis 
                tick={{ fill: "#6b7280", fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: "#e5e7eb" }}
                tickFormatter={(value) => `${value.toLocaleString()}`}
              />
              <Tooltip
                contentStyle={{
                  background: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
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
              <Bar dataKey="auto_expected" fill="#f59e0b" name="Auto Expected" radius={[4, 4, 0, 0]} barSize={28} />
              <Bar dataKey="auto_collected" fill="#10b981" name="Auto Collected" radius={[4, 4, 0, 0]} barSize={28} />
              <Bar dataKey="manual_expected" fill="#ef4444" name="Manual Expected" radius={[4, 4, 0, 0]} barSize={28} />
              <Bar dataKey="manual_collected" fill="#3b82f6" name="Manual Collected" radius={[4, 4, 0, 0]} barSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
