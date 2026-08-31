import React, { useState, useEffect } from "react";
import { Percent, HelpCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { api } from "@/lib/api";

export default function AraPatternsCard() {
  const [data, setData] = useState<any>({
    avgRvol: 0,
    avgClv: 0,
    gapUpSuccessRate: 0,
    byPriceFraction: []
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchPatterns = async () => {
      setLoading(true);
      try {
        const res = await api.get("/api/analytics/ara-patterns");
        if (res.data && res.data.data && active) {
          const apiData = res.data.data;
          const mapped = {
            avgRvol: apiData.averages?.avgRvol ?? 1.0,
            avgClv: apiData.averages?.avgClv ?? 0,
            gapUpSuccessRate: apiData.continuationRates?.overallContinuationRatePercent ?? 0,
            byPriceFraction: [
              { name: "< 200", count: apiData.priceBracketDistribution?.under200Count ?? 0 },
              { name: "200 - 500", count: apiData.priceBracketDistribution?.from200To500Count ?? 0 },
              { name: ">= 500", count: apiData.priceBracketDistribution?.above500Count ?? 0 }
            ]
          };
          setData(mapped);
        }
      } catch (e) {
        if (active) {
          setData({
            avgRvol: 0,
            avgClv: 0,
            gapUpSuccessRate: 0,
            byPriceFraction: []
          });
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchPatterns();
    return () => {
      active = false;
    };
  }, []);

  return (
    <Card className="border-slate-200 shadow-sm bg-white">
      <CardHeader>
        <div className="flex items-center gap-1.5">
          <Percent className="h-4.5 w-4.5 text-violet-600" />
          <CardTitle className="text-sm font-bold text-slate-800">ARA Pattern Recognition & D+1 Continuation</CardTitle>
          <Dialog>
            <DialogTrigger asChild>
              <button type="button" title="Lihat Panduan & Legend" className="text-slate-400 hover:text-slate-600 transition-colors p-0.5 rounded-full hover:bg-slate-100">
                <HelpCircle className="h-3.5 w-3.5" />
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-md bg-white border-slate-200 text-slate-900">
              <DialogHeader className="border-b border-slate-100 pb-2">
                <DialogTitle className="text-sm font-bold">Panduan Pola ARA & Kelanjutan D+1</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 text-xs pt-2">
                <div>
                  <p className="font-bold text-slate-800">RVOL & CLV</p>
                  <p className="text-slate-500 text-[11px]"><strong className="text-violet-600">RVOL:</strong> Lonjakan volume dibanding rata-rata 20 hari. <strong className="text-violet-600">CLV:</strong> Close Location Value (skor 0-1 posisi harga penutupan di pucuk candle).</p>
                </div>
                <div className="border-t border-slate-100 pt-2 space-y-1.5">
                  <p className="font-bold text-slate-800 text-[11px]">Klasifikasi Arah Pasca ARA (H+1):</p>
                  <div className="flex items-center gap-2"><Badge className="bg-purple-600 text-white text-[8px]">CONTINUED_ARA</Badge> <span className="text-[11px] text-slate-600">Lanjut mengunci ARA kembali di hari ke-2</span></div>
                  <div className="flex items-center gap-2"><Badge className="bg-emerald-600 text-white text-[8px]">GAP_UP_STRONG</Badge> <span className="text-[11px] text-slate-600">Dibuka loncat naik tinggi &ge; +5%</span></div>
                  <div className="flex items-center gap-2"><Badge className="bg-amber-500 text-white text-[8px]">NORMAL_PULLBACK</Badge> <span className="text-[11px] text-slate-600">Koreksi wajar / profit taking 0% s/d -5%</span></div>
                  <div className="flex items-center gap-2"><Badge className="bg-rose-600 text-white text-[8px]">DUMP_TRAP</Badge> <span className="text-[11px] text-slate-600">Jebakan guyuran tajam &gt; -5% hingga ARB</span></div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <CardDescription className="text-xs">Statistik pola volume dan keberhasilan kelanjutan arah harga pasca emiten ARA.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 relative">
        {loading && <div className="absolute inset-0 bg-white/50 flex items-center justify-center text-xs text-slate-500 z-10">Loading...</div>}
        <div className="grid grid-cols-3 gap-3 text-center text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
          <div>
            <span className="text-slate-400 text-[10px] font-bold block mb-1">Rata-rata RVOL</span>
            <strong className="text-slate-800 text-base">{data.avgRvol}x</strong>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] font-bold block mb-1">Rata-rata CLV</span>
            <strong className="text-slate-800 text-base">{data.avgClv}</strong>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] font-bold block mb-1">D+1 Gap-Up Success</span>
            <strong className="text-emerald-600 text-base">{data.gapUpSuccessRate}%</strong>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Distribusi Pola Berdasarkan Fraksi Harga IDX</h4>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.byPriceFraction} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} />
                <YAxis stroke="#94a3b8" fontSize={9} />
                <Tooltip contentStyle={{ fontFamily: "var(--font-open-sans)", fontSize: "10px" }} />
                <Bar dataKey="count" name="Jumlah ARA" fill="#4f46e5" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
