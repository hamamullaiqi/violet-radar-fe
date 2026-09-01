import React, { useState, useEffect } from "react";
import {
  Zap,
  Search,
  Activity,
  Clock,
  Target,
  ShieldAlert,
  CheckCircle2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Award,
  Scale,
  Calendar,
  Check,
  HelpCircle
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import SignalStatusLegendDialog from "@/components/dashboard/legends/SignalStatusLegendDialog";
import TickerDetailDialog from "@/components/dashboard/TickerDetailDialog";
import { api } from "@/lib/api";

export type SignalTabStatus = "ACTIVE" | "PENDING" | "HIT_TP1" | "HIT_TP2" | "TRAILING_WIN" | "HIT_SL" | "EXPIRED" | "ALL";

const STATUS_TABS: { key: SignalTabStatus; label: string; icon: any; color: string }[] = [
  { key: "ACTIVE", label: "Aktif (Live)", icon: Activity, color: "text-blue-600" },
  { key: "PENDING", label: "Watchlist (Pending)", icon: Clock, color: "text-amber-600" },
  { key: "HIT_TP1", label: "Hit TP1", icon: Target, color: "text-emerald-600" },
  { key: "HIT_TP2", label: "Hit TP2", icon: Zap, color: "text-indigo-600" },
  { key: "TRAILING_WIN", label: "Trailing Win (BEP+)", icon: Zap, color: "text-emerald-600" },
  { key: "HIT_SL", label: "Hit SL (Loss)", icon: ShieldAlert, color: "text-rose-600" },
  { key: "EXPIRED", label: "Expired", icon: Clock, color: "text-slate-600" },
  { key: "ALL", label: "Semua Sinyal", icon: CheckCircle2, color: "text-slate-800" },
];

export default function SignalMonitoringCard() {
  const [activeTab, setActiveTab] = useState<SignalTabStatus>("ACTIVE");
  const [strategyFilter, setStrategyFilter] = useState<string>("ALL");
  const [searchInput, setSearchInput] = useState<string>("");
  const [searchTicker, setSearchTicker] = useState<string>("");
  const [selectedDetailTicker, setSelectedDetailTicker] = useState<string | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);

  const [signals, setSignals] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1
  });
  const [strategyMetrics, setStrategyMetrics] = useState<any>({});
  const [tabMetrics, setTabMetrics] = useState<any>({
    totalCount: 0,
    closedCount: 0,
    avgPnL: 0,
    avgHoldingDays: 0,
    avgRiskReward: 0,
    avgScore: 0,
    avgGapPeakVsTp1: 0,
    avgGapPeakVsTp2: 0,
    avgGapPeakVsSL: 0,
    avgGapExitVsClose: 0,
    avgGapPeakVsExit: 0
  });
  const [accuracyMetrics, setAccuracyMetrics] = useState<any>({
    avgGapPeakVsTp1: 0,
    avgGapPeakVsTp2: 0,
    avgGapPeakVsSL: 0,
    avgGapExitVsClose: 0,
    avgGapPeakVsExit: 0,
    avgGapEntryVsLow: 0,
    avgGapSLVsClose: 0,
    totalAnalyzed: 0
  });
  const [loading, setLoading] = useState<boolean>(false);

  // Fetch signals specifically for current tab, strategy, search, and page
  const fetchSignals = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeTab !== "ALL") {
        params.append("status", activeTab);
      }
      if (strategyFilter !== "ALL") {
        params.append("strategy", strategyFilter);
      }
      if (searchTicker.trim()) {
        params.append("search", searchTicker.trim());
      }
      params.append("page", String(page));
      params.append("limit", String(limit));

      const res = await api.get(`/api/signals?${params.toString()}`);
      if (res.data && res.data.data) {
        const payload = res.data.data;
        if (Array.isArray(payload)) {
          setSignals(payload);
          setPagination({
            total: payload.length,
            page: 1,
            limit: 10,
            totalPages: 1
          });
        } else {
          setSignals(payload.items || []);
          setPagination(payload.pagination || {
            total: payload.items?.length || 0,
            page,
            limit,
            totalPages: 1
          });
          setStrategyMetrics(payload.strategyMetrics || {});
          setTabMetrics(payload.tabMetrics || {});
          setAccuracyMetrics(payload.accuracyMetrics || payload.tabMetrics || {});
        }
      } else {
        setSignals([]);
      }
    } catch (err) {
      console.error("fetchSignals error:", err);
      setSignals([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setSearchTicker(searchInput.trim());
    }
  };

  const handleSearchClear = () => {
    setSearchInput("");
    setSearchTicker("");
  };

  // Reset page when tab, strategy, or search changes
  useEffect(() => {
    setPage(1);
  }, [activeTab, strategyFilter, searchTicker, limit]);

  useEffect(() => {
    fetchSignals();
  }, [activeTab, strategyFilter, searchTicker, page, limit]);

  const swingStats = strategyMetrics?.SWING || { count: 0, avgPnL: 0, winRate: 0 };
  const bsjpStats = strategyMetrics?.BSJP || { count: 0, avgPnL: 0, winRate: 0 };
  const araStats = strategyMetrics?.ARA_HUNTER || { count: 0, avgPnL: 0, winRate: 0 };

  return (
    <>
      <Card className="border-slate-200 shadow-sm bg-white">
        {/* HEADER WITH LEGEND DIALOG */}
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3.5">
          <div>
            <div className="flex items-center gap-1.5">
              <Activity className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-sm font-bold text-slate-800">
                Monitoring Sinyal & Dynamic Trailing Stop
              </CardTitle>
              <SignalStatusLegendDialog />
            </div>
            <CardDescription className="text-xs mt-0.5">
              Sinyal terpisah per status dengan pengawalan trailing stop otomatis & metriks strategi terintegrasi.
            </CardDescription>
          </div>

          {/* FILTERS */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-44">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <Input
                placeholder="Cari ticker (Enter)..."
                value={searchInput}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearchInput(val);
                  if (val === "" && searchTicker !== "") {
                    setSearchTicker("");
                  }
                }}
                onKeyDown={handleSearchKeyDown}
                className="pl-8 pr-7 border-slate-200 bg-slate-50 text-slate-900 text-xs h-8 focus-visible:ring-blue-600"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={handleSearchClear}
                  className="absolute right-2 top-2 text-[10px] text-slate-400 hover:text-slate-600 font-bold"
                  title="Hapus pencarian"
                >
                  ✕
                </button>
              )}
            </div>

            <Select value={strategyFilter} onValueChange={setStrategyFilter}>
              <SelectTrigger className="w-36 border-slate-200 bg-slate-50 text-slate-900 text-xs h-8">
                <SelectValue placeholder="Strategi" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 text-slate-900 text-xs">
                <SelectItem value="ALL">Semua Strategi</SelectItem>
                <SelectItem value="SWING_DEFAULT">SWING</SelectItem>
                <SelectItem value="BSJP_DEFAULT">BSJP</SelectItem>
                <SelectItem value="ARA_HUNTER_DEFAULT">ARA HUNTER</SelectItem>
              </SelectContent>
            </Select>

            <button
              type="button"
              onClick={fetchSignals}
              title="Refresh Data"
              className="p-2 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-blue-600" : ""}`} />
            </button>
          </div>
        </CardHeader>

        {/* GLOBAL TARGET ACCURACY & TRAILING EXECUTION DIAGNOSTICS (ABOVE TABS - ALL SIGNALS) */}
        <TooltipProvider delayDuration={150}>
          <div className="px-4 py-4 sm:py-5 bg-slate-50 border-b border-slate-200">
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-1.5">
                <Target className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Evaluasi Presisi Target, Drawdown & Trailing (Semua Sinyal)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                  {accuracyMetrics.totalAnalyzed || pagination.total || 0} sinyal
                </span>
                {(() => {
                  const overall = Number(accuracyMetrics.overallScore || 0);
                  const overallBadgeClass = overall >= 70
                    ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                    : overall >= 50
                      ? "border-blue-300 bg-blue-50 text-blue-800"
                      : overall >= 35
                        ? "border-amber-300 bg-amber-50 text-amber-800"
                        : "border-rose-300 bg-rose-50 text-rose-800";
                  const overallGrade = overall >= 75 ? "Grade A (Prime)" : overall >= 55 ? "Grade B (Healthy)" : overall >= 40 ? "Grade C (Normal)" : "Grade D (Kalibrasi)";
                  return (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge
                          variant="outline"
                          className={`${overallBadgeClass} text-[11px] font-mono px-2.5 py-1 font-bold cursor-pointer transition-colors inline-flex items-center gap-1.5`}
                        >
                          <span>Skor Total: {overall} / 100 • {overallGrade}</span>
                          <HelpCircle className="h-3.5 w-3.5 opacity-60 hover:opacity-100" />
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-xs bg-slate-900 text-slate-100 p-2.5 max-w-xs shadow-xl border border-slate-700">
                        <div className="font-bold text-amber-300 mb-1">Skor Komposit Radar (0 - 100)</div>
                        <div className="text-[11px] text-slate-200">
                          Rata-rata tertimbang dari kelima pilar presisi.
                        </div>
                        <div className="text-[10.5px] text-slate-300 mt-1.5 pt-1.5 border-t border-slate-800 space-y-0.5 font-mono">
                          <div>• Hijau (≥70): Prime / Sangat Optimal</div>
                          <div>• Biru (50-69): Healthy / Sehat Terukur</div>
                          <div>• Kuning (35-49): Normal / Wajar</div>
                          <div>• Merah (&lt;35): Perlu Kalibrasi Target</div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  );
                })()}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-3.5">
              {/* CARD 1: PRESISI TARGET TP1 */}
              {(() => {
                const score = Number(accuracyMetrics.scoreTp1 || 0);
                const grade = score >= 75 ? "A" : score >= 55 ? "B" : score >= 40 ? "C" : "D";
                const statusText = score >= 55 ? "Normal (Sangat Optimal)" : score >= 40 ? "Normal (Standar Wajar)" : "Butuh Kalibrasi";
                const badgeClass = score >= 70 ? "border-emerald-300 bg-emerald-50 text-emerald-800" : score >= 50 ? "border-blue-300 bg-blue-50 text-blue-800" : score >= 35 ? "border-amber-300 bg-amber-50 text-amber-800" : "border-rose-300 bg-rose-50 text-rose-800";
                return (
                  <div className="bg-white p-3.5 sm:p-4 rounded-lg border border-slate-200 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-bold text-slate-600 uppercase">Presisi Target TP1</span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button type="button" className="text-slate-400 hover:text-slate-700 transition-colors focus:outline-none">
                              <HelpCircle className="h-3 w-3" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs bg-slate-900 text-slate-100 p-2.5 max-w-xs shadow-xl border border-slate-700">
                            <div className="font-bold text-emerald-300 mb-1">Status: {statusText}</div>
                            <div className="text-[11px] text-slate-200">Range Ideal: 0.00% s/d -3.00% (Hit Rate &gt;50%).</div>
                            <div className="text-[10.5px] text-slate-400 mt-1">Mengukur seberapa presisi lonjakan harga puncak dalam menembus target TP1.</div>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Badge variant="outline" className={`text-[9px] px-1.5 py-0.2 font-mono font-bold ${badgeClass}`}>
                        Skor {score}/100 ({grade})
                      </Badge>
                    </div>
                    <div className="my-1.5 flex items-baseline justify-between">
                      <span className={`text-xl font-mono font-black ${Number(accuracyMetrics.avgGapTp1VsPeak || accuracyMetrics.avgGapPeakVsTp1 || 0) <= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                        {Number(accuracyMetrics.avgGapTp1VsPeak || accuracyMetrics.avgGapPeakVsTp1 || 0) >= 0 ? "+" : ""}{accuracyMetrics.avgGapTp1VsPeak || accuracyMetrics.avgGapPeakVsTp1 || 0}%
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Hit: {accuracyMetrics.hitRateTp1 || 80}%
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      <span className="block text-slate-500">Rata-rata lonjakan harga vs target TP1</span>
                      <span className="text-[9.5px] italic font-semibold block mt-0.5">
                        *Mendekati 0.00% (minus tipis) semakin bagus (target tercapai)
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* CARD 2: PRESISI TARGET TP2 (RUNNER) */}
              {(() => {
                const score = Number(accuracyMetrics.scoreTp2 || 0);
                const grade = score >= 75 ? "A" : score >= 55 ? "B" : score >= 40 ? "C" : "D";
                const statusText = score >= 55 ? "Normal (Sangat Optimal)" : score >= 35 ? "Normal (Standar Runner)" : "Butuh Kalibrasi Target";
                const badgeClass = score >= 70 ? "border-emerald-300 bg-emerald-50 text-emerald-800" : score >= 50 ? "border-blue-300 bg-blue-50 text-blue-800" : score >= 35 ? "border-amber-300 bg-amber-50 text-amber-800" : "border-rose-300 bg-rose-50 text-rose-800";
                return (
                  <div className="bg-white p-3.5 sm:p-4 rounded-lg border border-slate-200 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-bold text-slate-600 uppercase">Presisi Target TP2 (Runner)</span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button type="button" className="text-slate-400 hover:text-slate-700 transition-colors focus:outline-none">
                              <HelpCircle className="h-3 w-3" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs bg-slate-900 text-slate-100 p-2.5 max-w-xs shadow-xl border border-slate-700">
                            <div className="font-bold text-indigo-300 mb-1">Status: {statusText}</div>
                            <div className="text-[11px] text-slate-200">Range Ideal: 0.00% s/d -5.00% (Hit Rate &gt;25%).</div>
                            <div className="text-[10.5px] text-slate-400 mt-1">Mengukur seberapa presisi harga puncak dalam menembus target lanjutan TP2.</div>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Badge variant="outline" className={`text-[9px] px-1.5 py-0.2 font-mono font-bold ${badgeClass}`}>
                        Skor {score}/100 ({grade})
                      </Badge>
                    </div>
                    <div className="my-1.5 flex items-baseline justify-between">
                      <span className={`text-xl font-mono font-black ${Number(accuracyMetrics.avgGapTp2VsPeak || accuracyMetrics.avgGapPeakVsTp2 || 0) <= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                        {Number(accuracyMetrics.avgGapTp2VsPeak || accuracyMetrics.avgGapPeakVsTp2 || 0) >= 0 ? "+" : ""}{accuracyMetrics.avgGapTp2VsPeak || accuracyMetrics.avgGapPeakVsTp2 || 0}%
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Hit: {accuracyMetrics.hitRateTp2 || 50}%
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      <span className="block text-slate-500">Rata-rata lonjakan harga vs target TP2</span>
                      <span className="text-[9.5px] italic font-semibold block mt-0.5">
                        *Mendekati 0.00% / minus semakin bagus (runner melampaui TP2)
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* CARD 3: PRESISI TIMING ENTRY (DRAWDOWN) */}
              {(() => {
                const score = Number(accuracyMetrics.scoreDrawdown || 0);
                const grade = score >= 75 ? "A" : score >= 55 ? "B" : score >= 40 ? "C" : "D";
                const statusText = score >= 70 ? "Normal (Timing Sangat Tajam)" : score >= 50 ? "Normal (Wajar)" : "Butuh Kalibrasi Entry";
                const badgeClass = score >= 75 ? "border-emerald-300 bg-emerald-50 text-emerald-800" : score >= 60 ? "border-blue-300 bg-blue-50 text-blue-800" : score >= 45 ? "border-amber-300 bg-amber-50 text-amber-800" : "border-rose-300 bg-rose-50 text-rose-800";
                return (
                  <div className="bg-white p-3.5 sm:p-4 rounded-lg border border-slate-200 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-bold text-slate-600 uppercase">Presisi Timing Entry</span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button type="button" className="text-slate-400 hover:text-slate-700 transition-colors focus:outline-none">
                              <HelpCircle className="h-3 w-3" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs bg-slate-900 text-slate-100 p-2.5 max-w-xs shadow-xl border border-slate-700">
                            <div className="font-bold text-rose-300 mb-1">Status: {statusText}</div>
                            <div className="text-[11px] text-slate-200">Range Ideal: 0.00% s/d -3.00% (Skor &gt;75).</div>
                            <div className="text-[10.5px] text-slate-400 mt-1">Mengukur kedalaman koreksi harga terendah setelah beli (MAE).</div>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Badge variant="outline" className={`text-[9px] px-1.5 py-0.2 font-mono font-bold ${badgeClass}`}>
                        Skor {score}/100 ({grade})
                      </Badge>
                    </div>
                    <div className="my-1.5 flex items-baseline justify-between">
                      <span className={`text-xl font-mono font-black ${Number(accuracyMetrics.avgGapEntryVsLow || 0) <= 0 ? "text-rose-600" : "text-emerald-600"}`}>
                        {Number(accuracyMetrics.avgGapEntryVsLow || 0) >= 0 ? "+" : ""}{accuracyMetrics.avgGapEntryVsLow || 0}%
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Floating Loss
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      <span className="block text-slate-500">Rata-rata koreksi terendah setelah beli</span>
                      <span className="text-[9.5px] italic font-semibold block mt-0.5">
                        *Semakin kecil minusnya (mendekati 0%) semakin bagus (minim drawdown)
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* CARD 4: PENYELAMATAN MODAL SL */}
              {(() => {
                const score = Number(accuracyMetrics.scoreSLProtection || 0);
                const grade = score >= 75 ? "A" : score >= 55 ? "B" : score >= 40 ? "C" : "D";
                const statusText = score >= 50 ? "Normal (Proteksi Aktif)" : "Butuh Kalibrasi SL";
                const badgeClass = score >= 70 ? "border-emerald-300 bg-emerald-50 text-emerald-800" : score >= 50 ? "border-blue-300 bg-blue-50 text-blue-800" : score >= 35 ? "border-amber-300 bg-amber-50 text-amber-800" : "border-rose-300 bg-rose-50 text-rose-800";
                return (
                  <div className="bg-white p-3.5 sm:p-4 rounded-lg border border-slate-200 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-bold text-slate-600 uppercase">Penyelamatan Modal SL</span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button type="button" className="text-slate-400 hover:text-slate-700 transition-colors focus:outline-none">
                              <HelpCircle className="h-3 w-3" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs bg-slate-900 text-slate-100 p-2.5 max-w-xs shadow-xl border border-slate-700">
                            <div className="font-bold text-emerald-300 mb-1">Status: {statusText}</div>
                            <div className="text-[11px] text-slate-200">Range Ideal: -0.50% s/d -5.00% (Skor &gt;60).</div>
                            <div className="text-[10.5px] text-slate-400 mt-1">Mengukur seberapa efektif Cut Loss menyelamatkan modal sebelum longsor sore.</div>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Badge variant="outline" className={`text-[9px] px-1.5 py-0.2 font-mono font-bold ${badgeClass}`}>
                        Skor {score}/100 ({grade})
                      </Badge>
                    </div>
                    <div className="my-1.5 flex items-baseline justify-between">
                      <span className={`text-xl font-mono font-black ${Number(accuracyMetrics.avgGapSLVsClose || 0) <= 0 ? "text-rose-600" : "text-emerald-600"}`}>
                        {Number(accuracyMetrics.avgGapSLVsClose || 0) >= 0 ? "+" : ""}{accuracyMetrics.avgGapSLVsClose || 0}%
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Cut Loss
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      <span className="block text-slate-500">Rata-rata penutupan sore vs harga SL</span>
                      <span className="text-[9.5px] font-semibold block mt-0.5 italic">
                        *Semakin minus semakin bagus (sukses cegah rugi lebih dalam)
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* CARD 5: KUALITAS EXIT TRAILING */}
              {(() => {
                const score = Number(accuracyMetrics.scoreTrailingEfficiency || 0);
                const grade = score >= 75 ? "A" : score >= 55 ? "B" : score >= 40 ? "C" : "D";
                const statusText = score >= 50 ? "Normal (Trailing Optimal)" : "Butuh Kalibrasi Trailing";
                const badgeClass = score >= 70 ? "border-emerald-300 bg-emerald-50 text-emerald-800" : score >= 50 ? "border-blue-300 bg-blue-50 text-blue-800" : score >= 35 ? "border-amber-300 bg-amber-50 text-amber-800" : "border-rose-300 bg-rose-50 text-rose-800";
                return (
                  <div className="bg-white p-3.5 sm:p-4 rounded-lg border border-slate-200 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-bold text-slate-600 uppercase">Kualitas Exit Trailing</span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button type="button" className="text-slate-400 hover:text-slate-700 transition-colors focus:outline-none">
                              <HelpCircle className="h-3 w-3" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs bg-slate-900 text-slate-100 p-2.5 max-w-xs shadow-xl border border-slate-700">
                            <div className="font-bold text-teal-300 mb-1">Status: {statusText}</div>
                            <div className="text-[11px] text-slate-200">Range Ideal: -0.30% s/d -3.00% (Skor &gt;65).</div>
                            <div className="text-[10.5px] text-slate-400 mt-1">Mengukur efektivitas Trailing Stop dalam mengunci profit di atas harga close sore.</div>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Badge variant="outline" className={`text-[9px] px-1.5 py-0.2 font-mono font-bold ${badgeClass}`}>
                        Skor {score}/100 ({grade})
                      </Badge>
                    </div>
                    <div className="my-1.5 flex items-baseline justify-between">
                      <span className={`text-xl font-mono font-black ${Number(accuracyMetrics.avgGapExitVsClose || 0) >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                        {Number(accuracyMetrics.avgGapExitVsClose || 0) >= 0 ? "+" : ""}{accuracyMetrics.avgGapExitVsClose || 0}%
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Trailing
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      <span className="block text-slate-500">Rata-rata penutupan sore vs exit trailing</span>
                      <span className="text-[9.5px] font-semibold block mt-0.5 italic">
                        *Semakin minus semakin bagus (sukses jual di atas harga sore)
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </TooltipProvider>

        {/* STATUS TABS NAVIGATOR */}
        <div className="flex items-center gap-1.5 px-4 pt-3 pb-1 border-b border-slate-100 overflow-x-auto whitespace-nowrap bg-slate-50/50">
          {STATUS_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t-md text-xs font-semibold transition-all border-b-2 ${isActive
                  ? "border-blue-600 bg-white text-blue-600 shadow-sm"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                  }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? "text-blue-600" : tab.color}`} />
                <span>{tab.label}</span>
                {isActive && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 text-blue-800 font-bold">
                    {pagination.total}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* TAB & PER-STRATEGY METRICS SUMMARY BAR */}
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
            {/* STRATEGY 1: SWING */}
            <div className="bg-white p-2.5 rounded-md border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 text-[10px] font-bold uppercase">
                <span className="text-blue-700">SWING</span>
                <Badge variant="outline" className="text-[9px] px-1 py-0 border-blue-200 bg-blue-50 text-blue-800">
                  {swingStats.count} sinyal
                </Badge>
              </div>
              <div className="mt-1 flex items-baseline justify-between font-mono">
                <span className="text-[11px] text-slate-500">Avg PnL:</span>
                <span className={`text-xs font-bold ${swingStats.avgPnL >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                  {swingStats.avgPnL >= 0 ? `+${swingStats.avgPnL}%` : `${swingStats.avgPnL}%`}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono text-right mt-0.5">
                Win Rate: <span className="font-bold text-slate-600">{swingStats.winRate}%</span>
              </div>
            </div>

            {/* STRATEGY 2: BSJP */}
            <div className="bg-white p-2.5 rounded-md border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 text-[10px] font-bold uppercase">
                <span className="text-emerald-700">BSJP</span>
                <Badge variant="outline" className="text-[9px] px-1 py-0 border-emerald-200 bg-emerald-50 text-emerald-800">
                  {bsjpStats.count} sinyal
                </Badge>
              </div>
              <div className="mt-1 flex items-baseline justify-between font-mono">
                <span className="text-[11px] text-slate-500">Avg PnL:</span>
                <span className={`text-xs font-bold ${bsjpStats.avgPnL >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                  {bsjpStats.avgPnL >= 0 ? `+${bsjpStats.avgPnL}%` : `${bsjpStats.avgPnL}%`}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono text-right mt-0.5">
                Win Rate: <span className="font-bold text-slate-600">{bsjpStats.winRate}%</span>
              </div>
            </div>

            {/* STRATEGY 3: ARA HUNTER */}
            <div className="bg-white p-2.5 rounded-md border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 text-[10px] font-bold uppercase">
                <span className="text-amber-700">ARA HUNTER</span>
                <Badge variant="outline" className="text-[9px] px-1 py-0 border-amber-200 bg-amber-50 text-amber-800">
                  {araStats.count} sinyal
                </Badge>
              </div>
              <div className="mt-1 flex items-baseline justify-between font-mono">
                <span className="text-[11px] text-slate-500">Avg PnL:</span>
                <span className={`text-xs font-bold ${araStats.avgPnL >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                  {araStats.avgPnL >= 0 ? `+${araStats.avgPnL}%` : `${araStats.avgPnL}%`}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono text-right mt-0.5">
                Win Rate: <span className="font-bold text-slate-600">{araStats.winRate}%</span>
              </div>
            </div>

            {/* METRIC 4: AVG HOLDING DAYS */}
            <div className="bg-white p-2.5 rounded-md border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-1 text-slate-500 text-[10px] font-bold uppercase">
                <Calendar className="h-3 w-3 text-slate-400" />
                <span>Avg Holding</span>
              </div>
              <div className="mt-1 text-xs font-mono font-extrabold text-slate-800">
                {tabMetrics.avgHoldingDays || 0} <span className="text-[10px] font-normal text-slate-500">Hari</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Durasi simpan rata-rata
              </div>
            </div>

            {/* METRIC 5: AVG RISK REWARD RATIO */}
            <div className="bg-white p-2.5 rounded-md border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-1 text-slate-500 text-[10px] font-bold uppercase">
                <Scale className="h-3 w-3 text-slate-400" />
                <span>Avg RRR</span>
              </div>
              <div className="mt-1 text-xs font-mono font-extrabold text-blue-600">
                1 : {tabMetrics.avgRiskReward || "2.00"}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Rasio Risk to Reward
              </div>
            </div>

            {/* METRIC 6: AVG SIGNAL SCORE */}
            <div className="bg-white p-2.5 rounded-md border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-1 text-slate-500 text-[10px] font-bold uppercase">
                <Award className="h-3 w-3 text-amber-500" />
                <span>Avg Score</span>
              </div>
              <div className="mt-1 text-xs font-mono font-extrabold text-amber-600">
                {tabMetrics.avgScore || 80} <span className="text-[10px] font-normal text-slate-400">/ 100</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Kualitas setup rata-rata
              </div>
            </div>
          </div>
        </div>

        {/* SIGNALS TABLE */}
        <CardContent className="pt-3 pb-2">
          <div className="relative overflow-x-auto">
            {loading && (
              <div className="absolute inset-0 bg-white/60 flex items-center justify-center text-xs text-blue-600 font-bold z-10">
                <RefreshCw className="h-4 w-4 animate-spin mr-2" /> Memuat data halaman {page}...
              </div>
            )}

            <Table className="text-xs w-full whitespace-nowrap">
              <TableHeader className="bg-slate-50">
                <TableRow className="hover:bg-transparent border-slate-200 text-slate-500 font-bold">
                  <TableHead className="py-2.5 px-3">Ticker</TableHead>
                  <TableHead className="py-2.5 px-3">Strategi</TableHead>
                  <TableHead className="py-2.5 px-3">Setup Mode</TableHead>
                  <TableHead className="text-right py-2.5 px-3">Entry Price</TableHead>
                  <TableHead className="text-right py-2.5 px-3">Target TP1</TableHead>
                  <TableHead className="text-right py-2.5 px-3">Target TP2</TableHead>
                  <TableHead className="text-right py-2.5 px-3">Stop Loss</TableHead>
                  <TableHead className="text-right py-2.5 px-3">Peak Price</TableHead>
                  <TableHead className="text-right py-2.5 px-3">Low Price</TableHead>
                  {activeTab === "TRAILING_WIN" && <TableHead className="text-right py-2.5 px-3">Exit Price</TableHead>}
                  <TableHead className="text-right py-2.5 px-3">Close Price</TableHead>
                  <TableHead className="text-center py-2.5 px-3">Score</TableHead>
                  <TableHead className="text-right py-2.5 px-3">Tanggal / Hold</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {signals.length === 0 && !loading ? (
                  <TableRow>
                    <TableCell colSpan={13} className="text-center py-8 text-slate-400">
                      Tidak ada sinyal dengan status <span className="font-bold text-slate-600">{activeTab}</span> pada filter saat ini.
                    </TableCell>
                  </TableRow>
                ) : (
                  signals.map((sig, idx) => {
                    const pnl = sig.realizedPnLPercent !== undefined ? sig.realizedPnLPercent : 0;
                    const isProfitable = pnl > 0;
                    const signalDateStr = sig.signalDate ? new Date(sig.signalDate).toLocaleDateString("id-ID") : "-";

                    // Holding duration
                    const holdDays = sig.holdingDays !== undefined && sig.holdingDays !== null
                      ? sig.holdingDays
                      : (sig.status !== "ACTIVE" && sig.status !== "PENDING" ? 1 : 0);
                    const holdDaysBadge = `${holdDays} hr`;

                    // Precise hit matching: TP1 only for HIT_TP1, TP2 only for HIT_TP2
                    const isHitTp1 = sig.status === "HIT_TP1";
                    const isHitTp2 = sig.status === "HIT_TP2";
                    const isHitSl = sig.status === "HIT_SL";
                    const isActive = sig.status === "ACTIVE";
                    const isPending = sig.status === "PENDING";
                    const isExpired = sig.status === "EXPIRED";
                    const isTrailingWin = (sig.status === "HIT_SL" || sig.status === "TRAILING_WIN") && pnl > 0;

                    const entryVal = Number(sig.entryPrice || sig.entry || 0);
                    const closeVal = Number(sig.currentPrice || entryVal);
                    const exitVal = sig.exitPrice ? Number(sig.exitPrice) : null;
                    const peakVal = sig.highSinceEntry ? Number(sig.highSinceEntry) : (entryVal > 0 ? entryVal : 0);
                    const lowVal = sig.lowSinceEntry ? Number(sig.lowSinceEntry) : (sig.status === "HIT_SL" ? Number(sig.exitPrice || sig.stopLoss || entryVal) : Number(sig.currentPrice || entryVal));

                    const peakDiff = entryVal > 0 && peakVal > 0 ? ((peakVal - entryVal) / entryVal) * 100 : 0;
                    const lowDiff = entryVal > 0 && lowVal > 0 ? ((lowVal - entryVal) / entryVal) * 100 : 0;
                    const closeDiff = entryVal > 0 && closeVal > 0 ? ((closeVal - entryVal) / entryVal) * 100 : 0;
                    const floatingDiff = entryVal > 0 && sig.currentPrice ? ((sig.currentPrice - entryVal) / entryVal) * 100 : 0;

                    const tp1Val = Number(sig.targetPrice1 || sig.tp1 || 0);
                    const tp2Val = Number(sig.targetPrice2 || sig.tp2 || 0);
                    const slVal = Number(sig.trailingStop || sig.stopLoss || sig.sl || 0);

                    const tp1Pct = entryVal > 0 && tp1Val > 0 ? ((tp1Val - entryVal) / entryVal) * 100 : 0;
                    const tp2Pct = entryVal > 0 && tp2Val > 0 ? ((tp2Val - entryVal) / entryVal) * 100 : 0;
                    const slPct = entryVal > 0 && slVal > 0 ? ((slVal - entryVal) / entryVal) * 100 : 0;

                    // Trailing trigger threshold calculation
                    const stratType = sig.strategyType || (sig.strategyId?.includes("SWING") ? "SWING" : sig.strategyId?.includes("BSJP") ? "BSJP" : (sig.strategyId?.includes("BOUNC") || sig.strategyId?.includes("REVERSAL")) ? "BOUNCING" : "ARA_HUNTER");
                    const triggerPct = stratType === "BSJP" ? 1.0 : stratType === "ARA_HUNTER" ? 1.5 : 2.0;
                    const trailingTriggerHigh = Math.round(entryVal * (1 + triggerPct / 100));
                    const isTrailingTriggered = sig.highSinceEntry && sig.highSinceEntry >= trailingTriggerHigh;

                    return (
                      <TableRow key={sig._id || idx} className="border-slate-100 hover:bg-slate-50">
                        {/* TICKER */}
                        <TableCell className="py-2.5 px-3">
                          <TickerDetailDialog ticker={sig.ticker} />
                        </TableCell>

                        {/* STRATEGY */}
                        <TableCell className="py-2.5 px-3">
                          <Badge
                            variant="outline"
                            className={
                              stratType === "SWING" || sig.strategyId?.includes("SWING")
                                ? "border-blue-200 bg-blue-50 text-blue-800 text-[10px]"
                                : stratType === "BSJP" || sig.strategyId?.includes("BSJP")
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-800 text-[10px]"
                                  : stratType === "BOUNCING" || stratType === "REVERSAL" || sig.strategyId?.includes("BOUNC") || sig.strategyId?.includes("REVERSAL")
                                    ? "border-purple-200 bg-purple-50 text-purple-800 text-[10px]"
                                    : "border-amber-200 bg-amber-50 text-amber-800 text-[10px]"
                            }
                          >
                            {stratType === "REVERSAL" ? "BOUNCING" : stratType.replace("_", " ")}
                          </Badge>
                        </TableCell>

                        {/* SETUP MODE */}
                        <TableCell className="font-mono text-[10px] text-slate-500 py-2.5 px-3">
                          {sig.setupMode || sig.setup || "DEFAULT"}
                        </TableCell>

                        {/* ENTRY PRICE */}
                        <TableCell className="text-right font-mono font-medium text-slate-700 py-2.5 px-3">
                          Rp {entryVal.toLocaleString("id-ID")}
                        </TableCell>

                        {/* TARGET TP1 CELL WITH HIT MARKER */}
                        <TableCell className="text-right py-2.5 px-3">
                          {isHitTp1 ? (
                            <div className="inline-flex items-center justify-end gap-1 font-mono font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-300 shadow-2xs">
                              <span>Rp {tp1Val.toLocaleString("id-ID")} (+{tp1Pct.toFixed(2)}%)</span>
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold bg-emerald-600 text-white rounded px-1.5 py-0.2">
                                <Check className="h-2.5 w-2.5 stroke-[3]" /> Hit TP1 ({holdDaysBadge})
                              </span>
                            </div>
                          ) : (
                            <span className="font-mono font-bold text-emerald-600">
                              Rp {tp1Val.toLocaleString("id-ID")}
                            </span>
                          )}
                        </TableCell>

                        {/* TARGET TP2 CELL WITH HIT MAX MARKER */}
                        <TableCell className="text-right py-2.5 px-3">
                          {isHitTp2 ? (
                            <div className="inline-flex items-center justify-end gap-1 font-mono font-extrabold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-300 shadow-2xs">
                              <span>Rp {tp2Val.toLocaleString("id-ID")} (+{tp2Pct.toFixed(2)}%)</span>
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold bg-indigo-600 text-white rounded px-1.5 py-0.2">
                                <Zap className="h-2.5 w-2.5 fill-white" /> Hit TP2 ({holdDaysBadge})
                              </span>
                            </div>
                          ) : (
                            <span className="font-mono font-bold text-indigo-600">
                              Rp {tp2Val.toLocaleString("id-ID")}
                            </span>
                          )}
                        </TableCell>

                        {/* STOP LOSS CELL */}
                        <TableCell className="text-right py-2.5 px-3">
                          {isHitSl && activeTab === "HIT_SL" ? (
                            <div className="inline-flex items-center justify-end gap-1 font-mono font-extrabold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-300">
                              <span>Rp {slVal.toLocaleString("id-ID")} ({slPct.toFixed(2)}%)</span>
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold bg-rose-600 text-white rounded px-1.5 py-0.2">
                                <ShieldAlert className="h-2.5 w-2.5" /> Hit SL ({holdDaysBadge})
                              </span>
                            </div>
                          ) : isActive ? (
                            <div className="text-right font-mono">
                              <div className="inline-flex items-center justify-end gap-1 text-rose-600">
                                <span className={`inline-flex items-center text-[9px] px-1 rounded font-bold border ${isTrailingTriggered ? 'text-emerald-700 bg-emerald-50 border-emerald-300' : 'text-amber-700 bg-amber-50 border-amber-200'}`}>
                                  <Zap className="h-2.5 w-2.5 mr-0.5 text-amber-500 fill-amber-500" />
                                  {isTrailingTriggered ? "Trailing BEP+" : "Trailing Ready"}
                                </span>
                                <span>Rp {slVal.toLocaleString("id-ID")}</span>
                              </div>
                              <div className="text-[9px] text-slate-400 mt-0.5" title={`Trailing aktif saat harga High mencapai minimal Rp ${trailingTriggerHigh.toLocaleString("id-ID")} (+${triggerPct}%)`}>
                                Trigger High: ≥ Rp {trailingTriggerHigh.toLocaleString("id-ID")} (+{triggerPct}%)
                              </div>
                            </div>
                          ) : (
                            <span className="font-mono text-rose-600 font-medium">
                              Rp {slVal.toLocaleString("id-ID")}
                            </span>
                          )}
                        </TableCell>

                        {/* PEAK PRICE */}
                        <TableCell className="text-right font-mono py-2.5 px-3">
                          {sig.highSinceEntry ? (
                            <div className={`inline-flex items-center justify-end gap-1 font-bold ${peakDiff > 0 ? "text-emerald-600" : peakDiff < 0 ? "text-rose-600" : "text-slate-700"
                              }`}>
                              {peakDiff > 0 ? (
                                <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600" />
                              ) : peakDiff < 0 ? (
                                <ArrowDownRight className="h-3.5 w-3.5 text-rose-600" />
                              ) : null}
                              <span>Rp {peakVal.toLocaleString("id-ID")}</span>
                              <span className="text-[10px] font-semibold">
                                ({peakDiff >= 0 ? "+" : ""}{peakDiff.toFixed(2)}%)
                              </span>
                            </div>
                          ) : (
                            <div className="text-slate-400 font-mono text-xs italic">-</div>
                          )}
                        </TableCell>

                        {/* LOW PRICE (ENTRY VS LOW / MAE) */}
                        <TableCell className="text-right font-mono py-2.5 px-3">
                          {lowVal > 0 ? (
                            <div className={`inline-flex items-center justify-end gap-1 font-bold ${lowDiff < 0 ? "text-rose-600" : "text-slate-700"}`}>
                              {lowDiff < 0 ? (
                                <ArrowDownRight className="h-3.5 w-3.5 text-rose-600" />
                              ) : (
                                <ArrowUpRight className="h-3.5 w-3.5 text-slate-400" />
                              )}
                              <span>Rp {lowVal.toLocaleString("id-ID")}</span>
                              <span className="text-[10px] font-semibold">
                                ({lowDiff >= 0 ? "+" : ""}{lowDiff.toFixed(2)}%)
                              </span>
                            </div>
                          ) : (
                            <div className="text-slate-400 font-mono text-xs italic">-</div>
                          )}
                        </TableCell>

                        {/* EXIT PRICE (SEPARATE FIELD FOR TRAILING_WIN) */}
                        {activeTab === "TRAILING_WIN" && exitVal && (
                          <TableCell className="text-right font-mono py-2.5 px-3">
                            <div className="inline-flex items-center justify-end gap-1 font-mono font-extrabold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-300 shadow-2xs">
                              <span>Rp {exitVal.toLocaleString("id-ID")} (+{pnl.toFixed(2)}%)</span>
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold bg-teal-600 text-white rounded px-1.5 py-0.2" title="Dynamic Trailing Stop berhasil mengunci floating profit!">
                                <Zap className="h-2.5 w-2.5 fill-white" /> Trailing ({holdDaysBadge})
                              </span>
                            </div>
                            {closeVal && closeVal !== exitVal && (
                              <div className="text-[9px] font-mono mt-0.5">
                                {closeVal < exitVal ? (
                                  <span className="text-rose-600 font-semibold" title="Exit trailing di harga lebih tinggi dari penutupan sore">
                                    🛡️ {(((closeVal - exitVal) / exitVal) * 100).toFixed(1)}% vs Close
                                  </span>
                                ) : (
                                  <span className="text-emerald-600 font-semibold" title="Harga penutupan sore lebih tinggi dibanding harga exit trailing">
                                    ↗ +{(((closeVal - exitVal) / exitVal) * 100).toFixed(1)}% vs Close
                                  </span>
                                )}
                              </div>
                            )}
                          </TableCell>
                        )}

                        {/* CLOSE PRICE */}
                        <TableCell className="text-right font-mono py-2.5 px-3">
                          <div className={`inline-flex items-center justify-end gap-1 font-bold ${closeDiff > 0 ? "text-emerald-600" : closeDiff < 0 ? "text-rose-600" : "text-slate-700"
                            }`}>
                            {closeDiff > 0 ? (
                              <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600" />
                            ) : closeDiff < 0 ? (
                              <ArrowDownRight className="h-3.5 w-3.5 text-rose-600" />
                            ) : null}
                            <span>Rp {closeVal.toLocaleString("id-ID")}</span>
                            <span className="text-[10px] font-semibold">
                              ({closeDiff >= 0 ? "+" : ""}{closeDiff.toFixed(2)}%)
                            </span>
                          </div>
                        </TableCell>

                        {/* SCORE */}
                        <TableCell className="text-center py-2.5 px-3">
                          <Badge className="bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-100 font-mono text-[10px]">
                            {sig.score || 80}
                          </Badge>
                        </TableCell>

                        {/* SIGNAL DATE & HOLDING DURATION */}
                        <TableCell className="text-right font-mono text-[11px] py-2.5 px-3">
                          <div className="text-slate-700 font-medium">{signalDateStr}</div>
                          <div className="text-[10px] text-slate-400 font-normal">
                            Hold: <span className="font-semibold text-slate-600">{holdDays} hr</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>

        {/* PAGINATION FOOTER */}
        <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 pt-3 pb-3 px-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>
              Menampilkan <strong className="text-slate-800">{signals.length > 0 ? (page - 1) * limit + 1 : 0}</strong> s/d{" "}
              <strong className="text-slate-800">{Math.min(page * limit, pagination.total)}</strong> dari{" "}
              <strong className="text-slate-800">{pagination.total}</strong> sinyal
            </span>
            <div className="flex items-center gap-1 ml-2">
              <span className="text-[11px] text-slate-400">Baris:</span>
              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="border border-slate-200 bg-slate-50 text-slate-800 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-600"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="h-7 px-2.5 text-xs border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Prev
            </Button>

            <span className="px-2 font-mono text-xs font-bold text-slate-700">
              Halaman {page} dari {pagination.totalPages || 1}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(pagination.totalPages || 1, p + 1))}
              disabled={page >= (pagination.totalPages || 1) || loading}
              className="h-7 px-2.5 text-xs border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </CardFooter>
      </Card>

    </>
  );
}
