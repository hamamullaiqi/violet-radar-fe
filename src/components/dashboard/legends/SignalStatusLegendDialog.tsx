import { HelpCircle, Activity, ShieldCheck, Zap, Target, Clock, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export default function SignalStatusLegendDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          title="Panduan Status Sinyal & Trailing Stop"
          className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-100"
        >
          <HelpCircle className="h-4 w-4" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-xl bg-white border-slate-200 text-slate-900 shadow-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader className="border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            <DialogTitle className="text-base font-bold text-slate-900">
              Kamus Status Sinyal & Dynamic Trailing Stop
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4 text-xs text-slate-600 mt-2">
          {/* STATUS CARDS */}
          <div className="space-y-3">
            {/* ACTIVE */}
            <div className="p-3 rounded-lg border border-blue-100 bg-blue-50/50 space-y-1">
              <div className="flex items-center justify-between">
                <Badge className="bg-blue-600 text-white hover:bg-blue-600 text-[10px]">ACTIVE</Badge>
                <span className="font-bold text-blue-700 text-[11px]">Posisi Sedang Berjalan (Live)</span>
              </div>
              <p className="text-[11px] text-slate-600">
                Sinyal telah terkonfirmasi masuk dan posisi saat ini sedang aktif di pasar. Dilengkapi level Entry, TP1, TP2, serta pengawalan Dynamic Trailing Stop.
              </p>
            </div>

            {/* PENDING */}
            <div className="p-3 rounded-lg border border-amber-100 bg-amber-50/50 space-y-1">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="border-amber-300 text-amber-800 bg-amber-50 text-[10px] font-bold">
                  PENDING / WATCHLIST
                </Badge>
                <span className="font-bold text-amber-700 text-[11px]">Menunggu Open Market</span>
              </div>
              <p className="text-[11px] text-slate-600">
                Kandidat sinyal hasil screening sore/malam hari yang masuk dalam radar pengawasan (*watchlist*), menunggu konfirmasi volume dan aksi harga saat pembukaan bursa pukul 09:00 WIB.
              </p>
            </div>

            {/* HIT TP1 */}
            <div className="p-3 rounded-lg border border-emerald-100 bg-emerald-50/50 space-y-1">
              <div className="flex items-center justify-between">
                <Badge className="bg-emerald-600 text-white hover:bg-emerald-600 text-[10px]">HIT_TP1</Badge>
                <span className="font-bold text-emerald-700 text-[11px]">Target 1 Tercapai (Cuan 1)</span>
              </div>
              <p className="text-[11px] text-slate-600">
                Harga berhasil menyentuh level <strong>Take Profit 1</strong>. Direkomendasikan melakukan <em>partial profit taking</em> (misal amankan 50% lot) dan menaikkan Stop Loss ke harga modal (BEP).
              </p>
            </div>

            {/* HIT TP2 */}
            <div className="p-3 rounded-lg border border-indigo-100 bg-indigo-50/50 space-y-1">
              <div className="flex items-center justify-between">
                <Badge className="bg-indigo-600 text-white hover:bg-indigo-600 text-[10px]">HIT_TP2</Badge>
                <span className="font-bold text-indigo-700 text-[11px]">Max Target Tercapai (Full Win)</span>
              </div>
              <p className="text-[11px] text-slate-600">
                Harga menyentuh target maksimal <strong>Take Profit 2</strong>. Posisi telah sukses diselesaikan dengan hasil keuntungan optimal.
              </p>
            </div>

            {/* HIT SL */}
            <div className="p-3 rounded-lg border border-rose-100 bg-rose-50/50 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Badge className="bg-rose-600 text-white hover:bg-rose-600 text-[10px]">HIT_SL</Badge>
                  <Badge className="bg-emerald-600 text-white hover:bg-emerald-600 text-[10px]">HIT_SL (BEP+)</Badge>
                </div>
                <span className="font-bold text-rose-700 text-[11px]">Stop Loss / Trailing Exit</span>
              </div>
              <p className="text-[11px] text-slate-600">
                Harga menyentuh garis <strong>Stop Loss</strong> awal (PnL Negatif) <strong>ATAU</strong> menyentuh garis <strong>Dynamic Trailing Stop yang sudah naik ke atas harga modal (PnL Positif / Trailing Win)</strong> saat saham berbalik arah, sehingga floating profit berhasil terkunci dan modal trader terlindungi.
              </p>
            </div>

            {/* EXPIRED */}
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-1">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="border-slate-300 text-slate-700 bg-slate-100 text-[10px] font-bold">
                  EXPIRED
                </Badge>
                <span className="font-bold text-slate-600 text-[11px]">Batas Waktu Simpan Berakhir</span>
              </div>
              <p className="text-[11px] text-slate-600">
                Posisi ditutup otomatis karena telah mencapai batas maksimal periode penahanan (*Max Holding Days*) tanpa mengenai TP maupun SL.
              </p>
            </div>
          </div>

          {/* DYNAMIC TRAILING STOP EXPLANATION */}
          <div className="p-3 rounded-lg bg-slate-900 text-white space-y-2 mt-3">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs">
              <Zap className="h-4 w-4" />
              <span>Bagaimana Dynamic Trailing Stop Bekerja?</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Platform secara otomatis menaikkan garis proteksi Stop Loss seiring naiknya harga saham ke arah TP1 dan TP2. Jika saham berbalik turun setelah floating profit, trailing stop akan langsung mengunci keuntungan yang sudah didapat.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
