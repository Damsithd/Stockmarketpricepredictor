"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import { fetchPrediction, PredictionResponse } from "@/lib/api";

interface UserData {
  favorites: string[];
  holdings: Holding[];
}

interface Holding {
  ticker: string;
  shares: number;
  avgPrice: number;
}

interface TickerSummary {
  ticker: string;
  currentPrice: number | null;
  change: number | null;
  loading: boolean;
  error: boolean;
}

function ChangeChip({ change }: { change: number | null }) {
  if (change === null) return <span className="text-[11px] text-slate-400">—</span>;
  const positive = change >= 0;
  return (
    <span
      className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded ${
        positive
          ? "bg-[#E1F5EE] text-[#0F6E56]"
          : "bg-[#FAECE7] text-[#993C1D]"
      }`}
    >
      {positive ? "▲" : "▼"} {Math.abs(change).toFixed(2)}%
    </span>
  );
}

export default function WatchlistPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  const [favorites, setFavorites] = useState<string[]>([]);
  const [summaries, setSummaries] = useState<Record<string, TickerSummary>>({});
  const [newTicker, setNewTicker] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!isPending && !session) router.push("/sign-in");
  }, [session, isPending, router]);

  // Load favorites from API
  useEffect(() => {
    if (!session) return;
    fetch("/api/user-data")
      .then((r) => r.json())
      .then((d: UserData) => {
        setFavorites(d.favorites ?? []);
        setLoadingData(false);
      })
      .catch(() => setLoadingData(false));
  }, [session]);

  // Fetch price summaries whenever favorites change
  useEffect(() => {
    favorites.forEach((ticker) => {
      if (summaries[ticker]) return; // already loaded
      setSummaries((prev) => ({
        ...prev,
        [ticker]: { ticker, currentPrice: null, change: null, loading: true, error: false },
      }));
      fetchPrediction(ticker, 7)
        .then((data: PredictionResponse) => {
          const prices = data.historical.map((d) => d.price);
          const current = prices[prices.length - 1] ?? null;
          const prev = prices[prices.length - 2] ?? current;
          const change = current && prev ? ((current - prev) / prev) * 100 : null;
          setSummaries((s) => ({
            ...s,
            [ticker]: { ticker, currentPrice: current, change, loading: false, error: false },
          }));
        })
        .catch(() => {
          setSummaries((s) => ({
            ...s,
            [ticker]: { ticker, currentPrice: null, change: null, loading: false, error: true },
          }));
        });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [favorites]);

  const saveToApi = async (newFavs: string[]) => {
    await fetch("/api/user-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ favorites: newFavs }),
    });
  };

  const handleAdd = async () => {
    const t = newTicker.trim().toUpperCase();
    if (!t) return;
    if (favorites.includes(t)) {
      setAddError("Already in watchlist.");
      return;
    }
    setAdding(true);
    setAddError(null);
    const updated = [...favorites, t];
    setFavorites(updated);
    await saveToApi(updated);
    setNewTicker("");
    setAdding(false);
  };

  const handleRemove = async (ticker: string) => {
    const updated = favorites.filter((f) => f !== ticker);
    setFavorites(updated);
    setSummaries((s) => {
      const copy = { ...s };
      delete copy[ticker];
      return copy;
    });
    await saveToApi(updated);
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
        <h1 className="text-[22px] font-semibold text-slate-900 dark:text-white">Watchlist</h1>
        <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">
          Track your favourite tickers and get quick price snapshots.
        </p>
      </div>

      {/* Add ticker bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
        <p className="text-[12px] font-medium text-slate-700 dark:text-slate-300 mb-2">Add ticker</p>
        <div className="flex gap-2">
          <input
            id="watchlist-ticker-input"
            type="text"
            value={newTicker}
            onChange={(e) => {
              setNewTicker(e.target.value.toUpperCase());
              setAddError(null);
            }}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="e.g. AAPL, TSLA, NVDA"
            className="flex-1 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#185FA5]/30 focus:border-[#185FA5] transition-all"
          />
          <button
            id="watchlist-add-btn"
            onClick={handleAdd}
            disabled={adding || !newTicker.trim()}
            className="px-4 py-2 bg-[#185FA5] hover:bg-[#145090] disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
          >
            {adding ? "Adding…" : "+ Add"}
          </button>
        </div>
        {addError && (
          <p className="text-[11px] text-[#993C1D] mt-1.5">{addError}</p>
        )}
      </div>

      {/* Ticker cards */}
      {loadingData ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-7 h-7 border-[3px] border-[#185FA5]/30 border-t-[#185FA5] rounded-full animate-spin" />
        </div>
      ) : favorites.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-10 text-center">
          <div className="w-12 h-12 bg-[#E6F1FB] dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-[#185FA5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
          <p className="text-[14px] font-medium text-slate-700 dark:text-slate-200">No tickers saved yet</p>
          <p className="text-[12px] text-slate-400 dark:text-slate-500 mt-1">Add a ticker above to start tracking.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {favorites.map((ticker) => {
            const s = summaries[ticker];
            return (
              <div
                key={ticker}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col gap-3 hover:shadow-sm transition-shadow"
              >
                {/* Top row */}
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[15px] font-semibold text-slate-900">{ticker}</span>
                    {s?.loading && (
                      <div className="w-4 h-4 border-2 border-[#185FA5]/30 border-t-[#185FA5] rounded-full animate-spin mt-1" />
                    )}
                    {s && !s.loading && s.currentPrice !== null && (
                      <p className="text-[20px] font-medium text-slate-900 dark:text-white leading-tight mt-1">
                        ${s.currentPrice.toFixed(2)}
                      </p>
                    )}
                    {s?.error && (
                      <p className="text-[11px] text-[#993C1D] mt-1">Failed to load</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemove(ticker)}
                    className="p-1.5 text-slate-300 hover:text-[#993C1D] hover:bg-[#FAECE7] rounded-lg transition-colors"
                    title="Remove from watchlist"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Change + actions */}
                <div className="flex items-center justify-between">
                  <ChangeChip change={s?.change ?? null} />
                  <Link
                    href={`/dashboard?ticker=${ticker}`}
                    className="text-[11px] font-medium text-[#185FA5] hover:text-[#145090] bg-[#E6F1FB] px-2.5 py-1 rounded-lg transition-colors"
                  >
                    Analyse →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
