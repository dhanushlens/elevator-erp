"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Modal from "@/components/ui/Modal";
import { SelectField, TextField } from "@/components/ui/FormField";
import { SkeletonBlock } from "@/components/ui/Skeleton";
import { useList } from "@/hooks/useCrud";
import { api, apiErrorMessage } from "@/lib/api";
import { titleCase } from "@/utils/format";
import type { Attendance, Technician } from "@/types";

const STATUS_COLORS: Record<string, string> = {
  present: "bg-emerald-400 text-white",
  absent: "bg-rose-400 text-white",
  "half-day": "bg-amber-400 text-white",
  leave: "bg-violet-400 text-white",
  holiday: "bg-slate-300 text-slate-700",
};

export default function AttendancePage() {
  const now = new Date();
  const [ym, setYm] = useState({ year: now.getFullYear(), month: now.getMonth() + 1 });
  const technicians = useList<Technician>("technicians", { limit: 100 });
  const queryClient = useQueryClient();
  const [markOpen, setMarkOpen] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ technician: "", date: now.toISOString().slice(0, 10), status: "present", checkIn: "", checkOut: "", notes: "" });

  const { data, isLoading } = useQuery<{ data: Attendance[] }>({
    queryKey: ["attendance-monthly", ym],
    queryFn: async () => (await api.get("/attendance/monthly", { params: { month: ym.month, year: ym.year } })).data,
  });

  const markMutation = useMutation({
    mutationFn: async (payload: typeof form) => {
      const body: Record<string, unknown> = { ...payload };
      if (!body.checkIn) delete body.checkIn;
      if (!body.checkOut) delete body.checkOut;
      if (!body.notes) delete body.notes;
      return (await api.post("/attendance", body)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance-monthly"] });
      setMarkOpen(false);
    },
    onError: (err) => setError(apiErrorMessage(err)),
  });

  const daysInMonth = new Date(ym.year, ym.month, 0).getDate();
  const records = data?.data || [];
  const byTechDay: Record<string, Record<number, Attendance>> = {};
  records.forEach((a) => {
    const techId = typeof a.technician === "object" && a.technician ? a.technician._id : String(a.technician);
    const day = new Date(a.date).getDate();
    byTechDay[techId] = byTechDay[techId] || {};
    byTechDay[techId][day] = a;
  });

  return (
    <div>
      <PageHeader
        title="Attendance"
        subtitle="Monthly attendance grid for all technicians"
        actions={
          <button className="btn-primary" onClick={() => { setError(""); setMarkOpen(true); }}>
            <Plus className="h-4 w-4" /> Mark Attendance
          </button>
        }
      />

      <div className="card p-5">
        <div className="mb-4 flex items-center justify-between">
          <button className="btn-ghost !p-2" onClick={() => setYm((p) => (p.month === 1 ? { year: p.year - 1, month: 12 } : { ...p, month: p.month - 1 }))}>
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h3 className="text-base font-bold">{new Date(ym.year, ym.month - 1).toLocaleString("en", { month: "long", year: "numeric" })}</h3>
          <button className="btn-ghost !p-2" onClick={() => setYm((p) => (p.month === 12 ? { year: p.year + 1, month: 1 } : { ...p, month: p.month + 1 }))}>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {isLoading ? (
          <SkeletonBlock className="h-64" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr>
                  <th className="sticky left-0 bg-white px-3 py-2 font-semibold dark:bg-slate-900">Technician</th>
                  {Array.from({ length: daysInMonth }).map((_, i) => (
                    <th key={i} className="px-1 py-2 text-center font-medium text-slate-400">{i + 1}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {technicians.rows.map((t) => (
                  <tr key={t._id} className="border-t border-slate-50 dark:border-slate-800">
                    <td className="sticky left-0 whitespace-nowrap bg-white px-3 py-2 font-semibold dark:bg-slate-900">{t.name}</td>
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const a = byTechDay[t._id]?.[i + 1];
                      return (
                        <td key={i} className="px-0.5 py-1 text-center">
                          <span
                            title={a ? `${titleCase(a.status)}${a.checkIn ? ` · ${a.checkIn}-${a.checkOut || ""}` : ""}` : "No record"}
                            className={`inline-flex h-6 w-6 items-center justify-center rounded-lg text-[9px] font-bold ${a ? STATUS_COLORS[a.status] : "bg-slate-100 text-slate-300 dark:bg-slate-800"}`}
                          >
                            {a ? a.status.charAt(0).toUpperCase() : "·"}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">
          {Object.entries(STATUS_COLORS).map(([k, v]) => (
            <span key={k} className="flex items-center gap-1.5">
              <span className={`inline-flex h-4 w-4 items-center justify-center rounded ${v} text-[8px] font-bold`}>{k.charAt(0).toUpperCase()}</span>
              {titleCase(k)}
            </span>
          ))}
        </div>
      </div>

      <Modal open={markOpen} onClose={() => setMarkOpen(false)} title="Mark Attendance">
        <div className="space-y-4">
          {error && <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600 dark:bg-rose-900/20 dark:text-rose-300">{error}</div>}
          <SelectField label="Technician" value={form.technician} onChange={(e) => setForm({ ...form, technician: e.target.value })}>
            <option value="">Select technician...</option>
            {technicians.rows.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
          </SelectField>
          <TextField label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <SelectField label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            {Object.keys(STATUS_COLORS).map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
          </SelectField>
          <div className="grid grid-cols-2 gap-3">
            <TextField label="Check In" type="time" value={form.checkIn} onChange={(e) => setForm({ ...form, checkIn: e.target.value })} />
            <TextField label="Check Out" type="time" value={form.checkOut} onChange={(e) => setForm({ ...form, checkOut: e.target.value })} />
          </div>
          <TextField label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <div className="flex justify-end gap-2">
            <button className="btn-ghost" onClick={() => setMarkOpen(false)}>Cancel</button>
            <button className="btn-primary" disabled={!form.technician || markMutation.isPending} onClick={() => markMutation.mutate(form)}>
              {markMutation.isPending ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
