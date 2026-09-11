"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  AlertTriangle,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  Sparkles,
  RefreshCw,
  Clock,
  Compass,
  TrendingUp,
  Layers
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import useFetch from "@/hooks/useFetch";
import { formatRupiah } from "@/lib/utils";

interface BandarCostSpotlightProps {
  symbol: string;
  currentPrice?: number;
  className?: string;
}

export default function BandarCostSpotlight({
  symbol,
  currentPrice: propPrice,
  className = "",
}: BandarCostSpotlightProps) {
  const [period, setPeriod] = useState<"1W" | "1M" | "3M">("1M");

  const { data, loading, refetch } = useFetch(
    symbol ? `/api/market/smart-money-radar?ticker=${symbol.toUpperCase()}&period=${period}` : ""
  );

  const item = data?.items?.[0];
  const currentPrice = propPrice || item?.currentPrice || 0;
  const bandarAvgPrice = item?.bandarAvgPrice || 0;
  const distancePercent = item?.distancePercent !== undefined ? item.distancePercent : 0;
  const totalForeignNetLot = item?.totalForeignNetLot !== undefined ? item.totalForeignNetLot : 0;
  const totalForeignNetRupiah = item?.totalForeignNetRupiah !== undefined ? item.totalForeignNetRupiah : 0;
  const dominancePercent = item?.smartMoneyDominancePercent || 0;
  const consistency = item?.accumulationConsistency || "-";
  const flowCharacter = item?.flowCharacter || "Netral";
  const status = item?.entryRecommendation?.status || "SAFE_ENTRY";
  const statusLabel = item?.entryRecommendation?.label || "🟢 AMAN MASUK";
  const statusDesc = item?.entryRecommendation?.description || "";

  // Visual status theme for clean light UI
  const getTheme = (s: string) => {
    switch (s) {
      case "DISCOUNT_BUY":
        return {
          bannerBg: "bg-emerald-50/80 border-emerald-200 text-emerald-900",
          badge: "border-emerald-300 bg-emerald-100/80 text-emerald-800",
          pillBg: "bg-emerald-600 text-white",
          dot: "bg-emerald-500",
          textColor: "text-emerald-700",
          tag: "Harga Diskon",
        };
      case "SAFE_ENTRY":
        return {
          bannerBg: "bg-cyan-50/70 border-cyan-200 text-cyan-950",
          badge: "border-cyan-300 bg-cyan-100/70 text-cyan-800",
          pillBg: "bg-cyan-600 text-white",
          dot: "bg-cyan-500",
          textColor: "text-cyan-700",
          tag: "Aman Masuk",
        };
      case "WATCH_PULLBACK":
        return {
          bannerBg: "bg-amber-50/80 border-amber-200 text-amber-950",
          badge: "border-amber-300 bg-amber-100 text-amber-800",
          pillBg: "bg-amber-500 text-white",
          dot: "bg-amber-500",
          textColor: "text-amber-700",
          tag: "Tunggu Pullback",
        };
      case "OVERBOUGHT":
      case "DISTRIBUTION":
        return {
          bannerBg: "bg-rose-50/80 border-rose-200 text-rose-950",
          badge: "border-rose-300 bg-rose-100 text-rose-800",
          pillBg: "bg-rose-600 text-white",
          dot: "bg-rose-500",
          textColor: "text-rose-700",
          tag: s === "DISTRIBUTION" ? "Distribusi" : "Overbought",
        };
      default:
        return {
          bannerBg: "bg-slate-50 border-slate-200 text-slate-800",
          badge: "border-slate-300 bg-slate-100 text-slate-700",
          pillBg: "bg-slate-700 text-white",
          dot: "bg-slate-400",
          textColor: "text-slate-700",
          tag: "Netral",
        };
    }
  };

  const theme = getTheme(status);

  // Position calculation for visual range bar (-6% to +14% scale)
  const minRange = -6;
  const maxRange = 14;
  const clampedDist = Math.min(Math.max(distancePercent, minRange), maxRange);
  const pointerPosPercent = ((clampedDist - minRange) / (maxRange - minRange)) * 100;

  return (
    <Card className={`border border-slate-200/90 bg-white shadow-xs rounded-2xl overflow-hidden ${className}`}>
      {/* Header Bar */}
      <CardHeader className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 shadow-2xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-base font-extrabold text-slate-900 tracking-tight">
                  Radar Modal Bandar (Smart Money)
                </CardTitle>
                <Badge
                  variant="outline"
                  className={`text-xs font-bold px-2.5 py-0.5 border ${theme.badge}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${theme.dot}`} />
                  {statusLabel}
                </Badge>
              </div>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Estimasi harga modal akumulasi bandar/asing & verifikasi kelayakan entry {symbol}
              </CardDescription>
            </div>
          </div>

          {/* Period Selector Tabs */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="bg-slate-100/90 p-0.5 rounded-xl flex items-center border border-slate-200/80">
              {(["1W", "1M", "3M"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                    period === p
                      ? "bg-white text-indigo-700 shadow-xs border border-slate-200/60 font-black"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <span>{p === "1W" ? "1 Minggu" : p === "1M" ? "1 Bulan" : "3 Bulan"}</span>
                  {p === "1M" && (
                    <span className="text-[10px] text-amber-600 font-extrabold bg-amber-50 px-1 rounded border border-amber-200">
                      Utama ⭐
                    </span>
                  )}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => refetch()}
              title="Refresh Radar Data"
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-indigo-600 hover:border-indigo-200 transition-colors shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-indigo-600" : ""}`} />
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 space-y-4">
        {/* Executive Verdict Banner */}
        <div className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${theme.bannerBg}`}>
          <div className="flex items-start gap-2.5">
            <div className="mt-0.5">
              {status === "DISCOUNT_BUY" && <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />}
              {status === "SAFE_ENTRY" && <ShieldCheck className="w-4 h-4 text-cyan-600 shrink-0" />}
              {status === "WATCH_PULLBACK" && <Clock className="w-4 h-4 text-amber-600 shrink-0" />}
              {(status === "OVERBOUGHT" || status === "DISTRIBUTION") && (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
            </div>
            <div className="space-y-0.5">
              <span className="font-extrabold uppercase tracking-wide text-[11px] block">
                Kesimpulan Radar ({period === "1W" ? "5 Hari" : period === "1M" ? "20 Hari" : "60 Hari"}):
              </span>
              <p className="font-medium leading-relaxed opacity-95">
                {statusDesc || "Sedang menganalisis posisi rata-rata akumulasi smart money..."}
              </p>
            </div>
          </div>

          <div className="shrink-0 sm:border-l sm:border-current/15 sm:pl-3.5 text-right sm:text-left">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Karakter Arus</span>
            <span className="font-bold text-slate-900 text-xs">{flowCharacter}</span>
          </div>
        </div>

        {/* 4 Clean Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Card 1: Modal Rata-rata Bandar */}
          <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500">Modal Rata-rata Bandar</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="bg-slate-900 text-white text-xs p-2 max-w-xs">
                    Harga beli rata-rata tertimbang (VWAP Asing/Smart Money) selama periode {period}.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="text-xl font-black font-mono text-slate-900 my-1">
              {bandarAvgPrice > 0 ? `Rp ${bandarAvgPrice.toLocaleString("id-ID")}` : "-"}
            </div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
              <span>Saat ini:</span>
              <b className="text-slate-800 font-mono">Rp {currentPrice.toLocaleString("id-ID")}</b>
            </div>
          </div>

          {/* Card 2: Selisih ke Modal Bandar */}
          <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500">Jarak Terhadap Modal</span>
              <span className="text-[10px] font-bold text-slate-400">Batas: ≤ +3.5%</span>
            </div>
            <div
              className={`text-xl font-black font-mono my-1 flex items-center gap-1 ${
                distancePercent < 0
                  ? "text-emerald-600"
                  : distancePercent <= 3.5
                  ? "text-cyan-700"
                  : distancePercent <= 8.5
                  ? "text-amber-600"
                  : "text-rose-600"
              }`}
            >
              {distancePercent >= 0 ? (
                <ArrowUpRight className="w-4 h-4 shrink-0" />
              ) : (
                <ArrowDownRight className="w-4 h-4 shrink-0" />
              )}
              <span>{distancePercent >= 0 ? `+${distancePercent}%` : `${distancePercent}%`}</span>
            </div>
            <div className="text-[11px] font-medium text-slate-500">
              {distancePercent < 0
                ? "🟢 Diskon di bawah bandar"
                : distancePercent <= 3.5
                ? "🟢 Sangat dekat modal"
                : distancePercent <= 8.5
                ? "🟡 Mulai floating tinggi"
                : "🔴 Terbang jauh dari modal"}
            </div>
          </div>

          {/* Card 3: Net Akumulasi */}
          <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500">Akumulasi Bersih ({period})</span>
              <span className="text-[10px] text-slate-400 font-medium">Lot & Nilai</span>
            </div>
            <div
              className={`text-xl font-black font-mono my-1 ${
                totalForeignNetLot >= 0 ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {totalForeignNetLot >= 0 ? "+" : ""}
              {totalForeignNetLot.toLocaleString("id-ID")} Lot
            </div>
            <div className="text-[11px] font-mono text-slate-500">
              Nilai:{" "}
              <b className={totalForeignNetRupiah >= 0 ? "text-emerald-700" : "text-rose-700"}>
                {formatRupiah(totalForeignNetRupiah)}
              </b>
            </div>
          </div>

          {/* Card 4: Dominasi & Konsistensi */}
          <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500">Dominasi Smart Money</span>
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded">
                Turnover
              </span>
            </div>
            <div className="text-xl font-black font-mono text-slate-900 my-1">
              {dominancePercent}%
            </div>
            <div className="text-[11px] text-slate-500 flex items-center justify-between font-medium">
              <span>Konsistensi:</span>
              <b className="text-slate-800 font-mono">{consistency}</b>
            </div>
          </div>
        </div>

        {/* Clean, Sleek Visual Position Gauge */}
        <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/40 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-indigo-600" />
              Posisi Harga Terhadap Rentang Modal Bandar
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              Jarak:{" "}
              <b className="text-slate-900">
                {distancePercent >= 0 ? `+${distancePercent}%` : `${distancePercent}%`} dari Modal Bandar
              </b>
            </span>
          </div>

          {/* Range Track with Dynamic Marker */}
          <div className="relative pt-6 pb-2">
            {/* Horizontal Bar with 4 Clear Zones */}
            <div className="h-3 rounded-full overflow-hidden flex bg-slate-200 shadow-inner">
              <div
                style={{ width: "30%" }}
                className="bg-emerald-400 h-full border-r border-white/40"
                title="Zona Diskon (< 0%)"
              />
              <div
                style={{ width: "25%" }}
                className="bg-cyan-400 h-full border-r border-white/40"
                title="Zona Aman Masuk (0 - 3.5%)"
              />
              <div
                style={{ width: "25%" }}
                className="bg-amber-400 h-full border-r border-white/40"
                title="Zona Waspada (3.5 - 8.5%)"
              />
              <div
                style={{ width: "20%" }}
                className="bg-rose-400 h-full"
                title="Zona Overbought (> 8.5%)"
              />
            </div>

            {/* Price Pointer */}
            <div
              className="absolute top-0 -translate-x-1/2 flex flex-col items-center transition-all duration-300 z-10"
              style={{ left: `${pointerPosPercent}%` }}
            >
              <div className="px-2 py-0.5 rounded-md bg-slate-900 text-white font-mono font-extrabold text-[10px] shadow-sm whitespace-nowrap">
                Rp {currentPrice.toLocaleString("id-ID")}
              </div>
              <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px] border-t-slate-900" />
            </div>

            {/* Labels under track */}
            <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-1.5">
              <span className="text-emerald-700">Diskon (&lt; 0%)</span>
              <span className="text-cyan-800">Aman (0 - 3.5%)</span>
              <span className="text-amber-700">Waspada (3.5 - 8.5%)</span>
              <span className="text-rose-700">Overbought (&gt; 8.5%)</span>
            </div>
          </div>
        </div>

        {/* Actionable Strategy Guidance */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs text-slate-600 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-bold text-[10px] uppercase">
              Action Plan
            </span>
            <p className="font-medium text-slate-700">
              {distancePercent <= 3.5 && totalForeignNetLot >= 0 ? (
                <span>
                  Harga selevel dengan modal akumulasi bandar (Rp {bandarAvgPrice.toLocaleString("id-ID")}). Ideal untuk entry bertahap dengan Stop Loss di bawah Rp {Math.round(bandarAvgPrice * 0.96).toLocaleString("id-ID")}.
                </span>
              ) : distancePercent > 8.5 ? (
                <span>
                  Harga sudah terlalu jauh di atas modal rata-rata bandar (+{distancePercent}%). Lebih bijak menunggu koreksi (pullback) mendekati modal bandar.
                </span>
              ) : (
                <span>
                  Disarankan disiplin trading plan dan memperhatikan konfirmasi volume penembusan breakout.
                </span>
              )}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
