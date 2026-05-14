"use client";

import { useEffect, useRef, useState } from "react";
import { createChart, IChartApi, ISeriesApi, Time, LineStyle, CrosshairMode } from "lightweight-charts";
import { DataPoint, PredictionResponse } from "@/lib/api";

interface StockChartProps {
  datasets: PredictionResponse[];
  normalized?: boolean;
}

const COLORS = [
  "#3b82f6", // Blue
  "#10b981", // Green
  "#f59e0b", // Yellow
  "#ef4444", // Red
  "#8b5cf6", // Purple
];

// Simple SMA calculator
function calculateSMA(data: number[], period: number) {
  const sma = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      sma.push(null);
    } else {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      sma.push(sum / period);
    }
  }
  return sma;
}

// Bollinger Bands calculator
function calculateBollingerBands(data: number[], period: number, stdDevMult: number) {
  const upper = [];
  const lower = [];
  const sma = calculateSMA(data, period);
  
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      upper.push(null);
      lower.push(null);
    } else {
      const slice = data.slice(i - period + 1, i + 1);
      const mean = sma[i] as number;
      const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / period;
      const stdDev = Math.sqrt(variance);
      upper.push(mean + stdDevMult * stdDev);
      lower.push(mean - stdDevMult * stdDev);
    }
  }
  return { upper, lower };
}

export default function StockChart({ datasets, normalized = false }: StockChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  
  // Overlays state
  const [showBB, setShowBB] = useState(false);
  const [showSMA, setShowSMA] = useState(false);

  // Store series refs for toggling
  const seriesRefs = useRef<{
    bbUpper?: ISeriesApi<"Line">;
    bbLower?: ISeriesApi<"Line">;
    sma?: ISeriesApi<"Line">;
  }>({});

  useEffect(() => {
    if (!chartContainerRef.current || datasets.length === 0) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: "transparent" },
        textColor: "#9ca3af",
      },
      grid: {
        vertLines: { color: "rgba(55, 65, 81, 0.3)" },
        horzLines: { color: "rgba(55, 65, 81, 0.3)" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      rightPriceScale: {
        borderColor: "rgba(55, 65, 81, 0.5)",
      },
      timeScale: {
        borderColor: "rgba(55, 65, 81, 0.5)",
        timeVisible: true,
      },
      autoSize: true,
    });
    chartRef.current = chart;

    if (normalized) {
      // Comparative Line Chart Mode
      datasets.forEach((data, index) => {
        const lineSeries = chart.addLineSeries({
          color: COLORS[index % COLORS.length],
          lineWidth: 2,
          title: data.ticker,
        });

        const basePrice = data.historical[0]?.price || 1;
        const processData = (pts: DataPoint[]) =>
          pts.map((d) => ({
            time: (new Date(d.date).getTime() / 1000) as Time,
            value: ((d.price - basePrice) / basePrice) * 100,
          }));

        const combined = [...processData(data.historical), ...processData(data.forecast)];
        // sort by time
        combined.sort((a, b) => (a.time as number) - (b.time as number));
        // Remove duplicates if any
        const uniqueCombined = combined.filter((v, i, a) => i === 0 || v.time !== a[i - 1].time);
        
        lineSeries.setData(uniqueCombined);
      });
    } else {
      // Single Ticker Advanced Dashboard
      const data = datasets[0];
      
      // 1. Candlestick Series
      const candleSeries = chart.addCandlestickSeries({
        upColor: "#10b981",
        downColor: "#ef4444",
        borderVisible: false,
        wickUpColor: "#10b981",
        wickDownColor: "#ef4444",
        title: data.ticker,
      });

      const candleData = data.historical.map(d => ({
        time: (new Date(d.date).getTime() / 1000) as Time,
        open: d.open ?? d.price,
        high: d.high ?? d.price,
        low: d.low ?? d.price,
        close: d.close ?? d.price,
      })).sort((a, b) => (a.time as number) - (b.time as number));
      
      candleSeries.setData(candleData);

      // 2. Volume Series (Histogram at bottom)
      const volumeSeries = chart.addHistogramSeries({
        priceFormat: { type: 'volume' },
        priceScaleId: '', // set as an overlay by not attaching to right scale
      });
      chart.priceScale('').applyOptions({
        scaleMargins: { top: 0.8, bottom: 0 },
      });

      // Calculate volume moving average for spike detection
      const vols = data.historical.map(d => d.volume || 0);
      const avgVol = vols.reduce((a, b) => a + b, 0) / (vols.length || 1);

      const volumeData = data.historical.map(d => {
        const vol = d.volume || 0;
        const isSpike = vol > avgVol * 1.5;
        const isUp = (d.close ?? d.price) >= (d.open ?? d.price);
        
        // Spike = Yellow, Up = Green/translucent, Down = Red/translucent
        const color = isSpike ? "rgba(245, 158, 11, 0.8)" : isUp ? "rgba(16, 185, 129, 0.4)" : "rgba(239, 68, 68, 0.4)";
        
        return {
          time: (new Date(d.date).getTime() / 1000) as Time,
          value: vol,
          color: color,
        };
      }).sort((a, b) => (a.time as number) - (b.time as number));

      volumeSeries.setData(volumeData);

      // 3. Forecast Line Series
      const forecastSeries = chart.addLineSeries({
        color: "#3b82f6",
        lineStyle: LineStyle.Dashed,
        lineWidth: 2,
        title: "AI Forecast",
      });

      const lastHist = candleData[candleData.length - 1];
      const foreData = [
        { time: lastHist.time, value: lastHist.close }, // connect to last historical point
        ...data.forecast.map(d => ({
          time: (new Date(d.date).getTime() / 1000) as Time,
          value: d.price
        }))
      ].sort((a, b) => (a.time as number) - (b.time as number));

      // filter duplicates
      const uniqueFore = foreData.filter((v, i, a) => i === 0 || v.time !== a[i - 1].time);
      forecastSeries.setData(uniqueFore);

      // Store overlays data for toggling
      const closes = candleData.map(d => d.close);
      
      // Calculate BB
      const { upper, lower } = calculateBollingerBands(closes, 20, 2);
      const bbUpperData = candleData.map((d, i) => ({ time: d.time, value: upper[i] })).filter(d => d.value !== null) as {time: Time, value: number}[];
      const bbLowerData = candleData.map((d, i) => ({ time: d.time, value: lower[i] })).filter(d => d.value !== null) as {time: Time, value: number}[];
      
      // Calculate SMA 20
      const smaDataRaw = calculateSMA(closes, 20);
      const smaDataLine = candleData.map((d, i) => ({ time: d.time, value: smaDataRaw[i] })).filter(d => d.value !== null) as {time: Time, value: number}[];

      // Add Series but keep them hidden initially
      const bbUpperSeries = chart.addLineSeries({ color: 'rgba(59, 130, 246, 0.5)', lineWidth: 1, title: 'BB Upper' });
      const bbLowerSeries = chart.addLineSeries({ color: 'rgba(59, 130, 246, 0.5)', lineWidth: 1, title: 'BB Lower' });
      const smaSeries = chart.addLineSeries({ color: '#f59e0b', lineWidth: 2, title: 'SMA 20' });

      bbUpperSeries.setData(bbUpperData);
      bbLowerSeries.setData(bbLowerData);
      smaSeries.setData(smaDataLine);

      // Hide by default
      bbUpperSeries.applyOptions({ visible: false });
      bbLowerSeries.applyOptions({ visible: false });
      smaSeries.applyOptions({ visible: false });

      seriesRefs.current = { bbUpper: bbUpperSeries, bbLower: bbLowerSeries, sma: smaSeries };
      
      chart.timeScale().fitContent();
    }

    return () => {
      chart.remove();
      chartRef.current = null;
    };
  }, [datasets, normalized]);

  // Effect to handle toggles without recreating the whole chart
  useEffect(() => {
    if (seriesRefs.current.bbUpper && seriesRefs.current.bbLower) {
      seriesRefs.current.bbUpper.applyOptions({ visible: showBB });
      seriesRefs.current.bbLower.applyOptions({ visible: showBB });
    }
    if (seriesRefs.current.sma) {
      seriesRefs.current.sma.applyOptions({ visible: showSMA });
    }
  }, [showBB, showSMA]);

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Chart Controls (only show in single ticker mode) */}
      {!normalized && (
        <div className="absolute top-4 left-4 z-10 flex gap-2">
          <button
            onClick={() => setShowSMA(!showSMA)}
            className={`px-3 py-1 rounded text-xs font-medium backdrop-blur-md transition-colors ${
              showSMA 
                ? "bg-yellow-500/20 border border-yellow-500/50 text-yellow-400" 
                : "bg-gray-900/60 border border-gray-700 text-gray-400 hover:text-white"
            }`}
          >
            SMA 20
          </button>
          <button
            onClick={() => setShowBB(!showBB)}
            className={`px-3 py-1 rounded text-xs font-medium backdrop-blur-md transition-colors ${
              showBB 
                ? "bg-blue-500/20 border border-blue-500/50 text-blue-400" 
                : "bg-gray-900/60 border border-gray-700 text-gray-400 hover:text-white"
            }`}
          >
            Bollinger Bands
          </button>
          <div className="flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-900/60 border border-gray-700 text-gray-400 backdrop-blur-md ml-2 gap-2">
             <div className="w-2 h-2 rounded-full bg-yellow-500 opacity-80" /> AI Volume Spikes
          </div>
        </div>
      )}
      
      {/* Chart Container */}
      <div ref={chartContainerRef} className="w-full h-full min-h-[400px]" />
    </div>
  );
}
