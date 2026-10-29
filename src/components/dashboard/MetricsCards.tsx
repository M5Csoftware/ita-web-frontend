'use client';

import React from 'react';
import { 
  Activity, 
  CheckCircle2, 
  Zap, 
  ArrowUpRight,
  TrendingUp,
  Server
} from 'lucide-react';
import { InterfaceItem } from '@/types/interface';

interface MetricsCardsProps {
  interfaces: InterfaceItem[];
}

export const MetricsCards: React.FC<MetricsCardsProps> = ({ interfaces }) => {
  const total = interfaces.length;
  const healthy = interfaces.filter((i) => i.status === 'healthy').length;
  const degraded = interfaces.filter((i) => i.status === 'degraded').length;
  const down = interfaces.filter((i) => i.status === 'down').length;

  const uptimeAvg = total > 0 
    ? (interfaces.reduce((acc, curr) => acc + curr.uptimePercent, 0) / total).toFixed(2)
    : '100.00';

  const latencyAvg = total > 0
    ? Math.round(interfaces.reduce((acc, curr) => acc + curr.averageLatencyMs, 0) / total)
    : 0;

  const throughputTotal = interfaces.reduce((acc, curr) => acc + curr.requestsPerMin, 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Total Interfaces */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 hover:border-[#1591DC]/60 hover:shadow-lg hover:shadow-[#2C5EAD]/5 transition-all shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs sm:text-sm font-bold font-heading text-slate-500 uppercase tracking-wider">
            Total Interfaces
          </span>
          <div className="p-3 bg-[#2C5EAD]/10 text-[#2C5EAD] rounded-xl">
            <Server className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4 flex items-baseline gap-2.5">
          <span className="text-3xl sm:text-4xl font-extrabold font-heading text-slate-900 tracking-tight">
            {total}
          </span>
          <span className="text-sm text-slate-500 font-medium">registered</span>
        </div>
        <div className="mt-3.5 flex items-center gap-2 text-xs sm:text-sm text-emerald-700 font-semibold">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{healthy} operational</span>
          {degraded > 0 && <span className="text-amber-600">· {degraded} degraded</span>}
          {down > 0 && <span className="text-rose-600">· {down} down</span>}
        </div>
      </div>

      {/* SLA / Uptime */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 hover:border-[#1591DC]/60 hover:shadow-lg hover:shadow-[#2C5EAD]/5 transition-all shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs sm:text-sm font-bold font-heading text-slate-500 uppercase tracking-wider">
            Overall Uptime
          </span>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Activity className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4 flex items-baseline gap-2.5">
          <span className="text-3xl sm:text-4xl font-extrabold font-heading text-slate-900 tracking-tight">
            {uptimeAvg}%
          </span>
          <span className="text-xs sm:text-sm text-emerald-600 font-bold flex items-center">
            <ArrowUpRight className="w-4 h-4" /> +0.02%
          </span>
        </div>
        <div className="mt-3.5 text-xs sm:text-sm text-slate-500 font-medium">
          Global SLA target: <span className="text-[#2C5EAD] font-bold">99.90%</span>
        </div>
      </div>

      {/* Latency */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 hover:border-[#1591DC]/60 hover:shadow-lg hover:shadow-[#2C5EAD]/5 transition-all shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs sm:text-sm font-bold font-heading text-slate-500 uppercase tracking-wider">
            Average Latency
          </span>
          <div className="p-3 bg-[#1591DC]/10 text-[#1591DC] rounded-xl">
            <Zap className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4 flex items-baseline gap-2.5">
          <span className="text-3xl sm:text-4xl font-extrabold font-heading text-slate-900 tracking-tight">
            {latencyAvg} ms
          </span>
          <span className="text-sm text-slate-500 font-medium">round-trip</span>
        </div>
        <div className="mt-3.5 text-xs sm:text-sm text-slate-500 font-medium">
          Fastest: <span className="text-[#2C5EAD] font-bold">18ms</span> (Carrier Webhook)
        </div>
      </div>

      {/* Throughput */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 hover:border-[#1591DC]/60 hover:shadow-lg hover:shadow-[#2C5EAD]/5 transition-all shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs sm:text-sm font-bold font-heading text-slate-500 uppercase tracking-wider">
            Throughput
          </span>
          <div className="p-3 bg-[#2C5EAD]/10 text-[#2C5EAD] rounded-xl">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4 flex items-baseline gap-2.5">
          <span className="text-3xl sm:text-4xl font-extrabold font-heading text-slate-900 tracking-tight">
            {throughputTotal.toLocaleString()}
          </span>
          <span className="text-sm text-slate-500 font-medium">req / min</span>
        </div>
        <div className="mt-3.5 text-xs sm:text-sm text-slate-500 font-medium">
          System capacity: <span className="text-[#2C5EAD] font-bold">85,000 / min</span>
        </div>
      </div>
    </div>
  );
};
