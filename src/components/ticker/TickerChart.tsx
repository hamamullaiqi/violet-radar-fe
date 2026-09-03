"use client";

import React, { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { Loader2, TrendingUp, BarChart2, Activity, Layers } from "lucide-react";
import useFetch from "@/hooks/useFetch";

interface CandleData {
  date: string | Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  foreignNet?: number;
  foreignBuy?: number;
  foreignSell?: number;
}

interface TickerChartProps {
  ticker: string;
  keyLevels?: {
    support1?: number;
    support2?: number;
    resistance1?: number;
    resistance2?: number;
  };
  tradingPlan?: {
    entryArea?: { min: number; max: number };
    targetPrice1?: number;
    targetPrice2?: number;
    stopLoss?: number;
  };
}

type Timeframe = "1M" | "3M" | "6M";

export default function TickerChart({ ticker, keyLevels, tradingPlan }: TickerChartProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>("3M");
  const [showMa, setShowMa] = useState<boolean>(true);
  const [showLevels, setShowLevels] = useState<boolean>(true);
  const [subChartType, setSubChartType] = useState<"volume" | "foreign">("volume");

  // Determine limit based on timeframe
  const limit = timeframe === "1M" ? 25 : timeframe === "3M" ? 70 : 130;

  const { data: rawCandles, loading, error } = useFetch<CandleData[]>(
    ticker ? `/api/market-data/idx/candles/${ticker.toUpperCase()}?limit=${limit}` : ""
  );

  // Compute Moving Averages and format chart data
  const chartData = useMemo(() => {
    if (!rawCandles || !Array.isArray(rawCandles) || rawCandles.length === 0) return [];

    // Ensure chronological order (oldest to newest)
    const sorted = [...rawCandles].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateA - dateB;
    });

    // Calculate SMA values
    return sorted.map((c, idx, arr) => {
      const d = new Date(c.date);
      const dateLabel = `${d.getDate()}/${d.getMonth() + 1}`;
      const fullDate = d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });

      // SMA 20
      let sma20: number | null = null;
      if (idx >= 19) {
        const slice20 = arr.slice(idx - 19, idx + 1);
        const sum20 = slice20.reduce((acc, curr) => acc + curr.close, 0);
        sma20 = Math.round(sum20 / 20);
      }

      // SMA 50
      let sma50: number | null = null;
      if (idx >= 49) {
        const slice50 = arr.slice(idx - 49, idx + 1);
        const sum50 = slice50.reduce((acc, curr) => acc + curr.close, 0);
        sma50 = Math.round(sum50 / 50);
      }

      const isUp = c.close >= c.open;
      const fNet = c.foreignNet || 0;

      return {
        ...c,
        dateLabel,
        fullDate,
        sma20,
        sma50,
        isUp,
        volumeColor: isUp ? "#10b981" : "#ef4444",
        foreignNet: fNet,
        foreignColor: fNet >= 0 ? "#10b981" : "#ef4444",
      };
    });
  }, [rawCandles]);

  // Calculate Price domain bounds for visual clarity
  const { minPrice, maxPrice } = useMemo(() => {
    if (chartData.length === 0) return { minPrice: 0, maxPrice: 1000 };
    const prices = chartData.flatMap((d) => [d.low, d.high].filter(Boolean));
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const padding = (max - min) * 0.08 || 50;
    return {
      minPrice: Math.floor(Math.max(0, min - padding)),
      maxPrice: Math.ceil(max + padding),
    };
  }, [chartData]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-white rounded-xl border border-slate-200 shadow-sm">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
        <span className="text-sm font-semibold text-slate-600">Memuat riwayat grafik {ticker?.toUpperCase()}...</span>
      </div>
    );
  }

  if (error || chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-slate-200 text-center px-4">
        <Activity className="w-8 h-8 text-slate-400 mb-2" />
        <p className="text-sm font-semibold text-slate-700">Data grafik belum tersedia untuk {ticker?.toUpperCase()}</p>
        <p className="text-xs text-slate-400 mt-1 max-w-sm">
          Riwayat candle harian belum tercatat atau sedang diperbarui oleh sistem.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Chart Control Toolbar */}
      <div className="p-3 sm:p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
        {/* Timeframe selector */}
        <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-lg">
          {(["1M", "3M", "6M"] as Timeframe[]).map((tf) => (
            <button
              key={tf}
              type="button"
              onClick={() => setTimeframe(tf)}
              className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                timeframe === tf
                  ? "bg-white text-indigo-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {tf === "1M" ? "1 Bulan" : tf === "3M" ? "3 Bulan" : "6 Bulan"}
            </button>
          ))}
        </div>

        {/* Feature Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Subchart toggle (Volume vs Foreign) */}
          <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-lg text-xs font-semibold">
            <button
              type="button"
              onClick={() => setSubChartType("volume")}
              className={`px-2 py-0.5 rounded transition-all ${
                subChartType === "volume"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Volume
            </button>
            <button
              type="button"
              onClick={() => setSubChartType("foreign")}
              className={`px-2 py-0.5 rounded transition-all ${
                subChartType === "foreign"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Foreign Flow
            </button>
          </div>

          {/* Toggle MA lines */}
          <button
            type="button"
            onClick={() => setShowMa(!showMa)}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-all flex items-center gap-1.5 ${
              showMa
                ? "border-indigo-200 bg-indigo-50/80 text-indigo-700 font-semibold"
                : "border-slate-200 bg-white text-slate-500"
            }`}
          >
            <span className="inline-block w-2 h-2 rounded-full bg-amber-500"></span>
            <span>MA</span>
          </button>

          {/* Toggle Key Levels */}
          <button
            type="button"
            onClick={() => setShowLevels(!showLevels)}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-all flex items-center gap-1.5 ${
              showLevels
                ? "border-emerald-200 bg-emerald-50/80 text-emerald-700 font-semibold"
                : "border-slate-200 bg-white text-slate-500"
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>Levels</span>
          </button>
        </div>
      </div>

      {/* Main Price Area Chart */}
      <div className="p-2 sm:p-4 pt-4">
        <div className="flex items-center justify-between text-xs px-2 mb-2 text-slate-500">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="font-semibold text-slate-700">Harga Penutupan (Close)</span>
            {showMa && (
              <>
                <span className="flex items-center gap-1 text-amber-600 font-semibold text-[11px]">
                  <span className="w-2.5 h-0.5 bg-amber-500 inline-block"></span> MA20
                </span>
                <span className="flex items-center gap-1 text-blue-600 font-semibold text-[11px]">
                  <span className="w-2.5 h-0.5 bg-blue-500 inline-block"></span> MA50
                </span>
              </>
            )}
            {showLevels && keyLevels && (
              <>
                {keyLevels.resistance1 && (
                  <span className="text-rose-600 text-[11px] font-medium">
                    R1: Rp {keyLevels.resistance1.toLocaleString("id-ID")}
                  </span>
                )}
                {keyLevels.support1 && (
                  <span className="text-emerald-600 text-[11px] font-medium">
                    S1: Rp {keyLevels.support1.toLocaleString("id-ID")}
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        <div className="h-[280px] sm:h-[340px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="dateLabel"
                stroke="#94a3b8"
                fontSize={10}
                tickLine={false}
                axisLine={{ stroke: "#e2e8f0" }}
              />
              <YAxis
                domain={[minPrice, maxPrice]}
                stroke="#94a3b8"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => v.toLocaleString("id-ID")}
              />
              <Tooltip content={<CustomPriceTooltip />} />

              {/* Price Area */}
              <Area
                type="monotone"
                dataKey="close"
                name="Harga"
                stroke="#4f46e5"
                strokeWidth={2}
                fill="url(#priceGradient)"
              />

              {/* Moving Average Lines */}
              {showMa && (
                <>
                  <Line
                    type="monotone"
                    dataKey="sma20"
                    name="MA20"
                    stroke="#f59e0b"
                    strokeWidth={1.5}
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="sma50"
                    name="MA50"
                    stroke="#3b82f6"
                    strokeWidth={1.5}
                    dot={false}
                    isAnimationActive={false}
                  />
                </>
              )}

              {/* Key Levels Reference Lines */}
              {showLevels && keyLevels && (
                <>
                  {keyLevels.resistance1 && (
                    <ReferenceLine
                      y={keyLevels.resistance1}
                      stroke="#f43f5e"
                      strokeDasharray="4 4"
                      strokeWidth={1}
                      label={{
                        value: "R1",
                        fill: "#f43f5e",
                        fontSize: 9,
                        position: "right",
                      }}
                    />
                  )}
                  {keyLevels.support1 && (
                    <ReferenceLine
                      y={keyLevels.support1}
                      stroke="#10b981"
                      strokeDasharray="4 4"
                      strokeWidth={1}
                      label={{
                        value: "S1",
                        fill: "#10b981",
                        fontSize: 9,
                        position: "right",
                      }}
                    />
                  )}
                </>
              )}

              {/* Trading Plan Target / SL */}
              {showLevels && tradingPlan && (
                <>
                  {tradingPlan.targetPrice1 && (
                    <ReferenceLine
                      y={tradingPlan.targetPrice1}
                      stroke="#059669"
                      strokeDasharray="2 2"
                      strokeWidth={1}
                    />
                  )}
                  {tradingPlan.stopLoss && (
                    <ReferenceLine
                      y={tradingPlan.stopLoss}
                      stroke="#dc2626"
                      strokeDasharray="2 2"
                      strokeWidth={1}
                    />
                  )}
                </>
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Sub-Chart: Volume or Foreign Flow */}
        <div className="mt-2 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 mb-1 px-2">
            <span>
              {subChartType === "volume" ? "Volume Transaksi (Lembar Saham)" : "Net Transaksi Asing (IDR)"}
            </span>
          </div>
          <div className="h-[90px] sm:h-[110px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" vertical={false} />
                <XAxis dataKey="dateLabel" hide />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={9}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => {
                    const abs = Math.abs(v);
                    if (abs >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
                    if (abs >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
                    if (abs >= 1e3) return `${(v / 1e3).toFixed(0)}K`;
                    return `${v}`;
                  }}
                />
                <Tooltip content={<CustomSubchartTooltip type={subChartType} />} />
                {subChartType === "volume" ? (
                  <Bar
                    dataKey="volume"
                    name="Volume"
                    fill="#94a3b8"
                    opacity={0.85}
                    radius={[2, 2, 0, 0]}
                  />
                ) : (
                  <Bar
                    dataKey="foreignNet"
                    name="Net Asing"
                    fill="#6366f1"
                    radius={[2, 2, 0, 0]}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Custom Tooltip for Price Area Chart ───
function CustomPriceTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;

  const fmtRp = (num: number) => `Rp ${num?.toLocaleString("id-ID") || 0}`;

  return (
    <div className="bg-slate-900/95 text-white p-3 rounded-lg shadow-xl backdrop-blur-md border border-slate-700 text-xs min-w-[170px] z-50">
      <div className="font-bold text-slate-200 border-b border-slate-700 pb-1 mb-1.5 flex items-center justify-between">
        <span>{d.fullDate}</span>
        <span className={`font-mono text-[10px] px-1 rounded ${d.isUp ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"}`}>
          {d.isUp ? "Bullish" : "Bearish"}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-[11px]">
        <div className="text-slate-400">Open: <span className="text-white font-semibold">{fmtRp(d.open)}</span></div>
        <div className="text-slate-400">Close: <span className="text-white font-bold">{fmtRp(d.close)}</span></div>
        <div className="text-slate-400">High: <span className="text-emerald-400">{fmtRp(d.high)}</span></div>
        <div className="text-slate-400">Low: <span className="text-rose-400">{fmtRp(d.low)}</span></div>
      </div>
      {d.sma20 && (
        <div className="mt-1.5 pt-1.5 border-t border-slate-800 flex items-center justify-between text-[10px]">
          <span className="text-amber-400">MA20: {fmtRp(d.sma20)}</span>
          {d.sma50 && <span className="text-blue-400">MA50: {fmtRp(d.sma50)}</span>}
        </div>
      )}
    </div>
  );
}

// ─── Custom Tooltip for Subchart ───
function CustomSubchartTooltip({ active, payload, type }: any) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;

  const formatRupiah = (val: number) => {
    const sign = val >= 0 ? "+" : "-";
    const abs = Math.abs(val);
    if (abs >= 1e12) return `${sign}Rp ${(abs / 1e12).toFixed(2)}T`;
    if (abs >= 1e9) return `${sign}Rp ${(abs / 1e9).toFixed(2)}B`;
    if (abs >= 1e6) return `${sign}Rp ${(abs / 1e6).toFixed(2)}M`;
    return `${sign}Rp ${abs.toLocaleString("id-ID")}`;
  };

  return (
    <div className="bg-slate-900/95 text-white p-2.5 rounded-lg shadow-xl backdrop-blur-md border border-slate-700 text-xs z-50">
      <div className="text-[10px] text-slate-400">{d.fullDate}</div>
      {type === "volume" ? (
        <div className="font-bold text-white font-mono mt-0.5">
          Volume: {d.volume?.toLocaleString("id-ID")} lot/lembar
        </div>
      ) : (
        <div className={`font-bold font-mono mt-0.5 ${d.foreignNet >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
          Net Asing: {formatRupiah(d.foreignNet)}
        </div>
      )}
    </div>
  );
}
