"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type DailyPoint = {
  date: string;
  users: number;
  sessions: number;
  revenue: number;
  purchases: number;
};

type Props = {
  data: DailyPoint[];
  primaryMetric?: "sessions" | "users" | "revenue" | "purchases";
};

const compactNum = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return `${n}`;
};

const labelFromDate = (date: string) => {
  const d = new Date(date + "T00:00:00");
  return d.toLocaleDateString("en-CA", { month: "short", day: "numeric" });
};

export function TrafficChart({ data, primaryMetric = "sessions" }: Props) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
        <defs>
          <linearGradient id="trafficGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.04} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={labelFromDate}
          minTickGap={24}
        />
        <YAxis
          tickFormatter={compactNum}
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          tickLine={false}
          axisLine={false}
          width={48}
        />
        <Tooltip
          formatter={(value, name) => [compactNum(Number(value)), String(name)]}
          labelFormatter={(label) => labelFromDate(String(label))}
          contentStyle={{
            background: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "var(--radius)",
            fontSize: 12,
          }}
        />
        <Area
          type="monotone"
          dataKey={primaryMetric}
          name={primaryMetric.charAt(0).toUpperCase() + primaryMetric.slice(1)}
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          fill="url(#trafficGrad)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
