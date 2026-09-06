"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Wallet,
  Coins,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  Target,
  Clock,
  Zap,
  PlusCircle,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Sliders,
  DollarSign,
  Download,
  Calendar,
  XCircle,
  Percent,
  Layers,
  ArrowRight,
  Sparkles,
  PieChart
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { api } from "@/lib/api";

export default function TradePortfolioMonitoringCard() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [candidateSignals, setCandidateSignals] = useState<any[]>([]);
  const [historyTrades, setHistoryTrades] = useState<any[]>([]);
  const [historyPagination, setHistoryPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [activeTab, setActiveTab] = useState<"ACTIVE" | "PLANNER" | "JOURNAL">("ACTIVE");
  const [plannerFilter, setPlannerFilter] = useState<"ALL" | "SORE" | "SWING">("ALL");

  // Notifications
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Dialog States
  const [topupOpen, setTopupOpen] = useState(false);
  const [cashActionType, setCashActionType] = useState<"DEPOSIT" | "WITHDRAW" | "ADJUST">("DEPOSIT");
  const [topupAmount, setTopupAmount] = useState<number>(0);
  const [targetCashInput, setTargetCashInput] = useState<number>(0);
  const [topupNote, setTopupNote] = useState<string>("Setor / Top-up Kas RDN");

  const [capitalOpen, setCapitalOpen] = useState(false);
  const [capitalInput, setCapitalInput] = useState<number>(0);

  const [manualEntryOpen, setManualEntryOpen] = useState(false);
  const [manualForm, setManualForm] = useState({
    ticker: "",
    strategyType: "SWING",
    entryPrice: 0,
    lots: 1
  });

  const [riskModalOpen, setRiskModalOpen] = useState(false);
  const [selectedTradeForRisk, setSelectedTradeForRisk] = useState<any>(null);
  const [newStopLoss, setNewStopLoss] = useState<number>(0);
  const [newTp1, setNewTp1] = useState<number>(0);
  const [newTp2, setNewTp2] = useState<number>(0);

  const [exitModalOpen, setExitModalOpen] = useState(false);
  const [selectedTradeForExit, setSelectedTradeForExit] = useState<any>(null);
  const [exitPriceInput, setExitPriceInput] = useState<number>(0);
  const [lotsToCloseInput, setLotsToCloseInput] = useState<number>(1);
  const [exitReasonInput, setExitReasonInput] = useState<string>("EMERGENCY_CUT");
  const [exitNoteInput, setExitNoteInput] = useState<string>("");

  // Tambah Muatan (Pyramiding) States
  const [addLotsModalOpen, setAddLotsModalOpen] = useState(false);
  const [selectedTradeForAddLots, setSelectedTradeForAddLots] = useState<any>(null);
  const [additionalLotsInput, setAdditionalLotsInput] = useState<number>(1);
  const [additionalPriceInput, setAdditionalPriceInput] = useState<number>(0);
  const [additionalStopLossInput, setAdditionalStopLossInput] = useState<number>(0);

  const showNotice = (type: "success" | "error", text: string) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 6000);
  };

  const openExitModal = (trade: any, defaultReason: string = "MANUAL_EXIT", defaultFraction: number = 1.0) => {
    setSelectedTradeForExit(trade);
    setExitPriceInput(trade.currentPrice || trade.entryPrice);
    const initialLots = defaultFraction === 1.0 
      ? trade.lots 
      : Math.max(1, Math.floor(trade.lots * defaultFraction));
    setLotsToCloseInput(initialLots);
    setExitReasonInput(defaultReason);
    setExitNoteInput("");
    setExitModalOpen(true);
  };

  const openAddLotsModal = (trade: any) => {
    setSelectedTradeForAddLots(trade);
    setAdditionalLotsInput(1);
    setAdditionalPriceInput(trade.currentPrice || trade.entryPrice);
    setAdditionalStopLossInput(trade.stopLossPrice || 0);
    setAddLotsModalOpen(true);
  };

  // Fetch complete overview
  const fetchOverview = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/portfolio/overview");
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err: any) {
      console.error("Gagal memuat data portofolio:", err);
      showNotice("error", err?.response?.data?.message || "Gagal memuat status portofolio.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch signals for Trade Planner
  const fetchCandidateSignals = useCallback(async () => {
    try {
      const [resActive, resPending] = await Promise.all([
        api.get("/api/signals?status=ACTIVE&limit=30"),
        api.get("/api/signals?status=PENDING&limit=30")
      ]);
      const listActive = resActive.data?.data?.signals || [];
      const listPending = resPending.data?.data?.signals || [];
      // Combine unique tickers
      const combined = [...listActive, ...listPending];
      const unique = Array.from(new Map(combined.map(s => [s.ticker, s])).values());
      setCandidateSignals(unique);
    } catch (err) {
      console.error("Gagal memuat kandidat sinyal planner:", err);
    }
  }, []);

  // Fetch closed trade history journal
  const fetchHistory = useCallback(async (page = 1) => {
    try {
      const res = await api.get(`/api/portfolio/history?page=${page}&limit=10`);
      if (res.data?.success) {
        setHistoryTrades(res.data.data.trades || []);
        setHistoryPagination(res.data.data.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
      }
    } catch (err) {
      console.error("Gagal memuat riwayat trade:", err);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
    fetchCandidateSignals();
    fetchHistory();
  }, [fetchOverview, fetchCandidateSignals, fetchHistory]);

  // Handler: Cash Management (Deposit / Withdraw / Direct Adjustment)
  const handleCashSubmit = async () => {
    try {
      if (cashActionType === "DEPOSIT") {
        if (!topupAmount || topupAmount <= 0) {
          showNotice("error", "Nominal setor / top-up harus lebih besar dari Rp 0.");
          return;
        }
        const res = await api.post("/api/portfolio/topup", {
          amount: topupAmount,
          note: topupNote || "Setor Kas RDN"
        });
        if (res.data?.success) {
          showNotice("success", res.data.message);
          setTopupOpen(false);
          fetchOverview();
        }
      } else if (cashActionType === "WITHDRAW") {
        if (!topupAmount || topupAmount <= 0) {
          showNotice("error", "Nominal penarikan / pengurangan harus lebih besar dari Rp 0.");
          return;
        }
        const res = await api.post("/api/portfolio/withdraw", {
          amount: topupAmount,
          note: topupNote || "Tarik / Koreksi Kas RDN"
        });
        if (res.data?.success) {
          showNotice("success", res.data.message);
          setTopupOpen(false);
          fetchOverview();
        }
      } else if (cashActionType === "ADJUST") {
        if (targetCashInput < 0) {
          showNotice("error", "Saldo kas tidak boleh negatif.");
          return;
        }
        const res = await api.post("/api/portfolio/adjust-cash", {
          currentCash: targetCashInput,
          note: topupNote || `Koreksi Saldo Kas RDN ke Rp ${targetCashInput.toLocaleString("id-ID")}`
        });
        if (res.data?.success) {
          showNotice("success", res.data.message);
          setTopupOpen(false);
          fetchOverview();
        }
      }
    } catch (err: any) {
      showNotice("error", err?.response?.data?.message || "Gagal memproses transaksi kas.");
    }
  };

  // Handler: Set Initial Capital
  const handleSetCapitalSubmit = async () => {
    if (!capitalInput || capitalInput < 1000000) {
      showNotice("error", "Modal minimal Rp 1.000.000.");
      return;
    }
    try {
      const res = await api.post("/api/portfolio/initial-capital", {
        initialCapital: capitalInput
      });
      if (res.data?.success) {
        showNotice("success", res.data.message);
        setCapitalOpen(false);
        fetchOverview();
      }
    } catch (err: any) {
      showNotice("error", err?.response?.data?.message || "Gagal mengatur modal awal.");
    }
  };


  // Handler: Open Trade (Manual or from Planner)
  const handleOpenPosition = async (payload: any) => {
    try {
      const res = await api.post("/api/portfolio/open-position", payload);
      if (res.data?.success) {
        showNotice("success", res.data.message);
        setManualEntryOpen(false);
        fetchOverview();
      }
    } catch (err: any) {
      showNotice("error", err?.response?.data?.message || "Gagal membuka posisi.");
    }
  };

  // Handler: Update Risk (SL/TP)
  const handleUpdateRisk = async () => {
    if (!selectedTradeForRisk) return;
    try {
      const res = await api.patch(`/api/portfolio/position/${selectedTradeForRisk._id}/risk`, {
        stopLossPrice: newStopLoss,
        targetPrice1: newTp1,
        targetPrice2: newTp2
      });
      if (res.data?.success) {
        showNotice("success", res.data.message);
        setRiskModalOpen(false);
        fetchOverview();
      }
    } catch (err: any) {
      showNotice("error", err?.response?.data?.message || "Gagal memperbarui level resiko.");
    }
  };

  // Handler: Close Trade / Emergency Cut / Partial TP
  const handleClosePosition = async () => {
    if (!selectedTradeForExit) return;
    if (!exitPriceInput || exitPriceInput <= 0) {
      showNotice("error", "Harga jual keluar tidak valid.");
      return;
    }
    if (!lotsToCloseInput || lotsToCloseInput <= 0) {
      showNotice("error", "Jumlah lot yang dijual harus lebih besar dari 0.");
      return;
    }
    if (lotsToCloseInput > selectedTradeForExit.lots) {
      showNotice("error", `Maksimal lot yang bisa dijual adalah ${selectedTradeForExit.lots} lot.`);
      return;
    }
    try {
      const res = await api.post(`/api/portfolio/position/${selectedTradeForExit._id}/close`, {
        exitPrice: exitPriceInput,
        lots: lotsToCloseInput,
        exitReason: exitReasonInput,
        exitNote: exitNoteInput
      });
      if (res.data?.success) {
        showNotice("success", res.data.message);
        setExitModalOpen(false);
        fetchOverview();
        fetchHistory();
      }
    } catch (err: any) {
      showNotice("error", err?.response?.data?.message || "Gagal menutup posisi.");
    }
  };

  // Handler: Tambah Muatan (Pyramiding)
  const handleAddLotsSubmit = async () => {
    if (!selectedTradeForAddLots) return;
    if (!additionalLotsInput || additionalLotsInput <= 0) {
      showNotice("error", "Jumlah lot tambahan harus lebih besar dari 0.");
      return;
    }
    if (!additionalPriceInput || additionalPriceInput <= 0) {
      showNotice("error", "Harga beli tambahan tidak valid.");
      return;
    }
    try {
      const res = await api.post(`/api/portfolio/position/${selectedTradeForAddLots._id}/add-lots`, {
        additionalLots: additionalLotsInput,
        price: additionalPriceInput,
        stopLossPrice: additionalStopLossInput > 0 ? additionalStopLossInput : undefined
      });
      if (res.data?.success) {
        showNotice("success", res.data.message);
        setAddLotsModalOpen(false);
        fetchOverview();
      }
    } catch (err: any) {
      showNotice("error", err?.response?.data?.message || "Gagal menambah muatan.");
    }
  };

  // Helper: Status Pasar & Jadwal EOD 17:15 WIB
  const getMarketStatus = () => {
    const now = new Date();
    const jktDate = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
    const day = jktDate.getDay();
    const hours = jktDate.getHours();
    const minutes = jktDate.getMinutes();
    const timeVal = hours * 100 + minutes;

    const isWeekend = day === 0 || day === 6;

    if (isWeekend) {
      return {
        status: "WEEKEND",
        badge: "Libur Akhir Pekan",
        color: "bg-amber-100 text-amber-800 border-amber-300",
        message: "Bursa libur akhir pekan. Data EOD terakhir siap dievaluasi untuk sesi pembukaan Senin 09:00 WIB."
      };
    }

    if (timeVal >= 900 && timeVal < 1600) {
      return {
        status: "OPEN",
        badge: "Pasar Sedang Buka (Live)",
        color: "bg-emerald-100 text-emerald-800 border-emerald-300 animate-pulse",
        message: "Sesi perdagangan aktif (09:00 – 16:00 WIB). Pantau pergerakan harga riil."
      };
    } else if (timeVal >= 1600 && timeVal < 1715) {
      return {
        status: "PRE_SYNC",
        badge: "Pasar Tutup",
        color: "bg-blue-100 text-blue-800 border-blue-300",
        message: "Pasar reguler tutup. Sinkronisasi data EOD otomatis berlangsung pukul 17:15 WIB."
      };
    } else {
      return {
        status: "EOD_READY",
        badge: "EOD Fresh (Update 17:15)",
        color: "bg-indigo-100 text-indigo-800 border-indigo-300",
        message: "Data penutupan 17:15 WIB telah diperbarui. Evaluasi rekomendasi tindakan di bawah."
      };
    }
  };

  // Quick lot calculator helper based on current available cash & slot budget
  const calculateRecommendedLots = (price: number, strategy: string) => {
    if (!price || price <= 0 || !data) return { lots: 0, budget: 0, cost: 0, canBuy: false };
    const cash = data.account.currentCash;
    const isSwing = strategy === "SWING";
    const slotBudget = isSwing ? data.slots.swingSlot1.budget : data.slots.beliSoreSlot.budget;
    const allocBudget = Math.min(cash, slotBudget);
    const lots = Math.floor(allocBudget / (price * 100));
    const cost = lots * price * 100;
    return {
      lots,
      budget: slotBudget,
      cost,
      canBuy: lots > 0 && cash >= cost
    };
  };

  // Export Journal to CSV
  const handleExportCSV = () => {
    if (!historyTrades || historyTrades.length === 0) {
      showNotice("error", "Belum ada data riwayat transaksi untuk diekspor.");
      return;
    }
    const headers = [
      "No",
      "Ticker",
      "Strategi",
      "Tanggal Beli",
      "Tanggal Jual",
      "Durasi (Hari)",
      "Harga Beli",
      "Harga Jual",
      "Lot",
      "Modal (Rp)",
      "PnL (Rp)",
      "PnL (%)",
      "Status Exit",
      "Catatan"
    ];
    const rows = historyTrades.map((t, idx) => [
      idx + 1,
      t.ticker,
      t.strategyType,
      new Date(t.entryDate).toLocaleDateString("id-ID"),
      new Date(t.exitDate).toLocaleDateString("id-ID"),
      t.holdingDays || 1,
      t.entryPrice,
      t.exitPrice,
      t.lots,
      t.totalCapitalUsed,
      t.realizedPnLRupiah || 0,
      `${t.realizedPnLPercent || 0}%`,
      t.exitReason,
      `"${t.exitNote || ""}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `jurnal_portofolio_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotice("success", "File CSV jurnal berhasil diunduh.");
  };

  const account = data?.account || { initialCapital: 0, currentCash: 0, totalDeposited: 0 };
  const equity = data?.equity || { totalEquity: 0, totalInvestedCapital: 0, unrealizedPnLRupiah: 0, unrealizedPnLPercent: 0, netPortfolioGrowthPercent: 0 };
  const slots = data?.slots || {
    swingSlot1: { budget: 0, isOccupied: false, trade: null },
    swingSlot2: { budget: 0, isOccupied: false, trade: null },
    beliSoreSlot: { budget: 0, isOccupied: false, trade: null }
  };
  const openTrades = data?.openTrades || [];
  const performance = data?.performance || { winRate: 0, totalRealizedPnLRupiah: 0, profitFactor: 0, closedTradesCount: 0 };

  const occupiedSlotsCount = openTrades.length;
  const totalSlotsCapacity = Math.max(3, openTrades.length);
  const isPortfolioFull = occupiedSlotsCount >= totalSlotsCapacity && occupiedSlotsCount >= 3;
  const marketInfo = getMarketStatus();

  // Evaluasi Alert Briefing EOD
  const cutAlerts = openTrades.filter((t: any) => t.actionRecommendation === "CUT");
  const tpAlerts = openTrades.filter((t: any) => t.actionRecommendation === "TP");
  const addLotsAlerts = openTrades.filter((t: any) => t.actionRecommendation === "ADD_LOTS");

  // Helper render rekomendasi komprehensif & konfirmasi breakout di dalam Slot Card
  const renderCardRecommendations = (trade: any, maxDaysLabel: string) => {
    if (!trade) return null;

    const isNearSL = trade.currentPrice && trade.stopLossPrice && trade.currentPrice <= trade.stopLossPrice * 1.01;
    const isAtOrPastSL = trade.currentPrice && trade.stopLossPrice && trade.currentPrice <= trade.stopLossPrice;
    const isAtTP1 = trade.targetPrice1 && trade.currentPrice >= trade.targetPrice1;

    return (
      <div className="space-y-2 pt-1">
        {/* Durasi Holding & Status Resisten Breakout */}
        <div className="flex items-center justify-between text-[11px] text-slate-600">
          <span>Hari ke-{trade.holdingDays} ({maxDaysLabel})</span>
          {trade.isBreakoutConfirmed ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-full border border-emerald-300 animate-pulse">
              <Zap className="w-3 h-3 text-emerald-600 fill-emerald-600" />
              Breakout Terkonfirmasi!
            </span>
          ) : trade.confirmationPrice ? (
            <span
              className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200"
              title={trade.confirmationNote || "Pantau penembusan level resisten"}
            >
              <Target className="w-3 h-3 text-indigo-500" />
              Breakout: Rp {trade.confirmationPrice?.toLocaleString("id-ID")} ({trade.confirmationTriggerPct > 0 ? "+" : ""}{trade.confirmationTriggerPct}%)
            </span>
          ) : (
            <span className="text-rose-600 font-semibold">SL: Rp {trade.stopLossPrice?.toLocaleString("id-ID")}</span>
          )}
        </div>

        {/* Box Rekomendasi 3 Pilar: SL, Tambah Muatan, Hold/TP */}
        <div className="p-2.5 rounded-lg bg-slate-50/90 border border-slate-200/90 text-[11px] space-y-1.5 shadow-2xs">
          {/* Header Aksi Utama */}
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rekomendasi Tindakan</span>
            <Badge
              className={`text-[10px] font-bold px-2 py-0.5 ${
                trade.actionBadgeColor === "rose"
                  ? "bg-rose-600 text-white animate-pulse"
                  : trade.actionBadgeColor === "emerald"
                  ? "bg-emerald-600 text-white"
                  : trade.actionBadgeColor === "blue"
                  ? "bg-blue-600 text-white"
                  : trade.actionBadgeColor === "indigo"
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-700 text-white"
              }`}
            >
              {trade.actionTitle || "Hold Normal"}
            </Badge>
          </div>

          {/* Rincian 3 Baris: SL, Tambah Muatan, TP/Hold */}
          <div className="space-y-1 pt-0.5 border-t border-slate-200/60 text-[10.5px]">
            {/* Rekomendasi SL */}
            <div className="flex items-start justify-between gap-1">
              <span className="text-slate-500 font-semibold flex items-center gap-1 shrink-0">
                <ShieldAlert className="w-3 h-3 text-rose-500 shrink-0" />
                <span>SL / Proteksi:</span>
              </span>
              <span className={`text-right font-bold ${isAtOrPastSL ? "text-rose-600 animate-pulse" : isNearSL ? "text-rose-600" : "text-slate-700"}`}>
                {trade.slRecommendation || `Rp ${trade.stopLossPrice?.toLocaleString("id-ID")}`}
              </span>
            </div>

            {/* Rekomendasi Tambah Muatan */}
            <div className="flex items-start justify-between gap-1">
              <span className="text-slate-500 font-semibold flex items-center gap-1 shrink-0">
                <PlusCircle className="w-3 h-3 text-blue-500 shrink-0" />
                <span>Tambah Muatan:</span>
              </span>
              <span className={`text-right font-bold ${trade.actionRecommendation === "ADD_LOTS" ? "text-blue-600" : "text-slate-600"}`}>
                {trade.addLotsRecommendation || (trade.actionRecommendation === "ADD_LOTS" ? `Siap +${trade.suggestedLotsToAdd} lot` : "Tunggu breakout")}
              </span>
            </div>

            {/* Rekomendasi TP & Hold */}
            <div className="flex items-start justify-between gap-1">
              <span className="text-slate-500 font-semibold flex items-center gap-1 shrink-0">
                <Target className="w-3 h-3 text-emerald-500 shrink-0" />
                <span>Target / TP:</span>
              </span>
              <span className={`text-right font-bold ${isAtTP1 ? "text-emerald-600" : "text-slate-700"}`}>
                {trade.tpRecommendation || `TP1: Rp ${trade.targetPrice1?.toLocaleString("id-ID")}`}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-150">
      {/* MARKET SCHEDULE & HOLIDAY TRACKER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-slate-100 text-slate-700 rounded-lg">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">Jadwal Bursa & Update EOD (17:15 WIB)</span>
              <Badge className={`text-[10px] font-bold ${marketInfo.color}`}>{marketInfo.badge}</Badge>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">{marketInfo.message}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <Badge variant="outline" className="text-[10px] font-mono text-slate-600 bg-slate-50">
            Senin – Jumat @ 17:15 WIB
          </Badge>
        </div>
      </div>

      {/* EOD ACTION BRIEFING ALERT BANNER (IF THERE ARE ACTIVE ALERTS) */}
      {openTrades.length > 0 && (cutAlerts.length > 0 || tpAlerts.length > 0 || addLotsAlerts.length > 0) && (
        <div className="p-4 rounded-xl border bg-linear-to-r from-slate-900 to-slate-800 text-white shadow-md space-y-3">
          <div className="flex items-center justify-between border-b border-slate-700 pb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-amber-400/20 text-amber-300 rounded-md">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-black tracking-tight text-white">
                  Rekomendasi Tindakan Pasca Penutupan Pasar (EOD Action Briefing)
                </h3>
                <p className="text-[10px] text-slate-300">
                  Instruksi konkret berdasarkan data penutupan terakhir untuk memproteksi modal dan memaksimalkan profit.
                </p>
              </div>
            </div>
            <Badge className="bg-white/10 text-slate-200 border-white/20 text-[10px]">
              {cutAlerts.length + tpAlerts.length + addLotsAlerts.length} Tindakan Perlu Perhatian
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            {/* Action 1: CUT ALERTS */}
            {cutAlerts.length > 0 && (
              <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-lg space-y-2">
                <div className="flex items-center gap-1.5 text-rose-300 font-bold text-xs">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span>Harus Cut Segera ({cutAlerts.length})</span>
                </div>
                {cutAlerts.map((t: any) => (
                  <div key={t._id} className="text-[11px] text-rose-100 bg-rose-950/50 p-2 rounded flex items-center justify-between gap-2">
                    <div>
                      <Link
                        href={`/ticker/${t.ticker}`}
                        className="font-black text-white hover:text-amber-300 underline underline-offset-2 decoration-dotted"
                        title="Buka Analisis Lengkap Detail Ticker"
                      >
                        {t.ticker}
                      </Link>
                      <span className="text-slate-300 font-medium"> ({t.lots}L)</span>
                      {t.systemScore && (
                        <span className="ml-1 text-[9px] px-1.5 py-0.5 bg-rose-500/30 text-rose-200 rounded font-semibold">
                          Skor {t.systemScore}
                        </span>
                      )}
                      : {t.actionReason}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => openExitModal(t, "HIT_SL", 1.0)}
                      className="h-6 text-[10px] bg-rose-600 hover:bg-rose-700 text-white font-bold shrink-0"
                    >
                      Cut Loss
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Action 2: TAKE PROFIT ALERTS */}
            {tpAlerts.length > 0 && (
              <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-lg space-y-2">
                <div className="flex items-center gap-1.5 text-emerald-300 font-bold text-xs">
                  <Target className="w-4 h-4 text-emerald-400" />
                  <span>Siap Take Profit ({tpAlerts.length})</span>
                </div>
                {tpAlerts.map((t: any) => (
                  <div key={t._id} className="text-[11px] text-emerald-100 bg-emerald-950/50 p-2 rounded flex items-center justify-between gap-2">
                    <div>
                      <Link
                        href={`/ticker/${t.ticker}`}
                        className="font-black text-white hover:text-amber-300 underline underline-offset-2 decoration-dotted"
                        title="Buka Analisis Lengkap Detail Ticker"
                      >
                        {t.ticker}
                      </Link>
                      <span className="text-slate-300 font-medium"> ({t.lots}L)</span>
                      {t.systemScore && (
                        <span className="ml-1 text-[9px] px-1.5 py-0.5 bg-emerald-500/30 text-emerald-200 rounded font-semibold">
                          Skor {t.systemScore}
                        </span>
                      )}
                      : {t.actionReason}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        size="sm"
                        onClick={() => openExitModal(t, "HIT_TP1", 0.5)}
                        className="h-6 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                        title="Jual 50% lot untuk kunci profit, sisa lot biarkan jalan"
                      >
                        TP 50%
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openExitModal(t, "HIT_TP1", 1.0)}
                        className="h-6 text-[10px] border-emerald-400/50 text-emerald-200 hover:bg-emerald-900/50"
                        title="Tutup seluruh lot"
                      >
                        Tutup Semua
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Action 3: TAMBAH MUATAN ALERTS */}
            {addLotsAlerts.length > 0 && (
              <div className="p-3 bg-blue-500/20 border border-blue-500/40 rounded-lg space-y-2">
                <div className="flex items-center gap-1.5 text-blue-300 font-bold text-xs">
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                  <span>Bisa Tambah Muatan ({addLotsAlerts.length})</span>
                </div>
                {addLotsAlerts.map((t: any) => (
                  <div key={t._id} className="text-[11px] text-blue-100 bg-blue-950/50 p-2 rounded flex items-center justify-between gap-2">
                    <div>
                      <Link
                        href={`/ticker/${t.ticker}`}
                        className="font-black text-white hover:text-amber-300 underline underline-offset-2 decoration-dotted"
                        title="Buka Analisis Lengkap Detail Ticker"
                      >
                        {t.ticker}
                      </Link>
                      <span className="text-slate-300 font-medium"> ({t.lots}L)</span>
                      {t.systemScore && (
                        <span className="ml-1 text-[9px] px-1.5 py-0.5 bg-blue-500/30 text-blue-200 rounded font-semibold">
                          Skor {t.systemScore}
                        </span>
                      )}
                      : {t.actionReason}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => openAddLotsModal(t)}
                      className="h-6 text-[10px] bg-blue-600 hover:bg-blue-700 text-white font-bold shrink-0"
                    >
                      + Muatan
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      {/* SYSTEM NOTIFICATION */}
      {notification && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-semibold shadow-xs ${
            notification.type === "success"
              ? "bg-emerald-50 text-emerald-900 border-emerald-200"
              : "bg-rose-50 text-rose-900 border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{notification.text}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-700">
            ✕
          </button>
        </div>
      )}

      {/* TOP HEADER: CAPITAL CONTROLLER & SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Total Ekuitas */}
        <Card className="border-slate-200 bg-white shadow-xs">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Ekuitas Akun</span>
              <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <CardTitle className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              Rp {equity.totalEquity?.toLocaleString("id-ID")}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
              <span>Disetor: Rp {account.totalDeposited?.toLocaleString("id-ID")}</span>
              <span className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${
                equity.netPortfolioGrowthPercent >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
              }`}>
                {equity.netPortfolioGrowthPercent >= 0 ? "+" : ""}{equity.netPortfolioGrowthPercent}%
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Kas Tersedia RDN */}
        <Card className="border-slate-200 bg-white shadow-xs">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Kas RDN Tersedia</span>
              <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                <Coins className="w-4 h-4" />
              </div>
            </div>
            <CardTitle className={`text-xl sm:text-2xl font-black mt-1 ${
              account.currentCash < 1000000 ? "text-amber-600" : "text-emerald-600"
            }`}>
              Rp {account.currentCash?.toLocaleString("id-ID")}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-500">
                {account.currentCash > 0 ? "Bensin siap belanja" : "Kas habis terpakai"}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setCashActionType("DEPOSIT");
                  setTargetCashInput(account.currentCash || 0);
                  setTopupOpen(true);
                }}
                className="h-6 text-[10px] px-2 border-emerald-200 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-100 font-bold"
              >
                <PlusCircle className="w-3 h-3 mr-1" /> Kelola Kas
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Modal Terpakai & Nilai Pasar (Market Value) */}
        <Card className="border-slate-200 bg-white shadow-xs">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Nilai Pasar (Market Value)</span>
              <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <CardTitle className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              Rp {(equity.totalCurrentMarketValue || equity.totalInvestedCapital)?.toLocaleString("id-ID")}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex items-center justify-between text-[11px] font-medium text-slate-500">
              <span>Modal: Rp {equity.totalInvestedCapital?.toLocaleString("id-ID")}</span>
              <span className="font-bold text-slate-700">
                {openTrades.length} Saham Aktif
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Potential PnL (Floating Gain/Loss) */}
        <Card className="border-slate-200 bg-white shadow-xs">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Potential PnL (Floating)</span>
              <div className={`p-1.5 rounded-lg ${
                equity.unrealizedPnLRupiah >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
              }`}>
                {equity.unrealizedPnLRupiah >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              </div>
            </div>
            <CardTitle className={`text-xl sm:text-2xl font-black mt-1 ${
              equity.unrealizedPnLRupiah >= 0 ? "text-emerald-600" : "text-rose-600"
            }`}>
              {equity.unrealizedPnLRupiah >= 0 ? "+" : ""}Rp {equity.unrealizedPnLRupiah?.toLocaleString("id-ID")}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold">
              <span className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${
                equity.unrealizedPnLPercent >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
              }`}>
                {equity.unrealizedPnLPercent >= 0 ? "+" : ""}{equity.unrealizedPnLPercent}%
              </span>
              <span className="text-slate-400">belum terealisasi</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 5: Realized Win Rate & Total PnL */}
        <Card className="border-slate-200 bg-white shadow-xs">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Realized Win Rate</span>
              <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                <Target className="w-4 h-4" />
              </div>
            </div>
            <CardTitle className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              {performance.winRate}%
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex items-center justify-between text-[11px] font-medium text-slate-500">
              <span>{performance.closedTradesCount} Trade Close</span>
              <span className={`font-bold ${performance.totalRealizedPnLRupiah >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                {performance.totalRealizedPnLRupiah >= 0 ? "+" : ""}Rp {performance.totalRealizedPnLRupiah?.toLocaleString("id-ID")}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* QUICK ACTION BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => {
              setCashActionType("DEPOSIT");
              setTargetCashInput(account.currentCash || 0);
              setTopupOpen(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold h-8 shadow-xs cursor-pointer"
          >
            <Coins className="w-3.5 h-3.5 mr-1.5" /> Kelola Kas RDN (Setor / Tarik / Koreksi)
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setManualForm({
                ticker: "",
                strategyType: "SWING",
                entryPrice: 0,
                lots: 1
              });
              setManualEntryOpen(true);
            }}
            className="border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold h-8"
          >
            <PlusCircle className="w-3.5 h-3.5 mr-1.5" /> Catat Entry Manual
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setCapitalInput(account.initialCapital);
              setCapitalOpen(true);
            }}
            className="border-slate-200 text-slate-600 hover:bg-slate-50 text-xs h-8"
          >
            <Sliders className="w-3.5 h-3.5 mr-1.5 text-slate-400" /> Atur Modal Akun
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              fetchOverview();
              fetchCandidateSignals();
              fetchHistory();
            }}
            disabled={loading}
            className="text-slate-600 hover:text-slate-900 text-xs h-8"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>
      </div>

      {/* SECTION 2: 3-SLOT PORTFOLIO VISUALIZER (BENSIN & OVERTRADE TRACKER) */}
      <Card className="border-slate-200 bg-white shadow-xs overflow-hidden">
        <CardHeader className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-bold text-slate-900">
                  Matriks Slot Portofolio (Anti-Overtrade & Bensin Tracker)
                </CardTitle>
                <Badge className={isPortfolioFull ? "bg-rose-100 text-rose-700 border-rose-200 font-bold" : "bg-emerald-100 text-emerald-700 border-emerald-200 font-bold"}>
                  {occupiedSlotsCount}/{totalSlotsCapacity} Slot Terisi
                </Badge>
              </div>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Alokasi disiplin: 75% SWING (2 Slot @ 37.5%) + 25% Beli Sore / Calon ARA (1 Slot @ 25%).
              </CardDescription>
            </div>

            {/* Capacity Status Banner */}
            <div>
              {isPortfolioFull ? (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs font-bold">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Kapasitas Slot Terisi Penuh ({occupiedSlotsCount}/{totalSlotsCapacity}): Sinyal radar baru di-skip untuk menjaga kas RDN.</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-bold">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Kapasitas Tersedia: Masih ada {totalSlotsCapacity - occupiedSlotsCount} slot kosong yang siap dieksekusi!</span>
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Slot 1: SWING 1 */}
            <div className={`p-4 rounded-xl border transition-all ${
              slots.swingSlot1.isOccupied
                ? "bg-blue-50/40 border-blue-200 shadow-xs"
                : "bg-slate-50/60 border-dashed border-slate-300"
            }`}>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-600 text-white font-bold text-[10px]">SWING Slot 1</Badge>
                  <span className="text-[11px] font-semibold text-slate-500">
                    Target: Rp {slots.swingSlot1.budget?.toLocaleString("id-ID")}
                  </span>
                </div>
                <span className={`w-2.5 h-2.5 rounded-full ${slots.swingSlot1.isOccupied ? "bg-blue-500 animate-pulse" : "bg-slate-300"}`}></span>
              </div>

              {slots.swingSlot1.isOccupied && slots.swingSlot1.trade ? (
                <div className="mt-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/ticker/${slots.swingSlot1.trade.ticker}`}
                          className="text-lg font-black text-slate-900 tracking-tight hover:text-indigo-600 transition-colors"
                          title="Buka Analisis Detail Ticker"
                        >
                          {slots.swingSlot1.trade.ticker}
                        </Link>
                        {slots.swingSlot1.trade.systemScore && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                            Skor {slots.swingSlot1.trade.systemScore}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium">
                        {slots.swingSlot1.trade.lots} Lot @ Rp {slots.swingSlot1.trade.entryPrice?.toLocaleString("id-ID")}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-black ${
                        slots.swingSlot1.trade.unrealizedPnLRupiah >= 0 ? "text-emerald-600" : "text-rose-600"
                      }`}>
                        {slots.swingSlot1.trade.unrealizedPnLRupiah >= 0 ? "+" : ""}{slots.swingSlot1.trade.unrealizedPnLPercent}%
                      </span>
                      <p className="text-[10px] font-bold text-slate-500">
                        {slots.swingSlot1.trade.unrealizedPnLRupiah >= 0 ? "+" : ""}Rp {slots.swingSlot1.trade.unrealizedPnLRupiah?.toLocaleString("id-ID")}
                      </p>
                    </div>
                  </div>

                  {/* Current Price & Market Value Grid */}
                  <div className="p-2 bg-white/90 rounded-lg border border-slate-200/80 grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Harga Terkini (Current)</span>
                      <span className="font-bold text-slate-800">
                        Rp {(slots.swingSlot1.trade.currentPrice || slots.swingSlot1.trade.entryPrice)?.toLocaleString("id-ID")}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-medium">Nilai Pasar (Market Value)</span>
                      <span className="font-bold text-slate-900">
                        Rp {(slots.swingSlot1.trade.currentMarketValue || slots.swingSlot1.trade.lots * (slots.swingSlot1.trade.currentPrice || slots.swingSlot1.trade.entryPrice) * 100)?.toLocaleString("id-ID")}
                      </span>
                    </div>
                  </div>

                  {renderCardRecommendations(slots.swingSlot1.trade, "Max 10D")}

                  <div className="flex items-center gap-1.5 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openAddLotsModal(slots.swingSlot1.trade)}
                      className="text-[11px] h-7 border-blue-200 text-blue-700 hover:bg-blue-50 font-bold cursor-pointer"
                      title="Tambah muatan lot (Pyramiding)"
                    >
                      + Muatan
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedTradeForRisk(slots.swingSlot1.trade);
                        setNewStopLoss(slots.swingSlot1.trade.stopLossPrice);
                        setNewTp1(slots.swingSlot1.trade.targetPrice1 || 0);
                        setNewTp2(slots.swingSlot1.trade.targetPrice2 || 0);
                        setRiskModalOpen(true);
                      }}
                      className="flex-1 text-[11px] h-7 border-slate-200 hover:bg-slate-100 cursor-pointer"
                    >
                      Edit SL/TP
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openExitModal(slots.swingSlot1.trade, "MANUAL_EXIT")}
                      className="text-[11px] h-7 border-rose-200 text-rose-700 hover:bg-rose-50 font-bold cursor-pointer"
                      title="Tutup posisi atau TP sebagian"
                    >
                      Exit / TP
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-6 text-center py-4">
                  <div className="w-8 h-8 rounded-full bg-slate-200/70 text-slate-400 flex items-center justify-center mx-auto mb-2">
                    <PlusCircle className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-bold text-slate-600">Slot Tersedia</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Siap belanja sinyal SWING</p>
                </div>
              )}
            </div>

            {/* Slot 2: SWING 2 */}
            <div className={`p-4 rounded-xl border transition-all ${
              slots.swingSlot2.isOccupied
                ? "bg-blue-50/40 border-blue-200 shadow-xs"
                : "bg-slate-50/60 border-dashed border-slate-300"
            }`}>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-600 text-white font-bold text-[10px]">SWING Slot 2</Badge>
                  <span className="text-[11px] font-semibold text-slate-500">
                    Target: Rp {slots.swingSlot2.budget?.toLocaleString("id-ID")}
                  </span>
                </div>
                <span className={`w-2.5 h-2.5 rounded-full ${slots.swingSlot2.isOccupied ? "bg-blue-500 animate-pulse" : "bg-slate-300"}`}></span>
              </div>

              {slots.swingSlot2.isOccupied && slots.swingSlot2.trade ? (
                <div className="mt-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/ticker/${slots.swingSlot2.trade.ticker}`}
                          className="text-lg font-black text-slate-900 tracking-tight hover:text-indigo-600 transition-colors"
                          title="Buka Analisis Detail Ticker"
                        >
                          {slots.swingSlot2.trade.ticker}
                        </Link>
                        {slots.swingSlot2.trade.systemScore && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                            Skor {slots.swingSlot2.trade.systemScore}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium">
                        {slots.swingSlot2.trade.lots} Lot @ Rp {slots.swingSlot2.trade.entryPrice?.toLocaleString("id-ID")}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-black ${
                        slots.swingSlot2.trade.unrealizedPnLRupiah >= 0 ? "text-emerald-600" : "text-rose-600"
                      }`}>
                        {slots.swingSlot2.trade.unrealizedPnLRupiah >= 0 ? "+" : ""}{slots.swingSlot2.trade.unrealizedPnLPercent}%
                      </span>
                      <p className="text-[10px] font-bold text-slate-500">
                        {slots.swingSlot2.trade.unrealizedPnLRupiah >= 0 ? "+" : ""}Rp {slots.swingSlot2.trade.unrealizedPnLRupiah?.toLocaleString("id-ID")}
                      </p>
                    </div>
                  </div>

                  {/* Current Price & Market Value Grid */}
                  <div className="p-2 bg-white/90 rounded-lg border border-slate-200/80 grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Harga Terkini (Current)</span>
                      <span className="font-bold text-slate-800">
                        Rp {(slots.swingSlot2.trade.currentPrice || slots.swingSlot2.trade.entryPrice)?.toLocaleString("id-ID")}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-medium">Nilai Pasar (Market Value)</span>
                      <span className="font-bold text-slate-900">
                        Rp {(slots.swingSlot2.trade.currentMarketValue || slots.swingSlot2.trade.lots * (slots.swingSlot2.trade.currentPrice || slots.swingSlot2.trade.entryPrice) * 100)?.toLocaleString("id-ID")}
                      </span>
                    </div>
                  </div>

                  {renderCardRecommendations(slots.swingSlot2.trade, "Max 10D")}

                  <div className="flex items-center gap-1.5 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openAddLotsModal(slots.swingSlot2.trade)}
                      className="text-[11px] h-7 border-blue-200 text-blue-700 hover:bg-blue-50 font-bold cursor-pointer"
                      title="Tambah muatan lot (Pyramiding)"
                    >
                      + Muatan
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedTradeForRisk(slots.swingSlot2.trade);
                        setNewStopLoss(slots.swingSlot2.trade.stopLossPrice);
                        setNewTp1(slots.swingSlot2.trade.targetPrice1 || 0);
                        setNewTp2(slots.swingSlot2.trade.targetPrice2 || 0);
                        setRiskModalOpen(true);
                      }}
                      className="flex-1 text-[11px] h-7 border-slate-200 hover:bg-slate-100 cursor-pointer"
                    >
                      Edit SL/TP
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openExitModal(slots.swingSlot2.trade, "MANUAL_EXIT")}
                      className="text-[11px] h-7 border-rose-200 text-rose-700 hover:bg-rose-50 font-bold cursor-pointer"
                      title="Tutup posisi atau TP sebagian"
                    >
                      Exit / TP
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-6 text-center py-4">
                  <div className="w-8 h-8 rounded-full bg-slate-200/70 text-slate-400 flex items-center justify-center mx-auto mb-2">
                    <PlusCircle className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-bold text-slate-600">Slot Tersedia</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Siap belanja sinyal SWING</p>
                </div>
              )}
            </div>

            {/* Slot 3: Beli Sore / Calon ARA */}
            <div className={`p-4 rounded-xl border transition-all ${
              slots.beliSoreSlot.isOccupied
                ? "bg-purple-50/40 border-purple-200 shadow-xs"
                : "bg-slate-50/60 border-dashed border-slate-300"
            }`}>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                <div className="flex items-center gap-2">
                  <Badge className="bg-purple-600 text-white font-bold text-[10px]">Beli Sore Slot</Badge>
                  <span className="text-[11px] font-semibold text-slate-500">
                    Target: Rp {slots.beliSoreSlot.budget?.toLocaleString("id-ID")}
                  </span>
                </div>
                <span className={`w-2.5 h-2.5 rounded-full ${slots.beliSoreSlot.isOccupied ? "bg-purple-500 animate-pulse" : "bg-slate-300"}`}></span>
              </div>

              {slots.beliSoreSlot.isOccupied && slots.beliSoreSlot.trade ? (
                <div className="mt-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/ticker/${slots.beliSoreSlot.trade.ticker}`}
                          className="text-lg font-black text-slate-900 tracking-tight hover:text-indigo-600 transition-colors"
                          title="Buka Analisis Detail Ticker"
                        >
                          {slots.beliSoreSlot.trade.ticker}
                        </Link>
                        {slots.beliSoreSlot.trade.systemScore && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-100">
                            Skor {slots.beliSoreSlot.trade.systemScore}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium">
                        {slots.beliSoreSlot.trade.lots} Lot @ Rp {slots.beliSoreSlot.trade.entryPrice?.toLocaleString("id-ID")}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-black ${
                        slots.beliSoreSlot.trade.unrealizedPnLRupiah >= 0 ? "text-emerald-600" : "text-rose-600"
                      }`}>
                        {slots.beliSoreSlot.trade.unrealizedPnLRupiah >= 0 ? "+" : ""}{slots.beliSoreSlot.trade.unrealizedPnLPercent}%
                      </span>
                      <p className="text-[10px] font-bold text-slate-500">
                        {slots.beliSoreSlot.trade.unrealizedPnLRupiah >= 0 ? "+" : ""}Rp {slots.beliSoreSlot.trade.unrealizedPnLRupiah?.toLocaleString("id-ID")}
                      </p>
                    </div>
                  </div>

                  {/* Current Price & Market Value Grid */}
                  <div className="p-2 bg-white/90 rounded-lg border border-slate-200/80 grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Harga Terkini (Current)</span>
                      <span className="font-bold text-slate-800">
                        Rp {(slots.beliSoreSlot.trade.currentPrice || slots.beliSoreSlot.trade.entryPrice)?.toLocaleString("id-ID")}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-medium">Nilai Pasar (Market Value)</span>
                      <span className="font-bold text-slate-900">
                        Rp {(slots.beliSoreSlot.trade.currentMarketValue || slots.beliSoreSlot.trade.lots * (slots.beliSoreSlot.trade.currentPrice || slots.beliSoreSlot.trade.entryPrice) * 100)?.toLocaleString("id-ID")}
                      </span>
                    </div>
                  </div>

                  {renderCardRecommendations(slots.beliSoreSlot.trade, "Holding T+1")}

                  <div className="flex items-center gap-1.5 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openAddLotsModal(slots.beliSoreSlot.trade)}
                      className="text-[11px] h-7 border-blue-200 text-blue-700 hover:bg-blue-50 font-bold cursor-pointer"
                      title="Tambah muatan lot (Pyramiding)"
                    >
                      + Muatan
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedTradeForRisk(slots.beliSoreSlot.trade);
                        setNewStopLoss(slots.beliSoreSlot.trade.stopLossPrice);
                        setNewTp1(slots.beliSoreSlot.trade.targetPrice1 || 0);
                        setNewTp2(slots.beliSoreSlot.trade.targetPrice2 || 0);
                        setRiskModalOpen(true);
                      }}
                      className="flex-1 text-[11px] h-7 border-slate-200 hover:bg-slate-100 cursor-pointer"
                    >
                      Edit SL/TP
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openExitModal(slots.beliSoreSlot.trade, "MANUAL_EXIT")}
                      className="text-[11px] h-7 border-rose-200 text-rose-700 hover:bg-rose-50 font-bold cursor-pointer"
                      title="Tutup posisi atau TP sebagian"
                    >
                      Exit / TP
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-6 text-center py-4">
                  <div className="w-8 h-8 rounded-full bg-slate-200/70 text-slate-400 flex items-center justify-center mx-auto mb-2">
                    <Clock className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-bold text-slate-600">Slot Tersedia</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Siap entri sore (15:45 WIB)</p>
                </div>
              )}
            </div>

            {/* Extra Dynamic Slots for Manual Entries */}
            {slots.extraSlots && slots.extraSlots.map((extra: any, idx: number) => (
              <div
                key={extra.trade?._id || idx}
                className="p-4 rounded-xl border bg-amber-50/40 border-amber-200 shadow-xs"
              >
                <div className="flex items-center justify-between pb-2 border-b border-amber-200/60">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-amber-600 text-white font-bold text-[10px]">
                      {extra.slotName || `Slot Tambahan ${idx + 1}`}
                    </Badge>
                    <span className="text-[11px] font-semibold text-slate-500">
                      Modal: Rp {extra.budget?.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                </div>

                {extra.trade && (
                  <div className="mt-3 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <Link
                            href={`/ticker/${extra.trade.ticker}`}
                            className="text-lg font-black text-slate-900 tracking-tight hover:text-indigo-600 transition-colors"
                            title="Buka Analisis Detail Ticker"
                          >
                            {extra.trade.ticker}
                          </Link>
                          {extra.trade.systemScore && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                              Skor {extra.trade.systemScore}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium">
                          {extra.trade.lots} Lot @ Rp {extra.trade.entryPrice?.toLocaleString("id-ID")}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs font-black ${
                          extra.trade.unrealizedPnLRupiah >= 0 ? "text-emerald-600" : "text-rose-600"
                        }`}>
                          {extra.trade.unrealizedPnLRupiah >= 0 ? "+" : ""}{extra.trade.unrealizedPnLPercent}%
                        </span>
                        <p className="text-[10px] font-bold text-slate-500">
                          {extra.trade.unrealizedPnLRupiah >= 0 ? "+" : ""}Rp {extra.trade.unrealizedPnLRupiah?.toLocaleString("id-ID")}
                        </p>
                      </div>
                    </div>

                    {/* Current Price & Market Value Grid */}
                    <div className="p-2 bg-white/90 rounded-lg border border-slate-200/80 grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Harga Terkini (Current)</span>
                        <span className="font-bold text-slate-800">
                          Rp {(extra.trade.currentPrice || extra.trade.entryPrice)?.toLocaleString("id-ID")}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-medium">Nilai Pasar (Market Value)</span>
                        <span className="font-bold text-slate-900">
                          Rp {(extra.trade.currentMarketValue || extra.trade.lots * (extra.trade.currentPrice || extra.trade.entryPrice) * 100)?.toLocaleString("id-ID")}
                        </span>
                      </div>
                    </div>

                    {renderCardRecommendations(extra.trade, "Manual")}

                    <div className="flex items-center gap-1.5 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openAddLotsModal(extra.trade)}
                        className="text-[11px] h-7 border-blue-200 text-blue-700 hover:bg-blue-50 font-bold cursor-pointer"
                        title="Tambah muatan lot (Pyramiding)"
                      >
                        + Muatan
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedTradeForRisk(extra.trade);
                          setNewStopLoss(extra.trade.stopLossPrice);
                          setNewTp1(extra.trade.targetPrice1 || 0);
                          setNewTp2(extra.trade.targetPrice2 || 0);
                          setRiskModalOpen(true);
                        }}
                        className="flex-1 text-[11px] h-7 border-slate-200 hover:bg-slate-100 cursor-pointer"
                      >
                        Edit SL/TP
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openExitModal(extra.trade, "MANUAL_EXIT")}
                        className="text-[11px] h-7 border-rose-200 text-rose-700 hover:bg-rose-50 font-bold cursor-pointer"
                        title="Tutup posisi atau TP sebagian"
                      >
                        Exit / TP
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* SECTION 3: TABS (POSISI AKTIF, EXECUTION PLANNER, JURNAL TRADING) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <Button
            variant={activeTab === "ACTIVE" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("ACTIVE")}
            className={activeTab === "ACTIVE" ? "bg-slate-900 text-white font-bold" : "text-slate-600 font-medium"}
          >
            <Layers className="w-4 h-4 mr-1.5" />
            Posisi Aktif ({openTrades.length})
          </Button>

          <Button
            variant={activeTab === "PLANNER" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("PLANNER")}
            className={activeTab === "PLANNER" ? "bg-slate-900 text-white font-bold" : "text-slate-600 font-medium"}
          >
            <Zap className="w-4 h-4 mr-1.5 text-amber-500" />
            Rencana Entri & Kalkulator Lot
          </Button>

          <Button
            variant={activeTab === "JOURNAL" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("JOURNAL")}
            className={activeTab === "JOURNAL" ? "bg-slate-900 text-white font-bold" : "text-slate-600 font-medium"}
          >
            <PieChart className="w-4 h-4 mr-1.5" />
            Jurnal Riwayat Trade ({performance.closedTradesCount})
          </Button>
        </div>

        {/* TAB 1: POSISI AKTIF (ACTIVE HOLDINGS) */}
        {activeTab === "ACTIVE" && (
          <Card className="border-slate-200 bg-white shadow-xs">
            <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">
                  Daftar Posisi yang Sedang Dipegang
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Monitor harga terkini, floating profit/loss, durasi simpan, serta tombol edit resiko dan emergency exit.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {openTrades.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
                    <Wallet className="w-6 h-6" />
                  </div>
                  <p className="font-bold text-slate-700 text-sm">Belum Ada Posisi Saham yang Aktif</p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                    Kas RDN Anda saat ini utuh. Buka tab <b>"Rencana Entri & Kalkulator Lot"</b> di atas untuk mengeksekusi sinyal radar sore atau swing.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50/80">
                      <TableRow>
                        <TableHead className="w-[120px] text-xs font-bold text-slate-700">Ticker</TableHead>
                        <TableHead className="text-xs font-bold text-slate-700">Strategi</TableHead>
                        <TableHead className="text-xs font-bold text-slate-700">Tgl Beli & Durasi</TableHead>
                        <TableHead className="text-right text-xs font-bold text-slate-700">Harga Beli</TableHead>
                        <TableHead className="text-right text-xs font-bold text-slate-700">Harga Terkini</TableHead>
                        <TableHead className="text-right text-xs font-bold text-slate-700">Lot & Modal</TableHead>
                        <TableHead className="text-right text-xs font-bold text-slate-700">Nilai Pasar</TableHead>
                        <TableHead className="text-right text-xs font-bold text-slate-700">Potential PnL</TableHead>
                        <TableHead className="text-xs font-bold text-slate-700">Target & SL</TableHead>
                        <TableHead className="text-center text-xs font-bold text-slate-700">Status Tindakan</TableHead>
                        <TableHead className="text-center text-xs font-bold text-slate-700">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {openTrades.map((trade: any) => {
                        const isProfit = (trade.unrealizedPnLRupiah || 0) >= 0;
                        const isStagnant = trade.strategyType === "SWING" && trade.holdingDays >= 5 && trade.unrealizedPnLPercent < 2.0;
                        const isNearSL = trade.currentPrice && trade.stopLossPrice && trade.currentPrice <= trade.stopLossPrice * 1.01;

                        return (
                          <TableRow key={trade._id} className="hover:bg-slate-50/60">
                            <TableCell className="font-black text-slate-900 text-sm">
                              <div className="flex items-center gap-1.5">
                                <Link
                                  href={`/ticker/${trade.ticker}`}
                                  className="hover:text-indigo-600 transition-colors"
                                  title="Buka Analisis Detail Ticker"
                                >
                                  {trade.ticker}
                                </Link>
                                {trade.systemScore && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                                    Skor {trade.systemScore}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={
                                trade.strategyType === "SWING"
                                  ? "bg-blue-100 text-blue-700 border-blue-200 text-[10px]"
                                  : "bg-purple-100 text-purple-700 border-purple-200 text-[10px]"
                              }>
                                {trade.strategyType}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-slate-600">
                              <div>{new Date(trade.entryDate).toLocaleDateString("id-ID")}</div>
                              <div className="text-[10px] text-slate-400">Hari ke-{trade.holdingDays}</div>
                            </TableCell>
                            <TableCell className="text-right font-medium text-xs text-slate-800">
                              Rp {trade.entryPrice?.toLocaleString("id-ID")}
                            </TableCell>
                            <TableCell className="text-right font-bold text-xs text-slate-900">
                              Rp {(trade.currentPrice || trade.entryPrice)?.toLocaleString("id-ID")}
                            </TableCell>
                            <TableCell className="text-right text-xs">
                              <div className="font-bold text-slate-900">{trade.lots} Lot</div>
                              <div className="text-[10px] text-slate-400">Rp {trade.totalCapitalUsed?.toLocaleString("id-ID")}</div>
                            </TableCell>
                            <TableCell className="text-right text-xs">
                              <div className="font-bold text-slate-900">
                                Rp {(trade.currentMarketValue || trade.lots * (trade.currentPrice || trade.entryPrice) * 100)?.toLocaleString("id-ID")}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {trade.lots} Lot @ Rp {(trade.currentPrice || trade.entryPrice)?.toLocaleString("id-ID")}
                              </div>
                            </TableCell>
                            <TableCell className="text-right text-xs">
                              <div className={`font-black ${isProfit ? "text-emerald-600" : "text-rose-600"}`}>
                                {isProfit ? "+" : ""}{trade.unrealizedPnLPercent}%
                              </div>
                              <div className="text-[10px] font-semibold text-slate-500">
                                {isProfit ? "+" : ""}Rp {trade.unrealizedPnLRupiah?.toLocaleString("id-ID")}
                              </div>
                            </TableCell>
                            <TableCell className="text-xs">
                              <div className="text-emerald-700 font-semibold text-[11px]">TP1: Rp {trade.targetPrice1 || "-"}</div>
                              <div className="text-rose-600 font-semibold text-[11px]">SL: Rp {trade.stopLossPrice}</div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex flex-col items-center gap-1">
                                {trade.isBreakoutConfirmed && (
                                  <span className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full border border-emerald-300 animate-pulse">
                                    <Zap className="w-2.5 h-2.5 fill-emerald-600" /> Breakout Terkonfirmasi!
                                  </span>
                                )}
                                {!trade.isBreakoutConfirmed && trade.confirmationPrice && (
                                  <span className="text-[9px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200" title={trade.confirmationNote || ""}>
                                    Breakout: Rp {trade.confirmationPrice?.toLocaleString("id-ID")}
                                  </span>
                                )}
                                {trade.actionRecommendation === "CUT" ? (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Badge className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] animate-pulse cursor-help">
                                        🔴 {trade.actionTitle || "Cut Segera"}
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs">
                                      <p className="text-xs">{trade.actionReason}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              ) : trade.actionRecommendation === "TP" ? (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] cursor-help">
                                        🎯 {trade.actionTitle || "Siap TP"}
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs">
                                      <p className="text-xs">{trade.actionReason}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              ) : trade.actionRecommendation === "ADD_LOTS" ? (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Badge className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] cursor-help">
                                        🚀 {trade.actionTitle || "+ Muatan"}
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs">
                                      <p className="text-xs">{trade.actionReason}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              ) : isNearSL ? (
                                <Badge className="bg-rose-600 text-white font-bold text-[10px] animate-pulse">
                                  Waspada SL!
                                </Badge>
                              ) : isStagnant ? (
                                <Badge className="bg-amber-100 text-amber-800 border-amber-300 font-bold text-[10px]">
                                  Stagnan (Hari 5+)
                                </Badge>
                              ) : (
                                <Badge className="bg-slate-100 text-slate-700 text-[10px]">
                                  Hold Normal
                                </Badge>
                              )}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openAddLotsModal(trade)}
                                  className="h-7 text-[10px] px-2 border-blue-200 text-blue-700 hover:bg-blue-50 font-bold cursor-pointer"
                                  title="Tambah muatan lot (Pyramiding)"
                                >
                                  + Muatan
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedTradeForRisk(trade);
                                    setNewStopLoss(trade.stopLossPrice);
                                    setNewTp1(trade.targetPrice1 || 0);
                                    setNewTp2(trade.targetPrice2 || 0);
                                    setRiskModalOpen(true);
                                  }}
                                  className="h-7 text-[10px] px-2 border-slate-200 hover:bg-slate-100 cursor-pointer"
                                >
                                  Edit SL/TP
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    const reason = trade.actionRecommendation === "CUT" ? "HIT_SL" : trade.actionRecommendation === "TP" ? "HIT_TP1" : "MANUAL_EXIT";
                                    const fraction = trade.actionRecommendation === "TP" ? 0.5 : 1.0;
                                    openExitModal(trade, reason, fraction);
                                  }}
                                  className="h-7 text-[10px] px-2 border-rose-200 text-rose-700 hover:bg-rose-50 font-bold cursor-pointer"
                                  title="Tutup posisi atau TP sebagian"
                                >
                                  Exit / TP
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* TAB 2: EXECUTION PLANNER & LOT CALCULATOR */}
        {activeTab === "PLANNER" && (
          <div className="space-y-4">
            {/* Guide Banner */}
            <div className="bg-linear-to-r from-amber-50 to-orange-50 p-4 rounded-xl border border-amber-200 text-slate-800 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-start gap-2.5">
                <div className="p-2 bg-amber-100 text-amber-800 rounded-lg shrink-0 mt-0.5">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Panduan Jam Eksekusi Efektif</h4>
                  <p className="text-slate-600 mt-0.5">
                    • <b>Beli Sore (15:45 – 15:59 WIB)</b>: Beli di sesi pre-closing di harga Offer/Close untuk potensi lonjakan besok pagi (T+1).<br />
                    • <b>SWING (09:05 – 10:00 WIB / 15:30 WIB)</b>: Beli saat harga konfirmasi breakout di atas harga entry.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 self-end sm:self-center">
                <Button
                  size="sm"
                  variant={plannerFilter === "ALL" ? "default" : "outline"}
                  onClick={() => setPlannerFilter("ALL")}
                  className="h-7 text-[11px]"
                >
                  Semua
                </Button>
                <Button
                  size="sm"
                  variant={plannerFilter === "SORE" ? "default" : "outline"}
                  onClick={() => setPlannerFilter("SORE")}
                  className="h-7 text-[11px]"
                >
                  Beli Sore (15:45)
                </Button>
                <Button
                  size="sm"
                  variant={plannerFilter === "SWING" ? "default" : "outline"}
                  onClick={() => setPlannerFilter("SWING")}
                  className="h-7 text-[11px]"
                >
                  SWING
                </Button>
              </div>
            </div>

            {/* Candidates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {candidateSignals
                .filter((s) => {
                  if (plannerFilter === "SORE") return s.strategyType === "BSJP" || s.strategyType === "RADAR_CALON_ARA_BELI_SORE";
                  if (plannerFilter === "SWING") return s.strategyType === "SWING";
                  return true;
                })
                .map((sig) => {
                  const isSwing = sig.strategyType === "SWING";
                  const price = sig.confirmationPrice || sig.entryPrice;
                  const lotCalc = calculateRecommendedLots(price, sig.strategyType);

                  // Check if this stock is already owned in openTrades
                  const isAlreadyOwned = openTrades.some((t: any) => t.ticker === sig.ticker);

                  return (
                    <Card key={sig._id || sig.ticker} className="border-slate-200 bg-white shadow-xs flex flex-col justify-between">
                      <CardHeader className="p-4 pb-3 border-b border-slate-100">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-black text-slate-900 tracking-tight">{sig.ticker}</span>
                            <Badge className={isSwing ? "bg-blue-100 text-blue-700 text-[10px]" : "bg-purple-100 text-purple-700 text-[10px]"}>
                              {isSwing ? "SWING" : "Beli Sore"}
                            </Badge>
                          </div>
                          <Badge variant="outline" className="text-[10px] text-slate-500 font-mono">
                            Win Rate ~{isSwing ? "70%" : "68%"}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{sig.stockName || "Sinyal Radar Violet"}</p>
                      </CardHeader>

                      <CardContent className="p-4 space-y-3">
                        {/* Price matrix */}
                        <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-center">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-medium">Beli Acuan</span>
                            <span className="font-bold text-xs text-slate-800">Rp {price?.toLocaleString("id-ID")}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-emerald-600 block font-medium">Target TP1</span>
                            <span className="font-bold text-xs text-emerald-700">Rp {sig.targetPrice1 || Math.round(price * 1.08)}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-rose-500 block font-medium">Batas SL</span>
                            <span className="font-bold text-xs text-rose-600">Rp {sig.stopLoss || Math.round(price * 0.955)}</span>
                          </div>
                        </div>

                        {/* Kalkulator Lot Otomatis */}
                        <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-200/60 space-y-1.5 text-xs">
                          <div className="flex items-center justify-between text-slate-600">
                            <span>Target Porsi Modal:</span>
                            <span className="font-semibold text-slate-800">Rp {lotCalc.budget?.toLocaleString("id-ID")}</span>
                          </div>
                          <div className="flex items-center justify-between text-slate-600">
                            <span>Rekomendasi Beli:</span>
                            <span className="font-black text-emerald-700 text-sm">{lotCalc.lots} Lot</span>
                          </div>
                          <div className="flex items-center justify-between text-slate-600 text-[11px] pt-1 border-t border-emerald-200/50">
                            <span>Estimasi Modal Riil:</span>
                            <span className="font-bold text-slate-800">Rp {lotCalc.cost?.toLocaleString("id-ID")}</span>
                          </div>
                        </div>
                      </CardContent>

                      <CardFooter className="p-4 pt-0">
                        {isAlreadyOwned ? (
                          <Button disabled className="w-full h-8 text-xs bg-slate-100 text-slate-400 border border-slate-200 font-bold">
                            ✓ Saham Sudah Dipegang
                          </Button>
                        ) : isPortfolioFull ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="w-full">
                                  <Button disabled className="w-full h-8 text-xs bg-slate-100 text-slate-400 border border-slate-200 font-bold">
                                    🔴 Skip (3 Slot Penuh)
                                  </Button>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">Portofolio Anda sudah penuh 3 posisi. Tunggu saham aktif selesai sebelum beli lagi.</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : !lotCalc.canBuy ? (
                          <Button disabled className="w-full h-8 text-xs bg-amber-50 text-amber-700 border border-amber-200 font-bold">
                            Kas RDN Kurang (Sisa Rp {account.currentCash?.toLocaleString("id-ID")})
                          </Button>
                        ) : (
                          <Button
                            onClick={() => {
                              handleOpenPosition({
                                ticker: sig.ticker,
                                stockName: sig.stockName,
                                strategyType: isSwing ? "SWING" : "BELI_SORE",
                                entryPrice: price,
                                lots: lotCalc.lots,
                                stopLossPrice: sig.stopLoss || Math.round(price * 0.955),
                                targetPrice1: sig.targetPrice1 || Math.round(price * 1.08),
                                targetPrice2: sig.targetPrice2 || Math.round(price * 1.3),
                                signalId: sig._id
                              });
                            }}
                            className="w-full h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs"
                          >
                            <Zap className="w-3.5 h-3.5 mr-1" />
                            Eksekusi Beli ({lotCalc.lots} Lot)
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  );
                })}
            </div>
          </div>
        )}

        {/* TAB 3: JURNAL RIWAYAT TRADE (CLOSED TRADES) */}
        {activeTab === "JOURNAL" && (
          <Card className="border-slate-200 bg-white shadow-xs">
            <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">
                  Buku Jurnal Riwayat Transaksi Selesai
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Semua transaksi yang sudah ditutup beserta alasan exit (TP, SL, Expired, Emergency Cut).
                </CardDescription>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleExportCSV}
                className="h-8 text-xs border-slate-300 text-slate-700 font-semibold"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" /> Download CSV
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {historyTrades.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <p className="font-bold text-slate-700 text-sm">Belum Ada Riwayat Transaksi Selesai</p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                    Transaksi yang Anda tutup (Take Profit, Stop Loss, atau Emergency Cut) akan tercatat rapi di sini secara permanen di database.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50/80">
                      <TableRow>
                        <TableHead className="w-[100px] text-xs font-bold text-slate-700">Ticker</TableHead>
                        <TableHead className="text-xs font-bold text-slate-700">Strategi</TableHead>
                        <TableHead className="text-xs font-bold text-slate-700">Tgl Beli & Jual</TableHead>
                        <TableHead className="text-right text-xs font-bold text-slate-700">Harga Beli</TableHead>
                        <TableHead className="text-right text-xs font-bold text-slate-700">Harga Jual</TableHead>
                        <TableHead className="text-right text-xs font-bold text-slate-700">Lot</TableHead>
                        <TableHead className="text-right text-xs font-bold text-slate-700">Realized PnL</TableHead>
                        <TableHead className="text-center text-xs font-bold text-slate-700">Alasan Exit</TableHead>
                        <TableHead className="text-xs font-bold text-slate-700">Catatan</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {historyTrades.map((t: any) => {
                        const isWin = (t.realizedPnLRupiah || 0) >= 0;
                        return (
                          <TableRow key={t._id} className="hover:bg-slate-50/60">
                            <TableCell className="font-black text-slate-900 text-xs">
                              {t.ticker}
                            </TableCell>
                            <TableCell>
                              <Badge className={
                                t.strategyType === "SWING"
                                  ? "bg-blue-100 text-blue-700 text-[10px]"
                                  : "bg-purple-100 text-purple-700 text-[10px]"
                              }>
                                {t.strategyType}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-slate-600">
                              <div>{new Date(t.entryDate).toLocaleDateString("id-ID")} → {new Date(t.exitDate).toLocaleDateString("id-ID")}</div>
                              <div className="text-[10px] text-slate-400">{t.holdingDays || 1} Hari Simpan</div>
                            </TableCell>
                            <TableCell className="text-right font-medium text-xs text-slate-800">
                              Rp {t.entryPrice?.toLocaleString("id-ID")}
                            </TableCell>
                            <TableCell className="text-right font-bold text-xs text-slate-900">
                              Rp {t.exitPrice?.toLocaleString("id-ID")}
                            </TableCell>
                            <TableCell className="text-right font-bold text-xs text-slate-800">
                              {t.lots} Lot
                            </TableCell>
                            <TableCell className="text-right text-xs">
                              <div className={`font-black ${isWin ? "text-emerald-600" : "text-rose-600"}`}>
                                {isWin ? "+" : ""}{t.realizedPnLPercent}%
                              </div>
                              <div className="text-[10px] text-slate-500">
                                {isWin ? "+" : ""}Rp {t.realizedPnLRupiah?.toLocaleString("id-ID")}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge className={
                                t.exitReason === "HIT_TP1" || t.exitReason === "HIT_TP2" || t.exitReason === "TRAILING_WIN"
                                  ? "bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px]"
                                  : t.exitReason === "EMERGENCY_CUT"
                                  ? "bg-rose-100 text-rose-700 border-rose-200 font-bold text-[10px]"
                                  : "bg-slate-100 text-slate-700 border-slate-200 text-[10px]"
                              }>
                                {t.exitReason}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-slate-500 max-w-xs truncate">
                              {t.exitNote || "-"}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
            {historyPagination.totalPages > 1 && (
              <CardFooter className="p-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Halaman {historyPagination.page} dari {historyPagination.totalPages} ({historyPagination.total} transaksi)
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={historyPagination.page <= 1}
                    onClick={() => fetchHistory(historyPagination.page - 1)}
                    className="h-7 text-xs"
                  >
                    Sebelumnya
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={historyPagination.page >= historyPagination.totalPages}
                    onClick={() => fetchHistory(historyPagination.page + 1)}
                    className="h-7 text-xs"
                  >
                    Selanjutnya
                  </Button>
                </div>
              </CardFooter>
            )}
          </Card>
        )}
      </div>

      {/* DIALOG 1: CASH MANAGEMENT (DEPOSIT, WITHDRAW, ADJUST) MODAL */}
      <Dialog open={topupOpen} onOpenChange={setTopupOpen}>
        <DialogContent className="bg-white border-slate-200 text-slate-900 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-emerald-600" />
              <span>Kelola Kas RDN (Setor / Tarik / Koreksi)</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Setor kas, tarik/kurangi kas jika salah input, atau langsung sinkronkan saldo ke nominal yang sebenarnya.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Mode Switcher */}
            <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setCashActionType("DEPOSIT");
                  setTopupNote("Setor / Top-up Kas RDN");
                }}
                className={`py-1.5 rounded transition-all cursor-pointer ${
                  cashActionType === "DEPOSIT"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                + Setor Kas
              </button>
              <button
                type="button"
                onClick={() => {
                  setCashActionType("WITHDRAW");
                  setTopupNote("Tarik / Kurangi Kas RDN (Koreksi)");
                }}
                className={`py-1.5 rounded transition-all cursor-pointer ${
                  cashActionType === "WITHDRAW"
                    ? "bg-rose-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                - Kurangi Kas
              </button>
              <button
                type="button"
                onClick={() => {
                  setCashActionType("ADJUST");
                  setTargetCashInput(account.currentCash || 0);
                  setTopupNote("Koreksi Langsung Saldo Kas RDN");
                }}
                className={`py-1.5 rounded transition-all cursor-pointer ${
                  cashActionType === "ADJUST"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                ✏️ Koreksi Saldo
              </button>
            </div>

            {/* TAB 1: DEPOSIT */}
            {cashActionType === "DEPOSIT" && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Pilihan Nominal Cepat:</label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={topupAmount === 2000000 ? "default" : "outline"}
                      onClick={() => setTopupAmount(2000000)}
                      className="h-8 text-xs font-bold cursor-pointer"
                    >
                      + Rp 2 Jt
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={topupAmount === 5000000 ? "default" : "outline"}
                      onClick={() => setTopupAmount(5000000)}
                      className="h-8 text-xs font-bold cursor-pointer"
                    >
                      + Rp 5 Jt
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={topupAmount === 10000000 ? "default" : "outline"}
                      onClick={() => setTopupAmount(10000000)}
                      className="h-8 text-xs font-bold cursor-pointer"
                    >
                      + Rp 10 Jt
                    </Button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Nominal Setor (Rp):</label>
                  <Input
                    type="number"
                    value={topupAmount}
                    onChange={(e) => setTopupAmount(Number(e.target.value))}
                    className="h-9 text-sm font-semibold"
                    placeholder="Contoh: 5000000"
                  />
                </div>

                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-[11px] text-emerald-800 space-y-1">
                  <div className="flex justify-between">
                    <span>Kas RDN Saat Ini:</span>
                    <span className="font-bold">Rp {account.currentCash?.toLocaleString("id-ID")}</span>
                  </div>
                  <div className="flex justify-between border-t border-emerald-200/60 pt-1 font-bold">
                    <span>Kas RDN Setelah Disetor:</span>
                    <span>Rp {((account.currentCash || 0) + Number(topupAmount || 0)).toLocaleString("id-ID")}</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: WITHDRAW / REDUCE CASH */}
            {cashActionType === "WITHDRAW" && (
              <div className="space-y-3">
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-[11px] text-rose-800">
                  ⚠️ <b>Koreksi Pengurangan</b>: Gunakan opsi ini jika sebelumnya Anda salah memasukkan nominal setor terlalu besar, atau uang kas ditarik kembali ke rekening bank.
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Pilihan Cepat Pengurangan:</label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setTopupAmount(2000000)}
                      className="h-8 text-xs font-bold cursor-pointer"
                    >
                      - Rp 2 Jt
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setTopupAmount(5000000)}
                      className="h-8 text-xs font-bold cursor-pointer"
                    >
                      - Rp 5 Jt
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setTopupAmount(account.currentCash || 0)}
                      className="h-8 text-xs font-bold text-rose-700 border-rose-200 cursor-pointer"
                    >
                      Semua Sisa Kas
                    </Button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Nominal Pengurangan / Tarik Kas (Rp):</label>
                  <Input
                    type="number"
                    value={topupAmount}
                    onChange={(e) => setTopupAmount(Number(e.target.value))}
                    className="h-9 text-sm font-semibold text-rose-700"
                    placeholder="Contoh: 5000000"
                    max={account.currentCash}
                  />
                </div>

                <div className="p-3 bg-rose-50 rounded-lg border border-rose-200 text-[11px] text-rose-800 space-y-1">
                  <div className="flex justify-between">
                    <span>Kas RDN Saat Ini:</span>
                    <span className="font-bold">Rp {account.currentCash?.toLocaleString("id-ID")}</span>
                  </div>
                  <div className="flex justify-between border-t border-rose-200/60 pt-1 font-bold">
                    <span>Kas RDN Setelah Dikurangi:</span>
                    <span>Rp {Math.max(0, (account.currentCash || 0) - Number(topupAmount || 0)).toLocaleString("id-ID")}</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: DIRECT ADJUSTMENT */}
            {cashActionType === "ADJUST" && (
              <div className="space-y-3">
                <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-[11px] text-blue-800">
                  💡 <b>Koreksi Langsung</b>: Ketik nominal persis berapa sisa uang kas RDN yang tertera di aplikasi sekuritas Anda saat ini. Saldo akan langsung disinkronkan tanpa perlu menghitung selisih.
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Saldo Kas RDN yang Benar Saat Ini (Rp):</label>
                  <Input
                    type="number"
                    value={targetCashInput}
                    onChange={(e) => setTargetCashInput(Number(e.target.value))}
                    className="h-9 text-sm font-black text-blue-700"
                    placeholder="Contoh: 15400000"
                    min={0}
                  />
                </div>

                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-[11px] text-blue-800 space-y-1">
                  <div className="flex justify-between">
                    <span>Kas RDN Tercatat Saat Ini:</span>
                    <span className="font-semibold">Rp {account.currentCash?.toLocaleString("id-ID")}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Penyesuaian Saldo Baru:</span>
                    <span className="text-blue-900 font-black">Rp {Number(targetCashInput || 0).toLocaleString("id-ID")}</span>
                  </div>
                  <div className="flex justify-between border-t border-blue-200/60 pt-1 text-[10px] text-slate-600">
                    <span>Selisih:</span>
                    <span>
                      {(targetCashInput - (account.currentCash || 0)) >= 0 ? "+" : ""}
                      Rp {(targetCashInput - (account.currentCash || 0)).toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Catatan / Alasan Transaksi (Opsional):</label>
              <Input
                type="text"
                value={topupNote}
                onChange={(e) => setTopupNote(e.target.value)}
                className="h-8 text-xs"
                placeholder="Contoh: Koreksi salah ketik / Dividen cair / Tarik ke rekening"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setTopupOpen(false)} className="h-9 text-xs">
              Batal
            </Button>
            <Button
              size="sm"
              onClick={handleCashSubmit}
              className={`h-9 text-xs font-bold text-white cursor-pointer ${
                cashActionType === "DEPOSIT"
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : cashActionType === "WITHDRAW"
                  ? "bg-rose-600 hover:bg-rose-700"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {cashActionType === "DEPOSIT"
                ? `Konfirmasi Setor (+Rp ${Number(topupAmount || 0).toLocaleString("id-ID")})`
                : cashActionType === "WITHDRAW"
                ? `Konfirmasi Kurangi (-Rp ${Number(topupAmount || 0).toLocaleString("id-ID")})`
                : `Simpan Saldo Kas RDN Rp ${Number(targetCashInput || 0).toLocaleString("id-ID")}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG 2: SET INITIAL CAPITAL MODAL */}
      <Dialog open={capitalOpen} onOpenChange={setCapitalOpen}>
        <DialogContent className="bg-white border-slate-200 text-slate-900 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-blue-600" />
              <span>Pengaturan Modal Akun</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Sesuaikan basis modal trading Anda (default: Rp 20.000.000).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="grid grid-cols-4 gap-2">
              <Button
                type="button"
                size="sm"
                variant={capitalInput === 10000000 ? "default" : "outline"}
                onClick={() => setCapitalInput(10000000)}
                className="h-8 text-xs font-bold"
              >
                10 Jt
              </Button>
              <Button
                type="button"
                size="sm"
                variant={capitalInput === 20000000 ? "default" : "outline"}
                onClick={() => setCapitalInput(20000000)}
                className="h-8 text-xs font-bold"
              >
                20 Jt
              </Button>
              <Button
                type="button"
                size="sm"
                variant={capitalInput === 50000000 ? "default" : "outline"}
                onClick={() => setCapitalInput(50000000)}
                className="h-8 text-xs font-bold"
              >
                50 Jt
              </Button>
              <Button
                type="button"
                size="sm"
                variant={capitalInput === 100000000 ? "default" : "outline"}
                onClick={() => setCapitalInput(100000000)}
                className="h-8 text-xs font-bold"
              >
                100 Jt
              </Button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Nominal Modal Pokok (Rp):</label>
              <Input
                type="number"
                value={capitalInput}
                onChange={(e) => setCapitalInput(Number(e.target.value))}
                className="h-9 text-sm font-semibold"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setCapitalOpen(false)} className="h-9 text-xs">
              Batal
            </Button>
            <Button size="sm" onClick={handleSetCapitalSubmit} className="h-9 text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold">
              Simpan Modal Akun
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG 3: MANUAL ENTRY MODAL */}
      <Dialog open={manualEntryOpen} onOpenChange={setManualEntryOpen}>
        <DialogContent className="bg-white border-slate-200 text-slate-900 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-indigo-600" />
              <span>Catat Entry Beli Saham Baru</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Catat pembelian saham secara manual. Dana akan otomatis dipotong dari Kas RDN.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Kode Saham:</label>
                <Input
                  type="text"
                  value={manualForm.ticker}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase();
                    setManualForm({ ...manualForm, ticker: val });
                  }}
                  className="h-8 uppercase font-bold"
                  placeholder="Contoh: BBRI"
                  maxLength={6}
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Strategi:</label>
                <Select
                  value={manualForm.strategyType}
                  onValueChange={(val) => {
                    setManualForm({ ...manualForm, strategyType: val });
                  }}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Pilih Strategi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SWING">SWING (Hold 1-10D)</SelectItem>
                    <SelectItem value="BELI_SORE">Beli Sore (Hold T+1)</SelectItem>
                    <SelectItem value="MANUAL">Manual / Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Harga Beli (Rp):</label>
                <Input
                  type="number"
                  value={manualForm.entryPrice || ""}
                  onChange={(e) => {
                    const ep = Number(e.target.value);
                    setManualForm({
                      ...manualForm,
                      entryPrice: ep
                    });
                  }}
                  className="h-8 font-semibold"
                  placeholder="Harga beli"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Jumlah Lot:</label>
                <Input
                  type="number"
                  step="any"
                  value={manualForm.lots || ""}
                  onChange={(e) =>
                    setManualForm({
                      ...manualForm,
                      lots: e.target.value === "" ? 0 : parseFloat(e.target.value.replace(",", "."))
                    })
                  }
                  className="h-8 font-semibold"
                  placeholder="Contoh: 10 atau 12.5"
                  min={0.01}
                />
              </div>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Estimasi Modal Terpakai:</span>
                <span className="font-bold text-slate-900">
                  Rp {((manualForm.entryPrice || 0) * (manualForm.lots || 0) * 100).toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Kas RDN Tersedia:</span>
                <span className="font-semibold text-slate-700">
                  Rp {account.currentCash?.toLocaleString("id-ID")}
                </span>
              </div>
            </div>

            {/* Smart Server-side Analysis Banner */}
            <div className="p-3 bg-gradient-to-r from-indigo-50/90 via-purple-50/80 to-indigo-50/90 rounded-xl border border-indigo-200/80 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5 text-[11px] leading-relaxed">
                <span className="font-bold text-indigo-950 block">Otomatisasi Analisis Risiko & Target</span>
                <span className="text-indigo-800">
                  Anda tidak perlu menghitung SL & TP. Saat disimpan, <strong>sistem server langsung menganalisis level support, fraksi harga IDX, dan target profit terbaik</strong> secara otomatis untuk disimpan ke database.
                </span>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setManualEntryOpen(false)} className="h-8 text-xs">
              Batal
            </Button>
            <Button
              size="sm"
              disabled={!manualForm.ticker || manualForm.ticker.trim().length < 3 || !manualForm.entryPrice || !manualForm.lots}
              onClick={() =>
                handleOpenPosition({
                  ticker: manualForm.ticker.trim().toUpperCase(),
                  strategyType: manualForm.strategyType,
                  entryPrice: Number(manualForm.entryPrice),
                  lots: Number(manualForm.lots)
                })
              }
              className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
            >
              Simpan & Beli
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG 4: EDIT SL/TP MODAL */}
      <Dialog open={riskModalOpen} onOpenChange={setRiskModalOpen}>
        <DialogContent className="bg-white border-slate-200 text-slate-900 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-slate-700" />
              <span>Sesuaikan Stop Loss & Target {selectedTradeForRisk?.ticker}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Ubah level Stop Loss (misal proteksi Trailing BEP) atau target TP.
            </DialogDescription>
          </DialogHeader>

          {selectedTradeForRisk && (
            <div className="space-y-3 py-2 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Harga Beli:</span>
                  <span className="font-bold text-slate-900">Rp {selectedTradeForRisk.entryPrice}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Harga Saat Ini:</span>
                  <span className="font-black text-blue-600">Rp {selectedTradeForRisk.currentPrice}</span>
                </div>
              </div>

              {/* Trailing BEP Quick Button */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setNewStopLoss(selectedTradeForRisk.entryPrice)}
                className="w-full text-xs font-bold border-blue-200 text-blue-700 bg-blue-50/50 hover:bg-blue-100 h-8"
              >
                <ShieldAlert className="w-3.5 h-3.5 mr-1 text-blue-600" />
                Kunci BEP: Naikkan SL ke Harga Beli (Rp {selectedTradeForRisk.entryPrice})
              </Button>

              <div className="space-y-1">
                <label className="font-bold text-rose-600">Stop Loss (SL) Baru:</label>
                <Input
                  type="number"
                  value={newStopLoss}
                  onChange={(e) => setNewStopLoss(Number(e.target.value))}
                  className="h-8 border-rose-200 text-rose-700 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-emerald-600">Target TP1:</label>
                  <Input
                    type="number"
                    value={newTp1}
                    onChange={(e) => setNewTp1(Number(e.target.value))}
                    className="h-8 border-emerald-200 text-emerald-700 font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-indigo-600">Target TP2:</label>
                  <Input
                    type="number"
                    value={newTp2}
                    onChange={(e) => setNewTp2(Number(e.target.value))}
                    className="h-8 border-indigo-200 text-indigo-700 font-semibold"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setRiskModalOpen(false)} className="h-8 text-xs">
              Batal
            </Button>
            <Button size="sm" onClick={handleUpdateRisk} className="h-8 text-xs bg-slate-900 hover:bg-slate-800 text-white font-bold">
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG 5: EMERGENCY EXIT / MANUAL CLOSE / PARTIAL TP MODAL */}
      <Dialog open={exitModalOpen} onOpenChange={setExitModalOpen}>
        <DialogContent className="bg-white border-slate-200 text-slate-900 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900">
              {selectedTradeForExit && lotsToCloseInput < selectedTradeForExit.lots ? (
                <>
                  <Target className="w-5 h-5 text-emerald-600" />
                  <span>Amankan TP Sebagian: {selectedTradeForExit?.ticker}</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-5 h-5 text-rose-600" />
                  <span>Tutup Posisi / Emergency Cut: {selectedTradeForExit?.ticker}</span>
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Jual posisi saham (bisa jual sebagian lot untuk kunci cuan atau tutup total). Uang hasil penjualan langsung kembali ke Kas RDN.
            </DialogDescription>
          </DialogHeader>

          {selectedTradeForExit && (() => {
            const totalLots = selectedTradeForExit.lots || 0;
            const validLotsToClose = Math.min(Math.max(0.01, lotsToCloseInput || 0.01), totalLots);
            const isPartial = validLotsToClose < totalLots;
            const remainingLots = Number((totalLots - validLotsToClose).toFixed(4));
            const capitalFraction = totalLots > 0 ? Math.round((validLotsToClose / totalLots) * selectedTradeForExit.totalCapitalUsed) : 0;
            const returnCash = Math.round(exitPriceInput * validLotsToClose * 100);
            const realizedPnLRupiah = returnCash - capitalFraction;
            const pnlPercent = selectedTradeForExit.entryPrice > 0 ? ((exitPriceInput - selectedTradeForExit.entryPrice) / selectedTradeForExit.entryPrice) * 100 : 0;

            const p25 = Number((totalLots * 0.25).toFixed(2));
            const p50 = Number((totalLots * 0.5).toFixed(2));
            const p75 = Number((totalLots * 0.75).toFixed(2));

            return (
              <div className="space-y-3.5 py-2 text-xs">
                {/* Posisi Terkini */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Posisi Berjalan:</span>
                    <span className="font-black text-slate-900 text-sm">
                      {selectedTradeForExit.ticker} - {totalLots} Lot @ Rp {selectedTradeForExit.entryPrice}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-500">Harga Terakhir / Pasar:</span>
                    <span className="font-bold text-blue-600">
                      Rp {(selectedTradeForExit.currentPrice || selectedTradeForExit.entryPrice)?.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-500">Nilai Pasar (Market Value):</span>
                    <span className="font-bold text-slate-900">
                      Rp {(selectedTradeForExit.currentMarketValue || totalLots * (selectedTradeForExit.currentPrice || selectedTradeForExit.entryPrice) * 100)?.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-500">Potential PnL (Floating):</span>
                    <span className={`font-bold ${selectedTradeForExit.unrealizedPnLRupiah >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                      {selectedTradeForExit.unrealizedPnLRupiah >= 0 ? "+" : ""}Rp {selectedTradeForExit.unrealizedPnLRupiah?.toLocaleString("id-ID")} ({selectedTradeForExit.unrealizedPnLPercent >= 0 ? "+" : ""}{selectedTradeForExit.unrealizedPnLPercent}%)
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] pt-1 border-t border-slate-200/60">
                    <span className="text-slate-500">Total Modal Posisi Ini:</span>
                    <span className="font-semibold text-slate-700">
                      Rp {selectedTradeForExit.totalCapitalUsed?.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>

                {/* Input Jumlah Lot yang Dijual */}
                <div className="space-y-2 p-3 bg-slate-50/70 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800">
                      Jumlah Lot yang Ingin Dijual:
                    </label>
                    <span className="text-[11px] font-bold text-slate-500">
                      Tersedia: {totalLots} Lot
                    </span>
                  </div>

                  {/* Preset Buttons */}
                  <div className="grid grid-cols-4 gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setLotsToCloseInput(p25);
                        setExitReasonInput("PARTIAL_TP");
                      }}
                      className={`h-7 rounded text-[11px] font-bold border transition-all ${
                        validLotsToClose === p25 && isPartial
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100 cursor-pointer"
                      }`}
                    >
                      25% ({p25}L)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLotsToCloseInput(p50);
                        setExitReasonInput("HIT_TP1");
                      }}
                      className={`h-7 rounded text-[11px] font-bold border transition-all ${
                        validLotsToClose === p50 && isPartial
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100 cursor-pointer"
                      }`}
                    >
                      50% TP1 ({p50}L)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLotsToCloseInput(p75);
                        setExitReasonInput("PARTIAL_TP");
                      }}
                      className={`h-7 rounded text-[11px] font-bold border transition-all ${
                        validLotsToClose === p75 && isPartial
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100 cursor-pointer"
                      }`}
                    >
                      75% ({p75}L)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLotsToCloseInput(totalLots);
                        setExitReasonInput("MANUAL_EXIT");
                      }}
                      className={`h-7 rounded text-[11px] font-bold border transition-all ${
                        !isPartial
                          ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100 cursor-pointer"
                      }`}
                    >
                      Semua (100%)
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="any"
                      value={lotsToCloseInput}
                      onChange={(e) =>
                        setLotsToCloseInput(e.target.value === "" ? 0 : parseFloat(e.target.value.replace(",", ".")))
                      }
                      className="h-8 font-black text-sm text-slate-900"
                      min={0.01}
                      max={totalLots}
                      placeholder="Bisa angka koma (misal 12.5)"
                    />
                    <span className="text-xs text-slate-500 font-semibold whitespace-nowrap">Lot</span>
                  </div>

                  {/* Status Banner */}
                  {isPartial ? (
                    <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px] text-emerald-800 flex items-start gap-2">
                      <Target className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Mode TP Sebagian Aktif:</span> Menjual{" "}
                        <span className="font-bold text-emerald-950">{validLotsToClose} lot</span>. Sisa{" "}
                        <span className="font-bold text-emerald-950">{remainingLots} lot</span> tetap aktif berjalan di slot portofolio untuk mengejar target selanjutnya!
                      </div>
                    </div>
                  ) : (
                    <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-[11px] text-rose-800 flex items-start gap-2">
                      <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Mode Tutup Total (100%):</span> Seluruh{" "}
                        <span className="font-bold text-rose-950">{totalLots} lot</span> akan dijual dan slot portofolio akan dikosongkan.
                      </div>
                    </div>
                  )}
                </div>

                {/* Input Harga Jual */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Harga Jual Keluar (Rp):</label>
                    <Input
                      type="number"
                      value={exitPriceInput}
                      onChange={(e) => setExitPriceInput(Number(e.target.value))}
                      className="h-8 font-black text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Alasan Transaksi:</label>
                    <Select value={exitReasonInput} onValueChange={setExitReasonInput}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Pilih Alasan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PARTIAL_TP">⚡ TP Sebagian (Kunci Profit)</SelectItem>
                        <SelectItem value="HIT_TP1">🎯 Hit TP1 (Amankan Target 1)</SelectItem>
                        <SelectItem value="HIT_TP2">🚀 Hit TP2 (Target Maksimal)</SelectItem>
                        <SelectItem value="MANUAL_EXIT">💼 Manual Exit (Tutup Mandiri)</SelectItem>
                        <SelectItem value="EMERGENCY_CUT">⚠️ Emergency Cut (Ada Berita Buruk)</SelectItem>
                        <SelectItem value="HIT_SL">🛑 Hit SL (Batas Kerugian)</SelectItem>
                        <SelectItem value="EXPIRED">⏱️ Expired (Time-Stop Batas Waktu)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Catatan Trader (Opsional):</label>
                  <Input
                    type="text"
                    value={exitNoteInput}
                    onChange={(e) => setExitNoteInput(e.target.value)}
                    className="h-8 text-xs"
                    placeholder="Contoh: TP 50% di resisten, sisa pasang trailing stop BEP"
                  />
                </div>

                {/* Real-time Exit Proceeds Preview */}
                {exitPriceInput > 0 && (
                  <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 text-xs space-y-1.5">
                    <div className="flex justify-between text-slate-600">
                      <span>Dana Langsung Masuk ke Kas RDN:</span>
                      <span className="font-black text-slate-900 text-sm">
                        Rp {returnCash.toLocaleString("id-ID")}
                      </span>
                    </div>
                    <div className="flex justify-between font-bold pt-1.5 border-t border-slate-200">
                      <span>Realisasi PnL ({validLotsToClose} Lot):</span>
                      <span className={exitPriceInput >= selectedTradeForExit.entryPrice ? "text-emerald-600" : "text-rose-600"}>
                        {exitPriceInput >= selectedTradeForExit.entryPrice ? "+" : ""}
                        Rp {realizedPnLRupiah.toLocaleString("id-ID")} ({pnlPercent.toFixed(2)}%)
                      </span>
                    </div>
                    {isPartial && (
                      <div className="flex justify-between text-slate-500 text-[11px] pt-1 border-t border-dashed border-slate-200">
                        <span>Sisa Saham di Slot:</span>
                        <span className="font-semibold text-slate-700">
                          {remainingLots} Lot (Modal Rp {((totalLots - validLotsToClose) * selectedTradeForExit.entryPrice * 100).toLocaleString("id-ID")})
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <DialogFooter className="gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => setExitModalOpen(false)} className="h-8 text-xs">
                    Batal
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleClosePosition}
                    className={`h-8 text-xs font-bold text-white shadow-xs cursor-pointer ${
                      isPartial ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"
                    }`}
                  >
                    {isPartial ? `Eksekusi TP Sebagian (${validLotsToClose} Lot)` : `Eksekusi Tutup Total (${totalLots} Lot)`}
                  </Button>
                </DialogFooter>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* DIALOG 6: TAMBAH MUATAN (PYRAMIDING MODAL) */}
      <Dialog open={addLotsModalOpen} onOpenChange={setAddLotsModalOpen}>
        <DialogContent className="bg-white border-slate-200 text-slate-900 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-700">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <span>Tambah Muatan (+Pyramiding): {selectedTradeForAddLots?.ticker}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Tambah porsi lot pada saham yang sedang tren bullish. Sistem akan menghitung harga rata-rata (new average) baru secara otomatis.
            </DialogDescription>
          </DialogHeader>

          {selectedTradeForAddLots && (
            <div className="space-y-3 py-2 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Posisi Saat Ini:</span>
                  <span className="font-bold text-slate-900">
                    {selectedTradeForAddLots.lots} Lot @ Rp {selectedTradeForAddLots.entryPrice?.toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Harga Pasar Terkini:</span>
                  <span className="font-bold text-blue-600">
                    Rp {(selectedTradeForAddLots.currentPrice || selectedTradeForAddLots.entryPrice)?.toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Nilai Pasar (Market Value):</span>
                  <span className="font-bold text-slate-900">
                    Rp {(selectedTradeForAddLots.currentMarketValue || selectedTradeForAddLots.lots * (selectedTradeForAddLots.currentPrice || selectedTradeForAddLots.entryPrice) * 100)?.toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Potential PnL (Floating):</span>
                  <span className={`font-bold ${selectedTradeForAddLots.unrealizedPnLRupiah >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                    {selectedTradeForAddLots.unrealizedPnLRupiah >= 0 ? "+" : ""}Rp {selectedTradeForAddLots.unrealizedPnLRupiah?.toLocaleString("id-ID")} ({selectedTradeForAddLots.unrealizedPnLPercent >= 0 ? "+" : ""}{selectedTradeForAddLots.unrealizedPnLPercent}%)
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-200/60 pt-1">
                  <span className="text-slate-500">Kas RDN Tersedia:</span>
                  <span className="font-bold text-emerald-600">
                    Rp {account.currentCash?.toLocaleString("id-ID")}
                  </span>
                </div>
                {selectedTradeForAddLots.isBreakoutConfirmed && (
                  <div className="flex justify-between items-center bg-emerald-50 px-2.5 py-1.5 rounded-md border border-emerald-200">
                    <span className="text-emerald-800 font-bold flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" /> Konfirmasi Breakout:
                    </span>
                    <span className="font-black text-emerald-700">Terkonfirmasi Valid 🚀</span>
                  </div>
                )}
                {!selectedTradeForAddLots.isBreakoutConfirmed && selectedTradeForAddLots.confirmationPrice && (
                  <div className="flex justify-between items-center bg-indigo-50 px-2.5 py-1.5 rounded-md border border-indigo-200">
                    <span className="text-indigo-800 font-semibold flex items-center gap-1">
                      <Target className="w-3.5 h-3.5 text-indigo-600" /> Level Breakout:
                    </span>
                    <span className="font-bold text-indigo-700">
                      Rp {selectedTradeForAddLots.confirmationPrice?.toLocaleString("id-ID")} ({selectedTradeForAddLots.confirmationTriggerPct > 0 ? "+" : ""}{selectedTradeForAddLots.confirmationTriggerPct}%)
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Jumlah Lot Tambahan:</label>
                  <Input
                    type="number"
                    step="any"
                    value={additionalLotsInput}
                    onChange={(e) =>
                      setAdditionalLotsInput(e.target.value === "" ? 0 : parseFloat(e.target.value.replace(",", ".")))
                    }
                    className="h-8 font-black text-sm"
                    min={0.01}
                    placeholder="Bisa koma (misal 5.5)"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Harga Beli Tambahan (Rp):</label>
                  <Input
                    type="number"
                    value={additionalPriceInput}
                    onChange={(e) => setAdditionalPriceInput(Number(e.target.value))}
                    className="h-8 font-semibold text-sm"
                  />
                </div>
              </div>

              {/* Real-time Calculation of New Average */}
              {additionalLotsInput > 0 && additionalPriceInput > 0 && (
                <div className="p-3 bg-blue-50/70 rounded-lg border border-blue-200 text-xs space-y-1.5">
                  <div className="flex justify-between text-slate-600">
                    <span>Tambahan Modal Dibutuhkan:</span>
                    <span className="font-bold text-slate-900">
                      Rp {(additionalLotsInput * additionalPriceInput * 100).toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Total Lot Baru:</span>
                    <span className="font-bold text-slate-900">
                      {selectedTradeForAddLots.lots + additionalLotsInput} Lot
                    </span>
                  </div>
                  <div className="flex justify-between font-black text-blue-900 pt-1 border-t border-blue-200/60 text-sm">
                    <span>Harga Rata-Rata (New Average):</span>
                    <span>
                      Rp {Math.round(
                        (selectedTradeForAddLots.totalCapitalUsed + (additionalLotsInput * additionalPriceInput * 100)) /
                        ((selectedTradeForAddLots.lots + additionalLotsInput) * 100)
                      ).toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="p-2 bg-blue-100/80 rounded-md border border-blue-200 text-[11px] text-blue-900 font-medium">
                    ℹ️ <strong>Konfirmasi:</strong> Setelah transaksi disimpan, harga beli saham ini akan otomatis menjadi <strong>Harga Average Baru</strong> di portofolio dan database.
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="font-bold text-rose-600">Stop Loss (SL) Penyesuaian Baru:</label>
                <Input
                  type="number"
                  value={additionalStopLossInput}
                  onChange={(e) => setAdditionalStopLossInput(Number(e.target.value))}
                  className="h-8 border-rose-200 text-rose-700 font-semibold"
                  placeholder="Naikkan ke harga average lama untuk kunci modal"
                />
                <p className="text-[10px] text-slate-400">
                  💡 Tips: Naikkan SL ke harga beli lama (Rp {selectedTradeForAddLots.entryPrice}) agar modal awal tetap terlindungi BEP.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setAddLotsModalOpen(false)} className="h-8 text-xs">
              Batal
            </Button>
            <Button
              size="sm"
              onClick={handleAddLotsSubmit}
              className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold"
            >
              Konfirmasi Tambah Muatan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
