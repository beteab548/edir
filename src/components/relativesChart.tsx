'use client'
import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { FiRefreshCw, FiUsers, FiPieChart, FiInfo } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

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
  Other = "Other"
}

enum RelativeStatus {
  Active = "Active",
  Inactive = "Inactive",
  Pending = "Pending"
}

interface RelativeRelationsChartProps {
  apiUrl: string;
  memberId?: number;
}

const COLORS = [
  '#6366F1', '#8B5CF6', '#EC4899', '#F43F5E',
  '#FF7849', '#FFB02E', '#84CC16', '#10B981',
  '#06B6D4', '#0EA5E9', '#3B82F6', '#64748B'
];

const RelativeRelationsChart: React.FC<RelativeRelationsChartProps> = ({ apiUrl, memberId }) => {
  const [relatives, setRelatives] = useState<Relative[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const fetchRelatives = async () => {
    try {
      setLoading(true);
      setIsRefreshing(true);
      setError(null);
      
      let url = apiUrl;
      if (memberId) {
        url += `?member_id=${memberId}`;
      }

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setRelatives(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch relatives');
      console.error('Error fetching relatives:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRelatives();
  }, [apiUrl, memberId]);

  const relationCounts = relatives.reduce((acc, relative) => {
    const relation = relative.relation_type;
    acc[relation] = (acc[relation] || 0) + 1;
    return acc;
  }, {} as Record<RelationType, number>);

  const chartData = Object.entries(relationCounts).map(([name, value]) => ({
    name,
    value
  }));

  chartData.sort((a, b) => b.value - a.value);

  if (loading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg p-6 border border-gray-100 flex flex-col h-80"
      >
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"
          />
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center space-y-1"
          >
            <p className="text-gray-600 font-medium">Loading family data</p>
            <p className="text-sm text-gray-400">Fetching relative information</p>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg p-6 border border-gray-100"
      >
        <motion.div 
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          className="p-4 border border-red-100 bg-red-50/50 rounded-lg backdrop-blur-sm"
        >
          <div className="flex items-start space-x-3">
            <motion.div 
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: 1, duration: 0.5 }}
              className="flex-shrink-0 mt-0.5"
            >
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                <FiInfo className="w-4 h-4 text-red-500" />
              </div>
            </motion.div>
            <div className="space-y-2">
              <h3 className="font-semibold text-red-800">Data loading error</h3>
              <p className="text-sm text-red-600">{error}</p>
              <motion.button 
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={fetchRelatives}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <FiRefreshCw className="mr-1.5 h-3 w-3" />
                Retry
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  if (relatives.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg p-6 border border-gray-100"
      >
        <motion.div 
          initial={{ y: 20 }}
          animate={{ y: 0 }}
          className="p-4 border border-blue-100 bg-blue-50/50 rounded-lg backdrop-blur-sm"
        >
          <div className="flex items-start space-x-3">
            <motion.div 
              animate={{ 
                rotate: [0, 5, -5, 0],
                transition: { repeat: Infinity, repeatType: "reverse", duration: 2 } 
              }}
              className="flex-shrink-0 mt-0.5"
            >
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <FiUsers className="w-4 h-4 text-blue-500" />
              </div>
            </motion.div>
            <div className="space-y-1">
              <h3 className="font-semibold text-blue-800">No relatives found</h3>
              <p className="text-sm text-blue-600">This member doesn't have any relatives registered yet.</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg p-6 border border-gray-100 h-full flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <motion.div 
          initial={{ x: -20 }}
          animate={{ x: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center space-x-3"
        >
          <motion.div 
            whileHover={{ rotate: 15 }}
            className="p-2 rounded-lg bg-indigo-50 text-indigo-600"
          >
            <FiPieChart className="w-5 h-5" />
          </motion.div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Family Relations
              {memberId && <span className="text-xs font-normal text-gray-500 ml-2">(Member #{memberId})</span>}
            </h2>
            <p className="text-xs text-gray-500">Distribution of family member types</p>
          </div>
        </motion.div>
        <motion.button 
          whileHover={{ rotate: 180 }}
          whileTap={{ scale: 0.9 }}
          onClick={fetchRelatives}
          className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          title="Refresh data"
          disabled={isRefreshing}
        >
          <motion.div
            animate={{ rotate: isRefreshing ? 360 : 0 }}
            transition={{ repeat: isRefreshing ? Infinity : 0, duration: 1, ease: "linear" }}
          >
            <FiRefreshCw className="w-4 h-4" />
          </motion.div>
        </motion.button>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              labelLine={false}
              animationBegin={200}
              animationDuration={1000}
              animationEasing="ease-out"
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
              content={({ payload }) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white p-3 rounded-lg shadow-lg border border-gray-200"
                >
                  <p className="font-medium text-gray-900">{payload?.[0]?.name}</p>
                  <p className="text-sm">
                    <span className="text-gray-600">Count:</span>{' '}
                    <span className="font-semibold">{payload?.[0]?.value}</span>
                  </p>
                  <p className="text-sm">
                    <span className="text-gray-600">Percentage:</span>{' '}
                    <span className="font-semibold">
                      {((Number(payload?.[0]?.value) / relatives.length) * 100).toFixed(1)}%
                    </span>
                  </p>
                </motion.div>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Summary */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Summary</h3>
          <motion.span 
            whileHover={{ scale: 1.05 }}
            className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600"
          >
            {relatives.length} total
          </motion.span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <AnimatePresence>
            {chartData.map((item, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 + 0.3 }}
                whileHover={{ y: -2, boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}
                className="flex items-center p-2 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div 
                  className="w-3 h-3 rounded-full mr-3 flex-shrink-0" 
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-sm font-semibold text-gray-900">{item.value}</p>
                  <p className="text-xs text-gray-500">
                    {((item.value / relatives.length) * 100).toFixed(1)}%
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default RelativeRelationsChart;