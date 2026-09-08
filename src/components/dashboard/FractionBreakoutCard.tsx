"use client";

import React, { useState } from "react";
import {
  Zap,
  RefreshCw,
  Clock,
  ShieldAlert,
  Sparkles,
  Info,
  TrendingUp,
  Target,
  Layers,
  ArrowUpRight
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import TickerDetailDialog from "@/components/dashboard/TickerDetailDialog";
import { api } from "@/lib/api";
import useFetch from "@/hooks/useFetch";
import { formatRupiah } from "@/lib/utils";

export interface FractionBreakoutCandidate {
  ticker: string;
  stockName?: string;
  currentPrice: number;
  openPrice: number;
  highPrice: number;
  lowPrice: number;
  previousClose: number;
  changePercent: number;
  volume: number;
  turnoverRupiah: number;
  targetBarrier: number;
  barrierLabel: string;
  barrierCategory: "BARRIER_100" | "BARRIER_200" | "BARRIER_500" | "BARRIER_1000";
  distanceToBarrierPercent: number;
  distanceToBarrierTicks: number;
  score: number;
  vpaSignal: string;
  hasVolumeDryUp: boolean;
  dryUpVolumeDaysAgo?: number;
  dryUpRatio?: number;
  isHigherLow: boolean;
  isCloseNearHigh: boolean;
  isOpenEqualsLow?: boolean;
  recommendedAction: string;
  buyZone: string;
  stopLossPrice: number;
  stopLossPercent: number;
  targetPrice1: number;
  targetPrice1Percent: number;
  targetPrice2: number;
  targetPrice2Percent: number;
  riskRewardRatio: string;
  catalystNote: string;
  scannedAt: string | Date;
}

export default function FractionBreakoutCard() {
  const [isRefreshingLive, setIsRefreshingLive] = useState<boolean>(false);
  const [isRefreshingDb, setIsRefreshingDb] = useState<boolean>(false);
  const [liveData, setLiveData] = useState<{
    candidates: FractionBreakoutCandidate[];
    scannedAt: string;
    source: "LIVE_YAHOO" | "IDX_DATABASE";
    totalEvaluated: number;
    fromCache?: boolean;
  } | null>(null);

  // Initial load uses default endpoint (DB latest session, served from cache if available)
  const { data: initialData, loading, error, refetch } = useFetch("/api/strategies/fraction-breakout?limit=5", []);

  // Merge live refreshed data over initial fetch if available
  const resultData = liveData || initialData;
  const candidates: FractionBreakoutCandidate[] = resultData?.candidates || [];
  const source = resultData?.source || "IDX_DATABASE";
  const scannedAt = resultData?.scannedAt ? new Date(resultData.scannedAt) : null;
  const fromCache = Boolean(resultData?.fromCache);

  const handleRefreshLive = async () => {
    setIsRefreshingLive(true);
    try {
      const res = await api.get("/api/strategies/fraction-breakout?refresh=true&limit=5");
      if (res.data && res.data.data) {
        setLiveData(res.data.data);
      }
    } catch (err) {
      console.error("Failed to refresh live fraction breakouts:", err);
      // Fallback to normal refetch
      await refetch();
    } finally {
      setIsRefreshingLive(false);
    }
  };

  const handleRefreshDb = async () => {
    setIsRefreshingDb(true);
    try {
      const res = await api.get("/api/strategies/fraction-breakout?bypassCache=true&limit=5");
      if (res.data && res.data.data) {
        setLiveData(res.data.data);
      }
    } catch (err) {
      console.error("Failed to refresh fraction breakouts:", err);
      await refetch();
    } finally {
      setIsRefreshingDb(false);
    }
  };

  const formatScannedTime = (date: Date | null) => {
    if (!date) return "-";
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    }) + " WIB";
  };

  const getBarrierBadgeStyle = (category: string) => {
    switch (category) {
      case "BARRIER_100":
        return "bg-amber-50 text-amber-800 border-amber-300";
      case "BARRIER_200":
        return "bg-purple-50 text-purple-800 border-purple-300";
      case "BARRIER_500":
        return "bg-indigo-50 text-indigo-800 border-indigo-300";
      case "BARRIER_1000":
        return "bg-blue-50 text-blue-800 border-blue-300";
      default:
        return "bg-slate-100 text-slate-700 border-slate-300";
    }
  };

  return (
    <Card className="border-slate-200 shadow-sm bg-white overflow-hidden relative">
      {/* Top Banner Accent */}
      <div className="h-1 w-full bg-gradient-to-r from-purple-600 via-amber-500 to-rose-500" />

      <CardHeader className="p-4 sm:p-5 pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-xs">
                <Zap className="w-4 h-4 text-amber-600 fill-amber-500 animate-pulse" />
              </div>
              <CardTitle className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                Radar Calon Ledakan Harga
              </CardTitle>

              {/* Source Badge */}
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border shadow-2xs ${source === "LIVE_YAHOO"
                  ? "bg-amber-50 text-amber-900 border-amber-300"
                  : "bg-indigo-50 text-indigo-900 border-indigo-200"
                  }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${source === "LIVE_YAHOO" ? "bg-amber-500 animate-ping" : "bg-indigo-500"
                    }`}
                />
                {source === "LIVE_YAHOO" ? "⚡ Live Yahoo Quotes" : "IDX Database"}
              </span>

              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                <Clock className="w-3 h-3 text-slate-400" />
                Lookback 30D + Serapan
              </span>

              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                <Layers className="w-3 h-3 text-purple-500" />
                Ambang: Rp 100 / 200 / 500
              </span>
            </div>


          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <Dialog>
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-700 transition-colors text-xs flex items-center gap-1"
                  title="Aturan & Formula Ledakan 20%"
                >
                  <Info className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Formula & Aturan</span>
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-sm font-bold flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Anatomi & Formula Sinyal Calon Ledakan Harga
                  </DialogTitle>
                </DialogHeader>
                <div className="text-xs text-slate-600 space-y-3 pt-2 leading-relaxed">
                  <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 font-medium">
                    ⚡ <b>Mekanisme Benteng Fraksi Psikologis:</b>
                    <ul className="list-disc pl-4 mt-1 space-y-1 text-[11px]">
                      <li><b>Rp 100, Rp 200, Rp 500, Rp 1.000</b> adalah level transisi tick size IDX & resisten magnetik institusi.</li>
                      <li>Ketika harga menembus benteng ini dengan volume serap & akumulasi pre-breakout, terjadi fenomena <i>FOMO short-squeeze</i> dan akselerasi harga menuju +20% s.d. ARA.</li>
                    </ul>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 space-y-1">
                    <b>3 Kriteria Mutlak Screener:</b>
                    <ul className="list-disc pl-4 space-y-1 text-[11px]">
                      <li><b>1. Posisi Menempel Benteng</b>: Jarak hanya 1 s.d. 6 tick dari ambang fraksi.</li>
                      <li><b>2. Volume Dry-Up & Serap</b>: Terdapat fase volume kering (dry-up) dalam 3-10 hari kebelakang, lalu hari ini meledak serap 2-5x lipat.</li>
                      <li><b>3. Close Near High / Open=Low</b>: Candlestick ditutup di dekat pucuk (CLV &gt; 60%) atau Open=Low, menandakan bandar mengunci barang menjelang penutupan sesi sore.</li>
                    </ul>
                  </div>
                  <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px]">
                    🎯 <b>Rencana Eksekusi:</b> Beli sore di zona akumulasi (15:40–15:50 WIB), pasang SL disiplin (-3.5% s.d. -4.0%), dan trailing take profit saat lonjakan pagi menembus benteng.
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Live Yahoo Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshLive}
              disabled={isRefreshingLive || loading}
              className="h-8 px-2.5 text-xs font-bold text-amber-900 bg-amber-50/70 border-amber-200 hover:bg-amber-100 flex items-center gap-1.5 shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingLive || loading ? "animate-spin text-amber-600" : "text-amber-600"}`} />
              <span>{isRefreshingLive ? "Scanning Yahoo..." : "⚡ Refresh Live Yahoo"}</span>
            </Button>
          </div>
        </div>

        {/* Subheader info bar */}
        <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap text-[11px]">
            <span className="font-semibold text-slate-500">Kuota:</span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-extrabold bg-purple-100 text-purple-800 border border-purple-200">
              ⚡ Top {candidates.length}/5 Emiten Terkuat
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-500">Rentang Harga: <b>Rp 90 – Rp 2.500</b></span>
          </div>

          <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5">
            {fromCache && (
              <span
                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"
                title="Hasil screener disajikan seketika dari memory cache server"
              >
                ⚡ In-Memory Cache
              </span>
            )}
            <span>
              Terakhir dicek: <span className="font-bold text-slate-700">{formatScannedTime(scannedAt)}</span>
            </span>
            <button
              type="button"
              onClick={handleRefreshDb}
              disabled={isRefreshingDb || loading}
              title="Segarkan ulang database (Bypass Cache)"
              className="p-1 hover:bg-slate-200/70 rounded text-slate-400 hover:text-slate-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshingDb ? "animate-spin text-purple-600" : ""}`} />
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 sm:p-0">
        {error && (
          <div className="p-3 m-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-between">
            <span>Gagal memuat radar fraksi: {String((error as any)?.response?.data?.message || (error as any)?.message || error)}</span>
            <Button size="sm" variant="ghost" onClick={() => refetch()} className="h-6 text-xs text-rose-700 hover:bg-rose-100">
              Coba Lagi
            </Button>
          </div>
        )}

        {loading && candidates.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-amber-500 mb-2" />
            Memindai saham kandidat ledakan benteng fraksi (Lookback 30D)...
          </div>
        ) : candidates.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 space-y-1">
            <p className="font-bold text-slate-700">Belum ada saham yang memenuhi kriteria ketat pre-breakout benteng saat ini.</p>
            <p className="text-slate-400">
              Klik tombol <b>"⚡ Refresh Live Yahoo"</b> pada sesi sore (15:40 WIB) untuk memindai harga dan volume serapan real-time.
            </p>
          </div>
        ) : (
          <div>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <Table className="text-xs w-full whitespace-nowrap">
                <TableHeader className="bg-slate-50">
                  <TableRow className="hover:bg-transparent border-slate-200 text-slate-500 font-bold">
                    <TableHead className="py-2.5 px-3">Ticker</TableHead>
                    <TableHead className="py-2.5 px-3">Target Benteng</TableHead>
                    <TableHead className="text-right py-2.5 px-3">Harga Terakhir</TableHead>
                    <TableHead className="text-left py-2.5 px-3">Sinyal Serapan (VPA)</TableHead>
                    <TableHead className="text-right py-2.5 px-3">Zona Beli Sore</TableHead>
                    <TableHead className="text-right py-2.5 px-3">Target Ledakan TP1 / TP2</TableHead>
                    <TableHead className="text-right py-2.5 px-3">Stop Loss</TableHead>
                    <TableHead className="text-center py-2.5 px-3">Skor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {candidates.map((cand, idx) => {
                    return (
                      <TableRow key={cand.ticker || idx} className="border-slate-100 hover:bg-slate-50/80">
                        {/* TICKER */}
                        <TableCell className="py-2.5 px-3 font-bold">
                          <div className="flex flex-col">
                            <TickerDetailDialog ticker={cand.ticker} />
                            {cand.stockName && cand.stockName !== cand.ticker && (
                              <span className="text-[10px] text-slate-400 truncate max-w-[120px]" title={cand.stockName}>
                                {cand.stockName}
                              </span>
                            )}
                          </div>
                        </TableCell>

                        {/* TARGET BENTENG */}
                        <TableCell className="py-2.5 px-3 font-mono">
                          <div className="flex flex-col gap-0.5">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-extrabold border w-fit ${getBarrierBadgeStyle(cand.barrierCategory)}`}>
                              <Target className="w-3 h-3" />
                              {cand.barrierLabel}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              Jarak: <b>{cand.distanceToBarrierTicks} tick</b> ({cand.distanceToBarrierPercent.toFixed(1)}%)
                            </span>
                          </div>
                        </TableCell>

                        {/* HARGA & CHANGE */}
                        <TableCell className="text-right py-2.5 px-3 font-mono">
                          <div className="font-extrabold text-slate-900 text-xs">
                            Rp {cand.currentPrice.toLocaleString("id-ID")}
                          </div>
                          <div className="flex items-center justify-end gap-1 text-[10px]">
                            <span className={`font-bold ${cand.changePercent >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                              {cand.changePercent >= 0 ? "+" : ""}{cand.changePercent.toFixed(1)}%
                            </span>
                            {cand.isOpenEqualsLow && (
                              <span className="text-[9px] px-1 rounded bg-amber-100 text-amber-800 font-bold">
                                Open=Low
                              </span>
                            )}
                          </div>
                        </TableCell>

                        {/* VPA SIGNAL */}
                        <TableCell className="py-2.5 px-3">
                          <div className="flex flex-col gap-0.5 max-w-[220px]">
                            <span className="text-[11px] font-bold text-slate-800 truncate" title={cand.vpaSignal}>
                              {cand.vpaSignal}
                            </span>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                              <span>Turnover: {formatRupiah(cand.turnoverRupiah)}</span>
                              {cand.isHigherLow && (
                                <span className="text-emerald-600 font-semibold">• Higher Low</span>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        {/* ZONA BELI SORE */}
                        <TableCell className="text-right py-2.5 px-3 font-mono">
                          <div className="font-bold text-purple-700 text-xs">
                            {cand.buyZone}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Sesi Sore 15:40
                          </div>
                        </TableCell>

                        {/* TARGET TP1 / TP2 */}
                        <TableCell className="text-right py-2.5 px-3 font-mono">
                          <div className="font-bold text-emerald-600 text-xs">
                            TP1: Rp {cand.targetPrice1.toLocaleString("id-ID")} (+{cand.targetPrice1Percent.toFixed(1)}%)
                          </div>
                          <div className="font-bold text-indigo-600 text-[11px]">
                            TP2: Rp {cand.targetPrice2.toLocaleString("id-ID")} (+{cand.targetPrice2Percent.toFixed(1)}%)
                          </div>
                        </TableCell>

                        {/* STOP LOSS */}
                        <TableCell className="text-right py-2.5 px-3 font-mono">
                          <div className="inline-flex items-center justify-end gap-1 font-bold text-rose-600 text-xs">
                            <ShieldAlert className="w-3 h-3 text-rose-500" />
                            <span>Rp {cand.stopLossPrice.toLocaleString("id-ID")}</span>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {cand.stopLossPercent.toFixed(1)}% (Disiplin)
                          </div>
                        </TableCell>

                        {/* SKOR */}
                        <TableCell className="text-center py-2.5 px-3">
                          <Badge className="bg-amber-50 border-amber-200 text-amber-900 hover:bg-amber-50 font-mono text-[11px] font-extrabold">
                            {cand.score}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards View */}
            <div className="lg:hidden divide-y divide-slate-100">
              {candidates.map((cand, idx) => {
                return (
                  <div key={cand.ticker || idx} className="p-3.5 space-y-2.5 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <TickerDetailDialog ticker={cand.ticker} className="text-sm font-black" />
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold border ${getBarrierBadgeStyle(cand.barrierCategory)}`}>
                            <Target className="w-2.5 h-2.5" />
                            {cand.barrierLabel}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {cand.stockName ? `${cand.stockName} • ` : ""}Turnover: {formatRupiah(cand.turnoverRupiah)}
                        </div>
                      </div>

                      <div className="flex flex-col items-end">
                        <div className="font-mono font-black text-slate-900 text-xs">
                          Rp {cand.currentPrice.toLocaleString("id-ID")}
                        </div>
                        <div className={`text-[10px] font-bold ${cand.changePercent >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                          {cand.changePercent >= 0 ? "+" : ""}{cand.changePercent.toFixed(1)}%
                        </div>
                      </div>
                    </div>

                    {/* VPA Signal Pill */}
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                      <div className="text-[10px] text-slate-400 font-medium">Sinyal Serapan & VPA:</div>
                      <div className="font-bold text-slate-800 text-[11px] mt-0.5">
                        {cand.vpaSignal}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Jarak ke benteng: <b>{cand.distanceToBarrierTicks} tick</b> ({cand.distanceToBarrierPercent.toFixed(1)}%)
                      </div>
                    </div>

                    {/* Plan Grid */}
                    <div className="grid grid-cols-3 gap-2 text-center p-2 rounded-xl bg-slate-50/70 border border-slate-100 text-xs">
                      <div>
                        <div className="text-[10px] text-slate-400 font-medium">Beli Sore</div>
                        <div className="font-black text-purple-700 font-mono text-[11px]">
                          {cand.buyZone}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 font-medium">TP1 / TP2</div>
                        <div className="font-black text-emerald-600 font-mono text-[11px]">
                          +{cand.targetPrice1Percent.toFixed(1)}% / +{cand.targetPrice2Percent.toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 font-medium">Stop Loss</div>
                        <div className="font-black text-rose-600 font-mono text-[11px]">
                          Rp {cand.stopLossPrice} ({cand.stopLossPercent.toFixed(1)}%)
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
