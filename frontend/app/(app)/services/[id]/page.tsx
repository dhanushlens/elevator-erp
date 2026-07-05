"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Printer } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";
import { SkeletonBlock } from "@/components/ui/Skeleton";
import { useItem } from "@/hooks/useCrud";
import { api } from "@/lib/api";
import { formatCurrency, formatDate, formatDateTime, refName, titleCase } from "@/utils/format";
import type { Service } from "@/types";

interface HistoryEntry {
  _id: string;
  action: string;
  fromStatus?: string;
  toStatus?: string;
  notes?: string;
  changedBy?: { name?: string } | null;
  createdAt: string;
}

export default function ServiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: service, isLoading } = useItem<Service>("services", id);
  const { data: history } = useQuery<HistoryEntry[]>({
    queryKey: ["service-history", id],
    queryFn: async () => (await api.get(`/services/${id}/history`)).data.data,
    enabled: !!id,
  });

  if (isLoading || !service) return <SkeletonBlock className="h-96" />;

  const partsTotal = (service.partsUsed || []).reduce((s, p) => s + (p.cost || 0) * (p.quantity || 1), 0);

  return (
    <div>
      <PageHeader
        title={service.serviceNumber}
        subtitle={`${refName(service.customer)} · ${refName(service.elevator, "code")} · ${formatDate(service.visitDate)}`}
        actions={<button className="btn-ghost" onClick={() => window.print()}><Printer className="h-4 w-4" /> Print</button>}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold">Service Details</h3>
            <div className="flex gap-2">
              <Badge status={service.status} />
              <Badge status={service.paymentStatus} />
            </div>
          </div>
          <dl className="grid grid-cols-1 gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
            <div className="flex justify-between"><dt className="text-slate-500">Customer</dt><dd className="font-medium">{refName(service.customer)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Company</dt><dd className="font-medium">{refName(service.company)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Elevator</dt><dd className="font-medium">{refName(service.elevator, "code")}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Type</dt><dd className="font-medium">{titleCase(service.serviceType)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Visit</dt><dd className="font-medium">{formatDate(service.visitDate)} {service.visitTime || ""}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Technician</dt><dd className="font-medium">{refName(service.technician)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Duration</dt><dd className="font-medium">{service.durationMinutes || 0} min</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Next Visit</dt><dd className="font-medium">{formatDate(service.nextVisit)}</dd></div>
          </dl>
          {service.complaint && (
            <div className="mt-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Complaint</h4>
              <p className="mt-1 text-sm">{service.complaint}</p>
            </div>
          )}
          {service.workDone && (
            <div className="mt-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Work Done</h4>
              <p className="mt-1 text-sm">{service.workDone}</p>
            </div>
          )}
          {service.remarks && (
            <div className="mt-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Remarks</h4>
              <p className="mt-1 text-sm italic">{service.remarks}</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="mb-3 text-sm font-bold">Cost</h3>
            <p className="text-3xl font-bold text-aqua-600">{formatCurrency(service.cost)}</p>
            {partsTotal > 0 && <p className="mt-1 text-xs text-slate-400">Parts total: {formatCurrency(partsTotal)}</p>}
          </div>
          <div className="card p-5">
            <h3 className="mb-3 text-sm font-bold">Parts Used</h3>
            {(service.partsUsed || []).length === 0 && <p className="text-sm text-slate-400">No parts replaced</p>}
            {(service.partsUsed || []).map((p, i) => (
              <div key={i} className="flex items-center justify-between border-b border-slate-50 py-2 text-sm last:border-0 dark:border-slate-800">
                <span>{p.name} <span className="text-xs text-slate-400">×{p.quantity}</span></span>
                <span className="font-medium">{formatCurrency((p.cost || 0) * (p.quantity || 1))}</span>
              </div>
            ))}
          </div>
          {service.customerSignature && (
            <div className="card p-5">
              <h3 className="mb-3 text-sm font-bold">Customer Signature</h3>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={service.customerSignature} alt="Customer signature" className="max-h-24 rounded-xl border border-slate-100 dark:border-slate-800" />
            </div>
          )}
        </div>
      </div>

      {((service.beforePhotos || []).length > 0 || (service.afterPhotos || []).length > 0) && (
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="card p-5">
            <h3 className="mb-3 text-sm font-bold">Before Photos</h3>
            <div className="flex flex-wrap gap-3">
              {(service.beforePhotos || []).map((p, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={p} alt={`Before ${i + 1}`} className="h-28 w-28 rounded-2xl object-cover" />
              ))}
              {(service.beforePhotos || []).length === 0 && <p className="text-sm text-slate-400">None</p>}
            </div>
          </div>
          <div className="card p-5">
            <h3 className="mb-3 text-sm font-bold">After Photos</h3>
            <div className="flex flex-wrap gap-3">
              {(service.afterPhotos || []).map((p, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={p} alt={`After ${i + 1}`} className="h-28 w-28 rounded-2xl object-cover" />
              ))}
              {(service.afterPhotos || []).length === 0 && <p className="text-sm text-slate-400">None</p>}
            </div>
          </div>
        </div>
      )}

      <div className="card mt-4 p-5">
        <h3 className="mb-3 text-sm font-bold">Status History</h3>
        <ol className="relative ml-3 space-y-4 border-l-2 border-aqua-200 pl-6 dark:border-aqua-800">
          {(history || []).map((h) => (
            <li key={h._id} className="relative text-sm">
              <span className="absolute -left-[31px] top-1 h-3 w-3 rounded-full bg-aqua-400 ring-4 ring-aqua-100 dark:ring-aqua-900" />
              <p className="font-semibold">
                {titleCase(h.action)}
                {h.fromStatus && h.toStatus && (
                  <span className="ml-2 text-xs font-normal text-slate-400">{titleCase(h.fromStatus)} → {titleCase(h.toStatus)}</span>
                )}
              </p>
              <p className="text-xs text-slate-400">{h.changedBy?.name || "System"} · {formatDateTime(h.createdAt)}</p>
              {h.notes && <p className="text-xs text-slate-500">{h.notes}</p>}
            </li>
          ))}
          {(history || []).length === 0 && <p className="text-sm text-slate-400">No history entries</p>}
        </ol>
      </div>

      <div className="mt-4 flex gap-2 no-print">
        <Link href={`/customers/${typeof service.customer === "object" && service.customer ? service.customer._id : ""}`} className="btn-ghost">View Customer</Link>
        <Link href={`/elevators/${typeof service.elevator === "object" && service.elevator ? service.elevator._id : ""}`} className="btn-ghost">View Elevator</Link>
      </div>
    </div>
  );
}
