// src/components/iata/CustomerLedgerView.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { CassInvoice } from "@/types/iata";

import { API_BASE } from "@/lib/api";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(n || 0);

export const CustomerLedgerView: React.FC = () => {
  const [invoices, setInvoices] = useState<CassInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState("");

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setApiError("");
    try {
      const res = await fetch(`${API_BASE}/api/invoices`);
      const data = await res.json();
      setInvoices(data.invoices || []);
    } catch (err: any) {
      setApiError(err.message || "Failed to load invoices.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const customers = Array.from(new Set(invoices.map((i) => i.customerName)));
  const filtered = selectedCustomer
    ? invoices.filter((i) => i.customerName === selectedCustomer)
    : invoices;

  const totals = filtered.reduce(
    (acc, inv) => {
      acc.invoiced += inv.totalAmount;
      acc.paid +=
        inv.payments?.reduce((s, p) => s + p.amount + p.tdsAmount, 0) || 0;
      acc.balance +=
        inv.balanceDue ?? (inv.paymentStatus === "PAID" ? 0 : inv.totalAmount);
      return acc;
    },
    { invoiced: 0, paid: 0, balance: 0 },
  );

  return (
    <div className="space-y-6 animate-in fade-in">
      <header className="border-b border-slate-200 pb-6 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Customer Ledger</h1>
          <p className="text-sm text-slate-500 mt-1">
            Per-customer invoice, receipt and outstanding balance register
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={isLoading}
          className="p-2.5 rounded-xl border border-slate-300 bg-white text-slate-600 hover:text-[#2C5EAD] hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </header>

      {apiError && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {apiError}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card label="Total Invoiced" value={fmt(totals.invoiced)} />
        <Card label="Total Received" value={fmt(totals.paid)} />
        <Card label="Balance Outstanding" value={fmt(totals.balance)} />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <label className="text-xs font-bold text-slate-600">
          Customer
          <select
            value={selectedCustomer}
            onChange={(e) => setSelectedCustomer(e.target.value)}
            className="mt-1 ml-3 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">All customers</option>
            {customers.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        {isLoading ? (
          <div className="py-10 text-center">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-4 py-10 text-center text-slate-500 text-sm border border-dashed rounded-xl">
            No transactions yet. Create an invoice draft from the Invoice
            Generation view.
          </div>
        ) : (
          <table className="w-full mt-4 text-sm">
            <thead>
              <tr className="bg-slate-50 border-b text-xs uppercase text-slate-500 font-bold">
                <th className="py-3 px-4 text-left">Date</th>
                <th className="py-3 px-4 text-left">Invoice #</th>
                <th className="py-3 px-4 text-left">Customer</th>
                <th className="py-3 px-4 text-right">Debit</th>
                <th className="py-3 px-4 text-right">Receipts</th>
                <th className="py-3 px-4 text-right">TDS</th>
                <th className="py-3 px-4 text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((inv) => {
                const receipts =
                  inv.payments?.reduce((s, p) => s + p.amount, 0) || 0;
                const tds =
                  inv.payments?.reduce((s, p) => s + p.tdsAmount, 0) || 0;
                const bal =
                  inv.balanceDue ??
                  (inv.paymentStatus === "PAID" ? 0 : inv.totalAmount);
                return (
                  <tr key={inv.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">{inv.date}</td>
                    <td className="py-3 px-4 font-mono font-bold text-[#2C5EAD]">
                      {inv.invoiceNumber || "DRAFT"}
                    </td>
                    <td className="py-3 px-4">{inv.customerName}</td>
                    <td className="py-3 px-4 text-right font-mono">
                      {fmt(inv.totalAmount)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-700">
                      {fmt(receipts)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-500">
                      {fmt(tds)}
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-mono font-bold ${
                        bal > 0 ? "text-amber-700" : "text-emerald-700"
                      }`}
                    >
                      {fmt(bal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

const Card: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5">
    <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
      {label}
    </div>
    <div className="mt-2 text-2xl font-extrabold font-mono text-slate-900">
      {value}
    </div>
  </div>
);
