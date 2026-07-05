"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import DataTable, { Column } from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import { TextField, SelectField, TextAreaField } from "@/components/ui/FormField";
import { useList, useCrudMutations } from "@/hooks/useCrud";
import { apiErrorMessage } from "@/lib/api";
import { formatDate, refName, titleCase } from "@/utils/format";
import type { Elevator, Customer, Company, Technician } from "@/types";

const schema = z.object({
  customer: z.string().min(1, "Customer is required"),
  company: z.string().optional(),
  building: z.string().optional(),
  address: z.string().optional(),
  elevatorType: z.string().optional(),
  capacity: z.string().optional(),
  floors: z.coerce.number().min(0),
  installationDate: z.string().optional(),
  warrantyExpiry: z.string().optional(),
  amcExpiry: z.string().optional(),
  nextService: z.string().optional(),
  assignedTechnician: z.string().optional(),
  status: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const TYPES = ["passenger", "freight", "hospital", "home", "hydraulic", "traction", "mrl", "dumbwaiter"];
const STATUSES = ["operational", "under-maintenance", "breakdown", "decommissioned"];

export default function ElevatorsPage() {
  const router = useRouter();
  const list = useList<Elevator>("elevators");
  const customers = useList<Customer>("customers", { limit: 100 });
  const companies = useList<Company>("companies", { limit: 100 });
  const technicians = useList<Technician>("technicians", { limit: 100 });
  const { create, update, remove } = useCrudMutations("elevators");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Elevator | null>(null);
  const [error, setError] = useState("");
  const form = useForm<z.input<typeof schema>, unknown, FormValues>({ resolver: zodResolver(schema) });

  const toId = (v: unknown) => (typeof v === "object" && v ? (v as { _id: string })._id : (v as string) || "");
  const toDateInput = (v?: string) => (v ? v.slice(0, 10) : "");

  const openCreate = () => {
    setEditing(null);
    form.reset({ customer: "", company: "", building: "", address: "", elevatorType: "passenger", capacity: "", installationDate: "", warrantyExpiry: "", amcExpiry: "", nextService: "", assignedTechnician: "", status: "operational", notes: "" });
    setModalOpen(true);
  };

  const openEdit = (e: Elevator) => {
    setEditing(e);
    form.reset({
      customer: toId(e.customer),
      company: toId(e.company),
      building: e.building || "",
      address: e.address || "",
      elevatorType: e.elevatorType || "passenger",
      capacity: e.capacity || "",
      floors: e.floors,
      installationDate: toDateInput(e.installationDate),
      warrantyExpiry: toDateInput(e.warrantyExpiry),
      amcExpiry: toDateInput(e.amcExpiry),
      nextService: toDateInput(e.nextService),
      assignedTechnician: toId(e.assignedTechnician),
      status: e.status,
      notes: e.notes || "",
    });
    setModalOpen(true);
  };

  const onSubmit = async (values: FormValues) => {
    setError("");
    const payload: Record<string, unknown> = { ...values };
    ["company", "assignedTechnician", "installationDate", "warrantyExpiry", "amcExpiry", "nextService"].forEach((k) => {
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

  const columns: Column<Elevator>[] = [
    { key: "code", header: "Code", exportValue: (r) => r.code },
    { key: "customer", header: "Customer", render: (r) => refName(r.customer), exportValue: (r) => refName(r.customer) },
    { key: "building", header: "Building", exportValue: (r) => r.building || "" },
    { key: "elevatorType", header: "Type", render: (r) => titleCase(r.elevatorType), exportValue: (r) => titleCase(r.elevatorType) },
    { key: "floors", header: "Floors", exportValue: (r) => r.floors || 0, hidden: true },
    { key: "amcExpiry", header: "AMC Expiry", render: (r) => formatDate(r.amcExpiry), exportValue: (r) => formatDate(r.amcExpiry) },
    { key: "nextService", header: "Next Service", render: (r) => formatDate(r.nextService), exportValue: (r) => formatDate(r.nextService) },
    { key: "assignedTechnician", header: "Technician", render: (r) => refName(r.assignedTechnician), exportValue: (r) => refName(r.assignedTechnician), hidden: true },
    { key: "status", header: "Status", render: (r) => <Badge status={r.status} />, exportValue: (r) => r.status },
    {
      key: "actions",
      header: "Actions",
      exportValue: () => "",
      render: (r) => (
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <button className="text-xs font-semibold text-aqua-600 hover:underline" onClick={() => openEdit(r)}>Edit</button>
          <button className="text-xs font-semibold text-rose-500 hover:underline" onClick={() => { if (confirm(`Delete elevator ${r.code}?`)) remove.mutate(r._id); }}>Delete</button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Elevators"
        subtitle="Elevator fleet, AMC, warranty and service schedule"
        actions={<button className="btn-primary" onClick={openCreate}><Plus className="h-4 w-4" /> Add Elevator</button>}
      />
      <DataTable
        title="Elevators"
        columns={columns}
        rows={list.rows}
        loading={list.isLoading}
        searchValue={list.search}
        onSearchChange={list.setSearch}
        page={list.page}
        pages={list.pages}
        total={list.total}
        onPageChange={list.setPage}
        onRowClick={(r) => router.push(`/elevators/${r._id}`)}
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Elevator" : "Add Elevator"} wide>
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
          <TextField label="Building" {...form.register("building")} />
          <TextField label="Address" {...form.register("address")} />
          <SelectField label="Type" {...form.register("elevatorType")}>
            {TYPES.map((t) => <option key={t} value={t}>{titleCase(t)}</option>)}
          </SelectField>
          <TextField label="Capacity" placeholder="e.g. 8 persons / 544 kg" {...form.register("capacity")} />
          <TextField label="Floors" type="number" {...form.register("floors")} />
          <SelectField label="Status" {...form.register("status")}>
            {STATUSES.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
          </SelectField>
          <TextField label="Installation Date" type="date" {...form.register("installationDate")} />
          <TextField label="Warranty Expiry" type="date" {...form.register("warrantyExpiry")} />
          <TextField label="AMC Expiry" type="date" {...form.register("amcExpiry")} />
          <TextField label="Next Service" type="date" {...form.register("nextService")} />
          <SelectField label="Assigned Technician" {...form.register("assignedTechnician")}>
            <option value="">— None —</option>
            {technicians.rows.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
          </SelectField>
          <div className="sm:col-span-2"><TextAreaField label="Notes" {...form.register("notes")} /></div>
          <div className="sm:col-span-2 flex justify-end gap-2">
            <button type="button" className="btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={form.formState.isSubmitting}>{editing ? "Save Changes" : "Create Elevator"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
