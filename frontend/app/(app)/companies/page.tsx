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
import { TextField, TextAreaField } from "@/components/ui/FormField";
import { useList, useCrudMutations } from "@/hooks/useCrud";
import { apiErrorMessage } from "@/lib/api";
import { formatDate } from "@/utils/format";
import type { Company } from "@/types";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  gst: z.string().optional(),
  website: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function CompaniesPage() {
  const router = useRouter();
  const list = useList<Company>("companies");
  const { create, update, remove } = useCrudMutations("companies");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Company | null>(null);
  const [error, setError] = useState("");
  const form = useForm<FormValues>({ resolver: zodResolver(schema) });

  const openCreate = () => {
    setEditing(null);
    form.reset({ name: "", phone: "", email: "", address: "", city: "", state: "", pincode: "", gst: "", website: "", notes: "" });
    setModalOpen(true);
  };

  const openEdit = (c: Company) => {
    setEditing(c);
    form.reset({
      name: c.name, phone: c.phone || "", email: c.email || "", address: c.address || "",
      city: c.city || "", state: c.state || "", pincode: c.pincode || "", gst: c.gst || "",
      website: c.website || "", notes: c.notes || "",
    });
    setModalOpen(true);
  };

  const onSubmit = async (values: FormValues) => {
    setError("");
    try {
      if (editing) await update.mutateAsync({ id: editing._id, ...values });
      else await create.mutateAsync(values);
      setModalOpen(false);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  };

  const columns: Column<Company>[] = [
    { key: "name", header: "Company", exportValue: (r) => r.name },
    { key: "city", header: "City", exportValue: (r) => r.city || "" },
    { key: "phone", header: "Phone", exportValue: (r) => r.phone || "" },
    { key: "email", header: "Email", exportValue: (r) => r.email || "" },
    { key: "gst", header: "GST", exportValue: (r) => r.gst || "", hidden: true },
    { key: "createdAt", header: "Created", render: (r) => formatDate(r.createdAt), exportValue: (r) => formatDate(r.createdAt) },
    {
      key: "actions",
      header: "Actions",
      exportValue: () => "",
      render: (r) => (
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <button className="text-xs font-semibold text-aqua-600 hover:underline" onClick={() => openEdit(r)}>Edit</button>
          <button
            className="text-xs font-semibold text-rose-500 hover:underline"
            onClick={() => { if (confirm(`Delete company "${r.name}"?`)) remove.mutate(r._id); }}
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Companies"
        subtitle="Client companies, buildings and complete visit history"
        actions={<button className="btn-primary" onClick={openCreate}><Plus className="h-4 w-4" /> Add Company</button>}
      />
      <DataTable
        title="Companies"
        columns={columns}
        rows={list.rows}
        loading={list.isLoading}
        searchValue={list.search}
        onSearchChange={list.setSearch}
        page={list.page}
        pages={list.pages}
        total={list.total}
        onPageChange={list.setPage}
        onRowClick={(r) => router.push(`/companies/${r._id}`)}
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Company" : "Add Company"} wide>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {error && <div className="sm:col-span-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600 dark:bg-rose-900/20 dark:text-rose-300">{error}</div>}
          <TextField label="Company Name" {...form.register("name")} error={form.formState.errors.name?.message} />
          <TextField label="Phone" {...form.register("phone")} />
          <TextField label="Email" {...form.register("email")} error={form.formState.errors.email?.message} />
          <TextField label="Website" {...form.register("website")} />
          <TextField label="Address" {...form.register("address")} />
          <TextField label="City" {...form.register("city")} />
          <TextField label="State" {...form.register("state")} />
          <TextField label="Pincode" {...form.register("pincode")} />
          <TextField label="GST" {...form.register("gst")} />
          <div className="sm:col-span-2"><TextAreaField label="Notes" {...form.register("notes")} /></div>
          <div className="sm:col-span-2 flex justify-end gap-2">
            <button type="button" className="btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={form.formState.isSubmitting}>{editing ? "Save Changes" : "Create Company"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
