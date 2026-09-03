"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Flame, RefreshCw, Clock, ArrowUpRight, TrendingUp, Sparkles, ExternalLink, ShieldAlert, Info } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import useFetch from "@/hooks/useFetch";
import { api } from "@/lib/api";
import { formatRupiah } from "@/lib/utils";

interface AraCandidate {
  ticker: string;
  stockName: string;
  close: number;
  open: number;
  high: number;
  low: number;
  previous: number;
  change: number;
  changePercent: number;
  volume: number;
  value: number;
  frequency: number;
  clv: number;
  araLimitPrice: number;
  araPercent: number;
  remainingToAra: number;
  foreignNet: number;
  score: number;
  tier: string;
  tierColor: "rose" | "amber" | "emerald";
  buyWindow: string;
}

export default function AraPotentialCard() {
  const { data, loading, refetch } = useFetch("/api/market/ara-potential?limit=10");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshMsg, setRefreshMsg] = useState<string | null>(null);

  const candidates: AraCandidate[] = data?.candidates || [];
  const evalDate = data?.evalDate || "";
  const isPreClosingWindow = data?.isPreClosingWindow || false;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setRefreshMsg(null);
    try {
      await api.post("/api/market/ara-potential/refresh");
      await refetch();
      setRefreshMsg("Data kandidat sore berhasil diperbarui!");
      setTimeout(() => setRefreshMsg(null), 3000);
    } catch {
      setRefreshMsg("Gagal memperbarui data sore.");
      setTimeout(() => setRefreshMsg(null), 3000);
    } finally {
      setIsRefreshing(false);
    }
  };

  const getTierBadge = (score: number) => {
    if (score >= 80) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
          🔥 SUPER POTENSIAL
        </span>
      );
    }
    if (score >= 65) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          ⚡ CALON ARA KUAT
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        🟢 BSJP READY
      </span>
    );
  };

  return (
    <Card className="border-slate-200 shadow-sm bg-white overflow-hidden relative">
      {/* Top Banner Accent */}
      <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600" />

      <CardHeader className="p-4 sm:p-5 pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="w-7 h-7 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shadow-xs">
                <Flame className="w-4 h-4 text-rose-600 animate-pulse" />
              </div>
              <CardTitle className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                Radar Calon ARA (Beli Sore / BSJP)
              </CardTitle>

              {isPreClosingWindow ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  SESI BELI SORE AKTIF (15:30 WIB)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                  <Clock className="w-3 h-3 text-slate-400" />
                  Jadwal Beli: 15:30 – 15:50 WIB
                </span>
              )}
            </div>

            <CardDescription className="text-xs text-slate-500 leading-normal">
              Skrining saham momentum tinggi, tutup dekat batas harga tertinggi (CLV &ge; 0.65), dan belum terkunci ARA untuk persiapan strategi <b>Beli Sore Jual Pagi</b>.
            </CardDescription>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <Dialog>
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-700 transition-colors text-xs flex items-center gap-1"
                  title="Panduan Kriteria Calon ARA"
                >
                  <Info className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Kriteria</span>
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-sm font-bold flex items-center gap-2">
                    <Flame className="w-4 h-4 text-rose-500" />
                    Kriteria Saham Calon ARA & Beli Sore
                  </DialogTitle>
                </DialogHeader>
                <div className="text-xs text-slate-600 space-y-2.5 pt-2">
                  <p>
                    Radar ini dirancang khusus untuk mendeteksi saham seperti <b>#SRSN</b> yang menunjukkan pola akumulasi dan penutupan kuat di sore hari menjelang *pre-closing*:
                  </p>
                  <ul className="space-y-1.5 list-disc pl-4 text-slate-700">
                    <li><b>CLV Tinggi (&ge; 0.65)</b>: Harga penutupan terkonsentrasi di 35% teratas rentang harian (tekanan beli dominan).</li>
                    <li><b>Belum Kunci ARA</b>: Saham masih memiliki ruang (*room to run*) minimal +2% s.d. batas ARA harian.</li>
                    <li><b>Likuiditas Riil</b>: Nilai transaksi minimal Rp 500 Juta untuk memastikan keamanan keluar-masuk dana.</li>
                    <li><b>Waktu Eksekusi Optimal</b>: Pukul <b>15:30 – 15:50 WIB</b> pada sesi *pre-closing* IDX.</li>
                  </ul>
                </div>
              </DialogContent>
            </Dialog>

            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing || loading}
              className="h-8 px-2.5 text-xs font-bold text-slate-700 border-slate-200 hover:bg-slate-100 flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-indigo-600" : ""}`} />
              <span>{isRefreshing ? "Memperbarui..." : "Update Sore (15:30)"}</span>
            </Button>
          </div>
        </div>

        {refreshMsg && (
          <div className="mt-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold animate-in fade-in-50">
            {refreshMsg}
          </div>
        )}
      </CardHeader>

      <CardContent className="p-0 sm:p-0">
        {loading && candidates.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-indigo-500 mb-2" />
            Memuat kandidat calon ARA dan data sesi sore...
          </div>
        ) : candidates.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 space-y-1">
            <p className="font-bold text-slate-700">Tidak ada kandidat Calon ARA yang memenuhi kriteria ketat saat ini.</p>
            <p className="text-slate-400">Pantau kembali menjelang pukul 15:30 WIB saat likuiditas pre-closing meningkat.</p>
          </div>
        ) : (
          <div>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/80 border-y border-slate-100">
                  <TableRow>
                    <TableHead className="w-[180px] text-xs font-bold text-slate-700">Emiten</TableHead>
                    <TableHead className="text-xs font-bold text-slate-700 text-right">Harga & Chg</TableHead>
                    <TableHead className="text-xs font-bold text-slate-700 text-center">Sisa ke ARA</TableHead>
                    <TableHead className="text-xs font-bold text-slate-700 text-center">Kekuatan CLV</TableHead>
                    <TableHead className="text-xs font-bold text-slate-700 text-right">Turnover (Rp)</TableHead>
                    <TableHead className="text-xs font-bold text-slate-700 text-center">Tier Status</TableHead>
                    <TableHead className="text-xs font-bold text-slate-700 text-center w-[100px]">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {candidates.map((c) => (
                    <TableRow key={c.ticker} className="hover:bg-slate-50/80 transition-colors">
                      <TableCell className="py-2.5">
                        <Link
                          href={`/ticker/${c.ticker}`}
                          className="font-extrabold text-indigo-600 hover:text-indigo-800 text-xs flex items-center gap-1 group"
                        >
                          <span className="group-hover:underline">#{c.ticker}</span>
                          <ArrowUpRight className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity" />
                        </Link>
                        <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
                          {c.stockName}
                        </div>
                      </TableCell>

                      <TableCell className="text-right py-2.5 font-mono">
                        <div className="font-black text-slate-900 text-xs">
                          Rp {c.close.toLocaleString("id-ID")}
                        </div>
                        <div className="text-[11px] font-bold text-emerald-600">
                          +{c.changePercent}%
                        </div>
                      </TableCell>

                      <TableCell className="text-center py-2.5">
                        <div className="inline-flex flex-col items-center">
                          <span className="font-extrabold text-xs text-rose-600">
                            +{c.remainingToAra}%
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Limit: Rp {c.araLimitPrice.toLocaleString("id-ID")}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="text-center py-2.5">
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-800">
                          <span>{Math.round(c.clv * 100)}%</span>
                          <span className="text-[9px] text-emerald-600 font-normal">
                            {c.clv >= 0.85 ? "Dekat High" : "Atas"}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="text-right py-2.5 font-mono text-xs text-slate-700">
                        <div className="font-bold">{formatRupiah(c.value)}</div>
                        <div className="text-[10px] text-slate-400">
                          {c.foreignNet > 0 ? (
                            <span className="text-emerald-600 font-semibold">Net Buy Asing</span>
                          ) : (
                            <span>Domestik</span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="text-center py-2.5">
                        {getTierBadge(c.score)}
                      </TableCell>

                      <TableCell className="text-center py-2.5">
                        <Link
                          href={`/ticker/${c.ticker}?tab=chart`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 border border-slate-200 transition-colors"
                        >
                          <span>Chart</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden divide-y divide-slate-100">
              {candidates.map((c) => (
                <div key={c.ticker} className="p-3.5 space-y-2.5 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link
                        href={`/ticker/${c.ticker}`}
                        className="font-black text-indigo-600 text-sm inline-flex items-center gap-1"
                      >
                        #{c.ticker}
                        <ArrowUpRight className="w-3.5 h-3.5 text-indigo-400" />
                      </Link>
                      <div className="text-[10px] text-slate-400 truncate max-w-[180px]">
                        {c.stockName}
                      </div>
                    </div>
                    {getTierBadge(c.score)}
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center p-2 rounded-xl bg-slate-50/80 border border-slate-100 text-xs">
                    <div>
                      <div className="text-[10px] text-slate-400 font-medium">Harga</div>
                      <div className="font-black text-slate-900 font-mono">
                        {c.close.toLocaleString("id-ID")}
                      </div>
                      <div className="text-[10px] font-bold text-emerald-600">
                        +{c.changePercent}%
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-medium">Sisa ke ARA</div>
                      <div className="font-black text-rose-600 font-mono">
                        +{c.remainingToAra}%
                      </div>
                      <div className="text-[9px] text-slate-400">
                        Rp {c.araLimitPrice.toLocaleString("id-ID")}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-medium">Kekuatan CLV</div>
                      <div className="font-black text-slate-800 font-mono">
                        {Math.round(c.clv * 100)}%
                      </div>
                      <div className="text-[9px] text-emerald-600">
                        {c.clv >= 0.85 ? "Dekat High" : "Atas"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-0.5">
                    <div className="text-[11px] text-slate-500 font-mono">
                      Turnover: <b className="text-slate-800">{formatRupiah(c.value)}</b>
                    </div>
                    <Link
                      href={`/ticker/${c.ticker}?tab=chart`}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
                    >
                      Buka Chart & Detail →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Note */}
        <div className="p-3 bg-slate-50/70 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Data pasar dievaluasi per: <b>{evalDate}</b></span>
          </span>
          <span className="text-slate-400 hidden sm:inline">
            Tips: Amati kedalaman antrean bid pada 15:40 WIB sebelum memasukkan order sore.
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
