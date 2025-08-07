"use client";
import Image from "next/image";
import { RadialBarChart, RadialBar, ResponsiveContainer } from "recharts";
import { useEffect, useState } from "react";
import { FiPieChart, FiUsers } from "react-icons/fi";

interface GenderData {
  males: number;
  females: number;
}

const CountChart = () => {
  const [data, setData] = useState([
    { name: "Total", count: 0, fill: "#F3F4F6" },
    { name: "Females", count: 0, fill: "#FBBF24" },
    { name: "Males", count: 0, fill: "#60A5FA" },
  ]);

  const [percentages, setPercentages] = useState({ males: 0, females: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/dashboard/members/count", {
          cache: "no-store",
          next: { revalidate: 0 },
        });
        const counts: GenderData = await res.json();
        const total = counts.males + counts.females;
        const malesPercent = total
          ? Math.round((counts.males / total) * 100)
          : 0;
        const femalesPercent = total
          ? Math.round((counts.females / total) * 100)
          : 0;

        setData([
          { name: "Total", count: total, fill: "#F3F4F6" },
          { name: "Females", count: counts.females, fill: "#FBBF24" },
          { name: "Males", count: counts.males, fill: "#60A5FA" },
        ]);

        setPercentages({ males: malesPercent, females: femalesPercent });
      } catch (error) {
        console.error("Failed to fetch gender data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className=" rounded-2xl w-full h-full  flex flex-col justify-between">
       <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-1">
                <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
             <FiUsers className="w-5 h-5 inline-block mr-1 align-middle" />
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
