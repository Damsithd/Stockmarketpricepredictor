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

// Register Chart.js components (LineController is required for type: "line")
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

interface StockChartProps {
  historical: DataPoint[];
  forecast: DataPoint[];
}

export default function StockChart({ historical, forecast }: StockChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Destroy previous chart instance
    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const labels = historical.map((d) => d.date);
    const histData = historical.map((d) => d.price);
    const nullsForForecast = new Array(historical.length - 1).fill(null);

    const lastHistPoint = historical[historical.length - 1];
    const forecastLabels = forecast.map((d) => d.date);
    const foreData = [lastHistPoint.price, ...forecast.map((d) => d.price)];

    const combinedLabels = [...labels, ...forecastLabels];

    const data: ChartData<"line"> = {
      labels: combinedLabels,
      datasets: [
        {
          label: "Historical Price",
          data: [...histData, ...new Array(forecast.length).fill(null)],
          borderColor: "rgb(156, 163, 175)",
          backgroundColor: "rgba(156, 163, 175, 0.1)",
          borderWidth: 2,
          tension: 0.1,
          pointRadius: 0,
          pointHoverRadius: 4,
          fill: true,
        },
        {
          label: "LSTM Forecast",
          data: [...nullsForForecast, ...foreData],
          borderColor: "rgb(59, 130, 246)",
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          borderWidth: 2,
          borderDash: [5, 5],
          tension: 0.1,
          pointRadius: 2,
          pointHoverRadius: 6,
          pointBackgroundColor: "rgb(59, 130, 246)",
          fill: true,
        },
      ],
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
            label: (ctx) => `$${ctx.parsed.y?.toFixed(2) ?? ""}`,
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
            callback: (value) => `$${value}`,
          },
        },
      },
    };

    chartRef.current = new Chart(ctx, { type: "line", data, options });

    return () => {
      chartRef.current?.destroy();
    };
  }, [historical, forecast]);

  return <canvas ref={canvasRef} id="predictionChart" />;
}
