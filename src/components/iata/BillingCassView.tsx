"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Receipt, Loader2, AlertCircle } from "lucide-react";
import { CassInvoice } from "@/types/iata";

import { API_BASE } from "@/lib/api";

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok)
    throw new Error(
      data.message || data.error || `Request failed: ${res.status}`,
    );
  return data as T;
}

// ✅ Changed to INR formatting
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount || 0);

export const BillingCassView: React.FC = () => {
  const [invoices, setInvoices] = useState<CassInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [filterCass, setFilterCass] = useState("ALL");

  const fetchInvoices = useCallback(async () => {
    setIsLoading(true);
    setApiError("");
    try {
      // ✅ Fetches from the shared Invoice list (same DB, so billing view sees it)
      const data = await apiFetch<{
        success: boolean;
        invoices: CassInvoice[];
      }>("/api/invoices");
      setInvoices(data.invoices || []);
    } catch (err: any) {
      setApiError(err.message || "Failed to load invoices.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // ✅ FIXED: Routes to /api/billing/ instead of /api/invoices/
  const handleMarkPaid = async (id: string) => {
    try {
      await apiFetch(`/api/billing/${id}/payment`, {
        method: "PATCH",
        body: JSON.stringify({ paymentStatus: "PAID" }),
      });
      await fetchInvoices();
    } catch (err: any) {
      setApiError(err.message);
    }
  };

  // ✅ FIXED: Routes to /api/billing/ instead of /api/invoices/
  const handleReconcileCass = async (id: string) => {
    try {
      await apiFetch(`/api/billing/${id}/cass-reconcile`, {
        method: "PATCH",
        body: JSON.stringify({ cassStatus: "RECONCILED" }),
      });
      await fetchInvoices();
    } catch (err: any) {
      setApiError(err.message);
    }
  };

  // Filter out drafts and cancelled invoices for the CASS view
  const cassInvoices = invoices.filter(
    (invoice) =>
      invoice.invoiceStatus !== "DRAFT" &&
      invoice.invoiceStatus !== "CANCELLED",
  );
  const totalBilled = cassInvoices.reduce(
    (acc, inv) => acc + inv.totalAmount,
    0,
  );
  const totalGst = cassInvoices.reduce(
    (acc, inv) => acc + (inv.gstAmount || 0),
    0,
  );
  const reconciledCount = cassInvoices.filter(
    (i) => i.cassReconciliationStatus === "RECONCILED",
  ).length;

  const filteredInvoices = cassInvoices.filter((i) => {
    return filterCass === "ALL" || i.cassReconciliationStatus === filterCass;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight font-heading">
            Rates Engine, GST &amp; CASS Settlement
          </h1>
          <p className="text-sm sm:text-base text-slate-500 mt-1 font-sans">
            Quantity weight slab tariffs (+45 to +1000kg), statutory 18% GST
            invoicing, and IATA CASS reconciliation
          </p>
        </div>
      </div>

      {apiError && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{apiError}</span>
        </div>
      )}

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
          <span className="text-xs font-bold font-heading text-slate-500 uppercase tracking-wider block mb-1">
            Total Freight Invoiced
          </span>
          <span className="text-3xl font-extrabold font-heading text-slate-900 font-mono">
            {isLoading ? "..." : formatCurrency(totalBilled)}
          </span>
          <p className="text-xs text-slate-500 font-medium mt-2">
            Inclusive of airline FSC, SSC and terminal fees
          </p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
          <span className="text-xs font-bold font-heading text-slate-500 uppercase tracking-wider block mb-1">
            Statutory GST (18%)
          </span>
          <span className="text-3xl font-extrabold font-heading text-[#2C5EAD] font-mono">
            {isLoading ? "..." : formatCurrency(totalGst)}
          </span>
          <p className="text-xs text-slate-500 font-medium mt-2">
            CGST + SGST (9%+9%) or IGST (18%) tax ledger
          </p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
          <span className="text-xs font-bold font-heading text-slate-500 uppercase tracking-wider block mb-1">
            IATA CASS Clearing Status
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-heading text-emerald-600 font-mono">
              {isLoading
                ? "..."
                : `${reconciledCount} / ${cassInvoices.length}`}
            </span>
            <span className="text-xs text-emerald-700 font-bold">Cleared</span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-2">
            Cargo Accounts Settlement System billing cycle
          </p>
        </div>
      </div>

      {/* IATA Weight Slab Tariff Reference Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-7 shadow-xs">
        <h3 className="text-base font-bold font-heading text-slate-900 mb-2">
          IATA Standard Weight Slab Tariff Schedule
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 mb-5 font-normal">
          Published general cargo rates (GCR) applicable for standard
          international origin-destination city pairs
        </p>

        {/* ✅ Changed to INR amounts to match invoice module */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-center text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-400 font-bold block mb-1">Min (M)</span>
            <strong className="text-sm font-bold font-mono text-slate-900">
              ₹5,400
            </strong>
            <span className="text-[11px] text-slate-500 block">flat</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-400 font-bold block mb-1">
              Normal (N)
            </span>
            <strong className="text-sm font-bold font-mono text-slate-900">
              ₹435
            </strong>
            <span className="text-[11px] text-slate-500 block">&lt; 45 kg</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-400 font-bold block mb-1">+45 kg</span>
            <strong className="text-sm font-bold font-mono text-slate-900">
              ₹340
            </strong>
            <span className="text-[11px] text-slate-500 block">per kg</span>
          </div>
          <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200">
            <span className="text-[#2C5EAD] font-bold block mb-1">+100 kg</span>
            <strong className="text-sm font-bold font-mono text-[#2C5EAD]">
              ₹320
            </strong>
            <span className="text-[11px] text-slate-500 block">per kg</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-400 font-bold block mb-1">+300 kg</span>
            <strong className="text-sm font-bold font-mono text-slate-900">
              ₹285
            </strong>
            <span className="text-[11px] text-slate-500 block">per kg</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-400 font-bold block mb-1">+500 kg</span>
            <strong className="text-sm font-bold font-mono text-slate-900">
              ₹245
            </strong>
            <span className="text-[11px] text-slate-500 block">per kg</span>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
            <span className="text-emerald-700 font-bold block mb-1">
              +1000 kg
            </span>
            <strong className="text-sm font-bold font-mono text-emerald-700">
              ₹205
            </strong>
            <span className="text-[11px] text-slate-500 block">bulk tier</span>
          </div>
        </div>
      </div>

      {/* Invoices & CASS Ledger Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base font-bold font-heading text-slate-900">
              Customer Invoices &amp; CASS Clearing Ledger
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Tax invoices with freight, fuel surcharge (FSC), security
              surcharge (SSC) and CASS match states
            </p>
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            {["ALL", "RECONCILED", "PENDING_MATCH"].map((st) => (
              <button
                key={st}
                onClick={() => setFilterCass(st)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filterCass === st
                    ? "bg-[#2C5EAD] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="py-10 text-center text-slate-500">
              <Loader2 className="mx-auto h-6 w-6 animate-spin" />
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-sm italic border border-dashed rounded-xl">
              No invoices found matching this filter.
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold font-heading text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Invoice Number</th>
                  <th className="py-3.5 px-6">MAWB Reference</th>
                  <th className="py-3.5 px-6">Billed Customer</th>
                  <th className="py-3.5 px-6">Freight + Surcharges</th>
                  <th className="py-3.5 px-6">GST (18%)</th>
                  <th className="py-3.5 px-6">Total Billed</th>
                  <th className="py-3.5 px-6">CASS Settlement</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="py-4 px-6 font-mono font-bold text-[#2C5EAD]">
                      {inv.invoiceNumber || "Draft"}
                    </td>
                    <td className="py-4 px-6 font-mono font-bold text-slate-800">
                      {inv.mawbNumber}
                    </td>
                    <td className="py-4 px-6 font-semibold text-slate-900">
                      {inv.customerName}
                    </td>
                    <td className="py-4 px-6 font-mono text-xs">
                      {formatCurrency(inv.freightCharges)} +{" "}
                      {formatCurrency(inv.fuelSurcharge)} (FSC)
                    </td>
                    <td className="py-4 px-6 font-mono text-xs text-slate-700">
                      {formatCurrency(inv.gstAmount || 0)}
                    </td>
                    <td className="py-4 px-6 font-mono font-bold text-sm text-slate-900">
                      {formatCurrency(inv.totalAmount)}
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold font-heading ${
                          inv.cassReconciliationStatus === "RECONCILED"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {inv.cassReconciliationStatus || "PENDING_MATCH"}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {inv.cassReconciliationStatus !== "RECONCILED" && (
                          <button
                            onClick={() => handleReconcileCass(inv.id)}
                            className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold transition-colors"
                          >
                            Match CASS
                          </button>
                        )}
                        {inv.paymentStatus !== "PAID" ? (
                          <button
                            onClick={() => handleMarkPaid(inv.id)}
                            className="px-3 py-1 bg-[#2C5EAD] hover:bg-[#234c8d] text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                          >
                            Mark Paid
                          </button>
                        ) : (
                          <span className="text-xs font-bold text-emerald-700">
                            Paid ✓
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
