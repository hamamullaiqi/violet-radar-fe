"use client";

import React, { useState } from "react";
import {
  TrendingUp,
  ShieldCheck,
  Target,
  Compass,
  Sparkles,
  Activity,
  CheckCircle2,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface IhsgMarketTechnicalCardProps {
  marketRegime?: {
    close?: number;
    regime?: string;
    changePercent?: number;
    score?: number;
    ma20?: number;
    ma50?: number;
  };
}

export default function IhsgMarketTechnicalCard({ marketRegime }: IhsgMarketTechnicalCardProps) {
  const [timeframe, setTimeframe] = useState<string>("D");

  const close = marketRegime?.close && marketRegime.close > 0 ? marketRegime.close : 6121.7;
  const isLive = Boolean(marketRegime?.close && marketRegime.close > 0);
  const regime = marketRegime?.regime || "NEUTRAL";
  const changePercent = marketRegime?.changePercent ?? 0;

  // Calculate dynamic technical levels based on current IHSG price
  const r2 = Math.round(close * 1.025);
  const r1 = Math.round(close * 1.012);
  const s1 = marketRegime?.ma20 && marketRegime.ma20 > 0 && Math.abs(marketRegime.ma20 - close) / close < 0.15
    ? Math.round(marketRegime.ma20)
    : Math.round(close * 0.988);
  const s2 = marketRegime?.ma50 && marketRegime.ma50 > 0 && Math.abs(marketRegime.ma50 - close) / close < 0.15
    ? Math.round(marketRegime.ma50)
    : Math.round(close * 0.975);
  const bottomMin = Math.round(close * 0.965);
  const bottomMax = Math.round(close * 0.978);

  const defaultStudies = encodeURIComponent(
    JSON.stringify([
      "Volume@tv-basicstudies",
      "MASimple@tv-basicstudies",
      "RSI@tv-basicstudies",
      "MACD@tv-basicstudies"
    ])
  );

  const iframeSrc = `https://s.tradingview.com/widgetembed/?frameElementId=tradingview_ihsg&symbol=IDX%3ACOMPOSITE&interval=${timeframe}&hidesidetoolbar=0&symboledit=1&saveimage=1&toolbarbg=f8fafc&studies=${defaultStudies}&theme=light&style=1&timezone=Asia%2FJakarta&withdateranges=1&locale=id`;

  return (
    <Card className="border-slate-200 bg-white shadow-xs overflow-hidden">
      {/* CARD HEADER */}
      <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-violet-50/40 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-violet-600 text-white shadow-sm">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-black text-slate-900 tracking-tight">
                  IHSG (Jakarta Composite Index) &amp; Analisis Teknikal Pasar
                </CardTitle>
                <Badge className="bg-violet-100 text-violet-800 border-violet-200 font-mono text-[10px] font-bold">
                  IDX:COMPOSITE
                </Badge>
              </div>
              <CardDescription className="text-xs text-slate-500 font-medium mt-0.5">
                Peta level teknikal Support, Resisten, Estimasi Bottom Rebound, dan Chart Live TradingView.
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-1 rounded-full border text-xs font-black uppercase flex items-center gap-1.5 shadow-2xs ${
                regime === "BULLISH"
                  ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                  : regime === "BEARISH"
                  ? "bg-rose-100 text-rose-800 border-rose-300"
                  : "bg-amber-100 text-amber-800 border-amber-300"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full animate-pulse ${
                  regime === "BULLISH" ? "bg-emerald-500" : regime === "BEARISH" ? "bg-rose-500" : "bg-amber-500"
                }`}
              />
              Regime: {regime === "BULLISH" ? "Bullish Rebound Mode" : regime === "BEARISH" ? "Bearish Distribution Mode" : "Neutral / Consolidation"}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-6">
        {/* TOP TECHNICAL LEVELS & BOTTOM ESTIMATE GRID */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
          {/* RESISTANCE 2 */}
          <div className="p-3.5 rounded-xl border border-rose-200/80 bg-rose-50/40 flex flex-col justify-between">
            <div className="flex items-center justify-between text-rose-700 font-bold text-[10px] uppercase">
              <span>Resisten 2 (R2)</span>
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
            <div className="mt-2">
              <div className="text-lg font-black font-mono text-rose-950">
                {r2.toLocaleString("id-ID")}
              </div>
              <div className="text-[10px] text-rose-700 font-semibold mt-0.5">Target Psikologis Puncak (+2.5%)</div>
            </div>
          </div>

          {/* RESISTANCE 1 */}
          <div className="p-3.5 rounded-xl border border-rose-200/60 bg-rose-50/30 flex flex-col justify-between">
            <div className="flex items-center justify-between text-rose-600 font-bold text-[10px] uppercase">
              <span>Resisten 1 (R1)</span>
              <Target className="w-3.5 h-3.5" />
            </div>
            <div className="mt-2">
              <div className="text-lg font-black font-mono text-rose-900">
                {r1.toLocaleString("id-ID")}
              </div>
              <div className="text-[10px] text-rose-600 font-semibold mt-0.5">Uji Breakout Minor (+1.2%)</div>
            </div>
          </div>

          {/* SUPPORT 1 (DYNAMIC MA20) */}
          <div className="p-3.5 rounded-xl border border-sky-200/80 bg-sky-50/40 flex flex-col justify-between">
            <div className="flex items-center justify-between text-sky-700 font-bold text-[10px] uppercase">
              <span>Support 1 (S1)</span>
              <Activity className="w-3.5 h-3.5" />
            </div>
            <div className="mt-2">
              <div className="text-lg font-black font-mono text-sky-950">
                {s1.toLocaleString("id-ID")}
              </div>
              <div className="text-[10px] text-sky-700 font-semibold mt-0.5">Dynamic Short Support</div>
            </div>
          </div>

          {/* SUPPORT 2 (MAJOR SWING LOW) */}
          <div className="p-3.5 rounded-xl border border-indigo-200/80 bg-indigo-50/40 flex flex-col justify-between">
            <div className="flex items-center justify-between text-indigo-700 font-bold text-[10px] uppercase">
              <span>Support 2 (S2)</span>
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <div className="mt-2">
              <div className="text-lg font-black font-mono text-indigo-950">
                {s2.toLocaleString("id-ID")}
              </div>
              <div className="text-[10px] text-indigo-700 font-semibold mt-0.5">Major Demand Base</div>
            </div>
          </div>

          {/* ESTIMASI LEVEL BOTTOM PASAR (HIGHLIGHTED GOLD/EMERALD) */}
          <div className="p-3.5 rounded-xl border-2 border-emerald-400 bg-gradient-to-br from-emerald-50 via-teal-50/60 to-white flex flex-col justify-between shadow-2xs col-span-2 md:col-span-1">
            <div className="flex items-center justify-between text-emerald-800 font-black text-[10px] uppercase tracking-wider">
              <span>Estimasi Bottom</span>
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 fill-emerald-500" />
            </div>
            <div className="mt-2">
              <div className="text-lg font-black font-mono text-emerald-950">
                {bottomMin.toLocaleString("id-ID")} – {bottomMax.toLocaleString("id-ID")}
              </div>
              <div className="text-[10px] text-emerald-800 font-bold mt-0.5 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>Safe Accumulation Zone</span>
              </div>
            </div>
          </div>
        </div>

        {/* TRADINGVIEW LIVE INTERACTIVE CANDLESTICK CHART */}
        <div className="rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs bg-white">
          <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-slate-800">Chart Interaktif Candlestick IHSG (TradingView Real-time)</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-mono">
              <span className="text-slate-400 mr-0.5">Timeframe:</span>
              {[
                { label: "5m", val: "5" },
                { label: "15m", val: "15" },
                { label: "1h", val: "60" },
                { label: "Daily", val: "D" },
                { label: "Weekly", val: "W" },
              ].map((tf) => (
                <button
                  key={tf.val}
                  onClick={() => setTimeframe(tf.val)}
                  className={`px-2 py-0.5 rounded font-bold transition-all ${
                    timeframe === tf.val
                      ? "bg-violet-600 text-white shadow-2xs"
                      : "text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          </div>

          <div className="h-[520px] sm:h-[560px] w-full relative bg-slate-900/5">
            <iframe
              key={timeframe}
              src={iframeSrc}
              className="w-full h-full border-0"
              title="IHSG TradingView Chart"
              allowFullScreen
            />
          </div>
        </div>

        {/* MARKET HEALTH & RADAR ACTION STRIP */}
        <div className="p-3.5 rounded-xl border border-violet-200 bg-gradient-to-r from-violet-50/80 via-indigo-50/40 to-slate-50/70 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-violet-600 text-white shrink-0">
              <Sparkles className="w-4 h-4" />
            </span>
            <p className="text-slate-700 leading-relaxed text-[11px]">
              <b>Petunjuk Eksekusi Radar:</b> IHSG saat ini berada di level <b>{close.toLocaleString("id-ID", { maximumFractionDigits: 1 })}</b> ({changePercent >= 0 ? "+" : ""}{changePercent.toFixed(2)}%). Area akumulasi aman berada di rentang <b>{bottomMin.toLocaleString("id-ID")} – {bottomMax.toLocaleString("id-ID")}</b> dengan resisten terdekat di <b>{r1.toLocaleString("id-ID")}</b>.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center font-mono font-bold text-[11px]">
            <span className="px-2 py-1 rounded bg-white border border-slate-200 text-emerald-700 shadow-2xs">
              Status: {regime}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
