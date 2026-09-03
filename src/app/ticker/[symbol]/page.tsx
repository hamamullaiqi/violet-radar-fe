"use client";

import React, { useState, use } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Target,
  ShieldAlert,
  Zap,
  Activity,
  BarChart3,
  Globe2,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Award,
  Loader2,
  RefreshCw,
  Layers,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import useFetch from "@/hooks/useFetch";
import SearchTickers from "@/components/SearchTickers";
import TickerChart from "@/components/ticker/TickerChart";
import MarkdownNarrative from "@/components/ticker/MarkdownNarrative";
import TradingPlanSpotlight from "@/components/ticker/TradingPlanSpotlight";

// ─── Helpers ────────────────────────────────────────────
function fmtRp(val: number): string {
  const sign = val >= 0 ? "+" : "-";
  const abs = Math.abs(val);
  if (abs >= 1e12) return `${sign}Rp ${(abs / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${sign}Rp ${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}Rp ${(abs / 1e6).toFixed(2)}M`;
  return `${sign}Rp ${abs.toLocaleString("id-ID")}`;
}

function fmtPrice(val: number): string {
  return `Rp ${val?.toLocaleString("id-ID") || 0}`;
}

function pctColor(val: number): string {
  if (val > 0) return "text-emerald-600";
  if (val < 0) return "text-rose-600";
  return "text-slate-500";
}

function flowBadge(status: string) {
  switch (status) {
    case "STRONG_ACCUMULATION":
      return "border-emerald-300 bg-emerald-50 text-emerald-800";
    case "ACCUMULATION":
      return "border-green-300 bg-green-50 text-green-700";
    case "NEUTRAL":
      return "border-slate-200 bg-slate-50 text-slate-600";
    case "DISTRIBUTION":
      return "border-amber-300 bg-amber-50 text-amber-700";
    case "STRONG_DISTRIBUTION":
      return "border-rose-300 bg-rose-50 text-rose-800";
    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
}

function flowLabel(status: string): string {
  switch (status) {
    case "STRONG_ACCUMULATION":
      return "Akumulasi Kuat";
    case "ACCUMULATION":
      return "Akumulasi";
    case "NEUTRAL":
      return "Netral";
    case "DISTRIBUTION":
      return "Distribusi";
    case "STRONG_DISTRIBUTION":
      return "Distribusi Kuat";
    default:
      return status;
  }
}

function signalStatusBadge(status: string) {
  switch (status) {
    case "ACTIVE":
      return "border-blue-300 bg-blue-50 text-blue-700";
    case "PENDING":
      return "border-amber-300 bg-amber-50 text-amber-700";
    case "HIT_TP1":
      return "border-emerald-300 bg-emerald-50 text-emerald-700";
    case "HIT_TP2":
      return "border-indigo-300 bg-indigo-50 text-indigo-700";
    case "HIT_SL":
      return "border-rose-300 bg-rose-50 text-rose-700";
    case "EXPIRED":
      return "border-slate-300 bg-slate-50 text-slate-600";
    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
}

function verdictColor(outlook: string): string {
  if (outlook === "BULLISH") return "border-emerald-400 bg-emerald-50 text-emerald-800";
  if (outlook === "BEARISH") return "border-rose-400 bg-rose-50 text-rose-800";
  return "border-slate-300 bg-slate-50 text-slate-700";
}

function verdictLabel(outlook: string): string {
  if (outlook === "BULLISH") return "BULLISH 🚀";
  if (outlook === "BEARISH") return "BEARISH 🔻";
  return "SIDEWAYS ⚪";
}

function scoreColor(score: number): string {
  if (score >= 70) return "text-emerald-600";
  if (score >= 40) return "text-amber-600";
  return "text-rose-600";
}

type TabType = "overview" | "chart" | "signals" | "foreign" | "technical";

export default function TickerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const symbol = typeof params?.symbol === "string" ? params.symbol.toUpperCase() : "";

  const [activeTab, setActiveTab] = useState<TabType>("overview");

  const { data, loading, error, refetch } = useFetch(
    symbol ? `/api/market-data/idx/stock/${symbol.toLowerCase()}/analysis` : ""
  );

  const sm = data?.signalMetrics;
  const ps = data?.priceSummary;
  const ta = data?.trendAnalysis;
  const mi = data?.momentumIndicators;
  const ff = data?.foreignFlowAnalysis;
  const vpa = data?.vpaAnalysis;
  const kl = data?.keyLevels;
  const vd = data?.verdict;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* ── STICKY TOP APP BAR ── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 py-3 flex items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/60 transition-colors border border-slate-200/80"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Kembali ke Cockpit</span>
            <span className="sm:hidden">Cockpit</span>
          </Link>
          <div className="h-4 w-px bg-slate-200 hidden sm:block"></div>
          <div className="hidden md:flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Analisis Emiten:</span>
            <span className="font-extrabold text-sm text-slate-900 tracking-wide">{symbol}</span>
          </div>
        </div>

        {/* Search & Refresh Actions */}
        <div className="flex items-center gap-2">
          <SearchTickers />
          <button
            type="button"
            onClick={() => refetch()}
            title="Muat Ulang Data"
            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200/70"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-indigo-600" : ""}`} />
          </button>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-3" />
            <p className="text-slate-600 font-semibold text-base">
              Menganalisis data teknikal & bandarmologi {symbol}...
            </p>
            <p className="text-slate-400 text-xs mt-1">Mengambil sinyal, indikator momentum & arus asing</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-center max-w-lg mx-auto my-12">
            <ShieldAlert className="w-10 h-10 text-rose-500 mx-auto mb-2" />
            <h3 className="font-bold text-rose-900 text-base">Gagal Memuat Analisis {symbol}</h3>
            <p className="text-rose-700 text-xs mt-1">
              {typeof error === "string" ? error : (error as any)?.message || "Data saham tidak ditemukan."}
            </p>
            <div className="mt-4 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => refetch()}
                className="px-4 py-2 rounded-lg bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition-colors"
              >
                Coba Lagi
              </button>
              <Link
                href="/"
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-bold text-xs hover:bg-white transition-colors"
              >
                Kembali ke Beranda
              </Link>
            </div>
          </div>
        )}

        {/* Data Loaded Successfully */}
        {data && !loading && (
          <>
            {/* ── HERO BANNER ── */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                {/* Identity & Company */}
                <div className="flex items-start sm:items-center gap-4">
                  <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white font-black text-xl shadow-md shrink-0">
                    {symbol?.slice(0, 2)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                        {symbol}
                      </h1>
                      {vd && (
                        <Badge className={`${verdictColor(vd.outlook)} text-xs px-2.5 py-0.5 font-bold`}>
                          {verdictLabel(vd.outlook)}
                        </Badge>
                      )}
                      {vd && (
                        <span className={`text-xs font-extrabold px-2 py-0.5 rounded-md bg-slate-100 ${scoreColor(vd.score)}`}>
                          Skor {vd.score}/100
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-slate-500 text-xs font-medium">
                      <span>{data?.stockName || symbol}</span>
                      {data?.evalDate && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {data.evalDate}
                          </span>
                        </>
                      )}
                      {vd?.tradingPlan?.actionLabel && (
                        <>
                          <span>•</span>
                          <span className="font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                            {vd.tradingPlan.actionLabel.replace(/🚀|🟢|🟡|🔴/g, "").trim()}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Price & Change */}
                {ps && (
                  <div className="flex items-baseline lg:flex-col lg:items-end justify-between border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100">
                    <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                      {fmtPrice(ps.currentPrice)}
                    </div>
                    <div
                      className={`text-sm sm:text-base font-bold flex items-center gap-1 ${pctColor(ps.changePercent)}`}
                    >
                      {ps.changePercent >= 0 ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4" />
                      )}
                      <span>
                        {ps.changePercent >= 0 ? "+" : ""}
                        {ps.changePercent.toFixed(2)}%
                      </span>
                      <span className="text-xs font-medium text-slate-400">
                        ({ps.change >= 0 ? "+" : ""}
                        {ps.change.toLocaleString("id-ID")})
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Daily Stats Strip */}
              {ps && (
                <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 text-xs">
                  <div className="bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
                    <div className="text-[10px] uppercase font-semibold text-slate-400">Open</div>
                    <div className="font-bold text-slate-800 mt-0.5">{fmtPrice(ps.open)}</div>
                  </div>
                  <div className="bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
                    <div className="text-[10px] uppercase font-semibold text-slate-400">High</div>
                    <div className="font-bold text-emerald-600 mt-0.5">{fmtPrice(ps.high)}</div>
                  </div>
                  <div className="bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
                    <div className="text-[10px] uppercase font-semibold text-slate-400">Low</div>
                    <div className="font-bold text-rose-600 mt-0.5">{fmtPrice(ps.low)}</div>
                  </div>
                  <div className="bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
                    <div className="text-[10px] uppercase font-semibold text-slate-400">Volume</div>
                    <div className="font-bold text-slate-800 mt-0.5">
                      {(ps.volume / 100).toLocaleString("id-ID")} Lot
                    </div>
                  </div>
                  <div className="bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
                    <div className="text-[10px] uppercase font-semibold text-slate-400">Turnover</div>
                    <div className="font-bold text-indigo-700 mt-0.5">{ps.turnoverFormatted}</div>
                  </div>
                  <div className="bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
                    <div className="text-[10px] uppercase font-semibold text-slate-400">VWAP</div>
                    <div className="font-bold text-slate-800 mt-0.5">{fmtPrice(ps.vwap)}</div>
                  </div>
                </div>
              )}
            </div>

            {/* ── RESPONSIVE SEGMENTED NAVIGATION BAR ── */}
            <div className="sticky top-[57px] z-30 bg-slate-50/95 backdrop-blur-md pt-1 pb-2">
              <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-slate-200 shadow-xs overflow-x-auto no-scrollbar scroll-smooth">
                <NavPill
                  active={activeTab === "overview"}
                  onClick={() => setActiveTab("overview")}
                  icon={<BarChart3 className="w-4 h-4" />}
                  label="Overview"
                />
                <NavPill
                  active={activeTab === "chart"}
                  onClick={() => setActiveTab("chart")}
                  icon={<TrendingUp className="w-4 h-4" />}
                  label="Grafik"
                />
                <NavPill
                  active={activeTab === "signals"}
                  onClick={() => setActiveTab("signals")}
                  icon={<Zap className="w-4 h-4" />}
                  label="Signals"
                  badge={sm?.totalSignals ? `${sm.totalSignals}` : undefined}
                />
                <NavPill
                  active={activeTab === "foreign"}
                  onClick={() => setActiveTab("foreign")}
                  icon={<Globe2 className="w-4 h-4" />}
                  label="Foreign Flow"
                />
                <NavPill
                  active={activeTab === "technical"}
                  onClick={() => setActiveTab("technical")}
                  icon={<Activity className="w-4 h-4" />}
                  label="Teknikal & VPA"
                />
              </div>
            </div>

            {/* ━━━━━━━━━━ TAB CONTENT ━━━━━━━━━━ */}

            {/* 1. OVERVIEW TAB */}
            {activeTab === "overview" && (
              <div className="space-y-5 animate-in fade-in-50 duration-200">
                {/* 🎯 PROMINENT TRADING PLAN SPOTLIGHT */}
                {vd?.tradingPlan && (
                  <TradingPlanSpotlight
                    plan={vd.tradingPlan}
                    currentPrice={ps?.currentPrice}
                    onViewChart={() => setActiveTab("chart")}
                  />
                )}

                {/* Metric Summary Cards */}
                {sm && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <MiniCard
                      label="Total Signals"
                      value={sm.totalSignals}
                      sub={`${sm.activeSignals} Sinyal Aktif`}
                      icon={<Zap className="w-4 h-4 text-blue-500" />}
                    />
                    <MiniCard
                      label="Win Rate"
                      value={`${sm.winRatePercent}%`}
                      sub={`${sm.winSignals} Menang / ${sm.lossSignals} Kalah`}
                      icon={<Award className="w-4 h-4 text-amber-500" />}
                      valueColor={sm.winRatePercent >= 50 ? "text-emerald-600" : "text-rose-600"}
                    />
                    <MiniCard
                      label="Net PnL"
                      value={`${sm.netPnLPercent >= 0 ? "+" : ""}${sm.netPnLPercent}%`}
                      sub={`PF: ${sm.profitFactor}`}
                      icon={
                        sm.netPnLPercent >= 0 ? (
                          <TrendingUp className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-rose-500" />
                        )
                      }
                      valueColor={pctColor(sm.netPnLPercent)}
                    />
                    <MiniCard
                      label="Profit Factor"
                      value={sm.profitFactor}
                      sub={`Avg +${sm.avgGainPercent}% / ${sm.avgLossPercent}%`}
                      icon={<BarChart3 className="w-4 h-4 text-indigo-500" />}
                      valueColor={sm.profitFactor >= 1 ? "text-emerald-600" : "text-rose-600"}
                    />
                  </div>
                )}

                {/* Hit Rate Breakdown */}
                {sm && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <HitCard label="Hit TP1" count={sm.hitTp1Count} rate={sm.hitTp1Rate} color="emerald" />
                    <HitCard label="Hit TP2" count={sm.hitTp2Count} rate={sm.hitTp2Rate} color="indigo" />
                    <HitCard label="Hit SL" count={sm.hitSlCount} rate={sm.hitSlRate} color="rose" />
                    <HitCard label="Expired" count={sm.expiredCount} rate={sm.expiredRate} color="slate" />
                  </div>
                )}



                {/* Foreign Flow Quick Glance */}
                {ff && (
                  <Card className="border-slate-200 bg-white shadow-sm">
                    <CardHeader className="pb-3 border-b border-slate-100">
                      <CardTitle className="text-sm font-bold text-slate-800 flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Globe2 className="w-4 h-4 text-blue-500" />
                          Arus Dana Asing (Quick View)
                        </span>
                        <button
                          type="button"
                          onClick={() => setActiveTab("foreign")}
                          className="text-xs font-semibold text-indigo-600 hover:underline"
                        >
                          Lihat Detail Arus →
                        </button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                        {(["flow1D", "flow1W", "flow1M", "flow3M", "flowYTD"] as const).map((key) => {
                          const f = ff[key];
                          if (!f) return null;
                          return (
                            <div
                              key={key}
                              className="text-center p-3 rounded-xl border border-slate-100 bg-slate-50/60"
                            >
                              <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                                {key.replace("flow", "")}
                              </div>
                              <div className={`text-sm font-black ${pctColor(f.netValue)}`}>
                                {f.netValueFormatted}
                              </div>
                              <Badge
                                variant="outline"
                                className={`text-[9px] mt-1.5 px-1.5 py-0 ${flowBadge(f.status)}`}
                              >
                                {flowLabel(f.status)}
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Indonesian Narrative Analysis */}
                {vd?.summaryIndonesian && (
                  <Card className="border-slate-200 bg-white shadow-sm">
                    <CardHeader className="pb-3 border-b border-slate-100">
                      <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-indigo-600" />
                        Ringkasan Eksekutif & Narasi Pasar
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-5">
                      <MarkdownNarrative content={vd.summaryIndonesian} />
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* 2. GRAFIK TAB */}
            {activeTab === "chart" && (
              <div className="space-y-5 animate-in fade-in-50 duration-200">
                <TickerChart
                  ticker={symbol}
                  keyLevels={kl}
                  tradingPlan={vd?.tradingPlan}
                />

                {/* Key Price Levels Reference Grid */}
                {kl && (
                  <Card className="border-slate-200 bg-white shadow-sm">
                    <CardHeader className="pb-3 border-b border-slate-100">
                      <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <Target className="w-4 h-4 text-indigo-600" />
                        Level Kunci & Referensi Pivot
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                        <LevelCard label="Support 1" value={fmtPrice(kl.support1)} color="emerald" />
                        <LevelCard label="Support 2" value={fmtPrice(kl.support2)} color="green" />
                        <LevelCard label="Resistance 1" value={fmtPrice(kl.resistance1)} color="rose" />
                        <LevelCard label="Resistance 2" value={fmtPrice(kl.resistance2)} color="red" />
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <LevelCard label="52-Week High" value={fmtPrice(kl.high52Week)} color="indigo" />
                        <LevelCard label="52-Week Low" value={fmtPrice(kl.low52Week)} color="slate" />
                        <LevelCard
                          label="Jarak ke 52W High"
                          value={`${kl.distanceFrom52WeekHighPercent}%`}
                          color={kl.distanceFrom52WeekHighPercent > -5 ? "emerald" : "rose"}
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* 3. SIGNALS TAB */}
            {activeTab === "signals" && (
              <div className="space-y-4 animate-in fade-in-50 duration-200">
                {sm?.recentSignals?.length > 0 ? (
                  <Card className="border-slate-200 bg-white shadow-sm overflow-hidden">
                    <CardHeader className="pb-3 border-b border-slate-100">
                      <CardTitle className="text-sm font-bold text-slate-800 flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Activity className="w-4 h-4 text-blue-500" />
                          Histori Sinyal ({sm.recentSignals.length} Sinyal Terakhir)
                        </span>
                        <span className="text-xs text-slate-400 font-normal">
                          Win Rate: <b className="text-emerald-600">{sm.winRatePercent}%</b>
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      {/* Desktop Table View */}
                      <div className="hidden md:block overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-slate-50/80">
                              <TableHead className="text-xs font-bold">Tanggal</TableHead>
                              <TableHead className="text-xs font-bold">Strategi</TableHead>
                              <TableHead className="text-xs font-bold text-right">Entry</TableHead>
                              <TableHead className="text-xs font-bold text-right">TP1</TableHead>
                              <TableHead className="text-xs font-bold text-right">TP2</TableHead>
                              <TableHead className="text-xs font-bold text-right">SL</TableHead>
                              <TableHead className="text-xs font-bold text-center">Status</TableHead>
                              <TableHead className="text-xs font-bold text-right">PnL</TableHead>
                              <TableHead className="text-xs font-bold text-right">Hold</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {sm.recentSignals.map((sig: any, idx: number) => (
                              <TableRow key={sig.id || idx} className="hover:bg-slate-50/60">
                                <TableCell className="text-xs text-slate-600 whitespace-nowrap">
                                  {sig.signalDate}
                                </TableCell>
                                <TableCell className="text-xs">
                                  <span className="font-semibold text-slate-800">{sig.strategyType}</span>
                                  <span className="text-slate-400 ml-1">({sig.setupMode || "-"})</span>
                                </TableCell>
                                <TableCell className="text-xs text-right font-mono text-slate-700">
                                  {sig.entryPrice.toLocaleString("id-ID")}
                                </TableCell>
                                <TableCell className="text-xs text-right font-mono text-emerald-600">
                                  {sig.targetPrice1.toLocaleString("id-ID")}
                                </TableCell>
                                <TableCell className="text-xs text-right font-mono text-indigo-600">
                                  {sig.targetPrice2.toLocaleString("id-ID")}
                                </TableCell>
                                <TableCell className="text-xs text-right font-mono text-rose-600">
                                  {sig.stopLoss.toLocaleString("id-ID")}
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge
                                    variant="outline"
                                    className={`text-[10px] px-2 py-0.5 ${signalStatusBadge(sig.status)}`}
                                  >
                                    {sig.status}
                                  </Badge>
                                </TableCell>
                                <TableCell
                                  className={`text-xs text-right font-bold font-mono ${pctColor(sig.realizedPnLPercent || 0)}`}
                                >
                                  {sig.realizedPnLPercent !== undefined
                                    ? `${sig.realizedPnLPercent >= 0 ? "+" : ""}${sig.realizedPnLPercent}%`
                                    : "-"}
                                </TableCell>
                                <TableCell className="text-xs text-right text-slate-500">
                                  {sig.holdingDays !== undefined ? `${sig.holdingDays}d` : "-"}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Mobile Card List View */}
                      <div className="md:hidden divide-y divide-slate-100">
                        {sm.recentSignals.map((sig: any, idx: number) => (
                          <div key={sig.id || idx} className="p-4 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-slate-900">{sig.strategyType}</span>
                              <Badge
                                variant="outline"
                                className={`text-[10px] px-2 py-0.5 ${signalStatusBadge(sig.status)}`}
                              >
                                {sig.status}
                              </Badge>
                            </div>
                            <div className="text-[11px] text-slate-400">{sig.signalDate}</div>
                            <div className="grid grid-cols-4 gap-2 pt-1 font-mono text-xs text-center">
                              <div className="bg-slate-50 p-1.5 rounded">
                                <span className="block text-[9px] text-slate-400 font-sans">Entry</span>
                                {sig.entryPrice.toLocaleString("id-ID")}
                              </div>
                              <div className="bg-emerald-50 text-emerald-700 p-1.5 rounded">
                                <span className="block text-[9px] text-emerald-500 font-sans">TP1</span>
                                {sig.targetPrice1.toLocaleString("id-ID")}
                              </div>
                              <div className="bg-rose-50 text-rose-700 p-1.5 rounded">
                                <span className="block text-[9px] text-rose-500 font-sans">SL</span>
                                {sig.stopLoss.toLocaleString("id-ID")}
                              </div>
                              <div className="bg-indigo-50 text-indigo-700 p-1.5 rounded">
                                <span className="block text-[9px] text-indigo-500 font-sans">PnL</span>
                                {sig.realizedPnLPercent !== undefined
                                  ? `${sig.realizedPnLPercent >= 0 ? "+" : ""}${sig.realizedPnLPercent}%`
                                  : "-"}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="text-center py-16 bg-white rounded-xl border border-slate-200 text-slate-400 text-xs">
                    Belum ada sinyal terdaftar untuk {symbol}.
                  </div>
                )}
              </div>
            )}

            {/* 4. FOREIGN FLOW TAB */}
            {activeTab === "foreign" && (
              <div className="space-y-5 animate-in fade-in-50 duration-200">
                {ff && (
                  <>
                    <Card className="border-slate-200 bg-white shadow-sm overflow-hidden">
                      <CardHeader className="pb-3 border-b border-slate-100">
                        <CardTitle className="text-sm font-bold text-slate-800 flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <Globe2 className="w-4 h-4 text-blue-500" />
                            Arus Transaksi Asing Menurut Horizon
                          </span>
                          <Badge className={flowBadge(ff.status)}>
                            {flowLabel(ff.status)}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-slate-50/80">
                                <TableHead className="text-xs font-bold">Horizon</TableHead>
                                <TableHead className="text-xs font-bold text-right">Net Value</TableHead>
                                <TableHead className="text-xs font-bold text-right">Buy (IDR)</TableHead>
                                <TableHead className="text-xs font-bold text-right">Sell (IDR)</TableHead>
                                <TableHead className="text-xs font-bold text-center">Buy Days</TableHead>
                                <TableHead className="text-xs font-bold text-center">Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {(["flow1D", "flow1W", "flow1M", "flow3M", "flowYTD"] as const).map(
                                (key) => {
                                  const f = ff[key];
                                  if (!f) return null;
                                  return (
                                    <TableRow key={key} className="hover:bg-slate-50/60">
                                      <TableCell className="text-xs font-semibold text-slate-700">
                                        {f.label || key.replace("flow", "")}
                                      </TableCell>
                                      <TableCell
                                        className={`text-xs text-right font-black font-mono ${pctColor(f.netValue)}`}
                                      >
                                        {f.netValueFormatted}
                                      </TableCell>
                                      <TableCell className="text-xs text-right font-mono text-emerald-600">
                                        {f.buyValue ? fmtRp(f.buyValue).replace("+", "") : "-"}
                                      </TableCell>
                                      <TableCell className="text-xs text-right font-mono text-rose-600">
                                        {f.sellValue ? fmtRp(f.sellValue).replace("+", "").replace("-", "") : "-"}
                                      </TableCell>
                                      <TableCell className="text-xs text-center text-slate-600">
                                        {f.buyDays !== undefined ? `${f.buyDays}/${f.totalDays}` : "-"}
                                      </TableCell>
                                      <TableCell className="text-center">
                                        <Badge
                                          variant="outline"
                                          className={`text-[10px] px-2 py-0.5 ${flowBadge(f.status)}`}
                                        >
                                          {flowLabel(f.status)}
                                        </Badge>
                                      </TableCell>
                                    </TableRow>
                                  );
                                }
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Participation & Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <MiniCard
                        label="Net Asing 1 Hari"
                        value={ff.foreignNet1DFormatted}
                        sub="Volume harian asing"
                        icon={
                          ff.foreignNet1D >= 0 ? (
                            <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <ArrowDownRight className="w-4 h-4 text-rose-500" />
                          )
                        }
                        valueColor={pctColor(ff.foreignNet1D)}
                      />
                      <MiniCard
                        label="Buy Days (5 Hari)"
                        value={`${ff.foreignBuyDays5D}/5`}
                        sub="Konsistensi net buy mingguan"
                        icon={<BarChart3 className="w-4 h-4 text-indigo-500" />}
                      />
                      <MiniCard
                        label="Participation Rate"
                        value={`${ff.participationRate}%`}
                        sub="Pangsa turnover transaksi asing"
                        icon={<Globe2 className="w-4 h-4 text-blue-500" />}
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* 5. TEKNIKAL & VPA TAB */}
            {activeTab === "technical" && (
              <div className="space-y-5 animate-in fade-in-50 duration-200">
                {/* Trend Analysis */}
                {ta && (
                  <Card className="border-slate-200 bg-white shadow-sm">
                    <CardHeader className="pb-3 border-b border-slate-100">
                      <CardTitle className="text-sm font-bold text-slate-800 flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-blue-500" />
                          Analisis Tren & Struktur MA
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            ta.trendScore >= 70
                              ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                              : ta.trendScore >= 40
                              ? "border-amber-300 bg-amber-50 text-amber-700"
                              : "border-rose-300 bg-rose-50 text-rose-700"
                          }`}
                        >
                          Skor {ta.trendScore}/100
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-5">
                      <p className="text-xs text-slate-700 leading-relaxed mb-4">{ta.description}</p>
                      <div className="grid grid-cols-3 gap-3">
                        <MaRow label="MA20" value={ta.sma20} above={ta.isPriceAboveMa20} />
                        <MaRow label="MA50" value={ta.sma50} above={ta.isPriceAboveMa50} />
                        <MaRow label="MA200" value={ta.sma200} above={ta.isPriceAboveMa200} />
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Momentum Indicators */}
                {mi && (
                  <Card className="border-slate-200 bg-white shadow-sm">
                    <CardHeader className="pb-3 border-b border-slate-100">
                      <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-indigo-500" />
                        Indikator Momentum & Volatilitas
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-5">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {/* RSI */}
                        <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70">
                          <div className="text-[10px] font-bold text-slate-400 uppercase">RSI (14)</div>
                          <div
                            className={`text-xl font-black mt-0.5 ${
                              mi.rsi14 !== null && mi.rsi14 < 30
                                ? "text-blue-600"
                                : mi.rsi14 !== null && mi.rsi14 > 70
                                ? "text-rose-600"
                                : "text-slate-900"
                            }`}
                          >
                            {mi.rsi14 ?? "N/A"}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-1">
                            {mi.rsiLabel?.replace(/❄️|🟢|🔥|⚪/g, "").trim()}
                          </div>
                        </div>

                        {/* MACD */}
                        <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70">
                          <div className="text-[10px] font-bold text-slate-400 uppercase">MACD Hist</div>
                          <div
                            className={`text-xl font-black mt-0.5 ${
                              mi.macd.trend === "BULLISH"
                                ? "text-emerald-600"
                                : mi.macd.trend === "BEARISH"
                                ? "text-rose-600"
                                : "text-slate-900"
                            }`}
                          >
                            {mi.macd.histogram ?? "N/A"}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-1">
                            {mi.macd.label?.replace(/🟢|🔴/g, "").trim()}
                          </div>
                        </div>

                        {/* Volume Analysis */}
                        <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70">
                          <div className="text-[10px] font-bold text-slate-400 uppercase">Relative Volume</div>
                          <div className="text-xl font-black text-slate-900 mt-0.5">
                            {mi.volumeAnalysis?.relativeVolume ?? "N/A"}x
                          </div>
                          <div className="text-[11px] text-slate-500 mt-1">
                            {mi.volumeAnalysis?.label?.replace(/🔥|🟢|⚪|❄️/g, "").trim()}
                          </div>
                        </div>

                        {/* ATR */}
                        <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70">
                          <div className="text-[10px] font-bold text-slate-400 uppercase">ATR (14)</div>
                          <div className="text-xl font-black text-slate-900 mt-0.5">
                            {mi.atr14 ?? "N/A"}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-1">
                            Volatilitas {mi.atrPercent}% / hari
                          </div>
                        </div>
                      </div>

                      {/* Bollinger Bands */}
                      {mi.bollingerBands && (
                        <div className="mt-4 p-3.5 rounded-xl border border-slate-100 bg-slate-50/60">
                          <div className="text-[11px] font-bold text-slate-600 mb-2">
                            Bollinger Bands (20, 2)
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                            <div>Lower: <b className="text-rose-600">{mi.bollingerBands.lower}</b></div>
                            <div>Middle: <b className="text-slate-700">{mi.bollingerBands.middle}</b></div>
                            <div>Upper: <b className="text-emerald-600">{mi.bollingerBands.upper}</b></div>
                            <div>%B: <b className="text-indigo-600">{mi.bollingerBands.percentB}</b></div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Volume Price Analysis (VPA) */}
                {vpa && (
                  <Card className="border-slate-200 bg-white shadow-sm">
                    <CardHeader className="pb-3 border-b border-slate-100">
                      <CardTitle className="text-sm font-bold text-slate-800 flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <BarChart3 className="w-4 h-4 text-purple-600" />
                          Volume Price Analysis (VPA)
                        </span>
                        <Badge variant="outline" className={flowBadge(vpa.status)}>
                          {vpa.label?.replace(/🟢🟢|🟢|⚪|🔴🔴|🔴/g, "").trim()}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-5">
                      <p className="text-xs text-slate-600 mb-4">{vpa.summary}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                        {/* Accumulation Score */}
                        <div className="p-3.5 rounded-xl border border-emerald-100 bg-emerald-50/40">
                          <div className="text-xs font-bold text-emerald-700 mb-1">Skor Akumulasi</div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2.5 rounded-full bg-slate-200 overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full transition-all"
                                style={{ width: `${vpa.accumulationScore}%` }}
                              />
                            </div>
                            <span className="text-xs font-black text-emerald-700">{vpa.accumulationScore}%</span>
                          </div>
                        </div>

                        {/* Distribution Score */}
                        <div className="p-3.5 rounded-xl border border-rose-100 bg-rose-50/40">
                          <div className="text-xs font-bold text-rose-700 mb-1">Skor Distribusi</div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2.5 rounded-full bg-slate-200 overflow-hidden">
                              <div
                                className="h-full bg-rose-500 rounded-full transition-all"
                                style={{ width: `${vpa.distributionScore}%` }}
                              />
                            </div>
                            <span className="text-xs font-black text-rose-700">{vpa.distributionScore}%</span>
                          </div>
                        </div>
                      </div>

                      {/* Checklist items */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2 border-t border-slate-100">
                        <div>
                          <div className="font-bold text-emerald-700 mb-2">Kriteria Akumulasi:</div>
                          <ul className="space-y-1.5 text-slate-600">
                            <CheckItem active={vpa.accumulationChecks?.volumeRising} label="Volume meningkat saat harga naik" />
                            <CheckItem active={vpa.accumulationChecks?.priceHoldingSupport} label="Harga bertahan di atas support" />
                            <CheckItem active={vpa.accumulationChecks?.closeNearHigh} label="Penutupan dekat harga tertinggi (High)" />
                            <CheckItem active={vpa.accumulationChecks?.maTrendingUp} label="Moving average mengarah ke atas" />
                          </ul>
                        </div>
                        <div>
                          <div className="font-bold text-rose-700 mb-2">Peringatan Distribusi:</div>
                          <ul className="space-y-1.5 text-slate-600">
                            <WarnItem active={vpa.distributionWarnings?.volumeChurning} label="Volume churning (transaksi tinggi tanpa kenaikan)" />
                            <WarnItem active={vpa.distributionWarnings?.longUpperWick} label="Upper wick panjang (rejeksi harga atas)" />
                            <WarnItem active={vpa.distributionWarnings?.closeFarFromHigh} label="Penutupan jauh di bawah harga tertinggi" />
                            <WarnItem active={vpa.distributionWarnings?.failedBreakout} label="Gagal menembus resisten (False breakout)" />
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

// ─── Small UI Building Blocks ───

function NavPill({
  active,
  onClick,
  icon,
  label,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
        active
          ? "bg-indigo-600 text-white shadow-sm"
          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
      }`}
    >
      {icon}
      <span>{label}</span>
      {badge && (
        <span
          className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
            active ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
          }`}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

function MiniCard({
  label,
  value,
  sub,
  icon,
  valueColor,
}: {
  label: string;
  value: any;
  sub?: string;
  icon: React.ReactNode;
  valueColor?: string;
}) {
  return (
    <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-xs hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
          {label}
        </span>
        {icon}
      </div>
      <div className={`text-xl font-black ${valueColor || "text-slate-900"}`}>
        {value}
      </div>
      {sub && (
        <p className="text-[11px] text-slate-500 font-medium mt-0.5">{sub}</p>
      )}
    </div>
  );
}

function HitCard({
  label,
  count,
  rate,
  color,
}: {
  label: string;
  count: number;
  rate: number;
  color: string;
}) {
  const colorMap: Record<string, { bg: string; text: string; bar: string }> = {
    emerald: { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", bar: "bg-emerald-500" },
    indigo: { bg: "bg-indigo-50 border-indigo-200", text: "text-indigo-700", bar: "bg-indigo-500" },
    rose: { bg: "bg-rose-50 border-rose-200", text: "text-rose-700", bar: "bg-rose-500" },
    slate: { bg: "bg-slate-50 border-slate-200", text: "text-slate-600", bar: "bg-slate-400" },
  };
  const c = colorMap[color] || colorMap.slate;

  return (
    <div className={`p-3.5 rounded-xl border ${c.bg}`}>
      <div className="text-[10px] font-bold text-slate-400 uppercase">{label}</div>
      <div className={`text-2xl font-black mt-0.5 ${c.text}`}>{count}</div>
      <div className="flex items-center gap-1.5 mt-1.5">
        <div className="flex-1 h-1.5 rounded-full bg-slate-200 overflow-hidden">
          <div
            className={`h-full ${c.bar} rounded-full transition-all`}
            style={{ width: `${Math.min(rate, 100)}%` }}
          />
        </div>
        <span className={`text-[10px] font-bold ${c.text}`}>{rate}%</span>
      </div>
    </div>
  );
}

function LevelCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    blue: "border-blue-200 bg-blue-50/50",
    emerald: "border-emerald-200 bg-emerald-50/50",
    green: "border-green-200 bg-green-50/50",
    indigo: "border-indigo-200 bg-indigo-50/50",
    rose: "border-rose-200 bg-rose-50/50",
    red: "border-red-200 bg-red-50/50",
    slate: "border-slate-200 bg-slate-50/50",
  };
  return (
    <div className={`p-3 rounded-xl border ${colorMap[color] || colorMap.slate}`}>
      <div className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">{label}</div>
      <div className="text-xs sm:text-sm font-extrabold text-slate-800">{value}</div>
    </div>
  );
}

function MaRow({
  label,
  value,
  above,
}: {
  label: string;
  value: number | null;
  above: boolean;
}) {
  return (
    <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 text-center">
      <div className="text-[10px] font-bold text-slate-400 uppercase">{label}</div>
      <div className="text-sm font-black text-slate-800 mt-0.5">
        {value ? value.toLocaleString("id-ID") : "N/A"}
      </div>
      {value !== null && (
        <div className={`text-[10px] font-bold mt-0.5 ${above ? "text-emerald-600" : "text-rose-600"}`}>
          {above ? "Di atas ✓" : "Di bawah ✗"}
        </div>
      )}
    </div>
  );
}

function CheckItem({ active, label }: { active?: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2">
      {active ? (
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
      ) : (
        <span className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />
      )}
      <span className={active ? "text-slate-800 font-medium" : "text-slate-400"}>{label}</span>
    </li>
  );
}

function WarnItem({ active, label }: { active?: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2">
      {active ? (
        <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
      ) : (
        <span className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />
      )}
      <span className={active ? "text-rose-700 font-bold" : "text-slate-400"}>{label}</span>
    </li>
  );
}
