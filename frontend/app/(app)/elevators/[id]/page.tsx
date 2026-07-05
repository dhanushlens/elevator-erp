"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { Printer, QrCode } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";
import { SkeletonBlock } from "@/components/ui/Skeleton";
import { useItem } from "@/hooks/useCrud";
import { api } from "@/lib/api";
import { formatCurrency, formatDate, refName, titleCase } from "@/utils/format";
import type { Elevator, Service } from "@/types";

export default function ElevatorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: elevator, isLoading } = useItem<Elevator>("elevators", id);
  const { data: history } = useQuery<Service[]>({
    queryKey: ["elevator-history", id],
    queryFn: async () => (await api.get(`/elevators/${id}/service-history`)).data.data,
    enabled: !!id,
  });

  if (isLoading || !elevator) return <SkeletonBlock className="h-96" />;

  const now = new Date();
  const amcActive = elevator.amcExpiry ? new Date(elevator.amcExpiry) > now : false;
  const warrantyActive = elevator.warrantyExpiry ? new Date(elevator.warrantyExpiry) > now : false;

  return (
    <div>
      <PageHeader
        title={`${elevator.code} · ${elevator.building || "Elevator"}`}
        subtitle={`${refName(elevator.customer)} · ${elevator.address || ""}`}
        actions={<button className="btn-ghost" onClick={() => window.print()}><Printer className="h-4 w-4" /> Print</button>}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold">Elevator Details</h3>
            <Badge status={elevator.status} />
          </div>
          <dl className="grid grid-cols-1 gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
            <div className="flex justify-between"><dt className="text-slate-500">Customer</dt><dd className="font-medium">{refName(elevator.customer)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Company</dt><dd className="font-medium">{refName(elevator.company)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Type</dt><dd className="font-medium">{titleCase(elevator.elevatorType)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Capacity</dt><dd className="font-medium">{elevator.capacity || "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Floors</dt><dd className="font-medium">{elevator.floors || "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Installed</dt><dd className="font-medium">{formatDate(elevator.installationDate)}</dd></div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Warranty</dt>
              <dd className="flex items-center gap-2 font-medium">{formatDate(elevator.warrantyExpiry)} <Badge status={warrantyActive ? "active" : "expired"} /></dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">AMC</dt>
              <dd className="flex items-center gap-2 font-medium">{formatDate(elevator.amcExpiry)} <Badge status={amcActive ? "active" : "expired"} /></dd>
            </div>
            <div className="flex justify-between"><dt className="text-slate-500">Last Service</dt><dd className="font-medium">{formatDate(elevator.lastService)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Next Service</dt><dd className="font-medium">{formatDate(elevator.nextService)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Technician</dt><dd className="font-medium">{refName(elevator.assignedTechnician)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Barcode</dt><dd className="font-mono font-medium">{elevator.barcode || "—"}</dd></div>
          </dl>
          {elevator.notes && <p className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">{elevator.notes}</p>}

          {(elevator.documents || []).length > 0 && (
            <div className="mt-4">
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Documents</h4>
              <div className="flex flex-wrap gap-2">
                {(elevator.documents || []).map((d, i) => (
                  <a key={i} href={d.url} target="_blank" rel="noreferrer" className="btn-ghost !py-1.5 text-xs">{d.name || `Document ${i + 1}`}</a>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="card flex flex-col items-center justify-center p-5 text-center">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold"><QrCode className="h-4 w-4 text-aqua-500" /> QR Code</h3>
          {elevator.qrCode ? (
            <Image src={elevator.qrCode} alt={`QR for ${elevator.code}`} width={160} height={160} className="rounded-2xl border border-slate-100 dark:border-slate-800" unoptimized />
          ) : (
            <p className="text-sm text-slate-400">No QR generated</p>
          )}
          <p className="mt-3 font-mono text-sm font-semibold">{elevator.code}</p>
        </div>
      </div>

      {(elevator.photos || []).length > 0 && (
        <div className="card mt-4 p-5">
          <h3 className="mb-3 text-sm font-bold">Photos</h3>
          <div className="flex flex-wrap gap-3">
            {(elevator.photos || []).map((p, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={p} alt={`Elevator photo ${i + 1}`} className="h-32 w-32 rounded-2xl object-cover" />
            ))}
          </div>
        </div>
      )}

      <div className="card mt-4 p-5">
        <h3 className="mb-4 text-sm font-bold">Service History ({(history || []).length})</h3>
        <ol className="relative ml-3 space-y-5 border-l-2 border-aqua-200 pl-6 dark:border-aqua-800">
          {(history || []).map((s) => (
            <li key={s._id} className="relative">
              <span className="absolute -left-[31px] top-1 h-3 w-3 rounded-full bg-aqua-400 ring-4 ring-aqua-100 dark:ring-aqua-900" />
              <Link href={`/services/${s._id}`} className="-m-2 block rounded-2xl p-2 hover:bg-slate-50 dark:hover:bg-slate-800">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-semibold">{formatDate(s.visitDate)}</span>
                  <Badge status={s.status} />
                  <span className="text-xs text-slate-400">{s.serviceNumber} · {titleCase(s.serviceType)}</span>
                </div>
                {s.complaint && <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Complaint: {s.complaint}</p>}
                {s.workDone && <p className="text-sm text-slate-500">Work: {s.workDone}</p>}
                <p className="mt-0.5 text-xs text-slate-400">
                  {refName(s.technician) !== "—" ? `Technician: ${refName(s.technician)} · ` : ""}Cost: {formatCurrency(s.cost)}
                </p>
              </Link>
            </li>
          ))}
          {(history || []).length === 0 && <p className="text-sm text-slate-400">No service history yet</p>}
        </ol>
      </div>
    </div>
  );
}
