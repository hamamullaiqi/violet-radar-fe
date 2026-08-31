import React, { useState, useEffect } from "react";
import { Upload } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { formatRupiah } from "@/lib/utils";

export default function ForeignDistributionCard() {
  const [period, setPeriod] = useState<"1D" | "1W" | "3M" | "YTD">("1W");
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchForeignDistrib = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/api/market/accumulation/foreign-distrib?period=${period}&limit=5`);
        if (res.data && res.data.data && active) {
          const rawList = res.data.data || [];
          const mapped = rawList.map((f: any) => ({
            ticker: f.ticker,
            buy1d: f.totalForeignNet,
            flow5d: f.totalForeignNet,
            ratio: f.foreignNetRatioPercent,
            tier: f.tier
          }));
          setList(mapped);
        }
      } catch (e) {
        console.error("fetchForeignDistrib error:", e);
        if (active) {
          setList([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchForeignDistrib();
    return () => {
      active = false;
    };
  }, [period]);

  return (
    <Card className="border-slate-200 shadow-sm bg-white">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <Upload className="h-4.5 w-4.5 text-rose-600" />
            <CardTitle className="text-sm font-bold text-slate-800">Top Foreign Distribution (Outflow)</CardTitle>
          </div>
          <CardDescription className="text-[10px]">Emiten yang paling banyak dijual bersih oleh investor asing.</CardDescription>
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
                <TableHead className="text-right">Net Sell 1D</TableHead>
                <TableHead className="text-right">Flow {period}</TableHead>
                <TableHead className="text-right">Dominasi (%)</TableHead>
                <TableHead className="text-center">Tier</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.slice(0, 5).map((flow, idx) => (
                <TableRow key={idx} className="border-slate-100">
                  <TableCell className="font-bold text-slate-900">{flow.ticker}</TableCell>
                  <TableCell className="text-right font-mono font-bold text-rose-600">
                    {formatRupiah(flow.buy1d, true)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-rose-600">
                    {formatRupiah(flow.flow5d, true)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-slate-500">{flow.ratio}%</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-800 text-[8px]">
                      {flow.tier}
                    </Badge>
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
