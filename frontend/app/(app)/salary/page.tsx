"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Printer } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import DataTable, { Column } from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import { TextField, SelectField, TextAreaField } from "@/components/ui/FormField";
import { useList, useCrudMutations } from "@/hooks/useCrud";
import { api, apiErrorMessage } from "@/lib/api";
import { formatCurrency, formatDate, monthName, refName } from "@/utils/format";
import type { Salary, Technician, AdvancePayment } from "@/types";

const salarySchema = z.object({
  technician: z.string().min(1, "Technician is required"),
  month: z.coerce.number().min(1).max(12),
  year: z.coerce.number().min(2000).max(2100),
  baseSalary: z.coerce.number().min(0),
  bonus: z.coerce.number().min(0),
  deductions: z.coerce.number().min(0),
  amountPaid: z.coerce.number().min(0),
  paymentMethod: z.string().optional(),
  paidDate: z.string().optional(),
  settleAdvances: z.boolean().optional(),
  remarks: z.string().optional(),
});

const advanceSchema = z.object({
  technician: z.string().min(1, "Technician is required"),
  amount: z.coerce.number().min(1, "Amount required"),
  date: z.string().min(1, "Date required"),
  reason: z.string().optional(),
});

type SalaryForm = z.infer<typeof salarySchema>;
type AdvanceForm = z.infer<typeof advanceSchema>;

export default function SalaryPage() {
  const [tab, setTab] = useState<"salaries" | "advances">("salaries");
  const salaries = useList<Salary>("salary");
  const advances = useList<AdvancePayment>("salary/advances");
  const technicians = useList<Technician>("technicians", { limit: 100 });
  const salaryMut = useCrudMutations("salary", ["salary/advances"]);
  const advanceMut = useCrudMutations("salary/advances", ["salary"]);
  const [salaryOpen, setSalaryOpen] = useState(false);
  const [advanceOpen, setAdvanceOpen] = useState(false);
  const [error, setError] = useState("");

  const sForm = useForm<z.input<typeof salarySchema>, unknown, SalaryForm>({ resolver: zodResolver(salarySchema) });
  const aForm = useForm<z.input<typeof advanceSchema>, unknown, AdvanceForm>({ resolver: zodResolver(advanceSchema) });

  const now = new Date();

  const openSalary = () => {
    setError("");
    sForm.reset({ technician: "", month: now.getMonth() + 1, year: now.getFullYear(), bonus: 0, deductions: 0, amountPaid: 0, paymentMethod: "bank-transfer", settleAdvances: false, remarks: "" });
    setSalaryOpen(true);
  };

  const openAdvance = () => {
    setError("");
    aForm.reset({ technician: "", amount: 0, date: now.toISOString().slice(0, 10), reason: "" });
    setAdvanceOpen(true);
  };

  const submitSalary = async (values: SalaryForm) => {
    setError("");
    const payload: Record<string, unknown> = { ...values };
    if (!payload.paidDate) delete payload.paidDate;
    if (payload.baseSalary === undefined || payload.baseSalary === 0) delete payload.baseSalary;
    try {
      await salaryMut.create.mutateAsync(payload);
      setSalaryOpen(false);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  };

  const submitAdvance = async (values: AdvanceForm) => {
    setError("");
    try {
      await advanceMut.create.mutateAsync({ ...values });
      setAdvanceOpen(false);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  };

  const printSlip = async (s: Salary) => {
    const res = await api.get(`/salary/${s._id}/slip`);
    const { salary, settledAdvances } = res.data.data as { salary: Salary; settledAdvances: AdvancePayment[] };
    const tech = salary.technician as Technician;
    const win = window.open("", "_blank", "width=800,height=900");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>Salary Slip — ${tech?.name}</title><style>
      body{font-family:-apple-system,'Segoe UI',Roboto,sans-serif;padding:40px;color:#1e293b;max-width:640px;margin:auto}
      h1{font-size:22px;margin:0}
      .sub{color:#64748b;font-size:13px;margin-bottom:24px}
      table{width:100%;border-collapse:collapse;font-size:14px;margin-top:16px}
      td{padding:9px 12px;border:1px solid #e2e8f0}
      td:first-child{color:#64748b;width:50%}
      .total td{font-weight:700;background:#f0fdfa}
      footer{margin-top:32px;font-size:11px;color:#94a3b8;display:flex;justify-content:space-between}
    </style></head><body>
      <h1>Salary Slip</h1>
      <p class="sub">${monthName(salary.month)} ${salary.year} · Generated ${new Date().toLocaleDateString()}</p>
      <table>
        <tr><td>Technician</td><td>${tech?.name || ""}</td></tr>
        <tr><td>Mobile</td><td>${tech?.mobile || ""}</td></tr>
        <tr><td>Base Salary</td><td>₹${salary.baseSalary.toLocaleString("en-IN")}</td></tr>
        <tr><td>Bonus</td><td>₹${salary.bonus.toLocaleString("en-IN")}</td></tr>
        <tr><td>Deductions</td><td>₹${salary.deductions.toLocaleString("en-IN")}</td></tr>
        <tr><td>Advance Deducted</td><td>₹${salary.advanceDeducted.toLocaleString("en-IN")}</td></tr>
        <tr class="total"><td>Net Payable</td><td>₹${salary.netPayable.toLocaleString("en-IN")}</td></tr>
        <tr><td>Amount Paid</td><td>₹${salary.amountPaid.toLocaleString("en-IN")}</td></tr>
        <tr><td>Status</td><td>${salary.status.toUpperCase()}</td></tr>
        <tr><td>Payment Method</td><td>${salary.paymentMethod || "—"}</td></tr>
        <tr><td>Paid Date</td><td>${salary.paidDate ? new Date(salary.paidDate).toLocaleDateString() : "—"}</td></tr>
        ${settledAdvances.length ? `<tr><td>Settled Advances</td><td>${settledAdvances.map((a) => `₹${a.amount.toLocaleString("en-IN")} (${new Date(a.date).toLocaleDateString()})`).join(", ")}</td></tr>` : ""}
        ${salary.remarks ? `<tr><td>Remarks</td><td>${salary.remarks}</td></tr>` : ""}
      </table>
      <footer><span>Elevator Service Management System</span><span>Authorized Signature: ______________</span></footer>
    </body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 300);
  };

  const salaryColumns: Column<Salary>[] = [
    { key: "technician", header: "Technician", render: (r) => refName(r.technician), exportValue: (r) => refName(r.technician) },
    { key: "period", header: "Period", render: (r) => `${monthName(r.month)} ${r.year}`, exportValue: (r) => `${monthName(r.month)} ${r.year}`, sortValue: (r) => r.year * 100 + r.month },
    { key: "baseSalary", header: "Base", render: (r) => formatCurrency(r.baseSalary), exportValue: (r) => r.baseSalary },
    { key: "bonus", header: "Bonus", render: (r) => formatCurrency(r.bonus), exportValue: (r) => r.bonus, hidden: true },
    { key: "advanceDeducted", header: "Advance", render: (r) => formatCurrency(r.advanceDeducted), exportValue: (r) => r.advanceDeducted },
    { key: "netPayable", header: "Net", render: (r) => formatCurrency(r.netPayable), exportValue: (r) => r.netPayable },
    { key: "amountPaid", header: "Paid", render: (r) => formatCurrency(r.amountPaid), exportValue: (r) => r.amountPaid },
    { key: "status", header: "Status", render: (r) => <Badge status={r.status} />, exportValue: (r) => r.status },
    {
      key: "actions",
      header: "Actions",
      exportValue: () => "",
      render: (r) => (
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <button className="text-xs font-semibold text-aqua-600 hover:underline" onClick={() => printSlip(r)}>
            <Printer className="inline h-3 w-3" /> Slip
          </button>
          {r.status !== "paid" && (
            <button
              className="text-xs font-semibold text-emerald-600 hover:underline"
              onClick={async () => {
                const amt = prompt(`Record payment for ${refName(r.technician)} (${monthName(r.month)} ${r.year}). Remaining: ${formatCurrency(r.netPayable - r.amountPaid)}`);
                if (amt) await salaryMut.update.mutateAsync({ id: r._id, amountPaid: r.amountPaid + Number(amt), paidDate: new Date().toISOString() });
              }}
            >
              Pay
            </button>
          )}
          <button className="text-xs font-semibold text-rose-500 hover:underline" onClick={() => { if (confirm("Delete salary record?")) salaryMut.remove.mutate(r._id); }}>Delete</button>
        </div>
      ),
    },
  ];

  const advanceColumns: Column<AdvancePayment>[] = [
    { key: "technician", header: "Technician", render: (r) => refName(r.technician), exportValue: (r) => refName(r.technician) },
    { key: "amount", header: "Amount", render: (r) => formatCurrency(r.amount), exportValue: (r) => r.amount },
    { key: "date", header: "Date", render: (r) => formatDate(r.date), exportValue: (r) => formatDate(r.date) },
    { key: "reason", header: "Reason", exportValue: (r) => r.reason || "" },
    { key: "status", header: "Status", render: (r) => <Badge status={r.status} />, exportValue: (r) => r.status },
    {
      key: "actions",
      header: "Actions",
      exportValue: () => "",
      render: (r) => (
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          {r.status === "outstanding" && (
            <button className="text-xs font-semibold text-emerald-600 hover:underline" onClick={() => advanceMut.update.mutate({ id: r._id, status: "settled" })}>Settle</button>
          )}
          <button className="text-xs font-semibold text-rose-500 hover:underline" onClick={() => { if (confirm("Delete advance?")) advanceMut.remove.mutate(r._id); }}>Delete</button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Salary Management"
        subtitle="Monthly salaries, advances and salary slips"
        actions={
          <>
            <button className="btn-ghost" onClick={openAdvance}><Plus className="h-4 w-4" /> Advance</button>
            <button className="btn-primary" onClick={openSalary}><Plus className="h-4 w-4" /> Salary Record</button>
          </>
        }
      />

      <div className="mb-4 flex gap-2 no-print">
        {(["salaries", "advances"] as const).map((t) => (
          <button key={t} className={`rounded-2xl px-4 py-2 text-sm font-semibold capitalize ${tab === t ? "bg-aqua-500 text-white shadow-glow" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"}`} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {tab === "salaries" ? (
        <DataTable title="Salary Records" columns={salaryColumns} rows={salaries.rows} loading={salaries.isLoading} page={salaries.page} pages={salaries.pages} total={salaries.total} onPageChange={salaries.setPage} />
      ) : (
        <DataTable title="Advance Payments" columns={advanceColumns} rows={advances.rows} loading={advances.isLoading} page={advances.page} pages={advances.pages} total={advances.total} onPageChange={advances.setPage} />
      )}

      <Modal open={salaryOpen} onClose={() => setSalaryOpen(false)} title="New Salary Record" wide>
        <form onSubmit={sForm.handleSubmit(submitSalary)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {error && <div className="sm:col-span-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600 dark:bg-rose-900/20 dark:text-rose-300">{error}</div>}
          <SelectField label="Technician" {...sForm.register("technician")} error={sForm.formState.errors.technician?.message}>
            <option value="">Select technician...</option>
            {technicians.rows.map((t) => <option key={t._id} value={t._id}>{t.name} ({formatCurrency(t.monthlySalary)})</option>)}
          </SelectField>
          <div className="grid grid-cols-2 gap-2">
            <SelectField label="Month" {...sForm.register("month")}>
              {Array.from({ length: 12 }).map((_, i) => <option key={i + 1} value={i + 1}>{monthName(i + 1)}</option>)}
            </SelectField>
            <TextField label="Year" type="number" {...sForm.register("year")} />
          </div>
          <TextField label="Base Salary (blank = technician default)" type="number" {...sForm.register("baseSalary")} />
          <TextField label="Bonus" type="number" {...sForm.register("bonus")} />
          <TextField label="Deductions" type="number" {...sForm.register("deductions")} />
          <TextField label="Amount Paid Now" type="number" {...sForm.register("amountPaid")} />
          <SelectField label="Payment Method" {...sForm.register("paymentMethod")}>
            {["bank-transfer", "cash", "upi", "cheque"].map((m) => <option key={m} value={m}>{m}</option>)}
          </SelectField>
          <TextField label="Paid Date" type="date" {...sForm.register("paidDate")} />
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" className="accent-aqua-500" {...sForm.register("settleAdvances")} />
            Settle outstanding advances against this salary
          </label>
          <div className="sm:col-span-2"><TextAreaField label="Remarks" {...sForm.register("remarks")} /></div>
          <div className="sm:col-span-2 flex justify-end gap-2">
            <button type="button" className="btn-ghost" onClick={() => setSalaryOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={sForm.formState.isSubmitting}>Create Record</button>
          </div>
        </form>
      </Modal>

      <Modal open={advanceOpen} onClose={() => setAdvanceOpen(false)} title="New Advance Payment">
        <form onSubmit={aForm.handleSubmit(submitAdvance)} className="space-y-4">
          {error && <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600 dark:bg-rose-900/20 dark:text-rose-300">{error}</div>}
          <SelectField label="Technician" {...aForm.register("technician")} error={aForm.formState.errors.technician?.message}>
            <option value="">Select technician...</option>
            {technicians.rows.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
          </SelectField>
          <TextField label="Amount" type="number" {...aForm.register("amount")} error={aForm.formState.errors.amount?.message} />
          <TextField label="Date" type="date" {...aForm.register("date")} error={aForm.formState.errors.date?.message} />
          <TextField label="Reason" {...aForm.register("reason")} />
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-ghost" onClick={() => setAdvanceOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={aForm.formState.isSubmitting}>Record Advance</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
