"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  RefreshCw,
  Zap,
  TrendingUp,
  Flame,
  ArrowUpRight,
  ShieldCheck,
  Target,
  Sparkles,
  Activity
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import useFetch from "@/hooks/useFetch";
import TickerLogo from "@/components/ui/TickerLogo";

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

export default function SuperSwingScreenerCard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [bypassTrigger, setBypassTrigger] = useState(0);

  // Fetch live candidates across all stocks
  const {
    data: screenerData,
    loading: screenerLoading,
    refetch: refetchScreener
  } = useFetch<any>(
    `/api/strategies/super-swing?universe=ALL${bypassTrigger > 0 ? `&t=${bypassTrigger}` : ""}`
  );

  const handleRefresh = () => {
    setBypassTrigger(Date.now());
    refetchScreener();
  };

  // Top 2 candidates only (Best Quality Golden Cross Ignition)
  const top2Candidates: ISuperSwingCandidate[] = useMemo(() => {
    const rawList: ISuperSwingCandidate[] = screenerData?.data?.candidates || screenerData?.candidates || [];
    return rawList.slice(0, 2);
  }, [screenerData]);

  // Filtered with search
  const displayedCandidates = useMemo(() => {
    if (!searchQuery.trim()) return top2Candidates;
    const q = searchQuery.toLowerCase().trim();
    return top2Candidates.filter(
      (c) =>
        c.ticker.toLowerCase().includes(q) ||
        (c.stockName && c.stockName.toLowerCase().includes(q)) ||
        c.setupDescription.toLowerCase().includes(q)
    );
  }, [top2Candidates, searchQuery]);

  return (
    <Card className="border-slate-200 shadow-sm bg-white overflow-hidden rounded-xl">
      {/* HEADER SECTION */}
      <CardHeader className="p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-violet-50 via-fuchsia-50/40 to-transparent">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-violet-600 text-white shadow-sm shrink-0">
                <Flame className="h-4.5 w-4.5 text-white fill-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                    Radar Golden Cross Ignition: 2 Saham Pilihan Harian (Swing 50%+)
                    <Badge variant="outline" className="border-violet-300 bg-violet-100/70 text-violet-900 text-[10px] font-extrabold">
                      Top 2 Terbaik
                    </Badge>
                  </CardTitle>
                </div>
                <CardDescription className="text-xs text-slate-600 flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="text-violet-800 font-bold">🚀 Early Crossing MA20 x MA50 + Candle Hijau Solid</span>
                  <span>•</span>
                  <span className="text-slate-700 font-semibold">SOP: HAKA Besok Pagi di Open</span>
                  <span>•</span>
                  <span className="text-emerald-700 font-bold">SL -4.5% • TP1 +12% • TP2 +25% • TP3 +50%+ Moonshot</span>
                  <span className="hidden sm:inline-block text-slate-300">|</span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-violet-900 bg-violet-100 border border-violet-300 px-1.5 py-0.2 rounded">
                    🛡️ Shadow ≤ 18% • Close ≥ VWAP • Volume ≥ 2.0x
                  </span>
                </CardDescription>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* SEARCH INPUT */}
            <div className="relative w-full sm:w-44">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <Input
                placeholder="Cari Ticker..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs bg-white border-slate-300 text-slate-900 placeholder:text-slate-500 rounded-lg focus:border-violet-500"
              />
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={screenerLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
              title="Scan ulang sinyal Golden Cross"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-violet-600 ${screenerLoading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Scan Ulang</span>
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {screenerLoading && displayedCandidates.length === 0 ? (
          <div className="py-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-7 h-7 animate-spin text-violet-600 mb-2" />
            <p className="text-xs font-bold text-slate-800">Memindai 2 Saham Golden Cross Ignition Terbaik...</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Memvalidasi akumulasi bandar, volume ledakan & crossing MA20 x MA50...</p>
          </div>
        ) : displayedCandidates.length === 0 ? (
          <div className="py-12 text-center text-slate-500 flex flex-col items-center justify-center">
            <ShieldCheck className="w-7 h-7 text-slate-400 mb-2" />
            <p className="text-xs font-bold text-slate-800">Tidak ada sinyal Golden Cross Ignition yang memenuhi kriteria hari ini.</p>
            <p className="text-[11px] text-slate-500 mt-0.5 max-w-md">
              Sistem menyaring false breakout secara ketat (menghindari candle jarum suntik dan volume palsu).
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="text-xs">
              <TableHeader className="bg-slate-100/80 border-b border-slate-200 text-[11px] text-slate-700 font-bold uppercase tracking-wider">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-12 text-center text-slate-700">Peringkat</TableHead>
                  <TableHead className="min-w-[170px] text-slate-700">Saham & Setup Golden Cross</TableHead>
                  <TableHead className="text-right text-slate-700">Harga Terakhir</TableHead>
                  <TableHead className="text-center text-slate-700 min-w-[190px]">Rencana Entry (HAKA Open) & SL (-4.5%)</TableHead>
                  <TableHead className="text-center text-slate-700 min-w-[190px]">Target Swing (TP1 +12% / TP2 +25%)</TableHead>
                  <TableHead className="text-center text-slate-700 min-w-[130px]">Super Target (+50%+)</TableHead>
                  <TableHead className="text-center text-slate-700">Bandarmologi & Vol</TableHead>
                  <TableHead className="text-center text-slate-700">Score</TableHead>
                  <TableHead className="text-right pr-4 text-slate-700">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-slate-100">
                {displayedCandidates.map((c, idx) => (
                  <TableRow
                    key={c.ticker}
                    className="hover:bg-violet-50/40 transition-colors group"
                  >
                    {/* RANK */}
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center">
                        {idx === 0 ? (
                          <span className="flex items-center justify-center w-6 h-6 rounded-md bg-violet-200 text-violet-950 font-black text-xs border border-violet-400 shadow-2xs">
                            #1
                          </span>
                        ) : (
                          <span className="flex items-center justify-center w-6 h-6 rounded-md bg-fuchsia-200 text-fuchsia-950 font-black text-xs border border-fuchsia-400 shadow-2xs">
                            #2
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* Ticker & Name */}
                    <TableCell>
                      <div className="flex items-start gap-2.5">
                        <TickerLogo ticker={c.ticker} size="sm" className="mt-0.5 shrink-0" />
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Link
                              href={`/ticker/${c.ticker}`}
                              className="font-extrabold text-sm text-slate-900 hover:text-violet-700 transition flex items-center gap-1"
                            >
                              {c.ticker}
                              <ArrowUpRight className="w-3.5 h-3.5 text-violet-600 stroke-[2.5]" />
                            </Link>
                            <span className="text-[9px] px-1.5 py-0.2 rounded font-extrabold border border-violet-300 bg-violet-100 text-violet-900">
                              {idx === 0 ? "🔥 Juara #1 Golden Cross" : "⚡ Runner-Up #2 Golden Cross"}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-600 font-medium">
                            <span className="text-emerald-800 font-bold">{c.setupTitle}</span>
                            <span className="mx-1">•</span>
                            <span>{c.setupDescription}</span>
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Current Price */}
                    <TableCell className="text-right">
                      <div className="space-y-0.5">
                        <div className="font-mono font-bold text-xs text-slate-900">
                          Rp {c.currentPrice.toLocaleString("id-ID")}
                        </div>
                        <div className={`text-[10px] font-bold ${c.changePercent >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                          {c.changePercent >= 0 ? "+" : ""}{c.changePercent.toFixed(2)}%
                        </div>
                      </div>
                    </TableCell>

                    {/* Entry Plan & SL */}
                    <TableCell className="text-center">
                      <div className="inline-flex flex-col items-center bg-slate-50 border border-slate-200 rounded-lg p-1.5 min-w-[160px]">
                        <div className="flex items-center justify-between w-full text-[10px] font-semibold text-slate-700 pb-1 border-b border-slate-200">
                          <span className="text-slate-500">Entry (HAKA Open):</span>
                          <span className="font-mono text-emerald-800 font-extrabold">Rp {c.entryPrice.toLocaleString("id-ID")}</span>
                        </div>
                        <div className="flex items-center justify-between w-full text-[10px] font-semibold text-slate-700 pt-1">
                          <span className="text-rose-700 font-bold">Stop Loss:</span>
                          <span className="font-mono text-rose-700 font-extrabold">
                            Rp {c.stopLossPrice.toLocaleString("id-ID")}{" "}
                            <span className="text-[9px] text-rose-600 font-normal">({c.stopLossRiskPercent}%)</span>
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Targets */}
                    <TableCell className="text-center">
                      <div className="inline-flex flex-col items-center bg-slate-50 border border-slate-200 rounded-lg p-1.5 min-w-[160px]">
                        <div className="flex items-center justify-between w-full text-[10px] font-semibold pb-1 border-b border-slate-200">
                          <span className="text-sky-800 font-bold">TP 1 (+12%):</span>
                          <span className="font-mono text-sky-900 font-extrabold">Rp {c.target1Price.toLocaleString("id-ID")}</span>
                        </div>
                        <div className="flex items-center justify-between w-full text-[10px] font-semibold pt-1">
                          <span className="text-amber-800 font-bold">TP 2 (+25%):</span>
                          <span className="font-mono text-amber-900 font-extrabold">Rp {c.target2Price.toLocaleString("id-ID")}</span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Super Target (+50%+) */}
                    <TableCell className="text-center">
                      <div className="inline-flex flex-col items-center justify-center p-1.5 rounded-lg bg-gradient-to-r from-fuchsia-50 to-violet-50 border border-fuchsia-300 shadow-2xs">
                        <span className="text-[9px] font-bold text-fuchsia-900 uppercase tracking-wider flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-fuchsia-700 shrink-0" />
                          Multi-Bagger
                        </span>
                        <div className="font-mono font-black text-xs text-fuchsia-950 mt-0.5">
                          Rp {c.target3Price.toLocaleString("id-ID")}
                        </div>
                        <span className="text-[9px] font-extrabold text-emerald-700">+{c.target3GainPercent}%</span>
                      </div>
                    </TableCell>

                    {/* Bandarmologi & Volume */}
                    <TableCell className="text-center">
                      <div className="space-y-1 text-[10px]">
                        <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-bold bg-violet-100 text-violet-900 border border-violet-300">
                          <Activity className="w-3 h-3 text-violet-700 shrink-0" />
                          Vol: {c.volumeRatio.toFixed(1)}x MA20
                        </div>
                        <div className="text-[9px] text-slate-600 font-medium">
                          VWAP: Rp {c.vwap?.toLocaleString("id-ID") || "-"} ({(c.closeVsVwapPercent || 0) >= 0 ? "+" : ""}{c.closeVsVwapPercent}%)
                        </div>
                      </div>
                    </TableCell>

                    {/* Score */}
                    <TableCell className="text-center">
                      <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-violet-100 border border-violet-400 text-violet-950 font-black text-xs shadow-2xs">
                        {c.score}
                      </div>
                    </TableCell>

                    {/* Action */}
                    <TableCell className="text-right pr-4">
                      <Link
                        href={`/ticker/${c.ticker}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-extrabold text-xs shadow-xs transition cursor-pointer"
                      >
                        <span>Eksekusi</span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-white stroke-[2.5]" />
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
  );
}
