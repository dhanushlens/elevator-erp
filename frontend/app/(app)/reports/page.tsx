"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileDown, FileSpreadsheet, FileText, Printer } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import { SkeletonBlock } from "@/components/ui/Skeleton";
import { api } from "@/lib/api";
import { exportCsv, exportExcel, exportPdf, printTable } from "@/utils/export";
import { formatCurrency, formatDate, monthName, refName, titleCase } from "@/utils/format";

type Row = Record<string, unknown>;
interface ReportColumn { key: string; header: string; value: (r: Row) => string | number }

const RANGES = [
  "today", "yesterday", "this-week", "last-week", "this-month", "last-month",
  "3-months", "6-months", "1-year", "3-years", "lifetime", "custom",
];

const num = (v: unknown) => (typeof v === "number" ? v : 0);
const str = (v: unknown) => (v == null ? "" : String(v));

const REPORT_COLUMNS: Record<string, ReportColumn[]> = {
  customers: [
    { key: "name", header: "Name", value: (r) => str(r.name) },
    { key: "company", header: "Company", value: (r) => refName(r.company) },
    { key: "phone", header: "Phone", value: (r) => str(r.phone) },
    { key: "email", header: "Email", value: (r) => str(r.email) },
    { key: "city", header: "City", value: (r) => str(r.city) },
    { key: "createdAt", header: "Created", value: (r) => formatDate(r.createdAt as string) },
  ],
  companies: [
    { key: "name", header: "Name", value: (r) => str(r.name) },
    { key: "city", header: "City", value: (r) => str(r.city) },
    { key: "phone", header: "Phone", value: (r) => str(r.phone) },
    { key: "email", header: "Email", value: (r) => str(r.email) },
    { key: "createdAt", header: "Created", value: (r) => formatDate(r.createdAt as string) },
  ],
  elevators: [
    { key: "code", header: "Code", value: (r) => str(r.code) },
    { key: "customer", header: "Customer", value: (r) => refName(r.customer) },
    { key: "building", header: "Building", value: (r) => str(r.building) },
    { key: "elevatorType", header: "Type", value: (r) => titleCase(str(r.elevatorType)) },
    { key: "status", header: "Status", value: (r) => titleCase(str(r.status)) },
    { key: "amcExpiry", header: "AMC Expiry", value: (r) => formatDate(r.amcExpiry as string) },
    { key: "assignedTechnician", header: "Technician", value: (r) => refName(r.assignedTechnician) },
  ],
  services: [
    { key: "serviceNumber", header: "Service #", value: (r) => str(r.serviceNumber) },
    { key: "visitDate", header: "Visit", value: (r) => formatDate(r.visitDate as string) },
    { key: "customer", header: "Customer", value: (r) => refName(r.customer) },
    { key: "elevator", header: "Elevator", value: (r) => refName(r.elevator, "code") },
    { key: "serviceType", header: "Type", value: (r) => titleCase(str(r.serviceType)) },
    { key: "technician", header: "Technician", value: (r) => refName(r.technician) },
    { key: "status", header: "Status", value: (r) => titleCase(str(r.status)) },
    { key: "cost", header: "Cost", value: (r) => formatCurrency(num(r.cost)) },
  ],
  technicians: [
    { key: "name", header: "Name", value: (r) => str(r.name) },
    { key: "mobile", header: "Mobile", value: (r) => str(r.mobile) },
    { key: "total", header: "Services (range)", value: (r) => num((r.stats as Row)?.total) },
    { key: "completed", header: "Completed", value: (r) => num((r.stats as Row)?.completed) },
    { key: "revenue", header: "Revenue", value: (r) => formatCurrency(num((r.stats as Row)?.revenue)) },
    { key: "performanceRating", header: "Rating", value: (r) => num(r.performanceRating) },
  ],
  salary: [
    { key: "technician", header: "Technician", value: (r) => refName(r.technician) },
    { key: "period", header: "Period", value: (r) => `${monthName(num(r.month))} ${num(r.year)}` },
    { key: "baseSalary", header: "Base", value: (r) => formatCurrency(num(r.baseSalary)) },
    { key: "advanceDeducted", header: "Advance", value: (r) => formatCurrency(num(r.advanceDeducted)) },
    { key: "netPayable", header: "Net", value: (r) => formatCurrency(num(r.netPayable)) },
    { key: "amountPaid", header: "Paid", value: (r) => formatCurrency(num(r.amountPaid)) },
    { key: "status", header: "Status", value: (r) => titleCase(str(r.status)) },
  ],
  attendance: [
    { key: "technician", header: "Technician", value: (r) => refName(r.technician) },
    { key: "date", header: "Date", value: (r) => formatDate(r.date as string) },
    { key: "status", header: "Status", value: (r) => titleCase(str(r.status)) },
    { key: "checkIn", header: "In", value: (r) => str(r.checkIn) },
    { key: "checkOut", header: "Out", value: (r) => str(r.checkOut) },
  ],
  payments: [
    { key: "invoiceNumber", header: "Invoice #", value: (r) => str(r.invoiceNumber) },
    { key: "customer", header: "Customer", value: (r) => refName(r.customer) },
    { key: "issueDate", header: "Issued", value: (r) => formatDate(r.issueDate as string) },
    { key: "total", header: "Total", value: (r) => formatCurrency(num(r.total)) },
    { key: "amountPaid", header: "Paid", value: (r) => formatCurrency(num(r.amountPaid)) },
    { key: "status", header: "Status", value: (r) => titleCase(str(r.status)) },
  ],
  revenue: [
    { key: "period", header: "Period", value: (r) => { const id = r._id as Row; return `${monthName(num(id?.month))} ${num(id?.year)}`; } },
    { key: "billed", header: "Billed", value: (r) => formatCurrency(num(r.billed)) },
    { key: "collected", header: "Collected", value: (r) => formatCurrency(num(r.collected)) },
    { key: "invoices", header: "Invoices", value: (r) => num(r.invoices) },
  ],
  amc: [
    { key: "code", header: "Elevator", value: (r) => str(r.code) },
    { key: "customer", header: "Customer", value: (r) => refName(r.customer) },
    { key: "building", header: "Building", value: (r) => str(r.building) },
    { key: "amcExpiry", header: "AMC Expiry", value: (r) => formatDate(r.amcExpiry as string) },
    { key: "status", header: "Status", value: (r) => titleCase(str(r.status)) },
  ],
  warranty: [
    { key: "code", header: "Elevator", value: (r) => str(r.code) },
    { key: "customer", header: "Customer", value: (r) => refName(r.customer) },
    { key: "building", header: "Building", value: (r) => str(r.building) },
    { key: "warrantyExpiry", header: "Warranty Expiry", value: (r) => formatDate(r.warrantyExpiry as string) },
    { key: "status", header: "Status", value: (r) => titleCase(str(r.status)) },
  ],
};

export default function ReportsPage() {
  const [type, setType] = useState("services");
  const [range, setRange] = useState("this-month");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const params = useMemo(
    () => ({ range, ...(range === "custom" ? { from, to } : {}) }),
    [range, from, to]
  );

  const { data, isLoading } = useQuery<{ data: Row[]; dateRange: { from: string; to: string } }>({
    queryKey: ["report", type, params],
    queryFn: async () => (await api.get(`/reports/${type}`, { params })).data,
    enabled: range !== "custom" || (!!from && !!to),
  });

  const rows = data?.data || [];
  const columns = REPORT_COLUMNS[type] || [];
  const title = `${titleCase(type)} Report — ${titleCase(range)}`;
  const exportCols = columns.map((c) => ({ header: c.header, value: c.value }));

  return (
    <div>
      <PageHeader title="Reports" subtitle="Generate, print and export reports for every module" />

      <div className="card mb-4 flex flex-wrap items-end gap-3 p-4 no-print">
        <div>
          <label className="label">Report Type</label>
          <select className="input !w-48" value={type} onChange={(e) => setType(e.target.value)}>
            {Object.keys(REPORT_COLUMNS).map((t) => <option key={t} value={t}>{titleCase(t)}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Date Range</label>
          <select className="input !w-44" value={range} onChange={(e) => setRange(e.target.value)}>
            {RANGES.map((r) => <option key={r} value={r}>{titleCase(r)}</option>)}
          </select>
        </div>
        {range === "custom" && (
          <>
            <div><label className="label">From</label><input type="date" className="input !w-40" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
            <div><label className="label">To</label><input type="date" className="input !w-40" value={to} onChange={(e) => setTo(e.target.value)} /></div>
          </>
        )}
        <div className="ml-auto flex gap-2">
          <button className="btn-ghost" onClick={() => exportCsv(rows, exportCols, `${type}-report`)}><FileText className="h-4 w-4" /> CSV</button>
          <button className="btn-ghost" onClick={() => exportExcel(rows, exportCols, `${type}-report`)}><FileSpreadsheet className="h-4 w-4" /> Excel</button>
          <button className="btn-ghost" onClick={() => exportPdf(rows, exportCols, `${type}-report`, title)}><FileDown className="h-4 w-4" /> PDF</button>
          <button className="btn-primary" onClick={() => printTable(rows, exportCols, title)}><Printer className="h-4 w-4" /> Print</button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <h3 className="text-sm font-bold">{title}</h3>
          {data?.dateRange && (
            <p className="text-xs text-slate-400">{formatDate(data.dateRange.from)} → {formatDate(data.dateRange.to)} · {rows.length} records</p>
          )}
        </div>
        {isLoading ? (
          <div className="p-5"><SkeletonBlock className="h-64" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800">
                <tr>
                  {columns.map((c) => (
                    <th key={c.key} className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">{c.header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-t border-slate-50 hover:bg-aqua-50/40 dark:border-slate-800 dark:hover:bg-slate-800/50">
                    {columns.map((c) => <td key={c.key} className="px-5 py-3">{c.value(r)}</td>)}
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td colSpan={columns.length} className="px-5 py-12 text-center text-slate-400">No records in this range</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
