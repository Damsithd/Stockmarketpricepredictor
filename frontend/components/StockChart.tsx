"use client";

import { useEffect, useRef } from "react";
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Tooltip,
  Legend,
  type ChartData,
  type ChartOptions,
} from "chart.js";

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Tooltip,
  Legend
);

interface DataPoint {
  date: string;
  price: number;
}

interface PredictionData {
  ticker: string;
  historical: DataPoint[];
  forecast: DataPoint[];
}

interface StockChartProps {
  datasets: PredictionData[];
  normalized?: boolean;
}

const COLORS = [
  "rgb(59, 130, 246)", // Blue
  "rgb(16, 185, 129)", // Green
  "rgb(245, 158, 11)", // Yellow
  "rgb(239, 68, 68)",  // Red
  "rgb(139, 92, 246)", // Purple
];

export default function StockChart({ datasets, normalized = false }: StockChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current || datasets.length === 0) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    // Use labels from the first dataset
    const baseDataset = datasets[0];
    const labels = baseDataset.historical.map((d) => d.date);
    const forecastLabels = baseDataset.forecast.map((d) => d.date);
    const combinedLabels = [...labels, ...forecastLabels];

    const chartDatasets: any[] = [];

    datasets.forEach((data, index) => {
      const color = COLORS[index % COLORS.length];
      const basePrice = data.historical[0]?.price || 1;

      // Normalize if requested (percentage change)
      const processPrice = (p: number) => normalized ? ((p - basePrice) / basePrice) * 100 : p;

      const histData = data.historical.map((d) => processPrice(d.price));
      const nullsForForecast = new Array(data.historical.length - 1).fill(null);
      const lastHistPoint = processPrice(data.historical[data.historical.length - 1].price);
      const foreData = [lastHistPoint, ...data.forecast.map((d) => processPrice(d.price))];

      // Historical line
      chartDatasets.push({
        label: `${data.ticker} Historical`,
        data: [...histData, ...new Array(data.forecast.length).fill(null)],
        borderColor: color,
        backgroundColor: color.replace("rgb", "rgba").replace(")", ", 0.1)"),
        borderWidth: 2,
        tension: 0.1,
        pointRadius: 0,
        pointHoverRadius: 4,
        fill: datasets.length === 1, // Only fill if single stock
      });

      // Forecast line
      chartDatasets.push({
        label: `${data.ticker} Forecast`,
        data: [...nullsForForecast, ...foreData],
        borderColor: color,
        backgroundColor: color.replace("rgb", "rgba").replace(")", ", 0.1)"),
        borderWidth: 2,
        borderDash: [5, 5],
        tension: 0.1,
        pointRadius: 2,
        pointHoverRadius: 6,
        pointBackgroundColor: color,
        fill: datasets.length === 1,
      });
    });

    const dataObj: ChartData<"line"> = {
      labels: combinedLabels,
      datasets: chartDatasets,
    };

    const options: ChartOptions<"line"> = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index",
        intersect: false,
      },
      plugins: {
        legend: {
          position: "top",
          labels: {
            color: "#9ca3af",
            usePointStyle: true,
            boxWidth: 8,
          },
        },
        tooltip: {
          backgroundColor: "rgba(17, 24, 39, 0.9)",
          titleColor: "#f3f4f6",
          bodyColor: "#d1d5db",
          borderColor: "#374151",
          borderWidth: 1,
          padding: 10,
          displayColors: true,
          callbacks: {
            label: (ctx) => normalized ? `${ctx.parsed.y?.toFixed(2)}%` : `$${ctx.parsed.y?.toFixed(2)}`,
          },
        },
      },
      scales: {
        x: {
          grid: { color: "rgba(55, 65, 81, 0.3)" },
          ticks: { color: "#6b7280", maxTicksLimit: 10 },
        },
        y: {
          grid: { color: "rgba(55, 65, 81, 0.3)" },
          ticks: {
            color: "#6b7280",
            callback: (value) => normalized ? `${value}%` : `$${value}`,
          },
        },
      },
    };

    chartRef.current = new Chart(ctx, { type: "line", data: dataObj, options });

    return () => {
      chartRef.current?.destroy();
    };
  }, [datasets, normalized]);

  return <canvas ref={canvasRef} id="predictionChart" />;
}
