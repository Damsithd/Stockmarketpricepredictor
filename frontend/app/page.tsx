"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SearchBar from "@/components/SearchBar";
import StockChart from "@/components/StockChart";
import AnalysisReport from "@/components/AnalysisReport";
import { fetchPrediction, PredictionResponse } from "@/lib/api";
import { useSession } from "@/lib/auth-client";

export default function Home() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [ticker, setTicker] = useState("AAPL");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PredictionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/sign-in");
    }
  }, [session, isPending, router]);

  const handleAnalyze = async (symbol: string) => {
    setLoading(true);
    setError(null);
    setData(null);
    setTicker(symbol);
    try {
      const result = await fetchPrediction(symbol, 7);
      setData(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Prediction failed.");
    } finally {
      setLoading(false);
    }
  };

  // Load default ticker on mount, only if logged in
  useEffect(() => {
    if (session) {
      handleAnalyze("AAPL");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  if (isPending || !session) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4" />
        <p className="text-gray-400 font-medium animate-pulse">
          Authenticating...
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Header & Search */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
            Market Intelligence
          </h1>
          <p className="text-gray-400">
            LSTM deep-learning forecasts &amp; multi-agent sentiment analysis.
          </p>
        </div>
        <SearchBar onAnalyze={handleAnalyze} defaultTicker="AAPL" />
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4" />
          <p className="text-gray-400 font-medium animate-pulse">
            Running predictive models &amp; agent analysis...
          </p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4 mb-6">
          <svg
            className="w-5 h-5 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {/* Dashboard Grid */}
      {data && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
          {/* Chart Column */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-5 shadow-lg backdrop-blur-sm relative overflow-hidden">
              {/* Decorative glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold">
                    {data.ticker} Forecast
                  </h2>
                  <span className="px-2.5 py-0.5 rounded text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    7-Day Horizon
                  </span>
                </div>
              </div>

              <div className="w-full h-[400px]">
                <StockChart
                  historical={data.historical}
                  forecast={data.forecast}
                />
              </div>
            </div>
          </div>

          {/* Analysis Column */}
          <div className="flex flex-col gap-6">
            <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-5 shadow-lg backdrop-blur-sm h-full flex flex-col">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <h2 className="text-lg font-semibold">AI Agent Analysis</h2>
              </div>
              <div className="flex-grow overflow-y-auto">
                <AnalysisReport report={data.analysis_report} />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
