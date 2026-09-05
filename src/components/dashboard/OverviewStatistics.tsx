"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  Award,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Zap,
  Clock,
  Loader2,
  BarChart2,
  RefreshCw
} from "lucide-react";
import TickerDetailDialog from "./TickerDetailDialog";

export default function OverviewStatistics() {
  // Query Filters State
  const [periodType, setPeriodType] = useState<string>("ALL_TIME");
  const [periodKey, setPeriodKey] = useState<string>("ALL");
  const [strategyType, setStrategyType] = useState<string>("ALL");
  const [setupMode, setSetupMode] = useState<string>("ALL");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Available periods loaded from DB
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [availableYears, setAvailableYears] = useState<string[]>([]);

  // Data Fetching States
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Generate available months and years dynamically on mount (replaces 2 API calls)
  useEffect(() => {
    const startYear = 2025;
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1; // 1-12

    // Generate years list (oldest to latest)
    const years: string[] = [];
    for (let y = startYear; y <= currentYear; y++) {
      years.push(String(y));
    }
    setAvailableYears(years);

    // Generate months list (YYYY-MM, oldest to latest)
    const months: string[] = [];
    for (let y = startYear; y <= currentYear; y++) {
      const maxM = y === currentYear ? currentMonth : 12;
      for (let m = 1; m <= maxM; m++) {
        months.push(`${y}-${String(m).padStart(2, '0')}`);
      }
    }
    setAvailableMonths(months);
  }, []);

  // Sync default periodKey when periodType changes (fully dynamic, no hardcoding)
  useEffect(() => {
    if (periodType === "ALL_TIME") {
      setPeriodKey("ALL");
    } else if (periodType === "MONTHLY") {
      const defaultMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
      setPeriodKey(availableMonths[availableMonths.length - 1] || defaultMonth);
    } else if (periodType === "YEARLY") {
      const defaultYear = String(new Date().getFullYear());
      setPeriodKey(availableYears[availableYears.length - 1] || defaultYear);
    } else if (periodType === "DAILY" || periodType === "WEEKLY" || periodType === "3_MONTHS") {
      // Get latest trading day (Friday if weekend, otherwise today)
      const d = new Date();
      const day = d.getDay();
      if (day === 0) d.setDate(d.getDate() - 2); // Sunday -> Friday
      else if (day === 6) d.setDate(d.getDate() - 1); // Saturday -> Friday
      setPeriodKey(d.toISOString().split('T')[0]);
    } else {
      setPeriodKey("");
    }
  }, [periodType, availableMonths, availableYears]);

  const fetchStatistics = async () => {
    setLoading(true);
    setError(null);
    try {
      let queryParams = [];
      if (periodType) queryParams.push(`periodType=${periodType}`);
      if (periodKey && periodType !== "CUSTOM") queryParams.push(`periodKey=${periodKey}`);
      if (strategyType) queryParams.push(`strategyType=${strategyType}`);
      if (setupMode) queryParams.push(`setupMode=${setupMode}`);
      if (periodType === "CUSTOM") {
        if (startDate) queryParams.push(`startDate=${startDate}`);
        if (endDate) queryParams.push(`endDate=${endDate}`);
      }

      const queryString = queryParams.length > 0 ? `?${queryParams.join("&")}` : "";
      const response = await api.get(`/api/analytics/statistics${queryString}`);

      setStats(response.data.data || response.data);
    } catch (err: any) {
      console.error("Failed to fetch statistics:", err);
      setError("Gagal memuat statistik. Pastikan server backend Anda online.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodType, periodKey, strategyType, setupMode, startDate, endDate]);

  return (
    <Card className="border-slate-200 shadow-sm bg-white mt-6">
      <CardHeader className="border-b border-slate-100 pb-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-600" />
              <CardTitle className="text-base font-bold text-slate-800">Analisis Statistik Kuantitatif Komprehensif</CardTitle>
            </div>
            <CardDescription className="text-xs mt-0.5">
              Analisis performa mendalam berdasarkan model matematis sistem perdagangan VioletRadar.
            </CardDescription>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Strategy Select */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Strategi</label>
              <Select value={strategyType} onValueChange={setStrategyType}>
                <SelectTrigger className="w-40 border-slate-200 bg-slate-50 text-slate-900 text-xs h-8">
                  <SelectValue placeholder="Strategi" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 text-slate-900 text-xs">
                  <SelectItem value="ALL">Semua Strategi</SelectItem>
                  <SelectItem value="RADAR_CALON_ARA_BELI_SORE">BELI SORE & ARA</SelectItem>
                  <SelectItem value="SWING">SWING</SelectItem>
                  <SelectItem value="REVERSAL">REVERSAL</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Setup Select */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Setup Mode</label>
              <Select value={setupMode} onValueChange={setSetupMode}>
                <SelectTrigger className="w-32 border-slate-200 bg-slate-50 text-slate-900 text-xs h-8">
                  <SelectValue placeholder="Setup Mode" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 text-slate-900 text-xs">
                  <SelectItem value="ALL">Semua Setup</SelectItem>
                  <SelectItem value="BELI_SORE">BELI SORE</SelectItem>
                  <SelectItem value="CALON_ARA">CALON ARA</SelectItem>
                  <SelectItem value="PULLBACK">PULLBACK</SelectItem>
                  <SelectItem value="BREAKOUT">BREAKOUT</SelectItem>
                  <SelectItem value="CROSSOVER">CROSSOVER</SelectItem>
                  <SelectItem value="RECLAIM">RECLAIM</SelectItem>
                  <SelectItem value="MOMENTUM">MOMENTUM</SelectItem>
                  <SelectItem value="REVERSAL">REVERSAL</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Period Type Select */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Rentang Waktu</label>
              <Select value={periodType} onValueChange={setPeriodType}>
                <SelectTrigger className="w-32 border-slate-200 bg-slate-50 text-slate-900 text-xs h-8">
                  <SelectValue placeholder="Rentang Waktu" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 text-slate-900 text-xs">
                  <SelectItem value="ALL_TIME">All Time</SelectItem>
                  <SelectItem value="DAILY">Harian</SelectItem>
                  <SelectItem value="WEEKLY">1 Minggu</SelectItem>
                  <SelectItem value="MONTHLY">Bulanan</SelectItem>
                  <SelectItem value="3_MONTHS">3 Bulan</SelectItem>
                  <SelectItem value="YEARLY">Tahunan</SelectItem>
                  <SelectItem value="CUSTOM">Custom Date</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sub-Period Selector based on Period Type */}

            {periodType === "MONTHLY" && availableMonths.length > 0 && (
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Pilih Bulan</label>
                <Select value={periodKey} onValueChange={setPeriodKey}>
                  <SelectTrigger className="w-32 border-slate-200 bg-slate-50 text-slate-900 text-xs h-8">
                    <SelectValue placeholder="Pilih Bulan" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 text-slate-900 text-xs">
                    {availableMonths.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {periodType === "YEARLY" && availableYears.length > 0 && (
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Pilih Tahun</label>
                <Select value={periodKey} onValueChange={setPeriodKey}>
                  <SelectTrigger className="w-32 border-slate-200 bg-slate-50 text-slate-900 text-xs h-8">
                    <SelectValue placeholder="Pilih Tahun" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 text-slate-900 text-xs">
                    {availableYears.map((y) => (
                      <SelectItem key={y} value={y}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {periodType === "CUSTOM" && (
              <>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Mulai</label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="border-slate-200 bg-slate-50 text-slate-900 text-xs h-8 w-32 py-1"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Akhir</label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="border-slate-200 bg-slate-50 text-slate-900 text-xs h-8 w-32 py-1"
                  />
                </div>
              </>
            )}

            <Button
              onClick={fetchStatistics}
              variant="outline"
              size="icon"
              className="h-8 w-8 border-slate-200 mt-5 text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {loading ? (
          <div className="flex h-60 items-center justify-center">
            <div className="flex flex-col items-center gap-1.5 text-slate-500">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
              <p className="text-[11px] font-medium">Mengkalkulasi metrics kuantitatif...</p>
            </div>
          </div>
        ) : error || !stats ? (
          <div className="text-center py-10 border border-dashed border-slate-200 rounded-lg text-slate-400 text-xs">
            {error || "Tidak ada data statistik kuantitatif yang cocok dengan filter."}
          </div>
        ) : (
          <div className="space-y-6">

            {/* GRID 1: KEY STATS COMPARISON CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

              {/* Card 1: Profit Engine */}
              <div className="border border-slate-100 rounded-lg p-4 bg-slate-50/50">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                  <span>Profitability Metrics</span>
                </div>
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between pb-1 border-b border-slate-100">
                    <span className="text-slate-500">Net Realized PnL</span>
                    <strong className={`font-mono ${stats.netRealizedPnLPercent >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                      {stats.netRealizedPnLPercent >= 0 ? "+" : ""}{stats.netRealizedPnLPercent}%
                    </strong>
                  </div>
                  <div className="flex justify-between pb-1 border-b border-slate-100">
                    <span className="text-slate-500">Win Rate</span>
                    <strong className="text-slate-700 font-mono">{stats.winRatePercent}%</strong>
                  </div>
                  <div className="flex justify-between pb-1 border-b border-slate-100">
                    <span className="text-slate-500">Profit Factor</span>
                    <strong className="text-slate-700 font-mono">{stats.profitFactor}x</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Expectancy per Posisi</span>
                    <strong className={`font-mono ${Number(stats.expectancyPercent || 0) >= 0 ? "text-blue-600" : "text-rose-600"}`}>
                      {Number(stats.expectancyPercent || 0) >= 0 ? `+${stats.expectancyPercent}%` : `${stats.expectancyPercent}%`}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Card 2: Trade Analytics */}
              <div className="border border-slate-100 rounded-lg p-4 bg-slate-50/50">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">
                  <Award className="h-4 w-4 text-indigo-600" />
                  <span>Execution Analytics</span>
                </div>
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between pb-1 border-b border-slate-100">
                    <span className="text-slate-500">Rata-rata Profit (Win)</span>
                    <strong className="text-emerald-600 font-mono">+{stats.avgWinPercent}%</strong>
                  </div>
                  <div className="flex justify-between pb-1 border-b border-slate-100">
                    <span className="text-slate-500">Rata-rata Loss</span>
                    <strong className="text-rose-600 font-mono">-{Math.abs(Number(stats.avgLossPercent || 0)).toFixed(2)}%</strong>
                  </div>
                  <div className="flex justify-between pb-1 border-b border-slate-100">
                    <span className="text-slate-500">Rata-rata Profit/Posisi</span>
                    <strong className={`font-mono ${Number(stats.avgTradePnLPercent || 0) >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                      {Number(stats.avgTradePnLPercent || 0) >= 0 ? `+${stats.avgTradePnLPercent}%` : `${stats.avgTradePnLPercent}%`}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Avg. Durasi Simpan</span>
                    <strong className="text-slate-700 font-mono flex items-center gap-1">
                      <Clock className="h-3 w-3 text-slate-400" />
                      {stats.avgHoldingDays} Hari
                    </strong>
                  </div>
                </div>
              </div>

              {/* Card 3: Excursion Limits */}
              <div className="border border-slate-100 rounded-lg p-4 bg-slate-50/50">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">
                  <Layers className="h-4 w-4 text-orange-600" />
                  <span>Excursion & Trailing Limits</span>
                </div>
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between pb-1 border-b border-slate-100">
                    <span className="text-slate-500">Avg. Favorable (MFE)</span>
                    <strong className="text-emerald-600 font-mono">+{Math.abs(Number(stats.avgMfePercent || 0)).toFixed(2)}%</strong>
                  </div>
                  <div className="flex justify-between pb-1 border-b border-slate-100">
                    <span className="text-slate-500">Avg. Adverse (MAE)</span>
                    <strong className="text-rose-600 font-mono">-{Math.abs(Number(stats.avgMaePercent || 0)).toFixed(2)}%</strong>
                  </div>
                  <div className="flex justify-between pb-1 border-b border-slate-100">
                    <span className="text-slate-500">Overflow Beyond TP2</span>
                    <strong className="text-purple-600 font-mono">{stats.overflowBeyondTp2RatePercent}%</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Avg. Overflow Gain</span>
                    <strong className="text-purple-600 font-mono">+{stats.avgOverflowPercent}%</strong>
                  </div>
                </div>
              </div>

            </div>

            {/* GRID 2: INTELLIGENCE CORRELATIONS & TABLES */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Intelligence Section: Win Rate Correlations */}
              <div className="border border-slate-100 rounded-lg p-4">
                <h4 className="text-xs font-bold text-slate-800 mb-3.5 uppercase tracking-wider flex items-center gap-1">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  Korelasi Kemenangan Sistem & Regime Pasar
                </h4>
                <div className="space-y-3.5 text-xs font-medium">
                  {/* Foreign flow correlation */}
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-slate-500">Win Rate Dengan Akumulasi Asing (Foreign Accum):</span>
                    <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 font-mono">
                      {stats.foreignAccumulationWinRatePercent}%
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-slate-500">Win Rate Tanpa Akumulasi Asing:</span>
                    <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100 font-mono">
                      {stats.noForeignWinRatePercent}%
                    </Badge>
                  </div>

                  {/* Market regimes */}
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-slate-500">Win Rate Pada Regime BULLISH IHSG:</span>
                    <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 font-mono">
                      {stats.bullishRegimeWinRatePercent !== undefined ? `${stats.bullishRegimeWinRatePercent}%` : "N/A"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-slate-500">Win Rate Pada Regime BEARISH IHSG:</span>
                    <Badge className="bg-rose-100 text-rose-800 hover:bg-rose-100 font-mono">
                      {stats.bearishRegimeWinRatePercent !== undefined ? `${stats.bearishRegimeWinRatePercent}%` : "N/A"}
                    </Badge>
                  </div>

                  {/* Score Tiers */}
                  <div className="flex justify-between items-center py-2">
                    <span className="text-slate-500">Win Rate Signal Tier 1 (Score &ge; 80):</span>
                    <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100 font-mono">
                      {stats.tier1ScoreWinRatePercent !== undefined ? `${stats.tier1ScoreWinRatePercent}%` : "N/A"}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Day of Week distribution */}
              <div className="border border-slate-100 rounded-lg p-4">
                <h4 className="text-xs font-bold text-slate-800 mb-3.5 uppercase tracking-wider flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  Win Rate Berdasarkan Hari Pembelian (Entry Day)
                </h4>
                <div className="space-y-3.5 text-xs font-medium">
                  {Object.entries(stats.dayOfWeekWinRates || {}).map(([day, value]) => (
                    <div key={day} className="flex justify-between items-center py-1.5 border-b border-slate-100 last:border-0 capitalize">
                      <span className="text-slate-500">{day}:</span>
                      <strong className="text-slate-700 font-mono">
                        {value !== undefined ? `${value}%` : "N/A"}
                      </strong>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* GRID 3: BEST & WORST TICKERS PERFORMERS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Best Performers */}
              <div className="border border-slate-100 rounded-lg p-4">
                <h4 className="text-xs font-bold text-slate-800 mb-3 uppercase tracking-wider flex items-center gap-1.5">
                  <ArrowUpRight className="h-4.5 w-4.5 text-emerald-600" />
                  Top 5 Emiten Penyumbang Profit Terbesar
                </h4>
                <Table className="text-xs mt-2">
                  <TableHeader className="bg-slate-50">
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Ticker</TableHead>
                      <TableHead className="text-right">Total Trades</TableHead>
                      <TableHead className="text-right">Win Rate</TableHead>
                      <TableHead className="text-right">Total PnL %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(!stats.bestTickers || stats.bestTickers.length === 0) ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-4 text-slate-400">Belum ada transaksi tertutup.</TableCell>
                      </TableRow>
                    ) : (
                      stats.bestTickers.map((t: any, idx: number) => (
                        <TableRow key={idx} className="border-slate-100 hover:bg-slate-50/50">
                          <TableCell className="font-bold text-slate-900"><TickerDetailDialog ticker={t.ticker} /></TableCell>
                          <TableCell className="text-right font-mono">{t.tradesCount}</TableCell>
                          <TableCell className="text-right font-mono">{t.winRatePercent}%</TableCell>
                          <TableCell className="text-right font-mono font-bold text-emerald-600">+{t.totalPnLPercent}%</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Worst Performers */}
              <div className="border border-slate-100 rounded-lg p-4">
                <h4 className="text-xs font-bold text-slate-800 mb-3 uppercase tracking-wider flex items-center gap-1.5">
                  <ArrowDownRight className="h-4.5 w-4.5 text-rose-600" />
                  Top 5 Emiten Penyumbang Loss Terbesar
                </h4>
                <Table className="text-xs mt-2">
                  <TableHeader className="bg-slate-50">
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Ticker</TableHead>
                      <TableHead className="text-right">Total Trades</TableHead>
                      <TableHead className="text-right">Win Rate</TableHead>
                      <TableHead className="text-right">Total PnL %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(!stats.worstTickers || stats.worstTickers.length === 0) ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-4 text-slate-400">Belum ada transaksi tertutup.</TableCell>
                      </TableRow>
                    ) : (
                      stats.worstTickers.map((t: any, idx: number) => (
                        <TableRow key={idx} className="border-slate-100 hover:bg-slate-50/50">
                          <TableCell className="font-bold text-slate-900"><TickerDetailDialog ticker={t.ticker} /></TableCell>
                          <TableCell className="text-right font-mono">{t.tradesCount}</TableCell>
                          <TableCell className="text-right font-mono">{t.winRatePercent}%</TableCell>
                          <TableCell className="text-right font-mono font-bold text-rose-600">{t.totalPnLPercent}%</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

            </div>

          </div>
        )}
      </CardContent>
    </Card>
  );
}
