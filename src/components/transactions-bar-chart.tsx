import * as React from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
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
import { TxnsTagYear } from "@/lib/transactions";

interface Props {
  title: string;
  description: string;
  inflowData: TxnsTagYear[];
  outflowData: TxnsTagYear[];
}

export default function TransactionsBarChart({
  title,
  description,
  inflowData,
  outflowData,
}: Props) {
  const [chartData, chartConfig] = React.useMemo(() => {
    const data = [
      ...inflowData.map((v) => {
        return { ...v, amount: Math.abs(v.amount) };
      }),
      ...outflowData.map((v) => {
        return { ...v, amount: -Math.abs(v.amount) };
      }),
    ];
    console.log(`BarChart data: ${JSON.stringify(data)}`);
    const amountsByTagsByYears = data.reduce((acc, cur) => {
      const amountsByTags = acc.get(cur.year) ?? new Map<string, number>();
      const tag = cur.tag || "uncategorized";
      amountsByTags.set(tag, cur.amount);
      acc.set(cur.year, amountsByTags);
      return acc;
    }, new Map<number, Map<string, number>>());

    const tags = [...new Set(data.map((d) => d.tag || "uncategorized"))];

    const chartData = amountsByTagsByYears
      .entries()
      .map(([year, amountsByTag]) => {
        const yearData: { year: number; [key: string]: number } = { year };
        tags.forEach((tag) => {
          const a = amountsByTag.get(tag) ?? 0;
          yearData[tag] = a;
          console.log(`Set year=${year}, tag=${tag}, amount=${a}`);
        });
        return yearData;
      })
      .toArray();

    const config: ChartConfig = {};
    tags.forEach((tag, index) => {
      config[tag] = {
        label: tag.charAt(0).toUpperCase() + tag.slice(1),
        color: `hsl(var(--chart-${(index % 5) + 1}))`,
      };
    });

    return [chartData, config];
  }, [inflowData, outflowData]);
  console.log(`Computed chartData=${JSON.stringify(chartData)}`);
  console.log(`Computed chartConfig=${JSON.stringify(chartConfig)}`);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="year"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => String(value)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <ChartLegend content={<ChartLegendContent />} />
            {Object.keys(chartConfig).map((key) => (
              <Bar
                key={key}
                dataKey={key}
                stackId="a"
                fill={`var(--color-${key})`}
              />
            ))}
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
