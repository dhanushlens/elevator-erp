"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Briefcase, CheckCircle2, IndianRupee, Printer, Star, Wallet } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";
import StatCard from "@/components/ui/StatCard";
import { SkeletonBlock } from "@/components/ui/Skeleton";
import { useItem } from "@/hooks/useCrud";
import { formatCurrency, formatDate, monthName, refName, titleCase } from "@/utils/format";
import type { Technician, Salary, AdvancePayment, Attendance, Elevator, Service } from "@/types";

interface Overview {
  technician: Technician;
  salary: { monthly?: number; advanceGiven: number; pending: number; paid: number; history: Salary[] };
  advances: AdvancePayment[];
  attendance: Attendance[];
  assignedElevators: Elevator[];
  jobs: { assigned: Service[]; completed: Service[]; upcoming: Service[] };
  stats: { serviceCount: number; completedCount: number; performanceRating?: number };
  monthlyPerformance: { _id: { year: number; month: number }; completed: number; revenue: number; avgDuration: number }[];
}

const ATTENDANCE_COLORS: Record<string, string> = {
  present: "bg-emerald-400",
  absent: "bg-rose-400",
  "half-day": "bg-amber-400",
  leave: "bg-violet-400",
  holiday: "bg-slate-300",
};

export default function TechnicianDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useItem<Overview>("technicians", id, "/overview");
  const [calMonth, setCalMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [jobTab, setJobTab] = useState<"assigned" | "upcoming" | "completed">("assigned");

  if (isLoading || !data) return <SkeletonBlock className="h-96" />;
  const { technician, salary, stats } = data;

  const perfSeries = data.monthlyPerformance.map((m) => ({
    month: `${monthName(m._id.month)} ${String(m._id.year).slice(2)}`,
    Completed: m.completed,
    Revenue: m.revenue,
  }));

  const daysInMonth = new Date(calMonth.year, calMonth.month + 1, 0).getDate();
  const attByDay: Record<number, Attendance> = {};
  data.attendance.forEach((a) => {
    const d = new Date(a.date);
    if (d.getFullYear() === calMonth.year && d.getMonth() === calMonth.month) attByDay[d.getDate()] = a;
  });

  const jobs = data.jobs[jobTab];

  return (
    <div>
      <PageHeader
        title={technician.name}
        subtitle={`${technician.mobile} · Joined ${formatDate(technician.joiningDate)} · ${(technician.skills || []).join(", ")}`}
        actions={<button className="btn-ghost" onClick={() => window.print()}><Printer className="h-4 w-4" /> Print</button>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="Monthly Salary" value={salary.monthly || 0} icon={Wallet} prefix="₹" />
        <StatCard title="Advance Given" value={salary.advanceGiven} icon={IndianRupee} prefix="₹" accent="amber" delay={0.05} />
        <StatCard title="Pending Salary" value={salary.pending} icon={IndianRupee} prefix="₹" accent="rose" delay={0.1} />
        <StatCard title="Salary Paid" value={salary.paid} icon={CheckCircle2} prefix="₹" delay={0.15} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="Total Services" value={stats.serviceCount} icon={Briefcase} accent="blue" />
        <StatCard title="Completed Jobs" value={stats.completedCount} icon={CheckCircle2} delay={0.05} />
        <div className="card card-hover col-span-2 flex items-center justify-between p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Performance Rating</p>
            <p className="mt-2 flex items-center gap-2 text-2xl font-bold">
              <Star className="h-6 w-6 fill-amber-400 text-amber-400" />
              {(stats.performanceRating || 0).toFixed(1)} / 5
            </p>
          </div>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className={`h-5 w-5 ${i <= Math.round(stats.performanceRating || 0) ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="card p-5">
          <h3 className="mb-4 text-sm font-bold">Monthly Performance</h3>
          {perfSeries.length === 0 ? (
            <p className="py-16 text-center text-sm text-slate-400">No completed services yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={perfSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="Completed" fill="#16a9a3" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold">Attendance Calendar</h3>
            <div className="flex items-center gap-2">
              <button className="btn-ghost !p-1.5" onClick={() => setCalMonth((p) => (p.month === 0 ? { year: p.year - 1, month: 11 } : { ...p, month: p.month - 1 }))}>←</button>
              <span className="text-sm font-medium">{new Date(calMonth.year, calMonth.month).toLocaleString("en", { month: "short", year: "numeric" })}</span>
              <button className="btn-ghost !p-1.5" onClick={() => setCalMonth((p) => (p.month === 11 ? { year: p.year + 1, month: 0 } : { ...p, month: p.month + 1 }))}>→</button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const a = attByDay[day];
              return (
                <div key={day} title={a ? titleCase(a.status) : "No record"} className={`flex h-9 items-center justify-center rounded-xl text-xs font-semibold ${a ? `${ATTENDANCE_COLORS[a.status]} text-white` : "bg-slate-100 text-slate-400 dark:bg-slate-800"}`}>
                  {day}
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
            {Object.entries(ATTENDANCE_COLORS).map(([k, v]) => (
              <span key={k} className="flex items-center gap-1"><span className={`h-2.5 w-2.5 rounded-full ${v}`} /> {titleCase(k)}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="card p-5">
          <div className="mb-3 flex items-center gap-2">
            {(["assigned", "upcoming", "completed"] as const).map((t) => (
              <button key={t} className={`rounded-2xl px-3 py-1.5 text-sm font-medium ${jobTab === t ? "bg-aqua-500 text-white" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"}`} onClick={() => setJobTab(t)}>
                {titleCase(t)} ({data.jobs[t].length})
              </button>
            ))}
          </div>
          <div className="max-h-80 space-y-2 overflow-y-auto">
            {jobs.map((j) => (
              <Link key={j._id} href={`/services/${j._id}`} className="flex items-center justify-between rounded-2xl border border-slate-100 px-4 py-2.5 text-sm hover:bg-aqua-50/50 dark:border-slate-800 dark:hover:bg-slate-800">
                <div>
                  <p className="font-semibold">{j.serviceNumber} · {refName(j.customer)}</p>
                  <p className="text-xs text-slate-400">{formatDate(j.visitDate)} · {refName(j.elevator, "code")} · {titleCase(j.serviceType)}</p>
                </div>
                <Badge status={j.status} />
              </Link>
            ))}
            {jobs.length === 0 && <p className="py-8 text-center text-sm text-slate-400">No {jobTab} jobs</p>}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="mb-3 text-sm font-bold">Salary & Payment History</h3>
          <div className="max-h-80 space-y-2 overflow-y-auto">
            {salary.history.map((s) => (
              <div key={s._id} className="flex items-center justify-between rounded-2xl border border-slate-100 px-4 py-2.5 text-sm dark:border-slate-800">
                <div>
                  <p className="font-semibold">{monthName(s.month)} {s.year}</p>
                  <p className="text-xs text-slate-400">Net: {formatCurrency(s.netPayable)} · Paid: {formatCurrency(s.amountPaid)}</p>
                </div>
                <Badge status={s.status} />
              </div>
            ))}
            {salary.history.length === 0 && <p className="py-4 text-center text-sm text-slate-400">No salary records</p>}
            <h4 className="pt-2 text-xs font-bold uppercase tracking-wider text-slate-400">Advances</h4>
            {data.advances.map((a) => (
              <div key={a._id} className="flex items-center justify-between rounded-2xl border border-slate-100 px-4 py-2.5 text-sm dark:border-slate-800">
                <div>
                  <p className="font-semibold">{formatCurrency(a.amount)}</p>
                  <p className="text-xs text-slate-400">{formatDate(a.date)} · {a.reason || "—"}</p>
                </div>
                <Badge status={a.status} />
              </div>
            ))}
            {data.advances.length === 0 && <p className="py-2 text-center text-sm text-slate-400">No advances</p>}
          </div>
        </div>
      </div>

      <div className="card mt-4 p-5">
        <h3 className="mb-3 text-sm font-bold">Assigned Elevators ({data.assignedElevators.length})</h3>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {data.assignedElevators.map((e) => (
            <Link key={e._id} href={`/elevators/${e._id}`} className="flex items-center justify-between rounded-2xl border border-slate-100 px-4 py-3 text-sm hover:bg-aqua-50/50 dark:border-slate-800 dark:hover:bg-slate-800">
              <div>
                <p className="font-semibold">{e.code}</p>
                <p className="text-xs text-slate-400">{refName(e.customer)} · {e.building || ""}</p>
              </div>
              <Badge status={e.status} />
            </Link>
          ))}
          {data.assignedElevators.length === 0 && <p className="text-sm text-slate-400">No elevators assigned</p>}
        </div>
      </div>
    </div>
  );
}
