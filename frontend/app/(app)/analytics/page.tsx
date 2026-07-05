"use client";

import { useQuery } from "@tanstack/react-query";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import PageHeader from "@/components/ui/PageHeader";
import { SkeletonBlock } from "@/components/ui/Skeleton";
import { api } from "@/lib/api";
import { formatCurrency, monthName, titleCase } from "@/utils/format";

interface MonthBucket { _id: { year: number; month: number }; count?: number; total?: number }
interface Analytics {
  customerGrowth: MonthBucket[];
  companyGrowth: MonthBucket[];
  technicianPerformance: { _id: string; completed: number; revenue: number; avgDuration: number; technician: { name: string; performanceRating?: number } }[];
  complaintTypes: { _id: string; count: number }[];
  serviceTypes: { _id: string; count: number; revenue: number }[];
  salaryExpenses: MonthBucket[];
  amcRevenue: { _id: number; revenue: number; visits: number }[];
}

const PIE_COLORS = ["#16a9a3", "#38bdf8", "#f59e0b", "#a78bfa", "#fb7185", "#34d399", "#64748b"];

const label = (b: MonthBucket) => `${monthName(b._id.month)} ${String(b._id.year).slice(2)}`;

export default function AnalyticsPage() {
  const { data, isLoading } = useQuery<Analytics>({
    queryKey: ["analytics"],
    queryFn: async () => (await api.get("/dashboard/analytics")).data.data,
  });

  if (isLoading || !data) {
    return (
      <div>
        <PageHeader title="Analytics" subtitle="Business intelligence across all modules" />
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonBlock key={i} className="h-72" />)}
        </div>
      </div>
    );
  }

  const growth = mergeGrowth(data.customerGrowth, data.companyGrowth);
  const salarySeries = data.salaryExpenses.map((b) => ({ month: label(b), Expense: b.total || 0 }));
  const amcSeries = data.amcRevenue.map((b) => ({ month: monthName(b._id), Revenue: b.revenue, Visits: b.visits }));
  const perfSeries = data.technicianPerformance.map((t) => ({ name: t.technician.name, Completed: t.completed, Revenue: t.revenue }));
  const serviceTypeSeries = data.serviceTypes.map((s) => ({ name: titleCase(s._id), value: s.count, revenue: s.revenue }));
  const complaintSeries = data.complaintTypes.map((s) => ({ name: titleCase(s._id), value: s.count }));

  return (
    <div>
      <PageHeader title="Analytics" subtitle="Business intelligence across all modules" />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartCard title="Customer & Company Growth">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={growth}>
              <defs>
                <linearGradient id="gCust" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#16a9a3" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#16a9a3" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gComp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
              <XAxis dataKey="month" fontSize={12} />
              <YAxis fontSize={12} allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="Customers" stroke="#16a9a3" fill="url(#gCust)" strokeWidth={2} />
              <Area type="monotone" dataKey="Companies" stroke="#38bdf8" fill="url(#gComp)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Technician Performance (Completed Jobs)">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={perfSeries} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
              <XAxis type="number" fontSize={12} allowDecimals={false} />
              <YAxis type="category" dataKey="name" fontSize={12} width={110} />
              <Tooltip formatter={(v, n) => (n === "Revenue" ? formatCurrency(Number(v)) : v)} />
              <Bar dataKey="Completed" fill="#16a9a3" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Service Types">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={serviceTypeSeries} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                {serviceTypeSeries.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Complaint Distribution">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={complaintSeries} dataKey="value" nameKey="name" outerRadius={90}>
                {complaintSeries.map((_, i) => <Cell key={i} fill={PIE_COLORS[(i + 2) % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Salary Expenses">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={salarySeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
              <XAxis dataKey="month" fontSize={12} />
              <YAxis fontSize={12} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => formatCurrency(Number(v))} />
              <Bar dataKey="Expense" fill="#a78bfa" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="AMC Revenue (This Year)">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={amcSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
              <XAxis dataKey="month" fontSize={12} />
              <YAxis fontSize={12} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v, n) => (n === "Revenue" ? formatCurrency(Number(v)) : v)} />
              <Legend />
              <Line type="monotone" dataKey="Revenue" stroke="#16a9a3" strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="Visits" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <h3 className="mb-4 text-sm font-bold">{title}</h3>
      {children}
    </div>
  );
}

function mergeGrowth(customers: MonthBucket[], companies: MonthBucket[]) {
  const map = new Map<string, { month: string; Customers: number; Companies: number; order: number }>();
  const upsert = (b: MonthBucket, key: "Customers" | "Companies") => {
    const k = `${b._id.year}-${b._id.month}`;
    const entry = map.get(k) || { month: label(b), Customers: 0, Companies: 0, order: b._id.year * 100 + b._id.month };
    entry[key] += b.count || 0;
    map.set(k, entry);
  };
  customers.forEach((b) => upsert(b, "Customers"));
  companies.forEach((b) => upsert(b, "Companies"));
  return Array.from(map.values()).sort((a, b) => a.order - b.order);
}
