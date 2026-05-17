"use client";

import { useState, useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";
import { DataPoint } from "@/lib/api";

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Filler, Tooltip, Legend
);

interface Props {
  historical: DataPoint[];
}

type TabId =
  | "bollinger" | "rsi" | "macd"
  | "stochastic" | "obv" | "williams" | "cci" | "atr";

const TABS: { id: TabId; label: string; description: string }[] = [
  { id: "bollinger",  label: "Bollinger",    description: "Price ± 2σ band — shows volatility envelope" },
  { id: "rsi",        label: "RSI",           description: "Relative Strength Index 0–100 (30 = oversold, 70 = overbought)" },
  { id: "macd",       label: "MACD",          description: "MACD line, Signal line, and histogram — momentum direction" },
  { id: "stochastic", label: "Stochastic",    description: "%K / %D oscillator — overbought above 80, oversold below 20" },
  { id: "obv",        label: "OBV",           description: "On-Balance Volume — volume-based trend confirmation" },
  { id: "williams",   label: "Williams %R",   description: "Momentum oscillator 0 to −100 (above −20 = overbought, below −80 = oversold)" },
  { id: "cci",        label: "CCI",           description: "Commodity Channel Index — cyclical deviation from average price" },
  { id: "atr",        label: "ATR",           description: "Average True Range — measures market volatility (14-day)" },
];

// Common chart options factory
function baseOptions(yMin?: number, yMax?: number, isDark = false) {
  const gridColor  = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const labelColor = isDark ? "#94a3b8" : "#64748b";
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 300 },
    interaction: { mode: "index" as const, intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: isDark ? "#1e293b" : "#ffffff",
        borderColor: isDark ? "#334155" : "#e2e8f0",
        borderWidth: 1,
        titleColor: isDark ? "#f1f5f9" : "#0f172a",
        bodyColor:  isDark ? "#94a3b8" : "#475569",
        padding: 10,
      },
    },
    scales: {
      x: {
        ticks: { color: labelColor, maxTicksLimit: 8, font: { size: 10 } },
        grid:  { color: gridColor },
      },
      y: {
        min: yMin,
        max: yMax,
        ticks: { color: labelColor, font: { size: 10 } },
        grid:  { color: gridColor },
      },
    },
  };
}

function SignalBadge({ value, label }: { value: string; label: string }) {
  const colors: Record<string, string> = {
    Bullish:      "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    Bearish:      "bg-red-100   text-red-700   dark:bg-red-900/40   dark:text-red-300",
    Overbought:   "bg-red-100   text-red-700   dark:bg-red-900/40   dark:text-red-300",
    Oversold:     "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    Neutral:      "bg-slate-100 text-slate-600 dark:bg-slate-700    dark:text-slate-300",
    Rising:       "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    Falling:      "bg-red-100   text-red-700   dark:bg-red-900/40   dark:text-red-300",
    "Low Vol.":   "bg-blue-100  text-blue-700  dark:bg-blue-900/40  dark:text-blue-300",
    "High Vol.":  "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${colors[label] ?? colors["Neutral"]}`}>
      {value} · {label}
    </span>
  );
}

export default function IndicatorPanel({ historical }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("bollinger");

  // Use last 120 points for readability
  const slice = useMemo(() => historical.slice(-120), [historical]);
  const labels = useMemo(() => slice.map((d) => d.date.slice(5)), [slice]); // MM-DD

  // Latest values for signal badges
  const latest = slice[slice.length - 1] ?? {};

  // ── Tab content data ──────────────────────────────────────────────────────

  const bollingerData = useMemo(() => ({
    labels,
    datasets: [
      {
        label: "Upper Band",
        data: slice.map((d) => d.bb_upper ?? null),
        borderColor: "rgba(234,179,8,0.6)",
        borderWidth: 1.5,
        borderDash: [4, 3],
        fill: false,
        pointRadius: 0,
        tension: 0.3,
      },
      {
        label: "Price",
        data: slice.map((d) => d.close ?? d.price),
        borderColor: "#378ADD",
        borderWidth: 2,
        fill: false,
        pointRadius: 0,
        tension: 0.3,
      },
      {
        label: "SMA 20",
        data: slice.map((d) => d.sma20 ?? null),
        borderColor: "rgba(139,92,246,0.7)",
        borderWidth: 1.5,
        fill: false,
        pointRadius: 0,
        tension: 0.3,
      },
      {
        label: "Lower Band",
        data: slice.map((d) => d.bb_lower ?? null),
        borderColor: "rgba(234,179,8,0.6)",
        borderWidth: 1.5,
        borderDash: [4, 3],
        fill: false,
        pointRadius: 0,
        tension: 0.3,
      },
    ],
  }), [slice, labels]);

  const rsiData = useMemo(() => ({
    labels,
    datasets: [{
      label: "RSI",
      data: slice.map((d) => d.rsi ?? null),
      borderColor: "#185FA5",
      backgroundColor: "rgba(24,95,165,0.08)",
      borderWidth: 2,
      fill: true,
      pointRadius: 0,
      tension: 0.3,
    }],
  }), [slice, labels]);

  const macdData = useMemo(() => {
    const hist  = slice.map((d) => d.macd_hist ?? null);
    const colors = hist.map((v) => (v ?? 0) >= 0
      ? "rgba(15,110,86,0.7)" : "rgba(153,60,29,0.7)");
    return {
      labels,
      datasets: [
        {
          type: "bar" as const,
          label: "Histogram",
          data: hist,
          backgroundColor: colors,
          borderWidth: 0,
        },
        {
          type: "line" as const,
          label: "MACD",
          data: slice.map((d) => d.macd ?? null),
          borderColor: "#185FA5",
          borderWidth: 2,
          fill: false,
          pointRadius: 0,
          tension: 0.3,
        },
        {
          type: "line" as const,
          label: "Signal",
          data: slice.map((d) => d.macd_signal ?? null),
          borderColor: "#f97316",
          borderWidth: 1.5,
          borderDash: [4, 3],
          fill: false,
          pointRadius: 0,
          tension: 0.3,
        },
      ],
    };
  }, [slice, labels]);

  const stochData = useMemo(() => ({
    labels,
    datasets: [
      {
        label: "%K",
        data: slice.map((d) => d.stoch_k ?? null),
        borderColor: "#185FA5",
        borderWidth: 2,
        fill: false,
        pointRadius: 0,
        tension: 0.3,
      },
      {
        label: "%D",
        data: slice.map((d) => d.stoch_d ?? null),
        borderColor: "#f97316",
        borderWidth: 1.5,
        borderDash: [4, 3],
        fill: false,
        pointRadius: 0,
        tension: 0.3,
      },
    ],
  }), [slice, labels]);

  const obvData = useMemo(() => ({
    labels,
    datasets: [{
      label: "OBV",
      data: slice.map((d) => d.obv ?? null),
      borderColor: "#1D9E75",
      backgroundColor: "rgba(29,158,117,0.08)",
      borderWidth: 2,
      fill: true,
      pointRadius: 0,
      tension: 0.3,
    }],
  }), [slice, labels]);

  const williamsData = useMemo(() => ({
    labels,
    datasets: [{
      label: "Williams %R",
      data: slice.map((d) => d.williams_r ?? null),
      borderColor: "#8b5cf6",
      backgroundColor: "rgba(139,92,246,0.08)",
      borderWidth: 2,
      fill: true,
      pointRadius: 0,
      tension: 0.3,
    }],
  }), [slice, labels]);

  const cciData = useMemo(() => ({
    labels,
    datasets: [{
      label: "CCI",
      data: slice.map((d) => d.cci ?? null),
      borderColor: "#f97316",
      backgroundColor: "rgba(249,115,22,0.08)",
      borderWidth: 2,
      fill: true,
      pointRadius: 0,
      tension: 0.3,
    }],
  }), [slice, labels]);

  const atrData = useMemo(() => ({
    labels,
    datasets: [{
      label: "ATR (14)",
      data: slice.map((d) => d.atr ?? null),
      borderColor: "#06b6d4",
      backgroundColor: "rgba(6,182,212,0.08)",
      borderWidth: 2,
      fill: true,
      pointRadius: 0,
      tension: 0.3,
    }],
  }), [slice, labels]);

  // ── Signal interpretation ─────────────────────────────────────────────────
  function getRsiSignal() {
    const v = latest.rsi;
    if (v == null) return null;
    const label = v > 70 ? "Overbought" : v < 30 ? "Oversold" : "Neutral";
    return <SignalBadge value={`${v.toFixed(1)}`} label={label} />;
  }
  function getMacdSignal() {
    const v = latest.macd;
    if (v == null) return null;
    return <SignalBadge value={v >= 0 ? `+${v.toFixed(3)}` : `${v.toFixed(3)}`} label={v >= 0 ? "Bullish" : "Bearish"} />;
  }
  function getStochSignal() {
    const v = latest.stoch_k;
    if (v == null) return null;
    const label = v > 80 ? "Overbought" : v < 20 ? "Oversold" : "Neutral";
    return <SignalBadge value={`${v.toFixed(1)}`} label={label} />;
  }
  function getObvSignal() {
    const recent5 = slice.slice(-5).map((d) => d.obv ?? 0);
    const trend = recent5[4] > recent5[0];
    return <SignalBadge value="OBV" label={trend ? "Rising" : "Falling"} />;
  }
  function getWilliamsSignal() {
    const v = latest.williams_r;
    if (v == null) return null;
    const label = v > -20 ? "Overbought" : v < -80 ? "Oversold" : "Neutral";
    return <SignalBadge value={`${v.toFixed(1)}`} label={label} />;
  }
  function getCciSignal() {
    const v = latest.cci;
    if (v == null) return null;
    const label = v > 100 ? "Overbought" : v < -100 ? "Oversold" : "Neutral";
    return <SignalBadge value={`${v.toFixed(0)}`} label={label} />;
  }
  function getAtrSignal() {
    const vals = slice.map((d) => d.atr).filter((v): v is number => v != null);
    const med = vals[Math.floor(vals.length / 2)] ?? 0;
    const cur = latest.atr ?? 0;
    const label = cur > med * 1.3 ? "High Vol." : cur < med * 0.7 ? "Low Vol." : "Neutral";
    return <SignalBadge value={`${cur.toFixed(2)}`} label={label} />;
  }

  const signalMap: Record<TabId, React.ReactNode> = {
    bollinger:  latest.bb_upper ? <SignalBadge value={`${((latest.close ?? latest.price) > (latest.bb_middle ?? 0) ? "Above" : "Below")} SMA20`} label={latest.rsi && latest.rsi > 70 ? "Overbought" : latest.rsi && latest.rsi < 30 ? "Oversold" : "Neutral"} /> : null,
    rsi:        getRsiSignal(),
    macd:       getMacdSignal(),
    stochastic: getStochSignal(),
    obv:        getObvSignal(),
    williams:   getWilliamsSignal(),
    cci:        getCciSignal(),
    atr:        getAtrSignal(),
  };

  // ── Chart renderer ────────────────────────────────────────────────────────
  function renderChart() {
    const opts = baseOptions();
    switch (activeTab) {
      case "bollinger":
        return <Line data={bollingerData} options={{ ...opts, plugins: { ...opts.plugins, legend: { display: true, labels: { boxWidth: 12, font: { size: 10 }, color: "#64748b" } } } }} />;
      case "rsi":
        return <Line data={rsiData} options={{ ...baseOptions(0, 100), plugins: { ...opts.plugins } }} />;
      case "macd":
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return <Bar data={macdData as any} options={{ ...opts }} />;
      case "stochastic":
        return <Line data={stochData} options={{ ...baseOptions(0, 100), plugins: { ...opts.plugins, legend: { display: true, labels: { boxWidth: 12, font: { size: 10 }, color: "#64748b" } } } }} />;
      case "obv":
        return <Line data={obvData} options={opts} />;
      case "williams":
        return <Line data={williamsData} options={baseOptions(-100, 0)} />;
      case "cci":
        return <Line data={cciData} options={opts} />;
      case "atr":
        return <Line data={atrData} options={opts} />;
    }
  }

  const activeTabInfo = TABS.find((t) => t.id === activeTab)!;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-[13px] font-medium text-slate-900 dark:text-white">
            Technical Indicators
          </h2>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
            {activeTabInfo.description}
          </p>
        </div>
        {signalMap[activeTab] && (
          <div className="shrink-0">{signalMap[activeTab]}</div>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 flex-wrap mb-4 pb-3 border-b border-slate-100 dark:border-slate-700">
        {TABS.map((t) => (
          <button
            key={t.id}
            id={`indicator-tab-${t.id}`}
            onClick={() => setActiveTab(t.id)}
            className={`px-3 py-1 rounded-lg text-[11px] font-medium transition-colors ${
              activeTab === t.id
                ? "bg-[#185FA5] text-white"
                : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Threshold legend for oscillators */}
      {(activeTab === "rsi" || activeTab === "stochastic") && (
        <div className="flex items-center gap-4 mb-2">
          {activeTab === "rsi" && (
            <>
              <span className="text-[10px] text-red-500">── 70 Overbought</span>
              <span className="text-[10px] text-green-600">── 30 Oversold</span>
            </>
          )}
          {activeTab === "stochastic" && (
            <>
              <span className="text-[10px] text-red-500">── 80 Overbought</span>
              <span className="text-[10px] text-green-600">── 20 Oversold</span>
            </>
          )}
        </div>
      )}
      {activeTab === "williams" && (
        <div className="flex items-center gap-4 mb-2">
          <span className="text-[10px] text-red-500">── −20 Overbought</span>
          <span className="text-[10px] text-green-600">── −80 Oversold</span>
        </div>
      )}
      {activeTab === "cci" && (
        <div className="flex items-center gap-4 mb-2">
          <span className="text-[10px] text-red-500">── +100 Overbought</span>
          <span className="text-[10px] text-green-600">── −100 Oversold</span>
        </div>
      )}

      {/* Chart */}
      <div className="h-[240px] w-full">
        {renderChart()}
      </div>

      {/* Quick-stat row */}
      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "RSI (14)",     value: latest.rsi?.toFixed(1) ?? "—" },
          { label: "MACD",         value: latest.macd != null ? (latest.macd >= 0 ? `+${latest.macd.toFixed(3)}` : latest.macd.toFixed(3)) : "—" },
          { label: "Stoch %K",     value: latest.stoch_k?.toFixed(1) ?? "—" },
          { label: "ATR (14)",     value: latest.atr?.toFixed(2) ?? "—" },
          { label: "Williams %R",  value: latest.williams_r?.toFixed(1) ?? "—" },
          { label: "CCI (20)",     value: latest.cci?.toFixed(0) ?? "—" },
          { label: "BB Upper",     value: latest.bb_upper != null ? `$${latest.bb_upper.toFixed(2)}` : "—" },
          { label: "BB Lower",     value: latest.bb_lower != null ? `$${latest.bb_lower.toFixed(2)}` : "—" },
        ].map(({ label, value }) => (
          <div key={label} className="bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2">
            <p className="text-[10px] text-slate-400 dark:text-slate-500">{label}</p>
            <p className="text-[12px] font-semibold text-slate-800 dark:text-slate-100 mt-0.5 font-mono">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
