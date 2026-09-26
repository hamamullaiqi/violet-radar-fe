"use client";

import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import {
  createChart,
  CandlestickSeries,
  LineSeries,
  HistogramSeries,
  LineStyle,
  ColorType,
  createSeriesMarkers,
  IChartApi,
  ISeriesApi,
} from "lightweight-charts";
import {
  Loader2,
  TrendingUp,
  BarChart2,
  Layers,
  ShieldCheck,
  Target,
  Sparkles,
  Maximize2,
  Minimize2,
  Activity,
  Calendar,
} from "lucide-react";
import useFetch from "@/hooks/useFetch";
import { formatRupiah } from "@/lib/utils";

export interface CandleData {
  date: string | Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  foreignNet?: number;
  foreignBuy?: number;
  foreignSell?: number;
  value?: number;
}

export interface KeyLevelsProps {
  support1?: number;
  support2?: number;
  resistance1?: number;
  resistance2?: number;
  pivot?: number;
  high52Week?: number;
  low52Week?: number;
}

export interface TradingPlanProps {
  entryArea?: { min: number; max: number };
  targetPrice1?: number;
  targetPrice2?: number;
  stopLoss?: number;
  momentumEntryPrice?: number;
  breakoutPrice?: number;
}

export interface VioletLightweightChartProps {
  ticker: string;
  currentPrice?: number;
  keyLevels?: KeyLevelsProps;
  tradingPlan?: TradingPlanProps;
  bandarAvgPrice?: number;
  recentSignals?: Array<{
    date?: string | Date;
    signalType?: string;
    action?: string;
    price?: number;
    title?: string;
  }>;
}

type TimeframeOption = "1M" | "3M" | "6M" | "1Y" | "ALL";
type SubIndicatorType = "volume" | "foreign";

export default function VioletLightweightChart({
  ticker,
  currentPrice: initialCurrentPrice,
  keyLevels,
  tradingPlan,
  bandarAvgPrice: propBandarAvg,
  recentSignals,
}: VioletLightweightChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<IChartApi | null>(null);

  // Timeframe and display toggles
  const [timeframe, setTimeframe] = useState<TimeframeOption>("6M");
  const [subIndicator, setSubIndicator] = useState<SubIndicatorType>("volume");
  const [showMa, setShowMa] = useState<boolean>(true);
  const [showBandarCost, setShowBandarCost] = useState<boolean>(true);
  const [showKeyLevels, setShowKeyLevels] = useState<boolean>(true);
  const [showTradingPlan, setShowTradingPlan] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Crosshair HUD State
  const [hudData, setHudData] = useState<{
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    change: number;
    changePct: number;
    volume: number;
    foreignNet?: number;
    ma20?: number;
    ma50?: number;
    ma200?: number;
  } | null>(null);

  // Smart money / Bandar Cost fetch if not provided in props
  const { data: smData } = useFetch<{ items: Array<{ bandarAvgPrice?: number; distancePercent?: number }> }>(
    ticker && !propBandarAvg
      ? `/api/market/smart-money-radar?ticker=${ticker.toUpperCase()}&period=1M`
      : ""
  );
  const bandarAvgPrice = propBandarAvg || smData?.items?.[0]?.bandarAvgPrice || 0;

  // Candle limit calculation
  const limit = useMemo(() => {
    switch (timeframe) {
      case "1M":
        return 30;
      case "3M":
        return 80;
      case "6M":
        return 150;
      case "1Y":
        return 260;
      case "ALL":
      default:
        return 600;
    }
  }, [timeframe]);

  // Fetch candle data
  const { data: rawCandles, loading, error, refetch } = useFetch<CandleData[]>(
    ticker ? `/api/market-data/idx/candles/${ticker.toUpperCase()}?limit=${limit}` : ""
  );

  // Process & format candles
  const processedData = useMemo(() => {
    if (!rawCandles || !Array.isArray(rawCandles) || rawCandles.length === 0) {
      return {
        candles: [],
        ma20Data: [],
        ma50Data: [],
        ma200Data: [],
        volumeData: [],
        foreignData: [],
        latestCandle: null,
      };
    }

    // Sort ascending by date
    const sorted = [...rawCandles].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Filter valid candles with positive close price
    const valid = sorted.filter(
      (c) => c.date && typeof c.close === "number" && c.close > 0
    );

    const candles: any[] = [];
    const ma20Data: any[] = [];
    const ma50Data: any[] = [];
    const ma200Data: any[] = [];
    const volumeData: any[] = [];
    const foreignData: any[] = [];

    // Temporary map for date deduplication
    const seenDates = new Set<string>();
    let prevClose = 0;

    valid.forEach((c) => {
      const d = new Date(c.date);
      if (isNaN(d.getTime())) return;

      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
      ).padStart(2, "0")}`;

      if (seenDates.has(dateStr)) return;
      seenDates.add(dateStr);

      const close = c.close;
      let open = c.open && c.open > 0 ? c.open : (prevClose > 0 ? prevClose : close);
      let high = c.high && c.high > 0 ? c.high : Math.max(open, close);
      let low = c.low && c.low > 0 ? c.low : Math.min(open, close);

      high = Math.max(high, open, close);
      low = Math.min(low, open, close);
      if (low <= 0) low = Math.min(open, close);
      prevClose = close;

      // Candlestick item
      candles.push({
        time: dateStr,
        open,
        high,
        low,
        close,
        volume: c.volume || 0,
        foreignNet: c.foreignNet || 0,
      });

      // Volume item
      const isUp = close >= open;
      volumeData.push({
        time: dateStr,
        value: c.volume || 0,
        color: isUp ? "rgba(16, 185, 129, 0.5)" : "rgba(239, 68, 68, 0.5)",
      });

      // Foreign Net Flow item
      const fNet = c.foreignNet || 0;
      foreignData.push({
        time: dateStr,
        value: fNet,
        color: fNet >= 0 ? "rgba(16, 185, 129, 0.85)" : "rgba(239, 68, 68, 0.85)",
      });
    });

    // Calculate Moving Averages from sanitized chronological candles
    candles.forEach((c, idx, arr) => {
      // MA 20
      if (idx >= 19) {
        const slice20 = arr.slice(idx - 19, idx + 1);
        const avg20 = slice20.reduce((sum, item) => sum + item.close, 0) / 20;
        ma20Data.push({ time: c.time, value: Math.round(avg20 * 100) / 100 });
      }

      // MA 50
      if (idx >= 49) {
        const slice50 = arr.slice(idx - 49, idx + 1);
        const avg50 = slice50.reduce((sum, item) => sum + item.close, 0) / 50;
        ma50Data.push({ time: c.time, value: Math.round(avg50 * 100) / 100 });
      }

      // MA 200
      if (idx >= 199) {
        const slice200 = arr.slice(idx - 199, idx + 1);
        const avg200 = slice200.reduce((sum, item) => sum + item.close, 0) / 200;
        ma200Data.push({ time: c.time, value: Math.round(avg200 * 100) / 100 });
      }
    });

    const latest = candles[candles.length - 1] || null;

    return {
      candles,
      ma20Data,
      ma50Data,
      ma200Data,
      volumeData,
      foreignData,
      latestCandle: latest,
    };
  }, [rawCandles]);

  // Sync default HUD data to latest candle
  useEffect(() => {
    if (processedData.latestCandle) {
      const l = processedData.latestCandle;
      const prevCandle =
        processedData.candles.length > 1
          ? processedData.candles[processedData.candles.length - 2]
          : null;
      const prevClose = prevCandle ? prevCandle.close : l.open;
      const change = l.close - prevClose;
      const changePct = prevClose > 0 ? (change / prevClose) * 100 : 0;

      const lastMa20 = processedData.ma20Data[processedData.ma20Data.length - 1]?.value;
      const lastMa50 = processedData.ma50Data[processedData.ma50Data.length - 1]?.value;
      const lastMa200 = processedData.ma200Data[processedData.ma200Data.length - 1]?.value;

      setHudData({
        date: l.time,
        open: l.open,
        high: l.high,
        low: l.low,
        close: l.close,
        change,
        changePct,
        volume: l.volume,
        foreignNet: l.foreignNet,
        ma20: lastMa20,
        ma50: lastMa50,
        ma200: lastMa200,
      });
    }
  }, [processedData]);

  // Build and render Lightweight Chart
  useEffect(() => {
    if (!chartContainerRef.current) return;
    if (processedData.candles.length === 0) return;

    // Clean up previous instance
    if (chartInstanceRef.current) {
      chartInstanceRef.current.remove();
      chartInstanceRef.current = null;
    }

    const container = chartContainerRef.current;
    const width = container.clientWidth || 800;
    const height = isFullscreen ? 680 : 480;

    const chart = createChart(container, {
      width,
      height,
      layout: {
        background: { type: ColorType.Solid, color: "#ffffff" },
        textColor: "#64748b",
        fontSize: 11,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      },
      grid: {
        vertLines: { color: "#f8fafc" },
        horzLines: { color: "#f1f5f9" },
      },
      crosshair: {
        vertLine: {
          color: "#94a3b8",
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: "#334155",
        },
        horzLine: {
          color: "#94a3b8",
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: "#334155",
        },
      },
      rightPriceScale: {
        borderColor: "#e2e8f0",
        scaleMargins: {
          top: 0.08,
          bottom: 0.26,
        },
      },
      timeScale: {
        borderColor: "#e2e8f0",
        rightOffset: 16,
        fixLeftEdge: true,
        fixRightEdge: false,
      },
    });

    chartInstanceRef.current = chart;

    // 1. Candlestick Series
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#10b981",
      downColor: "#ef4444",
      borderVisible: false,
      wickUpColor: "#10b981",
      wickDownColor: "#ef4444",
      priceFormat: {
        type: "price",
        precision: 0,
        minMove: 1,
      },
    });
    candleSeries.setData(processedData.candles);

    // 2. Subchart Series (Volume / Foreign Flow)
    const subSeries = chart.addSeries(HistogramSeries, {
      priceFormat: {
        type: "volume",
      },
      priceScaleId: "", // Empty string creates an independent overlay scale
      lastValueVisible: false,
      priceLineVisible: false,
    });

    subSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });

    if (subIndicator === "volume") {
      subSeries.setData(processedData.volumeData);
    } else {
      subSeries.setData(processedData.foreignData);
    }

    // 3. Moving Averages
    let ma20Series: ISeriesApi<"Line"> | null = null;
    let ma50Series: ISeriesApi<"Line"> | null = null;
    let ma200Series: ISeriesApi<"Line"> | null = null;

    if (showMa) {
      if (processedData.ma20Data.length > 0) {
        ma20Series = chart.addSeries(LineSeries, {
          color: "#f59e0b",
          lineWidth: 2,
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: false,
          title: "MA20",
        });
        ma20Series.setData(processedData.ma20Data);
      }

      if (processedData.ma50Data.length > 0) {
        ma50Series = chart.addSeries(LineSeries, {
          color: "#3b82f6",
          lineWidth: 2,
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: false,
          title: "MA50",
        });
        ma50Series.setData(processedData.ma50Data);
      }

      if (processedData.ma200Data.length > 0) {
        ma200Series = chart.addSeries(LineSeries, {
          color: "#8b5cf6",
          lineWidth: 2,
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: false,
          title: "MA200",
        });
        ma200Series.setData(processedData.ma200Data);
      }
    }

    // 4. Bandar Cost Overlay Price Line
    if (showBandarCost && bandarAvgPrice > 0) {
      candleSeries.createPriceLine({
        price: bandarAvgPrice,
        color: "#0891b2", // Cyan 600
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: `Bandar: ${bandarAvgPrice}`,
      });
    }

    // 5. Key Levels (S1, S2, R1, R2)
    if (showKeyLevels && keyLevels) {
      if (keyLevels.resistance2) {
        candleSeries.createPriceLine({
          price: keyLevels.resistance2,
          color: "#b91c1c", // Red 700
          lineWidth: 1,
          lineStyle: LineStyle.Dotted,
          axisLabelVisible: true,
          title: `R2: ${keyLevels.resistance2}`,
        });
      }
      if (keyLevels.resistance1) {
        candleSeries.createPriceLine({
          price: keyLevels.resistance1,
          color: "#e11d48", // Rose 600
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: `R1: ${keyLevels.resistance1}`,
        });
      }
      if (keyLevels.support1) {
        candleSeries.createPriceLine({
          price: keyLevels.support1,
          color: "#059669", // Emerald 600
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: `S1: ${keyLevels.support1}`,
        });
      }
      if (keyLevels.support2) {
        candleSeries.createPriceLine({
          price: keyLevels.support2,
          color: "#15803d", // Green 700
          lineWidth: 1,
          lineStyle: LineStyle.Dotted,
          axisLabelVisible: true,
          title: `S2: ${keyLevels.support2}`,
        });
      }
    }

    // 6. Trading Plan Lines (Entry Area, TP1, TP2, Stop Loss)
    if (showTradingPlan && tradingPlan) {
      if (tradingPlan.targetPrice2) {
        candleSeries.createPriceLine({
          price: tradingPlan.targetPrice2,
          color: "#7c3aed", // Violet 600
          lineWidth: 2,
          lineStyle: LineStyle.Solid,
          axisLabelVisible: true,
          title: `TP2: ${tradingPlan.targetPrice2}`,
        });
      }
      if (tradingPlan.targetPrice1) {
        candleSeries.createPriceLine({
          price: tradingPlan.targetPrice1,
          color: "#2563eb", // Blue 600
          lineWidth: 2,
          lineStyle: LineStyle.Solid,
          axisLabelVisible: true,
          title: `TP1: ${tradingPlan.targetPrice1}`,
        });
      }
      if (tradingPlan.entryArea) {
        const { min, max } = tradingPlan.entryArea;
        if (min && max && min === max) {
          candleSeries.createPriceLine({
            price: min,
            color: "#0d9488", // Teal 600
            lineWidth: 1,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title: `Entry: ${min}`,
          });
        } else {
          if (max) {
            candleSeries.createPriceLine({
              price: max,
              color: "#0d9488", // Teal 600
              lineWidth: 1,
              lineStyle: LineStyle.Dashed,
              axisLabelVisible: true,
              title: `Entry Max: ${max}`,
            });
          }
          if (min) {
            candleSeries.createPriceLine({
              price: min,
              color: "#0d9488", // Teal 600
              lineWidth: 1,
              lineStyle: LineStyle.Dashed,
              axisLabelVisible: true,
              title: `Entry Min: ${min}`,
            });
          }
        }
      }
      if (tradingPlan.stopLoss) {
        candleSeries.createPriceLine({
          price: tradingPlan.stopLoss,
          color: "#dc2626", // Red 600
          lineWidth: 2,
          lineStyle: LineStyle.Solid,
          axisLabelVisible: true,
          title: `SL: ${tradingPlan.stopLoss}`,
        });
      }
    }

    // 7. Signal Markers
    if (recentSignals && recentSignals.length > 0) {
      const markers: any[] = [];
      recentSignals.forEach((sig) => {
        if (!sig.date) return;
        const d = new Date(sig.date);
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
          d.getDate()
        ).padStart(2, "0")}`;

        // Verify date exists in candles
        const exists = processedData.candles.some((c) => c.time === dateStr);
        if (exists) {
          markers.push({
            time: dateStr,
            position: "belowBar",
            color: "#6366f1",
            shape: "arrowUp",
            text: sig.signalType || sig.title || "SINYAL",
            size: 2,
          });
        }
      });

      if (markers.length > 0) {
        createSeriesMarkers(candleSeries, markers);
      }
    }

    // 8. Crosshair Subscriber for Top HUD
    chart.subscribeCrosshairMove((param) => {
      if (!param || !param.time || !param.seriesData) {
        return;
      }

      const bar = param.seriesData.get(candleSeries) as any;
      if (bar) {
        const timeStr = String(param.time);
        const candleMatch = processedData.candles.find((c) => c.time === timeStr);
        const candleIdx = processedData.candles.findIndex((c) => c.time === timeStr);
        const prevCandle = candleIdx > 0 ? processedData.candles[candleIdx - 1] : null;
        const prevClose = prevCandle ? prevCandle.close : bar.open;
        const change = bar.close - prevClose;
        const changePct = prevClose > 0 ? (change / prevClose) * 100 : 0;

        const ma20Val = ma20Series ? (param.seriesData.get(ma20Series) as any)?.value : undefined;
        const ma50Val = ma50Series ? (param.seriesData.get(ma50Series) as any)?.value : undefined;
        const ma200Val = ma200Series ? (param.seriesData.get(ma200Series) as any)?.value : undefined;

        setHudData({
          date: timeStr,
          open: bar.open,
          high: bar.high,
          low: bar.low,
          close: bar.close,
          change,
          changePct,
          volume: candleMatch?.volume || 0,
          foreignNet: candleMatch?.foreignNet || 0,
          ma20: ma20Val,
          ma50: ma50Val,
          ma200: ma200Val,
        });
      }
    });

    // Auto fit content and preserve right offset margin gap
    chart.timeScale().fitContent();
    chart.timeScale().applyOptions({
      rightOffset: 16,
    });

    // Handle Resize
    const handleResize = () => {
      if (chartContainerRef.current && chartInstanceRef.current) {
        chartInstanceRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (chartInstanceRef.current) {
        chartInstanceRef.current.remove();
        chartInstanceRef.current = null;
      }
    };
  }, [
    processedData,
    subIndicator,
    showMa,
    showBandarCost,
    showKeyLevels,
    showTradingPlan,
    isFullscreen,
    bandarAvgPrice,
    keyLevels,
    tradingPlan,
    recentSignals,
  ]);

  if (loading && processedData.candles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-28 bg-white rounded-xl border border-slate-200 shadow-sm">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
        <span className="text-sm font-semibold text-slate-600">
          Memuat grafik interaktif {ticker?.toUpperCase()}...
        </span>
      </div>
    );
  }

  if (error || processedData.candles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-slate-200 text-center px-4">
        <Activity className="w-8 h-8 text-slate-400 mb-2" />
        <p className="text-sm font-semibold text-slate-700">
          Data grafik belum tersedia untuk {ticker?.toUpperCase()}
        </p>
        <p className="text-xs text-slate-400 mt-1 max-w-sm">
          Riwayat candle harian belum tercatat atau sedang diperbarui oleh sistem IDX.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 shadow-sm transition-all duration-300 overflow-hidden ${
        isFullscreen ? "fixed inset-4 z-50 shadow-2xl border-indigo-200" : ""
      }`}
    >
      {/* 1. Control Toolbar */}
      <div className="p-3 sm:p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70">
        {/* Timeframe selector */}
        <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-lg">
          {(["1M", "3M", "6M", "1Y", "ALL"] as TimeframeOption[]).map((tf) => (
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
              {tf}
            </button>
          ))}
        </div>

        {/* Feature & Indicator Toggles */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {/* Subchart Indicator Toggle */}
          <div className="flex items-center gap-0.5 bg-slate-200/70 p-1 rounded-lg text-xs font-semibold">
            <button
              type="button"
              onClick={() => setSubIndicator("volume")}
              className={`px-2 py-0.5 rounded transition-all ${
                subIndicator === "volume"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Volume
            </button>
            <button
              type="button"
              onClick={() => setSubIndicator("foreign")}
              className={`px-2 py-0.5 rounded transition-all ${
                subIndicator === "foreign"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Foreign Flow
            </button>
          </div>

          {/* Toggle Bandar Cost */}
          {bandarAvgPrice > 0 && (
            <button
              type="button"
              onClick={() => setShowBandarCost(!showBandarCost)}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-all flex items-center gap-1.5 ${
                showBandarCost
                  ? "border-cyan-300 bg-cyan-50 text-cyan-800 font-semibold"
                  : "border-slate-200 bg-white text-slate-500"
              }`}
              title="Garis rata-rata modal bandar / smart money"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-600" />
              <span>Bandar Cost</span>
            </button>
          )}

          {/* Toggle MA Lines */}
          <button
            type="button"
            onClick={() => setShowMa(!showMa)}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-all flex items-center gap-1.5 ${
              showMa
                ? "border-amber-200 bg-amber-50/80 text-amber-800 font-semibold"
                : "border-slate-200 bg-white text-slate-500"
            }`}
          >
            <span className="inline-block w-2 h-2 rounded-full bg-amber-500"></span>
            <span>MA (20/50/200)</span>
          </button>

          {/* Toggle Key Levels */}
          <button
            type="button"
            onClick={() => setShowKeyLevels(!showKeyLevels)}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-all flex items-center gap-1.5 ${
              showKeyLevels
                ? "border-emerald-200 bg-emerald-50/80 text-emerald-800 font-semibold"
                : "border-slate-200 bg-white text-slate-500"
            }`}
          >
            <Layers className="w-3 h-3 text-emerald-600" />
            <span>S/R Levels</span>
          </button>

          {/* Toggle Trading Plan */}
          {tradingPlan && (
            <button
              type="button"
              onClick={() => setShowTradingPlan(!showTradingPlan)}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-all flex items-center gap-1.5 ${
                showTradingPlan
                  ? "border-violet-200 bg-violet-50 text-violet-800 font-semibold"
                  : "border-slate-200 bg-white text-slate-500"
              }`}
            >
              <Target className="w-3 h-3 text-violet-600" />
              <span>Trading Plan</span>
            </button>
          )}

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            title={isFullscreen ? "Keluar layar penuh" : "Layar penuh"}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 2. Interactive Crosshair HUD / Legend Bar */}
      {hudData && (
        <div className="px-4 py-2.5 bg-slate-50/50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 text-xs">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-semibold text-slate-800 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              {hudData.date}
            </span>
            <span className="text-slate-500">
              O: <b className="text-slate-800 font-mono">Rp {hudData.open.toLocaleString("id-ID")}</b>
            </span>
            <span className="text-slate-500">
              H: <b className="text-emerald-700 font-mono">Rp {hudData.high.toLocaleString("id-ID")}</b>
            </span>
            <span className="text-slate-500">
              L: <b className="text-rose-700 font-mono">Rp {hudData.low.toLocaleString("id-ID")}</b>
            </span>
            <span className="text-slate-500">
              C: <b className="text-slate-900 font-mono">Rp {hudData.close.toLocaleString("id-ID")}</b>
            </span>
            <span
              className={`font-semibold font-mono px-1.5 py-0.5 rounded text-[11px] ${
                hudData.change >= 0
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-rose-100 text-rose-800"
              }`}
            >
              {hudData.change >= 0 ? "+" : ""}
              {hudData.change} ({hudData.changePct >= 0 ? "+" : ""}
              {hudData.changePct.toFixed(2)}%)
            </span>
          </div>

          <div className="flex items-center gap-3 flex-wrap text-[11px]">
            {subIndicator === "volume" ? (
              <span className="text-slate-500">
                Vol: <b className="text-slate-800 font-mono">{hudData.volume.toLocaleString("id-ID")} lot</b>
              </span>
            ) : (
              <span className="text-slate-500">
                Foreign Net:{" "}
                <b
                  className={`font-mono ${
                    (hudData.foreignNet || 0) >= 0 ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {(hudData.foreignNet || 0) >= 0 ? "+" : ""}
                  {(hudData.foreignNet || 0).toLocaleString("id-ID")} lot
                </b>
              </span>
            )}

            {showMa && (
              <>
                {hudData.ma20 !== undefined && (
                  <span className="text-amber-600 font-semibold font-mono">MA20: {hudData.ma20}</span>
                )}
                {hudData.ma50 !== undefined && (
                  <span className="text-blue-600 font-semibold font-mono">MA50: {hudData.ma50}</span>
                )}
                {hudData.ma200 !== undefined && (
                  <span className="text-purple-600 font-semibold font-mono">MA200: {hudData.ma200}</span>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* 3. Canvas Container */}
      <div
        ref={chartContainerRef}
        className="w-full relative cursor-crosshair"
        style={{ height: isFullscreen ? "680px" : "480px" }}
      />

      {/* 4. Bottom Legend & Quick Summary */}
      <div className="px-4 py-2.5 bg-slate-50/70 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
        <div className="flex items-center gap-3 flex-wrap">
          {bandarAvgPrice > 0 && showBandarCost && (
            <span className="flex items-center gap-1 text-cyan-700 font-semibold">
              <span className="w-2.5 h-0.5 bg-cyan-600 inline-block border-b border-cyan-800"></span>
              Bandar Cost: Rp {bandarAvgPrice.toLocaleString("id-ID")}
            </span>
          )}
          {tradingPlan?.targetPrice1 && showTradingPlan && (
            <span className="flex items-center gap-1 text-blue-700 font-semibold">
              <span className="w-2.5 h-0.5 bg-blue-600 inline-block"></span>
              TP1: Rp {tradingPlan.targetPrice1.toLocaleString("id-ID")}
            </span>
          )}
          {tradingPlan?.stopLoss && showTradingPlan && (
            <span className="flex items-center gap-1 text-rose-700 font-semibold">
              <span className="w-2.5 h-0.5 bg-rose-600 inline-block"></span>
              SL: Rp {tradingPlan.stopLoss.toLocaleString("id-ID")}
            </span>
          )}
        </div>

        <span className="text-slate-400">
          Scroll mouse untuk Zoom • Geser untuk Pan • Data Candle IDX Resmi
        </span>
      </div>
    </div>
  );
}
