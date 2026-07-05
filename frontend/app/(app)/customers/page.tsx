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
import { TextField, SelectField, TextAreaField } from "@/components/ui/FormField";
import { useList, useCrudMutations } from "@/hooks/useCrud";
import { apiErrorMessage } from "@/lib/api";
import { formatDate, refName } from "@/utils/format";
import type { Customer, Company } from "@/types";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  company: z.string().optional(),
  phone: z.string().min(5, "Phone is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  gst: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function CustomersPage() {
  const router = useRouter();
  const list = useList<Customer>("customers");
  const companies = useList<Company>("companies", { limit: 100 });
  const { create, update, remove } = useCrudMutations("customers");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [error, setError] = useState("");

  const form = useForm<FormValues>({ resolver: zodResolver(schema) });

  const openCreate = () => {
    setEditing(null);
    form.reset({ name: "", company: "", phone: "", email: "", address: "", city: "", state: "", pincode: "", gst: "", notes: "" });
    setModalOpen(true);
  };

  const openEdit = (c: Customer) => {
    setEditing(c);
    form.reset({
      name: c.name,
      company: typeof c.company === "object" && c.company ? c.company._id : (c.company as string) || "",
      phone: c.phone,
      email: c.email || "",
      address: c.address || "",
      city: c.city || "",
      state: c.state || "",
      pincode: c.pincode || "",
      gst: c.gst || "",
      notes: c.notes || "",
    });
    setModalOpen(true);
  };

  const onSubmit = async (values: FormValues) => {
    setError("");
    const payload = { ...values, company: values.company || undefined };
    try {
      if (editing) await update.mutateAsync({ id: editing._id, ...payload });
      else await create.mutateAsync(payload);
      setModalOpen(false);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  };

  const columns: Column<Customer>[] = [
    { key: "name", header: "Name", exportValue: (r) => r.name },
    { key: "company", header: "Company", render: (r) => refName(r.company), exportValue: (r) => refName(r.company) },
    { key: "phone", header: "Phone", exportValue: (r) => r.phone },
    { key: "email", header: "Email", exportValue: (r) => r.email || "" },
    { key: "city", header: "City", exportValue: (r) => r.city || "" },
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
            onClick={() => {
              if (confirm(`Delete customer "${r.name}"?`)) remove.mutate(r._id);
            }}
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
        title="Customers"
        subtitle="Manage customer records, elevators, invoices and history"
        actions={
          <button className="btn-primary" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add Customer
          </button>
        }
      />
      <DataTable
        title="Customers"
        columns={columns}
        rows={list.rows}
        loading={list.isLoading}
        searchValue={list.search}
        onSearchChange={list.setSearch}
        page={list.page}
        pages={list.pages}
        total={list.total}
        onPageChange={list.setPage}
        onRowClick={(r) => router.push(`/customers/${r._id}`)}
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Customer" : "Add Customer"} wide>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {error && (
            <div className="sm:col-span-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600 dark:bg-rose-900/20 dark:text-rose-300">{error}</div>
          )}
          <TextField label="Name" {...form.register("name")} error={form.formState.errors.name?.message} />
          <SelectField label="Company" {...form.register("company")}>
            <option value="">— None —</option>
            {companies.rows.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </SelectField>
          <TextField label="Phone" {...form.register("phone")} error={form.formState.errors.phone?.message} />
          <TextField label="Email" {...form.register("email")} error={form.formState.errors.email?.message} />
          <TextField label="Address" {...form.register("address")} />
          <TextField label="City" {...form.register("city")} />
          <TextField label="State" {...form.register("state")} />
          <TextField label="Pincode" {...form.register("pincode")} />
          <TextField label="GST" {...form.register("gst")} />
          <div className="sm:col-span-2">
            <TextAreaField label="Notes" {...form.register("notes")} />
          </div>
          <div className="sm:col-span-2 flex justify-end gap-2">
            <button type="button" className="btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={form.formState.isSubmitting}>
              {editing ? "Save Changes" : "Create Customer"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
