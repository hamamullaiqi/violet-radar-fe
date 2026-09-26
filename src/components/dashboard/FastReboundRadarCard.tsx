"use client";

import React, { useState, useMemo } from "react";
import {
  TrendingUp,
  Search,
  RefreshCw,
  Sparkles,
  Zap,
  Target,
  ShieldAlert,
  ArrowUpRight,
  Filter,
  History,
  Activity,
  ArrowDownCircle,
  CheckCircle2
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import useFetch from "@/hooks/useFetch";
import TickerDetailDialog from "./TickerDetailDialog";

export interface FastReboundCandidate {
  ticker: string;
  stockName?: string;
  currentPrice: number;
  openPrice: number;
  highPrice: number;
  lowPrice: number;
  changePercent: number;
  turnoverRupiah: number;
  volume: number;

  reboundTrackRecordCount1Year: number;
  avgHistoricalReboundGainPercent: number;
  avgHistoricalReboundDays: number;
  lastReboundDate?: string;
  lastReboundGainPercent?: number;

  currentDrawdownFromHighPercent: number;
  consecutiveDropDays: number;
  isBottomReversalCandle: boolean;
  candleReversalPattern: string;
  rsi14: number;
  isRsiOversold: boolean;

  smartMoneyInflowRupiah: number;
  volumeAbsorptionRatio: number;

  entryPrice: number;
  stopLossPrice: number;
  stopLossRiskPercent: number;
  targetReboundQuick: number;
  targetReboundQuickGainPercent: number;
  targetVPeak: number;
  targetVPeakGainPercent: number;
  riskRewardRatio: number;

  score: number;
  reboundBadge: "V_SHAPE_BOTTOM_REVERSAL" | "OVERSOLD_BOUNCE_SETUP" | "SUPPORT_REJECTION_HAMMER";
  phaseDescription: string;
  catalystSummary: string;
  scannedAt: string;
}

export type ReboundFilter = "ALL" | "HAMMER" | "OVERSOLD" | "V_SHAPE";

export default function FastReboundRadarCard() {
  const [activeFilter, setActiveFilter] = useState<ReboundFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [bypassCacheTrigger, setBypassCacheTrigger] = useState(0);

  const { data, loading, refetch } = useFetch(
    `/api/strategies/fast-rebound?limit=10${bypassCacheTrigger > 0 ? `&refresh=true&t=${bypassCacheTrigger}` : ""}`
  );

  const candidates: FastReboundCandidate[] = useMemo(() => {
    if (!data?.candidates) return [];
    return data.candidates.slice(0, 10);
  }, [data]);

  const filteredCandidates = useMemo(() => {
    let list = candidates;

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toUpperCase();
      list = list.filter((i) => i.ticker.includes(q) || (i.stockName && i.stockName.toUpperCase().includes(q)));
    }

    if (activeFilter === "HAMMER") {
      list = list.filter((i) => i.reboundBadge === "SUPPORT_REJECTION_HAMMER" || i.candleReversalPattern.includes("Hammer"));
    } else if (activeFilter === "OVERSOLD") {
      list = list.filter((i) => i.reboundBadge === "OVERSOLD_BOUNCE_SETUP" || i.isRsiOversold);
    } else if (activeFilter === "V_SHAPE") {
      list = list.filter((i) => i.reboundBadge === "V_SHAPE_BOTTOM_REVERSAL");
    }

    return list.slice(0, 10);
  }, [candidates, searchQuery, activeFilter]);

  const handleRefresh = () => {
    setBypassCacheTrigger(Date.now());
  };

  return (
    <TooltipProvider delayDuration={150}>
      <Card className="border-slate-200 shadow-sm bg-white overflow-hidden flex flex-col h-full">
        {/* HEADER */}
        <CardHeader className="border-b border-slate-100 bg-linear-to-r from-emerald-500/10 via-teal-500/5 to-transparent pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-linear-to-br from-emerald-500 to-teal-600 text-white shadow-2xs">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <CardTitle className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                  Radar Fast V-Rebound Tracker (1 Tahun)
                </CardTitle>
                <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-800 text-[10px] font-bold">
                  <Activity className="h-3 w-3 mr-1 text-emerald-600" />
                  Koreksi Dalam & Rebound Cepat
                </Badge>
              </div>
              <CardDescription className="text-xs text-slate-500">
                Mencari saham dengan histori rebound cepat (+15% s/d +35%) pasca koreksi dalam yang saat ini berada di bottom reversal.
              </CardDescription>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${loading ? "animate-spin text-emerald-600" : ""}`} />
                <span>Scan Ulang</span>
              </button>
            </div>
          </div>

          {/* FILTER & SEARCH */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2">
            {/* TABS */}
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-medium">
              <button
                type="button"
                onClick={() => setActiveFilter("ALL")}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                  activeFilter === "ALL"
                    ? "bg-white text-slate-900 shadow-2xs border border-slate-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Semua ({candidates.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter("HAMMER")}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                  activeFilter === "HAMMER"
                    ? "bg-emerald-600 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Hammer / Rejection ⚡
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter("OVERSOLD")}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                  activeFilter === "OVERSOLD"
                    ? "bg-indigo-600 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                RSI Oversold
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter("V_SHAPE")}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                  activeFilter === "V_SHAPE"
                    ? "bg-teal-600 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                V-Shape Base
              </button>
            </div>

            {/* SEARCH */}
            <div className="relative w-full sm:w-48">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input
                type="text"
                placeholder="Cari Ticker..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 text-xs bg-white border-slate-200"
              />
            </div>
          </div>
        </CardHeader>

        {/* CONTENT */}
        <CardContent className="p-0 flex-1 flex flex-col justify-between">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80 hover:bg-slate-50/80 border-b border-slate-100 text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
                  <TableHead className="w-[140px] pl-4">Emiten & Pola Rebound</TableHead>
                  <TableHead className="text-right">Harga Terakhir</TableHead>
                  <TableHead className="text-center">Track Record 1 Thn</TableHead>
                  <TableHead className="text-center">Drawdown / RSI</TableHead>
                  <TableHead className="text-right">Target Quick / V-Peak</TableHead>
                  <TableHead className="text-right pr-4">Stop Loss (R:R)</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading && candidates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-44 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="h-6 w-6 animate-spin text-emerald-500" />
                        <span className="text-xs font-medium">Menganalisis 1 tahun siklus V-Rebound & sinyal bottom...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredCandidates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-44 text-center text-slate-400 text-xs">
                      Tidak ada emiten yang memenuhi kriteria filter saat ini.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCandidates.map((c) => {
                    const isGreen = c.changePercent > 0;
                    const isRed = c.changePercent < 0;

                    let badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-200";
                    let badgeLabel = "Hammer Rejection";
                    if (c.reboundBadge === "OVERSOLD_BOUNCE_SETUP") {
                      badgeColor = "bg-indigo-50 text-indigo-700 border-indigo-200";
                      badgeLabel = "Oversold Bounce";
                    } else if (c.reboundBadge === "V_SHAPE_BOTTOM_REVERSAL") {
                      badgeColor = "bg-teal-50 text-teal-700 border-teal-200";
                      badgeLabel = "V-Shape Reversal";
                    }

                    return (
                      <TableRow key={c.ticker} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100">
                        {/* EMITEN */}
                        <TableCell className="pl-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <TickerDetailDialog ticker={c.ticker} />
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${badgeColor}`}>
                              {badgeLabel}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 truncate max-w-[200px] mt-0.5">
                            {c.phaseDescription}
                          </div>
                        </TableCell>

                        {/* HARGA */}
                        <TableCell className="text-right py-2.5 font-mono">
                          <div className="font-extrabold text-sm text-slate-900">
                            Rp {c.currentPrice.toLocaleString("id-ID")}
                          </div>
                          <div className={`text-xs font-bold ${isGreen ? "text-emerald-600" : isRed ? "text-rose-600" : "text-slate-500"}`}>
                            {isGreen ? "+" : ""}{c.changePercent.toFixed(2)}%
                          </div>
                        </TableCell>

                        {/* REKAM JEJAK 1 TAHUN */}
                        <TableCell className="text-center py-2.5">
                          <div className="inline-flex items-center gap-1 font-bold text-xs text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            <Zap className="h-3 w-3 fill-emerald-500 text-emerald-500" />
                            <span>{c.reboundTrackRecordCount1Year}x V-Rebound</span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5 font-medium">
                            Rata-rata +{c.avgHistoricalReboundGainPercent}% ({c.avgHistoricalReboundDays} hari)
                          </div>
                        </TableCell>

                        {/* DRAWDOWN & RSI */}
                        <TableCell className="text-center py-2.5 font-mono">
                          <div className="font-extrabold text-xs text-rose-600">
                            Diskon -{c.currentDrawdownFromHighPercent}%
                          </div>
                          <div className={`text-[10px] font-semibold mt-0.5 ${c.isRsiOversold ? "text-indigo-600 font-bold" : "text-slate-400"}`}>
                            RSI: {c.rsi14} {c.isRsiOversold ? "(Jenuh Jual)" : ""}
                          </div>
                        </TableCell>

                        {/* TARGET REBOUND */}
                        <TableCell className="text-right py-2.5 font-mono">
                          <div className="text-xs font-bold text-emerald-600 flex items-center justify-end gap-1">
                            <Target className="h-3 w-3" />
                            <span>Rp {c.targetReboundQuick} (+{c.targetReboundQuickGainPercent}%)</span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Peak: Rp {c.targetVPeak} (+{c.targetVPeakGainPercent}%)
                          </div>
                        </TableCell>

                        {/* STOP LOSS */}
                        <TableCell className="text-right pr-4 py-2.5 font-mono">
                          <div className="text-xs font-bold text-rose-600">
                            Rp {c.stopLossPrice} ({c.stopLossRiskPercent}%)
                          </div>
                          <div className="text-[10px] font-bold text-slate-500">
                            R:R {c.riskRewardRatio}:1
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* FOOTER */}
          <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              <span>
                <strong>Logika Fast V-Rebound</strong>: Menganalisis kecepatan pantulan historis 1 tahun pasca drop dalam dan mendeteksi titik swing reversal saat ini.
              </span>
            </div>
            <div className="text-[10px] text-slate-400">
              Total {candidates.length} emiten lolos filter
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
