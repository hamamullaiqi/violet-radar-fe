"use client";

import React, { useEffect, useRef, memo } from "react";
import { ExternalLink, ShieldCheck, Target, TrendingUp, AlertTriangle } from "lucide-react";
import { formatRupiah } from "@/lib/utils";

interface TradingViewAdvancedWidgetProps {
  symbol: string;
  currentPrice?: number;
  bandarAvgPrice?: number;
  keyLevels?: {
    support1?: number;
    support2?: number;
    resistance1?: number;
    resistance2?: number;
    pivot?: number;
  };
  tradingPlan?: {
    entryArea?: { min: number; max: number };
    targetPrice1?: number;
    targetPrice2?: number;
    stopLoss?: number;
    momentumEntryPrice?: number;
  };
}

function TradingViewAdvancedWidgetComponent({
  symbol,
  currentPrice,
  bandarAvgPrice,
  keyLevels,
  tradingPlan,
}: TradingViewAdvancedWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous widget
    containerRef.current.innerHTML = "";

    const widgetDiv = document.createElement("div");
    widgetDiv.className = "tradingview-widget-container__widget";
    widgetDiv.style.height = "100%";
    widgetDiv.style.width = "100%";
    containerRef.current.appendChild(widgetDiv);

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: `IDX:${symbol?.toUpperCase()}`,
      interval: "D",
      timezone: "Asia/Jakarta",
      theme: "light",
      style: "1", // Candlestick
      locale: "id",
      enable_publishing: false,
      allow_symbol_change: true,
      calendar: false,
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: true,
      studies: [
        "MASimple@tv-basicstudies",
        "Volume@tv-basicstudies",
      ],
      support_host: "https://www.tradingview.com",
    });

    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [symbol]);

  return (
    <div className="flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Quick Reference Bar for Violet Radar Analysis */}
      <div className="bg-slate-50/80 border-b border-slate-200 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              TradingView Pro Live Feed
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200">
              IDX:{symbol?.toUpperCase()}
            </span>
          </div>

          <a
            href={`https://id.tradingview.com/symbols/IDX-${symbol?.toUpperCase()}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-semibold text-slate-500 hover:text-indigo-600 flex items-center gap-1 transition-colors"
          >
            <span>Buka di TradingView</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Reference Level Badges */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200/60 text-xs">
          <span className="text-slate-500 font-medium text-[11px]">Level Analisis Radar:</span>

          {bandarAvgPrice ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-50 border border-cyan-200 text-cyan-800 font-semibold text-[11px]">
              <ShieldCheck className="w-3 h-3 text-cyan-600" />
              Bandar: Rp {bandarAvgPrice.toLocaleString("id-ID")}
            </span>
          ) : null}

          {tradingPlan?.entryArea && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold text-[11px]">
              <Target className="w-3 h-3 text-emerald-600" />
              Entry: {tradingPlan.entryArea.min}-{tradingPlan.entryArea.max}
            </span>
          )}

          {tradingPlan?.targetPrice1 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-800 font-semibold text-[11px]">
              <TrendingUp className="w-3 h-3 text-indigo-600" />
              TP1: Rp {tradingPlan.targetPrice1.toLocaleString("id-ID")}
            </span>
          )}

          {tradingPlan?.targetPrice2 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-violet-50 border border-violet-200 text-violet-800 font-semibold text-[11px]">
              TP2: Rp {tradingPlan.targetPrice2.toLocaleString("id-ID")}
            </span>
          )}

          {tradingPlan?.stopLoss && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200 text-rose-800 font-semibold text-[11px]">
              <AlertTriangle className="w-3 h-3 text-rose-600" />
              SL: Rp {tradingPlan.stopLoss.toLocaleString("id-ID")}
            </span>
          )}

          {keyLevels?.resistance1 && (
            <span className="text-slate-600 text-[11px] font-medium">
              R1: <b className="text-rose-600">Rp {keyLevels.resistance1.toLocaleString("id-ID")}</b>
            </span>
          )}

          {keyLevels?.support1 && (
            <span className="text-slate-600 text-[11px] font-medium">
              S1: <b className="text-emerald-600">Rp {keyLevels.support1.toLocaleString("id-ID")}</b>
            </span>
          )}
        </div>
      </div>

      {/* TradingView Advanced Chart Container */}
      <div className="w-full h-[550px] relative bg-slate-100">
        <div
          id={`tradingview_${symbol}`}
          ref={containerRef}
          className="tradingview-widget-container h-full w-full"
        />
      </div>
    </div>
  );
}

export const TradingViewAdvancedWidget = memo(TradingViewAdvancedWidgetComponent);
export default TradingViewAdvancedWidget;
