"use client";

import { useState } from "react";

interface SearchBarProps {
  onAnalyze: (ticker: string) => void;
  defaultTicker?: string;
}

export default function SearchBar({
  onAnalyze,
  defaultTicker = "AAPL",
}: SearchBarProps) {
  const [value, setValue] = useState(defaultTicker);

  const handleAnalyze = () => {
    const ticker = value.trim().toUpperCase();
    if (ticker) onAnalyze(ticker);
  };

  return (
    <div className="w-full md:w-80 relative">
      {/* Search Icon */}
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg
          className="h-5 w-5 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {/* Input */}
      <input
        id="ticker-input"
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleAnalyze();
        }}
        placeholder="Search ticker (e.g. AAPL, NVDA)..."
        className="block w-full pl-10 pr-20 py-2.5 border border-gray-700 rounded-xl leading-5 bg-gray-900/50 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all shadow-inner"
      />

      {/* Analyze Button */}
      <button
        id="search-btn"
        onClick={handleAnalyze}
        className="absolute inset-y-1 right-1 px-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
      >
        Analyze
      </button>
    </div>
  );
}
