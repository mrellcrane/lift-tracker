"use client";

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

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-800 bg-opacity-90 text-white p-3 rounded-lg shadow-lg border border-slate-700">
        <p className="font-semibold">{`Date: ${new Date(
          data.created_at
        ).toLocaleDateString()}`}</p>
        <p>{`Set: ${data.reps} reps @ ${data.weight} lbs`}</p>
        <p className="text-blue-400">{`Volume: ${
          data.weight * data.reps
        } lbs`}</p>
      </div>
    );
  }
  return null;
};

export default function ProgressChart({ data }: { data: any[] }) {
  if (data.length === 0) {
    return (
      <div className="text-center text-slate-400 py-8">
        <h3 className="text-xl font-semibold my-4 text-slate-300">
          Overall Progress
        </h3>
        <p>Log a session to see your progress chart!</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-xl font-semibold my-4 text-slate-300">
        Overall Progress
      </h3>
      <div className="w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
            <XAxis
              dataKey="created_at"
              tickFormatter={(ts) => new Date(ts).toLocaleDateString()}
              stroke="#94a3b8"
              type="category"
              domain={["dataMin", "dataMax"]}
            />
            <YAxis
              stroke="#94a3b8"
              yAxisId="left"
              domain={["auto", "auto"]}
              label={{
                value: "Weight (lbs)",
                angle: -90,
                position: "insideLeft",
                fill: "#94a3b8",
                dx: -10,
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ color: "#94a3b8" }} />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="weight"
              stroke="#38bdf8"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 8 }}
              name="Weight Lifted"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
} 