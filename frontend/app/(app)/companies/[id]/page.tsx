"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Building2, CalendarDays, CircleArrowUp, IndianRupee, List, Printer, Users } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";
import StatCard from "@/components/ui/StatCard";
import { SkeletonBlock } from "@/components/ui/Skeleton";
import { useItem } from "@/hooks/useCrud";
import { exportCsv, printTable } from "@/utils/export";
import { formatCurrency, formatDate, titleCase } from "@/utils/format";
import type { Company, Customer, Elevator } from "@/types";

interface Visit {
  _id: string;
  serviceNumber: string;
  date: string;
  time?: string;
  reason?: string;
  complaint?: string;
  technician?: { name?: string; photo?: string } | null;
  partsReplaced?: { name?: string; quantity?: number; cost?: number }[];
  workDone?: string;
  photos?: string[];
  serviceCost?: number;
  customerSignature?: string;
  remarks?: string;
  status: string;
  durationMinutes?: number;
  elevator?: string;
  customer?: string;
}

interface History {
  company: Company;
  customers: Customer[];
  elevators: Elevator[];
  totals: {
    customers: number;
    elevators: number;
    visits: number;
    revenue: number;
    pendingServices: number;
    amcActive: number;
    warrantyActive: number;
  };
  visitHistory: Visit[];
}

export default function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useItem<History>("companies", id, "/history");
  const [view, setView] = useState<"timeline" | "calendar">("timeline");
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [calMonth, setCalMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const visits = useMemo(() => {
    let v = data?.visitHistory || [];
    if (filter) {
      const f = filter.toLowerCase();
      v = v.filter(
        (x) =>
          x.serviceNumber?.toLowerCase().includes(f) ||
          x.complaint?.toLowerCase().includes(f) ||
          x.workDone?.toLowerCase().includes(f) ||
          x.technician?.name?.toLowerCase().includes(f) ||
          x.elevator?.toLowerCase().includes(f)
      );
    }
    if (statusFilter) v = v.filter((x) => x.status === statusFilter);
    return v;
  }, [data, filter, statusFilter]);

  if (isLoading || !data) return <SkeletonBlock className="h-96" />;
  const { company, totals } = data;

  const exportColumns = [
    { header: "Service #", value: (v: Visit) => v.serviceNumber },
    { header: "Date", value: (v: Visit) => formatDate(v.date) },
    { header: "Time", value: (v: Visit) => v.time || "" },
    { header: "Reason", value: (v: Visit) => titleCase(v.reason) },
    { header: "Complaint", value: (v: Visit) => v.complaint || "" },
    { header: "Technician", value: (v: Visit) => v.technician?.name || "" },
    { header: "Parts Replaced", value: (v: Visit) => (v.partsReplaced || []).map((p) => `${p.name} x${p.quantity}`).join("; ") },
    { header: "Work Done", value: (v: Visit) => v.workDone || "" },
    { header: "Cost", value: (v: Visit) => v.serviceCost || 0 },
    { header: "Status", value: (v: Visit) => v.status },
    { header: "Duration (min)", value: (v: Visit) => v.durationMinutes || 0 },
    { header: "Remarks", value: (v: Visit) => v.remarks || "" },
  ];

  const daysInMonth = new Date(calMonth.year, calMonth.month + 1, 0).getDate();
  const visitsByDay: Record<number, Visit[]> = {};
  visits.forEach((v) => {
    const d = new Date(v.date);
    if (d.getFullYear() === calMonth.year && d.getMonth() === calMonth.month) {
      const day = d.getDate();
      visitsByDay[day] = visitsByDay[day] || [];
      visitsByDay[day].push(v);
    }
  });

  return (
    <div>
      <PageHeader
        title={company.name}
        subtitle={`${company.city || ""} ${company.state || ""} · GST: ${company.gst || "—"}`}
        actions={
          <>
            <button className="btn-ghost" onClick={() => exportCsv(visits, exportColumns, `${company.name}-history`)}>Export</button>
            <button className="btn-ghost" onClick={() => printTable(visits, exportColumns, `${company.name} — Visit History`)}>
              <Printer className="h-4 w-4" /> Print
            </button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="Total Visits" value={totals.visits} icon={List} />
        <StatCard title="Total Elevators" value={totals.elevators} icon={CircleArrowUp} accent="violet" delay={0.05} />
        <StatCard title="Customers" value={totals.customers} icon={Users} accent="blue" delay={0.1} />
        <StatCard title="Total Revenue" value={totals.revenue} icon={IndianRupee} prefix="₹" delay={0.15} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold"><Building2 className="h-4 w-4 text-aqua-500" /> Buildings</h3>
          {(company.buildings || []).length === 0 && <p className="text-sm text-slate-400">No buildings recorded</p>}
          {(company.buildings || []).map((b, i) => (
            <div key={i} className="mb-2 rounded-2xl border border-slate-100 px-4 py-2.5 text-sm dark:border-slate-800">
              <p className="font-semibold">{b.name}</p>
              <p className="text-xs text-slate-400">{b.address} · {b.floors ? `${b.floors} floors` : ""}</p>
            </div>
          ))}
        </div>
        <div className="card p-5">
          <h3 className="mb-3 text-sm font-bold">Status</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">Pending Services</dt><dd className="font-bold text-amber-500">{totals.pendingServices}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Active AMC</dt><dd className="font-bold text-emerald-500">{totals.amcActive}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Active Warranty</dt><dd className="font-bold text-emerald-500">{totals.warrantyActive}</dd></div>
          </dl>
        </div>
        <div className="card p-5">
          <h3 className="mb-3 text-sm font-bold">Customers</h3>
          {data.customers.map((c) => (
            <Link key={c._id} href={`/customers/${c._id}`} className="mb-1 flex items-center justify-between rounded-xl px-2 py-1.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800">
              <span className="font-medium">{c.name}</span>
              <span className="text-xs text-slate-400">{c.phone}</span>
            </Link>
          ))}
          {data.customers.length === 0 && <p className="text-sm text-slate-400">No customers linked</p>}
        </div>
      </div>

      <div className="card mt-4 p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 no-print">
          <h3 className="text-sm font-bold">Complete Visit History ({visits.length})</h3>
          <div className="flex flex-wrap items-center gap-2">
            <input className="input !w-48" placeholder="Search visits..." value={filter} onChange={(e) => setFilter(e.target.value)} />
            <select className="input !w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All statuses</option>
              {["scheduled", "in-progress", "completed", "pending", "cancelled"].map((s) => (
                <option key={s} value={s}>{titleCase(s)}</option>
              ))}
            </select>
            <div className="flex overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700">
              <button className={`px-3 py-2 text-sm font-medium ${view === "timeline" ? "bg-aqua-500 text-white" : ""}`} onClick={() => setView("timeline")}>
                <List className="h-4 w-4" />
              </button>
              <button className={`px-3 py-2 text-sm font-medium ${view === "calendar" ? "bg-aqua-500 text-white" : ""}`} onClick={() => setView("calendar")}>
                <CalendarDays className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {view === "timeline" ? (
          <ol className="relative ml-3 space-y-5 border-l-2 border-aqua-200 pl-6 dark:border-aqua-800">
            {visits.map((v) => (
              <li key={v._id} className="relative">
                <span className="absolute -left-[31px] top-1 h-3 w-3 rounded-full bg-aqua-400 ring-4 ring-aqua-100 dark:ring-aqua-900" />
                <Link href={`/services/${v._id}`} className="-m-2 block rounded-2xl p-2 hover:bg-slate-50 dark:hover:bg-slate-800">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-semibold">{formatDate(v.date)}{v.time ? ` · ${v.time}` : ""}</span>
                    <Badge status={v.status} />
                    <span className="text-xs text-slate-400">{v.serviceNumber} · {titleCase(v.reason)} · {v.elevator}</span>
                  </div>
                  {v.complaint && <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Complaint: {v.complaint}</p>}
                  {v.workDone && <p className="text-sm text-slate-500">Work done: {v.workDone}</p>}
                  {(v.partsReplaced || []).length > 0 && (
                    <p className="text-xs text-slate-400">Parts: {(v.partsReplaced || []).map((p) => `${p.name} ×${p.quantity}`).join(", ")}</p>
                  )}
                  <p className="mt-0.5 text-xs text-slate-400">
                    {v.technician?.name ? `Technician: ${v.technician.name} · ` : ""}
                    Cost: {formatCurrency(v.serviceCost)} · Duration: {v.durationMinutes || 0} min
                    {v.customerSignature ? " · Signed ✓" : ""}
                  </p>
                  {v.remarks && <p className="text-xs italic text-slate-400">Remarks: {v.remarks}</p>}
                </Link>
              </li>
            ))}
            {visits.length === 0 && <p className="text-sm text-slate-400">No visits match your filters</p>}
          </ol>
        ) : (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <button className="btn-ghost" onClick={() => setCalMonth((p) => (p.month === 0 ? { year: p.year - 1, month: 11 } : { ...p, month: p.month - 1 }))}>←</button>
              <p className="font-semibold">
                {new Date(calMonth.year, calMonth.month).toLocaleString("en", { month: "long", year: "numeric" })}
              </p>
              <button className="btn-ghost" onClick={() => setCalMonth((p) => (p.month === 11 ? { year: p.year + 1, month: 0 } : { ...p, month: p.month + 1 }))}>→</button>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dayVisits = visitsByDay[day] || [];
                return (
                  <div key={day} className={`min-h-16 rounded-2xl border p-2 text-xs ${dayVisits.length ? "border-aqua-300 bg-aqua-50/50 dark:border-aqua-700 dark:bg-aqua-900/20" : "border-slate-100 dark:border-slate-800"}`}>
                    <p className="font-bold text-slate-400">{day}</p>
                    {dayVisits.map((v) => (
                      <Link key={v._id} href={`/services/${v._id}`} className="mt-1 block truncate rounded-lg bg-aqua-500/90 px-1.5 py-0.5 text-[10px] font-medium text-white">
                        {v.time || ""} {v.elevator}
                      </Link>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
