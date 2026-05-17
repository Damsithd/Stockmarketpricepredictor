"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import SearchBar from "@/components/SearchBar";
import StockChart from "@/components/StockChart";
import AnalysisReport from "@/components/AnalysisReport";
import IndicatorPanel from "@/components/IndicatorPanel";
import { fetchPrediction, fetchBriefing, PredictionResponse } from "@/lib/api";
import { useSession } from "@/lib/auth-client";

interface Holding {
  ticker: string;
  shares: number;
  avgPrice: number;
}

interface UserData {
  favorites: string[];
  holdings: Holding[];
}

/* ── helpers ── */
// Simple RSI (14) from the last 15 closes
function computeRSI(prices: number[]): number | null {
  if (prices.length < 15) return null;
  const slice = prices.slice(-15);
  let gains = 0, losses = 0;
  for (let i = 1; i < slice.length; i++) {
    const diff = slice[i] - slice[i - 1];
    if (diff > 0) gains += diff;
    else losses += Math.abs(diff);
  }
  const rs = gains / (losses || 1);
  return Math.round((100 - 100 / (1 + rs)) * 10) / 10;
}

// Simple MACD signal (12-EMA minus 26-EMA approximation via last values)
function computeMACD(prices: number[]): number | null {
  if (prices.length < 26) return null;
  const ema = (arr: number[], n: number) => {
    const k = 2 / (n + 1);
    let val = arr.slice(0, n).reduce((a, b) => a + b, 0) / n;
    for (let i = n; i < arr.length; i++) val = arr[i] * k + val * (1 - k);
    return val;
  };
  const ema12 = ema(prices, 12);
  const ema26 = ema(prices, 26);
  return Math.round((ema12 - ema26) * 100) / 100;
}

function MetricCard({
  label,
  value,
  changeText,
  positive,
}: {
  label: string;
  value: string;
  changeText: string;
  positive?: boolean;
}) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col gap-1">
      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{label}</span>
      <span className="text-[20px] font-medium text-slate-900 dark:text-white leading-tight">{value}</span>
      <span
        className={`text-[11px] font-medium ${
          positive === true
            ? "text-[#0F6E56] dark:text-green-400"
            : positive === false
            ? "text-[#993C1D] dark:text-red-400"
            : "text-[#854F0B] dark:text-amber-400"
        }`}
      >
        {changeText}
      </span>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  const [ticker, setTicker] = useState("AAPL");
  const [horizon, setHorizon] = useState(7);
  const [historicalDays, setHistoricalDays] = useState(365);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PredictionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // User Data State
  const [userData, setUserData] = useState<UserData>({ favorites: [], holdings: [] });
  const [briefing, setBriefing] = useState<string | null>(null);

  // Comparative Charting
  const [compareMode, setCompareMode] = useState(false);
  const [compareData, setCompareData] = useState<PredictionResponse[]>([]);

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/sign-in");
    }
  }, [session, isPending, router]);

  // Fetch User Data
  useEffect(() => {
    if (session) {
      fetch("/api/user-data")
        .then((res) => res.json())
        .then((d: UserData) => setUserData(d))
        .catch(console.error);
    }
  }, [session]);

  // Fetch Briefing based on favorites
  useEffect(() => {
    if (userData.favorites.length > 0) {
      fetchBriefing(userData.favorites).then(setBriefing).catch(console.error);
    }
  }, [userData.favorites]);

  const saveUserData = async (newData: UserData) => {
    setUserData(newData);
    await fetch("/api/user-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newData),
    });
  };

  const toggleFavorite = (symbol: string) => {
    const isFav = userData.favorites.includes(symbol);
    const newFavs = isFav
      ? userData.favorites.filter((t) => t !== symbol)
      : [...userData.favorites, symbol];
    saveUserData({ ...userData, favorites: newFavs });
  };

  const handleAnalyze = async (symbol: string, h: number = horizon, hDays: number = historicalDays) => {
    setLoading(true);
    setError(null);
    setData(null);
    setTicker(symbol);
    setHorizon(h);
    setHistoricalDays(hDays);
    setCompareMode(false);
    try {
      const result = await fetchPrediction(symbol, h, hDays);
      setData(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Prediction failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleCompare = async (symbols: string[]) => {
    setLoading(true);
    setError(null);
    try {
      const results = await Promise.all(symbols.map((s) => fetchPrediction(s, horizon)));
      setCompareData(results);
    } catch {
      setError("Comparison failed. Could not fetch all tickers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      handleAnalyze("AAPL", 7, 365);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  /* ── Derived metrics ── */
  const metrics = useMemo(() => {
    if (!data) return null;

    const prices = data.historical.map((d) => d.price);
    const currentPrice = prices[prices.length - 1] ?? 0;
    const prevPrice = prices[prices.length - 2] ?? currentPrice;
    const pctChange = prevPrice ? ((currentPrice - prevPrice) / prevPrice) * 100 : 0;

    const rsi = computeRSI(prices);
    const rsiLabel =
      rsi === null ? "—" : rsi > 70 ? "Overbought" : rsi < 30 ? "Oversold" : "Neutral zone";
    const rsiPositive = rsi === null ? undefined : rsi > 50 ? true : rsi < 40 ? false : undefined;

    const macd = computeMACD(prices);
    const macdLabel = macd === null ? "—" : macd > 0 ? "Bullish cross" : "Bearish cross";
    const macdPositive = macd === null ? undefined : macd > 0;

    const forecastPrice =
      data.forecast.length > 0 ? data.forecast[data.forecast.length - 1].price : null;
    const forecastPct =
      forecastPrice !== null && currentPrice
        ? ((forecastPrice - currentPrice) / currentPrice) * 100
        : null;

    return {
      currentPrice: `$${currentPrice.toFixed(2)}`,
      priceChange: `${pctChange >= 0 ? "+" : ""}${pctChange.toFixed(2)}% today`,
      pricePositive: pctChange >= 0,

      rsi: rsi !== null ? `${rsi}` : "—",
      rsiLabel,
      rsiPositive,

      macd: macd !== null ? (macd >= 0 ? `+${macd}` : `${macd}`) : "—",
      macdLabel,
      macdPositive,

      forecast: forecastPrice !== null ? `$${forecastPrice.toFixed(1)}` : "—",
      forecastLabel:
        forecastPct !== null
          ? `${forecastPct >= 0 ? "+" : ""}${forecastPct.toFixed(1)}% est.`
          : "—",
      forecastPositive: forecastPct !== null ? forecastPct >= 0 : undefined,
    };
  }, [data]);

  const isCurrentFavorite = userData.favorites.includes(ticker);

  /* ── Loading skeleton ── */
  if (isPending || !session) {
    return (
      <div className="flex flex-col items-center justify-center py-24 min-h-[50vh]">
        <div className="w-8 h-8 border-[3px] border-[#185FA5]/30 border-t-[#185FA5] rounded-full animate-spin mb-3" />
        <p className="text-slate-400 text-sm">Authenticating…</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in">
      {/* ── Daily briefing banner (only when favourites exist) ── */}
      {briefing && (
        <div className="bg-[#E6F1FB] dark:bg-blue-950/50 border border-[#185FA5]/20 dark:border-blue-800/40 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-[#185FA5] animate-pulse" />
            <span className="text-xs font-semibold text-[#185FA5] dark:text-blue-400">Daily AI Briefing</span>
          </div>
          <p className="text-slate-600 dark:text-slate-300 text-[12px] leading-relaxed">{briefing}</p>
        </div>
      )}

      {/* ── Search bar row ── */}
      <SearchBar
        onAnalyze={handleAnalyze}
        currentTicker={data?.ticker}
        defaultTicker="AAPL"
      />

      {/* ── Loading / error states ── */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-[3px] border-[#185FA5]/30 border-t-[#185FA5] rounded-full animate-spin" />
            <p className="text-slate-400 text-sm">Running predictive models…</p>
          </div>
        </div>
      )}

      {error && !loading && (
        <div className="flex items-center gap-3 bg-[#FAECE7] dark:bg-red-950/50 border border-[#993C1D]/20 dark:border-red-800/40 text-[#993C1D] dark:text-red-400 rounded-xl p-3">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {/* ── Main content (only when data is ready) ── */}
      {data && !loading && !compareMode && (
        <>
          {/* Metric cards row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {metrics && (
              <>
                <MetricCard
                  label="Current price"
                  value={metrics.currentPrice}
                  changeText={metrics.priceChange}
                  positive={metrics.pricePositive}
                />
                <MetricCard
                  label="RSI (14)"
                  value={metrics.rsi}
                  changeText={metrics.rsiLabel}
                  positive={metrics.rsiPositive}
                />
                <MetricCard
                  label="MACD signal"
                  value={metrics.macd}
                  changeText={metrics.macdLabel}
                  positive={metrics.macdPositive}
                />
                <MetricCard
                  label={`${horizon}d forecast`}
                  value={metrics.forecast}
                  changeText={metrics.forecastLabel}
                  positive={metrics.forecastPositive}
                />
              </>
            )}
          </div>

          {/* Two-column main grid */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

            {/* ── Left: Price chart card (3/5 width) ── */}
            <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h2 className="text-[13px] font-medium text-slate-900 dark:text-white">
                    Price history + forecast
                  </h2>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                    {data.historical.length} trading days
                    {" "}({historicalDays >= 365
                      ? `${Math.round(historicalDays / 365)}Y`
                      : `${historicalDays}d`}) · {horizon}-day simulated projection
                  </p>
                </div>
                {/* Favourite toggle */}
                <button
                  onClick={() => toggleFavorite(data.ticker)}
                  className={`text-[11px] px-2 py-1 rounded border transition-colors ${
                    isCurrentFavorite
                      ? "bg-[#E6F1FB] dark:bg-blue-900/40 border-[#185FA5]/30 text-[#185FA5] dark:text-blue-400"
                      : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                  }`}
                >
                  {isCurrentFavorite ? "★ Saved" : "☆ Save"}
                </button>
              </div>

              {/* Chart */}
              <div className="flex-1 w-full min-h-[280px]">
                <StockChart datasets={[data]} />
              </div>

              {/* Legend row */}
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-1.5">
                  <span className="inline-block w-5 h-0.5 bg-[#378ADD]" />
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Historical</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-block w-5 border-t-2 border-dashed border-[#1D9E75]" />
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Forecast</span>
                </div>
                {metrics && (
                  <div className="ml-auto flex items-center gap-2">
                    <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded">
                      MA20: {(() => {
                        const closes = data.historical.slice(-20).map(d => d.price);
                        const avg = closes.reduce((a,b) => a+b, 0) / closes.length;
                        return avg.toFixed(1);
                      })()}
                    </span>
                    <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded">
                      MA50: {(() => {
                        const closes = data.historical.slice(-50).map(d => d.price);
                        const avg = closes.reduce((a,b) => a+b, 0) / closes.length;
                        return avg.toFixed(1);
                      })()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* ── Right: Agent analysis card (2/5 width) ── */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col">
              <h2 className="text-[13px] font-medium text-slate-900 dark:text-white mb-4">Agent analysis</h2>
              <div className="flex-1 overflow-y-auto">
                <AnalysisReport report={data.analysis_report} />
              </div>
            </div>
          </div>

          {/* ── Technical Indicators Panel ── */}
          <IndicatorPanel historical={data.historical} />

          {/* ── Compare mode trigger (only when 2+ favorites) ── */}
          {userData.favorites.length > 1 && (
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setCompareMode(true);
                  handleCompare(userData.favorites.slice(0, 5));
                }}
                className="text-[12px] font-medium text-[#185FA5] bg-[#E6F1FB] hover:bg-[#D4E9F7] px-4 py-2 rounded-lg transition-colors"
              >
                Compare favorites →
              </button>
            </div>
          )}
        </>
      )}

      {/* ── Compare mode ── */}
      {compareMode && !loading && compareData.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-[13px] font-medium text-slate-900 dark:text-white">
              Comparative Analysis — Normalized %
            </h2>
            <button
              onClick={() => setCompareMode(false)}
              className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg transition-colors"
            >
              Exit compare
            </button>
          </div>
          <div className="w-full h-[400px]">
            <StockChart datasets={compareData} normalized={true} />
          </div>
        </div>
      )}
    </div>
  );
}
