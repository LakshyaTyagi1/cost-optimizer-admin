"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type AssessmentTrendPoint = {
  month: string;
  value: number;
};

export function AssessmentTrendChart({ data }: { data: readonly AssessmentTrendPoint[] }) {
  const maxValue = Math.max(5, ...data.map((point) => point.value));
  const yAxisTicks = Array.from({ length: 5 }, (_, index) => (maxValue / 4) * index);

  return (
    <div
      className="mt-6 h-[190px] w-full pb-3 sm:mt-7 sm:h-[200px]"
      aria-label="New assessments trend over the last six months"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 10, bottom: 0, left: 10 }}>
          <CartesianGrid vertical={false} stroke="#F0F0F0" strokeDasharray="3 3" />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#86868B", fontSize: 12, fontWeight: 400 }}
            dy={10}
            interval={0}
          />
          <YAxis domain={[0, maxValue]} hide tickCount={5} ticks={yAxisTicks} />
          <Tooltip
            cursor={{ stroke: "#007AFF", strokeDasharray: "3 3", strokeOpacity: 0.24 }}
            contentStyle={{
              border: "1px solid rgba(0,0,0,0.08)",
              borderRadius: 6,
              boxShadow: "0 8px 20px rgba(15,23,42,0.08)",
              fontSize: 12,
              fontWeight: 700,
            }}
            formatter={(value) => [`${value}`, "Assessments"]}
            labelStyle={{ color: "#86868B", fontWeight: 700 }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#007AFF"
            strokeWidth={2}
            dot={{ r: 3, fill: "#007AFF", stroke: "#007AFF", strokeWidth: 2 }}
            activeDot={{ r: 4, fill: "#007AFF", stroke: "#007AFF", strokeWidth: 2 }}
            animationDuration={700}
            animationEasing="ease-out"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
