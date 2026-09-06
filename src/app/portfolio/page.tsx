"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  ArrowLeft,
  Wallet,
  LogOut,
  User as UserIcon,
  Shield,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import TradePortfolioMonitoringCard from "@/components/dashboard/TradePortfolioMonitoringCard";
import SearchTickers from "@/components/SearchTickers";

export default function PortfolioPage() {
  const router = useRouter();
  const { user, logout, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500 font-medium">Memuat Portofolio...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    if (typeof window !== "undefined") {
      router.push("/login");
    }
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* FOCUSED NAVBAR */}
      <nav className="border-b border-slate-200 bg-white sticky top-0 z-50 px-4 sm:px-6 py-3 flex items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/")}
            className="flex items-center gap-1.5 text-xs font-bold border-slate-200 text-slate-700 hover:bg-slate-100 h-8 px-2.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Kembali ke Radar Pasar</span>
          </Button>

          <div className="h-4 w-px bg-slate-200 hidden sm:block"></div>

          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-black text-sm sm:text-base tracking-tight text-slate-900">
                  MONITORING PORTOFOLIO
                </h1>
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] font-bold py-0">
                  REAL COCKPIT
                </Badge>
              </div>
              <p className="text-[10px] text-slate-500 font-medium hidden sm:block">
                Manajemen Kas RDN, 3-Slot Anti-Overtrade & Jurnal Eksekusi
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 max-w-xs sm:max-w-sm flex justify-center sm:justify-start">
          <SearchTickers />
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* User Profile */}
          <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
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
                  <DialogDescription>Informasi akun pengguna Anda.</DialogDescription>
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
                    <span className="text-slate-400">Role:</span>
                    <span className="col-span-2">
                      <Badge className="bg-blue-600 text-white font-medium text-[10px] py-0 px-2">{user.role}</Badge>
                    </span>
                  </div>
                </div>
                <DialogFooter className="w-full">
                  <Button onClick={logout} variant="outline" className="w-full border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-semibold text-xs h-9">
                    <LogOut className="h-4 w-4 mr-1.5" /> Keluar dari Akun
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </nav>

      {/* BODY CONTENT */}
      <main className="flex-1 p-4 md:p-6 max-w-[1680px] mx-auto w-full space-y-6">
        <TradePortfolioMonitoringCard />
      </main>
    </div>
  );
}
