import React, { useState, useEffect } from "react";
import { TrendingDown } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import GrowthLossLegendDialog from "@/components/dashboard/legends/GrowthLossLegendDialog";
import { api } from "@/lib/api";

const getLossTierBadge = (tier: string) => {
  switch (tier) {
    case "SEVERE_LOSS":
      return "bg-rose-700 text-white hover:bg-rose-700";
    case "HEAVY_LOSS":
      return "bg-rose-500 text-white hover:bg-rose-500";
    case "MODERATE_LOSS":
      return "bg-amber-600 text-white hover:bg-amber-600";
    case "SIDEWAYS":
      return "border-slate-300 bg-slate-100 text-slate-700";
    case "MODERATE_GROWTH":
      return "bg-teal-500 text-white hover:bg-teal-500";
    case "STRONG_GROWTH":
      return "bg-emerald-500 text-white hover:bg-emerald-500";
    case "SUPER_GROWTH":
      return "bg-emerald-600 text-white hover:bg-emerald-600";
    default:
      return "bg-rose-600 text-white";
  }
};

export default function LoseLeadersCard() {
  const [period, setPeriod] = useState<"1D" | "1W" | "3M" | "YTD">("3M");
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchGrowthLosers = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/api/market/growth/losers?period=${period}&limit=5`);
        if (res.data && res.data.data && active) {
          const rawList = res.data.data || [];
          const mapped = rawList.map((g: any) => ({
            ticker: g.ticker,
            high: g.highPriceInPeriod,
            low: g.lowPriceInPeriod,
            maxGain: g.maxGainInPeriodPercent,
            maxDd: g.maxDrawdownInPeriodPercent,
            change: g.priceChangePercent,
            tier: g.growthTier
          }));
          setList(mapped);
        }
      } catch (e) {
        console.error("fetchGrowthLosers error:", e);
        if (active) {
          setList([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchGrowthLosers();
    return () => {
      active = false;
    };
  }, [period]);

  return (
    <Card className="border-slate-200 shadow-sm bg-white">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <TrendingDown className="h-4.5 w-4.5 text-rose-600" />
            <CardTitle className="text-sm font-bold text-slate-800">Lose Leaders (Losers)</CardTitle>
            <GrowthLossLegendDialog />
          </div>
          <CardDescription className="text-[10px]">Saham dengan persentase penurunan harga terdalam.</CardDescription>
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
                <TableHead className="text-right py-2.5 px-3">High / Low Price</TableHead>
                <TableHead className="text-right py-2.5 px-3">Max Profit</TableHead>
                <TableHead className="text-right py-2.5 px-3">Max DD</TableHead>
                <TableHead className="text-right py-2.5 px-3">Kinerja {period}</TableHead>
                <TableHead className="text-center py-2.5 px-3">Verdict</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.slice(0, 5).map((growth, idx) => (
                <TableRow key={idx} className="border-slate-100">
                  <TableCell className="font-bold text-slate-900 py-2.5 px-3">{growth.ticker}</TableCell>
                  <TableCell className="text-right font-mono text-slate-500 py-2.5 px-3">
                    Rp {Number(growth.high).toLocaleString('id-ID')} / Rp {Number(growth.low).toLocaleString('id-ID')}
                  </TableCell>
                  <TableCell className="text-right font-mono text-emerald-600 py-2.5 px-3">+{growth.maxGain}%</TableCell>
                  <TableCell className="text-right font-mono text-rose-600 py-2.5 px-3">{growth.maxDd}%</TableCell>
                  <TableCell className="text-right font-mono font-bold text-rose-600 py-2.5 px-3">{growth.change}%</TableCell>
                  <TableCell className="text-center py-2.5 px-3">
                    <Badge className={`${getLossTierBadge(growth.tier)} text-[9px] px-2 py-0.5 whitespace-nowrap`}>
                      {growth.tier}
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
