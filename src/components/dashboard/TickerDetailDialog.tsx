"use client";

import React, { useState, useEffect, Fragment } from "react";
import {
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
  Minus,
  Clock,
  Award,
  Loader2,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/api";
import useFetch from "@/hooks/useFetch";

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
  return `Rp ${val.toLocaleString("id-ID")}`;
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

// ─── Component ──────────────────────────────────────────
interface TickerDetailDialogProps {
  ticker: string | null;
}

export default function TickerDetailDialog({

  ticker,
}: TickerDetailDialogProps) {

  const [open, setOpen] = useState<boolean>(false);

  if (!ticker) return null;

  const { data, loading, error } = useFetch(open ? `/api/market-data/idx/stock/${ticker.toLowerCase()}/analysis` : "");

  const sm = data?.signalMetrics;
  const ps = data?.priceSummary;
  const ta = data?.trendAnalysis;
  const mi = data?.momentumIndicators;
  const ff = data?.foreignFlowAnalysis;
  const vpa = data?.vpaAnalysis;
  const kl = data?.keyLevels;
  const vd = data?.verdict;

  return (
    <Fragment>
      <div
        className="font-bold text-slate-900 cursor-pointer hover:text-indigo-600 hover:underline transition-colors"
        onClick={() => {
          setOpen(true);
        }}
      >
        {ticker}
      </div>
      <Dialog open={open} onOpenChange={() => setOpen(!open)}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-0 gap-0 bg-white border-slate-200">
          {/* ── HEADER ── */}
          <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-6 pt-5 pb-4">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-11 h-11 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-sm shadow-md">
                    {ticker?.slice(0, 2)}
                  </div>
                  <div>
                    <DialogTitle className="text-xl font-bold text-slate-900 tracking-tight">
                      {ticker?.toUpperCase()}
                    </DialogTitle>
                    <DialogDescription className="text-sm text-slate-500 mt-0.5">
                      {data?.stockName || "Memuat..."}
                      {data?.evalDate && (
                        <span className="ml-2 text-slate-400">• {data.evalDate}</span>
                      )}
                    </DialogDescription>
                  </div>
                </div>

                {/* Price + Change */}
                {ps && (
                  <div className="text-right">
                    <div className="text-xl font-extrabold text-slate-900">
                      {fmtPrice(ps.currentPrice)}
                    </div>
                    <div
                      className={`text-sm font-semibold flex items-center justify-end gap-1 ${pctColor(ps.changePercent)}`}
                    >
                      {ps.changePercent >= 0 ? (
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      ) : (
                        <ArrowDownRight className="w-3.5 h-3.5" />
                      )}
                      {ps.changePercent >= 0 ? "+" : ""}
                      {ps.changePercent.toFixed(2)}%
                    </div>
                  </div>
                )}
              </div>

              {/* Verdict row */}
              {vd && (
                <div className="flex items-center gap-2 mt-3">
                  <Badge className={verdictColor(vd.outlook)}>
                    {verdictLabel(vd.outlook)}
                  </Badge>
                  <span className={`text-sm font-bold ${scoreColor(vd.score)}`}>
                    Skor {vd.score}/100
                  </span>
                  <Badge variant="outline" className="text-[11px] border-slate-300">
                    {vd.tradingPlan?.actionLabel?.replace(/🚀|🟢|🟡|🔴/g, "").trim()}
                  </Badge>
                </div>
              )}
            </DialogHeader>
          </div>

          {/* ── BODY ── */}
          <div className="px-6 pb-6">
            {loading && (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-7 h-7 animate-spin text-indigo-500" />
                <span className="ml-3 text-slate-500 font-medium">Menganalisis {ticker?.toUpperCase()}...</span>
              </div>
            )}

            {error && (
              <div className="flex items-center justify-center py-20 text-rose-500 font-medium">
                <ShieldAlert className="w-5 h-5 mr-2" />
                <p>{error.toString()}</p>
              </div>
            )}

            {data && !loading && (
              <Tabs defaultValue="overview" className="mt-4">
                <TabsList className="grid w-full grid-cols-4 bg-slate-100/80 rounded-lg p-1">
                  <TabsTrigger value="overview" className="text-xs font-semibold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    📊 Overview
                  </TabsTrigger>
                  <TabsTrigger value="signals" className="text-xs font-semibold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    🎯 Signals
                  </TabsTrigger>
                  <TabsTrigger value="foreign" className="text-xs font-semibold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    🌊 Foreign Flow
                  </TabsTrigger>
                  <TabsTrigger value="technical" className="text-xs font-semibold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    ⚡ Teknikal
                  </TabsTrigger>
                </TabsList>

                {/* ━━━━━━━━━━ TAB: OVERVIEW ━━━━━━━━━━ */}
                <TabsContent value="overview" className="mt-4 space-y-4">
                  {/* Signal Metrics Grid */}
                  {sm && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <MiniCard
                        label="Total Signals"
                        value={sm.totalSignals}
                        sub={`${sm.activeSignals} Aktif`}
                        icon={<Zap className="w-4 h-4 text-blue-500" />}
                      />
                      <MiniCard
                        label="Win Rate"
                        value={`${sm.winRatePercent}%`}
                        sub={`${sm.winSignals}W / ${sm.lossSignals}L`}
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
                    <div className="grid grid-cols-4 gap-3">
                      <HitCard label="Hit TP1" count={sm.hitTp1Count} rate={sm.hitTp1Rate} color="emerald" />
                      <HitCard label="Hit TP2" count={sm.hitTp2Count} rate={sm.hitTp2Rate} color="indigo" />
                      <HitCard label="Hit SL" count={sm.hitSlCount} rate={sm.hitSlRate} color="rose" />
                      <HitCard label="Expired" count={sm.expiredCount} rate={sm.expiredRate} color="slate" />
                    </div>
                  )}

                  {/* Foreign Flow Quick Glance */}
                  {ff && (
                    <Card className="border-slate-200 bg-white shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                          <Globe2 className="w-4 h-4 text-blue-500" />
                          Arus Dana Asing (Quick View)
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-5 gap-2">
                          {(["flow1D", "flow1W", "flow1M", "flow3M", "flowYTD"] as const).map(
                            (key) => {
                              const f = ff[key];
                              if (!f) return null;
                              return (
                                <div
                                  key={key}
                                  className="text-center p-2.5 rounded-lg border border-slate-100 bg-slate-50/50"
                                >
                                  <div className="text-[10px] font-semibold text-slate-400 uppercase mb-1">
                                    {key.replace("flow", "")}
                                  </div>
                                  <div
                                    className={`text-xs font-bold ${pctColor(f.netValue)}`}
                                  >
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
                            }
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Trading Plan */}
                  {vd?.tradingPlan && (
                    <Card className="border-slate-200 bg-white shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                          <Target className="w-4 h-4 text-emerald-500" />
                          Rencana Trading
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <LevelCard
                            label="Entry Zone"
                            value={`${fmtPrice(vd.tradingPlan.entryArea.min)} – ${fmtPrice(vd.tradingPlan.entryArea.max)}`}
                            color="blue"
                          />
                          <LevelCard
                            label="Target 1"
                            value={`${fmtPrice(vd.tradingPlan.targetPrice1)} (+${vd.tradingPlan.targetPrice1Percent}%)`}
                            color="emerald"
                          />
                          <LevelCard
                            label="Target 2"
                            value={`${fmtPrice(vd.tradingPlan.targetPrice2)} (+${vd.tradingPlan.targetPrice2Percent}%)`}
                            color="indigo"
                          />
                          <LevelCard
                            label="Stop Loss"
                            value={`${fmtPrice(vd.tradingPlan.stopLoss)} (-${vd.tradingPlan.stopLossPercent}%)`}
                            color="rose"
                          />
                        </div>
                        <div className="mt-3 text-center text-xs text-slate-500">
                          Risk-Reward Ratio:{" "}
                          <span className="font-bold text-slate-700">
                            1 : {vd.tradingPlan.riskRewardRatio}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* ━━━━━━━━━━ TAB: SIGNALS ━━━━━━━━━━ */}
                <TabsContent value="signals" className="mt-4">
                  {sm?.recentSignals?.length > 0 ? (
                    <Card className="border-slate-200 bg-white shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                          <Activity className="w-4 h-4 text-blue-500" />
                          10 Sinyal Terakhir — {ticker?.toUpperCase()}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-slate-50/80">
                                <TableHead className="text-[11px] font-bold">Tanggal</TableHead>
                                <TableHead className="text-[11px] font-bold">Strategi</TableHead>
                                <TableHead className="text-[11px] font-bold text-right">Entry</TableHead>
                                <TableHead className="text-[11px] font-bold text-right">TP1</TableHead>
                                <TableHead className="text-[11px] font-bold text-right">TP2</TableHead>
                                <TableHead className="text-[11px] font-bold text-right">SL</TableHead>
                                <TableHead className="text-[11px] font-bold text-center">Status</TableHead>
                                <TableHead className="text-[11px] font-bold text-right">PnL</TableHead>
                                <TableHead className="text-[11px] font-bold text-right">Hold</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {sm.recentSignals.map((sig: any, idx: number) => (
                                <TableRow
                                  key={sig.id || idx}
                                  className="hover:bg-slate-50/60 transition-colors"
                                >
                                  <TableCell className="text-[11px] text-slate-600 whitespace-nowrap">
                                    {sig.signalDate}
                                  </TableCell>
                                  <TableCell className="text-[11px]">
                                    <span className="font-semibold text-slate-800">{sig.strategyType}</span>
                                    <span className="text-slate-400 ml-1">({sig.setupMode || "-"})</span>
                                  </TableCell>
                                  <TableCell className="text-[11px] text-right font-mono text-slate-700">
                                    {sig.entryPrice.toLocaleString("id-ID")}
                                  </TableCell>
                                  <TableCell className="text-[11px] text-right font-mono text-emerald-600">
                                    {sig.targetPrice1.toLocaleString("id-ID")}
                                  </TableCell>
                                  <TableCell className="text-[11px] text-right font-mono text-indigo-600">
                                    {sig.targetPrice2.toLocaleString("id-ID")}
                                  </TableCell>
                                  <TableCell className="text-[11px] text-right font-mono text-rose-600">
                                    {sig.stopLoss.toLocaleString("id-ID")}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <Badge
                                      variant="outline"
                                      className={`text-[10px] px-1.5 py-0 ${signalStatusBadge(sig.status)}`}
                                    >
                                      {sig.status}
                                    </Badge>
                                  </TableCell>
                                  <TableCell
                                    className={`text-[11px] text-right font-bold font-mono ${pctColor(sig.realizedPnLPercent || 0)}`}
                                  >
                                    {sig.realizedPnLPercent !== undefined
                                      ? `${sig.realizedPnLPercent >= 0 ? "+" : ""}${sig.realizedPnLPercent}%`
                                      : "-"}
                                  </TableCell>
                                  <TableCell className="text-[11px] text-right text-slate-500">
                                    {sig.holdingDays !== undefined ? `${sig.holdingDays}d` : "-"}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="text-center py-12 text-slate-400">
                      Belum ada sinyal untuk {ticker?.toUpperCase()}.
                    </div>
                  )}
                </TabsContent>

                {/* ━━━━━━━━━━ TAB: FOREIGN FLOW ━━━━━━━━━━ */}
                <TabsContent value="foreign" className="mt-4 space-y-4">
                  {ff && (
                    <>
                      {/* Summary Card */}
                      <Card className="border-slate-200 bg-white shadow-sm">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                            <Globe2 className="w-4 h-4 text-blue-500" />
                            Akumulasi & Distribusi Asing
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-slate-50/80">
                                  <TableHead className="text-[11px] font-bold">Horizon</TableHead>
                                  <TableHead className="text-[11px] font-bold text-right">Net Value</TableHead>
                                  <TableHead className="text-[11px] font-bold text-right">Buy</TableHead>
                                  <TableHead className="text-[11px] font-bold text-right">Sell</TableHead>
                                  <TableHead className="text-[11px] font-bold text-center">Buy Days</TableHead>
                                  <TableHead className="text-[11px] font-bold text-center">Status</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {(["flow1D", "flow1W", "flow1M", "flow3M", "flowYTD"] as const).map(
                                  (key) => {
                                    const f = ff[key];
                                    if (!f) return null;
                                    return (
                                      <TableRow key={key} className="hover:bg-slate-50/60">
                                        <TableCell className="text-[11px] font-semibold text-slate-700">
                                          {f.label || key.replace("flow", "")}
                                        </TableCell>
                                        <TableCell
                                          className={`text-[11px] text-right font-bold font-mono ${pctColor(f.netValue)}`}
                                        >
                                          {f.netValueFormatted}
                                        </TableCell>
                                        <TableCell className="text-[11px] text-right font-mono text-emerald-600">
                                          {f.buyValue ? fmtRp(f.buyValue).replace("+", "") : "-"}
                                        </TableCell>
                                        <TableCell className="text-[11px] text-right font-mono text-rose-600">
                                          {f.sellValue ? fmtRp(f.sellValue).replace("+", "").replace("-", "") : "-"}
                                        </TableCell>
                                        <TableCell className="text-[11px] text-center text-slate-600">
                                          {f.buyDays !== undefined ? `${f.buyDays}/${f.totalDays}` : "-"}
                                        </TableCell>
                                        <TableCell className="text-center">
                                          <Badge
                                            variant="outline"
                                            className={`text-[9px] px-1.5 py-0 ${flowBadge(f.status)}`}
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

                      {/* Participation */}
                      <div className="grid grid-cols-3 gap-3">
                        <MiniCard
                          label="Net Asing 1D"
                          value={ff.foreignNet1DFormatted}
                          sub="Hari ini"
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
                          label="Buy Days (5D)"
                          value={`${ff.foreignBuyDays5D}/5`}
                          sub="Frekuensi net buy mingguan"
                          icon={<BarChart3 className="w-4 h-4 text-indigo-500" />}
                        />
                        <MiniCard
                          label="Participation Rate"
                          value={`${ff.participationRate}%`}
                          sub="% turnover oleh asing"
                          icon={<Globe2 className="w-4 h-4 text-blue-500" />}
                        />
                      </div>
                    </>
                  )}
                </TabsContent>

                {/* ━━━━━━━━━━ TAB: TECHNICAL ━━━━━━━━━━ */}
                <TabsContent value="technical" className="mt-4 space-y-4">
                  {/* Trend */}
                  {ta && (
                    <Card className="border-slate-200 bg-white shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-blue-500" />
                          Analisis Tren
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-3 mb-3">
                          <Badge variant="outline" className={`text-xs ${ta.trendScore >= 70 ? "border-emerald-300 bg-emerald-50 text-emerald-700" : ta.trendScore >= 40 ? "border-amber-300 bg-amber-50 text-amber-700" : "border-rose-300 bg-rose-50 text-rose-700"}`}>
                            {ta.label?.replace(/🚀|🟢|🟡|🔻|⚪|🔴/g, "").trim()}
                          </Badge>
                          <span className={`text-sm font-bold ${scoreColor(ta.trendScore)}`}>
                            Skor {ta.trendScore}/100
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">{ta.description}</p>
                        <div className="grid grid-cols-3 gap-2 mt-3">
                          <MaRow label="MA20" value={ta.sma20} above={ta.isPriceAboveMa20} />
                          <MaRow label="MA50" value={ta.sma50} above={ta.isPriceAboveMa50} />
                          <MaRow label="MA200" value={ta.sma200} above={ta.isPriceAboveMa200} />
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Momentum */}
                  {mi && (
                    <Card className="border-slate-200 bg-white shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                          <Activity className="w-4 h-4 text-indigo-500" />
                          Indikator Momentum
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-3">
                          {/* RSI */}
                          <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                            <div className="text-[10px] font-semibold text-slate-400 uppercase mb-1">RSI (14)</div>
                            <div className={`text-lg font-extrabold ${mi.rsi14 !== null && mi.rsi14 < 30 ? "text-blue-600" : mi.rsi14 !== null && mi.rsi14 > 70 ? "text-rose-600" : "text-slate-800"}`}>
                              {mi.rsi14 ?? "N/A"}
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              {mi.rsiLabel?.replace(/❄️|🟢|🔥|⚪/g, "").trim()}
                            </div>
                          </div>

                          {/* MACD */}
                          <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                            <div className="text-[10px] font-semibold text-slate-400 uppercase mb-1">MACD</div>
                            <div className={`text-lg font-extrabold ${mi.macd.trend === "BULLISH" ? "text-emerald-600" : mi.macd.trend === "BEARISH" ? "text-rose-600" : "text-slate-800"}`}>
                              {mi.macd.histogram ?? "N/A"}
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              {mi.macd.label?.replace(/🟢|🔴/g, "").trim()}
                            </div>
                          </div>

                          {/* Volume */}
                          <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                            <div className="text-[10px] font-semibold text-slate-400 uppercase mb-1">Relative Volume</div>
                            <div className="text-lg font-extrabold text-slate-800">
                              {mi.volumeAnalysis?.relativeVolume ?? "N/A"}x
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              {mi.volumeAnalysis?.label?.replace(/🔥|🟢|⚪|❄️/g, "").trim()}
                            </div>
                          </div>

                          {/* ATR */}
                          <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                            <div className="text-[10px] font-semibold text-slate-400 uppercase mb-1">ATR (14)</div>
                            <div className="text-lg font-extrabold text-slate-800">
                              {mi.atr14 ?? "N/A"}
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              Volatilitas {mi.atrPercent}% per hari
                            </div>
                          </div>
                        </div>

                        {/* Bollinger */}
                        {mi.bollingerBands && (
                          <div className="mt-3 p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                            <div className="text-[10px] font-semibold text-slate-400 uppercase mb-2">Bollinger Bands (20, 2)</div>
                            <div className="flex items-center justify-between text-xs text-slate-600">
                              <span>Lower: <b className="text-rose-600">{mi.bollingerBands.lower}</b></span>
                              <span>Mid: <b>{mi.bollingerBands.middle}</b></span>
                              <span>Upper: <b className="text-emerald-600">{mi.bollingerBands.upper}</b></span>
                              <span>%B: <b className="text-indigo-600">{mi.bollingerBands.percentB}</b></span>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* VPA */}
                  {vpa && (
                    <Card className="border-slate-200 bg-white shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                          <BarChart3 className="w-4 h-4 text-purple-500" />
                          Volume Price Analysis (VPA)
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-3 mb-3">
                          <Badge variant="outline" className={`text-xs ${flowBadge(vpa.status)}`}>
                            {vpa.label?.replace(/🟢🟢|🟢|⚪|🔴🔴|🔴/g, "").trim()}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-600 mb-3">{vpa.summary}</p>
                        <div className="grid grid-cols-2 gap-3">
                          {/* Accumulation Score */}
                          <div className="p-2.5 rounded-lg border border-emerald-100 bg-emerald-50/40">
                            <div className="text-[10px] font-semibold text-emerald-600 mb-1">Skor Akumulasi</div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 rounded-full bg-slate-200 overflow-hidden">
                                <div
                                  className="h-full bg-emerald-500 rounded-full transition-all"
                                  style={{ width: `${vpa.accumulationScore}%` }}
                                />
                              </div>
                              <span className="text-xs font-bold text-emerald-700">{vpa.accumulationScore}%</span>
                            </div>
                          </div>
                          {/* Distribution Score */}
                          <div className="p-2.5 rounded-lg border border-rose-100 bg-rose-50/40">
                            <div className="text-[10px] font-semibold text-rose-600 mb-1">Skor Distribusi</div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 rounded-full bg-slate-200 overflow-hidden">
                                <div
                                  className="h-full bg-rose-500 rounded-full transition-all"
                                  style={{ width: `${vpa.distributionScore}%` }}
                                />
                              </div>
                              <span className="text-xs font-bold text-rose-700">{vpa.distributionScore}%</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Key Levels */}
                  {kl && (
                    <Card className="border-slate-200 bg-white shadow-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                          <Target className="w-4 h-4 text-emerald-500" />
                          Level Harga Penting
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                          <LevelCard label="Support 1" value={fmtPrice(kl.support1)} color="emerald" />
                          <LevelCard label="Support 2" value={fmtPrice(kl.support2)} color="green" />
                          <LevelCard label="Resistance 1" value={fmtPrice(kl.resistance1)} color="rose" />
                          <LevelCard label="Resistance 2" value={fmtPrice(kl.resistance2)} color="red" />
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <LevelCard label="52W High" value={fmtPrice(kl.high52Week)} color="indigo" />
                          <LevelCard label="52W Low" value={fmtPrice(kl.low52Week)} color="slate" />
                          <LevelCard
                            label="Jarak 52W High"
                            value={`${kl.distanceFrom52WeekHighPercent}%`}
                            color={kl.distanceFrom52WeekHighPercent > -5 ? "emerald" : "rose"}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Fragment>
  );
}

// ─── Sub-components ─────────────────────────────────────
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
    <div className="p-3 rounded-lg border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
          {label}
        </span>
        {icon}
      </div>
      <div className={`text-lg font-extrabold ${valueColor || "text-slate-900"}`}>
        {value}
      </div>
      {sub && (
        <p className="text-[10px] text-slate-400 font-medium mt-0.5">{sub}</p>
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
    <div className={`p-3 rounded-lg border ${c.bg}`}>
      <div className="text-[10px] font-semibold text-slate-400 uppercase">{label}</div>
      <div className={`text-xl font-extrabold ${c.text}`}>{count}</div>
      <div className="flex items-center gap-1.5 mt-1">
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
    <div className={`p-2.5 rounded-lg border ${colorMap[color] || colorMap.slate}`}>
      <div className="text-[10px] font-semibold text-slate-400 uppercase mb-0.5">{label}</div>
      <div className="text-xs font-bold text-slate-800">{value}</div>
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
    <div className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 text-center">
      <div className="text-[10px] font-semibold text-slate-400 uppercase">{label}</div>
      <div className="text-sm font-bold text-slate-800">
        {value ? value.toLocaleString("id-ID") : "N/A"}
      </div>
      {value !== null && (
        <div className={`text-[10px] font-semibold mt-0.5 ${above ? "text-emerald-600" : "text-rose-600"}`}>
          {above ? "Di atas ✓" : "Di bawah ✗"}
        </div>
      )}
    </div>
  );
}
