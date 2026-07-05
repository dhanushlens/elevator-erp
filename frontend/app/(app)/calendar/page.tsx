"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";
import { SkeletonBlock } from "@/components/ui/Skeleton";
import { api } from "@/lib/api";
import { useList } from "@/hooks/useCrud";
import { refName, titleCase } from "@/utils/format";
import type { Service, Technician } from "@/types";

const STATUS_DOT: Record<string, string> = {
  completed: "bg-emerald-400",
  scheduled: "bg-sky-400",
  "in-progress": "bg-amber-400",
  pending: "bg-amber-400",
  cancelled: "bg-rose-400",
};

export default function CalendarPage() {
  const now = new Date();
  const [ym, setYm] = useState({ year: now.getFullYear(), month: now.getMonth() + 1 });
  const [technician, setTechnician] = useState("");
  const technicians = useList<Technician>("technicians", { limit: 100 });

  const { data, isLoading } = useQuery<{ data: Service[] }>({
    queryKey: ["calendar", ym, technician],
    queryFn: async () =>
      (await api.get("/services/calendar", { params: { month: ym.month, year: ym.year, ...(technician ? { technician } : {}) } })).data,
  });

  const services = data?.data || [];
  const daysInMonth = new Date(ym.year, ym.month, 0).getDate();
  const firstWeekday = new Date(ym.year, ym.month - 1, 1).getDay();
  const byDay: Record<number, Service[]> = {};
  services.forEach((s) => {
    const day = new Date(s.visitDate).getDate();
    byDay[day] = byDay[day] || [];
    byDay[day].push(s);
  });

  const today = new Date();
  const isToday = (d: number) => today.getFullYear() === ym.year && today.getMonth() + 1 === ym.month && today.getDate() === d;

  const counts = {
    today: services.filter((s) => isToday(new Date(s.visitDate).getDate())).length,
    upcoming: services.filter((s) => new Date(s.visitDate) > today && ["scheduled", "pending"].includes(s.status)).length,
    completed: services.filter((s) => s.status === "completed").length,
    pending: services.filter((s) => ["pending", "scheduled", "in-progress"].includes(s.status)).length,
  };

  return (
    <div>
      <PageHeader
        title="Calendar"
        subtitle="Jobs, schedules and technician assignments"
        actions={
          <select className="input !w-auto" value={technician} onChange={(e) => setTechnician(e.target.value)}>
            <option value="">All technicians</option>
            {technicians.rows.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
          </select>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Today's Jobs", value: counts.today, color: "text-aqua-600" },
          { label: "Upcoming Jobs", value: counts.upcoming, color: "text-sky-500" },
          { label: "Completed Jobs", value: counts.completed, color: "text-emerald-500" },
          { label: "Pending Jobs", value: counts.pending, color: "text-amber-500" },
        ].map((c) => (
          <div key={c.label} className="card p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{c.label}</p>
            <p className={`mt-1 text-2xl font-bold ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="card p-5">
        <div className="mb-4 flex items-center justify-between">
          <button className="btn-ghost !p-2" onClick={() => setYm((p) => (p.month === 1 ? { year: p.year - 1, month: 12 } : { ...p, month: p.month - 1 }))}>
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h3 className="text-base font-bold">
            {new Date(ym.year, ym.month - 1).toLocaleString("en", { month: "long", year: "numeric" })}
          </h3>
          <button className="btn-ghost !p-2" onClick={() => setYm((p) => (p.month === 12 ? { year: p.year + 1, month: 1 } : { ...p, month: p.month + 1 }))}>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {isLoading ? (
          <SkeletonBlock className="h-96" />
        ) : (
          <>
            <div className="mb-2 grid grid-cols-7 gap-2 text-center text-xs font-bold uppercase tracking-wider text-slate-400">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <div key={d}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: firstWeekday }).map((_, i) => <div key={`pad-${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dayServices = byDay[day] || [];
                return (
                  <div
                    key={day}
                    className={`min-h-24 rounded-2xl border p-2 ${isToday(day) ? "border-aqua-400 bg-aqua-50/60 ring-2 ring-aqua-300/40 dark:bg-aqua-900/20" : dayServices.length ? "border-slate-200 dark:border-slate-700" : "border-slate-100 dark:border-slate-800"}`}
                  >
                    <p className={`text-xs font-bold ${isToday(day) ? "text-aqua-600" : "text-slate-400"}`}>{day}</p>
                    <div className="mt-1 space-y-1">
                      {dayServices.slice(0, 3).map((s) => (
                        <Link key={s._id} href={`/services/${s._id}`} className="flex items-center gap-1 truncate rounded-lg bg-white/80 px-1.5 py-0.5 text-[10px] font-medium shadow-sm dark:bg-slate-800" title={`${s.serviceNumber} · ${refName(s.customer)} · ${titleCase(s.status)}`}>
                          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_DOT[s.status] || "bg-slate-400"}`} />
                          {s.visitTime ? `${s.visitTime} ` : ""}{refName(s.customer)}
                        </Link>
                      ))}
                      {dayServices.length > 3 && <p className="text-[10px] text-slate-400">+{dayServices.length - 3} more</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      <div className="card mt-4 p-5">
        <h3 className="mb-3 text-sm font-bold">Technician Schedule — {new Date(ym.year, ym.month - 1).toLocaleString("en", { month: "long" })}</h3>
        <div className="space-y-2">
          {services.map((s) => (
            <Link key={s._id} href={`/services/${s._id}`} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-100 px-4 py-2.5 text-sm hover:bg-aqua-50/50 dark:border-slate-800 dark:hover:bg-slate-800">
              <div>
                <p className="font-semibold">{new Date(s.visitDate).getDate()} {new Date(ym.year, ym.month - 1).toLocaleString("en", { month: "short" })} {s.visitTime || ""} · {refName(s.customer)}</p>
                <p className="text-xs text-slate-400">{s.serviceNumber} · {refName(s.elevator, "code")} · Technician: {refName(s.technician)}</p>
              </div>
              <Badge status={s.status} />
            </Link>
          ))}
          {services.length === 0 && <p className="py-6 text-center text-sm text-slate-400">No jobs this month</p>}
        </div>
      </div>
    </div>
  );
}
