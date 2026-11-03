'use client';

import React, { useState } from 'react';
import { X, Layers, Save, AlertCircle } from 'lucide-react';
import { InterfaceItem, InterfaceType, Direction, Environment, AuthType } from '@/types/interface';

interface InterfaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<InterfaceItem>) => Promise<void>;
  initialData?: InterfaceItem | null;
}

export const InterfaceModal: React.FC<InterfaceModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  if (!isOpen) return null;

  return (
    <InterfaceModalInner
      onClose={onClose}
      onSave={onSave}
      initialData={initialData}
    />
  );
};

const InterfaceModalInner: React.FC<{
  onClose: () => void;
  onSave: (data: Partial<InterfaceItem>) => Promise<void>;
  initialData?: InterfaceItem | null;
}> = ({ onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    sourceSystem: initialData?.sourceSystem || '',
    targetSystem: initialData?.targetSystem || '',
    type: (initialData?.type || 'REST_API') as InterfaceType,
    direction: (initialData?.direction || 'inbound') as Direction,
    environment: (initialData?.environment || 'production') as Environment,
    endpointUrl: initialData?.endpointUrl || '',
    authType: (initialData?.authType || 'None') as AuthType,
    syncInterval: initialData?.syncInterval || 'Real-time',
    timeoutSeconds: initialData?.timeoutSeconds ?? 30,
    retryAttempts: initialData?.retryAttempts ?? 3,
    alertOnFailure: initialData?.alertOnFailure ?? true,
    tagsString: initialData?.tags ? initialData.tags.join(', ') : '',
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.endpointUrl.trim()) {
      setError('Interface Name and Endpoint URL are required.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const tags = formData.tagsString
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      await onSave({
        ...formData,
        tags,
      });
      onClose();
    } catch (err) {
      setError('Error saving interface: ' + String(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl text-slate-900">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 sticky top-0 bg-white/95 backdrop-blur z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#2C5EAD]/10 text-[#2C5EAD] rounded-lg">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {initialData ? 'Edit Interface' : 'Register New Interface'}
              </h2>
              <p className="text-xs text-slate-500 font-medium">Configure endpoints, authentication credentials and SLA parameters</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Name & Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Interface Name *
              </label>
              <input
                type="text"
                required
                placeholder="Enter interface name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2C5EAD]/20 focus:border-[#2C5EAD]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Protocol / Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as InterfaceType })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2C5EAD]/20 focus:border-[#2C5EAD]"
              >
                <option value="REST_API">REST API</option>
                <option value="WEBHOOK">Webhook</option>
                <option value="EDI">EDI (EDIFACT / AS2 / X12)</option>
                <option value="SFTP">SFTP / Flat File</option>
                <option value="KAFKA">Kafka / Event Stream</option>
                <option value="GRAPHQL">GraphQL</option>
              </select>
            </div>
          </div>

          {/* Source & Target Systems */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Source System
              </label>
              <input
                type="text"
                placeholder="Enter source system"
                value={formData.sourceSystem}
                onChange={(e) => setFormData({ ...formData, sourceSystem: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2C5EAD]/20 focus:border-[#2C5EAD]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Target System
              </label>
              <input
                type="text"
                placeholder="Enter target system"
                value={formData.targetSystem}
                onChange={(e) => setFormData({ ...formData, targetSystem: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2C5EAD]/20 focus:border-[#2C5EAD]"
              />
            </div>
          </div>

          {/* Endpoint URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Connection Endpoint / Host URL *
            </label>
            <input
              type="text"
              required
              placeholder="https://api.domain.com/v1/orders or sftp://host:22"
              value={formData.endpointUrl}
              onChange={(e) => setFormData({ ...formData, endpointUrl: e.target.value })}
              className="w-full px-3 py-2 font-mono text-xs bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2C5EAD]/20 focus:border-[#2C5EAD]"
            />
          </div>

          {/* Direction, Environment, Auth */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Direction
              </label>
              <select
                value={formData.direction}
                onChange={(e) => setFormData({ ...formData, direction: e.target.value as Direction })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2C5EAD]/20 focus:border-[#2C5EAD]"
              >
                <option value="inbound">Inbound</option>
                <option value="outbound">Outbound</option>
                <option value="bidirectional">Bidirectional</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Environment
              </label>
              <select
                value={formData.environment}
                onChange={(e) => setFormData({ ...formData, environment: e.target.value as Environment })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2C5EAD]/20 focus:border-[#2C5EAD]"
              >
                <option value="production">Production</option>
                <option value="staging">Staging</option>
                <option value="development">Development</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Authentication
              </label>
              <select
                value={formData.authType}
                onChange={(e) => setFormData({ ...formData, authType: e.target.value as AuthType })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2C5EAD]/20 focus:border-[#2C5EAD]"
              >
                <option value="None">None (Public)</option>
                <option value="Bearer Token">Bearer Token</option>
                <option value="API Key">API Key</option>
                <option value="OAuth 2.0">OAuth 2.0</option>
                <option value="Basic Auth">Basic Auth</option>
                <option value="Mutual TLS">Mutual TLS (mTLS)</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Description
            </label>
            <textarea
              rows={2}
              placeholder="Business workflow, purpose, payload schema expectations..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2C5EAD]/20 focus:border-[#2C5EAD]"
            />
          </div>

          {/* SLA, Timeouts, Interval */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Sync Interval / Schedule
              </label>
              <input
                type="text"
                placeholder="Real-time, Hourly, etc."
                value={formData.syncInterval}
                onChange={(e) => setFormData({ ...formData, syncInterval: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2C5EAD]/20 focus:border-[#2C5EAD]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Timeout (Seconds)
              </label>
              <input
                type="number"
                min="1"
                max="600"
                value={formData.timeoutSeconds}
                onChange={(e) => setFormData({ ...formData, timeoutSeconds: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2C5EAD]/20 focus:border-[#2C5EAD]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Max Retries
              </label>
              <input
                type="number"
                min="0"
                max="10"
                value={formData.retryAttempts}
                onChange={(e) => setFormData({ ...formData, retryAttempts: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2C5EAD]/20 focus:border-[#2C5EAD]"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Tags (comma separated)
            </label>
            <input
              type="text"
              placeholder="Enter tags separated by commas"
              value={formData.tagsString}
              onChange={(e) => setFormData({ ...formData, tagsString: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2C5EAD]/20 focus:border-[#2C5EAD]"
            />
          </div>

          {/* Alert checkbox */}
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="alertOnFailure"
              checked={formData.alertOnFailure}
              onChange={(e) => setFormData({ ...formData, alertOnFailure: e.target.checked })}
              className="rounded bg-white border-slate-300 text-[#2C5EAD] focus:ring-[#2C5EAD] w-4 h-4"
            />
            <label htmlFor="alertOnFailure" className="text-xs text-slate-700 font-medium select-none cursor-pointer">
              Trigger alert webhooks & notifications when this interface fails or latency exceeds SLA
            </label>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-5 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#2C5EAD] to-[#1591DC] hover:opacity-95 text-white rounded-lg text-sm font-semibold transition-all shadow-md shadow-[#2C5EAD]/20 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : initialData ? 'Save Changes' : 'Create Interface'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
