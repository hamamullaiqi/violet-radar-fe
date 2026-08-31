"use client";

import useFetch from "@/hooks/useFetch";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Line,
    Cell,
    Legend,
    ComposedChart
} from "recharts";
import { Loader2, BarChart2 } from "lucide-react";

interface YearlyDataPoint {
    year: number;
    totalPnL: number;
    tradesCount: number;
}

const OverviewYearly = () => {
    const { data: yearlyData, loading, error } = useFetch<YearlyDataPoint[]>("/api/analytics/yearly");

    if (loading) {
        return (
            <div className="flex h-96 w-full items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white">
                <div className="flex flex-col items-center gap-2 text-slate-500">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    <p className="text-xs font-semibold">Memuat analisis performa tahunan...</p>
                </div>
            </div>
        );
    }

    if (error || !yearlyData || yearlyData.length === 0) {
        return (
            <div className="flex h-96 w-full items-center justify-center rounded-lg border border-dashed border-rose-200 bg-rose-50/50">
                <div className="flex flex-col items-center gap-2 text-rose-600 text-center px-4">
                    <p className="text-sm font-bold">Gagal memuat data analisis tahunan</p>
                    <p className="text-xs text-rose-500">Pastikan backend Anda aktif dan terhubung.</p>
                </div>
            </div>
        );
    }

    return (
        <Card className="border-slate-200 shadow-sm bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <BarChart2 className="h-5 w-5 text-blue-600" />
                        <CardTitle className="text-sm font-bold text-slate-800">Yearly PnL & Activity Overlay</CardTitle>
                    </div>
                    <CardDescription className="text-xs">
                        Perbandingan realized PnL (%) [Kiri, Batang] dan volume transaksi [Kanan, Garis] per tahun.
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent className="h-72 pl-0">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={yearlyData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="year" stroke="#94a3b8" fontSize={10} tickLine={false} />
                        <YAxis
                            yAxisId="pnl"
                            orientation="left"
                            stroke="#94a3b8"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(val) => `${val}%`}
                        />
                        <YAxis
                            yAxisId="trades"
                            orientation="right"
                            stroke="#6366f1"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(val) => `${val} T`}
                        />
                        <Tooltip
                            formatter={(value: any, name?: any) => {
                                if (name === "totalPnL") return [`+${value}%`, "Realized PnL"];
                                if (name === "tradesCount") return [`${value} Trades`, "Volume Transaksi"];
                                return [value, name || ""];
                            }}
                            contentStyle={{ fontFamily: "var(--font-open-sans)", fontSize: "11px" }}
                        />
                        <Legend wrapperStyle={{ fontSize: "10px" }} />
                        <Bar yAxisId="pnl" dataKey="totalPnL" name="totalPnL" radius={[4, 4, 0, 0]}>
                            {yearlyData.map((entry, index) => {
                                const isPositive = entry.totalPnL >= 0;
                                return (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={isPositive ? "#10b981" : "#ef4444"}
                                    />
                                );
                            })}
                        </Bar>
                        <Line
                            yAxisId="trades"
                            type="monotone"
                            dataKey="tradesCount"
                            name="tradesCount"
                            stroke="#6366f1"
                            strokeWidth={2}
                            dot={{ r: 3, fill: "#6366f1" }}
                            activeDot={{ r: 5 }}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
};

export default OverviewYearly;