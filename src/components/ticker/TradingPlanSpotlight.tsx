"use client";

import React from "react";
import { Target, Shield, ArrowUpRight, ArrowDownRight, Compass, Zap, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TradingPlanData {
  actionLabel: string;
  entryArea: {
    min: number;
    max: number;
  };
  targetPrice1: number;
  targetPrice1Percent: number;
  targetPrice2: number;
  targetPrice2Percent: number;
  stopLoss: number;
  stopLossPercent: number;
  riskRewardRatio: number;
}

interface TradingPlanSpotlightProps {
  plan: TradingPlanData;
  currentPrice?: number;
  onViewChart?: () => void;
}

export default function TradingPlanSpotlight({
  plan,
  currentPrice,
  onViewChart,
}: TradingPlanSpotlightProps) {
  const fmtPrice = (val: number) => `Rp ${val?.toLocaleString("id-ID") || 0}`;

  // Analyze price position relative to entry area
  const cur = currentPrice || 0;
  const isInsideEntry = cur >= plan.entryArea.min && cur <= plan.entryArea.max;
  const isAboveEntry = cur > plan.entryArea.max;
  const isBelowEntry = cur > 0 && cur < plan.entryArea.min;

  // Calculate visual progress percentage on range [stopLoss, targetPrice2]
  const totalRange = Math.max(1, plan.targetPrice2 - plan.stopLoss);
  const curProgress = cur > 0
    ? Math.min(100, Math.max(0, ((cur - plan.stopLoss) / totalRange) * 100))
    : 50;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-5 sm:p-7 shadow-xl border border-indigo-500/30">
      {/* Background ambient lighting */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Row */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-500/30 border border-indigo-400/40 text-indigo-300 shadow-inner">
            <Target className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-300">
                Actionable Strategy
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-200 border border-indigo-400/30">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                {plan.actionLabel}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight mt-0.5">
              Rencana Trading Terfokus (Trading Plan)
            </h2>
          </div>
        </div>

        {/* Status Proximity Pill */}
        <div className="flex items-center gap-2 flex-wrap">
          {isInsideEntry && (
            <div className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Zona Beli Ideal (Active)</span>
            </div>
          )}
          {isAboveEntry && (
            <div className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-bold flex items-center gap-1.5 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Di Atas Area Beli (Running)</span>
            </div>
          )}
          {isBelowEntry && (
            <div className="px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/40 text-blue-300 text-xs font-bold flex items-center gap-1.5 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              <span>Di Bawah Entry (Wait Confirmation)</span>
            </div>
          )}

          <div className="px-2.5 py-1 rounded-lg bg-white/10 text-white text-xs font-bold border border-white/10">
            RRR <span className="text-emerald-400">1 : {plan.riskRewardRatio}</span>
          </div>
        </div>
      </div>

      {/* 4 Pillars Grid (SL, Entry, TP1, TP2) */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 my-5">
        {/* 1. Stop Loss */}
        <div className="p-4 rounded-xl bg-slate-800/80 border border-rose-500/30 backdrop-blur-xs hover:border-rose-400/60 transition-all group">
          <div className="flex items-center justify-between text-[11px] font-bold text-rose-300 uppercase mb-1">
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-rose-400" />
              Stop Loss (SL)
            </span>
            <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px]">
              -{plan.stopLossPercent}%
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight group-hover:text-rose-200 transition-colors">
            {fmtPrice(plan.stopLoss)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Batasi resiko maksimal jika harga tembus ke bawah</p>
        </div>

        {/* 2. Entry Zone */}
        <div className={`p-4 rounded-xl backdrop-blur-xs transition-all ${
          isInsideEntry
            ? "bg-indigo-950/80 border-2 border-indigo-400 shadow-md ring-2 ring-indigo-500/20"
            : "bg-slate-800/80 border border-indigo-500/30 hover:border-indigo-400/60"
        }`}>
          <div className="flex items-center justify-between text-[11px] font-bold text-indigo-300 uppercase mb-1">
            <span className="flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-indigo-400" />
              Area Beli (Entry)
            </span>
            {isInsideEntry && (
              <span className="px-1.5 py-0.2 rounded bg-indigo-500/30 text-indigo-200 border border-indigo-400/40 text-[10px]">
                Active
              </span>
            )}
          </div>
          <div className="text-lg sm:text-xl font-black text-white font-mono tracking-tight">
            {fmtPrice(plan.entryArea.min)} – {fmtPrice(plan.entryArea.max)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Rentang harga optimal untuk akumulasi posisi</p>
        </div>

        {/* 3. Target 1 */}
        <div className="p-4 rounded-xl bg-slate-800/80 border border-emerald-500/30 backdrop-blur-xs hover:border-emerald-400/60 transition-all group">
          <div className="flex items-center justify-between text-[11px] font-bold text-emerald-300 uppercase mb-1">
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              Target 1 (TP1)
            </span>
            <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px]">
              +{plan.targetPrice1Percent}%
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight group-hover:text-emerald-200 transition-colors">
            {fmtPrice(plan.targetPrice1)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Amankan profit bertahap di resisten terdekat</p>
        </div>

        {/* 4. Target 2 */}
        <div className="p-4 rounded-xl bg-slate-800/80 border border-purple-500/30 backdrop-blur-xs hover:border-purple-400/60 transition-all group">
          <div className="flex items-center justify-between text-[11px] font-bold text-purple-300 uppercase mb-1">
            <span className="flex items-center gap-1.5">
              <ArrowUpRight className="w-3.5 h-3.5 text-purple-400" />
              Target 2 (TP2)
            </span>
            <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px]">
              +{plan.targetPrice2Percent}%
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight group-hover:text-purple-200 transition-colors">
            {fmtPrice(plan.targetPrice2)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Target ekspansi tren / trailing profit maksimal</p>
        </div>
      </div>

      {/* Visual Level Spectrum Ladder Bar */}
      <div className="relative z-10 pt-3 pb-1 border-t border-white/10">
        <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 mb-1.5">
          <span className="text-rose-400">SL: {fmtPrice(plan.stopLoss)}</span>
          <span className="text-indigo-300 hidden sm:inline">Entry: {fmtPrice(plan.entryArea.min)} – {fmtPrice(plan.entryArea.max)}</span>
          <span className="text-emerald-400">TP1: {fmtPrice(plan.targetPrice1)}</span>
          <span className="text-purple-400">TP2: {fmtPrice(plan.targetPrice2)}</span>
        </div>

        {/* Progress bar with current price pointer */}
        <div className="relative h-2.5 w-full bg-slate-800 rounded-full overflow-hidden border border-white/10">
          <div className="h-full bg-gradient-to-r from-rose-500 via-indigo-500 to-emerald-500 rounded-full" />
        </div>

        {/* Bottom CTA Row */}
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="text-slate-300 flex items-center gap-3">
            <span>
              Risk: <b className="text-rose-400">-{plan.stopLossPercent}%</b>
            </span>
            <span>•</span>
            <span>
              Reward TP1: <b className="text-emerald-400">+{plan.targetPrice1Percent}%</b>
            </span>
            <span>•</span>
            <span>
              Reward TP2: <b className="text-purple-400">+{plan.targetPrice2Percent}%</b>
            </span>
          </div>

          {onViewChart && (
            <button
              type="button"
              onClick={onViewChart}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-sm w-fit"
            >
              <span>Tampilkan Level di Grafik</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
