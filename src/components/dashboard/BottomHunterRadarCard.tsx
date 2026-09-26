"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Target,
  Search,
  RefreshCw,
  Sparkles,
  Zap,
  ShieldAlert,
  ArrowUpRight,
  Filter,
  Layers,
  History,
  Activity,
  CheckCircle2,
  Anchor,
  Compass
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import useFetch from "@/hooks/useFetch";
import TickerDetailDialog from "./TickerDetailDialog";
import { formatRupiah } from "@/lib/utils";

export interface BottomHunterCandidate {
  ticker: string;
  stockName?: string;
  currentPrice: number;
  openPrice: number;
  highPrice: number;
  lowPrice: number;
  changePercent: number;
  turnoverRupiah: number;
  volume: number;

  bottomPrice: number;
  distanceToBottomPercent: number;
  status: "AT_BOTTOM_SUPPORT" | "NEAR_BOTTOM" | "REBOUNDING_FROM_BOTTOM";
  statusLabel: string;
  floorType: "52W_ABSOLUTE_LOW" | "60D_QUARTERLY_FLOOR" | "STRUCTURAL_BASE_SUPPORT";
  floorDescription: string;

  low52Week: number;
  high52Week: number;
  discountFrom52WHighPercent: number;
  distanceFrom52WLowPercent: number;

  isBottomCandleConfirmed: boolean;
  candleReversalPattern: string;
  rsi14: number;
  isRsiOversold: boolean;
  volumeAbsorptionRatio: number;
  smartMoneyInflowRupiah: number;

  entryPrice: number;
  safeStopLoss: number;
  safeStopLossPercent: number;
  targetPrice1: number;
  targetGain1Percent: number;
  targetPrice2: number;
  targetGain2Percent: number;
  riskRewardRatio: number;

  confidenceScore: number;
  catalystSummary: string;
  scannedAt: string;
}

export type BottomStatusFilter = "ALL" | "AT_BOTTOM" | "NEAR_BOTTOM" | "REBOUNDING";

export default function BottomHunterRadarCard() {
  const [activeFilter, setActiveFilter] = useState<BottomStatusFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [bypassCacheTrigger, setBypassCacheTrigger] = useState(0);

  const { data, loading, refetch } = useFetch(
    `/api/strategies/bottom-hunter?limit=5${bypassCacheTrigger > 0 ? `&refresh=true&t=${bypassCacheTrigger}` : ""}`
  );

  const grouped = useMemo(() => {
    return {
      all: (data?.grouped?.all || data?.candidates || []) as BottomHunterCandidate[],
      atBottom: (data?.grouped?.atBottom || []) as BottomHunterCandidate[],
      nearBottom: (data?.grouped?.nearBottom || []) as BottomHunterCandidate[],
      rebounding: (data?.grouped?.rebounding || []) as BottomHunterCandidate[],
    };
  }, [data]);

  const activeList = useMemo(() => {
    if (activeFilter === "AT_BOTTOM") return grouped.atBottom;
    if (activeFilter === "NEAR_BOTTOM") return grouped.nearBottom;
    if (activeFilter === "REBOUNDING") return grouped.rebounding;
    return grouped.all;
  }, [grouped, activeFilter]);

  const filteredCandidates = useMemo(() => {
    let list = activeList;

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toUpperCase();
      list = list.filter((i) => i.ticker.includes(q) || (i.stockName && i.stockName.toUpperCase().includes(q)));
    }

    return list.slice(0, 5);
  }, [activeList, searchQuery]);

  const handleManualRefresh = () => {
    setBypassCacheTrigger(Date.now());
  };

  return (
    <Card className="border-teal-200/90 shadow-sm bg-white overflow-hidden">
      {/* ── CARD HEADER ── */}
      <CardHeader className="bg-linear-to-r from-teal-50/90 via-cyan-50/50 to-white pb-4 border-b border-teal-100/80">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="p-1.5 rounded-lg bg-teal-600 text-white shadow-2xs">
                <Anchor className="w-4 h-4" />
              </div>
              <CardTitle className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                Radar Bottom Hunter (5 Saham di Lantai Dasar Terkuat)
                <span className="text-[10px] font-bold text-teal-800 bg-teal-100 border border-teal-300 px-2 py-0.5 rounded-full">
                  1-Year Base Support
                </span>
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-slate-600">
              Mendeteksi saham yang sedang menguji lantai dasar terkuat (52-Week Low, 60D Support, & Base Rebound) dengan proteksi Stop Loss terukur dan rasio Risk:Reward tinggi.
            </CardDescription>
          </div>

          {/* Actions & Search */}
          <div className="flex items-center gap-2">
            <div className="relative w-40 sm:w-52">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                placeholder="Cari emiten..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 pr-2 text-xs bg-white/90 border-slate-200 focus-visible:ring-teal-500 rounded-lg"
              />
            </div>
            <button
              onClick={handleManualRefresh}
              disabled={loading}
              title="Refresh screening bottom price"
              className="h-8 px-2.5 flex items-center gap-1.5 text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100/80 border border-teal-200 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-teal-600" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* ── FILTER TABS (TOP 10 PER STATUS) ── */}
        <div className="flex items-center gap-1.5 pt-3 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveFilter("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeFilter === "ALL"
                ? "bg-teal-700 text-white shadow-xs"
                : "bg-white/80 text-slate-600 hover:bg-slate-100 border border-slate-200/80"
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            Semua Top 5
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              activeFilter === "ALL" ? "bg-teal-900/50 text-teal-100" : "bg-slate-100 text-slate-600"
            }`}>
              {grouped.all.length}
            </span>
          </button>

          <button
            onClick={() => setActiveFilter("AT_BOTTOM")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeFilter === "AT_BOTTOM"
                ? "bg-emerald-700 text-white shadow-xs"
                : "bg-white/80 text-slate-600 hover:bg-slate-100 border border-slate-200/80"
            }`}
          >
            🎯 Tepat di Lantai (&le;2.5%)
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              activeFilter === "AT_BOTTOM" ? "bg-emerald-900/50 text-emerald-100" : "bg-slate-100 text-slate-600"
            }`}>
              {grouped.atBottom.length}
            </span>
          </button>

          <button
            onClick={() => setActiveFilter("NEAR_BOTTOM")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeFilter === "NEAR_BOTTOM"
                ? "bg-cyan-700 text-white shadow-xs"
                : "bg-white/80 text-slate-600 hover:bg-slate-100 border border-slate-200/80"
            }`}
          >
            🟢 Dekat Area Bottom (&le;6.5%)
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              activeFilter === "NEAR_BOTTOM" ? "bg-cyan-900/50 text-cyan-100" : "bg-slate-100 text-slate-600"
            }`}>
              {grouped.nearBottom.length}
            </span>
          </button>

          <button
            onClick={() => setActiveFilter("REBOUNDING")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeFilter === "REBOUNDING"
                ? "bg-indigo-700 text-white shadow-xs"
                : "bg-white/80 text-slate-600 hover:bg-slate-100 border border-slate-200/80"
            }`}
          >
            ⚡ Rebound dari Dasar
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              activeFilter === "REBOUNDING" ? "bg-indigo-900/50 text-indigo-100" : "bg-slate-100 text-slate-600"
            }`}>
              {grouped.rebounding.length}
            </span>
          </button>
        </div>
      </CardHeader>

      {/* ── CARD CONTENT / CANDIDATES TABLE ── */}
      <CardContent className="p-0">
        {loading && !data ? (
          <div className="py-16 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-teal-600" />
            <span>Memindai seluruh data emiten 1 tahun & mendeteksi lantai dasar terkuat...</span>
          </div>
        ) : filteredCandidates.length === 0 ? (
          <div className="py-14 text-center text-xs text-slate-500 space-y-1">
            <Target className="w-7 h-7 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-700">Tidak ada emiten di kategori ini yang memenuhi kriteria lantai dasar.</p>
            <p className="text-[11px] text-slate-400">Silakan pilih kategori lain atau klik Refresh untuk memindai ulang.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80 text-[11px] text-slate-600 hover:bg-slate-50/80 border-b border-slate-200">
                  <TableHead className="w-[170px] font-bold">Emiten & Status</TableHead>
                  <TableHead className="font-bold text-right">Harga Saat Ini</TableHead>
                  <TableHead className="font-bold text-right">Lantai Dasar (Bottom)</TableHead>
                  <TableHead className="font-bold text-center">Jarak ke Bottom</TableHead>
                  <TableHead className="font-bold">Konfirmasi Reversal</TableHead>
                  <TableHead className="font-bold text-right">Trading Plan (SL / TP1)</TableHead>
                  <TableHead className="font-bold text-center">Risk:Reward</TableHead>
                  <TableHead className="font-bold text-center">Skor</TableHead>
                  <TableHead className="w-[70px] text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCandidates.map((c) => {
                  const isChangePositive = c.changePercent > 0;
                  const isChangeNegative = c.changePercent < 0;

                  return (
                    <TableRow key={c.ticker} className="hover:bg-teal-50/30 transition-colors text-xs border-b border-slate-100">
                      {/* 1. Ticker & Status Badge */}
                      <TableCell className="py-2.5">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5">
                            <TickerDetailDialog ticker={c.ticker} />
                            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${
                              c.status === "AT_BOTTOM_SUPPORT"
                                ? "bg-emerald-50 text-emerald-800 border-emerald-300 animate-pulse"
                                : c.status === "NEAR_BOTTOM"
                                ? "bg-cyan-50 text-cyan-800 border-cyan-300"
                                : "bg-indigo-50 text-indigo-800 border-indigo-300"
                            }`}>
                              {c.status === "AT_BOTTOM_SUPPORT" ? "🎯 Tepat di Dasar" : c.status === "NEAR_BOTTOM" ? "🟢 Dekat Bottom" : "⚡ Rebound"}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 line-clamp-1">
                            {c.floorDescription}
                          </span>
                        </div>
                      </TableCell>

                      {/* 2. Harga Saat Ini */}
                      <TableCell className="text-right py-2.5">
                        <div className="font-mono font-bold text-xs text-slate-900">
                          Rp {c.currentPrice.toLocaleString("id-ID")}
                        </div>
                        <div className={`text-[10px] font-mono font-bold ${
                          isChangePositive ? "text-emerald-600" : isChangeNegative ? "text-rose-600" : "text-slate-500"
                        }`}>
                          {isChangePositive ? "+" : ""}{c.changePercent}%
                        </div>
                      </TableCell>

                      {/* 3. Lantai Dasar (Bottom Floor) */}
                      <TableCell className="text-right py-2.5">
                        <div className="font-mono font-black text-xs text-teal-950">
                          Rp {c.bottomPrice.toLocaleString("id-ID")}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500">
                          52W Low: Rp {c.low52Week.toLocaleString("id-ID")}
                        </div>
                      </TableCell>

                      {/* 4. Jarak ke Bottom (%) */}
                      <TableCell className="text-center py-2.5">
                        <span className={`font-mono font-black text-xs px-2 py-0.5 rounded border ${
                          c.distanceToBottomPercent <= 2.5
                            ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                            : c.distanceToBottomPercent <= 6.5
                            ? "bg-cyan-50 text-cyan-800 border-cyan-300"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        }`}>
                          +{c.distanceToBottomPercent}%
                        </span>
                      </TableCell>

                      {/* 5. Konfirmasi Reversal & RSI */}
                      <TableCell className="py-2.5">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-[11px] text-slate-800">
                            {c.candleReversalPattern}
                          </span>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500">
                            <span>RSI 14: <b className={c.isRsiOversold ? "text-rose-600 font-bold" : "text-slate-700 font-bold"}>{c.rsi14}</b></span>
                            <span>Vol Ratio: <b className="text-slate-800 font-bold">{c.volumeAbsorptionRatio}x</b></span>
                          </div>
                        </div>
                      </TableCell>

                      {/* 6. Trading Plan (SL / TP1) */}
                      <TableCell className="text-right py-2.5">
                        <div className="flex flex-col items-end gap-0.5">
                          <div className="text-[11px] font-mono font-bold text-emerald-700">
                            TP1: Rp {c.targetPrice1.toLocaleString("id-ID")} (+{c.targetGain1Percent}%)
                          </div>
                          <div className="text-[10px] font-mono font-medium text-rose-600">
                            SL: Rp {c.safeStopLoss.toLocaleString("id-ID")} (-{c.safeStopLossPercent}%)
                          </div>
                        </div>
                      </TableCell>

                      {/* 7. Risk : Reward */}
                      <TableCell className="text-center py-2.5">
                        <span className="font-mono font-black text-xs text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded">
                          {c.riskRewardRatio}:1
                        </span>
                      </TableCell>

                      {/* 8. Skor Keyakinan */}
                      <TableCell className="text-center py-2.5">
                        <span className="font-mono font-black text-xs text-teal-800 bg-teal-100/80 border border-teal-300 px-2 py-0.5 rounded-full">
                          {c.confidenceScore}
                        </span>
                      </TableCell>

                      {/* 9. Aksi Detail */}
                      <TableCell className="text-center py-2.5">
                        <Link
                          href={`/ticker/${c.ticker}`}
                          title={`Buka cockpit analisis ${c.ticker}`}
                          className="p-1.5 rounded-md text-slate-500 hover:text-teal-700 hover:bg-teal-50 transition-colors inline-flex items-center justify-center"
                        >
                          <ArrowUpRight className="w-4 h-4" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
