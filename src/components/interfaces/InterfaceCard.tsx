'use client';

import React, { useState } from 'react';
import { 
  ArrowRight, 
  Copy, 
  Check, 
  Play, 
  Edit3, 
  Trash2 
} from 'lucide-react';
import { InterfaceItem } from '@/types/interface';

interface InterfaceCardProps {
  item: InterfaceItem;
  onEdit: (item: InterfaceItem) => void;
  onDelete: (id: string) => void;
  onTest: (item: InterfaceItem) => void;
  onViewLogs: (item: InterfaceItem) => void;
}

export const InterfaceCard: React.FC<InterfaceCardProps> = ({
  item,
  onEdit,
  onDelete,
  onTest,
  onViewLogs,
}) => {
  const [copied, setCopied] = useState(false);
  const [pinging, setPinging] = useState(false);

  const handleCopyEndpoint = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(item.endpointUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleQuickPing = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setPinging(true);
    try {
      await fetch(`/api/interfaces/${item.id}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ping: true }),
      });
      onTest(item);
    } catch {
      // Fallback
      onTest(item);
    } finally {
      setPinging(false);
    }
  };

  const getStatusBadge = (status: InterfaceItem['status']) => {
    switch (status) {
      case 'healthy':
        return (
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Operational
          </span>
        );
      case 'degraded':
        return (
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            Degraded
          </span>
        );
      case 'down':
        return (
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
            Down
          </span>
        );
      case 'maintenance':
        return (
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-slate-500"></span>
            Maintenance
          </span>
        );
    }
  };

  const getTypeColor = (type: InterfaceItem['type']) => {
    switch (type) {
      case 'REST_API':
        return 'bg-[#2C5EAD]/10 text-[#2C5EAD] border-[#2C5EAD]/30';
      case 'WEBHOOK':
        return 'bg-[#1591DC]/10 text-[#1591DC] border-[#1591DC]/30';
      case 'EDI':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'SFTP':
        return 'bg-indigo-50 text-indigo-800 border-indigo-200';
      case 'KAFKA':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      case 'GRAPHQL':
        return 'bg-fuchsia-50 text-fuchsia-800 border-fuchsia-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 hover:border-[#1591DC]/60 hover:shadow-xl hover:shadow-[#2C5EAD]/5 transition-all flex flex-col justify-between group">
      <div>
        {/* Top Header: Type & Status */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-md border ${getTypeColor(item.type)}`}>
              {item.type}
            </span>
            <span className="text-xs px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wider font-bold">
              {item.direction}
            </span>
          </div>
          <div>{getStatusBadge(item.status)}</div>
        </div>

        {/* Title & Description */}
        <h3 className="text-lg font-bold font-heading text-slate-900 tracking-tight group-hover:text-[#2C5EAD] transition-colors leading-snug">
          {item.name}
        </h3>
        <p className="text-sm text-slate-600 mt-2 line-clamp-2 leading-relaxed font-normal">
          {item.description || 'No description provided.'}
        </p>

        {/* System integration route: Source -> Target */}
        <div className="mt-5 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-sm">
          <div className="flex-1 truncate">
            <span className="text-xs text-slate-400 uppercase font-bold tracking-wider block mb-0.5">Source</span>
            <span className="font-semibold text-slate-900 truncate block">{item.sourceSystem}</span>
          </div>
          <div className="px-3 text-slate-400">
            <ArrowRight className="w-4 h-4 text-[#1591DC]" />
          </div>
          <div className="flex-1 truncate text-right">
            <span className="text-xs text-slate-400 uppercase font-bold tracking-wider block mb-0.5">Target</span>
            <span className="font-semibold text-slate-900 truncate block">{item.targetSystem}</span>
          </div>
        </div>

        {/* Endpoint Snippet */}
        <div className="mt-3.5 flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-mono">
          <span className="truncate pr-3 font-medium">{item.endpointUrl}</span>
          <button
            onClick={handleCopyEndpoint}
            title="Copy Endpoint"
            className="text-slate-400 hover:text-slate-800 transition-colors shrink-0 p-1 rounded-md hover:bg-slate-200/60"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        {/* Metric Badges */}
        <div className="grid grid-cols-3 gap-2.5 mt-5 pt-4 border-t border-slate-100 text-center">
          <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-xs text-slate-400 uppercase font-bold block mb-0.5">Uptime</span>
            <span className="text-sm font-bold font-heading text-slate-900">{item.uptimePercent}%</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-xs text-slate-400 uppercase font-bold block mb-0.5">Avg Latency</span>
            <span className="text-sm font-bold font-heading text-slate-900">{item.averageLatencyMs} ms</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-xs text-slate-400 uppercase font-bold block mb-0.5">Traffic</span>
            <span className="text-sm font-bold font-heading text-slate-900">{item.requestsPerMin} /m</span>
          </div>
        </div>

        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {item.tags.map((tag) => (
              <span key={tag} className="text-xs px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 font-semibold border border-slate-200/60">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Card Actions Footer */}
      <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={handleQuickPing}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#2C5EAD]/10 hover:bg-[#2C5EAD]/20 text-[#2C5EAD] border border-[#2C5EAD]/25 rounded-xl text-xs font-bold transition-all"
          >
            <Play className={`w-3.5 h-3.5 ${pinging ? 'animate-spin' : ''}`} />
            <span>Test / Ping</span>
          </button>

          <button
            onClick={() => onViewLogs(item)}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
            title="Inspect Transactions"
          >
            Logs
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(item)}
            className="p-2 text-slate-400 hover:text-[#2C5EAD] hover:bg-slate-100 rounded-lg transition-colors"
            title="Edit Interface"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="Delete Interface"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
