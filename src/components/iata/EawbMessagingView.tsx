'use client';

import React, { useState } from 'react';
import { 
  Send, 
  CheckCircle2, 
  Radio, 
  Copy, 
  Check, 
  FileCode
} from 'lucide-react';
import { EawbMessage, MawbItem } from '@/types/iata';

interface EawbMessagingViewProps {
  messages: EawbMessage[];
  mawbs: MawbItem[];
  onDispatchFwb: (mawbNumber: string) => void;
  onDispatchFhl: (mawbNumber: string) => void;
}

export const EawbMessagingView: React.FC<EawbMessagingViewProps> = ({
  messages,
  mawbs,
  onDispatchFwb,
  onDispatchFhl,
}) => {
  const [selectedMessage, setSelectedMessage] = useState<EawbMessage | null>(messages[0] || null);
  const [filterType, setFilterType] = useState('ALL');
  const [copied, setCopied] = useState(false);
  const [transmittingMawb, setTransmittingMawb] = useState<string | null>(null);

  const filteredMessages = messages.filter((m) => {
    return filterType === 'ALL' || m.messageType === filterType;
  });

  const handleCopyCargoImp = () => {
    if (selectedMessage) {
      navigator.clipboard.writeText(selectedMessage.rawCargoImp);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSendFwb = async (mawbNum: string) => {
    setTransmittingMawb(mawbNum);
    setTimeout(() => {
      onDispatchFwb(mawbNum);
      setTransmittingMawb(null);
    }, 800);
  };

  const handleSendFhl = async (mawbNum: string) => {
    setTransmittingMawb(mawbNum);
    setTimeout(() => {
      onDispatchFhl(mawbNum);
      setTransmittingMawb(null);
    }, 800);
  };

  return (
    <div className="space-y-8">
      
      {/* Top Banner */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-7 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#2C5EAD]/10 text-[#2C5EAD]">
            <Radio className="w-5 h-5 text-[#2C5EAD]" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-heading text-slate-900">
              e-AWB EDI Messaging &amp; Airline Telecommunications
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Cargo-IMP &amp; IATA Cargo-XML protocol engine: FWB (Master Waybill), FHL (House Manifest), FFM (Flight Manifest), and FSU (Status Updates).
            </p>
          </div>
        </div>
      </div>

      {/* Quick EDI Dispatch Center for MAWBs */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-7 shadow-xs">
        <h3 className="text-base font-bold font-heading text-slate-900 mb-2">
          e-AWB Dispatch Center (FWB &amp; FHL Transmissions)
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 mb-6 font-medium">
          Generate standard IATA teletype messages directly to airline air cargo community systems (SITA / ARINC / Type B)
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mawbs.map((m) => (
            <div key={m.id} className="p-5 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono font-bold text-sm text-[#2C5EAD]">{m.mawbNumber}</span>
                  <span className="text-xs px-2 py-0.5 rounded-md font-bold font-mono bg-white border border-slate-200 text-slate-700">
                    {m.origin} → {m.destination}
                  </span>
                </div>
                <strong className="text-sm font-bold font-heading text-slate-900 block truncate">{m.shipperName}</strong>
                <p className="text-xs text-slate-500 mt-1">
                  Weight: {m.grossWeightKg} kg · {m.pieces} pkgs {m.hawbs.length > 0 && `· (${m.hawbs.length} HAWBs)`}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleSendFwb(m.mawbNumber)}
                  disabled={transmittingMawb === m.mawbNumber}
                  className="flex-1 py-1.5 px-3 bg-[#2C5EAD] hover:bg-[#234c8d] text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send FWB</span>
                </button>

                {m.hawbs.length > 0 && (
                  <button
                    onClick={() => handleSendFhl(m.mawbNumber)}
                    disabled={transmittingMawb === m.mawbNumber}
                    className="flex-1 py-1.5 px-3 bg-[#1591DC] hover:bg-[#1078b8] text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send FHL</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Message Ledger & Raw Cargo-IMP Telecommunications Console */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Messages Log Table */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-7 shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold font-heading text-slate-900">EDI Transmission Ledger</h3>
              <p className="text-xs text-slate-500 font-medium">History of outgoing and incoming teletype messages</p>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
              {['ALL', 'FWB', 'FHL', 'FSU'].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-2.5 py-1 rounded font-bold font-mono transition-all ${
                    filterType === type
                      ? 'bg-[#2C5EAD] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {filteredMessages.map((msg) => (
              <div
                key={msg.id}
                onClick={() => setSelectedMessage(msg)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  selectedMessage?.id === msg.id
                    ? 'border-[#2C5EAD] bg-blue-50/50 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold ${
                    msg.messageType === 'FWB'
                      ? 'bg-[#2C5EAD]/10 text-[#2C5EAD] border border-[#2C5EAD]/30'
                      : msg.messageType === 'FHL'
                      ? 'bg-[#1591DC]/10 text-[#1591DC] border border-[#1591DC]/30'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}>
                    {msg.messageType}
                  </span>
                  <div>
                    <span className="font-mono font-bold text-sm text-slate-900 block">{msg.awbNumber}</span>
                    <span className="text-xs text-slate-500 font-medium">{msg.airline} · {new Date(msg.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{msg.status}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Raw Cargo-IMP Telecommunications Terminal */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-7 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-[#2C5EAD]" />
                <h3 className="text-base font-bold font-heading text-slate-900">
                  Raw Cargo-IMP / XML Telecommunications Pane
                </h3>
              </div>

              {selectedMessage && (
                <button
                  onClick={handleCopyCargoImp}
                  className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg flex items-center gap-1"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy Teletype</span>
                </button>
              )}
            </div>

            {selectedMessage ? (
              <div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1 mb-4 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500">IATA Message Type:</span>
                    <strong className="text-[#2C5EAD]">{selectedMessage.messageType} (Resolution 600b standard)</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Target Airwaybill:</span>
                    <strong>{selectedMessage.awbNumber}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Transmission Time:</span>
                    <strong>{selectedMessage.timestamp}</strong>
                  </div>
                </div>

                <pre className="p-4 bg-slate-900 border border-slate-800 rounded-xl font-mono text-xs text-emerald-400 overflow-x-auto max-h-72 leading-relaxed">
                  {selectedMessage.rawCargoImp}
                </pre>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
                Select an EDI message on the left to inspect raw teletype payload.
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
