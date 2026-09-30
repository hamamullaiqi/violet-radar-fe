"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  RefreshCw,
  Zap,
  ArrowUpRight,
  Layers,
  ExternalLink,
  Info,
  ShieldCheck,
  Globe2,
  TrendingUp,
  Flame,
  CheckCircle2,
  Target
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import useFetch from "@/hooks/useFetch";
import TickerLogo from "@/components/ui/TickerLogo";
import { FastReboundCandidate } from "./FastReboundRadarCard";

export type UnifiedViewMode = "TOP_2_DAILY" | "ALL_FAST_REBOUND" | "HAMMER_REVERSAL" | "OVERSOLD_BOUNCE" | "V_SHAPE_BOTTOM";
export type UniverseFilter = "ALL" | "KOMPAS100";

const KOMPAS100_TICKERS = new Set([
  'BBCA', 'BBRI', 'BMRI', 'BBNI', 'BRIS', 'BDMN', 'BBTN', 'BTPS', 'ARTO', 'BNGA', 'BJBR', 'BJTM', 'BNLI', 'PNBN', 'BNII', 'BBKP', 'AGRO', 'ADMF', 'BFIN',
  'ADRO', 'PTBA', 'ITMG', 'BUMI', 'MEDC', 'PGAS', 'AKRA', 'INDY', 'HRUM', 'PGEO', 'ABMM', 'DOID', 'ELSA', 'ENRG', 'RAJA', 'BSSR', 'MBAP', 'TOBA',
  'ANTM', 'MDKA', 'INCO', 'TINS', 'MBMA', 'NCKL', 'AMMN', 'PSAB', 'BRMS', 'BREN', 'CUAN', 'PTRO',
  'TLKM', 'ISAT', 'EXCL', 'GOTO', 'EMTK', 'TOWR', 'MTEL', 'TBIG', 'BUKA', 'SCMA', 'WIFI', 'MTDL', 'DMMX',
  'UNVR', 'ICBP', 'INDF', 'MYOR', 'AMRT', 'MIDI', 'KLBF', 'SIDO', 'ACES', 'MAPI', 'MAPA', 'CPIN', 'JPFA', 'CMRY', 'ROTI', 'ULTJ', 'CLEO', 'HEAL', 'MIKA', 'SILO', 'PRDA',
  'ASII', 'UNTR', 'AUTO', 'DRMA', 'SMSM', 'HEXA',
  'BRPT', 'TPIA', 'INKP', 'TKIM', 'SMGR', 'INTP', 'AVIA', 'ESSA', 'MCOL', 'ARNA', 'SMBR',
  'BSDE', 'CTRA', 'PWON', 'SMRA', 'PANI', 'JSMR', 'PTPP', 'ADHI', 'WIKA', 'SSIA', 'DMAS', 'ASRI', 'KIJA', 'IPCC', 'SMDR', 'TMAS'
]);

export interface IFastReboundRow {
  id: string;
  rank: number;
  selectionBadge: string;
  selectionBadgeColor: string;
  ticker: string;
  stockName?: string;
  isKompas100: boolean;
  currentPrice: number;
  changePercent: number;
  turnoverRupiah: number;
  setupDescription: string;
  setupBadge: string;
  entryPrice: number;
  target1: { price: number; gainPercent: number };
  target2: { price: number; gainPercent: number };
  stopLoss: { price: number; riskPercent: number };
  bepPrice: number;
  riskRewardRatio: number;
  score: number;
  reboundBadge: string;
  trackRecordCount: number;
  avgHistoricalGain: number;
  holdingTimeEstimate: string;
}

export default function UnifiedSpecialRadarTable() {
  const [viewMode, setViewMode] = useState<UnifiedViewMode>("TOP_2_DAILY");
  const [universeFilter, setUniverseFilter] = useState<UniverseFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [bypassTrigger, setBypassTrigger] = useState(0);

  // Fetch Top 2 Fast V-Rebound (Super Asimetris Core Strategy)
  const {
    data: reboundData,
    loading: reboundLoading,
    refetch: refetchRebound
  } = useFetch<any>(
    `/api/strategies/fast-rebound?limit=2${bypassTrigger > 0 ? `&refresh=true&t=${bypassTrigger}` : ""}`
  );

  const handleRefreshAll = () => {
    setBypassTrigger(Date.now());
    refetchRebound();
  };

  // Process and build unified rows
  const { allPoolRows, top2DailyRows } = useMemo(() => {
    const rawList: FastReboundCandidate[] = Array.isArray(reboundData)
      ? reboundData
      : Array.isArray(reboundData?.candidates)
      ? reboundData.candidates
      : Array.isArray(reboundData?.grouped?.all)
      ? reboundData.grouped.all
      : [];

    const allRows: IFastReboundRow[] = [];

    rawList.forEach((item, idx) => {
      const isKompas = KOMPAS100_TICKERS.has(item.ticker.toUpperCase());
      const rank = idx + 1;

      let selectionBadge = `⚡ Fast Rebound #${rank}`;
      let selectionBadgeColor = "border-amber-500/30 bg-amber-500/10 text-amber-400";

      if (rank === 1) {
        selectionBadge = "🥇 Juara #1 Fast V-Rebound";
        selectionBadgeColor = "border-amber-500/40 bg-gradient-to-r from-amber-500/20 to-yellow-500/10 text-yellow-300 font-bold shadow-sm shadow-amber-500/10";
      } else if (rank === 2) {
        selectionBadge = "🥈 Runner-Up #2 Fast V-Rebound";
        selectionBadgeColor = "border-sky-500/40 bg-gradient-to-r from-sky-500/20 to-indigo-500/10 text-sky-300 font-bold shadow-sm shadow-sky-500/10";
      }

      const bepPrice = Math.round(item.currentPrice * 1.005);

      const row: IFastReboundRow = {
        id: `REBOUND_${item.ticker}_${idx}`,
        rank,
        selectionBadge,
        selectionBadgeColor,
        ticker: item.ticker,
        stockName: item.stockName,
        isKompas100: isKompas,
        currentPrice: item.currentPrice,
        changePercent: item.changePercent || 0,
        turnoverRupiah: item.turnoverRupiah || 0,
        setupDescription: `DNA 1 Tahun: ${item.reboundTrackRecordCount1Year}x V-Rebound (Avg +${item.avgHistoricalReboundGainPercent.toFixed(1)}%). Drawdown -${item.currentDrawdownFromHighPercent.toFixed(1)}%.`,
        setupBadge:
          item.reboundBadge === "SUPPORT_REJECTION_HAMMER"
            ? "Hammer Reversal Support"
            : item.reboundBadge === "OVERSOLD_BOUNCE_SETUP"
            ? "Oversold RSI Rebound"
            : "V-Shape Bottom Bounce",
        entryPrice: item.currentPrice,
        target1: {
          price: item.targetReboundQuick || Math.round(item.currentPrice * 1.09),
          gainPercent: item.targetReboundQuickGainPercent || 9.0
        },
        target2: {
          price: item.targetVPeak || Math.round(item.currentPrice * 1.20),
          gainPercent: item.targetVPeakGainPercent || 20.0
        },
        stopLoss: {
          price: item.stopLossPrice || Math.round(item.currentPrice * 0.988),
          riskPercent: item.stopLossRiskPercent || 1.2
        },
        bepPrice,
        riskRewardRatio: item.riskRewardRatio || 7.5,
        score: item.score || 85,
        reboundBadge: item.reboundBadge || "V_SHAPE_BOTTOM_REVERSAL",
        trackRecordCount: item.reboundTrackRecordCount1Year || 0,
        avgHistoricalGain: item.avgHistoricalReboundGainPercent || 0,
        holdingTimeEstimate: "2 - 6 Hari"
      };

      allRows.push(row);
    });

    const top2 = allRows.slice(0, 2);

    return { allPoolRows: allRows, top2DailyRows: top2 };
  }, [reboundData]);

  // Filter & Search
  const currentDisplayList = useMemo(() => {
    let list: IFastReboundRow[] = [];

    if (viewMode === "TOP_2_DAILY") {
      list = top2DailyRows;
    } else if (viewMode === "ALL_FAST_REBOUND") {
      list = allPoolRows;
    } else if (viewMode === "HAMMER_REVERSAL") {
      list = allPoolRows.filter((r) => r.reboundBadge === "SUPPORT_REJECTION_HAMMER");
    } else if (viewMode === "OVERSOLD_BOUNCE") {
      list = allPoolRows.filter((r) => r.reboundBadge === "OVERSOLD_BOUNCE_SETUP");
    } else if (viewMode === "V_SHAPE_BOTTOM") {
      list = allPoolRows.filter((r) => r.reboundBadge === "V_SHAPE_BOTTOM_REVERSAL");
    }

    // Universe Filter (KOMPAS100 vs ALL)
    if (universeFilter === "KOMPAS100") {
      list = list.filter((r) => r.isKompas100);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      list = list.filter((row) => {
        const matchTicker = row.ticker.toLowerCase().includes(query);
        const matchName = (row.stockName || "").toLowerCase().includes(query);
        const matchSetup = row.setupDescription.toLowerCase().includes(query);
        return matchTicker || matchName || matchSetup;
      });
    }

    return list;
  }, [viewMode, universeFilter, top2DailyRows, allPoolRows, searchQuery]);

  return (
    <TooltipProvider>
      <Card className="border border-slate-800 bg-slate-900/90 backdrop-blur-md shadow-2xl rounded-2xl overflow-hidden">
        {/* HEADER */}
        <CardHeader className="p-6 border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/30">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-600 to-yellow-400 shadow-lg shadow-amber-500/20 text-slate-950">
                  <Zap className="w-5 h-5 fill-slate-950" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                      Special Radars: 2 Saham Fast V-Rebound Pilihan Harian
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-amber-500/20 text-yellow-300 border border-amber-500/30">
                        {viewMode === "TOP_2_DAILY" ? "2 Saham Fokus Eksekusi" : `${currentDisplayList.length} Kandidat`}
                      </span>
                    </CardTitle>
                  </div>
                  <CardDescription className="text-xs text-slate-400 mt-0.5 flex flex-wrap items-center gap-2">
                    <span className="text-yellow-400 font-semibold">⚡ Top 2 Fast V-Rebound Super Asimetris</span>
                    <span>•</span>
                    <span className="text-emerald-400 font-medium">SOP: Antre Buy Limit Pagi di Harga Sinyal Kemarin</span>
                    <span>•</span>
                    <span className="text-sky-300 font-medium">SL -1.2% • BEP +0.5% • TP1 +9% • TP2 +20%</span>
                    <span className="hidden sm:inline-block text-slate-600">|</span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-300 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded">
                      🛡️ Anti-Gocap & FCA (Min Rp 70 • Turnover &gt; Rp 500 Jt)
                    </span>
                  </CardDescription>
                </div>
              </div>
            </div>

            {/* ACTION CONTROLS */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* UNIVERSE TOGGLE: ALL vs KOMPAS100 */}
              <div className="inline-flex p-0.5 bg-slate-950/80 rounded-lg border border-slate-800">
                <button
                  onClick={() => setUniverseFilter("ALL")}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold transition ${
                    universeFilter === "ALL"
                      ? "bg-slate-800 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                  title="Tampilkan seluruh saham likuid yang aktif di bursa"
                >
                  <Globe2 className="w-3.5 h-3.5" />
                  <span>Semua Likuid</span>
                </button>
                <button
                  onClick={() => setUniverseFilter("KOMPAS100")}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold transition ${
                    universeFilter === "KOMPAS100"
                      ? "bg-amber-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-amber-300"
                  }`}
                  title="Filter hanya 100 saham terlikuid & berkapitalisasi besar (Kompas100)"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>KOMPAS100</span>
                </button>
              </div>

              {/* SEARCH INPUT */}
              <div className="relative w-full sm:w-48">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <Input
                  placeholder="Cari kode..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 bg-slate-950/60 border-slate-800 focus:border-amber-500 text-xs text-white placeholder:text-slate-500 rounded-lg"
                />
              </div>

              {/* REFRESH BUTTON */}
              <button
                onClick={handleRefreshAll}
                disabled={reboundLoading}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-lg border border-slate-700 transition disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${reboundLoading ? "animate-spin text-amber-400" : ""}`} />
              </button>
            </div>
          </div>

          {/* FILTER / VIEW MODE TABS */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-4 mt-2 border-t border-slate-800/80">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setViewMode("TOP_2_DAILY")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  viewMode === "TOP_2_DAILY"
                    ? "bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md shadow-amber-600/30"
                    : "bg-slate-800/70 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800"
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
                <span>🎯 2 Saham Pilihan Eksekusi Hari Ini</span>
              </button>

              <button
                onClick={() => setViewMode("ALL_FAST_REBOUND")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  viewMode === "ALL_FAST_REBOUND"
                    ? "bg-slate-700 text-white shadow-md shadow-slate-700/30"
                    : "bg-slate-800/70 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>📋 Seluruh Pool Rebound ({allPoolRows.length} Saham)</span>
              </button>

              <button
                onClick={() => setViewMode("HAMMER_REVERSAL")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  viewMode === "HAMMER_REVERSAL"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                    : "bg-slate-800/70 text-slate-400 hover:text-emerald-300 hover:bg-slate-800 border border-slate-800"
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span>🔨 Hammer Support</span>
              </button>

              <button
                onClick={() => setViewMode("OVERSOLD_BOUNCE")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  viewMode === "OVERSOLD_BOUNCE"
                    ? "bg-sky-600 text-white shadow-md shadow-sky-600/30"
                    : "bg-slate-800/70 text-slate-400 hover:text-sky-300 hover:bg-slate-800 border border-slate-800"
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-sky-400" />
                <span>🌊 Oversold RSI Bounce</span>
              </button>

              <button
                onClick={() => setViewMode("V_SHAPE_BOTTOM")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  viewMode === "V_SHAPE_BOTTOM"
                    ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                    : "bg-slate-800/70 text-slate-400 hover:text-purple-300 hover:bg-slate-800 border border-slate-800"
                }`}
              >
                <Target className="w-3.5 h-3.5 text-purple-400" />
                <span>📐 V-Shape Reversal</span>
              </button>
            </div>

            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-amber-400" />
              <span>SOP Eksekusi: Pasang Buy Limit di <b>Harga Sinyal EOD</b> saat pagi 08:45-09:00 WIB.</span>
            </div>
          </div>
        </CardHeader>

        {/* TABLE CONTENT */}
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-800 bg-slate-950/70 hover:bg-slate-950/70 text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                  <TableHead className="min-w-[160px]">Saham Terpilih</TableHead>
                  <TableHead className="text-right">Harga Sinyal (EOD)</TableHead>
                  <TableHead className="text-right">Antre Buy Limit</TableHead>
                  <TableHead className="min-w-[200px]">Karakteristik Setup Reversal</TableHead>
                  <TableHead className="text-right">Target 1 (TP1 +9%)</TableHead>
                  <TableHead className="text-right">Target 2 (TP2 +20%)</TableHead>
                  <TableHead className="text-right">Stop Loss (-1.2%)</TableHead>
                  <TableHead className="text-center">Risk : Reward</TableHead>
                  <TableHead className="text-center">Skor</TableHead>
                  <TableHead className="text-center w-24">Aksi</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {reboundLoading && currentDisplayList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="h-44 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
                        <span className="text-xs">Memindai 2 Saham Fast V-Rebound terbaik hari ini...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : currentDisplayList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="h-32 text-center text-slate-500 text-xs">
                      {universeFilter === "KOMPAS100"
                        ? "Tidak ada saham KOMPAS100 pada filter ini. Coba beralih ke toggle 'Semua Likuid'."
                        : "Tidak ada saham yang sesuai dengan filter."}
                    </TableCell>
                  </TableRow>
                ) : (
                  currentDisplayList.map((row) => (
                    <TableRow
                      key={row.id}
                      className="border-b border-slate-800/60 hover:bg-slate-800/40 transition group"
                    >
                      {/* 1. TICKER & NAME */}
                      <TableCell>
                        <Link
                          href={`/ticker/${row.ticker}`}
                          className="flex items-center gap-2.5 group/link"
                        >
                          <TickerLogo ticker={row.ticker} size="sm" />
                          <div>
                            <div className="font-bold text-white text-base tracking-wide group-hover/link:text-amber-400 transition flex items-center gap-1.5">
                              {row.ticker}
                              {row.isKompas100 && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-amber-500/20 text-yellow-300 border border-amber-500/30">
                                  KOMPAS100
                                </span>
                              )}
                              <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover/link:text-amber-400 transition" />
                            </div>
                            <div className="text-[11px] text-slate-500 truncate max-w-[130px]">
                              {row.stockName || "IDX Equity"}
                            </div>
                          </div>
                        </Link>
                      </TableCell>

                      {/* 3. SIGNAL PRICE (EOD) */}
                      <TableCell className="text-right">
                        <div className="font-mono font-bold text-white text-sm">
                          Rp {row.currentPrice.toLocaleString("id-ID")}
                        </div>
                        <div
                          className={`text-xs font-semibold font-mono ${
                            row.changePercent > 0
                              ? "text-emerald-400"
                              : row.changePercent < 0
                              ? "text-rose-400"
                              : "text-slate-400"
                          }`}
                        >
                          {row.changePercent > 0 ? "+" : ""}
                          {row.changePercent.toFixed(1)}%
                        </div>
                      </TableCell>

                      {/* 4. ANTREAN BUY LIMIT */}
                      <TableCell className="text-right font-mono">
                        <div className="text-yellow-300 font-bold text-xs bg-amber-950/60 border border-amber-500/40 px-2 py-1 rounded inline-block">
                          Rp {row.entryPrice.toLocaleString("id-ID")}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Pullback Match
                        </div>
                      </TableCell>

                      {/* 5. SETUP & SETUP BADGE */}
                      <TableCell>
                        <div className="space-y-1">
                          <Badge
                            variant="secondary"
                            className="bg-slate-800 text-slate-300 border border-slate-700/60 text-[10px] font-medium px-2 py-0.5"
                          >
                            {row.setupBadge}
                          </Badge>
                          <div className="text-[11px] text-slate-400 leading-tight line-clamp-1 max-w-[220px]">
                            {row.setupDescription}
                          </div>
                        </div>
                      </TableCell>

                      {/* 6. TARGET 1 (TP1) */}
                      <TableCell className="text-right font-mono">
                        <div className="text-emerald-400 font-bold text-xs">
                          Rp {row.target1.price.toLocaleString("id-ID")}
                        </div>
                        <div className="text-[10px] text-emerald-500 font-semibold">
                          +{row.target1.gainPercent}%
                        </div>
                      </TableCell>

                      {/* 7. TARGET 2 (TP2 / RUNNER) */}
                      <TableCell className="text-right font-mono">
                        <div className="text-sky-300 font-bold text-xs">
                          Rp {row.target2.price.toLocaleString("id-ID")}
                        </div>
                        <div className="text-[10px] text-sky-400 font-semibold">
                          +{row.target2.gainPercent}%
                        </div>
                      </TableCell>

                      {/* 8. STOP LOSS (SL -1.2%) & BEP */}
                      <TableCell className="text-right font-mono">
                        <div className="text-rose-400 font-bold text-xs">
                          Rp {row.stopLoss.price.toLocaleString("id-ID")}
                        </div>
                        <div className="text-[10px] text-rose-500 font-semibold">
                          -{row.stopLoss.riskPercent}% (SL)
                        </div>
                        <div className="text-[9px] text-emerald-400 font-sans mt-0.5">
                          BEP: Peak &ge; 2.5% &rarr; Rp {row.bepPrice.toLocaleString("id-ID")}
                        </div>
                      </TableCell>

                      {/* 9. RISK : REWARD RATIO */}
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className="font-mono text-xs px-2.5 py-0.5 bg-slate-950/80 border-emerald-500/40 text-emerald-400 font-bold"
                        >
                          {row.riskRewardRatio.toFixed(1)} : 1
                        </Badge>
                      </TableCell>

                      {/* 10. SCORE */}
                      <TableCell className="text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className="font-mono font-bold text-xs text-white">{row.score}</span>
                          <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-0.5">
                            <div
                              className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full"
                              style={{ width: `${Math.min(100, Math.max(10, row.score))}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>

                      {/* 11. ACTION */}
                      <TableCell className="text-center">
                        <Link
                          href={`/ticker/${row.ticker}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg transition"
                        >
                          <span>Analisa</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* FOOTER SOP INFO */}
          <div className="p-4 bg-slate-950/90 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between text-xs text-slate-400 gap-3">
            <div className="flex flex-wrap items-center gap-4 text-[11px]">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-yellow-400" />
                <span><b>Alokasi</b>: Maks 2 Slot Aktif (50% Kas per Saham)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span><b>Proteksi BEP</b>: Jika Peak &ge; +2.5%, geser SL ke +0.5%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
                <span><b>Maks Hold</b>: 6 Hari Bursa</span>
              </div>
            </div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1">
              <Info className="w-3.5 h-3.5" />
              <span>Gunakan toggle <b>KOMPAS100</b> untuk menyaring hanya emiten bluechip/terlikuid.</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
