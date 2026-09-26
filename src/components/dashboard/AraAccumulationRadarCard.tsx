"use client";

import React, { useState, useMemo } from "react";
import {
  Flame,
  Search,
  RefreshCw,
  HelpCircle,
  Sparkles,
  Zap,
  Target,
  ShieldAlert,
  ArrowUpRight,
  Filter,
  Layers,
  History
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import useFetch from "@/hooks/useFetch";
import TickerDetailDialog from "./TickerDetailDialog";
import { formatRupiah } from "@/lib/utils";

export interface AraAccumulationCandidate {
  ticker: string;
  stockName?: string;
  currentPrice: number;
  openPrice: number;
  highPrice: number;
  lowPrice: number;
  changePercent: number;
  turnoverRupiah: number;
  volume: number;

  araCount1Year: number;
  lastAraDate: string;
  lastAraGainPercent: number;
  lastAraPeakPrice: number;

  drawdownFromAraPeak: number;
  volumeDryUpPercent: number;
  baseTightnessPercent: number;
  isVolumeDryingUp: boolean;
  smartMoneyInflowRupiah: number;
  bandarAvgEstimated: number;

  breakoutTriggerPrice: number;
  targetPrice1: number;
  targetAraPrice: number;
  targetAraGainPercent: number;
  stopLossPrice: number;
  stopLossRiskPercent: number;
  riskRewardRatio: number;

  score: number;
  phaseBadge: "AKUMULASI_MATANG" | "RE_ACCUMULATION_BASE" | "PULLBACK_SUPPORT";
  phaseDescription: string;
  catalystSummary: string;
  scannedAt: string;
}

export type PhaseFilter = "ALL" | "MATANG" | "BASE" | "PULLBACK";

export default function AraAccumulationRadarCard() {
  const [activeFilter, setActiveFilter] = useState<PhaseFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [bypassCacheTrigger, setBypassCacheTrigger] = useState(0);

  const { data, loading, refetch } = useFetch(
    `/api/strategies/ara-accumulation?limit=5${bypassCacheTrigger > 0 ? `&refresh=true&t=${bypassCacheTrigger}` : ""}`
  );

  const grouped = useMemo(() => {
    return {
      all: (data?.grouped?.all || data?.candidates || []) as AraAccumulationCandidate[],
      matang: (data?.grouped?.matang || []) as AraAccumulationCandidate[],
      base: (data?.grouped?.base || []) as AraAccumulationCandidate[],
      pullback: (data?.grouped?.pullback || []) as AraAccumulationCandidate[],
    };
  }, [data]);

  const activePhaseList = useMemo(() => {
    if (activeFilter === "MATANG") return grouped.matang;
    if (activeFilter === "BASE") return grouped.base;
    if (activeFilter === "PULLBACK") return grouped.pullback;
    return grouped.all;
  }, [grouped, activeFilter]);

  const filteredCandidates = useMemo(() => {
    let list = activePhaseList;

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toUpperCase();
      list = list.filter((i) => i.ticker.includes(q) || (i.stockName && i.stockName.toUpperCase().includes(q)));
    }

    return list.slice(0, 5);
  }, [activePhaseList, searchQuery]);

  const handleRefresh = () => {
    setBypassCacheTrigger(Date.now());
  };

  return (
    <TooltipProvider delayDuration={150}>
      <Card className="border-slate-200 shadow-sm bg-white overflow-hidden flex flex-col h-full">
        {/* HEADER */}
        <CardHeader className="border-b border-slate-100 bg-linear-to-r from-amber-500/10 via-rose-500/5 to-transparent pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-linear-to-br from-amber-500 to-rose-600 text-white shadow-2xs">
                  <Flame className="h-4 w-4 fill-white" />
                </div>
                <CardTitle className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                  Radar Calon ARA (Fase Akumulasi 1 Tahun)
                </CardTitle>
                <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800 text-[10px] font-bold">
                  <History className="h-3 w-3 mr-1 text-amber-600" />
                  Cached 1-Year DNA (250 Hari)
                </Badge>
              </div>
              <CardDescription className="text-xs text-slate-500">
                Deteksi saham mantan ARA setahun terakhir yang sedang dalam fase pengeringan volume & re-akumulasi modal bandar.
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
                <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${loading ? "animate-spin text-amber-600" : ""}`} />
                <span>Scan Ulang</span>
              </button>
            </div>
          </div>

          {/* FILTER & SEARCH */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2">
            {/* TABS - MASING-MASING 10 DATA */}
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-medium overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveFilter("ALL")}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all shrink-0 ${
                  activeFilter === "ALL"
                    ? "bg-white text-slate-900 shadow-2xs border border-slate-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Top 5 ({grouped.all.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter("MATANG")}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all shrink-0 ${
                  activeFilter === "MATANG"
                    ? "bg-amber-600 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Akumulasi Matang 🔥 ({grouped.matang.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter("BASE")}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all shrink-0 ${
                  activeFilter === "BASE"
                    ? "bg-indigo-600 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Base Konsolidasi ({grouped.base.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter("PULLBACK")}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all shrink-0 ${
                  activeFilter === "PULLBACK"
                    ? "bg-emerald-600 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Pullback Support ({grouped.pullback.length})
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
                  <TableHead className="w-[140px] pl-4">Emiten & Fase</TableHead>
                  <TableHead className="text-right">Harga Terakhir</TableHead>
                  <TableHead className="text-center">DNA ARA (1 Thn)</TableHead>
                  <TableHead className="text-center">Kering Volume</TableHead>
                  <TableHead className="text-right">Trigger & Target ARA</TableHead>
                  <TableHead className="text-right pr-4">Stop Loss (R:R)</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading && filteredCandidates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-44 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="h-6 w-6 animate-spin text-amber-500" />
                        <span className="text-xs font-medium">Menganalisis 1 tahun siklus ARA & volume akumulasi...</span>
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

                    let badgeColor = "bg-amber-50 text-amber-700 border-amber-200";
                    let badgeLabel = "Akumulasi Matang";
                    if (c.phaseBadge === "PULLBACK_SUPPORT") {
                      badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-200";
                      badgeLabel = "Pullback Support";
                    } else if (c.phaseBadge === "RE_ACCUMULATION_BASE") {
                      badgeColor = "bg-indigo-50 text-indigo-700 border-indigo-200";
                      badgeLabel = "Re-Akumulasi Base";
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

                        {/* DNA ARA 1 TAHUN */}
                        <TableCell className="text-center py-2.5">
                          <div className="inline-flex items-center gap-1 font-bold text-xs text-amber-700 bg-amber-50/80 px-2 py-0.5 rounded-md border border-amber-200">
                            <Flame className="h-3 w-3 fill-amber-500 text-amber-500" />
                            <span>{c.araCount1Year}x ARA</span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Last: {c.lastAraDate} (+{c.lastAraGainPercent.toFixed(0)}%)
                          </div>
                        </TableCell>

                        {/* KERING VOLUME */}
                        <TableCell className="text-center py-2.5">
                          <div className="font-extrabold text-xs text-emerald-600">
                            {c.volumeDryUpPercent.toFixed(1)}% Kering
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Base: {c.baseTightnessPercent.toFixed(1)}%
                          </div>
                        </TableCell>

                        {/* TRIGGER & TARGET */}
                        <TableCell className="text-right py-2.5 font-mono">
                          <div className="text-xs text-slate-600 font-semibold">
                            Trigger: <span className="font-bold text-slate-900">Rp {c.breakoutTriggerPrice}</span>
                          </div>
                          <div className="text-xs font-extrabold text-emerald-600 flex items-center justify-end gap-1">
                            <Target className="h-3 w-3" />
                            <span>Rp {c.targetAraPrice.toLocaleString("id-ID")} (+{c.targetAraGainPercent}%)</span>
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
              <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              <span>
                <strong>Logika Radar ARA</strong>: Memindai rekam jejak ARA setahun terakhir saat volume mengering 80-99% di base support sebelum lonjakan berikutnya.
              </span>
            </div>
            <div className="text-[10px] text-slate-400">
              Total {filteredCandidates.length} emiten lolos filter
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
