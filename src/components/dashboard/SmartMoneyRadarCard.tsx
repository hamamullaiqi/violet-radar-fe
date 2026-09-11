"use client";

import React, { useState, useMemo } from "react";
import {
  ShieldCheck,
  Search,
  RefreshCw,
  HelpCircle,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  Filter
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import useFetch from "@/hooks/useFetch";
import TickerDetailDialog from "./TickerDetailDialog";
import { formatRupiah } from "@/lib/utils";

export type FilterCategory = "ALL" | "SAFE" | "DISCOUNT" | "OVERBOUGHT";

export default function SmartMoneyRadarCard() {
  const [period, setPeriod] = useState<"1W" | "1M" | "3M">("1M");
  const [activeFilter, setActiveFilter] = useState<FilterCategory>("SAFE");
  const [searchQuery, setSearchQuery] = useState("");

  const { data, loading, refetch } = useFetch(
    `/api/market/smart-money-radar?period=${period}&limit=60`
  );

  const items = useMemo(() => {
    if (!data?.items) return [];
    let list = data.items;

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toUpperCase();
      list = list.filter((i: any) => i.ticker.includes(q) || (i.stockName && i.stockName.toUpperCase().includes(q)));
    }

    // Category filter
    if (activeFilter === "SAFE") {
      list = list.filter((i: any) => i.entryRecommendation.status === "SAFE_ENTRY" || i.entryRecommendation.status === "DISCOUNT_BUY");
    } else if (activeFilter === "DISCOUNT") {
      list = list.filter((i: any) => i.entryRecommendation.status === "DISCOUNT_BUY");
    } else if (activeFilter === "OVERBOUGHT") {
      list = list.filter((i: any) => i.entryRecommendation.status === "WATCH_PULLBACK" || i.entryRecommendation.status === "OVERBOUGHT" || i.entryRecommendation.status === "DISTRIBUTION");
    }

    return list;
  }, [data, searchQuery, activeFilter]);

  const stats = useMemo(() => {
    if (!data?.items) return { safeCount: 0, discountCount: 0, totalCount: 0 };
    const all = data.items;
    return {
      safeCount: all.filter((i: any) => i.entryRecommendation.status === "SAFE_ENTRY" || i.entryRecommendation.status === "DISCOUNT_BUY").length,
      discountCount: all.filter((i: any) => i.entryRecommendation.status === "DISCOUNT_BUY").length,
      totalCount: all.length
    };
  }, [data]);

  return (
    <TooltipProvider delayDuration={150}>
      <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
        {/* HEADER */}
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-600 text-white shadow-2xs">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <CardTitle className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                  Bandar Cost & Safe Entry Radar
                </CardTitle>
                <Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-indigo-700 text-[10px] font-bold">
                  Arus Smart Money Riil (IDX Flow)
                </Badge>
              </div>
              <CardDescription className="text-xs text-slate-500">
                Deteksi modal rata-rata bandar/asing 1 bulan terakhir & rekomendasi aman masuk (Anti-Cuci Piring).
              </CardDescription>
            </div>

            {/* CONTROLS */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* PERIOD SELECTOR */}
              <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-bold">
                {(["1W", "1M", "3M"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPeriod(p)}
                    className={`px-2 py-1 rounded-md transition-all text-xs ${
                      period === p
                        ? "bg-white text-indigo-700 shadow-2xs font-extrabold"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {p === "1W" ? "1 Minggu" : p === "1M" ? "1 Bulan" : "3 Bulan"}
                  </button>
                ))}
              </div>

              {/* REFRESH */}
              <button
                type="button"
                onClick={() => refetch()}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors shadow-2xs"
                title="Refresh Data"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-indigo-600" : ""}`} />
              </button>
            </div>
          </div>

          {/* FILTER PILLS & SEARCH */}
          <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-200/60">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              <button
                type="button"
                onClick={() => setActiveFilter("SAFE")}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
                  activeFilter === "SAFE"
                    ? "bg-emerald-600 text-white shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <CheckCircle2 className="h-3 w-3" />
                <span>Aman Masuk</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">
                  {stats.safeCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveFilter("DISCOUNT")}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
                  activeFilter === "DISCOUNT"
                    ? "bg-emerald-700 text-white shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <Sparkles className="h-3 w-3" />
                <span>Sedang Diskon</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">
                  {stats.discountCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveFilter("OVERBOUGHT")}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
                  activeFilter === "OVERBOUGHT"
                    ? "bg-rose-600 text-white shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <AlertTriangle className="h-3 w-3" />
                <span>Waspada / Kemahalan</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveFilter("ALL")}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
                  activeFilter === "ALL"
                    ? "bg-slate-800 text-white shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <span>Semua</span>
              </button>
            </div>

            {/* SEARCH */}
            <div className="relative w-full sm:w-52">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <Input
                placeholder="Cari ticker / emiten..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 text-xs h-8 bg-white border-slate-200 focus-visible:ring-indigo-600"
              />
            </div>
          </div>
        </CardHeader>

        {/* TABLE */}
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="text-xs w-full whitespace-nowrap">
              <TableHeader className="bg-slate-50/80">
                <TableRow className="border-slate-200 text-slate-500 font-bold">
                  <TableHead className="py-2.5 px-3">Ticker</TableHead>
                  <TableHead className="text-right py-2.5 px-3">Harga Sekarang</TableHead>
                  <TableHead className="text-right py-2.5 px-3">
                    <div className="inline-flex items-center gap-1 justify-end">
                      <span>Modal Bandar ({period})</span>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-3 w-3 text-slate-400" />
                        </TooltipTrigger>
                        <TooltipContent className="text-xs max-w-xs p-2">
                          Harga rata-rata tertimbang (VWAP) pembelian institusi / asing selama periode {period}.
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </TableHead>
                  <TableHead className="text-right py-2.5 px-3">Jarak ke Modal</TableHead>
                  <TableHead className="text-right py-2.5 px-3">Akumulasi Bersih</TableHead>
                  <TableHead className="py-2.5 px-3">Dominasi Smart Money</TableHead>
                  <TableHead className="py-2.5 px-3">Rekomendasi Masuk</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-400">
                      <RefreshCw className="h-5 w-5 animate-spin mx-auto text-indigo-500 mb-2" />
                      Menganalisis modal Smart Money & posisi harga...
                    </TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-400">
                      Tidak ada saham yang sesuai dengan filter saat ini.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item: any) => {
                    const dist = Number(item.distancePercent || 0);
                    const netLot = Number(item.totalForeignNetLot || 0);
                    const netRp = Number(item.totalForeignNetRupiah || 0);
                    const isDiscount = dist < -1.5;
                    const isSafe = dist >= -1.5 && dist <= 3.5;

                    return (
                      <TableRow key={item.ticker} className="border-slate-100 hover:bg-slate-50/80 transition-colors">
                        {/* TICKER */}
                        <TableCell className="py-2.5 px-3">
                          <div className="flex flex-col">
                            <TickerDetailDialog ticker={item.ticker} />
                            {item.stockName && item.stockName !== item.ticker && (
                              <span className="text-[10px] text-slate-400 truncate max-w-[140px]" title={item.stockName}>
                                {item.stockName}
                              </span>
                            )}
                          </div>
                        </TableCell>

                        {/* HARGA SEKARANG */}
                        <TableCell className="text-right py-2.5 px-3 font-mono font-bold text-slate-900">
                          Rp {item.currentPrice?.toLocaleString("id-ID")}
                        </TableCell>

                        {/* MODAL BANDAR */}
                        <TableCell className="text-right py-2.5 px-3 font-mono font-bold text-indigo-700 bg-indigo-50/30">
                          Rp {item.bandarAvgPrice?.toLocaleString("id-ID")}
                        </TableCell>

                        {/* JARAK KE MODAL */}
                        <TableCell className="text-right py-2.5 px-3 font-mono font-bold">
                          <span
                            className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs ${
                              isDiscount
                                ? "bg-emerald-100 text-emerald-800"
                                : isSafe
                                ? "bg-blue-100 text-blue-800"
                                : dist <= 8.5
                                ? "bg-amber-100 text-amber-800"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {dist > 0 ? (
                              <ArrowUpRight className="h-3 w-3" />
                            ) : (
                              <ArrowDownRight className="h-3 w-3" />
                            )}
                            {dist >= 0 ? `+${dist.toFixed(2)}%` : `${dist.toFixed(2)}%`}
                          </span>
                        </TableCell>

                        {/* AKUMULASI BERSIH */}
                        <TableCell className="text-right py-2.5 px-3 font-mono">
                          <div className={`font-bold ${netLot >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                            {netLot >= 0 ? `+${netLot.toLocaleString("id-ID")}` : netLot.toLocaleString("id-ID")} Lot
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {formatRupiah(Math.abs(netRp))}
                          </div>
                        </TableCell>

                        {/* DOMINASI SMART MONEY */}
                        <TableCell className="py-2.5 px-3">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1.5 font-mono text-xs">
                              <span className={`font-bold ${item.smartMoneyDominancePercent >= 25 ? "text-indigo-700 font-extrabold" : "text-slate-600"}`}>
                                {item.smartMoneyDominancePercent}% Dominasi
                              </span>
                              <span className="text-[10px] text-slate-400">
                                ({item.accumulationConsistency})
                              </span>
                            </div>
                            <span className="text-[10px] font-medium text-slate-500">
                              {item.flowCharacter}
                            </span>
                          </div>
                        </TableCell>

                        {/* REKOMENDASI MASUK */}
                        <TableCell className="py-2.5 px-3">
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge
                                variant="outline"
                                className={`text-[11px] px-2 py-0.5 font-extrabold cursor-help ${item.entryRecommendation.badgeColor}`}
                              >
                                {item.entryRecommendation.label}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent className="text-xs p-2 max-w-xs">
                              {item.entryRecommendation.description}
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
