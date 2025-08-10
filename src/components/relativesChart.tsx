"use client";
import React, { useCallback, useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { FiUsers, FiPieChart } from "react-icons/fi";
import { motion } from "framer-motion";

// --- The 'Relative' type definition is still correct from our last fix ---
type Relative = {
  id: number;
  familyId: number;
  first_name: string;
  second_name: string | null;
  last_name: string;
  relation_type: string;
  status: string;
  created_at: string;
  status_updated_at?: string;
};

// --- STEP 1: SIMPLIFY THE PROPS ---
// The component no longer needs memberId.
interface RelativeRelationsChartProps {
  apiUrl: string;
}

const COLORS = [
  "#6366F1", "#8B5CF6", "#EC4899", "#F43F5E", "#FF7849",
  "#FFB02E", "#84CC16", "#10B981", "#06B6D4", "#0EA5E9",
  "#3B82F6", "#64748B",
];

const RelativeRelationsChart: React.FC<RelativeRelationsChartProps> = ({ apiUrl }) => {
  const [relatives, setRelatives] = useState<Relative[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // --- STEP 2: SIMPLIFY THE FETCH LOGIC ---
  const fetchRelatives = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // The URL is now static and doesn't need any parameters.
      const response = await fetch(apiUrl, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Failed to fetch, please refresh the page`);
      }

      const data = await response.json();
      console.log("relatives date:",data);
      setRelatives(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch relatives");
      console.error("Error fetching relatives:", err);
    } finally {
      setLoading(false);
    }
    // The dependency array is now simpler.
  }, [apiUrl]);

  useEffect(() => {
    fetchRelatives();
  }, [fetchRelatives]);

  // The chart data calculation logic does not need to change at all.
  const relationCounts = relatives.reduce((acc, relative) => {
    const relation = relative.relation_type;
    acc[relation] = (acc[relation] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(relationCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const total = relatives.length;

  // The JSX render logic also remains mostly the same.
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className=" h-full flex flex-col"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
            <FiPieChart className="w-5 h-5" />
          </div>
          <div>
            {/* --- STEP 3: UPDATE THE TITLE --- */}
            <h2 className="text-md font-semibold text-gray-600">
              Relatives Distribution (Active Families)
            </h2>
            <p className="text-xs text-gray-500">
              Showing relatives from families with an active principal
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-400" />
        </div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : total === 0 ? (
        <div className="text-center text-gray-500 flex-1 flex items-center justify-center">
          No relatives found for active families.
        </div>
      ) : (
        <div className="flex flex-col h-full">
          {/* The chart rendering itself requires no changes */}
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
              
  <Pie
                  data={chartData}
                  cx="50%"
                  cy="30%"
                  innerRadius={30}
                  outerRadius={60}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name.replace(/_/g, " ")} ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                      stroke="#fff"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string) => [
                    value,
                    name.replace(/_/g, " "),
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="-mt-32 pt-4 border-gray-200">
            <div className="flex items-center justify-center space-x-2">
              <FiUsers className="text-gray-500" />
              <span className="text-sm font-medium text-gray-700">
                Total Relatives: <span className="font-bold">{total}</span>
              </span>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default RelativeRelationsChart;

