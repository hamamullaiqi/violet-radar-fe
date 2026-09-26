"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Flame,
  Search,
  RefreshCw,
  Sparkles,
  Zap,
  ArrowUpRight,
  Layers,
  Anchor,
  ExternalLink,
  Dices,
  Info,
  ShieldCheck,
  Globe2
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import useFetch from "@/hooks/useFetch";
import TickerLogo from "@/components/ui/TickerLogo";
import { AraAccumulationCandidate } from "./AraAccumulationRadarCard";
import { BottomHunterCandidate } from "./BottomHunterRadarCard";
import { FastReboundCandidate } from "./FastReboundRadarCard";

export type UnifiedViewMode = "TOP_3_DAILY" | "ALL_POOL" | "ARA_ACCUMULATION" | "BOTTOM_HUNTER" | "FAST_REBOUND";
export type UniverseFilter = "ALL" | "KOMPAS100";

const KOMPAS100_TICKERS = new Set([
  'BBCA', 'BBRI', 'BMRI', 'BBNI', 'BRIS', 'BDMN', 'BBTN', 'BTPS', 'ARTO', 'BNGA', 'BJBR', 'BJTM', 'BNLI', 'PNBN', 'BNII', 'BBKP', 'AGRO', 'ADMF', 'BFIN',
  'ADRO', 'PTBA', 'ITMG', 'BUMI', 'MEDC', 'PGAS', 'AKRA', 'INDY', 'HRUM', 'PGEO', 'ABMM', 'DOID', 'ELSA', 'ENRG', 'RAJA', 'BSSR', 'MBAP', 'TOBA',
  'ANTM', 'MDKA', 'INCO', 'TINS', 'MBMA', 'NCKL', 'AMMN', 'PSAB', 'BRMS', 'BREN', 'CUAN', 'PTRO',
  'TLKM', 'ISAT', 'EXCL', 'GOTO', 'EMTK', 'TOWR', 'MTEL', 'TBIG', 'BUKA', 'SCMA', 'WIFI', 'MTDL', 'DMMX',
  'UNVR', 'ICBP', 'INDF', 'MYOR', 'AMRT', 'MIDI', 'KLBF', 'SIDO', 'ACES', 'MAPI', 'MAPA', 'CPIN', 'JPFA', 'CMRY', 'ROTI', 'ULTJ', 'CLEO', 'HEAL', 'MIKA', 'SILO', 'PRDA',
  'ASII', 'UNTR', 'AUTO', 'DRMA', 'SMSM', 'HEXA',
  'BRPT', 'TPIA', 'INKP', 'TKIM', 'SMGR', 'INTP', 'AVIA', 'ESSA', 'MCOL', 'ARNA', 'SMBR',
  'BSDE', 'CTRA', 'PWON', 'SMRA', 'PANI', 'JSMR', 'PTPP', 'ADHI', 'WIKA', 'SSIA', 'DMAS', 'ASRI', 'KIJA', 'IPCC', 'SMDR', 'TMAS'
]);

export interface IUnifiedRadarRow {
  id: string;
  radarType: "ARA_ACCUMULATION" | "BOTTOM_HUNTER" | "FAST_REBOUND";
  radarLabel: string;
  radarColor: string;
  radarIcon: React.ReactNode;
  rank: number;
  isRandomPick: boolean;
  selectionBadge: string;
  ticker: string;
  stockName?: string;
  isKompas100: boolean;
  currentPrice: number;
  changePercent: number;
  turnoverRupiah: number;
  setupDescription: string;
  setupBadge: string;
  entryPrice: number;
  target1: { price: number; gainPercent: number };
  target2: { price: number; gainPercent: number };
  stopLoss: { price: number; riskPercent: number };
  riskRewardRatio: number;
  score: number;
  holdingTimeEstimate: string;
}

export default function UnifiedSpecialRadarTable() {
  const [viewMode, setViewMode] = useState<UnifiedViewMode>("TOP_3_DAILY");
  const [universeFilter, setUniverseFilter] = useState<UniverseFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [bypassTrigger, setBypassTrigger] = useState(0);

  // Random indices for Top 5 pool picks
  const [randomAraIndex, setRandomAraIndex] = useState<number>(0);
  const [randomBottomIndex, setRandomBottomIndex] = useState<number>(0);
  const [isRerolling, setIsRerolling] = useState(false);

  // 1. Fetch Top 5 Calon ARA (Fase Akumulasi Sideways 1 Bulan)
  const {
    data: araData,
    loading: araLoading,
    refetch: refetchAra
  } = useFetch<any>(
    `/api/strategies/ara-accumulation?limit=5${bypassTrigger > 0 ? `&refresh=true&t=${bypassTrigger}` : ""}`
  );

  // 2. Fetch Top 5 Bottom Hunter (Lantai Dasar 1 Tahun & Support Kuat)
  const {
    data: bottomData,
    loading: bottomLoading,
    refetch: refetchBottom
  } = useFetch<any>(
    `/api/strategies/bottom-hunter?limit=5${bypassTrigger > 0 ? `&refresh=true&t=${bypassTrigger}` : ""}`
  );

  // 3. Fetch Top 1 Fast V-Rebound (Juara Pantulan Cepat Tertinggi)
  const {
    data: reboundData,
    loading: reboundLoading,
    refetch: refetchRebound
  } = useFetch<any>(
    `/api/strategies/fast-rebound?limit=1${bypassTrigger > 0 ? `&refresh=true&t=${bypassTrigger}` : ""}`
  );

  const isLoading = araLoading || bottomLoading || reboundLoading;

  // Initialize randomized pick when data arrives
  const handleRerollRandom = () => {
    setIsRerolling(true);
    const araCount = Math.max(1, Math.min(5, (araData?.candidates || araData || []).length || 5));
    const bottomCount = Math.max(1, Math.min(5, (bottomData?.candidates || bottomData || []).length || 5));

    setRandomAraIndex(Math.floor(Math.random() * araCount));
    setRandomBottomIndex(Math.floor(Math.random() * bottomCount));

    setTimeout(() => setIsRerolling(false), 300);
  };

  const handleRefreshAll = () => {
    setBypassTrigger(Date.now());
    refetchAra();
    refetchBottom();
    refetchRebound();
  };

  // Harmonize all items into a single unified list
  const { allPoolRows, top3DailyRows } = useMemo(() => {
    const allRows: IUnifiedRadarRow[] = [];

    // A. 5 Saham Calon ARA
    const araList: AraAccumulationCandidate[] = Array.isArray(araData)
      ? araData
      : Array.isArray(araData?.candidates)
      ? araData.candidates
      : Array.isArray(araData?.grouped?.all)
      ? araData.grouped.all
      : [];

    const araRows: IUnifiedRadarRow[] = [];
    if (araList.length > 0) {
      araList.slice(0, 5).forEach((item, idx) => {
        const riskReward =
          item.stopLossRiskPercent > 0
            ? Number((item.targetAraGainPercent / item.stopLossRiskPercent).toFixed(2))
            : 2.5;

        const isKompas = KOMPAS100_TICKERS.has(item.ticker.toUpperCase());

        const row: IUnifiedRadarRow = {
          id: `ARA_${item.ticker}_${idx}`,
          radarType: "ARA_ACCUMULATION",
          radarLabel: "Calon ARA",
          radarColor: "border-pink-500/30 bg-pink-500/10 text-pink-400",
          radarIcon: <Flame className="w-3.5 h-3.5 text-pink-400" />,
          rank: idx + 1,
          isRandomPick: idx === (randomAraIndex % araList.length),
          selectionBadge: `🎲 Random Pick #${idx + 1}`,
          ticker: item.ticker,
          stockName: item.stockName,
          isKompas100: isKompas,
          currentPrice: item.currentPrice,
          changePercent: item.changePercent || 0,
          turnoverRupiah: item.turnoverRupiah || 0,
          setupDescription: item.catalystSummary || item.phaseDescription || "Akumulasi Sideways 1 Bulan & Volume Kering",
          setupBadge:
            item.phaseBadge === "AKUMULASI_MATANG"
              ? "Akumulasi Matang"
              : item.phaseBadge === "RE_ACCUMULATION_BASE"
              ? "Base Sideways 1 Bln"
              : "Pullback Support",
          entryPrice: item.currentPrice,
          target1: {
            price: item.targetPrice1 || Math.round(item.currentPrice * 1.07),
            gainPercent: Number((((item.targetPrice1 - item.currentPrice) / item.currentPrice) * 100).toFixed(1)) || 7.0
          },
          target2: {
            price: item.targetAraPrice || Math.round(item.currentPrice * 1.15),
            gainPercent: Number(item.targetAraGainPercent.toFixed(1)) || 15.0
          },
          stopLoss: {
            price: item.stopLossPrice,
            riskPercent: Number(item.stopLossRiskPercent.toFixed(1)) || 3.0
          },
          riskRewardRatio: riskReward,
          score: item.score || 80,
          holdingTimeEstimate: "4 - 7 Hari"
        };
        araRows.push(row);
        allRows.push(row);
      });
    }

    // B. 5 Saham Bottom Hunter
    const bottomList: BottomHunterCandidate[] = Array.isArray(bottomData)
      ? bottomData
      : Array.isArray(bottomData?.candidates)
      ? bottomData.candidates
      : Array.isArray(bottomData?.grouped?.all)
      ? bottomData.grouped.all
      : [];

    const bottomRows: IUnifiedRadarRow[] = [];
    if (bottomList.length > 0) {
      bottomList.slice(0, 5).forEach((item, idx) => {
        const riskReward =
          item.safeStopLossPercent > 0
            ? Number((item.targetGain2Percent / item.safeStopLossPercent).toFixed(2))
            : item.riskRewardRatio || 3.2;

        const isKompas = KOMPAS100_TICKERS.has(item.ticker.toUpperCase());

        const row: IUnifiedRadarRow = {
          id: `BOTTOM_${item.ticker}_${idx}`,
          radarType: "BOTTOM_HUNTER",
          radarLabel: "Bottom Hunter",
          radarColor: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
          radarIcon: <Anchor className="w-3.5 h-3.5 text-emerald-400" />,
          rank: idx + 1,
          isRandomPick: idx === (randomBottomIndex % bottomList.length),
          selectionBadge: `🎲 Random Pick #${idx + 1}`,
          ticker: item.ticker,
          stockName: item.stockName,
          isKompas100: isKompas,
          currentPrice: item.currentPrice,
          changePercent: item.changePercent || 0,
          turnoverRupiah: item.turnoverRupiah || 0,
          setupDescription: item.catalystSummary || item.floorDescription || "Lantai Dasar 1 Tahun / Low 20 Hari",
          setupBadge:
            item.floorType === "52W_ABSOLUTE_LOW"
              ? "Lantai 52-Minggu"
              : item.floorType === "STRUCTURAL_BASE_SUPPORT"
              ? "Base Support 1 Bln"
              : "Lantai Kuartalan",
          entryPrice: item.entryPrice || item.currentPrice,
          target1: {
            price: item.targetPrice1 || Math.round(item.currentPrice * 1.08),
            gainPercent: Number(item.targetGain1Percent.toFixed(1)) || 8.0
          },
          target2: {
            price: item.targetPrice2 || Math.round(item.currentPrice * 1.18),
            gainPercent: Number(item.targetGain2Percent.toFixed(1)) || 18.0
          },
          stopLoss: {
            price: item.safeStopLoss || Math.round(item.currentPrice * 0.97),
            riskPercent: Number(item.safeStopLossPercent.toFixed(1)) || 2.5
          },
          riskRewardRatio: riskReward,
          score: item.confidenceScore || 85,
          holdingTimeEstimate: "5 - 10 Hari"
        };
        bottomRows.push(row);
        allRows.push(row);
      });
    }

    // C. 1 Saham Fast V-Rebound (Top 1)
    const reboundList: FastReboundCandidate[] = Array.isArray(reboundData)
      ? reboundData
      : Array.isArray(reboundData?.candidates)
      ? reboundData.candidates
      : Array.isArray(reboundData?.grouped?.all)
      ? reboundData.grouped.all
      : [];

    let top1ReboundRow: IUnifiedRadarRow | null = null;
    if (reboundList.length > 0) {
      const top1Rebound = reboundList[0];
      const riskReward =
        top1Rebound.stopLossRiskPercent > 0
          ? Number((top1Rebound.targetReboundQuickGainPercent / top1Rebound.stopLossRiskPercent).toFixed(2))
          : 1.5;

      const isKompas = KOMPAS100_TICKERS.has(top1Rebound.ticker.toUpperCase());

      top1ReboundRow = {
        id: `REBOUND_${top1Rebound.ticker}_0`,
        radarType: "FAST_REBOUND",
        radarLabel: "Fast V-Rebound",
        radarColor: "border-amber-500/30 bg-amber-500/10 text-amber-400",
        radarIcon: <Zap className="w-3.5 h-3.5 text-amber-400" />,
        rank: 1,
        isRandomPick: false,
        selectionBadge: "⭐ Juara #1 Rebound",
        ticker: top1Rebound.ticker,
        stockName: top1Rebound.stockName,
        isKompas100: isKompas,
        currentPrice: top1Rebound.currentPrice,
        changePercent: top1Rebound.changePercent || 0,
        turnoverRupiah: top1Rebound.turnoverRupiah || 0,
        setupDescription: `Track Record: ${top1Rebound.reboundTrackRecordCount1Year}x Rebound Sukses (Avg +${top1Rebound.avgHistoricalReboundGainPercent.toFixed(1)}%)`,
        setupBadge: "⭐ Top 1 Pantulan Terkuat",
        entryPrice: top1Rebound.entryPrice || top1Rebound.currentPrice,
        target1: {
          price: top1Rebound.targetReboundQuick,
          gainPercent: Number(top1Rebound.targetReboundQuickGainPercent.toFixed(1)) || 7.0
        },
        target2: {
          price: top1Rebound.targetVPeak || Math.round(top1Rebound.currentPrice * 1.15),
          gainPercent: Number(top1Rebound.targetVPeakGainPercent.toFixed(1)) || 15.0
        },
        stopLoss: {
          price: top1Rebound.stopLossPrice,
          riskPercent: Number(top1Rebound.stopLossRiskPercent.toFixed(1)) || 4.5
        },
        riskRewardRatio: riskReward,
        score: top1Rebound.score || 90,
        holdingTimeEstimate: "2 - 4 Hari"
      };
      allRows.push(top1ReboundRow);
    }

    // Build the 3 Selected Stocks:
    const selected3: IUnifiedRadarRow[] = [];
    if (araRows.length > 0) {
      const chosenAra = araRows[randomAraIndex % araRows.length] || araRows[0];
      selected3.push(chosenAra);
    }
    if (bottomRows.length > 0) {
      const chosenBottom = bottomRows[randomBottomIndex % bottomRows.length] || bottomRows[0];
      selected3.push(chosenBottom);
    }
    if (top1ReboundRow) {
      selected3.push(top1ReboundRow);
    }

    return { allPoolRows: allRows, top3DailyRows: selected3 };
  }, [araData, bottomData, reboundData, randomAraIndex, randomBottomIndex]);

  // Filter & Search
  const currentDisplayList = useMemo(() => {
    let list: IUnifiedRadarRow[] = [];

    if (viewMode === "TOP_3_DAILY") {
      list = top3DailyRows;
    } else if (viewMode === "ALL_POOL") {
      list = allPoolRows;
    } else if (viewMode === "ARA_ACCUMULATION") {
      list = allPoolRows.filter((r) => r.radarType === "ARA_ACCUMULATION");
    } else if (viewMode === "BOTTOM_HUNTER") {
      list = allPoolRows.filter((r) => r.radarType === "BOTTOM_HUNTER");
    } else if (viewMode === "FAST_REBOUND") {
      list = allPoolRows.filter((r) => r.radarType === "FAST_REBOUND");
    }

    // Universe Filter (KOMPAS100 vs ALL)
    if (universeFilter === "KOMPAS100") {
      list = list.filter((r) => r.isKompas100);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      list = list.filter((row) => {
        const matchTicker = row.ticker.toLowerCase().includes(query);
        const matchName = (row.stockName || "").toLowerCase().includes(query);
        const matchSetup = row.setupDescription.toLowerCase().includes(query);
        return matchTicker || matchName || matchSetup;
      });
    }

    return list;
  }, [viewMode, universeFilter, top3DailyRows, allPoolRows, searchQuery]);

  return (
    <TooltipProvider>
      <Card className="border border-slate-800 bg-slate-900/90 backdrop-blur-md shadow-2xl rounded-2xl overflow-hidden">
        {/* HEADER */}
        <CardHeader className="p-6 border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-gradient-to-tr from-pink-600 via-indigo-600 to-emerald-500 shadow-lg shadow-indigo-500/20 text-white">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                      Special Radars: 3 Saham Pilihan Harian
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {viewMode === "TOP_3_DAILY" ? "3 Saham Fokus" : `${currentDisplayList.length} Kandidat`}
                      </span>
                    </CardTitle>
                  </div>
                  <CardDescription className="text-xs text-slate-400 mt-0.5 flex flex-wrap items-center gap-2">
                    <span className="text-pink-400 font-medium">🎲 1 Calon ARA (Random Top 5)</span>
                    <span>•</span>
                    <span className="text-emerald-400 font-medium">🎲 1 Bottom Hunter (Random Top 5)</span>
                    <span>•</span>
                    <span className="text-amber-400 font-medium">⭐ 1 Fast V-Rebound (Top 1 Juara)</span>
                    <span className="hidden sm:inline-block text-slate-600">|</span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-300 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded">
                      🛡️ Anti-Gocap & FCA (Min Rp 70 • Turnover &gt; Rp 500 Jt)
                    </span>
                  </CardDescription>
                </div>
              </div>
            </div>

            {/* ACTION CONTROLS */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* UNIVERSE TOGGLE: ALL vs KOMPAS100 */}
              <div className="inline-flex p-0.5 bg-slate-950/80 rounded-lg border border-slate-800">
                <button
                  onClick={() => setUniverseFilter("ALL")}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold transition ${
                    universeFilter === "ALL"
                      ? "bg-slate-800 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                  title="Tampilkan seluruh saham likuid yang aktif di bursa"
                >
                  <Globe2 className="w-3.5 h-3.5" />
                  <span>Semua Likuid</span>
                </button>
                <button
                  onClick={() => setUniverseFilter("KOMPAS100")}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold transition ${
                    universeFilter === "KOMPAS100"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-indigo-300"
                  }`}
                  title="Filter hanya 100 saham terlikuid & berkapitalisasi besar (Kompas100)"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>KOMPAS100</span>
                </button>
              </div>

              {/* REROLL RANDOM PICK BUTTON */}
              <button
                onClick={handleRerollRandom}
                disabled={isLoading}
                title="Acak ulang pemilihan saham dari Top 5 pool"
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/80 active:scale-95 rounded-lg border border-emerald-600/40 shadow-sm transition disabled:opacity-50"
              >
                <Dices className={`w-4 h-4 text-emerald-400 ${isRerolling ? "animate-spin" : ""}`} />
                <span>Acak (Reroll)</span>
              </button>

              {/* SEARCH INPUT */}
              <div className="relative w-full sm:w-48">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <Input
                  placeholder="Cari kode..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 bg-slate-950/60 border-slate-800 focus:border-indigo-500 text-xs text-white placeholder:text-slate-500 rounded-lg"
                />
              </div>

              {/* REFRESH BUTTON */}
              <button
                onClick={handleRefreshAll}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-lg border border-slate-700 transition disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-indigo-400" : ""}`} />
              </button>
            </div>
          </div>

          {/* FILTER / VIEW MODE TABS */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-4 mt-2 border-t border-slate-800/80">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setViewMode("TOP_3_DAILY")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  viewMode === "TOP_3_DAILY"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "bg-slate-800/70 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
                <span>🎯 3 Saham Utama Hari Ini</span>
              </button>

              <button
                onClick={() => setViewMode("ALL_POOL")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  viewMode === "ALL_POOL"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "bg-slate-800/70 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>📋 Pool Lengkap ({allPoolRows.length} Saham)</span>
              </button>

              <button
                onClick={() => setViewMode("ARA_ACCUMULATION")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  viewMode === "ARA_ACCUMULATION"
                    ? "bg-pink-600 text-white shadow-md shadow-pink-600/30"
                    : "bg-slate-800/70 text-slate-400 hover:text-pink-300 hover:bg-slate-800 border border-slate-800"
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-pink-400" />
                <span>🚀 Top 5 Calon ARA</span>
              </button>

              <button
                onClick={() => setViewMode("BOTTOM_HUNTER")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  viewMode === "BOTTOM_HUNTER"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                    : "bg-slate-800/70 text-slate-400 hover:text-emerald-300 hover:bg-slate-800 border border-slate-800"
                }`}
              >
                <Anchor className="w-3.5 h-3.5 text-emerald-400" />
                <span>🛡️ Top 5 Bottom Hunter</span>
              </button>

              <button
                onClick={() => setViewMode("FAST_REBOUND")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  viewMode === "FAST_REBOUND"
                    ? "bg-amber-600 text-white shadow-md shadow-amber-600/30"
                    : "bg-slate-800/70 text-slate-400 hover:text-amber-300 hover:bg-slate-800 border border-slate-800"
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>⚡ Top 1 Fast V-Rebound</span>
              </button>
            </div>

            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-indigo-400" />
              <span>Proteksi Anti-Tidur: Batas simpan maksimal 4-7 hari. Jika stagnan, sistem merekomendasikan exit.</span>
            </div>
          </div>
        </CardHeader>

        {/* TABLE CONTENT */}
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-800 bg-slate-950/70 hover:bg-slate-950/70 text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                  <TableHead className="w-36">Kategori Radar</TableHead>
                  <TableHead className="min-w-[160px]">Saham Terpilih</TableHead>
                  <TableHead className="text-right">Harga Terakhir</TableHead>
                  <TableHead className="min-w-[180px]">Karakteristik Setup</TableHead>
                  <TableHead className="text-right">Target 1 (TP1)</TableHead>
                  <TableHead className="text-right">Target 2 (TP2)</TableHead>
                  <TableHead className="text-right">Stop Loss (SL)</TableHead>
                  <TableHead className="text-center">Risk : Reward</TableHead>
                  <TableHead className="text-center">Skor</TableHead>
                  <TableHead className="text-center w-24">Aksi</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading && currentDisplayList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="h-44 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
                        <span className="text-xs">Menyaring 3 saham terbaik Special Radars...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : currentDisplayList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="h-32 text-center text-slate-500 text-xs">
                      {universeFilter === "KOMPAS100"
                        ? "Tidak ada saham KOMPAS100 pada filter ini. Coba beralih ke toggle 'Semua Likuid'."
                        : "Tidak ada saham yang sesuai dengan filter."}
                    </TableCell>
                  </TableRow>
                ) : (
                  currentDisplayList.map((row) => (
                    <TableRow
                      key={row.id}
                      className="border-b border-slate-800/60 hover:bg-slate-800/40 transition group"
                    >
                      {/* 1. STRATEGY RADAR BADGE */}
                      <TableCell>
                        <div className="space-y-1">
                          <Badge
                            variant="outline"
                            className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold w-fit ${row.radarColor}`}
                          >
                            {row.radarIcon}
                            <span>{row.radarLabel}</span>
                          </Badge>
                          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                            {row.radarType === "FAST_REBOUND" ? (
                              <span className="text-amber-400 font-semibold">⭐ Top 1 Juara</span>
                            ) : (
                              <span className="text-emerald-400 font-medium">🎲 Pick #{row.rank} dari Top 5</span>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* 2. TICKER & NAME */}
                      <TableCell>
                        <Link
                          href={`/ticker/${row.ticker}`}
                          className="flex items-center gap-2.5 group/link"
                        >
                          <TickerLogo ticker={row.ticker} size="sm" />
                          <div>
                            <div className="font-bold text-white text-base tracking-wide group-hover/link:text-indigo-400 transition flex items-center gap-1.5">
                              {row.ticker}
                              {row.isKompas100 && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                  KOMPAS100
                                </span>
                              )}
                              <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover/link:text-indigo-400 transition" />
                            </div>
                            <div className="text-[11px] text-slate-500 truncate max-w-[130px]">
                              {row.stockName || "IDX Equity"}
                            </div>
                          </div>
                        </Link>
                      </TableCell>

                      {/* 3. CURRENT PRICE & CHG */}
                      <TableCell className="text-right">
                        <div className="font-mono font-bold text-white text-sm">
                          Rp {row.currentPrice.toLocaleString("id-ID")}
                        </div>
                        <div
                          className={`text-xs font-semibold font-mono ${
                            row.changePercent > 0
                              ? "text-emerald-400"
                              : row.changePercent < 0
                              ? "text-rose-400"
                              : "text-slate-400"
                          }`}
                        >
                          {row.changePercent > 0 ? "+" : ""}
                          {row.changePercent.toFixed(1)}%
                        </div>
                      </TableCell>

                      {/* 4. SETUP & SETUP BADGE */}
                      <TableCell>
                        <div className="space-y-1">
                          <Badge
                            variant="secondary"
                            className="bg-slate-800 text-slate-300 border border-slate-700/60 text-[10px] font-medium px-2 py-0.5"
                          >
                            {row.setupBadge}
                          </Badge>
                          <div className="text-[11px] text-slate-400 leading-tight line-clamp-1 max-w-[210px]">
                            {row.setupDescription}
                          </div>
                        </div>
                      </TableCell>

                      {/* 5. TARGET 1 (TP1) */}
                      <TableCell className="text-right font-mono">
                        <div className="text-emerald-400 font-bold text-xs">
                          Rp {row.target1.price.toLocaleString("id-ID")}
                        </div>
                        <div className="text-[10px] text-emerald-500 font-semibold">
                          +{row.target1.gainPercent}%
                        </div>
                      </TableCell>

                      {/* 6. TARGET 2 (TP2 / EXPLOSION) */}
                      <TableCell className="text-right font-mono">
                        <div className="text-indigo-300 font-bold text-xs flex items-center justify-end gap-1">
                          Rp {row.target2.price.toLocaleString("id-ID")}
                        </div>
                        <div className="text-[10px] text-indigo-400 font-semibold">
                          +{row.target2.gainPercent}%
                        </div>
                      </TableCell>

                      {/* 7. STOP LOSS (SL) */}
                      <TableCell className="text-right font-mono">
                        <div className="text-rose-400 font-bold text-xs">
                          Rp {row.stopLoss.price.toLocaleString("id-ID")}
                        </div>
                        <div className="text-[10px] text-rose-500 font-semibold">
                          -{row.stopLoss.riskPercent}%
                        </div>
                      </TableCell>

                      {/* 8. RISK : REWARD RATIO */}
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className="font-mono text-xs px-2.5 py-0.5 bg-slate-950/80 border-slate-700/80 text-emerald-400 font-bold"
                        >
                          {row.riskRewardRatio.toFixed(1)} : 1
                        </Badge>
                      </TableCell>

                      {/* 9. SCORE */}
                      <TableCell className="text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className="font-mono font-bold text-xs text-white">{row.score}</span>
                          <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-0.5">
                            <div
                              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full"
                              style={{ width: `${Math.min(100, Math.max(10, row.score))}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>

                      {/* 10. ACTION */}
                      <TableCell className="text-center">
                        <Link
                          href={`/ticker/${row.ticker}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 rounded-lg transition"
                        >
                          <span>Analisa</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* FOOTER METRICS INFO */}
          <div className="p-4 bg-slate-950/90 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between text-xs text-slate-400 gap-3">
            <div className="flex flex-wrap items-center gap-4 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-pink-500"></span>
                <span>Calon ARA: Max Hold 6-7 Hari</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Bottom Hunter: Max Hold 8-10 Hari</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>Fast V-Rebound: Max Hold 3-4 Hari</span>
              </div>
            </div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1">
              <Info className="w-3.5 h-3.5" />
              <span>Gunakan toggle <b>KOMPAS100</b> untuk membatasi screening hanya pada 100 saham terlikuid di bursa.</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
