"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import {

  AlertTriangle,
  RefreshCw,

  Play,
  CheckCircle,
  Clock,
  Shield,
  Zap,
  LogOut,
  User as UserIcon,
  SlidersHorizontal,
  ChevronRight,
  BarChart3,
  Radar,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import MetricSummaryCards from "@/components/dashboard/MetricSummaryCards";
import OverviewMonthly from "@/components/dashboard/OverviewMonthly";
import OverViewYearly from "@/components/dashboard/OverViewYearly";
import OverviewStatistics from "@/components/dashboard/OverviewStatistics";
import AraPotentialCard from "@/components/dashboard/AraPotentialCard";
import AraTargetsCard from "@/components/dashboard/AraTargetsCard";
import ArbTargetsCard from "@/components/dashboard/ArbTargetsCard";
import ForeignAccumulationCard from "@/components/dashboard/ForeignAccumulationCard";
import ForeignDistributionCard from "@/components/dashboard/ForeignDistributionCard";
import GrowthLeadersCard from "@/components/dashboard/GrowthLeadersCard";
import LoseLeadersCard from "@/components/dashboard/LoseLeadersCard";
import AraPatternsCard from "@/components/dashboard/AraPatternsCard";
import SignalMonitoringCard from "@/components/dashboard/SignalMonitoringCard";
import SearchTickers from "@/components/SearchTickers";

// Default Backtest/Simulation metrics as a fallback when backend is disconnected
const BACKTEST_FALLBACK = {
  unified: {
    initialCapital: 100000000,
    finalEquity: 195277000,
    totalReturn: 95.28,
    cagr: 69.74,
    maxDrawdown: 5.48,
    maxDrawdownDurationDays: 104,
    recoveryFactor: 9.95,
    calmarRatio: 12.72,
    maxConcurrentPositions: 15,
    maxCapitalExposure: 135000000,
    totalSkipped: 4,
    trades: 1343,
  },
  strategies: [
    {
      id: "SWING_DEFAULT",
      name: "Swing Trade 4-in-1",
      type: "Return Engine",
      color: "#3b82f6",
      return: 44.57,
      cagr: 33.91,
      maxDd: 5.37,
      calmar: 6.11,
      winRate: 57.3,
      trades: 454,
      avgWin: 4.45,
      avgLoss: -3.66,
      profitFactor: 1.63,
      sizing: "10% per posisi",
      roles: "Mengejar pertumbuhan modal jangka menengah",
    },
    {
      id: "BSJP_DEFAULT",
      name: "BSJP (Beli Sore Jual Pagi)",
      type: "Capital Stabilizer",
      color: "#10b981",
      return: 37.11,
      cagr: 28.55,
      maxDd: 1.09,
      calmar: 29.43,
      winRate: 62.9,
      trades: 455,
      avgWin: 2.43,
      avgLoss: -1.91,
      profitFactor: 2.15,
      sizing: "10% per posisi",
      roles: "Meredam gejolak portfolio dengan cuan harian konsisten",
    },
    {
      id: "ARA_HUNTER_DEFAULT",
      name: "ARA Hunter",
      type: "Radar Calon ARA",
      color: "#94a3b8",
      return: 29.05,
      cagr: 22.34,
      maxDd: 5.08,
      calmar: 4.98,
      winRate: 52.5,
      trades: 438,
      avgWin: 4.50,
      avgLoss: -3.58,
      profitFactor: 1.39,
      sizing: "Nonaktif (Digantikan Radar Calon ARA)",
      roles: "Dinonaktifkan: Deteksi lonjakan ARA kini terpusat pada Radar Calon ARA & Beli Sore",
    }
  ],
  recentSignals: [
    { ticker: "BBTN", strategy: "BSJP_DEFAULT", setup: "MOMENTUM", entry: 1255, tp1: 1280, tp2: 1315, sl: 1230, score: 100, status: "ACTIVE", date: "2026-09-04" },
    { ticker: "ADRO", strategy: "BSJP_DEFAULT", setup: "MOMENTUM", entry: 2740, tp1: 2790, tp2: 2850, sl: 2680, score: 100, status: "ACTIVE", date: "2026-09-04" },
    { ticker: "ABMM", strategy: "SWING_DEFAULT", setup: "BREAKOUT", entry: 2850, tp1: 2980, tp2: 3160, sl: 2720, score: 100, status: "ACTIVE", date: "2026-09-04" },
    { ticker: "BMRI", strategy: "SWING_DEFAULT", setup: "BREAKOUT", entry: 4460, tp1: 4660, tp2: 4950, sl: 4260, score: 100, status: "ACTIVE", date: "2026-09-04" },
    { ticker: "BTPS", strategy: "SWING_DEFAULT", setup: "BREAKOUT", entry: 1010, tp1: 1055, tp2: 1120, sl: 965, score: 100, status: "ACTIVE", date: "2026-09-04" },
  ],
  equityCurve: [
    { day: "Hari 0", equity: 100 },
    { day: "Hari 30", equity: 105.4 },
    { day: "Hari 60", equity: 108.2 },
    { day: "Hari 90", equity: 112.5 },
    { day: "Hari 120", equity: 110.8 },
    { day: "Hari 150", equity: 115.1 },
    { day: "Hari 180", equity: 122.3 },
    { day: "Hari 210", equity: 131.6 },
    { day: "Hari 240", equity: 142.0 },
    { day: "Hari 270", equity: 138.4 },
    { day: "Hari 300", equity: 154.9 },
    { day: "Hari 325", equity: 195.27 }
  ],
  // Radar detailed time-based fallbacks
  marketMoversAra: {
    "1D": [
      { ticker: "MEDC", status: "ARA_LOCKED", return1d: 25.0, turnover: 32000000000, foreignNet: 9200000000 },
      { ticker: "PTBA", status: "ARA_POTENTIAL", return1d: 14.5, turnover: 12000000000, foreignNet: 4500000000 },
      { ticker: "BRPT", status: "ARA_POTENTIAL", return1d: 12.8, turnover: 18000000000, foreignNet: 1200000000 },
      { ticker: "ADRO", status: "BARGAIN_HUNTING", return1d: 3.2, turnover: 25000000000, foreignNet: 6400000000 },
      { ticker: "HRUM", status: "ARA_POTENTIAL", return1d: 8.5, turnover: 9000000000, foreignNet: 1100000000 }
    ],
    "1W": [
      { ticker: "ANTM", status: "ARA_LOCKED", return1d: 32.5, turnover: 145000000000, foreignNet: 28000000000 },
      { ticker: "TINS", status: "ARA_POTENTIAL", return1d: 18.2, turnover: 55000000000, foreignNet: 14500000000 },
      { ticker: "VALE", status: "ARA_POTENTIAL", return1d: 15.4, turnover: 98000000000, foreignNet: 18000000000 },
      { ticker: "MBMA", status: "ARA_POTENTIAL", return1d: 11.2, turnover: 42000000000, foreignNet: 6200000000 },
      { ticker: "MDKA", status: "ARA_POTENTIAL", return1d: 9.8, turnover: 84000000000, foreignNet: 11200000000 }
    ],
    "3M": [
      { ticker: "AKRA", status: "ARA_POTENTIAL", return1d: 45.2, turnover: 420000000000, foreignNet: 84000000000 },
      { ticker: "PGAS", status: "ARA_POTENTIAL", return1d: 32.4, turnover: 210000000000, foreignNet: 42000000000 },
      { ticker: "ELSA", status: "ARA_POTENTIAL", return1d: 28.5, turnover: 380000000000, foreignNet: 52000000000 },
      { ticker: "WINS", status: "ARA_POTENTIAL", return1d: 22.1, turnover: 120000000000, foreignNet: 18000000000 },
      { ticker: "PSSI", status: "ARA_POTENTIAL", return1d: 18.4, turnover: 95000000000, foreignNet: 11000000000 }
    ],
    "YTD": [
      { ticker: "EXCL", status: "ARA_POTENTIAL", return1d: 85.4, turnover: 950000000000, foreignNet: 195000000000 },
      { ticker: "ISAT", status: "ARA_LOCKED", return1d: 74.2, turnover: 820000000000, foreignNet: 120000000000 },
      { ticker: "TLKM", status: "ARA_POTENTIAL", return1d: 54.2, turnover: 450000000000, foreignNet: 88000000000 },
      { ticker: "TOWR", status: "ARA_POTENTIAL", return1d: 48.5, turnover: 320000000000, foreignNet: 64000000000 },
      { ticker: "TBIG", status: "ARA_POTENTIAL", return1d: 42.1, turnover: 280000000000, foreignNet: 45000000000 }
    ]
  },
  marketMoversArb: {
    "1D": [
      { ticker: "GOTO", status: "ARB_LOCKED", return1d: -35.0, turnover: 18000000000, foreignNet: -2100000000 },
      { ticker: "ASII", status: "PANIC_DUMP", return1d: -5.1, turnover: 45000000000, foreignNet: -18000000000 },
      { ticker: "ACES", status: "PANIC_DUMP", return1d: -4.8, turnover: 8500000000, foreignNet: -3200000000 },
      { ticker: "BBRI", status: "BARGAIN_HUNTING", return1d: -2.4, turnover: 85000000000, foreignNet: 24000000000 },
      { ticker: "BBYB", status: "ARB_LOCKED", return1d: -9.5, turnover: 4200000000, foreignNet: -1500000000 }
    ],
    "1W": [
      { ticker: "BUKA", status: "ARB_LOCKED", return1d: -15.4, turnover: 55000000000, foreignNet: -8500000000 },
      { ticker: "SCMA", status: "PANIC_DUMP", return1d: -8.2, turnover: 145000000000, foreignNet: -35000000000 },
      { ticker: "EMTK", status: "PANIC_DUMP", return1d: -6.5, turnover: 32000000000, foreignNet: -9200000000 },
      { ticker: "MPMX", status: "ARB_LOCKED", return1d: -5.4, turnover: 15000000000, foreignNet: -2100000000 },
      { ticker: "UNTR", status: "PANIC_DUMP", return1d: -4.2, turnover: 98000000000, foreignNet: -14500000000 }
    ],
    "3M": [
      { ticker: "INDF", status: "ARB_LOCKED", return1d: -42.1, turnover: 195000000000, foreignNet: -24000000000 },
      { ticker: "ICBP", status: "PANIC_DUMP", return1d: -12.4, turnover: 480000000000, foreignNet: -98000000000 },
      { ticker: "MYOR", status: "PANIC_DUMP", return1d: -10.2, turnover: 110000000000, foreignNet: -22000000000 },
      { ticker: "ROTI", status: "ARB_LOCKED", return1d: -8.5, turnover: 45000000000, foreignNet: -5400000000 },
      { ticker: "GOOD", status: "PANIC_DUMP", return1d: -7.2, turnover: 32000000000, foreignNet: -3800000000 }
    ],
    "YTD": [
      { ticker: "ASRI", status: "ARB_LOCKED", return1d: -78.2, turnover: 450000000000, foreignNet: -62000000000 },
      { ticker: "BSDE", status: "PANIC_DUMP", return1d: -18.2, turnover: 1.2 * 1000000000000, foreignNet: -240000000000 },
      { ticker: "CTRA", status: "PANIC_DUMP", return1d: -15.4, turnover: 250000000000, foreignNet: -45000000000 },
      { ticker: "PWON", status: "ARB_LOCKED", return1d: -12.5, turnover: 180000000000, foreignNet: -32000000000 },
      { ticker: "SMRA", status: "PANIC_DUMP", return1d: -10.2, turnover: 145000000000, foreignNet: -21000000000 }
    ]
  },
  foreignAccumulation: {
    "1D": [
      { ticker: "BBCA", buy1d: 45000000000, flow5d: 45000000000, flow20d: 380000000000, ratio: 42.5, tier: "SUPER_ACCUMULATION" },
      { ticker: "BMRI", buy1d: 28000000000, flow5d: 28000000000, flow20d: 195000000000, ratio: 38.2, tier: "SUPER_ACCUMULATION" },
      { ticker: "BBNI", buy1d: 12500000000, flow5d: 12500000000, flow20d: 85000000000, ratio: 31.4, tier: "STRONG_ACCUMULATION" },
      { ticker: "BBRI", buy1d: 9200000000, flow5d: 9200000000, flow20d: 65000000000, ratio: 28.5, tier: "STRONG_ACCUMULATION" },
      { ticker: "BRIS", buy1d: 4500000000, flow5d: 4500000000, flow20d: 32000000000, ratio: 22.1, tier: "MODERATE_ACCUMULATION" }
    ],
    "1W": [
      { ticker: "TLKM", buy1d: 24000000000, flow5d: 125000000000, flow20d: 380000000000, ratio: 42.5, tier: "SUPER_ACCUMULATION" },
      { ticker: "ISAT", buy1d: 18000000000, flow5d: 78000000000, flow20d: 195000000000, ratio: 38.2, tier: "SUPER_ACCUMULATION" },
      { ticker: "EXCL", buy1d: 9200000000, flow5d: 42000000000, flow20d: 98000000000, ratio: 29.5, tier: "STRONG_ACCUMULATION" },
      { ticker: "TOWR", buy1d: 6800000000, flow5d: 31000000000, flow20d: 72000000000, ratio: 24.1, tier: "STRONG_ACCUMULATION" },
      { ticker: "TBIG", buy1d: 3500000000, flow5d: 18000000000, flow20d: 45000000000, ratio: 18.4, tier: "MODERATE_ACCUMULATION" }
    ],
    "3M": [
      { ticker: "ASII", buy1d: 12000000000, flow5d: 95000000000, flow20d: 1.1 * 1000000000000, ratio: 45.2, tier: "SUPER_ACCUMULATION" },
      { ticker: "UNTR", buy1d: 9500000000, flow5d: 68000000000, flow20d: 780000000000, ratio: 39.8, tier: "SUPER_ACCUMULATION" },
      { ticker: "INDF", buy1d: 7400000000, flow5d: 45000000000, flow20d: 420000000000, ratio: 32.1, tier: "STRONG_ACCUMULATION" },
      { ticker: "ICBP", buy1d: 5200000000, flow5d: 32000000000, flow20d: 280000000000, ratio: 27.4, tier: "STRONG_ACCUMULATION" },
      { ticker: "MYOR", buy1d: 3100000000, flow5d: 18000000000, flow20d: 145000000000, ratio: 21.5, tier: "MODERATE_ACCUMULATION" }
    ],
    "YTD": [
      { ticker: "ADRO", buy1d: 8500000000, flow5d: 82000000000, flow20d: 2.8 * 1000000000000, ratio: 48.5, tier: "SUPER_ACCUMULATION" },
      { ticker: "PTBA", buy1d: 6200000000, flow5d: 55000000000, flow20d: 1.9 * 1000000000000, ratio: 44.2, tier: "SUPER_ACCUMULATION" },
      { ticker: "ITMG", buy1d: 4500000000, flow5d: 38000000000, flow20d: 880000000000, ratio: 38.5, tier: "STRONG_ACCUMULATION" },
      { ticker: "MEDC", buy1d: 3200000000, flow5d: 29000000000, flow20d: 620000000000, ratio: 31.4, tier: "STRONG_ACCUMULATION" },
      { ticker: "HRUM", buy1d: 1800000000, flow5d: 12000000000, flow20d: 290000000000, ratio: 25.1, tier: "MODERATE_ACCUMULATION" }
    ]
  },
  foreignDistribution: {
    "1D": [
      { ticker: "UNVR", buy1d: -12000000000, flow5d: -12000000000, flow20d: -110000000000, ratio: 15.1, tier: "DISTRIBUTION" },
      { ticker: "TLKM", buy1d: -8500000000, flow5d: -8500000000, flow20d: -95000000000, ratio: 12.4, tier: "DISTRIBUTION" },
      { ticker: "GOTO", buy1d: -6400000000, flow5d: -6400000000, flow20d: -72000000000, ratio: 18.5, tier: "DISTRIBUTION" },
      { ticker: "BUKA", buy1d: -3200000000, flow5d: -3200000000, flow20d: -45000000000, ratio: 11.2, tier: "DISTRIBUTION" },
      { ticker: "SCMA", buy1d: -1800000000, flow5d: -1800000000, flow20d: -22000000000, ratio: 9.4, tier: "DISTRIBUTION" }
    ],
    "1W": [
      { ticker: "PGAS", buy1d: -9200000000, flow5d: -45000000000, flow20d: -110000000000, ratio: 15.1, tier: "DISTRIBUTION" },
      { ticker: "AKRA", buy1d: -6400000000, flow5d: -32000000000, flow20d: -95000000000, ratio: 12.4, tier: "DISTRIBUTION" },
      { ticker: "ELSA", buy1d: -4200000000, flow5d: -18000000000, flow20d: -55000000000, ratio: 18.2, tier: "DISTRIBUTION" },
      { ticker: "MEDC", buy1d: -3100000000, flow5d: -12500000000, flow20d: -42000000000, ratio: 14.5, tier: "DISTRIBUTION" },
      { ticker: "WINS", buy1d: -1500000000, flow5d: -8500000000, flow20d: -24000000000, ratio: 11.1, tier: "DISTRIBUTION" }
    ],
    "3M": [
      { ticker: "KLBF", buy1d: -4500000000, flow5d: -32000000000, flow20d: -280000000000, ratio: 18.4, tier: "DISTRIBUTION" },
      { ticker: "SIDO", buy1d: -3200000000, flow5d: -24000000000, flow20d: -195000000000, ratio: 14.8, tier: "DISTRIBUTION" },
      { ticker: "MIKA", buy1d: -2800000000, flow5d: -18000000000, flow20d: -155000000000, ratio: 16.2, tier: "DISTRIBUTION" },
      { ticker: "HEAL", buy1d: -1500000000, flow5d: -9200000000, flow20d: -85000000000, ratio: 12.1, tier: "DISTRIBUTION" },
      { ticker: "TSPC", buy1d: -950000000, flow5d: -5500000000, flow20d: -48000000000, ratio: 10.5, tier: "DISTRIBUTION" }
    ],
    "YTD": [
      { ticker: "ACES", buy1d: -2400000000, flow5d: -21000000000, flow20d: -750000000000, ratio: 22.4, tier: "DISTRIBUTION" },
      { ticker: "ERA", buy1d: -1800000000, flow5d: -15000000000, flow20d: -550000000000, ratio: 18.2, tier: "DISTRIBUTION" },
      { ticker: "MAPI", buy1d: -1400000000, flow5d: -12000000000, flow20d: -480000000000, ratio: 19.5, tier: "DISTRIBUTION" },
      { ticker: "MAPA", buy1d: -950000000, flow5d: -8500000000, flow20d: -380000000000, ratio: 14.1, tier: "DISTRIBUTION" },
      { ticker: "LPPF", buy1d: -620000000, flow5d: -5400000000, flow20d: -290000000000, ratio: 11.2, tier: "DISTRIBUTION" }
    ]
  },
  marketGrowthGainers: {
    "1D": [
      { ticker: "ADMR", period: "1D", change: 2.4, high: 1410, low: 1370, maxGain: 3.2, maxDd: -0.5, tier: "MODERATE_GROWTH" },
      { ticker: "MBMA", period: "1D", change: 1.6, high: 620, low: 600, maxGain: 2.1, maxDd: -0.2, tier: "MODERATE_GROWTH" },
      { ticker: "MDKA", period: "1D", change: 1.4, high: 2450, low: 2380, maxGain: 1.8, maxDd: -0.4, tier: "MODERATE_GROWTH" },
      { ticker: "VALE", period: "1D", change: 1.1, high: 3820, low: 3750, maxGain: 1.5, maxDd: -0.1, tier: "MODERATE_GROWTH" },
      { ticker: "ANTM", period: "1D", change: 0.9, high: 1540, low: 1510, maxGain: 1.2, maxDd: -0.2, tier: "MODERATE_GROWTH" }
    ],
    "1W": [
      { ticker: "EXCL", period: "1W", change: 5.4, high: 2350, low: 2210, maxGain: 8.5, maxDd: -2.1, tier: "MODERATE_GROWTH" },
      { ticker: "ISAT", period: "1W", change: 4.8, high: 5680, low: 5350, maxGain: 6.2, maxDd: -1.5, tier: "MODERATE_GROWTH" },
      { ticker: "TLKM", period: "1W", change: 3.2, high: 2950, low: 2820, maxGain: 4.5, maxDd: -0.8, tier: "MODERATE_GROWTH" },
      { ticker: "TOWR", period: "1W", change: 2.5, high: 820, low: 790, maxGain: 3.1, maxDd: -0.5, tier: "MODERATE_GROWTH" },
      { ticker: "TBIG", period: "1W", change: 1.8, high: 1450, low: 1410, maxGain: 2.5, maxDd: -0.2, tier: "MODERATE_GROWTH" }
    ],
    "3M": [
      { ticker: "ADRO", period: "3M", change: 45.2, high: 3850, low: 2560, maxGain: 48.5, maxDd: -8.4, tier: "SUPER_GROWTH" },
      { ticker: "PTBA", period: "3M", change: 32.4, high: 2980, low: 2210, maxGain: 35.1, maxDd: -6.2, tier: "SUPER_GROWTH" },
      { ticker: "ITMG", period: "3M", change: 24.5, high: 28900, low: 22500, maxGain: 27.5, maxDd: -4.5, tier: "STRONG_GROWTH" },
      { ticker: "MEDC", period: "3M", change: 18.2, high: 1450, low: 1180, maxGain: 22.4, maxDd: -3.1, tier: "STRONG_GROWTH" },
      { ticker: "HRUM", period: "3M", change: 12.5, high: 1350, low: 1150, maxGain: 15.2, maxDd: -2.5, tier: "MODERATE_GROWTH" }
    ],
    "YTD": [
      { ticker: "BBCA", period: "YTD", change: 115.3, high: 10450, low: 4800, maxGain: 125.0, maxDd: -14.2, tier: "SUPER_GROWTH" },
      { ticker: "BMRI", period: "YTD", change: 98.4, high: 7350, low: 3600, maxGain: 105.2, maxDd: -12.4, tier: "SUPER_GROWTH" },
      { ticker: "BBNI", period: "YTD", change: 82.5, high: 5850, low: 3100, maxGain: 92.1, maxDd: -15.1, tier: "SUPER_GROWTH" },
      { ticker: "BBRI", period: "YTD", change: 74.2, high: 6200, low: 3500, maxGain: 84.5, maxDd: -18.4, tier: "SUPER_GROWTH" },
      { ticker: "BRIS", period: "YTD", change: 68.5, high: 3120, low: 1820, maxGain: 78.4, maxDd: -11.2, tier: "SUPER_GROWTH" }
    ]
  },
  marketGrowthLosers: {
    "1D": [
      { ticker: "PBSA", period: "1D", change: -3.5, high: 260, low: 250, maxGain: 0.0, maxDd: -3.5, tier: "MODERATE_LOSS" },
      { ticker: "PGAS", period: "1D", change: -1.2, high: 1520, low: 1500, maxGain: 0.2, maxDd: -1.2, tier: "MODERATE_LOSS" },
      { ticker: "AKRA", period: "1D", change: -0.9, high: 1420, low: 1400, maxGain: 0.0, maxDd: -0.9, tier: "MODERATE_LOSS" },
      { ticker: "ELSA", period: "1D", change: -0.8, high: 462, low: 456, maxGain: 0.4, maxDd: -0.8, tier: "MODERATE_LOSS" },
      { ticker: "WINS", period: "1D", change: -0.5, high: 382, low: 378, maxGain: 0.0, maxDd: -0.5, tier: "MODERATE_LOSS" }
    ],
    "1W": [
      { ticker: "ACES", period: "1W", change: -8.2, high: 880, low: 805, maxGain: 0.5, maxDd: -9.5, tier: "MODERATE_LOSS" },
      { ticker: "ERA", period: "1W", change: -5.4, high: 420, low: 395, maxGain: 1.0, maxDd: -6.2, tier: "MODERATE_LOSS" },
      { ticker: "MAPI", period: "1W", change: -4.5, high: 1540, low: 1460, maxGain: 0.5, maxDd: -5.1, tier: "MODERATE_LOSS" },
      { ticker: "MAPA", period: "1W", change: -3.8, high: 850, low: 815, maxGain: 1.2, maxDd: -4.2, tier: "MODERATE_LOSS" },
      { ticker: "LPPF", period: "1W", change: -3.1, high: 1450, low: 1400, maxGain: 0.8, maxDd: -3.5, tier: "MODERATE_LOSS" }
    ],
    "3M": [
      { ticker: "UNVR", period: "3M", change: -28.9, high: 3200, low: 2240, maxGain: 2.1, maxDd: -31.5, tier: "HEAVY_LOSS" },
      { ticker: "TLKM", period: "3M", change: -18.2, high: 3450, low: 2800, maxGain: 4.2, maxDd: -21.4, tier: "HEAVY_LOSS" },
      { ticker: "GOTO", period: "3M", change: -15.4, high: 62, low: 52, maxGain: 8.5, maxDd: -18.2, tier: "MODERATE_LOSS" },
      { ticker: "BUKA", period: "3M", change: -12.5, high: 145, low: 125, maxGain: 1.2, maxDd: -15.1, tier: "MODERATE_LOSS" },
      { ticker: "SCMA", period: "3M", change: -10.2, high: 132, low: 118, maxGain: 2.5, maxDd: -12.4, tier: "MODERATE_LOSS" }
    ],
    "YTD": [
      { ticker: "SIDO", period: "YTD", change: -55.2, high: 850, low: 380, maxGain: 2.5, maxDd: -58.4, tier: "HEAVY_LOSS" },
      { ticker: "KLBF", period: "YTD", change: -32.4, high: 1850, low: 1240, maxGain: 5.2, maxDd: -35.2, tier: "HEAVY_LOSS" },
      { ticker: "MIKA", period: "YTD", change: -24.5, high: 3200, low: 2400, maxGain: 8.4, maxDd: -28.2, tier: "HEAVY_LOSS" },
      { ticker: "HEAL", period: "YTD", change: -18.2, high: 1450, low: 1180, maxGain: 12.1, maxDd: -21.5, tier: "HEAVY_LOSS" },
      { ticker: "TSPC", period: "YTD", change: -12.4, high: 2200, low: 1910, maxGain: 9.8, maxDd: -15.2, tier: "MODERATE_LOSS" }
    ]
  },
  araPatterns: {
    avgRvol: 3.42,
    avgClv: 0.88,
    gapUpSuccessRate: 68.4,
    fakeAraDumpRate: 15.2,
    multiDayAraRate: 18.4,
    byPriceFraction: [
      { name: "< 200", count: 45 },
      { name: "200 - < 500", count: 28 },
      { name: "500 - < 2000", count: 18 },
      { name: ">= 2000", count: 7 }
    ]
  }
};

export default function Dashboard() {

  const { user, token, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  // Connection & Loading States
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  // States
  const [stats, setStats] = useState(BACKTEST_FALLBACK.unified);
  const [strategies, setStrategies] = useState(BACKTEST_FALLBACK.strategies);
  const [signals, setSignals] = useState<any[]>([]);
  const [marketRegime, setMarketRegime] = useState({ regime: "BULLISH", score: 20 });
  const [runningJob, setRunningJob] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Strategy Configurations
  const [selectedStrategyId, setSelectedStrategyId] = useState("SWING_DEFAULT");
  const [strategyConfigs, setStrategyConfigs] = useState<any>({});
  const [updatingConfig, setUpdatingConfig] = useState(false);

  // Workspace Page Navigation State
  type CockpitPage = "overview" | "radars" | "signals" | "strategies" | "jobs";
  const [activePage, setActivePage] = useState<CockpitPage>("overview");

  // Sync tab with URL query parameter on initial mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get("tab") as CockpitPage;
      if (tabParam && ["overview", "radars", "signals", "strategies", "jobs"].includes(tabParam)) {
        setActivePage(tabParam);
      }
    }
  }, []);

  const handlePageChange = (newPage: CockpitPage) => {
    setActivePage(newPage);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", newPage);
      window.history.replaceState({}, "", url.toString());
    }
  };

  // Guard routing
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Fetch signals and backend settings
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      await api.get("/api/strategies/presets");
      setConnected(true);

      const stratRes = await api.get("/api/strategies");
      if (stratRes.data && stratRes.data.data) {
        const dbConfigs = stratRes.data.data.reduce((acc: any, curr: any) => {
          acc[curr.strategyId] = curr;
          return acc;
        }, {});
        setStrategyConfigs(dbConfigs);
      }

      try {
        const signalsRes = await api.get("/api/signals?limit=50");
        if (signalsRes.data && signalsRes.data.data && signalsRes.data.data.length > 0) {
          const formatted = signalsRes.data.data.map((sig: any) => ({
            ticker: sig.ticker,
            strategy: sig.strategyType === "SWING" ? "SWING_DEFAULT" : sig.strategyType === "BSJP" ? "BSJP_DEFAULT" : "ARA_HUNTER_DEFAULT",
            setup: sig.setupMode,
            entry: sig.entryPrice,
            tp1: sig.targetPrice1,
            tp2: sig.targetPrice2,
            sl: sig.stopLoss,
            score: sig.score,
            status: sig.status,
            date: sig.signalDate ? sig.signalDate.substring(0, 10) : ""
          }));
          setSignals(formatted);
        } else {
          setSignals(BACKTEST_FALLBACK.recentSignals);
        }
      } catch (e) {
        setSignals(BACKTEST_FALLBACK.recentSignals);
      }

      setMessage({ type: "success", text: "Dashboard tersinkronisasi dengan database backend!" });
    } catch (error) {
      setConnected(false);
      setSignals(BACKTEST_FALLBACK.recentSignals);
      setStats(BACKTEST_FALLBACK.unified);
      setStrategies(BACKTEST_FALLBACK.strategies);

      setMessage({
        type: "error",
        text: "Koneksi backend gagal. Menampilkan data hasil simulasi historis (Offline Mode)."
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Sync state selectors on change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle configuration update
  const handleUpdateConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingConfig(true);
    try {
      const activeConfig = strategyConfigs[selectedStrategyId];
      if (!activeConfig) return;

      await api.put(`/api/strategies/${selectedStrategyId}`, activeConfig);
      setMessage({ type: "success", text: `Konfigurasi strategi ${selectedStrategyId} berhasil diperbarui!` });
      fetchData();
    } catch (err: any) {
      setMessage({ type: "error", text: `Gagal memperbarui konfigurasi: ${err.message}` });
    } finally {
      setUpdatingConfig(false);
    }
  };

  // Switch active Swing setup with 1-click
  const handleSwitchSwingSetup = async (setupName: string) => {
    setLoading(true);
    try {
      await api.post("/api/strategies/switch-swing", { setup: setupName });
      setMessage({ type: "success", text: `Swing setup berhasil diubah ke: ${setupName}!` });
      fetchData();
    } catch (err: any) {
      setMessage({ type: "error", text: `Gagal mengubah Swing setup: ${err.message}` });
      setLoading(false);
    }
  };

  // Trigger manual jobs
  const runJob = async (jobName: string, endpoint: string) => {
    setRunningJob(jobName);
    try {
      const response = await api.post(endpoint, {});
      setMessage({
        type: "success",
        text: `Sukses memicu job ${jobName}! Output: ${response.data.message || "Job selesai"}`
      });
      fetchData();
    } catch (e: any) {
      setMessage({
        type: "error",
        text: `Gagal memicu job ${jobName}: ${e.response?.data?.message || e.message}`
      });
    } finally {
      setRunningJob(null);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-slate-50">
        <p className="text-sm font-medium text-slate-500">Memeriksa autentikasi...</p>
      </div>
    );
  }

  // Render period selector buttons helper
  const renderPeriodSelector = (current: string, setPeriod: (p: any) => void) => {
    return (
      <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded border border-slate-200 text-[10px] font-bold">
        {["1D", "1W", "3M", "YTD"].map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPeriod(p)}
            className={`px-1.5 py-0.5 rounded-sm transition-all ${current === p
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-400 hover:text-slate-600"
              }`}
          >
            {p}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">

      {/* NAVBAR */}
      <nav className="border-b border-slate-200 bg-white sticky top-0 z-50 px-3 sm:px-6 py-2.5 sm:py-4 flex items-center justify-between gap-2 sm:gap-4 shadow-xs">
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="relative flex h-2.5 w-2.5">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${connected ? "bg-emerald-400" : "bg-rose-400"}`}></span>
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${connected ? "bg-emerald-500" : "bg-rose-500"}`}></span>
          </div>
          <div>
            <h1 className="font-black text-sm sm:text-lg tracking-tight text-slate-900">
              VIOLETRADAR
            </h1>
            <p className="text-[10px] text-slate-500 font-medium hidden sm:block">Sistem Pemantau Sinyal & Portofolio</p>
          </div>
        </div>

        <div className="flex-1 max-w-xs sm:max-w-sm flex justify-center sm:justify-start">
          <SearchTickers />
        </div>

        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {/* Regime Indicator */}
          <div className="hidden md:flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 text-xs">
            <span className="text-slate-500 font-medium">IHSG:</span>
            <span className="font-bold text-blue-600">{marketRegime.regime} (+{marketRegime.score})</span>
          </div>

          {/* User Profile Summary */}
          <div className="flex items-center gap-1.5 sm:gap-2 border-l border-slate-200 pl-2 sm:pl-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-800">{user.name}</p>
              <p className="text-[10px] text-slate-400">{user.role}</p>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full">
                  <UserIcon className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white border-slate-200 text-slate-900 sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Profil Pengguna</DialogTitle>
                  <DialogDescription>Informasi akun administrator Anda.</DialogDescription>
                </DialogHeader>
                <div className="space-y-3 py-3 text-sm">
                  <div className="grid grid-cols-3 border-b border-slate-100 pb-2.5">
                    <span className="text-slate-400">Nama:</span>
                    <span className="col-span-2 font-bold text-slate-800">{user.name}</span>
                  </div>
                  <div className="grid grid-cols-3 border-b border-slate-100 pb-2.5">
                    <span className="text-slate-400">Email:</span>
                    <span className="col-span-2 font-mono text-xs text-slate-700">{user.email}</span>
                  </div>
                  <div className="grid grid-cols-3 pb-1">
                    <span className="text-slate-400">Status Role:</span>
                    <span className="col-span-2">
                      <Badge className="bg-blue-600 hover:bg-blue-600 text-white font-medium text-[10px] py-0 px-2">{user.role}</Badge>
                    </span>
                  </div>
                </div>
                <DialogFooter className="w-full pt-2">
                  <Button onClick={logout} variant="outline" className="w-full border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-semibold">
                    <LogOut className="h-4 w-4 mr-1.5" /> Keluar dari Akun
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Button
            onClick={() => fetchData()}
            disabled={loading}
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-500 hover:text-slate-900 hover:bg-slate-100"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </nav>

      {/* SYSTEM NOTIFICATION */}
      {message && (
        <div className={`px-6 py-2.5 text-xs flex items-center justify-between border-b ${message.type === "success"
          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
          : "bg-rose-50 text-rose-800 border-rose-200"
          }`}>
          <div className="flex items-center gap-2">
            {message.type === "success" ? <CheckCircle className="h-4 w-4 text-emerald-600" /> : <AlertTriangle className="h-4 w-4 text-rose-600" />}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="font-bold hover:text-slate-900">✕</button>
        </div>
      )}

      {/* BODY CONTENT */}
      <main className="flex-1 p-4 md:p-6 max-w-[1680px] mx-auto w-full space-y-6">

        {/* TOP METRIC SUMMARY CARDS */}
        <MetricSummaryCards />

        {/* WORKSPACE PAGE NAVIGATION BAR */}
        <div className="sticky top-[53px] z-30 bg-slate-50/95 backdrop-blur-md py-1.5 sm:py-2">
          <div className="flex items-center gap-1.5 p-1.5 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-x-auto no-scrollbar scroll-smooth">
            <PageNavButton
              active={activePage === "overview"}
              onClick={() => handlePageChange("overview")}
              icon={<BarChart3 className="w-4 h-4" />}
              label="Overview & Grafik"
            />
            <PageNavButton
              active={activePage === "radars"}
              onClick={() => handlePageChange("radars")}
              icon={<Radar className="w-4 h-4" />}
              label="Special Radars Pasar"
            />
            <PageNavButton
              active={activePage === "signals"}
              onClick={() => handlePageChange("signals")}
              icon={<Zap className="w-4 h-4" />}
              label="Sinyal Live & Trailing"
            />
            <PageNavButton
              active={activePage === "strategies"}
              onClick={() => handlePageChange("strategies")}
              icon={<SlidersHorizontal className="w-4 h-4" />}
              label="Konfigurasi Parameter"
            />
            <PageNavButton
              active={activePage === "jobs"}
              onClick={() => handlePageChange("jobs")}
              icon={<Clock className="w-4 h-4" />}
              label="Control Panel & Jobs"
            />
          </div>
        </div>

        {/* PAGE 1: OVERVIEW & PERFORMANCE VISUALIZATIONS */}
        {activePage === "overview" && (
          <div className="space-y-6 animate-in fade-in-50 duration-150">
            <div className="space-y-6">
              {/* Visualizations row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <OverviewMonthly />
                <OverViewYearly />
              </div>
              <OverviewStatistics />
            </div>
          </div>
        )}

        {/* PAGE 2: SPECIAL RADARS PASAR */}
        {activePage === "radars" && (
          <div className="space-y-6 animate-in fade-in-50 duration-150">

            {/* 🎯 HEADLINER: RADAR CALON ARA & BELI SORE (BSJP) */}
            <AraPotentialCard />

            {/* ROW 1: SMART MARKET MOVERS - ARA VS ARB */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AraTargetsCard />
              <ArbTargetsCard />
            </div>

            {/* ROW 2: FOREIGN FLOWS - ACCUMULATION VS DISTRIBUTION */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ForeignAccumulationCard />
              <ForeignDistributionCard />
            </div>

            {/* ROW 3: PERFORMANCE GROW VS LOSE */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <GrowthLeadersCard />
              <LoseLeadersCard />
            </div>

            {/* ROW 4: ARA PATTERN RECOGNITION STATS */}
            <div className="grid grid-cols-1 gap-6">
              <AraPatternsCard />
            </div>

          </div>
        )}

        {/* PAGE 3: LIVE SIGNALS & DYNAMIC TRAILING STOP */}
        {activePage === "signals" && (
          <div className="space-y-6 animate-in fade-in-50 duration-150">
            <SignalMonitoringCard />
          </div>
        )}

        {/* PAGE 4: STRATEGY PARAMETER CONFIGURATIONS */}
        {activePage === "strategies" && (
          <div className="space-y-6 animate-in fade-in-50 duration-150">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Left sidebar selector */}
              <Card className="border-slate-200 shadow-sm bg-white lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-sm font-bold text-slate-800">Strategi Terdaftar</CardTitle>
                  <CardDescription className="text-xs">Pilih kode strategi untuk mengubah parameter teknikal di database.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {BACKTEST_FALLBACK.strategies.map((strat) => (
                    <button
                      key={strat.id}
                      onClick={() => setSelectedStrategyId(strat.id)}
                      className={`w-full text-left p-3 rounded-lg border text-xs flex items-center justify-between transition-all ${selectedStrategyId === strat.id
                        ? "border-blue-600 bg-blue-50 text-blue-900 font-bold"
                        : "border-slate-200 hover:bg-slate-50 text-slate-600"
                        }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{strat.name}</span>
                        {strat.id === "ARA_HUNTER_DEFAULT" && (
                          <span className="text-[9px] bg-amber-50 text-amber-700 font-semibold px-1.5 py-0.5 rounded border border-amber-200">
                            Nonaktif
                          </span>
                        )}
                      </div>
                      <ChevronRight className={`h-4 w-4 ${selectedStrategyId === strat.id ? "text-blue-600" : "text-slate-400"}`} />
                    </button>
                  ))}

                  {/* 1-Click Swing quick setup switch */}
                  <div className="pt-4 border-t border-slate-200 mt-4 space-y-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                      <SlidersHorizontal className="h-4 w-4 text-blue-600" />
                      <span>1-Click Swing Setup Switch</span>
                    </div>
                    <p className="text-[10px] text-slate-400">Ubah mode setup aktif pada screener Swing harian secara instan.</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {["CROSSOVER", "PULLBACK", "BREAKOUT", "RECLAIM"].map((setupName) => (
                        <Button
                          key={setupName}
                          onClick={() => handleSwitchSwingSetup(setupName)}
                          variant="outline"
                          className="text-[9px] h-7 border-slate-200 font-bold hover:bg-slate-100 hover:text-slate-900"
                        >
                          {setupName}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Right config form */}
              <Card className="border-slate-200 shadow-sm bg-white lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-sm font-bold text-slate-800">
                    Edit Parameter: {selectedStrategyId}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Pengaturan parameter harian di MongoDB. Nilai di bawah disinkronkan langsung ke backend.
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleUpdateConfig}>
                  <CardContent className="space-y-4 text-xs">
                    {!connected ? (
                      <div className="p-4 rounded-lg bg-yellow-50 text-yellow-800 border border-yellow-200">
                        Koneksi database offline. Fitur pengeditan parameter dinonaktifkan sementara.
                      </div>
                    ) : !strategyConfigs[selectedStrategyId] ? (
                      <p className="text-slate-400">Mengunduh konfigurasi dari server...</p>
                    ) : (
                      <>
                        {selectedStrategyId === "ARA_HUNTER_DEFAULT" && (
                          <div className="p-3 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 text-xs">
                            <span className="font-bold">Status: Dinonaktifkan.</span> Sinyal ARA Hunter dinonaktifkan agar sinyal lebih fokus. Deteksi lonjakan calon ARA kini terpusat di tab <b>Special Radars Pasar &gt; Radar Calon ARA &amp; Beli Sore</b>.
                          </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="font-bold text-slate-600">Minimal Volume Harian (Rupiah)</label>
                          <Input
                            type="number"
                            value={strategyConfigs[selectedStrategyId].minTurnover || 1000000000}
                            onChange={(e) => {
                              const updated = { ...strategyConfigs };
                              updated[selectedStrategyId].minTurnover = parseInt(e.target.value, 10);
                              setStrategyConfigs(updated);
                            }}
                            className="border-slate-200 bg-slate-50 text-slate-900"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="font-bold text-slate-600">Batas Harga Minimal</label>
                          <Input
                            type="number"
                            value={strategyConfigs[selectedStrategyId].minPrice || 100}
                            onChange={(e) => {
                              const updated = { ...strategyConfigs };
                              updated[selectedStrategyId].minPrice = parseInt(e.target.value, 10);
                              setStrategyConfigs(updated);
                            }}
                            className="border-slate-200 bg-slate-50 text-slate-900"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="font-bold text-slate-600">Target Profit 1 (%)</label>
                          <Input
                            type="number"
                            step="0.1"
                            value={strategyConfigs[selectedStrategyId].targetProfitPercent1 || 0}
                            onChange={(e) => {
                              const updated = { ...strategyConfigs };
                              updated[selectedStrategyId].targetProfitPercent1 = parseFloat(e.target.value);
                              setStrategyConfigs(updated);
                            }}
                            className="border-slate-200 bg-slate-50 text-slate-900"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="font-bold text-slate-600">Target Profit 2 (%)</label>
                          <Input
                            type="number"
                            step="0.1"
                            value={strategyConfigs[selectedStrategyId].targetProfitPercent2 || 0}
                            onChange={(e) => {
                              const updated = { ...strategyConfigs };
                              updated[selectedStrategyId].targetProfitPercent2 = parseFloat(e.target.value);
                              setStrategyConfigs(updated);
                            }}
                            className="border-slate-200 bg-slate-50 text-slate-900"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="font-bold text-slate-600">Stop Loss (%)</label>
                          <Input
                            type="number"
                            step="0.1"
                            value={strategyConfigs[selectedStrategyId].stopLossPercent || 0}
                            onChange={(e) => {
                              const updated = { ...strategyConfigs };
                              updated[selectedStrategyId].stopLossPercent = parseFloat(e.target.value);
                              setStrategyConfigs(updated);
                            }}
                            className="border-slate-200 bg-slate-50 text-slate-900"
                          />
                        </div>

                        {selectedStrategyId === "ARA_HUNTER_DEFAULT" && (
                          <div className="space-y-1.5">
                            <label className="font-bold text-slate-600">Trailing Stop (%)</label>
                            <Input
                              type="number"
                              step="0.1"
                              value={strategyConfigs[selectedStrategyId].trailingStopPercent || 5.0}
                              onChange={(e) => {
                                const updated = { ...strategyConfigs };
                                updated[selectedStrategyId].trailingStopPercent = parseFloat(e.target.value);
                                setStrategyConfigs(updated);
                              }}
                              className="border-slate-200 bg-slate-50 text-slate-900"
                            />
                          </div>
                        )}
                      </div>
                    </>
                  )}
                  </CardContent>
                  <CardFooter className="flex justify-between border-t border-slate-100 pt-4">
                    <Button
                      type="button"
                      onClick={() => api.post("/api/strategies/reset-defaults").then(() => fetchData())}
                      variant="outline"
                      disabled={!connected || loading}
                      className="border-slate-200 hover:bg-slate-50 hover:text-slate-900 text-slate-600"
                    >
                      Reset Default Preset
                    </Button>
                    <Button
                      type="submit"
                      disabled={!connected || updatingConfig || loading}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                    >
                      {updatingConfig ? "Menyimpan..." : "Simpan Konfigurasi"}
                    </Button>
                  </CardFooter>
                </form>
              </Card>

            </div>
          </div>
        )}

        {/* PAGE 5: CONTROL PANEL & JOBS AUTOMATIONS */}
        {activePage === "jobs" && (
          <div className="space-y-6 animate-in fade-in-50 duration-150">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Manual Job Triggers */}
              <Card className="border-slate-200 shadow-sm bg-white">
                <CardHeader>
                  <CardTitle className="text-sm font-bold text-slate-800">Manajemen Trigger Job Otomatis</CardTitle>
                  <CardDescription className="text-xs">Memicu sinkronisasi data bursa dan evaluasi sinyal secara manual.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-lg border border-slate-100">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">EOD Post-Market & Replay Job</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">Tarik data penutupan resmi IDX, evaluasi posisi trailing stop, dan update telegram.</p>
                    </div>
                    <Button
                      onClick={() => runJob("EOD Post-Market", "/api/jobs/post-market")}
                      disabled={!connected || runningJob === "EOD Post-Market"}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 font-semibold"
                    >
                      {runningJob === "EOD Post-Market" ? "Memproses..." : <><Play className="h-3 w-3 mr-1" /> Run EOD</>}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-lg border border-slate-100">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">BSJP Sesi 2 Screener Job</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">Jalankan deteksi lonjakan transaksi closing untuk strategi Beli Sore Jual Pagi.</p>
                    </div>
                    <Button
                      onClick={() => runJob("BSJP Screener", "/api/jobs/bsjp-screener")}
                      disabled={!connected || runningJob === "BSJP Screener"}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 font-semibold"
                    >
                      {runningJob === "BSJP Screener" ? "Memproses..." : <><Play className="h-3 w-3 mr-1" /> Run BSJP</>}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-lg border border-slate-100">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">ARA Hunter Morning Confirmation</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">Validasi ulang harga open kandidat ARA di jam 09:02 WIB untuk konfirmasi sinyal.</p>
                    </div>
                    <Button
                      onClick={() => runJob("ARA Confirmation", "/api/jobs/ara-morning")}
                      disabled={!connected || runningJob === "ARA Confirmation"}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 font-semibold"
                    >
                      {runningJob === "ARA Confirmation" ? "Memproses..." : <><Play className="h-3 w-3 mr-1" /> Run ARA</>}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Server Integration Info */}
              <Card className="border-slate-200 shadow-sm bg-white">
                <CardHeader>
                  <CardTitle className="text-sm font-bold text-slate-800">Status Server & Integrasi</CardTitle>
                  <CardDescription className="text-xs">Informasi sinkronisasi data engine dan koneksi telegram.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3.5 text-xs font-medium">
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-400">Database Engine:</span>
                    <span className="text-slate-700 font-bold">MongoDB v5 (Replay Cache Active)</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-400">Cron Scheduler:</span>
                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-emerald-500" /> Active (Scheduler.ts)
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-400">Telegram Bot Channel:</span>
                    <span className="text-blue-600 font-bold">@VioletRadarBot (Connected)</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-400">Market Data Feed:</span>
                    <span className="text-slate-700 font-bold">Yahoo Finance (Real-Time API)</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-slate-400">Portfolio Risk Constraint:</span>
                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                      <Shield className="h-3.5 w-3.5 text-emerald-500" /> Safe Mode (&lt;15% DD Guard)
                    </span>
                  </div>
                </CardContent>
              </Card>

            </div>
          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400 font-medium shadow-inner">
        <p>© 2026 VioletRadar. Built with Next.js, shadcn/ui & Tailwind CSS. Powered by Open Sans Font & Calmar Risk Engine.</p>
      </footer>
    </div>
  );
}

function PageNavButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
        active
          ? "bg-indigo-600 text-white shadow-xs"
          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
