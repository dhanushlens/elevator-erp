"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { IndianRupee, Printer } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { SkeletonBlock } from "@/components/ui/Skeleton";
import { useItem } from "@/hooks/useCrud";
import { api, apiErrorMessage } from "@/lib/api";
import { formatCurrency, formatDate, refName } from "@/utils/format";
import type { Invoice } from "@/types";

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: invoice, isLoading } = useItem<Invoice>("invoices", id);
  const queryClient = useQueryClient();
  const [payOpen, setPayOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");

  const payMutation = useMutation({
    mutationFn: async (amt: number) => (await api.post(`/invoices/${id}/payment`, { amount: amt })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      setPayOpen(false);
      setAmount("");
    },
    onError: (err) => setError(apiErrorMessage(err)),
  });

  if (isLoading || !invoice) return <SkeletonBlock className="h-96" />;

  const balance = invoice.total - invoice.amountPaid;

  return (
    <div>
      <PageHeader
        title={invoice.invoiceNumber}
        subtitle={`${refName(invoice.customer)} · Issued ${formatDate(invoice.issueDate)}`}
        actions={
          <>
            {balance > 0 && (
              <button className="btn-primary" onClick={() => setPayOpen(true)}>
                <IndianRupee className="h-4 w-4" /> Record Payment
              </button>
            )}
            <button className="btn-ghost" onClick={() => window.print()}><Printer className="h-4 w-4" /> Print</button>
          </>
        }
      />

      <div className="card p-6">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold">Invoice {invoice.invoiceNumber}</h2>
            <p className="text-sm text-slate-500">Issue: {formatDate(invoice.issueDate)} · Due: {formatDate(invoice.dueDate)}</p>
          </div>
          <Badge status={invoice.status} />
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Billed To</h4>
            <p className="mt-1 font-semibold">{refName(invoice.customer)}</p>
            <p className="text-sm text-slate-500">{refName(invoice.company)}</p>
          </div>
          {invoice.service && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Service</h4>
              <p className="mt-1 font-semibold">{refName(invoice.service, "serviceNumber")}</p>
            </div>
          )}
        </div>

        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-400 dark:border-slate-700">
              <th className="py-2">Description</th>
              <th className="py-2 text-right">Qty</th>
              <th className="py-2 text-right">Rate</th>
              <th className="py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, i) => (
              <tr key={i} className="border-b border-slate-50 dark:border-slate-800">
                <td className="py-2.5">{item.description}</td>
                <td className="py-2.5 text-right">{item.quantity}</td>
                <td className="py-2.5 text-right">{formatCurrency(item.rate)}</td>
                <td className="py-2.5 text-right font-medium">{formatCurrency(item.amount ?? item.quantity * item.rate)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 ml-auto max-w-xs space-y-1.5 text-sm">
          <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span className="font-medium">{formatCurrency(invoice.subtotal)}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Tax ({invoice.taxPercent}%)</span><span className="font-medium">{formatCurrency(invoice.taxAmount)}</span></div>
          {invoice.discount > 0 && <div className="flex justify-between"><span className="text-slate-500">Discount</span><span className="font-medium">-{formatCurrency(invoice.discount)}</span></div>}
          <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold dark:border-slate-700"><span>Total</span><span>{formatCurrency(invoice.total)}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Paid</span><span className="font-medium text-emerald-600">{formatCurrency(invoice.amountPaid)}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Balance</span><span className={`font-bold ${balance > 0 ? "text-rose-500" : "text-emerald-500"}`}>{formatCurrency(balance)}</span></div>
        </div>

        {invoice.notes && <p className="mt-6 rounded-2xl bg-slate-50 p-3 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">{invoice.notes}</p>}
      </div>

      <Modal open={payOpen} onClose={() => setPayOpen(false)} title="Record Payment">
        {error && <div className="mb-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600 dark:bg-rose-900/20 dark:text-rose-300">{error}</div>}
        <p className="mb-3 text-sm text-slate-500">Outstanding balance: <span className="font-bold text-rose-500">{formatCurrency(balance)}</span></p>
        <label className="label">Amount</label>
        <input type="number" min={1} max={balance} className="input" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <div className="mt-4 flex justify-end gap-2">
          <button className="btn-ghost" onClick={() => setPayOpen(false)}>Cancel</button>
          <button
            className="btn-primary"
            disabled={payMutation.isPending || !amount}
            onClick={() => {
              setError("");
              payMutation.mutate(Number(amount));
            }}
          >
            {payMutation.isPending ? "Recording..." : "Record Payment"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
