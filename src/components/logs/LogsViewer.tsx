'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Activity, 
  Search, 
  RefreshCw, 
  ChevronRight, 
  ChevronDown,
  RotateCcw,
  Code
} from 'lucide-react';
import { TransactionRecord } from '@/types/interface';

interface LogsViewerProps {
  initialFilterInterfaceId?: string | null;
}

export const LogsViewer: React.FC<LogsViewerProps> = ({ initialFilterInterfaceId }) => {
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replayingId, setReplayingId] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const url = new URL('/api/logs', window.location.origin);
      if (search) url.searchParams.set('q', search);
      if (statusFilter !== 'ALL') url.searchParams.set('status', statusFilter);
      if (initialFilterInterfaceId) url.searchParams.set('interfaceId', initialFilterInterfaceId);

      const res = await fetch(url.toString());
      const data = await res.json();
      setTransactions(data.transactions || []);
    } catch (err) {
      console.error('Failed to load logs', err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, initialFilterInterfaceId]);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const url = new URL('/api/logs', window.location.origin);
        if (search) url.searchParams.set('q', search);
        if (statusFilter !== 'ALL') url.searchParams.set('status', statusFilter);
        if (initialFilterInterfaceId) url.searchParams.set('interfaceId', initialFilterInterfaceId);

        const res = await fetch(url.toString());
        const data = await res.json();
        if (!ignore) {
          setTransactions(data.transactions || []);
        }
      } catch (err) {
        console.error('Failed to load logs', err);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [search, statusFilter, initialFilterInterfaceId]);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleReplay = async (tx: TransactionRecord) => {
    setReplayingId(tx.id);
    try {
      await fetch(`/api/interfaces/${tx.interfaceId}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: tx.requestPayload }),
      });
      await fetchLogs();
    } catch (err) {
      console.error('Replay failed', err);
    } finally {
      setReplayingId(null);
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
      {/* Controls Header */}
      <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#2C5EAD]/10 text-[#2C5EAD]">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold font-heading text-slate-900">Live Transmission & Transaction Logs</h3>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">Real-time audit trail of all payload exchanges, response latencies and status codes</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Status filter tabs */}
          <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl p-1 text-xs">
            {['ALL', 'SUCCESS', 'FAILED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg transition-all font-bold ${
                  statusFilter === st
                    ? 'bg-[#2C5EAD] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search logs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3.5 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2C5EAD]/20 focus:border-[#2C5EAD]"
            />
          </div>

          {/* Refresh */}
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 transition-colors"
            title="Refresh logs"
          >
            <RefreshCw className={`w-4 h-4 text-[#1591DC] ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold font-heading text-slate-500 uppercase tracking-wider">
              <th className="py-4 px-6 w-10"></th>
              <th className="py-4 px-6">Transaction ID</th>
              <th className="py-4 px-6">Interface</th>
              <th className="py-4 px-6">Status</th>
              <th className="py-4 px-6">Latency</th>
              <th className="py-4 px-6">Size</th>
              <th className="py-4 px-6">Timestamp</th>
              <th className="py-4 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-14 text-center text-slate-400 font-medium">
                  No matching transaction logs found.
                </td>
              </tr>
            ) : (
              transactions.map((tx) => (
                <React.Fragment key={tx.id}>
                  <tr
                    onClick={() => toggleExpand(tx.id)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    <td className="py-4 px-6 text-slate-400">
                      {expandedId === tx.id ? (
                        <ChevronDown className="w-4 h-4 text-[#2C5EAD]" />
                      ) : (
                        <ChevronRight className="w-4 h-4 group-hover:text-slate-600" />
                      )}
                    </td>
                    <td className="py-4 px-6 font-mono font-bold text-[#2C5EAD] text-sm">
                      {tx.id}
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-900 flex items-center gap-2">
                      <span className="truncate max-w-[220px] font-heading">{tx.interfaceName}</span>
                      <span className="text-xs uppercase font-mono px-2 py-0.5 bg-slate-100 rounded text-slate-600 border border-slate-200 font-bold">
                        {tx.direction}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-mono font-bold text-xs ${
                          tx.statusCode >= 200 && tx.statusCode < 300
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {tx.statusCode} {tx.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-700 font-mono font-medium">
                      {tx.latencyMs} ms
                    </td>
                    <td className="py-4 px-6 text-slate-700 font-mono font-medium">
                      {tx.payloadSizeKb} KB
                    </td>
                    <td className="py-4 px-6 text-slate-500 font-medium">
                      {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReplay(tx);
                        }}
                        disabled={replayingId === tx.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-[#2C5EAD]/10 text-slate-700 hover:text-[#2C5EAD] border border-slate-200 text-xs font-bold transition-colors"
                        title="Retry / Replay transaction"
                      >
                        <RotateCcw className={`w-3.5 h-3.5 ${replayingId === tx.id ? 'animate-spin' : ''}`} />
                        <span>Replay</span>
                      </button>
                    </td>
                  </tr>

                  {/* Expanded Payload Inspector */}
                  {expandedId === tx.id && (
                    <tr className="bg-slate-50/70">
                      <td colSpan={8} className="p-6 border-t border-slate-200/80">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          
                          {/* Request Payload */}
                          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-inner">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-xs font-bold font-heading text-slate-200 flex items-center gap-2">
                                <Code className="w-4 h-4 text-[#1591DC]" />
                                Outbound / Request Payload
                              </span>
                            </div>
                            <pre className="font-mono text-xs text-slate-200 bg-slate-950 p-3.5 rounded-lg border border-slate-800 overflow-x-auto max-h-56 leading-relaxed">
                              {tx.requestPayload || '// No request body recorded'}
                            </pre>
                          </div>

                          {/* Response Payload */}
                          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-inner">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-xs font-bold font-heading text-slate-200 flex items-center gap-2">
                                <Activity className="w-4 h-4 text-emerald-400" />
                                Inbound / Response Payload
                              </span>
                              {tx.errorMessage && (
                                <span className="text-xs text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 font-mono">
                                  {tx.errorMessage}
                                </span>
                              )}
                            </div>
                            <pre className="font-mono text-xs text-emerald-300 bg-slate-950 p-3.5 rounded-lg border border-slate-800 overflow-x-auto max-h-56 leading-relaxed">
                              {tx.responsePayload || tx.errorMessage || '// Empty response'}
                            </pre>
                          </div>

                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
