"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import DataTable, { Column } from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import { TextField, SelectField } from "@/components/ui/FormField";
import { useList, useCrudMutations } from "@/hooks/useCrud";
import { useAuth } from "@/context/AuthContext";
import { apiErrorMessage } from "@/lib/api";
import { formatDateTime, refName, titleCase } from "@/utils/format";
import type { User, ActivityLog, AuditLog } from "@/types";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email required"),
  password: z.string().min(8, "Minimum 8 characters").optional().or(z.literal("")),
  role: z.enum(["admin", "technician", "employee"]),
  active: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function UsersPage() {
  const { user: me } = useAuth();
  const [tab, setTab] = useState<"users" | "activity" | "audit">("users");
  const users = useList<User>("users");
  const activity = useList<ActivityLog>("users/activity-logs");
  const audit = useList<AuditLog>("users/audit-logs");
  const { create, update, remove } = useCrudMutations("users");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [error, setError] = useState("");
  const form = useForm<FormValues>({ resolver: zodResolver(schema) });

  const openCreate = () => {
    setEditing(null);
    setError("");
    form.reset({ name: "", email: "", password: "", role: "employee", active: "true" });
    setModalOpen(true);
  };

  const openEdit = (u: User) => {
    setEditing(u);
    setError("");
    form.reset({ name: u.name, email: u.email, password: "", role: u.role, active: String(u.isActive ?? true) });
    setModalOpen(true);
  };

  const onSubmit = async (values: FormValues) => {
    setError("");
    const payload: Record<string, unknown> = {
      name: values.name,
      email: values.email,
      role: values.role,
      isActive: values.active === "true",
    };
    if (values.password) payload.password = values.password;
    else if (!editing) {
      setError("Password is required for new users");
      return;
    }
    try {
      if (editing) await update.mutateAsync({ id: editing._id, ...payload });
      else await create.mutateAsync(payload);
      setModalOpen(false);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  };

  const userColumns: Column<User>[] = [
    { key: "name", header: "Name", exportValue: (r) => r.name },
    { key: "email", header: "Email", exportValue: (r) => r.email },
    { key: "role", header: "Role", render: (r) => <Badge status={r.role} />, exportValue: (r) => r.role },
    { key: "active", header: "Active", render: (r) => <Badge status={r.isActive === false ? "inactive" : "active"} />, exportValue: (r) => (r.isActive === false ? "No" : "Yes") },
    { key: "createdAt", header: "Created", render: (r) => formatDateTime(r.createdAt), exportValue: (r) => formatDateTime(r.createdAt), hidden: true },
    {
      key: "actions",
      header: "Actions",
      exportValue: () => "",
      render: (r) => (
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <button className="text-xs font-semibold text-aqua-600 hover:underline" onClick={() => openEdit(r)}>Edit</button>
          {r._id !== me?._id && (
            <button className="text-xs font-semibold text-rose-500 hover:underline" onClick={() => { if (confirm(`Delete user ${r.name}?`)) remove.mutate(r._id); }}>Delete</button>
          )}
        </div>
      ),
    },
  ];

  const activityColumns: Column<ActivityLog>[] = [
    { key: "createdAt", header: "When", render: (r) => formatDateTime(r.createdAt), exportValue: (r) => formatDateTime(r.createdAt) },
    { key: "user", header: "User", render: (r) => refName(r.user), exportValue: (r) => refName(r.user) },
    { key: "action", header: "Action", render: (r) => <Badge status={r.action} />, exportValue: (r) => r.action },
    { key: "entity", header: "Entity", render: (r) => titleCase(r.entity), exportValue: (r) => r.entity || "" },
    { key: "description", header: "Description", exportValue: (r) => r.description || "" },
  ];

  const auditColumns: Column<AuditLog>[] = [
    { key: "createdAt", header: "When", render: (r) => formatDateTime(r.createdAt), exportValue: (r) => formatDateTime(r.createdAt) },
    { key: "user", header: "User", render: (r) => refName(r.user), exportValue: (r) => refName(r.user) },
    { key: "method", header: "Method", exportValue: (r) => r.method },
    { key: "path", header: "Path", exportValue: (r) => r.path },
    { key: "statusCode", header: "Status", render: (r) => <Badge status={r.statusCode < 400 ? "success" : "failed"} />, exportValue: (r) => r.statusCode },
    { key: "ip", header: "IP", exportValue: (r) => r.ip || "", hidden: true },
  ];

  return (
    <div>
      <PageHeader
        title="Users & Audit"
        subtitle="User accounts, activity feed and audit trail"
        actions={tab === "users" ? <button className="btn-primary" onClick={openCreate}><Plus className="h-4 w-4" /> New User</button> : undefined}
      />

      <div className="mb-4 flex gap-2 no-print">
        {(["users", "activity", "audit"] as const).map((t) => (
          <button key={t} className={`rounded-2xl px-4 py-2 text-sm font-semibold capitalize ${tab === t ? "bg-aqua-500 text-white shadow-glow" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"}`} onClick={() => setTab(t)}>
            {t === "audit" ? "Audit Logs" : t === "activity" ? "Activity Logs" : "Users"}
          </button>
        ))}
      </div>

      {tab === "users" && (
        <DataTable title="Users" columns={userColumns} rows={users.rows} loading={users.isLoading} searchValue={users.search} onSearchChange={users.setSearch} page={users.page} pages={users.pages} total={users.total} onPageChange={users.setPage} />
      )}
      {tab === "activity" && (
        <DataTable title="Activity Logs" columns={activityColumns} rows={activity.rows} loading={activity.isLoading} page={activity.page} pages={activity.pages} total={activity.total} onPageChange={activity.setPage} />
      )}
      {tab === "audit" && (
        <DataTable title="Audit Logs" columns={auditColumns} rows={audit.rows} loading={audit.isLoading} page={audit.page} pages={audit.pages} total={audit.total} onPageChange={audit.setPage} />
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit User" : "New User"}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {error && <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600 dark:bg-rose-900/20 dark:text-rose-300">{error}</div>}
          <TextField label="Name" {...form.register("name")} error={form.formState.errors.name?.message} />
          <TextField label="Email" type="email" {...form.register("email")} error={form.formState.errors.email?.message} />
          <TextField label={editing ? "New Password (leave blank to keep)" : "Password"} type="password" {...form.register("password")} error={form.formState.errors.password?.message} />
          <SelectField label="Role" {...form.register("role")}>
            {["admin", "technician", "employee"].map((r) => <option key={r} value={r}>{titleCase(r)}</option>)}
          </SelectField>
          <SelectField label="Status" {...form.register("active")}>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </SelectField>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={form.formState.isSubmitting}>{editing ? "Save Changes" : "Create User"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
