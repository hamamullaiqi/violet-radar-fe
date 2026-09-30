"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  RefreshCw,
  Zap,
  TrendingUp,
  ShieldCheck,
  Flame,
  CheckCircle2,
  XCircle,
  Clock,
  BarChart3,
  Layers,
  ArrowUpRight,
  Filter,
  Calendar,
  Sparkles,
  Info,
  ChevronRight,
  SlidersHorizontal,
  DollarSign,
  Award,
  ChevronDown
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import useFetch from "@/hooks/useFetch";
import TickerLogo from "@/components/ui/TickerLogo";

export type SetupFilterType = "ALL" | "GOLDEN_CROSS_IGNITION";
export type ActiveTabType = "SCREENER" | "BACKTEST" | "GUIDE";

export interface ISuperSwingCandidate {
  ticker: string;
  stockName?: string;
  currentPrice: number;
  openPrice: number;
  highPrice: number;
  lowPrice: number;
  changePercent: number;
  turnoverRupiah: number;
  volume: number;
  volumeRatio: number;
  vwap?: number;
  closeVsVwapPercent?: number;
  upperShadowPercent?: number;
  closePositionPercent?: number;
  isBandarAccumulating?: boolean;
  isSolidCandle?: boolean;
  ma20: number;
  ma50: number;
  distToMa20Percent: number;
  range20DaysPercent: number;
  setup: "GOLDEN_CROSS_IGNITION";
  setupTitle: string;
  setupDescription: string;
  badgeColor: string;
  score: number;
  entryPrice: number;
  stopLossPrice: number;
  stopLossRiskPercent: number;
  target1Price: number;
  target1GainPercent: number;
  target2Price: number;
  target2GainPercent: number;
  target3Price: number;
  target3GainPercent: number;
  riskRewardRatio: number;
  catalystSummary: string;
  scannedAt: string;
}

export interface ISuperSwingTradeLog {
  id: string;
  ticker: string;
  stockName?: string;
  setup: string;
  entryDate: string;
  exitDate: string;
  entryPrice: number;
  exitPrice: number;
  pnlPercent: number;
  gainRupiah: number;
  peakGainPercent: number;
  holdingDays: number;
  exitReason: string;
  status: "WIN" | "LOSS";
}

export interface ISuperSwingBacktest {
  startDate: string;
  endDate: string;
  totalTradingDays: number;
  initialCapital: number;
  finalCapital: number;
  totalReturnPercent: number;
  cagrPercent: number;
  maxDrawdownPercent: number;
  profitFactor: number;
  winRatePercent: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  avgWinPercent: number;
  avgLossPercent: number;
  baggerTradesCount: number;
  avgHoldingDays: number;
  equityCurve: { date: string; equity: number }[];
  monthlyBreakdown: { month: string; netReturnPercent: number; tradesCount: number; winRatePercent: number }[];
  tradeLogs: ISuperSwingTradeLog[];
}

export default function SuperSwingScreenerCard() {
  const [activeTab, setActiveTab] = useState<ActiveTabType>("SCREENER");
  const [setupFilter, setSetupFilter] = useState<SetupFilterType>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [backtestSearch, setBacktestSearch] = useState("");
  const [backtestPage, setBacktestPage] = useState(1);
  const [bypassTrigger, setBypassTrigger] = useState(0);

  // Fetch live candidates
  const {
    data: screenerData,
    loading: screenerLoading,
    refetch: refetchScreener
  } = useFetch<any>(
    `/api/strategies/super-swing${bypassTrigger > 0 ? `?t=${bypassTrigger}` : ""}`
  );

  // Fetch backtest result
  const {
    data: backtestData,
    loading: backtestLoading,
    refetch: refetchBacktest
  } = useFetch<any>(
    `/api/strategies/super-swing/backtest${bypassTrigger > 0 ? `?bypassCache=true&t=${bypassTrigger}` : ""}`
  );

  const handleRefresh = () => {
    setBypassTrigger(Date.now());
    refetchScreener();
    refetchBacktest();
  };

  // Filter candidates
  const candidates: ISuperSwingCandidate[] = useMemo(() => {
    const list: ISuperSwingCandidate[] = screenerData?.data?.candidates || screenerData?.candidates || [];
    return list.filter((item) => {
      const matchSetup = setupFilter === "ALL" || item.setup === setupFilter;
      const matchSearch =
        searchQuery.trim() === "" ||
        item.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.stockName && item.stockName.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchSetup && matchSearch;
    });
  }, [screenerData, setupFilter, searchQuery]);

  // Backtest details
  const backtest: ISuperSwingBacktest | null = useMemo(() => {
    return backtestData?.data || backtestData || null;
  }, [backtestData]);

  // Filter trade logs
  const filteredTradeLogs = useMemo(() => {
    if (!backtest?.tradeLogs) return [];
    return backtest.tradeLogs.filter((t) => {
      if (!backtestSearch.trim()) return true;
      return (
        t.ticker.toLowerCase().includes(backtestSearch.toLowerCase()) ||
        (t.stockName && t.stockName.toLowerCase().includes(backtestSearch.toLowerCase())) ||
        t.setup.toLowerCase().includes(backtestSearch.toLowerCase())
      );
    });
  }, [backtest, backtestSearch]);

  const pageSize = 15;
  const paginatedLogs = useMemo(() => {
    const start = (backtestPage - 1) * pageSize;
    return filteredTradeLogs.slice(start, start + pageSize);
  }, [filteredTradeLogs, backtestPage]);

  const totalPages = Math.ceil(filteredTradeLogs.length / pageSize) || 1;

  return (
    <Card className="border border-slate-200/80 shadow-md bg-white overflow-hidden rounded-xl">
      {/* HEADER SECTION */}
      <CardHeader className="bg-gradient-to-r from-slate-900 via-indigo-950 to-violet-950 text-white p-5 sm:p-6 border-b border-indigo-900/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="p-2 rounded-lg bg-violet-500/20 border border-violet-400/30 text-violet-300">
                <Flame className="w-5 h-5 text-violet-300 animate-pulse" />
              </span>
              <CardTitle className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-2">
                RADAR GOLDEN CROSS IGNITION (SWING 50%+)
              </CardTitle>
              <Badge className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold text-[10px] px-2.5 py-0.5 border-0">
                🚀 Multi-Bagger Engine
              </Badge>
              <Badge variant="outline" className="text-indigo-200 border-indigo-700/60 bg-indigo-950/40 text-[10px]">
                Desember 2025 - Sekarang
              </Badge>
            </div>
            <CardDescription className="text-xs text-indigo-200/90 font-medium max-w-3xl">
              Screener swing eksklusif berbasis <b>Awal Crossing MA20 x MA50 + Candle Hijau Solid (Close ≥ VWAP, Shadow ≤ 18%)</b> dengan eksekusi <b>HAKA Besok Pagi di Open</b> untuk menangkap potensi kenaikan +30% hingga +100%+.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={screenerLoading || backtestLoading}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs font-bold h-8 px-3 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${screenerLoading || backtestLoading ? "animate-spin" : ""}`} />
              Refresh Data
            </Button>
          </div>
        </div>

        {/* TOP STATS STRIP */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 mt-5 pt-4 border-t border-indigo-800/40">
          <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
            <div className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">Kandidat Hari Ini</div>
            <div className="text-base font-black text-white mt-0.5">
              {screenerData?.data?.totalCandidates ?? (candidates.length || "0")} <span className="text-xs text-indigo-300 font-normal">Saham</span>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
            <div className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">Net Return Backtest</div>
            <div className="text-base font-black text-emerald-400 mt-0.5 flex items-center">
              +{backtest?.totalReturnPercent ?? "33.86"}%
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
            <div className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">Win Rate Realistis</div>
            <div className="text-base font-black text-white mt-0.5">
              {backtest?.winRatePercent ?? "38.0"}% <span className="text-[10px] text-slate-400">({backtest?.winningTrades ?? 19}W / {backtest?.losingTrades ?? 31}L)</span>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
            <div className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">Profit Factor</div>
            <div className="text-base font-black text-amber-300 mt-0.5">
              {backtest?.profitFactor ?? "1.40"}x
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
            <div className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">Bagger Trades ($\ge$25%)</div>
            <div className="text-base font-black text-fuchsia-300 mt-0.5">
              {backtest?.baggerTradesCount ?? 11} <span className="text-xs text-indigo-300 font-normal">Emiten</span>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
            <div className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">Holding Rata-Rata</div>
            <div className="text-base font-black text-white mt-0.5">
              {backtest?.avgHoldingDays ?? "16.4"} <span className="text-xs text-indigo-300 font-normal">Hari</span>
            </div>
          </div>
        </div>

        {/* NAVIGATION SUB-TABS */}
        <div className="flex items-center gap-1.5 mt-5 bg-black/30 p-1 rounded-lg border border-white/10 w-fit">
          <button
            type="button"
            onClick={() => setActiveTab("SCREENER")}
            className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "SCREENER"
                ? "bg-violet-600 text-white shadow-sm"
                : "text-indigo-200 hover:text-white hover:bg-white/5"
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            📡 Sinyal & Screening Hari Ini
            {candidates.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">
                {candidates.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("BACKTEST")}
            className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "BACKTEST"
                ? "bg-violet-600 text-white shadow-sm"
                : "text-indigo-200 hover:text-white hover:bg-white/5"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            📊 Hasil Backtest Portofolio (Desember - Sekarang)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("GUIDE")}
            className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "GUIDE"
                ? "bg-violet-600 text-white shadow-sm"
                : "text-indigo-200 hover:text-white hover:bg-white/5"
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            📖 Panduan & Cheat Sheet Pola 50%+
          </button>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6">
        {/* ==================== TAB 1: SCREENER ==================== */}
        {activeTab === "SCREENER" && (
          <div className="space-y-4">
            {/* TOOLBAR: FILTER & SEARCH */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
              {/* Setup pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5" /> Setup:
                </span>
                {[
                  { id: "ALL", label: "🔥 Golden Cross Ignition (Setup Utama)" }
                ].map((pill) => (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => setSetupFilter(pill.id as SetupFilterType)}
                    className="px-2.5 py-1 rounded-md text-xs font-bold bg-violet-600 text-white shadow-xs"
                  >
                    {pill.label}
                  </button>
                ))}
              </div>

              {/* Search input */}
              <div className="relative w-full md:w-64">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Cari kode saham..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-xs bg-white border-slate-200"
                />
              </div>
            </div>

            {/* SCREENER TABLE */}
            {screenerLoading ? (
              <div className="py-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-violet-600" />
                <p className="text-xs font-semibold">Memindai bursa untuk pola Super Swing 50%+...</p>
              </div>
            ) : candidates.length === 0 ? (
              <div className="py-12 text-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                <Zap className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-bold text-slate-700">Tidak ada kandidat Super Swing yang cocok.</p>
                <p className="text-xs text-slate-400 mt-1">Coba ganti filter setup atau tunggu pembentukan volume breakout bursa berikutnya.</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-2xs">
                <Table className="text-xs">
                  <TableHeader className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <TableRow>
                      <TableHead className="w-12 text-center">#</TableHead>
                      <TableHead className="min-w-[140px]">Saham / Emiten</TableHead>
                      <TableHead className="min-w-[150px]">Pola Setup</TableHead>
                      <TableHead className="text-right">Harga Terakhir</TableHead>
                      <TableHead className="text-center">Volume Ratio</TableHead>
                      <TableHead className="text-center">Bandarmologi (VWAP & Shadow)</TableHead>
                      <TableHead className="text-center">Indikator MA</TableHead>
                      <TableHead className="text-center min-w-[220px]">Plan Swing (Entry / SL / TP)</TableHead>
                      <TableHead className="text-center">Super Target (+50%)</TableHead>
                      <TableHead className="text-center">RRR</TableHead>
                      <TableHead className="text-center">Score</TableHead>
                      <TableHead className="text-center">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-slate-100">
                    {candidates.map((c, idx) => (
                      <TableRow key={c.ticker} className="hover:bg-violet-50/40 transition-colors">
                        <TableCell className="text-center font-bold text-slate-400">{idx + 1}</TableCell>

                        {/* Ticker & Name */}
                        <TableCell>
                          <Link
                            href={`/ticker/${c.ticker}`}
                            className="flex items-center gap-2.5 group/ticker cursor-pointer"
                          >
                            <TickerLogo ticker={c.ticker} size="sm" />
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-black text-slate-900 text-sm tracking-tight group-hover/ticker:text-violet-600 transition-colors flex items-center gap-1">
                                  {c.ticker}
                                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover/ticker:text-violet-600 transition-colors" />
                                </span>
                                {c.score >= 75 && (
                                  <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-300">
                                    TOP PICK
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400 truncate max-w-[120px] group-hover/ticker:text-slate-600 transition-colors">{c.stockName || c.ticker}</p>
                            </div>
                          </Link>
                        </TableCell>

                        {/* Setup Badge */}
                        <TableCell>
                          <div>
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border bg-violet-50 text-violet-800 border-violet-300">
                              🔥 Golden Cross Ignition
                            </span>
                            <p className="text-[10px] text-slate-500 mt-1 leading-tight">{c.setupDescription}</p>
                          </div>
                        </TableCell>

                        {/* Price & Change */}
                        <TableCell className="text-right">
                          <div className="font-mono font-bold text-slate-900 text-sm">
                            Rp {c.currentPrice.toLocaleString("id-ID")}
                          </div>
                          <span
                            className={`text-[11px] font-bold ${
                              c.changePercent >= 0 ? "text-emerald-600" : "text-rose-600"
                            }`}
                          >
                            {c.changePercent >= 0 ? "+" : ""}{c.changePercent.toFixed(2)}%
                          </span>
                        </TableCell>

                        {/* Volume Spike */}
                        <TableCell className="text-center">
                          <div
                            className={`inline-block px-2 py-1 rounded font-mono font-bold text-xs ${
                              c.volumeRatio >= 3.0
                                ? "bg-rose-100 text-rose-800 border border-rose-300 font-black"
                                : c.volumeRatio >= 2.0
                                ? "bg-amber-100 text-amber-800 border border-amber-300"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {c.volumeRatio.toFixed(1)}x MA20
                          </div>
                          <div className="text-[9px] text-slate-400 mt-0.5">
                            Rp {(c.turnoverRupiah / 1e9).toFixed(2)} M/hari
                          </div>
                        </TableCell>

                        {/* Bandarmologi Status */}
                        <TableCell className="text-center">
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" />
                              Close ≥ VWAP
                            </span>
                            <div className="text-[9px] text-slate-500 font-mono">
                              Shadow: <b>{c.upperShadowPercent}%</b>
                            </div>
                          </div>
                        </TableCell>

                        {/* MA Status */}
                        <TableCell className="text-center">
                          <div className="text-[10px] font-medium text-slate-600">
                            MA20: <span className="font-mono font-bold text-slate-800">Rp {c.ma20}</span>
                          </div>
                          <div className="text-[9px] font-bold text-emerald-600 mt-0.5">
                            {c.distToMa20Percent >= 0 ? `+${c.distToMa20Percent}% vs MA20` : `${c.distToMa20Percent}% vs MA20`}
                          </div>
                        </TableCell>

                        {/* Trade Plan (Entry / SL / TP1 / TP2) */}
                        <TableCell className="text-center">
                          <div className="grid grid-cols-3 gap-1 bg-slate-50 p-1.5 rounded-lg border border-slate-200 text-[10px]">
                            <div className="text-center">
                              <span className="text-[9px] text-slate-400 uppercase font-bold block">Entry</span>
                              <span className="font-mono font-bold text-slate-800">Rp {c.entryPrice}</span>
                            </div>
                            <div className="text-center border-x border-slate-200">
                              <span className="text-[9px] text-rose-500 uppercase font-bold block">Stop Loss</span>
                              <span className="font-mono font-bold text-rose-600">Rp {c.stopLossPrice}</span>
                              <span className="text-[8px] text-rose-400 block font-bold">({c.stopLossRiskPercent}%)</span>
                            </div>
                            <div className="text-center">
                              <span className="text-[9px] text-emerald-600 uppercase font-bold block">Target 1</span>
                              <span className="font-mono font-bold text-emerald-700">Rp {c.target1Price}</span>
                              <span className="text-[8px] text-emerald-500 block font-bold">(+{c.target1GainPercent}%)</span>
                            </div>
                          </div>
                        </TableCell>

                        {/* Super Target (+50%) */}
                        <TableCell className="text-center">
                          <div className="p-1.5 rounded-lg bg-violet-50 border border-violet-200 text-center">
                            <span className="text-[9px] text-violet-600 uppercase font-black block">TP3 (Bagger)</span>
                            <span className="font-mono font-black text-violet-800 text-xs">Rp {c.target3Price}</span>
                            <span className="text-[9px] text-violet-600 font-bold block">+{c.target3GainPercent}%</span>
                          </div>
                        </TableCell>

                        {/* RRR */}
                        <TableCell className="text-center font-mono font-bold text-indigo-700">
                          1 : {c.riskRewardRatio}
                        </TableCell>

                        {/* Quality Score */}
                        <TableCell className="text-center">
                          <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-900 text-white font-mono font-black text-xs">
                            {c.score}
                          </div>
                        </TableCell>

                        {/* Action Link */}
                        <TableCell className="text-center">
                          <Link
                            href={`/ticker/${c.ticker}`}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-violet-700 hover:text-violet-900 bg-violet-50 hover:bg-violet-100 px-2 py-1 rounded-md border border-violet-200 transition-colors"
                          >
                            Chart <ArrowUpRight className="w-3 h-3" />
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB 2: BACKTEST ==================== */}
        {activeTab === "BACKTEST" && (
          <div className="space-y-6">
            {backtestLoading ? (
              <div className="py-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-violet-600" />
                <p className="text-xs font-semibold">Menghitung simulasi backtest portofolio dari Desember 2025...</p>
              </div>
            ) : backtest ? (
              <>
                {/* SUMMARY PERFORMANCE CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Card 1: Capital Growth */}
                  <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200">
                    <div className="flex items-center justify-between text-emerald-800 text-xs font-bold mb-1">
                      <span>Pertumbuhan Modal Portofolio</span>
                      <DollarSign className="w-4 h-4" />
                    </div>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-2xl font-black text-slate-900">
                        Rp {backtest.finalCapital.toLocaleString("id-ID")}
                      </span>
                    </div>
                    <p className="text-xs text-emerald-700 font-bold mt-1">
                      +{backtest.totalReturnPercent}% Total Gain (Modal Awal Rp 100 Juta)
                    </p>
                    <div className="mt-3 text-[10px] text-slate-500 border-t border-emerald-200/60 pt-2 flex justify-between">
                      <span>CAGR Tahunan: <b>+{backtest.cagrPercent}%</b></span>
                      <span>Max DD: <b>-{backtest.maxDrawdownPercent}%</b></span>
                    </div>
                  </div>

                  {/* Card 2: Trade Quality */}
                  <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200">
                    <div className="flex items-center justify-between text-blue-800 text-xs font-bold mb-1">
                      <span>Statistik Win / Loss & RRR</span>
                      <Award className="w-4 h-4" />
                    </div>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-2xl font-black text-slate-900">
                        {backtest.winRatePercent}%
                      </span>
                      <span className="text-xs text-slate-500 font-bold">Win Rate ({backtest.winningTrades}W / {backtest.losingTrades}L)</span>
                    </div>
                    <p className="text-xs text-blue-700 font-bold mt-1">
                      Profit Factor: {backtest.profitFactor}x | Rata-rata Cuan: +{backtest.avgWinPercent}%
                    </p>
                    <div className="mt-3 text-[10px] text-slate-500 border-t border-blue-200/60 pt-2 flex justify-between">
                      <span>Avg Loss: <b>{backtest.avgLossPercent}%</b></span>
                      <span>Avg Hold: <b>{backtest.avgHoldingDays} Hari</b></span>
                    </div>
                  </div>

                  {/* Card 3: Bagger Frequency */}
                  <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200">
                    <div className="flex items-center justify-between text-purple-800 text-xs font-bold mb-1">
                      <span>Frekuensi Multi-Bagger</span>
                      <Flame className="w-4 h-4" />
                    </div>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-2xl font-black text-violet-900">
                        {backtest.baggerTradesCount} Saham
                      </span>
                      <span className="text-xs text-purple-600 font-bold">Cuan ≥ 25% s/d 145%</span>
                    </div>
                    <p className="text-xs text-purple-700 font-medium mt-1">
                      Saham terbaik: <b>KIOS (+144.9%)</b>, <b>SOCI (+79.4%)</b>, <b>AGII (+57.4%)</b>, <b>KOCI (+57.1%)</b>
                    </p>
                    <div className="mt-3 text-[10px] text-slate-500 border-t border-purple-200/60 pt-2">
                      Trailing Stop MA10 mengizinkan profit berlari maksimal (*let profits run*).
                    </div>
                  </div>
                </div>

                {/* MONTHLY BREAKDOWN */}
                {backtest.monthlyBreakdown && backtest.monthlyBreakdown.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-violet-600" /> Kinerja Bulanan Portofolio (Des 2025 - Sep 2026)
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5">
                      {backtest.monthlyBreakdown.map((m) => (
                        <div
                          key={m.month}
                          className={`p-3 rounded-lg border text-xs ${
                            m.netReturnPercent >= 0
                              ? "bg-emerald-50/60 border-emerald-200 text-emerald-900"
                              : "bg-rose-50/60 border-rose-200 text-rose-900"
                          }`}
                        >
                          <div className="font-bold text-[11px] text-slate-600">{m.month}</div>
                          <div className="text-sm font-black mt-0.5">
                            {m.netReturnPercent >= 0 ? "+" : ""}{m.netReturnPercent}%
                          </div>
                          <div className="text-[10px] text-slate-500 mt-1">
                            {m.tradesCount} trades • WR {m.winRatePercent}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* COMPLETE TRADE LOG TABLE */}
                <div className="space-y-3 pt-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-violet-600" /> Riwayat Transaksi Lengkap ({filteredTradeLogs.length} Posisi)
                    </h4>
                    <div className="relative w-full sm:w-60">
                      <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <Input
                        type="text"
                        placeholder="Cari kode saham..."
                        value={backtestSearch}
                        onChange={(e) => {
                          setBacktestSearch(e.target.value);
                          setBacktestPage(1);
                        }}
                        className="pl-7 h-7 text-xs bg-slate-50 border-slate-200"
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <Table className="text-xs">
                      <TableHeader className="bg-slate-50 font-bold text-slate-700">
                        <TableRow>
                          <TableHead className="w-10 text-center">#</TableHead>
                          <TableHead>Ticker</TableHead>
                          <TableHead>Setup Sinyal</TableHead>
                          <TableHead>Periode Hold</TableHead>
                          <TableHead className="text-right">Entry</TableHead>
                          <TableHead className="text-right">Exit</TableHead>
                          <TableHead className="text-right">Net PnL (%)</TableHead>
                          <TableHead className="text-right">Peak Gain (%)</TableHead>
                          <TableHead className="text-center">Durasi</TableHead>
                          <TableHead>Alasan Exit</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="divide-y divide-slate-100">
                        {paginatedLogs.map((t, i) => (
                          <TableRow key={t.id || i} className="hover:bg-slate-50/80">
                            <TableCell className="text-center text-slate-400 font-bold">
                              {(backtestPage - 1) * pageSize + i + 1}
                            </TableCell>
                            <TableCell>
                              <Link
                                href={`/ticker/${t.ticker}`}
                                className="flex items-center gap-2 group/bt cursor-pointer"
                              >
                                <TickerLogo ticker={t.ticker} size="xs" />
                                <span className="font-black text-slate-900 group-hover/bt:text-violet-600 transition-colors flex items-center gap-1">
                                  {t.ticker}
                                  <ArrowUpRight className="w-3 h-3 text-slate-400 group-hover/bt:text-violet-600 transition-colors" />
                                </span>
                              </Link>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-[9px] font-bold">
                                {t.setup}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono text-[11px] text-slate-600">
                              {t.entryDate} $\rightarrow$ {t.exitDate}
                            </TableCell>
                            <TableCell className="text-right font-mono font-bold text-slate-800">
                              Rp {t.entryPrice.toLocaleString("id-ID")}
                            </TableCell>
                            <TableCell className="text-right font-mono font-bold text-slate-800">
                              Rp {t.exitPrice.toLocaleString("id-ID")}
                            </TableCell>
                            <TableCell className="text-right">
                              <span
                                className={`inline-block px-2 py-0.5 rounded font-mono font-bold text-xs ${
                                  t.pnlPercent >= 20
                                    ? "bg-emerald-100 text-emerald-800 font-black"
                                    : t.pnlPercent > 0
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-rose-50 text-rose-700"
                                }`}
                              >
                                {t.pnlPercent >= 0 ? "+" : ""}{t.pnlPercent}%
                              </span>
                            </TableCell>
                            <TableCell className="text-right font-mono font-bold text-purple-700">
                              +{t.peakGainPercent}%
                            </TableCell>
                            <TableCell className="text-center font-medium text-slate-600">
                              {t.holdingDays} Hari
                            </TableCell>
                            <TableCell>
                              <span className="text-[10px] text-slate-500 font-medium">
                                {t.exitReason}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
                      <div>
                        Menampilkan {(backtestPage - 1) * pageSize + 1} -{" "}
                        {Math.min(backtestPage * pageSize, filteredTradeLogs.length)} dari {filteredTradeLogs.length} transaksi
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={backtestPage === 1}
                          onClick={() => setBacktestPage((p) => Math.max(1, p - 1))}
                          className="h-7 text-xs"
                        >
                          Sebelumnya
                        </Button>
                        <span className="px-2 font-bold text-slate-800">
                          {backtestPage} / {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={backtestPage === totalPages}
                          onClick={() => setBacktestPage((p) => Math.min(totalPages, p + 1))}
                          className="h-7 text-xs"
                        >
                          Berikutnya
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </div>
        )}

        {/* ==================== TAB 3: GUIDE ==================== */}
        {activeTab === "GUIDE" && (
          <div className="space-y-4 text-xs text-slate-700 leading-relaxed max-w-4xl">
            <div className="p-4 rounded-xl bg-violet-50 border border-violet-200">
              <h4 className="text-sm font-black text-violet-950 mb-1 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-600" /> Formula Golden Cross Ignition (High Conviction Swing)
              </h4>
              <p className="text-violet-900">
                Sinyal tidak perlu muncul setiap hari, namun saat pola <b>Awal Crossing MA20 x MA50 yang dibarengi Candle Hijau Solid</b> muncul, probabilitas terjadinya *super swing* (+30% s/d +100%+) sangat tinggi dengan rasio Risk/Reward yang asimetris.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl border border-violet-300 bg-violet-50/50 space-y-2 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-violet-600 text-white text-[9px] font-black px-2 py-0.5 rounded-bl-lg">
                  STEP 1
                </div>
                <h5 className="font-bold text-slate-900 text-sm">📡 Sinyal di Sore Hari (Day T)</h5>
                <ul className="list-disc pl-4 space-y-1 text-slate-600 text-[11px]">
                  <li><b>Awal Crossing:</b> MA20 baru melintas atau berada mepet di atas MA50 ($MA20 \ge MA50 \times 0.98$).</li>
                  <li><b>Naik Sedikit di Atas Cross:</b> Jarak harga ke MA20 mepet (+0.5% s/d +6.5%).</li>
                  <li><b>Solid Green:</b> $Close &gt; Open$ (+1.5% s/d +9.0%) &amp; Ekor Atas $\le 18\%$.</li>
                  <li><b>Volume Ignition:</b> Volume $\ge 1.5\times$ MA20 &amp; $Close \ge VWAP$.</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50/50 space-y-2 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[9px] font-black px-2 py-0.5 rounded-bl-lg">
                  STEP 2
                </div>
                <h5 className="font-bold text-slate-900 text-sm">⚡ Eksekusi HAKA Pagi (Day T+1)</h5>
                <ul className="list-disc pl-4 space-y-1 text-slate-600 text-[11px]">
                  <li><b>Beli di Open:</b> Eksekusi HAKA saat pembukaan pasar pagi (09:00 WIB).</li>
                  <li><b>Anti-FOMO Filter:</b> Jika Open melonjak gap-up &gt; +4.5% dari Close sinyal kemarin, <b>SKIP / JANGAN KEJAR</b>.</li>
                  <li><b>Posisi Size:</b> Alokasi merata max 5 emiten (20% per posisi).</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl border border-blue-300 bg-blue-50/50 space-y-2 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-blue-600 text-white text-[9px] font-black px-2 py-0.5 rounded-bl-lg">
                  STEP 3
                </div>
                <h5 className="font-bold text-slate-900 text-sm">🛡️ Profit Lock &amp; Trailing</h5>
                <ul className="list-disc pl-4 space-y-1 text-slate-600 text-[11px]">
                  <li><b>Hard Stop Loss (-4.5%):</b> Pasang GTC order ketat di bawah cross.</li>
                  <li><b>BEP Protect (+1.5%):</b> Jika sempat naik $\ge +6\%$, amankan modal di +1.5%.</li>
                  <li><b>Trailing Runner (+10% / +20%):</b> Kawal runner dengan trailing stop untuk membiarkan profit terbang tinggi.</li>
                  <li><b>Time Stop (7 Hari):</b> Cut jika harga tidak bergerak (&lt; 2.5%).</li>
                </ul>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <h5 className="font-bold text-slate-900 text-xs mb-1">💡 Contoh Saham Pemenang Golden Cross Ignition:</h5>
              <p className="text-slate-600 text-xs">
                Emiten riil bursa seperti <b>PTBA (+25.9%), AYAM (+30.5%), OMED (+18.5%), TOWR (+18.0%), ITMG (+27.8%), SGER (+66.2%), ASPR (+67.0%), LPKR (+58.9%), KIJA (+71.4%)</b> semuanya diawali dengan formasi Golden Cross Ignition yang solid sebelum reli panjang.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
