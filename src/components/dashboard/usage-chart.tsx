"use client"

import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '../ui/chart';
import type { HistoricalDataPoint } from '../../lib/types';

interface UsageChartProps {
  data: HistoricalDataPoint[];
}

const chartConfig = {
  'consumption': {
    label: 'Consumption',
    color: 'hsl(var(--chart-1))',
  },
  'generation': {
    label: 'Generation',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig;

export function UsageChart({ data }: UsageChartProps) {
  return (
    <div className="h-[250px] w-full">
      <ChartContainer config={chartConfig} className="h-full w-full">
        <LineChart
          accessibilityLayer
          data={data}
          margin={{
            top: 20,
            right: 10,
            left: -10,
            bottom: 0,
          }}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="time"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value, index) => {
              if (index % 3 === 0) {
                return value;
              }
              return "";
            }}
          />
          <YAxis
             tickLine={false}
             axisLine={false}
             tickMargin={8}
             tickFormatter={(value) => `${value} kWh`}
          />
          <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
          <Legend />
          <Line
            dataKey="consumption"
            type="monotone"
            stroke="var(--color-consumption)"
            strokeWidth={2}
            dot={false}
            name="Consumption"
          />
           <Line
            dataKey="generation"
            type="monotone"
            stroke="var(--color-generation)"
            strokeWidth={2}
            dot={false}
            name="Generation"
          />
        </LineChart>
      </ChartContainer>
    </div>
  );
}
