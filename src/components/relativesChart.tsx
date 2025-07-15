"use client";
import React, { useCallback, useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { FiRefreshCw, FiUsers, FiPieChart, FiInfo } from "react-icons/fi";
import { motion } from "framer-motion";

enum RelationType {
  Mother = "Mother",
  Father = "Father",
  Daughter = "Daughter",
  Son = "Son",
  Sister = "Sister",
  Brother = "Brother",
  Spouse_Mother = "Spouse_Mother",
  Spouse_Father = "Spouse_Father",
  Spouse_Sister = "Spouse_Sister",
  Spouse_Brother = "Spouse_Brother",
  Other = "Other",
}

enum RelativeStatus {
  Active = "Active",
  Inactive = "Inactive",
  Pending = "Pending",
}

type Relative = {
  id: number;
  member_id: number;
  first_name: string;
  second_name: string;
  last_name: string;
  relation_type: RelationType;
  status: RelativeStatus;
  created_at: Date;
  status_updated_at?: Date;
};

interface RelativeRelationsChartProps {
  apiUrl: string;
  memberId?: number;
}

const COLORS = [
  "#6366F1",
  "#8B5CF6",
  "#EC4899",
  "#F43F5E",
  "#FF7849",
  "#FFB02E",
  "#84CC16",
  "#10B981",
  "#06B6D4",
  "#0EA5E9",
  "#3B82F6",
  "#64748B",
];

const RelativeRelationsChart: React.FC<RelativeRelationsChartProps> = ({
  apiUrl,
  memberId,
}) => {
  const [relatives, setRelatives] = useState<Relative[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [activeOnly, setActiveOnly] = useState<boolean>(false);

  const fetchRelatives = useCallback(async () => {
    try {
      setLoading(true);
      setIsRefreshing(true);
      setError(null);

      const params = new URLSearchParams();
      if (memberId) params.append("member_id", memberId.toString());
      if (activeOnly) params.append("activeOnly", "true");

      const url = `${apiUrl}?${params.toString()}`;

      const response = await fetch(url,{
          cache: "no-store",
          next: { revalidate: 0 },
        });
      if (!response.ok) {
        throw new Error(`failed to fetch, refresh page`);
      }

      const data = await response.json();
      setRelatives(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch relatives"
      );
      console.error("Error fetching relatives:", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [apiUrl, memberId, activeOnly]); // ✅ include dependencies

  useEffect(() => {
    fetchRelatives();
  }, [fetchRelatives]); // ✅ use the memoized version

  const relationCounts = relatives.reduce((acc, relative) => {
    const relation = relative.relation_type;
    acc[relation] = (acc[relation] || 0) + 1;
    return acc;
  }, {} as Record<RelationType, number>);

  const chartData = Object.entries(relationCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const total = relatives.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className=" h-full flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
            <FiPieChart className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Member Relatives Distribution
              {memberId && (
                <span className="text-xs font-normal text-gray-500 ml-2">
                  (Member #{memberId})
                </span>
              )}
            </h2>
            <p className="text-xs text-gray-500">
              Showing {total} relatives grouped by relation type
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      {loading ? (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-400" />
        </div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : total === 0 ? (
        <div className="text-center text-gray-500 flex-1 flex items-center justify-center">
          No relatives found.
        </div>
      ) : (
        <div className="flex-1 min-h-[300px] ">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
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
      )}
    </motion.div>
  );
};

export default RelativeRelationsChart;
