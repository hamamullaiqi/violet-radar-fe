"use client";

import React, { useState } from "react";
import { Sparkles, BarChart2, ShieldCheck, Target, ExternalLink } from "lucide-react";
import VioletLightweightChart, {
  KeyLevelsProps,
  TradingPlanProps,
} from "./VioletLightweightChart";
import TradingViewAdvancedWidget from "./TradingViewAdvancedWidget";

interface TickerChartProps {
  ticker: string;
  currentPrice?: number;
  bandarAvgPrice?: number;
  keyLevels?: KeyLevelsProps;
  tradingPlan?: TradingPlanProps;
  recentSignals?: Array<{
    date?: string | Date;
    signalType?: string;
    action?: string;
    price?: number;
    title?: string;
  }>;
}

type ChartEngine = "violet" | "tradingview";

export default function TickerChart({
  ticker,
  currentPrice,
  bandarAvgPrice,
  keyLevels,
  tradingPlan,
  recentSignals,
}: TickerChartProps) {
  const [activeEngine, setActiveEngine] = useState<ChartEngine>("violet");

  return (
    <div className="space-y-4">
      {/* Chart Engine Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2 sm:p-2.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setActiveEngine("violet")}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-md transition-all ${
              activeEngine === "violet"
                ? "bg-white text-indigo-600 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>Violet Pro Chart (Indikator Analisis)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveEngine("tradingview")}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-md transition-all ${
              activeEngine === "tradingview"
                ? "bg-white text-indigo-600 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5 text-blue-500" />
            <span>TradingView Widget (Drawing & Multi-TF)</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 pr-2">
          {activeEngine === "violet" ? (
            <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Overlay Bandar Cost & Trading Plan Aktif
            </span>
          ) : (
            <span className="text-[11px] font-medium text-slate-500">
              Didukung oleh TradingView Engine
            </span>
          )}
        </div>
      </div>

      {/* Render Chart Engine */}
      {activeEngine === "violet" ? (
        <VioletLightweightChart
          ticker={ticker}
          currentPrice={currentPrice}
          bandarAvgPrice={bandarAvgPrice}
          keyLevels={keyLevels}
          tradingPlan={tradingPlan}
          recentSignals={recentSignals}
        />
      ) : (
        <TradingViewAdvancedWidget
          symbol={ticker}
          currentPrice={currentPrice}
          bandarAvgPrice={bandarAvgPrice}
          keyLevels={keyLevels}
          tradingPlan={tradingPlan}
        />
      )}
    </div>
  );
}
