"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import StockChart from "@/components/StockChart";
import { fetchPrediction, PredictionResponse } from "@/lib/api";

const PRESET_GROUPS = [
  { label: "FAANG+", tickers: ["META", "AAPL", "AMZN", "NFLX", "GOOGL"] },
  { label: "AI plays", tickers: ["NVDA", "MSFT", "PLTR", "AI", "AMD"] },
  { label: "EV / Auto", tickers: ["TSLA", "GM", "F", "RIVN", "NIO"] },
];

const CHIP_COLORS = [
  "bg-[#E6F1FB] text-[#185FA5] border border-[#185FA5]/30",
  "bg-[#E1F5EE] text-[#0F6E56] border border-[#0F6E56]/30",
  "bg-[#FAEEDA] text-[#854F0B] border border-[#854F0B]/30",
  "bg-[#FAECE7] text-[#993C1D] border border-[#993C1D]/30",
  "bg-purple-50 text-purple-700 border border-purple-200",
];

export default function ComparePage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  const [tickers, setTickers] = useState<string[]>(["AAPL", "MSFT"]);
  const [inputVal, setInputVal] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [datasets, setDatasets] = useState<PredictionResponse[]>([]);
  const [compared, setCompared] = useState(false);

  useEffect(() => {
    if (!isPending && !session) router.push("/sign-in");
  }, [session, isPending, router]);

  const addTicker = () => {
    const t = inputVal.trim().toUpperCase();
    if (!t || tickers.includes(t)) return;
    if (tickers.length >= 5) return;
    setTickers((prev) => [...prev, t]);
    setInputVal("");
  };

  const removeTicker = (t: string) => {
    setTickers((prev) => prev.filter((x) => x !== t));
    setDatasets((prev) => prev.filter((d) => d.ticker !== t));
  };

  const runCompare = async () => {
    if (tickers.length < 2) {
      setError("Add at least 2 tickers to compare.");
      return;
    }
    setLoading(true);
    setError(null);
    setDatasets([]);
    setCompared(false);
    try {
      const results = await Promise.all(tickers.map((t) => fetchPrediction(t, 7)));
      setDatasets(results);
      setCompared(true);
    } catch {
      setError("Failed to fetch one or more tickers. Please check them and try again.");
    } finally {
      setLoading(false);
    }
  };

  const loadPreset = (preset: { label: string; tickers: string[] }) => {
    setTickers(preset.tickers.slice(0, 5));
    setDatasets([]);
    setCompared(false);
  };

  if (isPending || !session) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-[3px] border-[#185FA5]/30 border-t-[#185FA5] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in">
      {/* Page header */}
      <div>
        <h1 className="text-[22px] font-semibold text-slate-900 dark:text-white">Compare</h1>
        <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">
          Compare up to 5 tickers on a normalised performance chart.
        </p>
      </div>

      {/* Config card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-4">
        {/* Preset groups */}
        <div>
          <p className="text-[11px] font-medium text-slate-500 mb-2">Quick presets</p>
          <div className="flex flex-wrap gap-2">
            {PRESET_GROUPS.map((g) => (
              <button
                key={g.label}
                onClick={() => loadPreset(g)}
                className="px-3 py-1.5 text-[12px] font-medium text-slate-600 bg-slate-100 hover:bg-[#E6F1FB] hover:text-[#185FA5] rounded-lg transition-colors"
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* Selected tickers */}
        <div>
          <p className="text-[11px] font-medium text-slate-500 mb-2">
            Selected tickers <span className="text-slate-400">(max 5)</span>
          </p>
          <div className="flex flex-wrap gap-2 min-h-[32px]">
            {tickers.map((t, i) => (
              <span
                key={t}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] font-medium ${CHIP_COLORS[i % CHIP_COLORS.length]}`}
              >
                {t}
                <button
                  onClick={() => removeTicker(t)}
                  className="opacity-60 hover:opacity-100 transition-opacity"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
            {tickers.length === 0 && (
              <span className="text-[12px] text-slate-400">No tickers selected yet.</span>
            )}
          </div>
        </div>

        {/* Add ticker input */}
        <div className="flex gap-2">
          <input
            id="compare-ticker-input"
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && addTicker()}
            placeholder={tickers.length >= 5 ? "Max 5 tickers reached" : "Type ticker and press Enter…"}
            disabled={tickers.length >= 5}
            className="flex-1 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#185FA5]/30 focus:border-[#185FA5] transition-all disabled:bg-slate-50 disabled:text-slate-400"
          />
          <button
            onClick={addTicker}
            disabled={tickers.length >= 5 || !inputVal.trim()}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 text-sm font-medium rounded-lg transition-colors"
          >
            Add
          </button>
          <button
            id="run-compare-btn"
            onClick={runCompare}
            disabled={loading || tickers.length < 2}
            className="px-5 py-2 bg-[#185FA5] hover:bg-[#145090] disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
          >
            {loading ? "Running…" : "Run comparison"}
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-[#FAECE7] border border-[#993C1D]/20 text-[#993C1D] rounded-lg px-3 py-2">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-[12px]">{error}</span>
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-8 h-8 border-[3px] border-[#185FA5]/30 border-t-[#185FA5] rounded-full animate-spin mb-3" />
          <p className="text-slate-400 text-[13px]">Fetching data for {tickers.join(", ")}…</p>
        </div>
      )}

      {/* Chart */}
      {compared && datasets.length > 0 && !loading && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
          {/* Chart header */}
          <div className="flex items-start justify-between mb-3">
            <div>
              <h2 className="text-[13px] font-medium text-slate-900">
                Normalised performance — {datasets.map((d) => d.ticker).join(" vs ")}
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Returns indexed to 0% at the start of historical data · 7-day forecast included
              </p>
            </div>
          </div>

          {/* Colour legend */}
          <div className="flex flex-wrap gap-3 mb-4">
            {datasets.map((d, i) => (
              <div key={d.ticker} className="flex items-center gap-1.5">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${CHIP_COLORS[i % CHIP_COLORS.length]}`}
                >
                  {d.ticker}
                </span>
              </div>
            ))}
          </div>

          {/* Chart area */}
          <div className="w-full h-[420px]">
            <StockChart datasets={datasets} normalized={true} />
          </div>

          {/* Return table */}
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-[11px] font-medium text-slate-500 mb-2">Period return summary</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {datasets.map((d) => {
                const prices = d.historical.map((p) => p.price);
                const first = prices[0] ?? 1;
                const last = prices[prices.length - 1] ?? first;
                const ret = ((last - first) / first) * 100;
                const forecast = d.forecast[d.forecast.length - 1]?.price ?? last;
                const fRet = ((forecast - first) / first) * 100;
                return (
                  <div key={d.ticker} className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                    <p className="text-[12px] font-semibold text-slate-900 dark:text-white">{d.ticker}</p>
                    <p
                      className={`text-[13px] font-medium mt-1 ${ret >= 0 ? "text-[#0F6E56]" : "text-[#993C1D]"}`}
                    >
                      {ret >= 0 ? "+" : ""}
                      {ret.toFixed(2)}%
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      w/ forecast:{" "}
                      <span className={fRet >= 0 ? "text-[#0F6E56]" : "text-[#993C1D]"}>
                        {fRet >= 0 ? "+" : ""}{fRet.toFixed(2)}%
                      </span>
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Prompt when nothing compared yet */}
      {!compared && !loading && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-10 text-center">
          <div className="w-12 h-12 bg-[#E6F1FB] dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-[#185FA5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-[14px] font-medium text-slate-700 dark:text-slate-200">Select tickers and run a comparison</p>
          <p className="text-[12px] text-slate-400 dark:text-slate-500 mt-1">
            Choose up to 5 tickers above or pick a preset, then hit{" "}
            <span className="font-medium text-[#185FA5]">Run comparison</span>.
          </p>
        </div>
      )}
    </div>
  );
}
