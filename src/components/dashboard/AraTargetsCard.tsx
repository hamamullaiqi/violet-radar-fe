import React, { useState, useEffect } from "react";
import { PlusCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { formatRupiah } from "@/lib/utils";

export default function AraTargetsCard() {
  const [period, setPeriod] = useState<"1D" | "1W" | "3M" | "YTD">("1D");
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchMoversAra = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/api/market/movers/ara?limit=5&period=${period}`);
        if (res.data && res.data.data && active) {
          const rawList = res.data.data || [];
          const mapped = rawList.map((m: any) => ({
            ticker: m.ticker,
            status: m.statusTag,
            return1d: m.changePercent,
            turnover: m.value,
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
        <div className="relative">
          {loading && <div className="absolute inset-0 bg-white/50 flex items-center justify-center text-xs text-slate-500">Loading...</div>}
          <Table className="text-xs">
            <TableHeader className="bg-slate-50">
              <TableRow className="hover:bg-transparent">
                <TableHead>Ticker</TableHead>
                <TableHead>Status Radar</TableHead>
                <TableHead className="text-right">Return {period}</TableHead>
                <TableHead className="text-right">Value (IDR)</TableHead>
                <TableHead className="text-right">Net Asing</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.slice(0, 5).map((mover, idx) => (
                <TableRow key={idx} className="border-slate-100">
                  <TableCell className="font-bold text-slate-900">{mover.ticker}</TableCell>
                  <TableCell>
                    <Badge className={
                      mover.status === "ARA_LOCKED" ? "bg-emerald-600 text-white hover:bg-emerald-600 text-[9px] py-0.5" :
                        mover.status === "ARA_POTENTIAL" ? "bg-emerald-100 text-emerald-800 border-emerald-200 text-[9px] py-0.5" :
                          "bg-blue-50 text-blue-800 border-blue-200 text-[9px] py-0.5"
                    }>
                      {mover.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-emerald-600">+{mover.return1d}%</TableCell>
                  <TableCell className="text-right font-mono text-slate-400">{formatRupiah(mover.turnover)}</TableCell>
                  <TableCell className={`text-right font-mono font-bold ${mover.foreignNet >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {formatRupiah(mover.foreignNet, true)}
                  </TableCell>
                </TableRow>
              ))}
              {list.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4 text-slate-400">No data found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
