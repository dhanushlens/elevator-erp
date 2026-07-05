"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Users,
  Building2,
  CircleArrowUp,
  ClipboardList,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Wrench,
  IndianRupee,
  AlertTriangle,
  Wallet,
  ShieldAlert,
  FileWarning,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { api } from "@/lib/api";
import StatCard from "@/components/ui/StatCard";
import PageHeader from "@/components/ui/PageHeader";
import { SkeletonCards, SkeletonBlock } from "@/components/ui/Skeleton";
import { formatDateTime, monthName, titleCase } from "@/utils/format";
import type { ActivityLog } from "@/types";

interface DashboardData {
  totals: {
    customers: number;
    companies: number;
    elevators: number;
    todaysServices: number;
    upcomingServices: number;
    completedServices: number;
    pendingServices: number;
    techniciansWorking: number;
    revenue: number;
    pendingPayments: number;
    salaryDue: number;
    warrantyExpiring: number;
    amcExpiring: number;
  };
  charts: {
    monthlyRevenue: { _id: number; revenue: number; billed: number }[];
    monthlyServices: { _id: { month: number; status: string }; count: number }[];
  };
  recentActivities: ActivityLog[];
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ["dashboard-stats"],
    queryFn: async () => (await api.get("/dashboard/stats")).data.data,
    refetchInterval: 60_000,
  });

  const t = data?.totals;

  const revenueSeries = (data?.charts.monthlyRevenue || []).map((r) => ({
    month: monthName(r._id),
    Collected: r.revenue,
    Billed: r.billed,
  }));

  const serviceByMonth: Record<number, Record<string, number>> = {};
  (data?.charts.monthlyServices || []).forEach((s) => {
    serviceByMonth[s._id.month] = serviceByMonth[s._id.month] || {};
    serviceByMonth[s._id.month][s._id.status] = s.count;
  });
  const serviceSeries = Object.entries(serviceByMonth).map(([m, statuses]) => ({
    month: monthName(Number(m)),
    Completed: statuses["completed"] || 0,
    Pending: (statuses["pending"] || 0) + (statuses["scheduled"] || 0) + (statuses["in-progress"] || 0),
  }));

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Live overview of your elevator service operations" />

      {isLoading || !t ? (
        <SkeletonCards count={8} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Total Customers" value={t.customers} icon={Users} delay={0} />
            <StatCard title="Total Companies" value={t.companies} icon={Building2} delay={0.05} accent="blue" />
            <StatCard title="Total Elevators" value={t.elevators} icon={CircleArrowUp} delay={0.1} accent="violet" />
            <StatCard title="Today's Services" value={t.todaysServices} icon={ClipboardList} delay={0.15} accent="amber" />
            <StatCard title="Upcoming Services" value={t.upcomingServices} icon={CalendarClock} delay={0.2} accent="blue" />
            <StatCard title="Completed Services" value={t.completedServices} icon={CheckCircle2} delay={0.25} />
            <StatCard title="Pending Services" value={t.pendingServices} icon={Clock3} delay={0.3} accent="amber" />
            <StatCard title="Technicians Working" value={t.techniciansWorking} icon={Wrench} delay={0.35} accent="violet" />
            <StatCard title="Revenue Collected" value={t.revenue} icon={IndianRupee} prefix="₹" delay={0.4} />
            <StatCard title="Pending Payments" value={t.pendingPayments} icon={AlertTriangle} prefix="₹" delay={0.45} accent="rose" />
            <StatCard title="Salary Due" value={t.salaryDue} icon={Wallet} prefix="₹" delay={0.5} accent="amber" />
            <StatCard title="AMC Expiring (30d)" value={t.amcExpiring} icon={ShieldAlert} delay={0.55} accent="rose" />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
            <div className="card p-5 xl:col-span-2">
              <h3 className="mb-4 text-sm font-bold text-slate-700 dark:text-slate-200">Revenue (this year)</h3>
              {revenueSeries.length === 0 ? (
                <p className="py-16 text-center text-sm text-slate-400">No revenue data yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={revenueSeries}>
                    <defs>
                      <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#16a9a3" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#16a9a3" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                    <XAxis dataKey="month" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Area type="monotone" dataKey="Collected" stroke="#16a9a3" fill="url(#rev)" strokeWidth={2.5} />
                    <Area type="monotone" dataKey="Billed" stroke="#94a3b8" fill="none" strokeWidth={1.5} strokeDasharray="5 4" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="card p-5">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                <FileWarning className="h-4 w-4 text-amber-500" /> Recent Activity
              </h3>
              <div className="max-h-[280px] space-y-3 overflow-y-auto">
                {(data?.recentActivities || []).length === 0 && (
                  <p className="py-10 text-center text-sm text-slate-400">No activity yet</p>
                )}
                {(data?.recentActivities || []).map((a) => (
                  <div key={a._id} className="flex items-start gap-3 text-sm">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-aqua-400" />
                    <div>
                      <p className="font-medium text-slate-700 dark:text-slate-200">
                        {a.description || `${titleCase(a.action)} ${a.entity || ""}`}
                      </p>
                      <p className="text-xs text-slate-400">
                        {a.user?.name || "System"} · {formatDateTime(a.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 card p-5">
            <h3 className="mb-4 text-sm font-bold text-slate-700 dark:text-slate-200">Monthly Services</h3>
            {serviceSeries.length === 0 ? (
              <p className="py-16 text-center text-sm text-slate-400">No service data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={serviceSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis fontSize={12} allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Completed" fill="#16a9a3" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Pending" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </>
      )}
      {isLoading && <div className="mt-6"><SkeletonBlock /></div>}
    </div>
  );
}
