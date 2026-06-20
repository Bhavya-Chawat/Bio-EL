/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const COLORS = {
  High: "#ff4444",
  Medium: "#facc15",
  Low: "#34908B"
};

export default function RiskDistributionChart({ districts }: { districts: any[] }) {
  const counts = { High: 0, Medium: 0, Low: 0 };
  
  districts.forEach(d => {
    if (d.latest_zone === "high") counts.High++;
    else if (d.latest_zone === "medium") counts.Medium++;
    else counts.Low++;
  });

  const data = [
    { name: "High Risk", value: counts.High },
    { name: "Medium Risk", value: counts.Medium },
    { name: "Low Risk", value: counts.Low }
  ];

  return (
    <div className="w-full h-[250px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[entry.name.split(" ")[0] as keyof typeof COLORS]} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
          <Legend verticalAlign="bottom" height={36} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
