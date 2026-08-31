import React, { useState, useEffect } from "react";
import { PlusCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import AraArbLegendDialog from "@/components/dashboard/legends/AraArbLegendDialog";
import { api } from "@/lib/api";
import { formatRupiah } from "@/lib/utils";

const getAraStatusBadge = (status: string) => {
  switch (status) {
    case "ARA_LOCKED":
      return "bg-emerald-600 text-white hover:bg-emerald-600";
    case "ARA_POTENTIAL":
      return "border border-emerald-300 text-emerald-800 bg-emerald-50";
    case "STRONG_MOMENTUM":
      return "border border-blue-300 text-blue-800 bg-blue-50";
    case "STRONG_ACCUMULATION":
      return "border border-indigo-300 text-indigo-800 bg-indigo-50";
    default:
      return "bg-slate-100 text-slate-700";
  }
};

export default function AraTargetsCard() {
  const [period, setPeriod] = useState<"1D" | "1W" | "3M" | "YTD">("1D");
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchMoversAra = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/api/market/movers/ara?period=${period}&limit=5`);
        if (res.data && res.data.data && active) {
          const rawList = res.data.data || [];
          const mapped = rawList.map((m: any) => ({
            ticker: m.ticker,
            status: m.statusTag || m.status,
            clv: m.clv !== undefined ? Number(m.clv) : 1.0,
            return1d: m.changePercent,
            turnover: m.value || m.turnover,
            foreignNet: m.foreignNet
          }));
          setList(mapped);
        }
      } catch (e) {
        console.error("fetchMoversAra error:", e);
        if (active) {
          setList([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchMoversAra();
    return () => {
      active = false;
    };
  }, [period]);

  return (
    <Card className="border-slate-200 shadow-sm bg-white">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <PlusCircle className="h-4.5 w-4.5 text-emerald-600" />
            <CardTitle className="text-sm font-bold text-slate-800">ARA Targets (Upside Momentum)</CardTitle>
            <AraArbLegendDialog />
          </div>
          <CardDescription className="text-[10px]">Peta emiten teraktif dengan status ARA_LOCKED atau ARA_POTENTIAL.</CardDescription>
        </div>
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded border border-slate-200 text-[10px] font-bold">
          {(["1D", "1W", "3M", "YTD"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`px-1.5 py-0.5 rounded-sm transition-all ${period === p
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-400 hover:text-slate-600"
                }`}
            >
              {p}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative overflow-x-auto">
          {loading && <div className="absolute inset-0 bg-white/50 flex items-center justify-center text-xs text-slate-500 z-10">Loading...</div>}
          <Table className="text-xs w-full whitespace-nowrap">
            <TableHeader className="bg-slate-50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="py-2.5 px-3">Ticker</TableHead>
                <TableHead className="py-2.5 px-3">Status Radar</TableHead>
                <TableHead className="text-right py-2.5 px-3">CLV</TableHead>
                <TableHead className="text-right py-2.5 px-3">Return {period}</TableHead>
                <TableHead className="text-right py-2.5 px-3">Value (IDR)</TableHead>
                <TableHead className="text-right py-2.5 px-3">Net Asing</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.slice(0, 5).map((mover, idx) => (
                <TableRow key={idx} className="border-slate-100">
                  <TableCell className="font-bold text-slate-900 py-2.5 px-3">{mover.ticker}</TableCell>
                  <TableCell className="py-2.5 px-3">
                    <Badge className={`${getAraStatusBadge(mover.status)} text-[9px] py-0.5 whitespace-nowrap font-bold`}>
                      {mover.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold py-2.5 px-3">
                    <span className={mover.clv >= 0.85 ? "text-emerald-600" : mover.clv >= 0.5 ? "text-blue-600" : "text-amber-600"}>
                      {Number(mover.clv).toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-emerald-600 py-2.5 px-3">+{mover.return1d}%</TableCell>
                  <TableCell className="text-right font-mono text-slate-400 py-2.5 px-3">{formatRupiah(mover.turnover)}</TableCell>
                  <TableCell className={`text-right font-mono font-bold py-2.5 px-3 ${mover.foreignNet >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {formatRupiah(mover.foreignNet, true)}
                  </TableCell>
                </TableRow>
              ))}
              {list.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4 text-slate-400">No data found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
