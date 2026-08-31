import React from "react";
import { HelpCircle, Scale } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export default function GrowthLossLegendDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          title="Panduan Komparasi Growth Leaders vs Losers"
          className="text-slate-400 hover:text-slate-600 transition-colors p-0.5 rounded-full hover:bg-slate-100"
        >
          <HelpCircle className="h-3.5 w-3.5" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-lg bg-white border-slate-200 text-slate-900 max-h-[85vh] overflow-y-auto">
        <DialogHeader className="border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-emerald-100 text-emerald-700">
              <Scale className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-sm font-bold text-slate-800">
                Panduan Komparasi: Growth Leaders vs Lose Leaders
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Evaluasi performa harga ekstrim, volatilitas rentang high-low, dan batas risiko drawdown.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3.5 text-xs pt-2">
          {/* Section: Penjelasan Kolom Penting */}
          <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
            <p className="font-bold text-slate-800">Penjelasan Kolom:</p>
            <ul className="space-y-1 text-[11px] text-slate-600 list-disc list-inside">
              <li>
                <strong className="text-slate-800 font-mono">High / Low Price:</strong> Harga tertinggi dan terendah yang pernah disentuh saham sepanjang periode terpilih (1D / 1W / 3M / YTD).
              </li>
              <li>
                <strong className="text-emerald-700 font-mono">Max Profit:</strong> Potensi kenaikan harga maksimum dari harga awal periode hingga titik puncak harga tertinggi.
              </li>
              <li>
                <strong className="text-rose-700 font-mono">Max DD (Drawdown):</strong> Penurunan harga terdalam dari titik puncak tertinggi menuju titik terendah.
              </li>
              <li>
                <strong className="text-slate-800 font-mono">Kinerja {'{period}'}:</strong> Persentase perubahan harga netto dari harga awal periode menuju harga terakhir saat ini.
              </li>
            </ul>
          </div>

          {/* Section: Gainers Verdict */}
          <div className="space-y-1.5">
            <p className="font-bold text-emerald-700 flex items-center gap-1.5">
              <span>📈 Klasifikasi Growth Verdict (Gainers):</span>
            </p>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between p-2 rounded border border-emerald-100 bg-emerald-50/40">
                <Badge className="bg-emerald-600 text-white text-[8px] font-bold">SUPER_GROWTH</Badge>
                <span className="text-[11px] text-slate-600 font-medium">Kenaikan harga netto <strong className="text-emerald-700">&ge; +50%</strong></span>
              </div>
              <div className="flex items-center justify-between p-2 rounded border border-emerald-100 bg-emerald-50/40">
                <Badge className="bg-emerald-500 text-white text-[8px] font-bold">STRONG_GROWTH</Badge>
                <span className="text-[11px] text-slate-600 font-medium">Kenaikan harga netto <strong className="text-emerald-700">+20% s/d +50%</strong></span>
              </div>
              <div className="flex items-center justify-between p-2 rounded border border-teal-100 bg-teal-50/40">
                <Badge className="bg-teal-500 text-white text-[8px] font-bold">MODERATE_GROWTH</Badge>
                <span className="text-[11px] text-slate-600 font-medium">Kenaikan harga netto <strong className="text-teal-700">+5% s/d +20%</strong></span>
              </div>
            </div>
          </div>

          {/* Section: Losers Verdict */}
          <div className="space-y-1.5">
            <p className="font-bold text-rose-700 flex items-center gap-1.5">
              <span>📉 Klasifikasi Loss Verdict (Losers):</span>
            </p>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between p-2 rounded border border-amber-100 bg-amber-50/40">
                <Badge className="bg-amber-600 text-white text-[8px] font-bold">MODERATE_LOSS</Badge>
                <span className="text-[11px] text-slate-600 font-medium">Penurunan harga netto <strong className="text-amber-700">-5% s/d -15%</strong></span>
              </div>
              <div className="flex items-center justify-between p-2 rounded border border-rose-100 bg-rose-50/40">
                <Badge className="bg-rose-500 text-white text-[8px] font-bold">HEAVY_LOSS</Badge>
                <span className="text-[11px] text-slate-600 font-medium">Penurunan harga netto <strong className="text-rose-700">-15% s/d -30%</strong></span>
              </div>
              <div className="flex items-center justify-between p-2 rounded border border-rose-200 bg-rose-50/60">
                <Badge className="bg-rose-700 text-white text-[8px] font-bold">SEVERE_LOSS</Badge>
                <span className="text-[11px] text-slate-600 font-medium">Keruntuhan harga netto <strong className="text-rose-800">&lt; -30%</strong></span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
