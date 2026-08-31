import { Layers, TrendingUp, Crown, DollarSign, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import useFetch from "@/hooks/useFetch";

const defaultStats = {
    totalSignals: 0,
    activePositions: 0,
    winRatePercent: 0,
    netRealizedPnLPercent: 0,
    closedPositionsCount: 0,

}

const MetricSummaryCards = () => {
    const { data } = useFetch<any>("/api/analytics/metrics");
    const stats = data || defaultStats;

    return (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">


            <Card className="border-slate-200 shadow-sm bg-white">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-xs font-semibold text-slate-500">Total Signal </CardTitle>
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-extrabold text-emerald-600">{stats.totalSignals}</div>
                </CardContent>
            </Card>


            <Card className="border-slate-200 shadow-sm bg-white">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-xs font-semibold text-slate-500">Win Rate </CardTitle>
                    <Crown className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-extrabold text-emerald-600">{(stats.winRatePercent || 0).toFixed(2)}%</div>
                </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm bg-white">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-xs font-semibold text-slate-500">Net Realized PnL</CardTitle>
                    <DollarSign className="h-4 w-4 text-emerald-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-extrabold text-emerald-600">+{(stats.netRealizedPnLPercent || 0).toFixed(2)}%</div>
                </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm bg-white">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-xs font-semibold text-slate-500">Active or Closed Position</CardTitle>
                    <Layers className="h-4 w-4 text-slate-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-extrabold text-slate-300"> <span className="text-emerald-600">{stats.activePositions}</span> | <span className="text-slate-600">{stats.closedPositionsCount}</span></div>
                </CardContent>
            </Card>
        </section>
    );
};

export default MetricSummaryCards;