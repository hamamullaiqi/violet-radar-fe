import { TrendingUp, Crown, DollarSign, Target, Zap, ShieldAlert, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import useFetch from "@/hooks/useFetch";

const defaultStats = {
  totalSignals: 0,
  activePositions: 0,
  winRatePercent: 0,
  netRealizedPnLPercent: 0,
  closedPositionsCount: 0,
  hitTP1Count: 0,
  hitTP1Percent: 0,
  hitTP2Count: 0,
  hitTP2Percent: 0,
  hitSLCount: 0,
  hitSLPercent: 0,
  expiredCount: 0,
  expiredPercent: 0,
};

const MetricSummaryCards = () => {
  const { data } = useFetch<any>("/api/analytics/metrics");
  const stats = data || defaultStats;

  return (
    <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3.5">
      {/* CARD 1: TOTAL SIGNALS */}
      <Card className="border-slate-200 shadow-sm bg-white hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-1.5 space-y-0">
          <CardTitle className="text-xs font-semibold text-slate-500">Total Signals</CardTitle>
          <TrendingUp className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-extrabold text-slate-900">{stats.totalSignals}</div>
          <p className="text-[10px] text-slate-400 font-medium mt-1">
            <span className="text-blue-600 font-bold">{stats.activePositions}</span> Aktif | <span className="text-slate-600 font-bold">{stats.closedPositionsCount}</span> Closed
          </p>
        </CardContent>
      </Card>

      {/* CARD 2: WIN RATE */}
      <Card className="border-slate-200 shadow-sm bg-white hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-1.5 space-y-0">
          <CardTitle className="text-xs font-semibold text-slate-500">Win Rate</CardTitle>
          <Crown className="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-extrabold text-emerald-600">{(stats.winRatePercent || 0).toFixed(2)}%</div>
          <p className="text-[10px] text-slate-400 font-medium mt-1">
            Dari <span className="font-bold text-slate-600">{stats.closedPositionsCount}</span> posisi closed
          </p>
        </CardContent>
      </Card>

      {/* CARD 3: HIT TP1 */}
      <Card className="border-slate-200 shadow-sm bg-white hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-1.5 space-y-0">
          <CardTitle className="text-xs font-semibold text-slate-500">Hit TP1</CardTitle>
          <Target className="h-4 w-4 text-emerald-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-extrabold text-emerald-600">{stats.hitTP1Count || 0}</div>
          <p className="text-[10px] text-emerald-600 font-bold mt-1">
            {(stats.hitTP1Percent || 0).toFixed(2)}% <span className="text-slate-400 font-normal">sukses TP1</span>
          </p>
        </CardContent>
      </Card>

      {/* CARD 4: HIT TP2 */}
      <Card className="border-slate-200 shadow-sm bg-white hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-1.5 space-y-0">
          <CardTitle className="text-xs font-semibold text-slate-500">Hit TP2 (Max)</CardTitle>
          <Zap className="h-4 w-4 text-indigo-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-extrabold text-indigo-600">{stats.hitTP2Count || 0}</div>
          <p className="text-[10px] text-indigo-600 font-bold mt-1">
            {(stats.hitTP2Percent || 0).toFixed(2)}% <span className="text-slate-400 font-normal">sukses TP2</span>
          </p>
        </CardContent>
      </Card>

      {/* CARD 5: HIT SL */}
      <Card className="border-slate-200 shadow-sm bg-white hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-1.5 space-y-0">
          <CardTitle className="text-xs font-semibold text-slate-500">Hit Stop Loss</CardTitle>
          <ShieldAlert className="h-4 w-4 text-rose-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-extrabold text-rose-600">{stats.hitSLCount || 0}</div>
          <p className="text-[10px] text-rose-600 font-bold mt-1">
            {(stats.hitSLPercent || 0).toFixed(2)}% <span className="text-slate-400 font-normal">terkena SL</span>
          </p>
        </CardContent>
      </Card>

      {/* CARD 6: EXPIRED */}
      <Card className="border-slate-200 shadow-sm bg-white hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-1.5 space-y-0">
          <CardTitle className="text-xs font-semibold text-slate-500">Expired</CardTitle>
          <Clock className="h-4 w-4 text-amber-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-extrabold text-amber-600">{stats.expiredCount || 0}</div>
          <p className="text-[10px] text-amber-600 font-bold mt-1">
            {(stats.expiredPercent || 0).toFixed(2)}% <span className="text-slate-400 font-normal">time exit</span>
          </p>
        </CardContent>
      </Card>

      {/* CARD 7: NET REALIZED PNL */}
      <Card className="border-slate-200 shadow-sm bg-white hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-1.5 space-y-0">
          <CardTitle className="text-xs font-semibold text-slate-500">Net Realized PnL</CardTitle>
          <DollarSign className={`h-4 w-4 ${stats.netRealizedPnLPercent >= 0 ? "text-emerald-600" : "text-rose-600"}`} />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-extrabold ${stats.netRealizedPnLPercent >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
            {stats.netRealizedPnLPercent >= 0 ? `+${(stats.netRealizedPnLPercent || 0).toFixed(2)}%` : `${(stats.netRealizedPnLPercent || 0).toFixed(2)}%`}
          </div>
          <p className="text-[10px] text-slate-400 font-medium mt-1">
            Akumulasi performa
          </p>
        </CardContent>
      </Card>
    </section>
  );
};

export default MetricSummaryCards;