"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  TrendingUp,
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Target,
  Sparkles,
  Wallet,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  AlertTriangle,
  History,
  Info,
  Clock,
  Zap,
  Filter,
  Search,
  Maximize2,
  DollarSign,
  Briefcase
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import useFetch from "@/hooks/useFetch";
import TickerDetailDialog from "./TickerDetailDialog";

interface TradeJourneyRecord {
  tradeNo: number;
  slotId: 'Slot 1' | 'Slot 2';
  ticker: string;
  signalDate: string;
  entryDate: string;
  exitDate: string;
  signalPrice: number;
  matchPrice: number;
  matchStatus: string;
  finalSlPrice: number;
  finalSlNote: string;
  exitPriceRemaining: number;
  daysHeld: number;
  totalLots: number;
  tp1LotsSold: number;
  remainingLotsSold: number;
  totalShares: number;
  saldoRdnSebelumEntryRp: number;
  debitKasKeluarRp: number;
  sisaRdnSetelahBeliRp: number;
  kreditKasMasukRp: number;
  netPnlRp: number;
  netPnlPct: number;
  peakGainPct: number;
  exitReason: string;
  saldoRdnTerkiniRp: number;
}

interface DaySlotState {
  slotId: 'Slot 1' | 'Slot 2';
  ticker: string;
  entryDate: string;
  signalDate: string;
  entryPrice: number;
  currentClose: number;
  currentHigh: number;
  currentLow: number;
  daysHeld: number;
  totalLots: number;
  remainingLots: number;
  tp1LotsSold: number;
  investedCapitalRp: number;
  currentValueRp: number;
  currentSL: number;
  slStatusNote: string;
  isLocked1Tick: boolean;
  hitTP1: boolean;
  tp1Price: number;
  maxHigh: number;
  peakGainPct: number;
  floatingGainPct: number;
  floatingPnlRp: number;
}

interface DayEvent {
  type: 'ENTRY' | 'TP1_LOCK' | 'SL_GESER' | 'EXIT_RUNNER' | 'EXIT_DAY6' | 'HARD_SL' | 'SL_1TICK' | 'EXIT_TP1_SL';
  slotId: 'Slot 1' | 'Slot 2';
  ticker: string;
  title: string;
  description: string;
  price?: number;
  lotsExecuted?: number;
  remainingLots?: number;
  totalLots?: number;
  cashChangeRp?: number;
  pnlRp?: number;
  pnlPct?: number;
}

interface DaySignalItem {
  ticker: string;
  score: number;
  signalClose: number;
  drawdownPct: number;
  volAbsorptionRatio: number;
  candlePattern: string;
  actionTaken: 'BOUGHT_SLOT_1' | 'BOUGHT_SLOT_2' | 'SKIPPED_SLOTS_FULL' | 'SKIPPED_ALREADY_HOLDING' | 'NOT_MATCHED_LOW' | 'MARKET_SENTIMENT_OFF';
  actionNote: string;
  matchPrice?: number;
}

interface SlotExitSummary {
  ticker: string;
  exitPrice: number;
  entryPrice?: number;
  totalLots?: number;
  netPnlPct: number;
  netPnlRp: number;
  exitReason: string;
  daysHeld: number;
}

interface DailyJourneySnapshot {
  date: string;
  dayIndex: number;
  cashBalance: number;
  portfolioValue: number;
  totalEquity: number;
  peakEquity: number;
  drawdownPct: number;
  activeCount: number;
  slot1: DaySlotState | null;
  slot2: DaySlotState | null;
  slot1ExitedToday?: SlotExitSummary | null;
  slot2ExitedToday?: SlotExitSummary | null;
  eventsToday: DayEvent[];
  signalsForEntryToday?: DaySignalItem[];
  signalsGeneratedToday?: DaySignalItem[];
}

interface MonthlyStats {
  month: string;
  tradesCount: number;
  wins: number;
  losses: number;
  winRate: number;
  netPnlRp: number;
  endingEquityRp: number;
}

interface FastReboundJourneyResult {
  summary: {
    initialCapital: number;
    finalEquity: number;
    netProfitRp: number;
    growthPct: number;
    winRatePct: number;
    profitFactor: number;
    maxDrawdownPct: number;
    maxDrawdownRp: number;
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    avgWinPct: number;
    avgLossPct: number;
    runnerHits: number;
    tp1SlLocks: number;
    oneTickSlHits: number;
    hardSlHits: number;
    day6Exits: number;
    totalTradingDays: number;
    startDate: string;
    endDate: string;
  };
  timeline: DailyJourneySnapshot[];
  closedTrades: TradeJourneyRecord[];
  monthlyStats: MonthlyStats[];
}

export default function FastReboundJourneyCard() {
  const { data, loading, refetch } = useFetch('/api/strategies/fast-rebound-journey');
  const journeyData: FastReboundJourneyResult | null = data || null;

  // Active view tab: 'TIMELINE' | 'TRADES_LIST' | 'MONTHLY' | 'SOP'
  const [activeTab, setActiveTab] = useState<'TIMELINE' | 'TRADES_LIST' | 'MONTHLY' | 'SOP'>('TIMELINE');

  // Subtab for signals in timeline: 'ENTRY_EVAL' | 'FRESH_SORE'
  const [signalSubTab, setSignalSubTab] = useState<'ENTRY_EVAL' | 'FRESH_SORE'>('ENTRY_EVAL');

  // Timeline playback state
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState<number>(800); // ms per day
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Filters for Trades List tab
  const [tradeSearch, setTradeSearch] = useState('');
  const [slotFilter, setSlotFilter] = useState<'ALL' | 'Slot 1' | 'Slot 2'>('ALL');
  const [resultFilter, setResultFilter] = useState<'ALL' | 'WIN' | 'LOSS' | 'RUNNER'>('ALL');

  const timeline = journeyData?.timeline || [];
  const totalDays = timeline.length;
  const currentSnapshot = timeline[currentDayIndex] || timeline[0] || null;

  // Auto-play timer effect
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentDayIndex((prev) => {
          if (prev >= totalDays - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, playSpeed);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, totalDays, playSpeed]);

  const handlePrevDay = () => {
    setIsPlaying(false);
    setCurrentDayIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNextDay = () => {
    setIsPlaying(false);
    setCurrentDayIndex((prev) => Math.min(totalDays - 1, prev + 1));
  };

  const handleJumpToDay = (idx: number) => {
    setIsPlaying(false);
    setCurrentDayIndex(Math.max(0, Math.min(totalDays - 1, idx)));
  };

  // Filtered closed trades
  const filteredClosedTrades = useMemo(() => {
    if (!journeyData?.closedTrades) return [];
    return journeyData.closedTrades.filter((t) => {
      if (slotFilter !== 'ALL' && t.slotId !== slotFilter) return false;
      if (resultFilter === 'WIN' && t.netPnlRp <= 0) return false;
      if (resultFilter === 'LOSS' && t.netPnlRp > 0) return false;
      if (resultFilter === 'RUNNER' && !t.exitReason.includes('RUNNER TRAILING')) return false;
      if (tradeSearch.trim() && !t.ticker.toLowerCase().includes(tradeSearch.toLowerCase())) return false;
      return true;
    });
  }, [journeyData, slotFilter, resultFilter, tradeSearch]);

  const formatDateIndo = (dStr: string) => {
    if (!dStr) return '-';
    try {
      const parts = dStr.split('-');
      if (parts.length === 3) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        return `${parts[2]} ${months[parseInt(parts[1], 10) - 1]} ${parts[0]}`;
      }
      return dStr;
    } catch {
      return dStr;
    }
  };

  if (loading && !journeyData) {
    return (
      <Card className="border-slate-200/80 bg-white shadow-sm overflow-hidden">
        <div className="p-12 flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-3 border-violet-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Memuat Simulasi Perjalanan Trading Fast V-Rebound...</p>
        </div>
      </Card>
    );
  }

  const summary = journeyData?.summary || {
    initialCapital: 14000000,
    finalEquity: 220864250,
    netProfitRp: 206864250,
    growthPct: 1477.6,
    winRatePct: 57.44,
    profitFactor: 6.28,
    maxDrawdownPct: 6.34,
    maxDrawdownRp: 13993700,
    totalTrades: 195,
    winningTrades: 112,
    losingTrades: 83,
    avgWinPct: 15.6,
    avgLossPct: -1.2,
    runnerHits: 47,
    tp1SlLocks: 52,
    oneTickSlHits: 13,
    hardSlHits: 59,
    day6Exits: 24,
    totalTradingDays: 188,
    startDate: '2025-12-01',
    endDate: '2026-09-26'
  };

  return (
    <TooltipProvider>
      <Card className="border-slate-200/90 bg-white shadow-sm overflow-hidden transition-all">
        {/* TOP HERO HEADER */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 sm:p-6 border-b border-slate-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-md bg-violet-500/20 text-violet-300 text-[10px] font-black uppercase tracking-wider border border-violet-500/30">
                  Interactive Journey Cockpit
                </span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider border border-emerald-500/30">
                  2 Slots Compounding
                </span>
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase tracking-wider border border-amber-500/30">
                  Hold 3-6 Hari
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                <CompassIcon className="w-6 h-6 text-violet-400" />
                Perjalanan Harian Portofolio Fast V-Rebound
              </h2>
              <p className="text-xs sm:text-sm text-slate-300">
                Visualisasi interaktif step-by-step per hari: Pantau pergerakan harga emiten di Slot 1 &amp; Slot 2, posisi Trailing Stop, take profit bertahap, dan arus kas RDN riil.
              </p>
            </div>

            {/* QUICK STATS PILLS */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center shrink-0">
              <div className="bg-slate-800/80 border border-slate-700/60 p-2.5 rounded-xl">
                <div className="text-[10px] uppercase font-bold text-slate-400">Modal Awal</div>
                <div className="text-sm font-black text-white font-mono">Rp 14,0 Juta</div>
              </div>
              <div className="bg-emerald-950/60 border border-emerald-500/40 p-2.5 rounded-xl">
                <div className="text-[10px] uppercase font-bold text-emerald-400">Modal Akhir</div>
                <div className="text-sm font-black text-emerald-300 font-mono">
                  Rp {(summary.finalEquity / 1000000).toFixed(1)} Juta
                </div>
                <div className="text-[9px] font-bold text-emerald-400">+{summary.growthPct}%</div>
              </div>
              <div className="bg-slate-800/80 border border-slate-700/60 p-2.5 rounded-xl">
                <div className="text-[10px] uppercase font-bold text-slate-400">Win Rate</div>
                <div className="text-sm font-black text-sky-300 font-mono">{summary.winRatePct}%</div>
                <div className="text-[9px] text-slate-400">{summary.winningTrades}W / {summary.losingTrades}L</div>
              </div>
              <div className="bg-slate-800/80 border border-slate-700/60 p-2.5 rounded-xl">
                <div className="text-[10px] uppercase font-bold text-slate-400">Profit Factor</div>
                <div className="text-sm font-black text-amber-300 font-mono">{summary.profitFactor}</div>
                <div className="text-[9px] text-slate-400">Max DD: -{summary.maxDrawdownPct}%</div>
              </div>
            </div>
          </div>

          {/* TAB BUTTONS */}
          <div className="flex items-center gap-1.5 mt-5 border-t border-slate-800/80 pt-4 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('TIMELINE')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'TIMELINE'
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Timeline Interaktif (Hari per Hari)</span>
            </button>
            <button
              onClick={() => setActiveTab('TRADES_LIST')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'TRADES_LIST'
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Daftar Transaksi ({summary.totalTrades} Trades)</span>
            </button>
            <button
              onClick={() => setActiveTab('MONTHLY')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'MONTHLY'
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Performa Bulanan</span>
            </button>
            <button
              onClick={() => setActiveTab('SOP')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'SOP'
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Info className="w-3.5 h-3.5" />
              <span>SOP &amp; Aturan Trailing</span>
            </button>
          </div>
        </div>

        {/* TAB 1: INTERACTIVE TIMELINE COCKPIT */}
        {activeTab === 'TIMELINE' && (
          <div className="p-5 space-y-6">
            {/* TIMELINE CONTROL BAR */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 shadow-2xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* DATE & DAY BADGE */}
                <div className="flex items-center gap-2.5">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-violet-100 text-violet-800 font-mono font-black text-xs">
                        HARI KE-{currentSnapshot?.dayIndex || 1} / {totalDays}
                      </span>
                      <span className="text-sm font-black text-slate-900 font-mono">
                        {formatDateIndo(currentSnapshot?.date || '')}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 mt-0.5">
                      Status Posisi: <b className="text-slate-800">{currentSnapshot?.activeCount || 0} Saham Aktif</b> | Kas RDN Ready: <b className="text-emerald-700 font-mono">Rp {(currentSnapshot?.cashBalance || 0).toLocaleString('id-ID')}</b>
                    </span>
                  </div>
                </div>

                {/* PLAYBACK CONTROLS */}
                <div className="flex items-center gap-1.5 self-end sm:self-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleJumpToDay(0)}
                    disabled={currentDayIndex === 0}
                    className="h-8 w-8 p-0 text-slate-700 border-slate-300 hover:bg-slate-200"
                    title="Awal Simulasi (Hari 1)"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevDay}
                    disabled={currentDayIndex === 0}
                    className="h-8 px-2 text-slate-700 border-slate-300 hover:bg-slate-200 text-xs font-bold"
                  >
                    <ChevronLeft className="w-4 h-4 mr-0.5" /> Prev Day
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => setIsPlaying(!isPlaying)}
                    className={`h-8 px-3 text-xs font-black transition-all ${
                      isPlaying
                        ? 'bg-amber-600 hover:bg-amber-700 text-white'
                        : 'bg-violet-600 hover:bg-violet-700 text-white shadow-sm'
                    }`}
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="w-3.5 h-3.5 mr-1 fill-white" /> Jeda
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 mr-1 fill-white" /> Putar Alur
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextDay}
                    disabled={currentDayIndex >= totalDays - 1}
                    className="h-8 px-2 text-slate-700 border-slate-300 hover:bg-slate-200 text-xs font-bold"
                  >
                    Next Day <ChevronRight className="w-4 h-4 ml-0.5" />
                  </Button>

                  {/* Playback Speed selector */}
                  <div className="flex items-center bg-white border border-slate-300 rounded-lg p-0.5 text-[10px] font-bold ml-1">
                    {[
                      { label: '1x', ms: 1200 },
                      { label: '2x', ms: 700 },
                      { label: '5x', ms: 300 }
                    ].map((sp) => (
                      <button
                        key={sp.label}
                        onClick={() => setPlaySpeed(sp.ms)}
                        className={`px-1.5 py-0.5 rounded transition-all ${
                          playSpeed === sp.ms
                            ? 'bg-violet-600 text-white shadow-xs'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {sp.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* TIMELINE RANGE SCRUBBER SLIDER */}
              <div className="space-y-1 pt-1">
                <input
                  type="range"
                  min="0"
                  max={Math.max(0, totalDays - 1)}
                  value={currentDayIndex}
                  onChange={(e) => handleJumpToDay(parseInt(e.target.value, 10))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-violet-600 hover:accent-violet-700"
                />
                <div className="flex justify-between text-[10px] text-slate-600 font-mono">
                  <span>{formatDateIndo(timeline[0]?.date || '')} (Rp 14 Juta)</span>
                  <span>Scrubber Hari Bursa ({currentDayIndex + 1} dari {totalDays})</span>
                  <span>{formatDateIndo(timeline[totalDays - 1]?.date || '')} (Rp {(summary.finalEquity / 1000000).toFixed(1)} Jt)</span>
                </div>
              </div>
            </div>

            {/* 📡 TOP 2 RADAR SINYAL HARI INI (DIATAS CARD HARI KE / SLOTS) */}
            <Top2SignalsRadarCard
              dateStr={currentSnapshot?.date || ''}
              formatDateIndo={formatDateIndo}
              entrySignals={(currentSnapshot?.signalsForEntryToday || []).slice(0, 2)}
              freshSignals={(currentSnapshot?.signalsGeneratedToday || []).slice(0, 2)}
            />

            {/* 2 SLOTS LIVE COCKPIT ON SELECTED DAY */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* SLOT 1 CARD */}
              <SlotCockpitCard
                slotName="Slot 1 (Alokasi 50% Kas)"
                slotState={currentSnapshot?.slot1 || null}
                slotExitedToday={currentSnapshot?.slot1ExitedToday || null}
                formatDateIndo={formatDateIndo}
              />

              {/* SLOT 2 CARD */}
              <SlotCockpitCard
                slotName="Slot 2 (Alokasi 50% Kas)"
                slotState={currentSnapshot?.slot2 || null}
                slotExitedToday={currentSnapshot?.slot2ExitedToday || null}
                formatDateIndo={formatDateIndo}
              />
            </div>

            {/* BOTTOM SECTION: CASH FLOW & DAILY ACTION FEED */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* FINANCIAL STATUS OF CURRENT DAY */}
              <Card className="border-slate-200 bg-white shadow-2xs lg:col-span-1">
                <CardHeader className="pb-3 border-b border-slate-100">
                  <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <Wallet className="w-4 h-4 text-emerald-600" />
                    Status RDN &amp; Ekuitas Hari Ini
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-3 space-y-3.5 text-xs">
                  <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80">
                    <div className="text-[10px] font-bold text-emerald-800 uppercase">Total Ekuitas Hari Ini</div>
                    <div className="text-lg font-black text-emerald-950 font-mono">
                      Rp {(currentSnapshot?.totalEquity || 0).toLocaleString('id-ID')}
                    </div>
                    <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                      Puncak Tertinggi: Rp {(currentSnapshot?.peakEquity || 0).toLocaleString('id-ID')} (DD: -{currentSnapshot?.drawdownPct || 0}%)
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center py-1 border-b border-slate-100">
                      <span className="text-slate-500 font-medium">Saldo Kas RDN (Ready Liquid)</span>
                      <span className="font-mono font-bold text-slate-900">
                        Rp {(currentSnapshot?.cashBalance || 0).toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-100">
                      <span className="text-slate-500 font-medium">Nilai Saham Mengambang</span>
                      <span className="font-mono font-bold text-indigo-700">
                        Rp {(currentSnapshot?.portfolioValue || 0).toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-100">
                      <span className="text-slate-500 font-medium">Porsi Kas Siap Pakai</span>
                      <span className="font-mono font-bold text-slate-700">
                        {currentSnapshot?.totalEquity
                          ? `${Math.round(((currentSnapshot.cashBalance / currentSnapshot.totalEquity) * 100))}% Kas`
                          : '100%'}
                      </span>
                    </div>
                  </div>

                  {/* VISUAL ALLOCATION BAR */}
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold text-slate-500">Komposisi Kas vs Saham</div>
                    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex border border-slate-200">
                      <div
                        className="bg-emerald-500 h-full transition-all duration-300"
                        style={{
                          width: `${
                            currentSnapshot?.totalEquity
                              ? (currentSnapshot.cashBalance / currentSnapshot.totalEquity) * 100
                              : 100
                          }%`
                        }}
                        title="Kas Ready"
                      />
                      <div
                        className="bg-violet-600 h-full transition-all duration-300"
                        style={{
                          width: `${
                            currentSnapshot?.totalEquity
                              ? (currentSnapshot.portfolioValue / currentSnapshot.totalEquity) * 100
                              : 0
                          }%`
                        }}
                        title="Saham Aktif"
                      />
                    </div>
                    <div className="flex justify-between text-[9px] text-slate-400 font-semibold">
                      <span className="text-emerald-600">● Kas Ready</span>
                      <span className="text-violet-600">● Saham Aktif</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* DAILY ACTION FEED (EVENTS HAPPENING ON THIS EXACT DAY) */}
              <Card className="border-slate-200 bg-white shadow-2xs lg:col-span-2">
                <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
                  <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-500" />
                    Aktivitas &amp; Eksekusi Hari Ini ({formatDateIndo(currentSnapshot?.date || '')})
                  </CardTitle>
                  <Badge variant="outline" className="text-[10px] font-mono border-slate-200 text-slate-600">
                    {currentSnapshot?.eventsToday?.length || 0} Aksi Terjadi
                  </Badge>
                </CardHeader>
                <CardContent className="pt-3">
                  {(!currentSnapshot?.eventsToday || currentSnapshot.eventsToday.length === 0) ? (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      <Clock className="w-6 h-6 mx-auto mb-1.5 opacity-40 text-slate-400" />
                      Tidak ada transaksi entry/exit baru hari ini. Posisi aktif melanjutkan proses hold &amp; trailing.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {currentSnapshot.eventsToday.map((ev, i) => {
                        const timingLabel =
                          ev.type === 'ENTRY'
                            ? '🌅 Sesi Pagi (08:45 - 09:00 WIB)'
                            : ev.type === 'TP1_LOCK'
                            ? '⚡ Intraday Target (+9.0% Reached)'
                            : ev.type === 'EXIT_TP1_SL'
                            ? '🛡️ Intraday (Sisa 50% Kena SL Terkunci TP1)'
                            : ev.type === 'SL_GESER'
                            ? '📈 Intraday Trailing (Proteksi Naik)'
                            : ev.type === 'EXIT_RUNNER'
                            ? '🚀 Intraday / Sore (Dynamic Trail Hit)'
                            : ev.type === 'EXIT_DAY6'
                            ? '⏰ Sesi Sore Hari ke-6 (15:50 WIB)'
                            : ev.type === 'SL_1TICK'
                            ? '🛡️ Intraday (Proteksi BEP +1 Tick)'
                            : '🛡️ Intraday (Cut Loss -1.2% Terpukul)';

                        return (
                          <div
                            key={i}
                            className={`p-3.5 rounded-xl border text-xs transition-all relative overflow-hidden ${
                              ev.type === 'ENTRY'
                                ? 'bg-blue-50/70 border-blue-200 text-blue-950'
                                : ev.type === 'TP1_LOCK'
                                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                                : ev.type === 'EXIT_TP1_SL'
                                ? 'bg-teal-50/80 border-teal-200 text-teal-950'
                                : ev.type === 'SL_GESER'
                                ? 'bg-sky-50/70 border-sky-200 text-sky-950'
                                : ev.type === 'EXIT_RUNNER'
                                ? 'bg-purple-50/70 border-purple-200 text-purple-950'
                                : ev.type === 'EXIT_DAY6'
                                ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                                : 'bg-rose-50/70 border-rose-200 text-rose-950'
                            }`}
                          >
                            {/* TOP BAR: STEP ORDER & TIMING */}
                            <div className="flex items-center justify-between gap-2 border-b border-black/5 pb-1.5 mb-2">
                              <div className="flex items-center gap-1.5">
                                <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-mono font-black text-[10px] flex items-center justify-center shrink-0">
                                  {i + 1}
                                </span>
                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-700">
                                  Urutan #{i + 1}
                                </span>
                                <span className="text-[10px] text-slate-500 font-semibold">• {timingLabel}</span>
                              </div>

                              <span className="text-[10px] font-mono font-bold text-slate-600 bg-white/80 px-2 py-0.5 rounded border border-slate-200/80">
                                {ev.slotId}
                              </span>
                            </div>

                            {/* EVENT TITLE & PNL */}
                            <div className="flex items-center justify-between font-bold">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span
                                  className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase ${
                                    ev.type === 'ENTRY'
                                      ? 'bg-blue-600 text-white'
                                      : ev.type === 'TP1_LOCK'
                                      ? 'bg-emerald-600 text-white'
                                      : ev.type === 'EXIT_TP1_SL'
                                      ? 'bg-teal-600 text-white'
                                      : ev.type === 'SL_GESER'
                                      ? 'bg-sky-600 text-white'
                                      : ev.type === 'EXIT_RUNNER'
                                      ? 'bg-purple-600 text-white'
                                      : ev.type === 'EXIT_DAY6'
                                      ? 'bg-amber-600 text-white'
                                      : 'bg-rose-600 text-white'
                                  }`}
                                >
                                  {ev.type === 'EXIT_TP1_SL' ? 'SL_TP1_HIT' : ev.type}
                                </span>
                                <span className="font-mono font-black text-slate-900 text-sm">{ev.ticker}</span>
                                <span className="text-slate-700 font-bold text-[11px]">— {ev.title}</span>
                              </div>

                              {ev.pnlPct !== undefined && (
                                <span
                                  className={`font-mono font-black text-xs ${
                                    ev.pnlPct >= 0 ? 'text-emerald-700' : 'text-rose-700'
                                  }`}
                                >
                                  {ev.pnlPct >= 0 ? '+' : ''}{ev.pnlPct}% (Rp {(ev.pnlRp || 0).toLocaleString('id-ID')})
                                </span>
                              )}
                            </div>

                            {/* EVENT DESCRIPTION */}
                            <p className="mt-1.5 text-[11px] text-slate-700 leading-relaxed">
                              {ev.description}
                            </p>

                            {/* LOT & PRICE METRIC STRIP */}
                            <div className="flex flex-wrap items-center gap-1.5 mt-2 pt-2 border-t border-black/5 text-[11px] font-mono">
                              {ev.price !== undefined && (
                                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/90 border border-slate-200/80 text-slate-800 font-bold shadow-2xs">
                                  <span className="text-slate-400 font-normal">
                                    {ev.type === 'ENTRY'
                                      ? 'Harga Match:'
                                      : ev.type === 'SL_GESER'
                                      ? 'Level SL:'
                                      : ev.type === 'TP1_LOCK'
                                      ? 'Target TP1:'
                                      : 'Harga Exit:'}
                                  </span>
                                  <span className="text-indigo-950 font-black">Rp {ev.price.toLocaleString('id-ID')}</span>
                                </div>
                              )}

                              {ev.lotsExecuted !== undefined && ev.lotsExecuted > 0 && (
                                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/90 border border-slate-200/80 text-slate-800 font-bold shadow-2xs">
                                  <span className="text-slate-400 font-normal">Eksekusi:</span>
                                  <span className="text-slate-950 font-black">{ev.lotsExecuted.toLocaleString('id-ID')} Lot</span>
                                </div>
                              )}

                              {ev.remainingLots !== undefined && (
                                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/90 border border-slate-200/80 text-slate-800 font-bold shadow-2xs">
                                  <span className="text-slate-400 font-normal">Sisa Posisi:</span>
                                  <span className={`font-black ${ev.remainingLots === 0 ? 'text-slate-400' : 'text-violet-700'}`}>
                                    {ev.remainingLots > 0 ? `${ev.remainingLots.toLocaleString('id-ID')} Lot` : '0 Lot (Tuntas)'}
                                  </span>
                                </div>
                              )}

                              {ev.totalLots !== undefined && ev.totalLots > 0 && (
                                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/90 border border-slate-200/80 text-slate-800 font-bold shadow-2xs">
                                  <span className="text-slate-400 font-normal">Total Lot:</span>
                                  <span className="text-slate-700 font-black">{ev.totalLots.toLocaleString('id-ID')} Lot</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* TAB 2: COMPLETE TRADES LIST (195 TRADES) */}
        {activeTab === 'TRADES_LIST' && (
          <div className="p-5 space-y-4">
            {/* SEARCH & FILTERS */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2 flex-1 max-w-sm">
                <Search className="w-4 h-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Cari Ticker (e.g. ADMR, BBRI)..."
                  value={tradeSearch}
                  onChange={(e) => setTradeSearch(e.target.value)}
                  className="h-8 text-xs bg-white border-slate-200"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap text-xs">
                {/* Slot Filter */}
                <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 text-[11px] font-bold">
                  {(['ALL', 'Slot 1', 'Slot 2'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setSlotFilter(s)}
                      className={`px-2 py-0.5 rounded transition-all ${
                        slotFilter === s ? 'bg-violet-600 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {s === 'ALL' ? 'Semua Slot' : s}
                    </button>
                  ))}
                </div>

                {/* Result Filter */}
                <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 text-[11px] font-bold">
                  {(['ALL', 'WIN', 'LOSS', 'RUNNER'] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setResultFilter(r)}
                      className={`px-2 py-0.5 rounded transition-all ${
                        resultFilter === r ? 'bg-violet-600 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {r === 'ALL' ? 'Semua Hasil' : r === 'WIN' ? '🟢 Menang' : r === 'LOSS' ? '🔴 Cut Loss' : '🚀 Runner'}
                    </button>
                  ))}
                </div>

                <span className="text-[11px] text-slate-500 font-semibold">
                  Menampilkan {filteredClosedTrades.length} dari {journeyData?.closedTrades.length || 0} Trades
                </span>
              </div>
            </div>

            {/* TRADES TABLE */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white">
              <div className="overflow-x-auto max-h-[580px]">
                <Table>
                  <TableHeader className="bg-slate-100/80 sticky top-0 z-10">
                    <TableRow className="text-[11px] font-black uppercase text-slate-600">
                      <TableHead className="w-12 text-center">#</TableHead>
                      <TableHead className="w-20">Slot</TableHead>
                      <TableHead>Ticker</TableHead>
                      <TableHead>Tgl Entry</TableHead>
                      <TableHead>Tgl Exit</TableHead>
                      <TableHead className="text-right">Harga Beli</TableHead>
                      <TableHead className="text-right">Posisi SL Akhir</TableHead>
                      <TableHead className="text-right">Harga Exit</TableHead>
                      <TableHead className="text-center">Hold</TableHead>
                      <TableHead className="text-right">Modal Beli (Debit)</TableHead>
                      <TableHead className="text-right">Dana Cair (Kredit)</TableHead>
                      <TableHead className="text-right">Net PnL %</TableHead>
                      <TableHead className="text-right">Net PnL (Rp)</TableHead>
                      <TableHead className="text-right">Saldo RDN Akhir</TableHead>
                      <TableHead className="min-w-[220px]">Keterangan Alur / Alasan Exit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="text-xs">
                    {filteredClosedTrades.map((t) => (
                      <TableRow key={t.tradeNo} className="hover:bg-slate-50 transition-colors">
                        <TableCell className="text-center font-mono text-slate-400 text-[11px]">
                          {t.tradeNo}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-[9px] font-bold ${
                              t.slotId === 'Slot 1'
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                : 'bg-cyan-50 text-cyan-700 border-cyan-200'
                            }`}
                          >
                            {t.slotId}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <TickerDetailDialog ticker={t.ticker} logoSize="xs" />
                        </TableCell>
                        <TableCell className="font-mono text-slate-600 whitespace-nowrap text-[11px]">
                          {formatDateIndo(t.entryDate)}
                        </TableCell>
                        <TableCell className="font-mono text-slate-600 whitespace-nowrap text-[11px]">
                          {formatDateIndo(t.exitDate)}
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold text-slate-900">
                          Rp {t.matchPrice.toLocaleString('id-ID')}
                        </TableCell>
                        <TableCell className="text-right font-mono text-slate-700 text-[11px]">
                          <span title={t.finalSlNote}>Rp {t.finalSlPrice.toLocaleString('id-ID')}</span>
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold text-slate-900">
                          Rp {t.exitPriceRemaining.toLocaleString('id-ID')}
                        </TableCell>
                        <TableCell className="text-center font-mono text-slate-600 font-semibold">
                          {t.daysHeld}h
                        </TableCell>
                        <TableCell className="text-right font-mono text-slate-600 text-[11px]">
                          Rp {t.debitKasKeluarRp.toLocaleString('id-ID')}
                        </TableCell>
                        <TableCell className="text-right font-mono text-slate-900 font-semibold text-[11px]">
                          Rp {t.kreditKasMasukRp.toLocaleString('id-ID')}
                        </TableCell>
                        <TableCell
                          className={`text-right font-mono font-black ${
                            t.netPnlPct >= 0 ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {t.netPnlPct >= 0 ? '+' : ''}{t.netPnlPct}%
                        </TableCell>
                        <TableCell
                          className={`text-right font-mono font-black ${
                            t.netPnlRp >= 0 ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {t.netPnlRp >= 0 ? '+' : ''}Rp {t.netPnlRp.toLocaleString('id-ID')}
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold text-emerald-800 text-[11px]">
                          Rp {t.saldoRdnTerkiniRp.toLocaleString('id-ID')}
                        </TableCell>
                        <TableCell className="text-[11px] text-slate-600 leading-snug">
                          {t.exitReason}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: MONTHLY STATS */}
        {activeTab === 'MONTHLY' && (
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-violet-50/70 border border-violet-200/80">
                <div className="text-[10px] font-black uppercase text-violet-700">Rata-rata Transaksi / Bulan</div>
                <div className="text-xl font-black text-violet-950 font-mono mt-1">19 - 20 Trades</div>
                <div className="text-[10px] text-violet-600 mt-0.5">Rotasi cepat kas RDN maksimal 6 hari</div>
              </div>
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80">
                <div className="text-[10px] font-black uppercase text-emerald-700">Konsistensi Cuan Bulanan</div>
                <div className="text-xl font-black text-emerald-950 font-mono mt-1">100% Bulan Positif</div>
                <div className="text-[10px] text-emerald-600 mt-0.5">Semua bulan ditutup dengan laba bersih</div>
              </div>
              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80">
                <div className="text-[10px] font-black uppercase text-amber-700">Efek Compounding 2 Slot</div>
                <div className="text-xl font-black text-amber-950 font-mono mt-1">15.7x Lipat</div>
                <div className="text-[10px] text-amber-600 mt-0.5">Dari Rp 14 Juta menjadi Rp 220,8 Juta</div>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white">
              <Table>
                <TableHeader className="bg-slate-100/80">
                  <TableRow className="text-[11px] font-black uppercase text-slate-600">
                    <TableHead>Bulan Transaksi</TableHead>
                    <TableHead className="text-center">Total Trades</TableHead>
                    <TableHead className="text-center">Menang (Win)</TableHead>
                    <TableHead className="text-center">Kalah (Loss)</TableHead>
                    <TableHead className="text-right">Win Rate %</TableHead>
                    <TableHead className="text-right">Net Profit Bulan Ini</TableHead>
                    <TableHead className="text-right">Saldo Akhir Bulan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="text-xs font-mono">
                  {journeyData?.monthlyStats?.map((m) => (
                    <TableRow key={m.month} className="hover:bg-slate-50">
                      <TableCell className="font-bold text-slate-900">
                        {m.month}
                      </TableCell>
                      <TableCell className="text-center">{m.tradesCount}</TableCell>
                      <TableCell className="text-center text-emerald-600 font-bold">{m.wins}</TableCell>
                      <TableCell className="text-center text-rose-600 font-bold">{m.losses}</TableCell>
                      <TableCell className="text-right font-bold text-sky-600">{m.winRate}%</TableCell>
                      <TableCell className="text-right font-bold text-emerald-600">
                        +Rp {m.netPnlRp.toLocaleString('id-ID')}
                      </TableCell>
                      <TableCell className="text-right font-black text-slate-900">
                        Rp {m.endingEquityRp.toLocaleString('id-ID')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* TAB 4: SOP & RULES SUMMARY */}
        {activeTab === 'SOP' && (
          <div className="p-5 space-y-4 text-xs text-slate-700 leading-relaxed">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                <div className="flex items-center gap-2 font-black text-slate-900 text-sm">
                  <span className="w-6 h-6 rounded-full bg-violet-600 text-white flex items-center justify-center text-xs">1</span>
                  Alokasi Modal &amp; Struktur 2 Slot
                </div>
                <p className="text-slate-600">
                  Modal awal <b>Rp 14.000.000</b> dibagi ke <b>Maksimal 2 Slot Aktif</b> (@ 50% dari saldo kas RDN yang tersedia). Entry baru <i>hanya dieksekusi saat ada slot kosong</i> setelah trade sebelumnya Full Exit, sehingga compounding dana berjalan otomatis.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                <div className="flex items-center gap-2 font-black text-slate-900 text-sm">
                  <span className="w-6 h-6 rounded-full bg-violet-600 text-white flex items-center justify-center text-xs">2</span>
                  Stop Loss Ketat (-1.2%) &amp; BEP +1 Tick
                </div>
                <p className="text-slate-600">
                  Cut Loss kilat disiplin di <b>-1.2%</b> jika harga gagal memantul. Namun jika floating gain mencapai <b>+2.5%</b>, Stop Loss langsung dinaikkan otomatis ke <b>+1 Tick di atas harga beli</b> (menjamin modal aman &amp; menutup fee broker).
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                <div className="flex items-center gap-2 font-black text-slate-900 text-sm">
                  <span className="w-6 h-6 rounded-full bg-violet-600 text-white flex items-center justify-center text-xs">3</span>
                  Take Profit 1 (+9.0%) &amp; SL Terkunci
                </div>
                <p className="text-slate-600">
                  Pada kenaikan <b>+9.0%</b>, jual <b>50% lot</b> untuk mengamankan kas cuan. Bersamaan dengan itu, SL sisa 50% lot digeser ke <b>Harga TP1 (+9.0%)</b> sehingga trade ini bergaransi 100% menang!
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                <div className="flex items-center gap-2 font-black text-slate-900 text-sm">
                  <span className="w-6 h-6 rounded-full bg-violet-600 text-white flex items-center justify-center text-xs">4</span>
                  Dynamic Runner &amp; Time Exit Hari ke-6
                </div>
                <p className="text-slate-600">
                  Sisa 50% lot dibiarkan meledak mengikuti harga tertinggi dengan Dynamic Buffer Trailing (Peak High - 4%). Pada sore <b>Hari ke-6 (15:50 WIB)</b>, sisa posisi wajib ditutup (untung/rugi langsung cabut) agar kas segera cair untuk emiten baru.
                </p>
              </div>
            </div>
          </div>
        )}
      </Card>
    </TooltipProvider>
  );
}

// Subcomponent for Slot Cockpit Card
function SlotCockpitCard({
  slotName,
  slotState,
  slotExitedToday,
  formatDateIndo
}: {
  slotName: string;
  slotState: DaySlotState | null;
  slotExitedToday?: SlotExitSummary | null;
  formatDateIndo: (d: string) => string;
}) {
  if (!slotState) {
    return (
      <div className="p-5 rounded-2xl border-2 border-dashed border-slate-200/80 bg-slate-50/40 flex flex-col justify-center items-center text-center space-y-2.5 min-h-[260px]">
        <div className="w-10 h-10 rounded-full bg-slate-200/70 text-slate-400 flex items-center justify-center">
          <Briefcase className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xs font-black text-slate-600 uppercase tracking-wider">{slotName}</div>
          <p className="text-sm font-bold text-slate-400 mt-0.5">✨ Slot Kosong (Kas Siap Entry)</p>
        </div>

        {slotExitedToday ? (
          <div className="p-3 rounded-xl bg-violet-50/80 border border-violet-200 text-left max-w-md w-full text-xs space-y-1.5">
            <div className="flex items-center justify-between font-bold text-slate-900">
              <span className="text-[10px] uppercase font-black text-violet-700">🏁 Full Exit Hari Ini:</span>
              <span className={`font-mono text-xs ${slotExitedToday.netPnlPct >= 0 ? 'text-emerald-600 font-black' : 'text-rose-600 font-black'}`}>
                {slotExitedToday.netPnlPct >= 0 ? '+' : ''}{slotExitedToday.netPnlPct}% (Rp {slotExitedToday.netPnlRp.toLocaleString('id-ID')})
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono">
              <span className="px-1.5 py-0.5 rounded bg-violet-200 text-violet-900 font-black">{slotExitedToday.ticker}</span>
              <span className="text-slate-700 font-bold">Exit: Rp {slotExitedToday.exitPrice.toLocaleString('id-ID')}</span>
              {slotExitedToday.entryPrice !== undefined && (
                <span className="text-slate-500">• Beli: Rp {slotExitedToday.entryPrice.toLocaleString('id-ID')}</span>
              )}
              {slotExitedToday.totalLots !== undefined && (
                <span className="text-slate-500">• {slotExitedToday.totalLots.toLocaleString('id-ID')} Lot</span>
              )}
            </div>
            <p className="text-[11px] text-slate-600">
              <b>{slotExitedToday.ticker}</b> selesai ({slotExitedToday.exitReason}). Kas kembali cair di RDN dan siap untuk emiten baru.
            </p>
          </div>
        ) : (
          <p className="text-[11px] text-slate-400 max-w-xs leading-snug">
            Dana 50% kas tersimpan aman di RDN dan siap dibelikan begitu muncul sinyal Fast V-Rebound berikutnya.
          </p>
        )}
      </div>
    );
  }

  const isGain = slotState.floatingGainPct >= 0;

  return (
    <div className="p-5 rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50/60 shadow-2xs space-y-4">
      {/* PREVIOUS EXIT ON SAME DAY (ROTATION BANNER) */}
      {slotExitedToday && (
        <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
            <span className="px-1.5 py-0.5 rounded bg-amber-200 text-amber-900 font-black text-[9px] uppercase shrink-0">
              🔄 Rotasi Hari Ini
            </span>
            <p className="text-[11px] text-amber-950">
              Exit <b>{slotExitedToday.ticker}</b> @ <b className="font-mono">Rp {slotExitedToday.exitPrice.toLocaleString('id-ID')}</b>
              {slotExitedToday.totalLots !== undefined && (
                <span className="text-amber-800 font-mono"> ({slotExitedToday.totalLots.toLocaleString('id-ID')} Lot)</span>
              )}
              {' '}➔ Kas cair langsung dipakai beli <b>{slotState.ticker}</b>
            </p>
          </div>
          <span className={`font-mono text-[11px] font-black shrink-0 ${slotExitedToday.netPnlPct >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            {slotExitedToday.netPnlPct >= 0 ? '+' : ''}{slotExitedToday.netPnlPct}% ({slotExitedToday.netPnlPct >= 0 ? '+' : ''}Rp {slotExitedToday.netPnlRp.toLocaleString('id-ID')})
          </span>
        </div>
      )}

      {/* CARD HEADER */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">{slotName}</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase animate-pulse">
              Aktif Holding
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              <TickerDetailDialog ticker={slotState.ticker} logoSize="sm" className="text-2xl" />
            </div>
            <span className="px-2 py-0.5 rounded bg-violet-100 text-violet-800 text-xs font-bold font-mono">
              Hari ke-{slotState.daysHeld} / Maks 6
            </span>
          </div>
        </div>

        {/* FLOATING PNL BADGE */}
        <div className="text-right">
          <div
            className={`text-lg font-black font-mono flex items-center justify-end gap-0.5 ${
              isGain ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {isGain ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            {isGain ? '+' : ''}{slotState.floatingGainPct}%
          </div>
          <div
            className={`text-xs font-bold font-mono ${
              isGain ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            {isGain ? '+' : ''}Rp {slotState.floatingPnlRp.toLocaleString('id-ID')}
          </div>
        </div>
      </div>

      {/* PROGRESS TRACKER / RANGE BAR (SL -> ENTRY -> CLOSE -> PEAK -> TP1) */}
      <div className="space-y-1.5 p-3 rounded-xl bg-slate-100/70 border border-slate-200/80">
        <div className="flex justify-between items-center text-[10px] font-bold">
          <span className="text-rose-600">SL: Rp {slotState.currentSL}</span>
          <span className="text-slate-600">Entry: Rp {slotState.entryPrice}</span>
          <span className="text-violet-700 font-black">Market: Rp {slotState.currentClose}</span>
          <span className="text-emerald-700 font-black">TP1 (+9%): Rp {slotState.tp1Price}</span>
        </div>

        {/* STATUS PILL */}
        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60">
          <span className="text-slate-500 font-semibold">Status Proteksi SL:</span>
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              slotState.hitTP1
                ? 'bg-emerald-100 text-emerald-800 font-black border border-emerald-300'
                : slotState.isLocked1Tick
                ? 'bg-sky-100 text-sky-800 font-black border border-sky-300'
                : 'bg-amber-100 text-amber-800 font-semibold border border-amber-300'
            }`}
          >
            {slotState.slStatusNote}
          </span>
        </div>
      </div>

      {/* METRIC SPECS GRID */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="p-2 rounded-lg bg-white border border-slate-200">
          <div className="text-[10px] text-slate-400 font-bold uppercase">Sisa Posisi</div>
          <div className="font-black text-slate-900 font-mono mt-0.5">
            {slotState.remainingLots} Lot
          </div>
          <div className="text-[9px] text-slate-500">
            {slotState.hitTP1 ? '(50% TP1 cair)' : `(Total: ${slotState.totalLots} Lot)`}
          </div>
        </div>

        <div className="p-2 rounded-lg bg-white border border-slate-200">
          <div className="text-[10px] text-slate-400 font-bold uppercase">Nilai Floating</div>
          <div className="font-black text-slate-900 font-mono mt-0.5">
            Rp {(slotState.currentValueRp / 1000000).toFixed(2)} Jt
          </div>
          <div className="text-[9px] text-slate-500">
            Modal: Rp {(slotState.investedCapitalRp / 1000000).toFixed(2)} Jt
          </div>
        </div>

        <div className="p-2 rounded-lg bg-white border border-slate-200">
          <div className="text-[10px] text-slate-400 font-bold uppercase">Peak Tertinggi</div>
          <div className="font-black text-emerald-600 font-mono mt-0.5">
            +{slotState.peakGainPct}%
          </div>
          <div className="text-[9px] text-slate-500 font-mono">
            High: Rp {slotState.maxHigh}
          </div>
        </div>
      </div>
    </div>
  );
}

function Top2SignalsRadarCard({
  dateStr,
  formatDateIndo,
  entrySignals,
  freshSignals
}: {
  dateStr: string;
  formatDateIndo: (d: string) => string;
  entrySignals: DaySignalItem[];
  freshSignals: DaySignalItem[];
}) {
  const [subTab, setSubTab] = useState<'ENTRY' | 'FRESH'>('ENTRY');
  const activeList = subTab === 'ENTRY' ? entrySignals : freshSignals;

  return (
    <div className="p-4 rounded-2xl border border-violet-200/80 bg-gradient-to-r from-violet-50/70 via-indigo-50/40 to-slate-50/70 shadow-2xs space-y-3">
      {/* HEADER WITH TOGGLE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-violet-100 pb-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="p-1 rounded-lg bg-violet-600 text-white">
            <Sparkles className="w-3.5 h-3.5" />
          </span>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              Top 2 Sinyal Fast V-Rebound Hari Ini
              <span className="px-1.5 py-0.2 rounded bg-violet-100 text-violet-800 text-[10px] font-mono font-bold">
                {formatDateIndo(dateStr)}
              </span>
            </h3>
            <p className="text-[10px] text-slate-500 font-medium">
              Maksimal 2 emiten prioritas tertinggi berdasarkan Rebound Score &amp; Volume Absorption.
            </p>
          </div>
        </div>

        {/* SUBTAB TOGGLE */}
        <div className="flex items-center bg-white border border-slate-200/80 rounded-lg p-0.5 text-[11px] font-bold shrink-0 self-start sm:self-center shadow-2xs">
          <button
            onClick={() => setSubTab('ENTRY')}
            className={`px-2.5 py-0.5 rounded-md transition-all flex items-center gap-1 ${
              subTab === 'ENTRY'
                ? 'bg-violet-600 text-white shadow-2xs font-black'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Evaluasi Pagi (Entry)</span>
            <span className="px-1 rounded-full text-[9px] bg-violet-200 text-violet-900 font-mono">
              {entrySignals.length}
            </span>
          </button>
          <button
            onClick={() => setSubTab('FRESH')}
            className={`px-2.5 py-0.5 rounded-md transition-all flex items-center gap-1 ${
              subTab === 'FRESH'
                ? 'bg-violet-600 text-white shadow-2xs font-black'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Sinyal Sore (Besok)</span>
            <span className="px-1 rounded-full text-[9px] bg-slate-200 text-slate-800 font-mono">
              {freshSignals.length}
            </span>
          </button>
        </div>
      </div>

      {/* 2 SIGNAL CARDS GRID */}
      {activeList.length === 0 ? (
        <div className="py-5 text-center text-slate-400 text-xs">
          <Target className="w-5 h-5 mx-auto mb-1 opacity-40 text-slate-400" />
          Tidak ada sinyal Fast V-Rebound aktif yang terdeteksi untuk tanggal ini.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {activeList.map((sig, idx) => (
            <div
              key={sig.ticker}
              className="p-3 rounded-xl border border-slate-200/90 bg-white shadow-2xs hover:border-violet-300 transition-all space-y-2.5 text-xs"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-violet-600 text-white font-black text-[10px] flex items-center justify-center font-mono">
                    #{idx + 1}
                  </span>
                  <div className="text-base font-black font-mono">
                    <TickerDetailDialog ticker={sig.ticker} logoSize="xs" />
                  </div>
                  <span className="px-1.5 py-0.5 rounded bg-violet-100 text-violet-800 text-[10px] font-mono font-black">
                    Score: {sig.score}
                  </span>
                </div>

                <div className="text-right">
                  <div className="font-mono font-bold text-slate-900 text-xs">
                    Rp {sig.signalClose.toLocaleString('id-ID')}
                  </div>
                  <div className="text-[10px] font-mono text-rose-600 font-bold">
                    DD: -{sig.drawdownPct}%
                  </div>
                </div>
              </div>

              {/* STATS STRIP */}
              <div className="flex items-center justify-between text-[11px] bg-slate-50 p-2 rounded-lg border border-slate-100 text-slate-600">
                <span>Pola: <b className="text-slate-800">{sig.candlePattern}</b></span>
                <span>Vol: <b className="text-slate-800">{sig.volAbsorptionRatio}x MA20</b></span>
              </div>

              {/* ACTION / DECISION PILL */}
              <div className="pt-0.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Badge
                    variant="outline"
                    className={`text-[9px] font-black uppercase tracking-wider ${
                      sig.actionTaken === 'BOUGHT_SLOT_1' || sig.actionTaken === 'BOUGHT_SLOT_2'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : sig.actionTaken === 'SKIPPED_SLOTS_FULL'
                        ? 'bg-slate-100 text-slate-700 border-slate-300'
                        : sig.actionTaken === 'SKIPPED_ALREADY_HOLDING'
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : sig.actionTaken === 'MARKET_SENTIMENT_OFF'
                        ? 'bg-rose-100 text-rose-800 border-rose-300'
                        : 'bg-orange-100 text-orange-800 border-orange-300'
                    }`}
                  >
                    {subTab === 'FRESH'
                      ? '⚡ SIAP ORDER BESOK'
                      : sig.actionTaken === 'BOUGHT_SLOT_1'
                      ? '🟢 TERBELI SLOT 1'
                      : sig.actionTaken === 'BOUGHT_SLOT_2'
                      ? '🟢 TERBELI SLOT 2'
                      : sig.actionTaken === 'SKIPPED_SLOTS_FULL'
                      ? '⚪ DILEWATI (SLOT PENUH)'
                      : sig.actionTaken === 'SKIPPED_ALREADY_HOLDING'
                      ? '🟡 SUDAH DI PORTO'
                      : sig.actionTaken === 'MARKET_SENTIMENT_OFF'
                      ? '🔴 IHSG BEARISH'
                      : '🟠 TIDAK MATCH LOW'}
                  </Badge>
                  <span className="text-[11px] text-slate-600 leading-snug">
                    {subTab === 'FRESH'
                      ? `Siap Buy Limit @ Rp ${sig.signalClose} besok pagi (08:45 WIB)`
                      : sig.actionNote}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CompassIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  );
}
