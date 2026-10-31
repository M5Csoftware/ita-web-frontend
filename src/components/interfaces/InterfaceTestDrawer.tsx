'use client';

import React, { useState } from 'react';
import { 
  X, 
  Clock, 
  Copy, 
  Check, 
  Send, 
  Terminal,
  RotateCcw
} from 'lucide-react';
import { InterfaceItem } from '@/types/interface';

interface InterfaceTestDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  item: InterfaceItem | null;
}

interface TestResult {
  statusCode: number;
  statusText: string;
  latencyMs: number;
  response: unknown;
}

function getDefaultPayload(): string {
  return '';
}

export const InterfaceTestDrawer: React.FC<InterfaceTestDrawerProps> = ({
  isOpen,
  onClose,
  item,
}) => {
  if (!isOpen || !item) return null;

  return (
    <InterfaceTestDrawerInner
      onClose={onClose}
      item={item}
    />
  );
};

const InterfaceTestDrawerInner: React.FC<{
  onClose: () => void;
  item: InterfaceItem;
}> = ({ onClose, item }) => {
  const [requestBody, setRequestBody] = useState(getDefaultPayload);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [copied, setCopied] = useState(false);

  const handleRunTest = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`/api/interfaces/${item.id}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: requestBody }),
      });
      const data = await res.json();
      setResult({
        statusCode: res.status,
        statusText: data.statusText || res.statusText,
        latencyMs: data.latencyMs || 0,
        response: data.response ?? data,
      });
    } catch (err) {
      setResult({
        statusCode: 500,
        statusText: 'Internal Client Error',
        latencyMs: 0,
        response: { error: String(err) },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyResult = () => {
    if (result) {
      navigator.clipboard.writeText(JSON.stringify(result.response, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-xl bg-white border-l border-slate-200 h-full flex flex-col shadow-2xl text-slate-900">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#2C5EAD]/10 text-[#2C5EAD] rounded-lg">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Endpoint Test Runner</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#1591DC]/10 text-[#2C5EAD] border border-[#1591DC]/30 font-semibold">
                  {item.type}
                </span>
              </h2>
              <p className="text-xs text-slate-500 truncate max-w-sm font-medium">{item.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          
          {/* Target endpoint info */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
            <div className="flex items-center justify-between text-slate-500 font-medium">
              <span>Target Endpoint:</span>
              <span className="font-mono text-[#2C5EAD] font-semibold">{item.authType}</span>
            </div>
            <div className="font-mono text-slate-800 break-all bg-white px-2.5 py-1.5 rounded border border-slate-200">
              {item.endpointUrl}
            </div>
          </div>

          {/* Request Payload Editor */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-semibold text-slate-700">Request Body / Payload</label>
              <button
                type="button"
                onClick={() => setRequestBody(getDefaultPayload())}
                className="text-[11px] text-[#2C5EAD] hover:underline font-medium"
              >
                Reset Default
              </button>
            </div>
            <textarea
              rows={6}
              value={requestBody}
              onChange={(e) => setRequestBody(e.target.value)}
              className="w-full p-3 font-mono text-xs bg-slate-900 border border-slate-800 rounded-lg text-emerald-400 focus:outline-none focus:ring-2 focus:ring-[#2C5EAD]/40"
            />
          </div>

          {/* Trigger button */}
          <button
            onClick={handleRunTest}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-[#2C5EAD] to-[#1591DC] hover:opacity-95 text-white font-semibold rounded-lg shadow-md shadow-[#2C5EAD]/20 transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <RotateCcw className="w-4 h-4 animate-spin" />
                <span>Dispatching Test Request...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Execute Live Test Ping</span>
              </>
            )}
          </button>

          {/* Result section */}
          {result && (
            <div className="mt-4 space-y-3 pt-3 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800">Test Execution Result</span>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                      result.statusCode >= 200 && result.statusCode < 300
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {result.statusCode} {result.statusText}
                  </span>
                  <span className="flex items-center gap-1 text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                    <Clock className="w-3 h-3 text-[#1591DC]" />
                    <span>{result.latencyMs} ms</span>
                  </span>
                </div>
              </div>

              {/* Response Body Box */}
              <div className="relative">
                <div className="absolute top-2 right-2">
                  <button
                    onClick={handleCopyResult}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                    title="Copy response"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <pre className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 font-mono text-[11px] overflow-x-auto max-h-64 leading-relaxed">
                  {JSON.stringify(result.response, null, 2)}
                </pre>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors font-medium"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
