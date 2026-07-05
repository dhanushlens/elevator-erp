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
import { formatCurrency, formatDate, refName } from "@/utils/format";
import type { Invoice, Customer, Company } from "@/types";

const itemSchema = z.object({
  description: z.string().min(1, "Description required"),
  quantity: z.coerce.number().min(1),
  rate: z.coerce.number().min(0),
});

const schema = z.object({
  customer: z.string().min(1, "Customer is required"),
  company: z.string().optional(),
  items: z.array(itemSchema).min(1, "Add at least one line item"),
  taxPercent: z.coerce.number().min(0).max(100),
  discount: z.coerce.number().min(0),
  issueDate: z.string().min(1, "Issue date required"),
  dueDate: z.string().optional(),
  status: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function InvoicesPage() {
  const router = useRouter();
  const list = useList<Invoice>("invoices");
  const customers = useList<Customer>("customers", { limit: 100 });
  const companies = useList<Company>("companies", { limit: 100 });
  const { create, update, remove } = useCrudMutations("invoices");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Invoice | null>(null);
  const [error, setError] = useState("");
  const form = useForm<z.input<typeof schema>, unknown, FormValues>({ resolver: zodResolver(schema) });
  const items = useFieldArray({ control: form.control, name: "items" });

  const toId = (v: unknown) => (typeof v === "object" && v ? (v as { _id: string })._id : (v as string) || "");

  const openCreate = () => {
    setEditing(null);
    form.reset({
      customer: "", company: "", items: [{ description: "", quantity: 1, rate: 0 }],
      taxPercent: 18, discount: 0, issueDate: new Date().toISOString().slice(0, 10), dueDate: "", status: "unpaid", notes: "",
    });
    setModalOpen(true);
  };

  const openEdit = (inv: Invoice) => {
    setEditing(inv);
    form.reset({
      customer: toId(inv.customer),
      company: toId(inv.company),
      items: inv.items.map((i) => ({ description: i.description, quantity: i.quantity, rate: i.rate })),
      taxPercent: inv.taxPercent,
      discount: inv.discount,
      issueDate: inv.issueDate ? inv.issueDate.slice(0, 10) : "",
      dueDate: inv.dueDate ? inv.dueDate.slice(0, 10) : "",
      status: inv.status,
      notes: inv.notes || "",
    });
    setModalOpen(true);
  };

  const onSubmit = async (values: FormValues) => {
    setError("");
    const payload: Record<string, unknown> = { ...values };
    if (!payload.company) delete payload.company;
    if (!payload.dueDate) delete payload.dueDate;
    try {
      if (editing) await update.mutateAsync({ id: editing._id, ...payload });
      else await create.mutateAsync(payload);
      setModalOpen(false);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  };

  const columns: Column<Invoice>[] = [
    { key: "invoiceNumber", header: "Invoice #", exportValue: (r) => r.invoiceNumber },
    { key: "customer", header: "Customer", render: (r) => refName(r.customer), exportValue: (r) => refName(r.customer) },
    { key: "issueDate", header: "Issued", render: (r) => formatDate(r.issueDate), exportValue: (r) => formatDate(r.issueDate) },
    { key: "dueDate", header: "Due", render: (r) => formatDate(r.dueDate), exportValue: (r) => formatDate(r.dueDate), hidden: true },
    { key: "total", header: "Total", render: (r) => formatCurrency(r.total), exportValue: (r) => r.total },
    { key: "amountPaid", header: "Paid", render: (r) => formatCurrency(r.amountPaid), exportValue: (r) => r.amountPaid },
    { key: "status", header: "Status", render: (r) => <Badge status={r.status} />, exportValue: (r) => r.status },
    {
      key: "actions",
      header: "Actions",
      exportValue: () => "",
      render: (r) => (
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <button className="text-xs font-semibold text-aqua-600 hover:underline" onClick={() => openEdit(r)}>Edit</button>
          <button className="text-xs font-semibold text-rose-500 hover:underline" onClick={() => { if (confirm(`Delete invoice ${r.invoiceNumber}?`)) remove.mutate(r._id); }}>Delete</button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Invoices"
        subtitle="Billing, payments and receivables"
        actions={<button className="btn-primary" onClick={openCreate}><Plus className="h-4 w-4" /> New Invoice</button>}
      />
      <DataTable
        title="Invoices"
        columns={columns}
        rows={list.rows}
        loading={list.isLoading}
        searchValue={list.search}
        onSearchChange={list.setSearch}
        page={list.page}
        pages={list.pages}
        total={list.total}
        onPageChange={list.setPage}
        onRowClick={(r) => router.push(`/invoices/${r._id}`)}
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Invoice" : "New Invoice"} wide>
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

          <div className="sm:col-span-2">
            <div className="mb-2 flex items-center justify-between">
              <label className="label !mb-0">Line Items</label>
              <button type="button" className="btn-ghost !py-1.5 text-xs" onClick={() => items.append({ description: "", quantity: 1, rate: 0 })}>
                <Plus className="h-3 w-3" /> Add Item
              </button>
            </div>
            {form.formState.errors.items?.message && <p className="mb-1 text-xs text-rose-500">{form.formState.errors.items.message}</p>}
            {items.fields.map((field, i) => (
              <div key={field.id} className="mb-2 flex items-end gap-2">
                <div className="flex-1"><TextField label="Description" {...form.register(`items.${i}.description`)} error={form.formState.errors.items?.[i]?.description?.message} /></div>
                <div className="w-20"><TextField label="Qty" type="number" {...form.register(`items.${i}.quantity`)} /></div>
                <div className="w-32"><TextField label="Rate" type="number" {...form.register(`items.${i}.rate`)} /></div>
                <button type="button" className="btn-ghost !p-2.5 text-rose-500" onClick={() => items.remove(i)}><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>

          <TextField label="Tax %" type="number" {...form.register("taxPercent")} />
          <TextField label="Discount" type="number" {...form.register("discount")} />
          <TextField label="Issue Date" type="date" {...form.register("issueDate")} error={form.formState.errors.issueDate?.message} />
          <TextField label="Due Date" type="date" {...form.register("dueDate")} />
          <div className="sm:col-span-2"><TextAreaField label="Notes" {...form.register("notes")} /></div>
          <div className="sm:col-span-2 flex justify-end gap-2">
            <button type="button" className="btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={form.formState.isSubmitting}>{editing ? "Save Changes" : "Create Invoice"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
