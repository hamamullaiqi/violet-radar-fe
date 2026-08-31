import React from "react";
import { HelpCircle, Zap } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export default function AraArbLegendDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          title="Panduan Komparasi ARA vs ARB"
          className="text-slate-400 hover:text-slate-600 transition-colors p-0.5 rounded-full hover:bg-slate-100"
        >
          <HelpCircle className="h-3.5 w-3.5" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-lg bg-white border-slate-200 text-slate-900 max-h-[85vh] overflow-y-auto">
        <DialogHeader className="border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-amber-100 text-amber-700">
              <Zap className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-sm font-bold text-slate-800">
                Panduan Komparasi: ARA vs ARB Targets
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Memetakan emiten dengan volatilitas ekstrem, tekanan beli absolut (ARA), dan tekanan jual panik (ARB).
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3.5 text-xs pt-2">
          {/* Section: Penjelasan Kolom Penting */}
          <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
            <p className="font-bold text-slate-800">Penjelasan Kolom Indikator:</p>
            <ul className="space-y-1 text-[11px] text-slate-600 list-disc list-inside">
              <li>
                <strong className="text-violet-700 font-mono">CLV (Close Location Value):</strong> Skor rentang 0 s/d 1 yang mengukur posisi harga penutupan terhadap rentang High-Low harian.
                <span className="block pl-4 text-slate-500 italic">&bull; CLV &ge; 0.85: Penutupan di pucuk candle (kekuatan beli mutlak).</span>
                <span className="block pl-4 text-slate-500 italic">&bull; CLV &le; 0.15: Penutupan di dasar candle (tekanan buang mutlak).</span>
              </li>
              <li>
                <strong className="text-slate-800 font-mono">Return 1D / 1W:</strong> Persentase fluktuasi harga dalam periode terpilih.
              </li>
              <li>
                <strong className="text-slate-800 font-mono">Net Asing:</strong> Nilai bersih beli/jual investor asing yang menyertai pergerakan harga.
              </li>
            </ul>
          </div>

          {/* Section: Status ARA */}
          <div className="space-y-1.5">
            <p className="font-bold text-emerald-700 flex items-center gap-1.5">
              <span>🚀 Klasifikasi Status ARA (Upside Momentum):</span>
            </p>
            <div className="space-y-1.5">
              <div className="flex items-start gap-2 p-2 rounded border border-emerald-100 bg-emerald-50/40">
                <Badge className="bg-emerald-600 text-white text-[8px] shrink-0 font-bold">ARA_LOCKED</Badge>
                <p className="text-[11px] text-slate-600">Saham menyentuh batas auto rejection atas (+20% s/d +35%) dan terkunci antrean bid beli.</p>
              </div>
              <div className="flex items-start gap-2 p-2 rounded border border-emerald-100 bg-emerald-50/40">
                <Badge variant="outline" className="border-emerald-300 text-emerald-800 bg-emerald-50 text-[8px] shrink-0 font-bold">ARA_POTENTIAL</Badge>
                <p className="text-[11px] text-slate-600">Kenaikan &ge; +12% dengan CLV &ge; 0.70 yang berpotensi menyentuh ARA sebelum market tutup.</p>
              </div>
              <div className="flex items-start gap-2 p-2 rounded border border-blue-100 bg-blue-50/40">
                <Badge variant="outline" className="border-blue-300 text-blue-800 bg-blue-50 text-[8px] shrink-0 font-bold">STRONG_MOMENTUM</Badge>
                <p className="text-[11px] text-slate-600">Kenaikan harga &ge; +8% didorong CLV tinggi di atas 0.75.</p>
              </div>
            </div>
          </div>

          {/* Section: Status ARB */}
          <div className="space-y-1.5">
            <p className="font-bold text-rose-700 flex items-center gap-1.5">
              <span>🔻 Klasifikasi Status ARB (Downside Pressure):</span>
            </p>
            <div className="space-y-1.5">
              <div className="flex items-start gap-2 p-2 rounded border border-rose-100 bg-rose-50/40">
                <Badge className="bg-rose-600 text-white text-[8px] shrink-0 font-bold">ARB_LOCKED</Badge>
                <p className="text-[11px] text-slate-600">Saham menyentuh batas auto rejection bawah (-20% s/d -35%) dan terkunci antrean offer jual.</p>
              </div>
              <div className="flex items-start gap-2 p-2 rounded border border-rose-100 bg-rose-50/40">
                <Badge variant="outline" className="border-rose-300 text-rose-800 bg-rose-50 text-[8px] shrink-0 font-bold">PANIC_DUMP</Badge>
                <p className="text-[11px] text-slate-600">Tekanan jual panik &le; -6% dengan volume buangan tinggi tanpa perlawanan bid.</p>
              </div>
              <div className="flex items-start gap-2 p-2 rounded border border-amber-100 bg-amber-50/40">
                <Badge variant="outline" className="border-amber-300 text-amber-800 bg-amber-50 text-[8px] shrink-0 font-bold">BARGAIN_HUNTING</Badge>
                <p className="text-[11px] text-slate-600">Saham terkoreksi &le; -6% tetapi asing mulai menampung (Net Buy &gt; Rp 1 Miliar).</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
