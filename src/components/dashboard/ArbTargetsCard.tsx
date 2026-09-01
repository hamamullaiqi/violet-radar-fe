import React, { useState, useEffect, useMemo } from "react";
import { MinusCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import AraArbLegendDialog from "@/components/dashboard/legends/AraArbLegendDialog";
import { api } from "@/lib/api";
import { formatRupiah } from "@/lib/utils";
import TickerDetailDialog from "./TickerDetailDialog";
import useFetch from "@/hooks/useFetch";

const getArbStatusBadge = (status: string) => {
  switch (status) {
    case "ARB_LOCKED":
      return "bg-rose-600 text-white hover:bg-rose-600";
    case "PANIC_DUMP":
      return "border border-rose-300 text-rose-800 bg-rose-50";
    case "BARGAIN_HUNTING":
      return "border border-amber-300 text-amber-800 bg-amber-50";
    default:
      return "bg-slate-100 text-slate-700";
  }
};

interface MoverData {
  ticker: string;
  status: string;
  clv: number;
  return1d: number;
  turnover: number;
  foreignNet: number;
}

export default function ArbTargetsCard() {

  const { data, loading } = useFetch("/api/market/movers/arb?limit=5");

  const list: MoverData[] = useMemo(() => {
    if (!data) return [];

    return data.map((m: any) => ({
      ticker: m.ticker,
      status: m.statusTag || m.status,
      clv: m.clv !== undefined ? Number(m.clv) : 1.0,
      return1d: m.changePercent,
      turnover: m.value || m.turnover,
      foreignNet: m.foreignNet
    }));
  }, [data]);

  return (
    <Card className="border-slate-200 shadow-sm bg-white">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <MinusCircle className="h-4.5 w-4.5 text-rose-600" />
            <CardTitle className="text-sm font-bold text-slate-800">ARB Targets (Downside Pressure)</CardTitle>
            <AraArbLegendDialog />
          </div>
          <CardDescription className="text-[10px]">Peta emiten teraktif dengan status ARB_LOCKED atau PANIC_DUMP.</CardDescription>
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
                <TableHead className="text-right py-2.5 px-3">Return</TableHead>
                <TableHead className="text-right py-2.5 px-3">Value (IDR)</TableHead>
                <TableHead className="text-right py-2.5 px-3">Net Asing</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.slice(0, 5).map((mover, idx) => (
                <TableRow key={idx} className="border-slate-100">
                  <TableCell className="font-bold text-slate-900 py-2.5 px-3"><TickerDetailDialog ticker={mover.ticker} /></TableCell>
                  <TableCell className="py-2.5 px-3">
                    <Badge className={`${getArbStatusBadge(mover.status)} text-[9px] py-0.5 whitespace-nowrap font-bold`}>
                      {mover.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold py-2.5 px-3">
                    <span className={mover.clv <= 0.2 ? "text-rose-600" : mover.clv <= 0.5 ? "text-amber-600" : "text-blue-600"}>
                      {Number(mover.clv).toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-rose-600 py-2.5 px-3">{mover.return1d}%</TableCell>
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
