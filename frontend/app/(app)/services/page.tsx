"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import DataTable, { Column } from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import { TextField, SelectField, TextAreaField } from "@/components/ui/FormField";
import { useList, useCrudMutations } from "@/hooks/useCrud";
import { apiErrorMessage } from "@/lib/api";
import { formatCurrency, formatDate, refName, titleCase } from "@/utils/format";
import type { Service, Customer, Company, Elevator, Technician } from "@/types";

const partSchema = z.object({
  name: z.string().min(1, "Part name required"),
  quantity: z.coerce.number().min(1),
  cost: z.coerce.number().min(0),
});

const schema = z.object({
  customer: z.string().min(1, "Customer is required"),
  company: z.string().optional(),
  elevator: z.string().min(1, "Elevator is required"),
  complaint: z.string().optional(),
  serviceType: z.string().min(1),
  visitDate: z.string().min(1, "Visit date is required"),
  visitTime: z.string().optional(),
  technician: z.string().optional(),
  workDone: z.string().optional(),
  partsUsed: z.array(partSchema).optional(),
  remarks: z.string().optional(),
  status: z.string().min(1),
  durationMinutes: z.coerce.number().min(0),
  cost: z.coerce.number().min(0),
  paymentStatus: z.string().optional(),
  nextVisit: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const SERVICE_TYPES = ["maintenance", "repair", "installation", "inspection", "breakdown", "amc-visit", "modernization"];
const STATUSES = ["scheduled", "in-progress", "completed", "pending", "cancelled"];

export default function ServicesPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState("");
  const list = useList<Service>("services", statusFilter ? { status: statusFilter } : {});
  const customers = useList<Customer>("customers", { limit: 100 });
  const companies = useList<Company>("companies", { limit: 100 });
  const elevators = useList<Elevator>("elevators", { limit: 200 });
  const technicians = useList<Technician>("technicians", { limit: 100 });
  const { create, update, remove } = useCrudMutations("services");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [error, setError] = useState("");
  const form = useForm<z.input<typeof schema>, unknown, FormValues>({ resolver: zodResolver(schema) });
  const parts = useFieldArray({ control: form.control, name: "partsUsed" });

  const toId = (v: unknown) => (typeof v === "object" && v ? (v as { _id: string })._id : (v as string) || "");
  const toDateInput = (v?: string) => (v ? v.slice(0, 10) : "");

  const openCreate = () => {
    setEditing(null);
    form.reset({ customer: "", company: "", elevator: "", complaint: "", serviceType: "maintenance", visitDate: "", visitTime: "", technician: "", workDone: "", partsUsed: [], remarks: "", status: "scheduled", durationMinutes: 0, cost: 0, paymentStatus: "unpaid", nextVisit: "" });
    setModalOpen(true);
  };

  const openEdit = (s: Service) => {
    setEditing(s);
    form.reset({
      customer: toId(s.customer),
      company: toId(s.company),
      elevator: toId(s.elevator),
      complaint: s.complaint || "",
      serviceType: s.serviceType || "maintenance",
      visitDate: toDateInput(s.visitDate),
      visitTime: s.visitTime || "",
      technician: toId(s.technician),
      workDone: s.workDone || "",
      partsUsed: (s.partsUsed || []).map((p) => ({ name: p.name || "", quantity: p.quantity || 1, cost: p.cost || 0 })),
      remarks: s.remarks || "",
      status: s.status,
      durationMinutes: s.durationMinutes || 0,
      cost: s.cost || 0,
      paymentStatus: s.paymentStatus || "unpaid",
      nextVisit: toDateInput(s.nextVisit),
    });
    setModalOpen(true);
  };

  const onSubmit = async (values: FormValues) => {
    setError("");
    const payload: Record<string, unknown> = { ...values };
    ["company", "technician", "nextVisit", "visitTime"].forEach((k) => {
      if (!payload[k]) delete payload[k];
    });
    try {
      if (editing) await update.mutateAsync({ id: editing._id, ...payload });
      else await create.mutateAsync(payload);
      setModalOpen(false);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  };

  const columns: Column<Service>[] = [
    { key: "serviceNumber", header: "Service #", exportValue: (r) => r.serviceNumber },
    { key: "visitDate", header: "Visit", render: (r) => `${formatDate(r.visitDate)}${r.visitTime ? ` ${r.visitTime}` : ""}`, exportValue: (r) => formatDate(r.visitDate) },
    { key: "customer", header: "Customer", render: (r) => refName(r.customer), exportValue: (r) => refName(r.customer) },
    { key: "elevator", header: "Elevator", render: (r) => refName(r.elevator, "code"), exportValue: (r) => refName(r.elevator, "code") },
    { key: "serviceType", header: "Type", render: (r) => titleCase(r.serviceType), exportValue: (r) => titleCase(r.serviceType) },
    { key: "technician", header: "Technician", render: (r) => refName(r.technician), exportValue: (r) => refName(r.technician) },
    { key: "cost", header: "Cost", render: (r) => formatCurrency(r.cost), exportValue: (r) => r.cost || 0 },
    { key: "status", header: "Status", render: (r) => <Badge status={r.status} />, exportValue: (r) => r.status },
    {
      key: "actions",
      header: "Actions",
      exportValue: () => "",
      render: (r) => (
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <button className="text-xs font-semibold text-aqua-600 hover:underline" onClick={() => openEdit(r)}>Edit</button>
          <button className="text-xs font-semibold text-rose-500 hover:underline" onClick={() => { if (confirm(`Delete service ${r.serviceNumber}?`)) remove.mutate(r._id); }}>Delete</button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Services"
        subtitle="Service visits, complaints, work log and costs"
        actions={
          <>
            <select className="input !w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All statuses</option>
              {STATUSES.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
            </select>
            <button className="btn-primary" onClick={openCreate}><Plus className="h-4 w-4" /> New Service</button>
          </>
        }
      />
      <DataTable
        title="Services"
        columns={columns}
        rows={list.rows}
        loading={list.isLoading}
        searchValue={list.search}
        onSearchChange={list.setSearch}
        page={list.page}
        pages={list.pages}
        total={list.total}
        onPageChange={list.setPage}
        onRowClick={(r) => router.push(`/services/${r._id}`)}
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Service" : "New Service"} wide>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {error && <div className="sm:col-span-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600 dark:bg-rose-900/20 dark:text-rose-300">{error}</div>}
          <SelectField label="Customer" {...form.register("customer")} error={form.formState.errors.customer?.message}>
            <option value="">Select customer...</option>
            {customers.rows.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </SelectField>
          <SelectField label="Company" {...form.register("company")}>
            <option value="">— None —</option>
            {companies.rows.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </SelectField>
          <SelectField label="Elevator" {...form.register("elevator")} error={form.formState.errors.elevator?.message}>
            <option value="">Select elevator...</option>
            {elevators.rows.map((e) => <option key={e._id} value={e._id}>{e.code} · {e.building || refName(e.customer)}</option>)}
          </SelectField>
          <SelectField label="Service Type" {...form.register("serviceType")}>
            {SERVICE_TYPES.map((t) => <option key={t} value={t}>{titleCase(t)}</option>)}
          </SelectField>
          <TextField label="Visit Date" type="date" {...form.register("visitDate")} error={form.formState.errors.visitDate?.message} />
          <TextField label="Visit Time" type="time" {...form.register("visitTime")} />
          <SelectField label="Technician" {...form.register("technician")}>
            <option value="">— Unassigned —</option>
            {technicians.rows.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
          </SelectField>
          <SelectField label="Status" {...form.register("status")}>
            {STATUSES.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
          </SelectField>
          <div className="sm:col-span-2"><TextAreaField label="Complaint" {...form.register("complaint")} /></div>
          <div className="sm:col-span-2"><TextAreaField label="Work Done" {...form.register("workDone")} /></div>

          <div className="sm:col-span-2">
            <div className="mb-2 flex items-center justify-between">
              <label className="label !mb-0">Parts Used</label>
              <button type="button" className="btn-ghost !py-1.5 text-xs" onClick={() => parts.append({ name: "", quantity: 1, cost: 0 })}>
                <Plus className="h-3 w-3" /> Add Part
              </button>
            </div>
            {parts.fields.map((field, i) => (
              <div key={field.id} className="mb-2 flex items-end gap-2">
                <div className="flex-1"><TextField label="Part" {...form.register(`partsUsed.${i}.name`)} /></div>
                <div className="w-24"><TextField label="Qty" type="number" {...form.register(`partsUsed.${i}.quantity`)} /></div>
                <div className="w-32"><TextField label="Cost" type="number" {...form.register(`partsUsed.${i}.cost`)} /></div>
                <button type="button" className="btn-ghost !p-2.5 text-rose-500" onClick={() => parts.remove(i)}><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>

          <TextField label="Duration (minutes)" type="number" {...form.register("durationMinutes")} />
          <TextField label="Cost" type="number" {...form.register("cost")} />
          <SelectField label="Payment Status" {...form.register("paymentStatus")}>
            {["unpaid", "partial", "paid"].map((p) => <option key={p} value={p}>{titleCase(p)}</option>)}
          </SelectField>
          <TextField label="Next Visit" type="date" {...form.register("nextVisit")} />
          <div className="sm:col-span-2"><TextAreaField label="Remarks" {...form.register("remarks")} /></div>
          <div className="sm:col-span-2 flex justify-end gap-2">
            <button type="button" className="btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={form.formState.isSubmitting}>{editing ? "Save Changes" : "Create Service"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
