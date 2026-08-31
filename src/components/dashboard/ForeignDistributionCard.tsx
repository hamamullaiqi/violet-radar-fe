import React, { useState, useEffect } from "react";
import { Upload } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import ForeignFlowLegendDialog from "@/components/dashboard/legends/ForeignFlowLegendDialog";
import { api } from "@/lib/api";
import { formatRupiah } from "@/lib/utils";

const getForeignTierBadge = (tier: string) => {
  switch (tier) {
    case "DISTRIBUTION":
      return "border-rose-300 bg-rose-100 text-rose-800";
    case "SUPER_ACCUMULATION":
      return "border-purple-300 bg-purple-100 text-purple-800";
    case "STRONG_ACCUMULATION":
      return "border-indigo-300 bg-indigo-100 text-indigo-800";
    case "MODERATE_ACCUMULATION":
      return "border-blue-300 bg-blue-100 text-blue-800";
    case "NEUTRAL":
    default:
      return "border-slate-300 bg-slate-100 text-slate-700";
  }
};

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
            firstPrice: f.firstPrice,
            latestPrice: f.latestPrice,
            change: f.priceChangePercent,
            buy1d: f.totalForeignNet,
            flow5d: f.totalForeignNet,
            foreignRatio: f.foreignBuyRatioPercent !== undefined ? f.foreignBuyRatioPercent : f.foreignNetRatioPercent,
            domesticRatio: f.domesticBuyRatioPercent !== undefined ? f.domesticBuyRatioPercent : (100 - (f.foreignBuyRatioPercent || 0)),
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
            <ForeignFlowLegendDialog />
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
        <div className="relative overflow-x-auto">
          {loading && <div className="absolute inset-0 bg-white/50 flex items-center justify-center text-xs text-slate-500 z-10">Loading...</div>}
          <Table className="text-xs w-full whitespace-nowrap">
            <TableHeader className="bg-slate-50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="py-2.5 px-3">Ticker</TableHead>
                <TableHead className="text-right py-2.5 px-3">First / Last Price</TableHead>
                <TableHead className="text-right py-2.5 px-3">Chg (%)</TableHead>
                <TableHead className="text-right py-2.5 px-3">Flow {period}</TableHead>
                <TableHead className="text-right py-2.5 px-3">Dominasi (F vs D)</TableHead>
                <TableHead className="text-center py-2.5 px-3">Tier</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.slice(0, 5).map((flow, idx) => (
                <TableRow key={idx} className="border-slate-100">
                  <TableCell className="font-bold text-slate-900 py-2.5 px-3">{flow.ticker}</TableCell>
                  <TableCell className="text-right font-mono text-slate-500 py-2.5 px-3">
                    Rp {Number(flow.firstPrice || 0).toLocaleString('id-ID')} / Rp {Number(flow.latestPrice || 0).toLocaleString('id-ID')}
                  </TableCell>
                  <TableCell className={`text-right font-mono font-bold py-2.5 px-3 ${flow.change >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {flow.change >= 0 ? `+${flow.change}%` : `${flow.change}%`}
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-rose-600 py-2.5 px-3">
                    {formatRupiah(flow.flow5d, true)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-[11px] py-2.5 px-3">
                    <span className="text-blue-600 font-bold">{flow.foreignRatio}% F</span>
                    <span className="text-slate-400 mx-1">/</span>
                    <span className="text-slate-600 font-medium">{flow.domesticRatio}% D</span>
                  </TableCell>
                  <TableCell className="text-center py-2.5 px-3">
                    <Badge variant="outline" className={`${getForeignTierBadge(flow.tier)} text-[9px] px-2 py-0.5 whitespace-nowrap font-bold`}>
                      {flow.tier}
                    </Badge>
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
