"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Flame,
  RefreshCw,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
  Sparkles,
  ExternalLink,
  Info,
  Check,
  Zap,
  Filter,
  Calendar,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import TickerDetailDialog from "@/components/dashboard/TickerDetailDialog";
import useFetch from "@/hooks/useFetch";
import { formatRupiah } from "@/lib/utils";

export default function AraPotentialCard() {
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [dateMode, setDateMode] = useState<"DATE" | "ALL">("DATE");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [page, setPage] = useState<number>(1);
  const limit = dateMode === "ALL" ? 15 : 50;

  // Helper to get formatted date string YYYY-MM-DD from any date value
  const getDateKey = (dateVal: any): string => {
    if (!dateVal) return "";
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal).split("T")[0];
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  // Helper to format date into Indonesian display (e.g. "Rabu, 2 Sep 2026")
  const formatDateID = (dateStr: string): string => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("id-ID", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  // Build query URL targeting official database signals for RADAR_CALON_ARA_BELI_SORE
  const queryUrl = useMemo(() => {
    let url = `/api/signals?strategy=RADAR_CALON_ARA_BELI_SORE&limit=${limit}&page=${page}`;
    if (dateMode === "DATE" && selectedDate) {
      url += `&date=${selectedDate}`;
    }
    if (statusFilter !== "ALL") {
      url += `&status=${statusFilter}`;
    }
    return url;
  }, [page, statusFilter, dateMode, selectedDate, limit]);

  const { data, loading, error, refetch } = useFetch(queryUrl, [queryUrl]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Extract signals array safely from items or signals or direct array
  const rawSignals: any[] = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.signals)) return data.signals;
    return [];
  }, [data]);

  const pagination = data?.pagination || { total: rawSignals.length, page: 1, limit, totalPages: 1 };

  // Detect latest trading date from returned signals if selectedDate is not set
  const latestTradingDate = useMemo(() => {
    if (rawSignals.length > 0 && rawSignals[0].signalDate) {
      return getDateKey(rawSignals[0].signalDate);
    }
    return "";
  }, [rawSignals]);

  // Default selectedDate to the latest trading date upon initial data load
  useEffect(() => {
    if (!selectedDate && latestTradingDate) {
      setSelectedDate(latestTradingDate);
    }
  }, [latestTradingDate, selectedDate]);

  // All signals are Beli Sore candidates
  const displayedSignals = rawSignals;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  const renderStatusBadge = (status: string, pnl?: number) => {
    switch (status) {
      case "ACTIVE":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            ACTIVE
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-500" />
            WATCH
          </span>
        );
      case "HIT_TP1":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-300">
            <Check className="w-3 h-3 stroke-[3]" />
            HIT TP1 {pnl !== undefined ? `(+${pnl.toFixed(1)}%)` : ""}
          </span>
        );
      case "HIT_TP2":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-300">
            <Zap className="w-3 h-3" />
            HIT TP2 {pnl !== undefined ? `(+${pnl.toFixed(1)}%)` : ""}
          </span>
        );
      case "HIT_SL":
        if (pnl !== undefined && pnl > 0) {
          return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Zap className="w-3 h-3 text-emerald-600" />
              TRAILING WIN (+{pnl.toFixed(1)}%)
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <ShieldAlert className="w-3 h-3 text-rose-500" />
            HIT SL {pnl !== undefined ? `(${pnl.toFixed(1)}%)` : ""}
          </span>
        );
      case "EXPIRED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
            EXPIRED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600">
            {status}
          </span>
        );
    }
  };

  return (
    <Card className="border-slate-200 shadow-sm bg-white overflow-hidden relative">
      {/* Top Banner Accent */}
      <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600" />

      <CardHeader className="p-4 sm:p-5 pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="w-7 h-7 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shadow-xs">
                <Flame className="w-4 h-4 text-rose-600 animate-pulse" />
              </div>
              <CardTitle className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                Radar Calon ARA & Beli Sore
              </CardTitle>

              {/* Active Date Indicator */}
              {dateMode === "DATE" && selectedDate ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  {formatDateID(selectedDate)}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
                  SEMUA TANGGAL
                </span>
              )}

              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                <Clock className="w-3 h-3 text-slate-400" />
                Pre-Closing: 15:30 – 15:50 WIB
              </span>
            </div>

            <CardDescription className="text-xs text-slate-500 leading-normal">
              Sinyal resmi strategi <b>Radar Calon ARA & Beli Sore</b> dengan kuota maksimal 5 saham pilihan terbaik per hari (15:30 – 15:50 WIB).
            </CardDescription>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <Dialog>
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-700 transition-colors text-xs flex items-center gap-1"
                  title="Aturan & Kriteria Radar Calon ARA"
                >
                  <Info className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Kriteria & Kuota</span>
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-sm font-bold flex items-center gap-2">
                    <Flame className="w-4 h-4 text-rose-500" />
                    Aturan & Kriteria Sinyal Radar Calon ARA
                  </DialogTitle>
                </DialogHeader>
                <div className="text-xs text-slate-600 space-y-3 pt-2 leading-relaxed">
                  <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 font-medium">
                    🎯 <b>Kuota Disiplin (Maksimal 5 Beli Sore per hari):</b>
                    <ul className="list-disc pl-4 mt-1 space-y-1 text-[11px]">
                      <li><b>5 Beli Sore (Calon ARA)</b>: Saham prioritas tertinggi dengan skor akumulasi & kekuatan penutupan terkuat, siap dieksekusi pada sesi <i>pre-closing</i> (15:30 – 15:50 WIB).</li>
                      <li><b>Tanpa Watchlist Terpisah</b>: Semua rekomendasi difokuskan langsung pada Top 5 saham berpeluang tinggi menuju ARA atau gap up esok pagi.</li>
                    </ul>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 space-y-1">
                    <b>Parameter Target & Proteksi Risiko:</b>
                    <ul className="list-disc pl-4 space-y-1 text-[11px]">
                      <li><b>Target TP1</b>: +3.5% (Penjualan parsial saat open market pagi)</li>
                      <li><b>Target TP2</b>: +7.0% (Akselerasi menuju ARA)</li>
                      <li><b>Stop Loss (SL)</b>: -2.5% s.d. -3.0% (Disiplin cut loss)</li>
                      <li><b>Trailing Stop BEP+</b>: Proteksi modal aktif jika kenaikan minimal +1.0% telah tercapai.</li>
                    </ul>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing || loading}
              className="h-8 px-2.5 text-xs font-bold text-slate-700 border-slate-200 hover:bg-slate-100 flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing || loading ? "animate-spin text-indigo-600" : ""}`} />
              <span>{isRefreshing ? "Memperbarui..." : "Refresh"}</span>
            </Button>
          </div>
        </div>

        {/* Regular Date Picker & Quick Selectors Bar */}
        <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Native HTML Date Picker */}
          <div className="flex items-center gap-2 flex-wrap">
            <label htmlFor="radar-trading-date" className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              <span>Pilih Tanggal:</span>
            </label>
            <input
              id="radar-trading-date"
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setDateMode("DATE");
                setPage(1);
              }}
              className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white font-mono text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs cursor-pointer"
            />

            {/* Quick Button: Hari Terakhir */}
            <button
              type="button"
              onClick={() => {
                if (latestTradingDate) {
                  setSelectedDate(latestTradingDate);
                  setDateMode("DATE");
                  setPage(1);
                }
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                dateMode === "DATE" && selectedDate === latestTradingDate
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
              title="Kembali ke hari terakhir trading"
            >
              Hari Terakhir
            </button>

            {/* Quick Button: Semua Tanggal */}
            <button
              type="button"
              onClick={() => {
                setDateMode("ALL");
                setPage(1);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                dateMode === "ALL"
                  ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
              title="Lihat semua riwayat sinyal lintas tanggal"
            >
              Semua Tanggal
            </button>
          </div>

          {/* Quota Indicators for Current Selected Day */}
          {dateMode === "DATE" && (
            <div className="flex items-center gap-2 flex-wrap text-[11px]">
              <span className="font-semibold text-slate-500">Hasil Kuota:</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
                🔥 Beli Sore: {displayedSignals.length}/5
              </span>
            </div>
          )}
        </div>

        {/* Filter Controls Row */}
        <div className="mt-2.5 pt-2 flex flex-wrap items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-extrabold text-[11px] bg-rose-50 text-rose-700 border border-rose-200">
              <Flame className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              Top 5 Beli Sore ({displayedSignals.length} emiten)
            </span>
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              Fokus kandidat terbaik pre-closing 15:30 WIB
            </span>
          </div>

          {/* Status Quick Filter */}
          <div className="flex items-center gap-1.5 text-slate-500">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] font-semibold">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-2 py-1 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">Semua Status</option>
              <option value="ACTIVE">ACTIVE (Berjalan)</option>
              <option value="HIT_TP1">HIT TP1</option>
              <option value="HIT_TP2">HIT TP2</option>
              <option value="HIT_SL">HIT SL / TRAILING</option>
              <option value="EXPIRED">EXPIRED</option>
            </select>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 sm:p-0">
        {error && (
          <div className="p-3 m-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-between">
            <span>Gagal memuat sinyal: {String((error as any)?.response?.data?.message || (error as any)?.message || error)}</span>
            <Button size="sm" variant="ghost" onClick={handleRefresh} className="h-6 text-xs text-rose-700 hover:bg-rose-100">
              Coba Lagi
            </Button>
          </div>
        )}

        {loading && displayedSignals.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-indigo-500 mb-2" />
            Memuat sinyal resmi Radar Calon ARA...
          </div>
        ) : displayedSignals.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 space-y-1">
            <p className="font-bold text-slate-700">Tidak ada sinyal yang cocok dengan tanggal & setup saat ini.</p>
            <p className="text-slate-400">
              Pilih tanggal lain pada kalender (misal <b>2026-09-02</b>) atau klik tombol <b>"Semua Tanggal"</b>.
            </p>
          </div>
        ) : (
          <div>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <Table className="text-xs w-full whitespace-nowrap">
                <TableHeader className="bg-slate-50">
                  <TableRow className="hover:bg-transparent border-slate-200 text-slate-500 font-bold">
                    <TableHead className="py-2.5 px-3">Ticker</TableHead>
                    <TableHead className="py-2.5 px-3">Status</TableHead>
                    <TableHead className="text-right py-2.5 px-3">Turnover (Uang)</TableHead>
                    <TableHead className="text-right py-2.5 px-3">Entry / Sisa ARA</TableHead>
                    <TableHead className="text-center py-2.5 px-3">Kekuatan CLV</TableHead>
                    <TableHead className="text-right py-2.5 px-3">Konfirmasi Breakout</TableHead>
                    <TableHead className="text-right py-2.5 px-3">Target TP1</TableHead>
                    <TableHead className="text-right py-2.5 px-3">Target TP2</TableHead>
                    <TableHead className="text-right py-2.5 px-3">Stop Loss</TableHead>
                    <TableHead className="text-right py-2.5 px-3">Peak Price</TableHead>
                    <TableHead className="text-right py-2.5 px-3">Close Price</TableHead>
                    <TableHead className="text-center py-2.5 px-3">Score</TableHead>
                    <TableHead className="text-right py-2.5 px-3">Tanggal / Hold</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedSignals.map((sig: any, idx: number) => {
                    const entryVal = Number(sig.entryPrice || sig.entry || 0);
                    const closeVal = Number(sig.currentPrice || sig.exitPrice || entryVal);
                    const peakVal = sig.highSinceEntry ? Number(sig.highSinceEntry) : (entryVal > 0 ? entryVal : 0);
                    const lowVal = sig.lowSinceEntry ? Number(sig.lowSinceEntry) : (sig.status === "HIT_SL" ? Number(sig.exitPrice || sig.stopLoss || entryVal) : Number(sig.currentPrice || entryVal));

                    const turnoverVal = Number(sig.turnover || sig.value || sig.configSnapshot?.turnover || 0);
                    const foreignNetVal = Number(sig.foreignNet || 0);
                    const remainingToAraVal = sig.remainingToAra !== undefined ? Number(sig.remainingToAra) : 0;
                    const araLimitVal = sig.araLimitPrice ? Number(sig.araLimitPrice) : 0;
                    const clvVal = sig.clv !== undefined ? Number(sig.clv) : (sig.configSnapshot?.candleQuality?.closeLocation !== undefined ? Number(sig.configSnapshot.candleQuality.closeLocation) : 1.0);
                    const chgVal = sig.changePercent !== undefined ? Number(sig.changePercent) : 0;

                    const pnl = sig.realizedPnLPercent !== undefined ? Number(sig.realizedPnLPercent) : undefined;
                    const peakDiff = entryVal > 0 && peakVal > 0 ? ((peakVal - entryVal) / entryVal) * 100 : 0;
                    const lowDiff = entryVal > 0 && lowVal > 0 ? ((lowVal - entryVal) / entryVal) * 100 : 0;
                    const closeDiff = entryVal > 0 && closeVal > 0 ? ((closeVal - entryVal) / entryVal) * 100 : 0;

                    const tp1Val = Number(sig.targetPrice1 || sig.tp1 || 0);
                    const tp2Val = Number(sig.targetPrice2 || sig.tp2 || 0);
                    const slVal = Number(sig.trailingStop || sig.stopLoss || sig.sl || 0);

                    const tp1Pct = entryVal > 0 && tp1Val > 0 ? ((tp1Val - entryVal) / entryVal) * 100 : 3.5;
                    const tp2Pct = entryVal > 0 && tp2Val > 0 ? ((tp2Val - entryVal) / entryVal) * 100 : 7.0;
                    const slPct = entryVal > 0 && slVal > 0 ? ((slVal - entryVal) / entryVal) * 100 : -2.5;

                    const holdDays = sig.holdingDays !== undefined && sig.holdingDays !== null
                      ? sig.holdingDays
                      : (sig.status !== "ACTIVE" && sig.status !== "PENDING" ? 1 : 0);
                    const holdDaysBadge = `${holdDays} hr`;

                    const isHitTp1 = sig.status === "HIT_TP1";
                    const isHitTp2 = sig.status === "HIT_TP2";
                    const isHitSl = sig.status === "HIT_SL";
                    const isActive = sig.status === "ACTIVE";

                    const triggerPct = 1.0;
                    const trailingTriggerHigh = Math.round(entryVal * (1 + triggerPct / 100));
                    const isTrailingTriggered = sig.highSinceEntry && sig.highSinceEntry >= trailingTriggerHigh;
                    const signalDateStr = sig.signalDate ? new Date(sig.signalDate).toLocaleDateString("id-ID") : "-";

                    return (
                      <TableRow key={sig._id || sig.id || idx} className="border-slate-100 hover:bg-slate-50">
                        {/* TICKER */}
                        <TableCell className="py-2.5 px-3 font-bold">
                          <div className="flex flex-col">
                            <TickerDetailDialog ticker={sig.ticker} />
                            {sig.stockName && sig.stockName !== sig.ticker && (
                              <span className="text-[10px] text-slate-400 truncate max-w-[130px]" title={sig.stockName}>
                                {sig.stockName}
                              </span>
                            )}
                          </div>
                        </TableCell>

                        {/* STATUS */}
                        <TableCell className="py-2.5 px-3">
                          {renderStatusBadge(sig.status, pnl)}
                        </TableCell>

                        {/* TURNOVER (UANG) */}
                        <TableCell className="text-right py-2.5 px-3 font-mono">
                          <div className="font-extrabold text-slate-900 text-xs">
                            {turnoverVal > 0 ? formatRupiah(turnoverVal) : "-"}
                          </div>
                          <div className="text-[10px]">
                            {foreignNetVal > 0 ? (
                              <span className="text-emerald-600 font-semibold">Net Buy Asing</span>
                            ) : foreignNetVal < 0 ? (
                              <span className="text-slate-400">Net Sell Asing</span>
                            ) : (
                              <span className="text-slate-400">Domestik</span>
                            )}
                          </div>
                        </TableCell>

                        {/* ENTRY / SISA ARA */}
                        <TableCell className="text-right py-2.5 px-3 font-mono">
                          <div className="font-bold text-slate-900 text-xs">
                            Rp {entryVal.toLocaleString("id-ID")}
                          </div>
                          {remainingToAraVal > 0 ? (
                            <div className="text-[10px] text-rose-600 font-extrabold flex items-center justify-end gap-1">
                              <span>+{remainingToAraVal}% ARA</span>
                              {araLimitVal > 0 && (
                                <span className="text-slate-400 font-normal">({araLimitVal.toLocaleString("id-ID")})</span>
                              )}
                            </div>
                          ) : chgVal !== 0 ? (
                            <div className={`text-[10px] font-bold ${chgVal >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                              {chgVal >= 0 ? "+" : ""}{chgVal.toFixed(1)}%
                            </div>
                          ) : null}
                        </TableCell>

                        {/* KEKUATAN CLV */}
                        <TableCell className="text-center py-2.5 px-3 font-mono">
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-800">
                            <span>{Math.round(clvVal * 100)}%</span>
                            <span className="text-[9px] text-emerald-600 font-normal">
                              {clvVal >= 0.85 ? "Dekat High" : "Atas"}
                            </span>
                          </div>
                        </TableCell>

                        {/* KONFIRMASI BREAKOUT / MOMENTUM ENTRY */}
                        <TableCell className="text-right py-2.5 px-3">
                          {sig.momentumEntryPrice || sig.confirmationPrice || sig.breakoutPrice ? (
                            <div className="inline-flex flex-col items-end gap-0.5">
                              <span className="font-mono font-bold text-amber-600 text-[11px]">
                                Rp {Number(sig.momentumEntryPrice || sig.confirmationPrice || sig.breakoutPrice).toLocaleString("id-ID")}
                              </span>
                              <div className="flex items-center gap-1">
                                {(sig.isMajorBreakout || sig.isBreakoutConfirmed) && (
                                  <span
                                    className="text-[8px] font-black text-emerald-700 bg-emerald-100 border border-emerald-300 px-1 py-0.2 rounded leading-tight"
                                    title={sig.majorBreakoutNote || "Major Breakout historis terkonfirmasi valid"}
                                  >
                                    🚀 Major
                                  </span>
                                )}
                                {(sig.momentumTriggerPct || sig.confirmationTriggerPct) ? (
                                  <span className="text-[9px] text-amber-700 font-bold bg-amber-50 border border-amber-200 px-1 rounded leading-tight">
                                    +{sig.momentumTriggerPct || sig.confirmationTriggerPct}%
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-300 font-mono text-[11px]">-</span>
                          )}
                        </TableCell>

                        {/* TARGET TP1 */}
                        <TableCell className="text-right py-2.5 px-3">
                          {isHitTp1 ? (
                            <div className="inline-flex items-center justify-end gap-1 font-mono font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-300 shadow-2xs">
                              <span>Rp {tp1Val.toLocaleString("id-ID")} (+{tp1Pct.toFixed(1)}%)</span>
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold bg-emerald-600 text-white rounded px-1.5 py-0.2">
                                <Check className="h-2.5 w-2.5 stroke-[3]" /> Hit TP1 ({holdDaysBadge})
                              </span>
                            </div>
                          ) : (
                            <span className="font-mono font-bold text-emerald-600">
                              Rp {tp1Val.toLocaleString("id-ID")}
                            </span>
                          )}
                        </TableCell>

                        {/* TARGET TP2 */}
                        <TableCell className="text-right py-2.5 px-3">
                          {isHitTp2 ? (
                            <div className="inline-flex items-center justify-end gap-1 font-mono font-extrabold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-300 shadow-2xs">
                              <span>Rp {tp2Val.toLocaleString("id-ID")} (+{tp2Pct.toFixed(1)}%)</span>
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold bg-indigo-600 text-white rounded px-1.5 py-0.2">
                                <Zap className="h-2.5 w-2.5 fill-white" /> Hit TP2 ({holdDaysBadge})
                              </span>
                            </div>
                          ) : (
                            <span className="font-mono font-bold text-indigo-600">
                              Rp {tp2Val.toLocaleString("id-ID")}
                            </span>
                          )}
                        </TableCell>

                        {/* STOP LOSS */}
                        <TableCell className="text-right py-2.5 px-3">
                          {isHitSl ? (
                            <div className="inline-flex items-center justify-end gap-1 font-mono font-extrabold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-300">
                              <span>Rp {slVal.toLocaleString("id-ID")} ({slPct.toFixed(1)}%)</span>
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold bg-rose-600 text-white rounded px-1.5 py-0.2">
                                <ShieldAlert className="h-2.5 w-2.5" /> Hit SL ({holdDaysBadge})
                              </span>
                            </div>
                          ) : isActive ? (
                            <div className="text-right font-mono">
                              <div className="inline-flex items-center justify-end gap-1 text-rose-600">
                                <span className={`inline-flex items-center text-[9px] px-1 rounded font-bold border ${isTrailingTriggered ? 'text-emerald-700 bg-emerald-50 border-emerald-300' : 'text-amber-700 bg-amber-50 border-amber-200'}`}>
                                  <Zap className="h-2.5 w-2.5 mr-0.5 text-amber-500 fill-amber-500" />
                                  {isTrailingTriggered ? "Trailing BEP+" : "Trailing Ready"}
                                </span>
                                <span>Rp {slVal.toLocaleString("id-ID")}</span>
                              </div>
                              <div className="text-[9px] text-slate-400 mt-0.5">
                                Trigger High: ≥ Rp {trailingTriggerHigh.toLocaleString("id-ID")} (+{triggerPct}%)
                              </div>
                            </div>
                          ) : (
                            <span className="font-mono text-rose-600 font-medium">
                              Rp {slVal.toLocaleString("id-ID")}
                            </span>
                          )}
                        </TableCell>

                        {/* PEAK PRICE */}
                        <TableCell className="text-right font-mono py-2.5 px-3">
                          {peakVal > 0 ? (
                            <div className={`inline-flex items-center justify-end gap-1 font-bold ${peakDiff > 0 ? "text-emerald-600" : peakDiff < 0 ? "text-rose-600" : "text-slate-700"}`}>
                              {peakDiff > 0 ? (
                                <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600" />
                              ) : peakDiff < 0 ? (
                                <ArrowDownRight className="h-3.5 w-3.5 text-rose-600" />
                              ) : null}
                              <span>Rp {peakVal.toLocaleString("id-ID")}</span>
                              <span className="text-[10px] font-semibold">
                                ({peakDiff >= 0 ? "+" : ""}{peakDiff.toFixed(1)}%)
                              </span>
                            </div>
                          ) : (
                            <div className="text-slate-400 font-mono text-xs italic">-</div>
                          )}
                        </TableCell>

                        {/* CLOSE PRICE */}
                        <TableCell className="text-right font-mono py-2.5 px-3">
                          <div className={`inline-flex items-center justify-end gap-1 font-bold ${closeDiff > 0 ? "text-emerald-600" : closeDiff < 0 ? "text-rose-600" : "text-slate-700"}`}>
                            {closeDiff > 0 ? (
                              <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600" />
                            ) : closeDiff < 0 ? (
                              <ArrowDownRight className="h-3.5 w-3.5 text-rose-600" />
                            ) : null}
                            <span>Rp {closeVal.toLocaleString("id-ID")}</span>
                            <span className="text-[10px] font-semibold">
                              ({closeDiff >= 0 ? "+" : ""}{closeDiff.toFixed(1)}%)
                            </span>
                          </div>
                        </TableCell>

                        {/* SCORE */}
                        <TableCell className="text-center py-2.5 px-3">
                          <Badge className="bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-100 font-mono text-[10px]">
                            {sig.score ? Number(sig.score).toFixed(0) : 80}
                          </Badge>
                        </TableCell>

                        {/* TANGGAL / HOLD */}
                        <TableCell className="text-right font-mono text-[11px] py-2.5 px-3">
                          <div className="text-slate-700 font-medium">{signalDateStr}</div>
                          <div className="text-[10px] text-slate-400 font-normal">
                            Hold: <span className="font-semibold text-slate-600">{holdDays} hr</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden divide-y divide-slate-100">
              {displayedSignals.map((sig: any, idx: number) => {
                const entryVal = Number(sig.entryPrice || sig.entry || 0);
                const tp1Val = Number(sig.targetPrice1 || sig.tp1 || 0);
                const tp2Val = Number(sig.targetPrice2 || sig.tp2 || 0);
                const slVal = Number(sig.trailingStop || sig.stopLoss || sig.sl || 0);
                const peakVal = sig.highSinceEntry ? Number(sig.highSinceEntry) : (entryVal > 0 ? entryVal : 0);
                const lowVal = sig.lowSinceEntry ? Number(sig.lowSinceEntry) : (sig.status === "HIT_SL" ? Number(sig.exitPrice || sig.stopLoss || entryVal) : Number(sig.currentPrice || entryVal));
                const closeVal = Number(sig.currentPrice || sig.exitPrice || entryVal);
                const pnl = sig.realizedPnLPercent !== undefined ? Number(sig.realizedPnLPercent) : undefined;
                const peakDiff = entryVal > 0 && peakVal > 0 ? ((peakVal - entryVal) / entryVal) * 100 : 0;
                const lowDiff = entryVal > 0 && lowVal > 0 ? ((lowVal - entryVal) / entryVal) * 100 : 0;
                const closeDiff = entryVal > 0 && closeVal > 0 ? ((closeVal - entryVal) / entryVal) * 100 : 0;

                const turnoverVal = Number(sig.turnover || sig.value || sig.configSnapshot?.turnover || 0);
                const foreignNetVal = Number(sig.foreignNet || 0);
                const remainingToAraVal = sig.remainingToAra !== undefined ? Number(sig.remainingToAra) : 0;
                const araLimitVal = sig.araLimitPrice ? Number(sig.araLimitPrice) : 0;
                const clvVal = sig.clv !== undefined ? Number(sig.clv) : (sig.configSnapshot?.candleQuality?.closeLocation !== undefined ? Number(sig.configSnapshot.candleQuality.closeLocation) : 1.0);
                const chgVal = sig.changePercent !== undefined ? Number(sig.changePercent) : 0;

                const signalDateStr = sig.signalDate ? new Date(sig.signalDate).toLocaleDateString("id-ID") : "-";
                const holdDays = sig.holdingDays !== undefined && sig.holdingDays !== null
                  ? sig.holdingDays
                  : (sig.status !== "ACTIVE" && sig.status !== "PENDING" ? 1 : 0);

                return (
                  <div key={sig._id || sig.id || idx} className="p-3.5 space-y-2.5 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <TickerDetailDialog ticker={sig.ticker} className="text-sm font-black" />
                          <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-800 text-[9px] font-extrabold">
                            🔥 BELI SORE
                          </Badge>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {sig.stockName ? `${sig.stockName} • ` : ""}{signalDateStr} • Hold: {holdDays} hr
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {renderStatusBadge(sig.status, pnl)}
                      </div>
                    </div>

                    {/* Row 1: Turnover (Uang) | Entry & Sisa ARA | CLV */}
                    <div className="grid grid-cols-3 gap-2 text-center p-2 rounded-xl bg-slate-50/80 border border-slate-100 text-xs">
                      <div>
                        <div className="text-[10px] text-slate-400 font-medium">Turnover (Uang)</div>
                        <div className="font-black text-slate-900 font-mono text-[11px]">
                          {turnoverVal > 0 ? formatRupiah(turnoverVal) : "-"}
                        </div>
                        <div className="text-[9px] text-slate-500">
                          {foreignNetVal > 0 ? <span className="text-emerald-600 font-bold">Net Asing</span> : <span>Domestik</span>}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 font-medium">Entry / Sisa ARA</div>
                        <div className="font-black text-slate-900 font-mono">
                          Rp {entryVal.toLocaleString("id-ID")}
                        </div>
                        {remainingToAraVal > 0 ? (
                          <div className="text-[9px] text-rose-600 font-bold">
                            +{remainingToAraVal}% ARA
                          </div>
                        ) : null}
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 font-medium">Kekuatan CLV</div>
                        <div className="font-black text-slate-800 font-mono">
                          {Math.round(clvVal * 100)}%
                        </div>
                        <div className="text-[9px] text-emerald-600 font-medium">
                          {clvVal >= 0.85 ? "Dekat High" : "Atas"}
                        </div>
                      </div>
                    </div>

                    {/* Row 2: TP1 | TP2 | SL */}
                    <div className="grid grid-cols-3 gap-2 text-center p-2 rounded-xl bg-slate-50/50 border border-slate-100 text-xs">
                      <div>
                        <div className="text-[10px] text-slate-400 font-medium">Target TP1</div>
                        <div className="font-black text-emerald-600 font-mono">
                          Rp {tp1Val.toLocaleString("id-ID")}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 font-medium">Target TP2</div>
                        <div className="font-black text-indigo-600 font-mono">
                          Rp {tp2Val.toLocaleString("id-ID")}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 font-medium">Stop Loss</div>
                        <div className="font-black text-rose-600 font-mono">
                          Rp {slVal.toLocaleString("id-ID")}
                        </div>
                      </div>
                    </div>

                    {/* Row 3: Peak Price | Close Price | Score */}
                    <div className="grid grid-cols-3 gap-2 text-center p-2 rounded-xl bg-slate-50/30 border border-slate-100 text-xs">
                      <div>
                        <div className="text-[10px] text-slate-400 font-medium">Peak Price</div>
                        <div className="font-black text-slate-900 font-mono">
                          Rp {peakVal.toLocaleString("id-ID")}
                        </div>
                        <span className="text-[9px] text-emerald-600 font-bold">
                          +{peakDiff.toFixed(1)}%
                        </span>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 font-medium">Close Price</div>
                        <div className="font-black text-slate-900 font-mono">
                          Rp {closeVal.toLocaleString("id-ID")}
                        </div>
                        <span className={`text-[9px] font-bold ${closeDiff >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                          {closeDiff >= 0 ? "+" : ""}{closeDiff.toFixed(1)}%
                        </span>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 font-medium">Score / Konfirmasi</div>
                        <div className="font-bold text-slate-700 font-mono">
                          {sig.score ? Number(sig.score).toFixed(0) : 80}
                        </div>
                        {(sig.momentumEntryPrice || sig.confirmationPrice) ? (
                          <span className="text-[9px] text-amber-700 font-bold">
                            {(sig.isMajorBreakout || sig.isBreakoutConfirmed) ? "🚀 " : ""}Momentum: Rp {Number(sig.momentumEntryPrice || sig.confirmationPrice).toLocaleString("id-ID")}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer with Info & Pagination */}
        <div className="p-3 bg-slate-50/70 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
          <div className="flex items-center gap-2">
            <span>
              Menampilkan <b>{displayedSignals.length}</b> sinyal
              {dateMode === "DATE" && selectedDate
                ? ` pada tanggal ${formatDateID(selectedDate)}`
                : ` dari total ${pagination.total.toLocaleString("id-ID")} sinyal database`}
            </span>
          </div>

          {dateMode === "ALL" && pagination.totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                className="h-7 px-2 text-xs"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Prev</span>
              </Button>
              <span className="text-xs font-mono font-bold px-2">
                {page} / {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page >= pagination.totalPages || loading}
                className="h-7 px-2 text-xs"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
