"use client";

import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LandingPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && session) {
      router.push("/dashboard");
    }
  }, [session, isPending, router]);

  if (isPending) return null;

  return (
    <div className="flex flex-col items-center animate-in pb-16">

      {/* ── Hero ── */}
      <section className="w-full py-20 lg:py-28 flex flex-col items-center text-center">
        {/* Logo badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E6F1FB] dark:bg-[#185FA5]/20 border border-[#185FA5]/20 dark:border-[#185FA5]/30 mb-8">
          <svg className="w-4 h-4 text-[#185FA5]" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          <span className="text-xs font-semibold text-[#185FA5] tracking-wide">Stock Predictor</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-5 max-w-3xl leading-tight">
          Predict & Analyse<br />
          <span className="text-[#185FA5]">Stock Prices</span> with Confidence
        </h1>

        <p className="text-base md:text-lg text-slate-500 dark:text-slate-400 max-w-xl mb-10 leading-relaxed">
          Explore price forecasts driven by technical indicators, analyse charts with
          SMA, RSI &amp; Bollinger Bands, track your portfolio, and compare stocks —
          all in one clean dashboard.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Link
            href="/sign-up"
            id="hero-signup-btn"
            className="px-7 py-3 rounded-xl bg-[#185FA5] hover:bg-[#145090] text-white font-semibold text-sm transition-colors shadow-md flex items-center justify-center gap-2"
          >
            Get Started — It&apos;s Free
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
          <Link
            href="/sign-in"
            id="hero-signin-btn"
            className="px-7 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center"
          >
            Sign In
          </Link>
        </div>
      </section>

      {/* ── Feature cards ── */}
      <section className="w-full border-t border-slate-200 dark:border-slate-700 pt-14">
        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center mb-10">
          What&apos;s inside
        </p>

        <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {/* Card 1 */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 hover:shadow-md hover:border-[#185FA5]/30 transition-all">
            <div className="w-10 h-10 rounded-xl bg-[#E6F1FB] dark:bg-[#185FA5]/20 flex items-center justify-center mb-5">
              <svg className="w-5 h-5 text-[#185FA5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-[15px] font-semibold text-slate-900 dark:text-white mb-2">Technical-Driven Forecast</h3>
            <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Price forecasts are computed from real technical signals — MA crossovers,
              RSI levels, and MACD — applied to years of historical OHLCV data.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 hover:shadow-md hover:border-[#185FA5]/30 transition-all">
            <div className="w-10 h-10 rounded-xl bg-[#E1F5EE] dark:bg-green-900/30 flex items-center justify-center mb-5">
              <svg className="w-5 h-5 text-[#0F6E56]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
            </div>
            <h3 className="text-[15px] font-semibold text-slate-900 dark:text-white mb-2">Technical Indicators</h3>
            <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Interactive candlestick charts with SMA, Bollinger Bands, RSI, MACD,
              and volume overlays for thorough technical analysis.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 hover:shadow-md hover:border-[#185FA5]/30 transition-all">
            <div className="w-10 h-10 rounded-xl bg-[#FEF3C7] dark:bg-yellow-900/30 flex items-center justify-center mb-5">
              <svg className="w-5 h-5 text-[#92400E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-[15px] font-semibold text-slate-900 dark:text-white mb-2">Portfolio & Watchlist</h3>
            <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Save your favourite tickers to a watchlist and track holdings with
              real-time P&amp;L calculations across all your positions.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
