"use client";
import Image from "next/image";
import { RadialBarChart, RadialBar, ResponsiveContainer } from "recharts";
import { useEffect, useState } from "react";
import {  FiUsers } from "react-icons/fi";

interface GenderData {
  males: number;
  females: number;
}

interface CountChartProps {
  genderData: GenderData | null; // Pass the data as a prop
  loading: boolean; // Also pass a loading state, in case the parent is still fetching
}

const CountChart: React.FC<CountChartProps> = ({ genderData, loading }) => {
  const [data, setData] = useState([
    { name: "Total", count: 0, fill: "#F3F4F6" },
    { name: "Females", count: 0, fill: "#FBBF24" },
    { name: "Males", count: 0, fill: "#60A5FA" },
  ]);

  const [percentages, setPercentages] = useState({ males: 0, females: 0 });

  useEffect(() => {
    if (genderData) {
      const total = genderData.males + genderData.females;
      const malesPercent = total
        ? Math.round((genderData.males / total) * 100)
        : 0;
      const femalesPercent = total
        ? Math.round((genderData.females / total) * 100)
        : 0;

      setData([
        { name: "Total", count: total, fill: "#F3F4F6" },
        { name: "Females", count: genderData.females, fill: "#FBBF24" },
        { name: "Males", count: genderData.males, fill: "#60A5FA" },
      ]);

      setPercentages({ males: malesPercent, females: femalesPercent });
    }
  }, [genderData]);

  return (
    <div className=" rounded-2xl w-full h-full  flex flex-col justify-between">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-1">
      <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 -mt-3">
                  <FiUsers className="w-5 h-5" />
                </div>
          <div>
            {/* --- STEP 3: UPDATE THE TITLE --- */}
            <h2 className="text-md font-semibold text-gray-600">
              Member Distribution (Active Families)
            </h2>
          </div>
        </div>
      </div>
      <div className="relative w-full h-64 mb-6 mt-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-400" />
          </div>
        ) : (
          genderData && (
            <>
              <ResponsiveContainer>
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  innerRadius="30%"
                  outerRadius="100%"
                  barSize={40}
                  data={data}
                >
                  <RadialBar background dataKey="count" cornerRadius={40} />
                </RadialBarChart>
              </ResponsiveContainer>
              <Image
                src="/maleFemale.png"
                alt="Gender Icon"
                width={28}
                height={28}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              />
            </>
          )
        )}
      </div>

      {/* BOTTOM STATS */}
      <div className="flex justify-around text-center">
        <div className="flex flex-col items-center gap-1">
          <div className="w-4 h-4 rounded-full bg-blue-400" />
          <h1 className="text-lg font-bold text-gray-700">{data[2].count}</h1>
          <p className="text-sm text-gray-500">Males ({percentages.males}%)</p>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="w-4 h-4 rounded-full bg-yellow-400" />
          <h1 className="text-lg font-bold text-gray-700">{data[1].count}</h1>
          <p className="text-sm text-gray-500">
            Females ({percentages.females}%)
          </p>
        </div>
      </div>
    </div>
  );
};

export default CountChart;