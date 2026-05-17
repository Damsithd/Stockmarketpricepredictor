"use client";

import { useState, useRef, useEffect } from "react";

interface SearchBarProps {
  onAnalyze: (ticker: string, horizon: number, historicalDays: number) => void;
  currentTicker?: string;
  defaultTicker?: string;
}

const TIME_OPTIONS: { label: string; days: number }[] = [
  { label: "7d",  days: 7    },
  { label: "3M",  days: 90   },
  { label: "6M",  days: 180  },
  { label: "1Y",  days: 365  },
  { label: "2Y",  days: 730  },
  { label: "5Y",  days: 1825 },
];

export default function SearchBar({
  onAnalyze,
  currentTicker,
  defaultTicker = "AAPL",
}: SearchBarProps) {
  const [inputValue, setInputValue] = useState(defaultTicker);
  const [isFocused, setIsFocused] = useState(false);
  const [historicalDays, setHistoricalDays] = useState(365);
  const horizon = 7; // fixed forecast horizon
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentTicker && !isFocused) {
      setInputValue(currentTicker);
    }
  }, [currentTicker, isFocused]);

  const runAnalysis = (ticker: string, hDays: number) => {
    const t = ticker.trim().toUpperCase();
    if (t) onAnalyze(t, horizon, hDays);
  };

  const handleSearch = () => {
    runAnalysis(inputValue, historicalDays);
  };

  const handlePillClick = (days: number) => {
    setHistoricalDays(days);
    const t = (currentTicker ?? inputValue).trim().toUpperCase();
    runAnalysis(t, days);
  };

  const displayLabel = currentTicker ?? inputValue;

  return (
    <div className="space-y-2 w-full">
      {/* ── Row 1: input + "Run analysis" button ── */}
      <div className="flex items-center gap-3 w-full">
        <div className="relative flex-1">
          {/* Chart icon */}
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10">
            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24"
              stroke="currentColor" strokeWidth={2}>
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>

          {/* Active-ticker label overlay (shown when not focused) */}
          {!isFocused && currentTicker && (
            <div className="absolute inset-y-0 left-10 right-3 flex items-center pointer-events-none gap-1.5 z-10">
              <span className="text-slate-400 dark:text-slate-500 text-sm">Analysing</span>
              <span className="text-slate-900 dark:text-white font-semibold text-sm">{displayLabel}</span>
            </div>
          )}

          <input
            id="ticker-input"
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value.toUpperCase())}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
            placeholder="Search ticker (e.g. AAPL, NVDA)..."
            className={`block w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-600
              rounded-xl bg-white dark:bg-slate-800 text-sm
              focus:outline-none focus:ring-2 focus:ring-[#185FA5]/30 focus:border-[#185FA5]
              transition-all shadow-sm placeholder-slate-400 dark:placeholder-slate-500
              ${!isFocused && currentTicker
                ? "text-transparent dark:text-transparent"
                : "text-slate-900 dark:text-white"
              }`}
          />
        </div>

        <button
          id="search-btn"
          onClick={handleSearch}
          className="px-5 py-2.5 bg-[#185FA5] hover:bg-[#145090] text-white text-sm font-medium rounded-xl transition-colors shadow-sm whitespace-nowrap"
        >
          Run analysis
        </button>
      </div>

      {/* ── Row 2: time-range pills ── */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[11px] text-slate-400 dark:text-slate-500">Range:</span>
        {TIME_OPTIONS.map(({ label, days }) => {
          const isActive = historicalDays === days;
          return (
            <button
              key={label}
              id={`range-pill-${label.toLowerCase()}`}
              onClick={() => handlePillClick(days)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                isActive
                  ? "bg-[#185FA5] text-white"
                  : label === "7d"
                  ? "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 border border-dashed border-slate-300 dark:border-slate-600"
                  : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600"
              }`}
              title={`Show ${label} of history`}
            >
              {label}
            </button>
          );
        })}
        <span className="text-[10px] text-slate-300 dark:text-slate-600 ml-1">
          {historicalDays >= 365
            ? `${Math.round(historicalDays / 365)}yr history`
            : `${historicalDays}d history`}
        </span>
      </div>
    </div>
  );
}
