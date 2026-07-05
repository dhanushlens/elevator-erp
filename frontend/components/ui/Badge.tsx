import { titleCase } from "@/utils/format";

const COLOR_MAP: Record<string, string> = {
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  operational: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  present: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  settled: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  scheduled: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
  sent: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
  "in-progress": "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  partial: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  "half-day": "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  "under-maintenance": "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  outstanding: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  unpaid: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  overdue: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  breakdown: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  cancelled: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  absent: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  expired: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  leave: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  holiday: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  draft: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  decommissioned: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
};

export default function Badge({ status }: { status?: string }) {
  if (!status) return null;
  const cls = COLOR_MAP[status] || "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";
  return <span className={`badge ${cls}`}>{titleCase(status)}</span>;
}
