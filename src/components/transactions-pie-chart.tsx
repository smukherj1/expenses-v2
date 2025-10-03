import * as React from "react";
import { Pie, PieChart } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { TxnsTag } from "@/lib/transactions";

interface Props {
  title: string;
  dataKey: "amount" | "count";
  description?: string;
  data: TxnsTag[];
}

export default function TransactionsPieChart({
  title,
  dataKey,
  description,
  data,
}: Props) {
  const [chartData, chartConfig] = React.useMemo(() => {
    const chartData = data.map((item) => ({
      name: item.tag || "uncategorized",
      total: dataKey === "amount" ? item.amount : item.count,
      fill: `var(--color-${item.tag || "uncategorized"})`,
    }));
    const config: ChartConfig = {
      total: {
        label: "Total",
      },
    };
    chartData.forEach((item, index) => {
      const key = item.name;
      config[key] = {
        label: key.charAt(0).toUpperCase() + key.slice(1),
        color: `var(--chart-${(index % 5) + 1})`,
      };
    });
    return [chartData, config];
  }, [data, dataKey]);
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[300px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie data={chartData} dataKey="total" nameKey="name" />
            <ChartLegend
              content={<ChartLegendContent nameKey="name" />}
              className="-translate-y-2 flex-wrap gap-2 *:basis-1/4 *:justify-center"
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
