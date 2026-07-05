"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { Printer } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";
import { SkeletonBlock } from "@/components/ui/Skeleton";
import { useItem } from "@/hooks/useCrud";
import { formatCurrency, formatDate, refName, titleCase } from "@/utils/format";
import type { Customer, Elevator, Service, Invoice } from "@/types";

interface Overview {
  customer: Customer;
  elevators: Elevator[];
  services: Service[];
  invoices: Invoice[];
  amc: { elevator: string; building?: string; amcExpiry?: string; active: boolean }[];
  warranty: { elevator: string; building?: string; warrantyExpiry?: string; active: boolean }[];
  pendingPayments: number;
  upcomingServices: Service[];
  visitTimeline: {
    _id: string;
    date: string;
    time?: string;
    type?: string;
    status: string;
    complaint?: string;
    workDone?: string;
    technician?: string;
    elevator?: string;
    cost?: number;
  }[];
}

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useItem<Overview>("customers", id, "/overview");

  if (isLoading || !data) return <SkeletonBlock className="h-96" />;
  const { customer } = data;

  return (
    <div>
      <PageHeader
        title={customer.name}
        subtitle={`${refName(customer.company)} · ${customer.city || ""} ${customer.state || ""}`}
        actions={
          <button className="btn-ghost" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Print
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card p-5">
          <h3 className="mb-3 text-sm font-bold">Contact Details</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">Phone</dt><dd className="font-medium">{customer.phone}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Email</dt><dd className="font-medium">{customer.email || "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Address</dt><dd className="max-w-[60%] text-right font-medium">{customer.address || "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">City / Pincode</dt><dd className="font-medium">{customer.city || "—"} {customer.pincode || ""}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">GST</dt><dd className="font-medium">{customer.gst || "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Customer since</dt><dd className="font-medium">{formatDate(customer.createdAt)}</dd></div>
          </dl>
          {customer.notes && <p className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">{customer.notes}</p>}
        </div>

        <div className="card p-5">
          <h3 className="mb-3 text-sm font-bold">Pending Payments</h3>
          <p className={`text-3xl font-bold ${data.pendingPayments > 0 ? "text-rose-500" : "text-emerald-500"}`}>
            {formatCurrency(data.pendingPayments)}
          </p>
          <h3 className="mb-2 mt-5 text-sm font-bold">Upcoming Services</h3>
          {data.upcomingServices.length === 0 ? (
            <p className="text-sm text-slate-400">No services scheduled</p>
          ) : (
            data.upcomingServices.slice(0, 5).map((s) => (
              <Link key={s._id} href={`/services/${s._id}`} className="mb-1 flex items-center justify-between rounded-xl px-2 py-1.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800">
                <span>{formatDate(s.visitDate)} · {refName(s.elevator, "code")}</span>
                <Badge status={s.status} />
              </Link>
            ))
          )}
        </div>

        <div className="card p-5">
          <h3 className="mb-3 text-sm font-bold">AMC &amp; Warranty</h3>
          <div className="space-y-2 text-sm">
            {data.amc.map((a, i) => (
              <div key={`amc-${i}`} className="flex items-center justify-between">
                <span className="text-slate-500">AMC · {a.elevator}</span>
                <span className="flex items-center gap-2 font-medium">
                  {formatDate(a.amcExpiry)} <Badge status={a.active ? "active" : "expired"} />
                </span>
              </div>
            ))}
            {data.warranty.map((w, i) => (
              <div key={`war-${i}`} className="flex items-center justify-between">
                <span className="text-slate-500">Warranty · {w.elevator}</span>
                <span className="flex items-center gap-2 font-medium">
                  {formatDate(w.warrantyExpiry)} <Badge status={w.active ? "active" : "expired"} />
                </span>
              </div>
            ))}
            {data.amc.length === 0 && <p className="text-slate-400">No elevators on record</p>}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <h3 className="mb-3 text-sm font-bold">Elevators ({data.elevators.length})</h3>
          <div className="space-y-2">
            {data.elevators.map((e) => (
              <Link key={e._id} href={`/elevators/${e._id}`} className="flex items-center justify-between rounded-2xl border border-slate-100 px-4 py-3 text-sm transition-colors hover:bg-aqua-50/50 dark:border-slate-800 dark:hover:bg-slate-800">
                <div>
                  <p className="font-semibold">{e.code} · {e.building || "—"}</p>
                  <p className="text-xs text-slate-400">{titleCase(e.elevatorType)} · {e.floors || "?"} floors · Tech: {refName(e.assignedTechnician)}</p>
                </div>
                <Badge status={e.status} />
              </Link>
            ))}
            {data.elevators.length === 0 && <p className="text-sm text-slate-400">No elevators yet</p>}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="mb-3 text-sm font-bold">Invoices ({data.invoices.length})</h3>
          <div className="space-y-2">
            {data.invoices.slice(0, 8).map((inv) => (
              <Link key={inv._id} href={`/invoices/${inv._id}`} className="flex items-center justify-between rounded-2xl border border-slate-100 px-4 py-3 text-sm transition-colors hover:bg-aqua-50/50 dark:border-slate-800 dark:hover:bg-slate-800">
                <div>
                  <p className="font-semibold">{inv.invoiceNumber}</p>
                  <p className="text-xs text-slate-400">{formatDate(inv.issueDate)}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(inv.total)}</p>
                  <Badge status={inv.status} />
                </div>
              </Link>
            ))}
            {data.invoices.length === 0 && <p className="text-sm text-slate-400">No invoices yet</p>}
          </div>
        </div>
      </div>

      <div className="card mt-4 p-5">
        <h3 className="mb-4 text-sm font-bold">Visit Timeline ({data.visitTimeline.length} visits)</h3>
        <ol className="relative ml-3 space-y-5 border-l-2 border-aqua-200 pl-6 dark:border-aqua-800">
          {data.visitTimeline.map((v) => (
            <li key={v._id} className="relative">
              <span className="absolute -left-[31px] top-1 h-3 w-3 rounded-full bg-aqua-400 ring-4 ring-aqua-100 dark:ring-aqua-900" />
              <Link href={`/services/${v._id}`} className="block rounded-2xl p-2 -m-2 hover:bg-slate-50 dark:hover:bg-slate-800">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-semibold">{formatDate(v.date)}{v.time ? ` · ${v.time}` : ""}</span>
                  <Badge status={v.status} />
                  <span className="text-xs text-slate-400">{titleCase(v.type)} · {v.elevator || ""}</span>
                </div>
                {v.complaint && <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Complaint: {v.complaint}</p>}
                {v.workDone && <p className="text-sm text-slate-500">Work: {v.workDone}</p>}
                <p className="mt-0.5 text-xs text-slate-400">
                  {v.technician ? `Technician: ${v.technician} · ` : ""}Cost: {formatCurrency(v.cost)}
                </p>
              </Link>
            </li>
          ))}
          {data.visitTimeline.length === 0 && <p className="text-sm text-slate-400">No visits recorded</p>}
        </ol>
      </div>
    </div>
  );
}
