"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Star } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import DataTable, { Column } from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import { TextField, TextAreaField } from "@/components/ui/FormField";
import { useList, useCrudMutations } from "@/hooks/useCrud";
import { apiErrorMessage } from "@/lib/api";
import { formatCurrency, formatDate } from "@/utils/format";
import type { Technician } from "@/types";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  mobile: z.string().min(5, "Mobile is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  address: z.string().optional(),
  joiningDate: z.string().optional(),
  monthlySalary: z.coerce.number().min(0),
  skills: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function TechniciansPage() {
  const router = useRouter();
  const list = useList<Technician>("technicians");
  const { create, update, remove } = useCrudMutations("technicians");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Technician | null>(null);
  const [error, setError] = useState("");
  const form = useForm<z.input<typeof schema>, unknown, FormValues>({ resolver: zodResolver(schema) });

  const openCreate = () => {
    setEditing(null);
    form.reset({ name: "", mobile: "", email: "", address: "", joiningDate: "", monthlySalary: 0, skills: "" });
    setModalOpen(true);
  };

  const openEdit = (t: Technician) => {
    setEditing(t);
    form.reset({
      name: t.name,
      mobile: t.mobile,
      email: t.email || "",
      address: t.address || "",
      joiningDate: t.joiningDate ? t.joiningDate.slice(0, 10) : "",
      monthlySalary: t.monthlySalary || 0,
      skills: (t.skills || []).join(", "),
    });
    setModalOpen(true);
  };

  const onSubmit = async (values: FormValues) => {
    setError("");
    const payload: Record<string, unknown> = {
      ...values,
      skills: values.skills ? values.skills.split(",").map((s) => s.trim()).filter(Boolean) : [],
    };
    if (!payload.joiningDate) delete payload.joiningDate;
    try {
      if (editing) await update.mutateAsync({ id: editing._id, ...payload });
      else await create.mutateAsync(payload);
      setModalOpen(false);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  };

  const columns: Column<Technician>[] = [
    { key: "name", header: "Name", exportValue: (r) => r.name },
    { key: "mobile", header: "Mobile", exportValue: (r) => r.mobile },
    { key: "email", header: "Email", exportValue: (r) => r.email || "", hidden: true },
    { key: "joiningDate", header: "Joined", render: (r) => formatDate(r.joiningDate), exportValue: (r) => formatDate(r.joiningDate) },
    { key: "monthlySalary", header: "Salary", render: (r) => formatCurrency(r.monthlySalary), exportValue: (r) => r.monthlySalary || 0 },
    {
      key: "performanceRating",
      header: "Rating",
      render: (r) => (
        <span className="inline-flex items-center gap-1 font-semibold">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {(r.performanceRating || 0).toFixed(1)}
        </span>
      ),
      exportValue: (r) => r.performanceRating || 0,
    },
    {
      key: "actions",
      header: "Actions",
      exportValue: () => "",
      render: (r) => (
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <button className="text-xs font-semibold text-aqua-600 hover:underline" onClick={() => openEdit(r)}>Edit</button>
          <button className="text-xs font-semibold text-rose-500 hover:underline" onClick={() => { if (confirm(`Delete technician "${r.name}"?`)) remove.mutate(r._id); }}>Delete</button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Technicians"
        subtitle="Field technicians, salaries, attendance and performance"
        actions={<button className="btn-primary" onClick={openCreate}><Plus className="h-4 w-4" /> Add Technician</button>}
      />
      <DataTable
        title="Technicians"
        columns={columns}
        rows={list.rows}
        loading={list.isLoading}
        searchValue={list.search}
        onSearchChange={list.setSearch}
        page={list.page}
        pages={list.pages}
        total={list.total}
        onPageChange={list.setPage}
        onRowClick={(r) => router.push(`/technicians/${r._id}`)}
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Technician" : "Add Technician"} wide>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {error && <div className="sm:col-span-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600 dark:bg-rose-900/20 dark:text-rose-300">{error}</div>}
          <TextField label="Name" {...form.register("name")} error={form.formState.errors.name?.message} />
          <TextField label="Mobile" {...form.register("mobile")} error={form.formState.errors.mobile?.message} />
          <TextField label="Email" {...form.register("email")} error={form.formState.errors.email?.message} />
          <TextField label="Joining Date" type="date" {...form.register("joiningDate")} />
          <TextField label="Monthly Salary" type="number" {...form.register("monthlySalary")} />
          <TextField label="Skills (comma separated)" placeholder="hydraulic, traction, wiring" {...form.register("skills")} />
          <div className="sm:col-span-2"><TextAreaField label="Address" {...form.register("address")} /></div>
          <div className="sm:col-span-2 flex justify-end gap-2">
            <button type="button" className="btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={form.formState.isSubmitting}>{editing ? "Save Changes" : "Create Technician"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
