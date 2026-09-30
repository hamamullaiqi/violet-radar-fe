"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  RefreshCw,
  Zap,
  ArrowUpRight,
  ShieldCheck,
  Target,
  Sparkles,
  TrendingUp,
  Award
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import useFetch from "@/hooks/useFetch";
import TickerLogo from "@/components/ui/TickerLogo";
import { FastReboundCandidate } from "./FastReboundRadarCard";

export interface IFastReboundRow {
  id: string;
  rank: number;
  selectionBadge: string;
  selectionBadgeColor: string;
  ticker: string;
  stockName?: string;
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
  const [searchQuery, setSearchQuery] = useState("");
  const [bypassTrigger, setBypassTrigger] = useState(0);

  // Fetch Top Fast V-Rebound Candidates across all liquid stocks
  const {
    data: reboundData,
    loading: reboundLoading,
    refetch: refetchRebound
  } = useFetch<any>(
    `/api/strategies/fast-rebound?limit=30&universe=ALL${bypassTrigger > 0 ? `&refresh=true&t=${bypassTrigger}` : ""}`
  );

  const handleRefreshAll = () => {
    setBypassTrigger(Date.now());
    refetchRebound();
  };

  // Process and build Top 2 rows
  const top2DailyRows = useMemo(() => {
    const rawList: FastReboundCandidate[] = Array.isArray(reboundData)
      ? reboundData
      : Array.isArray(reboundData?.candidates)
      ? reboundData.candidates
      : Array.isArray(reboundData?.grouped?.all)
      ? reboundData.grouped.all
      : [];

    const allRows: IFastReboundRow[] = [];

    rawList.forEach((item, idx) => {
      const rank = idx + 1;

      let selectionBadge = `⚡ Fast Rebound #${rank}`;
      let selectionBadgeColor = "border-amber-300 bg-amber-50 text-amber-900";

      if (rank === 1) {
        selectionBadge = "🥇 Juara #1 Fast V-Rebound";
        selectionBadgeColor = "border-amber-400 bg-gradient-to-r from-amber-100 to-yellow-50 text-amber-900 font-extrabold shadow-sm";
      } else if (rank === 2) {
        selectionBadge = "🥈 Runner-Up #2 Fast V-Rebound";
        selectionBadgeColor = "border-sky-300 bg-gradient-to-r from-sky-100 to-blue-50 text-sky-900 font-extrabold shadow-sm";
      }

      const bepPrice = Math.round(item.currentPrice * 1.005);

      const row: IFastReboundRow = {
        id: `REBOUND_${item.ticker}_${idx}`,
        rank,
        selectionBadge,
        selectionBadgeColor,
        ticker: item.ticker,
        stockName: item.stockName,
        currentPrice: item.currentPrice,
        changePercent: item.changePercent || 0,
        turnoverRupiah: item.turnoverRupiah || 0,
        setupDescription: `DNA 1 Thn: ${item.reboundTrackRecordCount1Year}x Rebound (Avg +${item.avgHistoricalReboundGainPercent.toFixed(1)}%). Drawdown -${item.currentDrawdownFromHighPercent.toFixed(1)}%.`,
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

    return allRows.slice(0, 2);
  }, [reboundData]);

  // Filtered Top 2 with Search query
  const displayedRows = useMemo(() => {
    if (!searchQuery.trim()) return top2DailyRows;
    const q = searchQuery.toLowerCase().trim();
    return top2DailyRows.filter(
      (r) =>
        r.ticker.toLowerCase().includes(q) ||
        (r.stockName && r.stockName.toLowerCase().includes(q)) ||
        r.setupDescription.toLowerCase().includes(q)
    );
  }, [top2DailyRows, searchQuery]);

  return (
    <TooltipProvider>
      <Card className="border-slate-200 shadow-sm bg-white overflow-hidden rounded-xl">
        {/* HEADER */}
        <CardHeader className="p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-amber-50 via-orange-50/40 to-transparent">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500 text-white shadow-sm shrink-0">
                  <Zap className="h-4.5 w-4.5 text-white fill-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                      Special Radars: 2 Saham Fast V-Rebound Pilihan Harian
                      <Badge variant="outline" className="border-amber-400 bg-amber-100/70 text-amber-900 text-[10px] font-extrabold">
                        Top 2 Terbaik
                      </Badge>
                    </CardTitle>
                  </div>
                  <CardDescription className="text-xs text-slate-600 flex flex-wrap items-center gap-1.5 pt-0.5">
                    <span className="text-amber-800 font-bold">⚡ Fast V-Rebound Super Asimetris</span>
                    <span>•</span>
                    <span className="text-slate-700 font-semibold">SOP: Antre Buy Limit Pagi di Harga Kemarin</span>
                    <span>•</span>
                    <span className="text-emerald-700 font-bold">SL -1.2% • BEP +0.5% • TP1 +9% • TP2 +20% (R:R 7.5 : 1)</span>
                    <span className="hidden sm:inline-block text-slate-300">|</span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-900 bg-emerald-100 border border-emerald-300 px-1.5 py-0.2 rounded">
                      🛡️ Min Rp 70 • Turnover &gt; Rp 500 Jt
                    </span>
                  </CardDescription>
                </div>
              </div>
            </div>

            {/* ACTION CONTROLS */}
            <div className="flex items-center gap-2 shrink-0">
              {/* SEARCH INPUT */}
              <div className="relative w-full sm:w-44">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <Input
                  placeholder="Cari Ticker..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-xs bg-white border-slate-300 text-slate-900 placeholder:text-slate-500 rounded-lg focus:border-amber-500"
                />
              </div>

              {/* REFRESH BUTTON */}
              <button
                type="button"
                onClick={handleRefreshAll}
                disabled={reboundLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                title="Scan ulang kandidat Fast V-Rebound"
              >
                <RefreshCw className={`h-3.5 w-3.5 text-amber-600 ${reboundLoading ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Scan Ulang</span>
              </button>
            </div>
          </div>
        </CardHeader>

        {/* CONTENT */}
        <CardContent className="p-0">
          {reboundLoading && displayedRows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <RefreshCw className="w-7 h-7 animate-spin text-amber-600 mb-2" />
              <p className="text-xs font-bold text-slate-800">Memindai 2 Saham Fast V-Rebound Terbaik...</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Menganalisis histori 250 hari bursa & volume serapan...</p>
            </div>
          ) : displayedRows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <ShieldCheck className="w-7 h-7 text-slate-400 mb-2" />
              <p className="text-xs font-bold text-slate-800">Tidak ada kandidat rebound yang memenuhi parameter hari ini.</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Market dalam fase koreksi sehat tanpa konfirmasi volume reversal.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="text-xs">
                <TableHeader className="bg-slate-100/80 border-b border-slate-200 text-[11px] text-slate-700 font-bold uppercase tracking-wider">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-12 text-center text-slate-700">Peringkat</TableHead>
                    <TableHead className="min-w-[170px] text-slate-700">Emiten & Pola Rebound</TableHead>
                    <TableHead className="text-right text-slate-700">Harga Terakhir</TableHead>
                    <TableHead className="text-center text-slate-700 min-w-[190px]">Rencana Entry & Stop Loss (-1.2%)</TableHead>
                    <TableHead className="text-center text-slate-700 min-w-[180px]">Target Profit (+9% & +20%)</TableHead>
                    <TableHead className="text-center text-slate-700">DNA 1 Tahun</TableHead>
                    <TableHead className="text-center text-slate-700">R:R</TableHead>
                    <TableHead className="text-center text-slate-700">Skor</TableHead>
                    <TableHead className="text-right pr-4 text-slate-700">Aksi</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody className="divide-y divide-slate-100">
                  {displayedRows.map((row) => (
                    <TableRow
                      key={row.id}
                      className="hover:bg-amber-50/40 transition-colors group"
                    >
                      {/* RANK */}
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center">
                          {row.rank === 1 ? (
                            <span className="flex items-center justify-center w-6 h-6 rounded-md bg-amber-200 text-amber-950 font-black text-xs border border-amber-400 shadow-2xs">
                              #1
                            </span>
                          ) : (
                            <span className="flex items-center justify-center w-6 h-6 rounded-md bg-sky-200 text-sky-950 font-black text-xs border border-sky-400 shadow-2xs">
                              #2
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* TICKER & SETUP */}
                      <TableCell>
                        <div className="flex items-start gap-2.5">
                          <TickerLogo ticker={row.ticker} size="sm" className="mt-0.5 shrink-0" />
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <Link
                                href={`/ticker/${row.ticker}`}
                                className="font-extrabold text-sm text-slate-900 hover:text-amber-700 transition flex items-center gap-1"
                              >
                                {row.ticker}
                                <ArrowUpRight className="w-3.5 h-3.5 text-amber-600 stroke-[2.5]" />
                              </Link>
                              <span className={`text-[9px] px-1.5 py-0.2 rounded font-extrabold border ${row.selectionBadgeColor}`}>
                                {row.selectionBadge}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-600 font-medium">
                              <span className="text-emerald-800 font-bold">{row.setupBadge}</span>
                              <span className="mx-1">•</span>
                              <span>{row.setupDescription}</span>
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* CURRENT PRICE */}
                      <TableCell className="text-right">
                        <div className="space-y-0.5">
                          <div className="font-mono font-bold text-xs text-slate-900">
                            Rp {row.currentPrice.toLocaleString("id-ID")}
                          </div>
                          <div className={`text-[10px] font-bold ${row.changePercent >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                            {row.changePercent >= 0 ? "+" : ""}{row.changePercent.toFixed(2)}%
                          </div>
                        </div>
                      </TableCell>

                      {/* ENTRY & STOP LOSS */}
                      <TableCell className="text-center">
                        <div className="inline-flex flex-col items-center bg-slate-50 border border-slate-200 rounded-lg p-1.5 min-w-[160px]">
                          <div className="flex items-center justify-between w-full text-[10px] font-semibold text-slate-700 pb-1 border-b border-slate-200">
                            <span className="text-slate-500">Entry Limit:</span>
                            <span className="font-mono text-emerald-800 font-extrabold">Rp {row.entryPrice.toLocaleString("id-ID")}</span>
                          </div>
                          <div className="flex items-center justify-between w-full text-[10px] font-semibold text-slate-700 pt-1">
                            <span className="text-rose-700 font-bold">Stop Loss:</span>
                            <span className="font-mono text-rose-700 font-extrabold">
                              Rp {row.stopLoss.price.toLocaleString("id-ID")}{" "}
                              <span className="text-[9px] text-rose-600 font-normal">(-{row.stopLoss.riskPercent}%)</span>
                            </span>
                          </div>
                          <div className="text-[9px] text-slate-500 mt-0.5">
                            BEP: <span className="font-mono text-slate-700 font-bold">Rp {row.bepPrice.toLocaleString("id-ID")}</span>
                          </div>
                        </div>
                      </TableCell>

                      {/* TARGETS */}
                      <TableCell className="text-center">
                        <div className="inline-flex flex-col items-center bg-slate-50 border border-slate-200 rounded-lg p-1.5 min-w-[160px]">
                          <div className="flex items-center justify-between w-full text-[10px] font-semibold pb-1 border-b border-slate-200">
                            <span className="text-sky-800 font-bold">TP 1 (+9%):</span>
                            <span className="font-mono text-sky-900 font-extrabold">Rp {row.target1.price.toLocaleString("id-ID")}</span>
                          </div>
                          <div className="flex items-center justify-between w-full text-[10px] font-semibold pt-1">
                            <span className="text-amber-800 font-bold">TP 2 (+20%):</span>
                            <span className="font-mono text-amber-900 font-extrabold">Rp {row.target2.price.toLocaleString("id-ID")}</span>
                          </div>
                        </div>
                      </TableCell>

                      {/* 1-YEAR DNA */}
                      <TableCell className="text-center">
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                            <Sparkles className="w-3 h-3 text-emerald-700 shrink-0" />
                            {row.trackRecordCount}x Rebound
                          </span>
                          <div className="text-[9px] text-slate-600 font-medium">
                            Avg +{row.avgHistoricalGain.toFixed(1)}%
                          </div>
                        </div>
                      </TableCell>

                      {/* R:R */}
                      <TableCell className="text-center">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          {row.riskRewardRatio} : 1
                        </span>
                      </TableCell>

                      {/* SCORE */}
                      <TableCell className="text-center">
                        <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-100 border border-amber-400 text-amber-950 font-black text-xs shadow-2xs">
                          {row.score}
                        </div>
                      </TableCell>

                      {/* ACTIONS */}
                      <TableCell className="text-right pr-4">
                        <Link
                          href={`/ticker/${row.ticker}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs shadow-xs transition cursor-pointer"
                        >
                          <span>Eksekusi</span>
                          <ArrowUpRight className="w-3.5 h-3.5 text-slate-950 stroke-[2.5]" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
