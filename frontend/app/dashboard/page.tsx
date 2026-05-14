"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SearchBar from "@/components/SearchBar";
import StockChart from "@/components/StockChart";
import AnalysisReport from "@/components/AnalysisReport";
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

export default function Home() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  
  const [ticker, setTicker] = useState("AAPL");
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
        .then(res => res.json())
        .then((data: UserData) => setUserData(data))
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
      body: JSON.stringify(newData)
    });
  };

  const toggleFavorite = (symbol: string) => {
    const isFav = userData.favorites.includes(symbol);
    const newFavs = isFav 
      ? userData.favorites.filter(t => t !== symbol)
      : [...userData.favorites, symbol];
    saveUserData({ ...userData, favorites: newFavs });
  };

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

  const handleCompare = async (symbols: string[]) => {
    setLoading(true);
    setError(null);
    try {
      const results = await Promise.all(symbols.map(s => fetchPrediction(s, 7)));
      setCompareData(results);
    } catch (err: unknown) {
      setError("Comparison failed. Could not fetch all tickers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      handleAnalyze("AAPL");
    }
  }, [session]);

  if (isPending || !session) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4" />
        <p className="text-gray-400 font-medium animate-pulse">Authenticating...</p>
      </div>
    );
  }

  const isCurrentFavorite = userData.favorites.includes(ticker);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Briefing Banner */}
      {briefing && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-5 shadow-lg backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <h2 className="text-sm font-semibold text-blue-400">Daily AI Briefing for your Watchlist</h2>
          </div>
          <p className="text-gray-300 text-sm leading-relaxed">{briefing}</p>
        </div>
      )}

      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Market Intelligence</h1>
          <p className="text-gray-400">LSTM deep-learning forecasts & multi-agent sentiment analysis.</p>
        </div>
        <SearchBar onAnalyze={handleAnalyze} defaultTicker="AAPL" />
      </div>

      {/* Dashboard Top Row: Watchlist & Portfolio */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-5 shadow-lg">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <span className="text-yellow-400">⭐</span> Watchlist
          </h3>
          {userData.favorites.length === 0 ? (
            <p className="text-sm text-gray-500">No favorite indices yet. Search and add some!</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {userData.favorites.map(fav => (
                <button
                  key={fav}
                  onClick={() => handleAnalyze(fav)}
                  className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 text-sm font-medium transition-colors"
                >
                  {fav}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-5 shadow-lg">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <span className="text-green-400">💼</span> Portfolio Holdings
          </h3>
          {userData.holdings.length === 0 ? (
            <p className="text-sm text-gray-500">Portfolio tracking coming soon. Add your holdings to track performance.</p>
          ) : (
            <div className="space-y-2">
              {userData.holdings.map(h => (
                <div key={h.ticker} className="flex justify-between items-center text-sm p-2 bg-gray-800/50 rounded-lg">
                  <span className="font-medium">{h.ticker}</span>
                  <span className="text-gray-400">{h.shares} shares @ ${h.avgPrice}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Loading / Error States */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4" />
          <p className="text-gray-400 font-medium animate-pulse">Running predictive models...</p>
        </div>
      )}

      {error && !loading && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4">
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {/* Chart and Analysis Area */}
      {data && !loading && !compareMode && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold">{data.ticker} Forecast</h2>
                  <button 
                    onClick={() => toggleFavorite(data.ticker)}
                    className={`text-sm px-2 py-1 rounded border transition-colors ${
                      isCurrentFavorite ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-500' : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'
                    }`}
                  >
                    {isCurrentFavorite ? '★ Favorited' : '☆ Add to Favs'}
                  </button>
                </div>
                {userData.favorites.length > 1 && (
                  <button 
                    onClick={() => {
                      setCompareMode(true);
                      handleCompare(userData.favorites.slice(0, 5)); // Compare up to 5
                    }}
                    className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Compare Favorites
                  </button>
                )}
              </div>
              <div className="w-full h-[400px]">
                <StockChart datasets={[data]} />
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-6">
            <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-5 shadow-lg h-full">
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

      {compareMode && !loading && compareData.length > 0 && (
        <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-5 shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <span className="text-blue-400">📊</span> Comparative Analysis (Normalized %)
            </h2>
            <button 
              onClick={() => setCompareMode(false)}
              className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg transition-colors"
            >
              Exit Compare Mode
            </button>
          </div>
          <div className="w-full h-[500px]">
            <StockChart datasets={compareData} normalized={true} />
          </div>
        </div>
      )}
    </div>
  );
}
