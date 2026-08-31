import React from "react";
import { HelpCircle, ArrowLeftRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export default function ForeignFlowLegendDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          title="Panduan Komparasi Akumulasi vs Distribusi Asing"
          className="text-slate-400 hover:text-slate-600 transition-colors p-0.5 rounded-full hover:bg-slate-100"
        >
          <HelpCircle className="h-3.5 w-3.5" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-lg bg-white border-slate-200 text-slate-900 max-h-[85vh] overflow-y-auto">
        <DialogHeader className="border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-blue-100 text-blue-700">
              <ArrowLeftRight className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-sm font-bold text-slate-800">
                Panduan Komparasi: Foreign Inflow vs Outflow
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Mendeteksi rotasi dana besar investor institusi asing (Smart Money Flow) di Bursa Efek Indonesia.
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
                <strong className="text-slate-800 font-mono">First / Last Price:</strong> Harga penutupan di hari pertama periode terpilih vs harga terakhir saat ini.
              </li>
              <li>
                <strong className="text-slate-800 font-mono">Chg (%):</strong> Persentase perubahan harga netto selama rentang periode.
              </li>
              <li>
                <strong className="text-slate-800 font-mono">Flow {'{period}'}:</strong> Total nominal akumulasi bersih (Inflow/Hijau) atau distribusi bersih (Outflow/Merah) investor asing.
              </li>
              <li>
                <strong className="text-blue-700 font-mono">Dominasi (F vs D):</strong> Persentase perbandingan porsi perputaran uang antara Foreign (Investor Asing) dan Domestic (Investor Lokal).
              </li>
            </ul>
          </div>

          {/* Section: Tier Akumulasi */}
          <div className="space-y-1.5">
            <p className="font-bold text-blue-700 flex items-center gap-1.5">
              <span>📥 Klasifikasi Tier Akumulasi (Inflow):</span>
            </p>
            <div className="space-y-1.5">
              <div className="flex items-start gap-2 p-2 rounded border border-purple-100 bg-purple-50/40">
                <Badge variant="outline" className="border-purple-300 bg-purple-100 text-purple-800 text-[8px] shrink-0 font-bold">SUPER_ACCUMULATION</Badge>
                <p className="text-[11px] text-slate-600">Net buy asing masif &ge; Rp 100 Miliar, atau dominasi pembelian &ge; 75% hari bursa (&gt; Rp 20 M).</p>
              </div>
              <div className="flex items-start gap-2 p-2 rounded border border-indigo-100 bg-indigo-50/40">
                <Badge variant="outline" className="border-indigo-300 bg-indigo-100 text-indigo-800 text-[8px] shrink-0 font-bold">STRONG_ACCUMULATION</Badge>
                <p className="text-[11px] text-slate-600">Net buy asing kuat &ge; Rp 30 Miliar, atau dominasi &ge; 60% hari bursa (&gt; Rp 10 M).</p>
              </div>
              <div className="flex items-start gap-2 p-2 rounded border border-blue-100 bg-blue-50/40">
                <Badge variant="outline" className="border-blue-300 bg-blue-100 text-blue-800 text-[8px] shrink-0 font-bold">MODERATE_ACCUMULATION</Badge>
                <p className="text-[11px] text-slate-600">Net buy asing berkisar antara Rp 10 Miliar s/d Rp 30 Miliar.</p>
              </div>
            </div>
          </div>

          {/* Section: Tier Distribusi */}
          <div className="space-y-1.5">
            <p className="font-bold text-rose-700 flex items-center gap-1.5">
              <span>📤 Klasifikasi Tier Distribusi (Outflow):</span>
            </p>
            <div className="space-y-1.5">
              <div className="flex items-start gap-2 p-2 rounded border border-rose-100 bg-rose-50/40">
                <Badge variant="outline" className="border-rose-300 bg-rose-100 text-rose-800 text-[8px] shrink-0 font-bold">DISTRIBUTION</Badge>
                <p className="text-[11px] text-slate-600">Tekanan jual bersih asing signifikan (&le; -Rp 10 Miliar) yang mengalir keluar dari saham.</p>
              </div>
              <div className="flex items-start gap-2 p-2 rounded border border-slate-200 bg-slate-50/60">
                <Badge variant="outline" className="border-slate-300 text-slate-700 text-[8px] shrink-0 font-bold">NEUTRAL</Badge>
                <p className="text-[11px] text-slate-600">Arus beli dan jual asing relatif berimbang tanpa tren dominasi khusus.</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
