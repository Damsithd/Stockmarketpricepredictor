"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { fetchPrediction, PredictionResponse } from "@/lib/api";

interface Holding {
  ticker: string;
  shares: number;
  avgPrice: number;
}

interface UserData {
  favorites: string[];
  holdings: Holding[];
}

interface HoldingWithPrice extends Holding {
  currentPrice: number | null;
  change: number | null;
  totalValue: number | null;
  gainLoss: number | null;
  gainLossPct: number | null;
  loading: boolean;
}

function StatCard({
  label,
  value,
  sub,
  positive,
}: {
  label: string;
  value: string;
  sub?: string;
  positive?: boolean;
}) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col gap-1">
      <span className="text-[11px] text-slate-500 font-medium">{label}</span>
      <span className="text-[20px] font-medium text-slate-900 dark:text-white leading-tight">{value}</span>
      {sub && (
        <span
          className={`text-[11px] font-medium ${
            positive === true
              ? "text-[#0F6E56]"
              : positive === false
              ? "text-[#993C1D]"
              : "text-[#854F0B]"
          }`}
        >
          {sub}
        </span>
      )}
    </div>
  );
}

export default function PortfolioPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [enriched, setEnriched] = useState<HoldingWithPrice[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Add holding form
  const [formTicker, setFormTicker] = useState("");
  const [formShares, setFormShares] = useState("");
  const [formAvgPrice, setFormAvgPrice] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!isPending && !session) router.push("/sign-in");
  }, [session, isPending, router]);

  // Load holdings
  useEffect(() => {
    if (!session) return;
    fetch("/api/user-data")
      .then((r) => r.json())
      .then((d: UserData) => {
        setHoldings(d.holdings ?? []);
        setLoadingData(false);
      })
      .catch(() => setLoadingData(false));
  }, [session]);

  // Enrich holdings with live prices
  useEffect(() => {
    if (holdings.length === 0) {
      setEnriched([]);
      return;
    }
    const initial: HoldingWithPrice[] = holdings.map((h) => ({
      ...h,
      currentPrice: null,
      change: null,
      totalValue: null,
      gainLoss: null,
      gainLossPct: null,
      loading: true,
    }));
    setEnriched(initial);

    holdings.forEach((h) => {
      fetchPrediction(h.ticker, 7)
        .then((data: PredictionResponse) => {
          const prices = data.historical.map((d) => d.price);
          const current = prices[prices.length - 1] ?? null;
          const prev = prices[prices.length - 2] ?? current;
          const change = current && prev ? ((current - prev) / prev) * 100 : null;
          const totalValue = current ? current * h.shares : null;
          const costBasis = h.avgPrice * h.shares;
          const gainLoss = totalValue !== null ? totalValue - costBasis : null;
          const gainLossPct = gainLoss !== null && costBasis > 0 ? (gainLoss / costBasis) * 100 : null;
          setEnriched((prev) =>
            prev.map((e) =>
              e.ticker === h.ticker
                ? { ...e, currentPrice: current, change, totalValue, gainLoss, gainLossPct, loading: false }
                : e
            )
          );
        })
        .catch(() => {
          setEnriched((prev) =>
            prev.map((e) => (e.ticker === h.ticker ? { ...e, loading: false } : e))
          );
        });
    });
  }, [holdings]);

  const saveToApi = async (newHoldings: Holding[]) => {
    await fetch("/api/user-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ holdings: newHoldings }),
    });
  };

  const handleAdd = async () => {
    const t = formTicker.trim().toUpperCase();
    const s = parseFloat(formShares);
    const p = parseFloat(formAvgPrice);
    if (!t || isNaN(s) || s <= 0 || isNaN(p) || p <= 0) {
      setFormError("Please enter a valid ticker, shares, and average price.");
      return;
    }
    setAdding(true);
    setFormError(null);
    const updated = [...holdings.filter((h) => h.ticker !== t), { ticker: t, shares: s, avgPrice: p }];
    setHoldings(updated);
    await saveToApi(updated);
    setFormTicker("");
    setFormShares("");
    setFormAvgPrice("");
    setAdding(false);
    setShowForm(false);
  };

  const handleRemove = async (ticker: string) => {
    const updated = holdings.filter((h) => h.ticker !== ticker);
    setHoldings(updated);
    await saveToApi(updated);
  };

  // Portfolio totals
  const totalValue = enriched.reduce((a, h) => a + (h.totalValue ?? 0), 0);
  const totalCost = enriched.reduce((a, h) => a + h.avgPrice * h.shares, 0);
  const totalGainLoss = totalValue - totalCost;
  const totalGainLossPct = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[22px] font-semibold text-slate-900 dark:text-white">Portfolio</h1>
          <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">
            Track your holdings and total P&amp;L.
          </p>
        </div>
        <button
          id="add-holding-btn"
          onClick={() => setShowForm((v) => !v)}
          className="px-4 py-2 bg-[#185FA5] hover:bg-[#145090] text-white text-[13px] font-medium rounded-lg transition-colors"
        >
          {showForm ? "Cancel" : "+ Add holding"}
        </button>
      </div>

      {/* Add holding form */}
      {showForm && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
          <p className="text-[12px] font-medium text-slate-700">New holding</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">Ticker</label>
              <input
                id="holding-ticker-input"
                type="text"
                value={formTicker}
                onChange={(e) => setFormTicker(e.target.value.toUpperCase())}
                placeholder="AAPL"
                className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#185FA5]/30 focus:border-[#185FA5] transition-all"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">Shares</label>
              <input
                id="holding-shares-input"
                type="number"
                value={formShares}
                onChange={(e) => setFormShares(e.target.value)}
                placeholder="10"
                min="0"
                className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#185FA5]/30 focus:border-[#185FA5] transition-all"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">Avg. cost per share ($)</label>
              <input
                id="holding-avgprice-input"
                type="number"
                value={formAvgPrice}
                onChange={(e) => setFormAvgPrice(e.target.value)}
                placeholder="150.00"
                min="0"
                step="0.01"
                className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#185FA5]/30 focus:border-[#185FA5] transition-all"
              />
            </div>
          </div>
          {formError && <p className="text-[11px] text-[#993C1D]">{formError}</p>}
          <button
            onClick={handleAdd}
            disabled={adding}
            className="px-5 py-2 bg-[#185FA5] hover:bg-[#145090] disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {adding ? "Saving…" : "Save holding"}
          </button>
        </div>
      )}

      {/* Summary stat cards */}
      {enriched.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Total value" value={`$${totalValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
          <StatCard label="Total cost" value={`$${totalCost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
          <StatCard
            label="Total gain / loss"
            value={`${totalGainLoss >= 0 ? "+" : ""}$${totalGainLoss.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            sub={`${totalGainLoss >= 0 ? "+" : ""}${totalGainLossPct.toFixed(2)}% overall`}
            positive={totalGainLoss >= 0}
          />
          <StatCard label="Positions" value={`${holdings.length}`} sub="active holdings" />
        </div>
      )}

      {/* Holdings table */}
      {loadingData ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-7 h-7 border-[3px] border-[#185FA5]/30 border-t-[#185FA5] rounded-full animate-spin" />
        </div>
      ) : holdings.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-10 text-center">
          <div className="w-12 h-12 bg-[#E6F1FB] dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-[#185FA5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-[14px] font-medium text-slate-700 dark:text-slate-200">No holdings yet</p>
          <p className="text-[12px] text-slate-400 dark:text-slate-500 mt-1">Add a holding above to start tracking your portfolio.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left text-[11px] font-medium text-slate-500 dark:text-slate-400 px-4 py-3">Ticker</th>
                <th className="text-right text-[11px] font-medium text-slate-500 dark:text-slate-400 px-4 py-3">Shares</th>
                <th className="text-right text-[11px] font-medium text-slate-500 dark:text-slate-400 px-4 py-3">Avg. cost</th>
                <th className="text-right text-[11px] font-medium text-slate-500 dark:text-slate-400 px-4 py-3">Current</th>
                <th className="text-right text-[11px] font-medium text-slate-500 dark:text-slate-400 px-4 py-3">Value</th>
                <th className="text-right text-[11px] font-medium text-slate-500 dark:text-slate-400 px-4 py-3">P&amp;L</th>
                <th className="text-right text-[11px] font-medium text-slate-500 dark:text-slate-400 px-4 py-3">Day</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {enriched.map((h) => (
                <tr key={h.ticker} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-semibold text-slate-900 text-[13px]">{h.ticker}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-[13px] text-slate-700 dark:text-slate-300">{h.shares}</td>
                  <td className="px-4 py-3 text-right text-[13px] text-slate-700 dark:text-slate-300">${h.avgPrice.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-[13px] text-slate-900 font-medium">
                    {h.loading ? (
                      <div className="w-4 h-4 border-2 border-[#185FA5]/30 border-t-[#185FA5] rounded-full animate-spin ml-auto" />
                    ) : h.currentPrice !== null ? (
                      `$${h.currentPrice.toFixed(2)}`
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-[13px] text-slate-900 font-medium">
                    {h.totalValue !== null ? `$${h.totalValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {h.gainLoss !== null ? (
                      <span
                        className={`text-[12px] font-medium ${h.gainLoss >= 0 ? "text-[#0F6E56]" : "text-[#993C1D]"}`}
                      >
                        {h.gainLoss >= 0 ? "+" : ""}${h.gainLoss.toFixed(2)}
                        <span className="text-[10px] ml-1">
                          ({h.gainLossPct !== null ? `${h.gainLossPct >= 0 ? "+" : ""}${h.gainLossPct.toFixed(1)}%` : ""})
                        </span>
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[12px]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {h.change !== null ? (
                      <span
                        className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded ${
                          h.change >= 0 ? "bg-[#E1F5EE] text-[#0F6E56]" : "bg-[#FAECE7] text-[#993C1D]"
                        }`}
                      >
                        {h.change >= 0 ? "▲" : "▼"} {Math.abs(h.change).toFixed(2)}%
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleRemove(h.ticker)}
                      className="p-1.5 text-slate-300 hover:text-[#993C1D] hover:bg-[#FAECE7] rounded-lg transition-colors"
                      title="Remove holding"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
