"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatCurrency } from "@/lib/format";

type ComparisonPoint = {
  code: string;
  name: string;
  revenue: number;
  grossProfit: number;
  isSelected: boolean;
};

type Props = { data: ComparisonPoint[] };

const compactCurrency = (n: number) => {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
  return `$${n}`;
};

export function DivisionComparisonChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis
          dataKey="code"
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tickFormatter={compactCurrency}
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          tickLine={false}
          axisLine={false}
          width={48}
        />
        <Tooltip
          formatter={(value, name) => [formatCurrency(Number(value)), String(name)]}
          labelFormatter={(label, payload) => {
            const point = payload?.[0]?.payload as ComparisonPoint | undefined;
            return point?.name ?? String(label);
          }}
          contentStyle={{
            background: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "var(--radius)",
            fontSize: 12,
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} iconSize={10} />
        <Bar dataKey="revenue" name="Revenue" fill="hsl(var(--primary))">
          {data.map((d) => (
            <Cell
              key={d.code}
              opacity={d.isSelected ? 1 : 0.7}
              stroke={d.isSelected ? "hsl(var(--ring))" : "transparent"}
              strokeWidth={d.isSelected ? 2 : 0}
            />
          ))}
        </Bar>
        <Bar dataKey="grossProfit" name="Gross Profit" fill="hsl(var(--success))">
          {data.map((d) => (
            <Cell key={`${d.code}-gp`} opacity={d.isSelected ? 1 : 0.7} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
