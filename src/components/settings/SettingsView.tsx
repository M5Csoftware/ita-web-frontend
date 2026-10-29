'use client';

import React, { useState } from 'react';
import { 
  Settings, 
  Bell, 
  Save, 
  Check, 
  Server, 
  Zap
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const [webhookUrl, setWebhookUrl] = useState('https://hooks.slack.com/services/T00/B00/X00EXAMPLE');
  const [defaultTimeout, setDefaultTimeout] = useState(30);
  const [maxRetries, setMaxRetries] = useState(3);
  const [notifyOnDegrade, setNotifyOnDegrade] = useState(true);
  const [notifyOnDown, setNotifyOnDown] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold font-heading text-slate-900 flex items-center gap-3">
          <Settings className="w-6 h-6 text-[#2C5EAD]" />
          <span>System & Interface Settings</span>
        </h2>
        <p className="text-sm text-slate-500 mt-1 font-normal">
          Configure global policies, incident webhook notifications, and runtime gateway options.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-7">
        {/* Incident Webhook Alerts */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-7 space-y-5 shadow-xs">
          <div className="flex items-center gap-2.5 text-base font-bold font-heading text-slate-900">
            <Bell className="w-5 h-5 text-[#1591DC]" />
            <h3>Notification & Alert Channels</h3>
          </div>
          <p className="text-sm text-slate-500 leading-relaxed font-normal">
            Specify incoming webhook endpoints for dispatching real-time notifications when an interface goes down or breaches SLA.
          </p>

          <div>
            <label className="block text-xs sm:text-sm font-semibold font-heading text-slate-700 mb-2">
              Incident Alert Webhook URL (Slack / Teams / PagerDuty)
            </label>
            <input
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="w-full px-4 py-2.5 font-mono text-sm bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2C5EAD]/20 focus:border-[#2C5EAD]"
              placeholder="https://hooks.slack.com/services/..."
            />
          </div>

          <div className="space-y-3 pt-2">
            <label className="flex items-center gap-3 text-sm text-slate-700 select-none cursor-pointer font-medium">
              <input
                type="checkbox"
                checked={notifyOnDown}
                onChange={(e) => setNotifyOnDown(e.target.checked)}
                className="rounded bg-white border-slate-300 text-[#2C5EAD] focus:ring-[#2C5EAD] w-4 h-4"
              />
              <span>Trigger immediate alert when any interface enters <strong>DOWN</strong> status</span>
            </label>
            <label className="flex items-center gap-3 text-sm text-slate-700 select-none cursor-pointer font-medium">
              <input
                type="checkbox"
                checked={notifyOnDegrade}
                onChange={(e) => setNotifyOnDegrade(e.target.checked)}
                className="rounded bg-white border-slate-300 text-[#2C5EAD] focus:ring-[#2C5EAD] w-4 h-4"
              />
              <span>Trigger notification when response latency exceeds SLA target (&gt; 500ms)</span>
            </label>
          </div>
        </div>

        {/* Global Gateway Defaults */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-7 space-y-5 shadow-xs">
          <div className="flex items-center gap-2.5 text-base font-bold font-heading text-slate-900">
            <Zap className="w-5 h-5 text-[#2C5EAD]" />
            <h3>Gateway Execution Defaults</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs sm:text-sm font-semibold font-heading text-slate-700 mb-2">
                Default Request Timeout (seconds)
              </label>
              <input
                type="number"
                min="1"
                max="300"
                value={defaultTimeout}
                onChange={(e) => setDefaultTimeout(Number(e.target.value))}
                className="w-full px-4 py-2.5 text-sm bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2C5EAD]/20 focus:border-[#2C5EAD]"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold font-heading text-slate-700 mb-2">
                Default Maximum Retries
              </label>
              <input
                type="number"
                min="0"
                max="10"
                value={maxRetries}
                onChange={(e) => setMaxRetries(Number(e.target.value))}
                className="w-full px-4 py-2.5 text-sm bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2C5EAD]/20 focus:border-[#2C5EAD]"
              />
            </div>
          </div>
        </div>

        {/* System & Architecture Info */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-7 space-y-4 shadow-xs">
          <div className="flex items-center gap-2.5 text-base font-bold font-heading text-slate-900">
            <Server className="w-5 h-5 text-[#1591DC]" />
            <h3>Runtime & Gateway Architecture</h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 text-sm">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-xs uppercase font-bold tracking-wider mb-1">Engine</span>
              <span className="font-bold font-heading text-slate-900 text-base">Next.js 16</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-xs uppercase font-bold tracking-wider mb-1">Bundler</span>
              <span className="font-bold font-heading text-[#2C5EAD] text-base">Turbopack</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-xs uppercase font-bold tracking-wider mb-1">Typography</span>
              <span className="font-bold font-heading text-slate-900 text-base">Poppins &amp; Lato</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-xs uppercase font-bold tracking-wider mb-1">Health SLA</span>
              <span className="font-bold font-heading text-emerald-600 text-base">99.90% Target</span>
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex items-center justify-end gap-4 pt-2">
          {saved && (
            <span className="text-sm text-emerald-700 flex items-center gap-1.5 font-semibold">
              <Check className="w-5 h-5" />
              Settings saved successfully
            </span>
          )}
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#2C5EAD] to-[#1591DC] hover:opacity-95 text-white rounded-xl text-sm font-bold shadow-md shadow-[#2C5EAD]/20 transition-all active:scale-[0.98]"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
};
