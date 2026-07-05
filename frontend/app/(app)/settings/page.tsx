"use client";

import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import { TextField, SelectField, TextAreaField } from "@/components/ui/FormField";
import { SkeletonBlock } from "@/components/ui/Skeleton";
import { api, apiErrorMessage } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";
import type { Settings } from "@/types";

const schema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  companyAddress: z.string().optional(),
  companyPhone: z.string().optional(),
  companyEmail: z.string().email().optional().or(z.literal("")),
  companyGst: z.string().optional(),
  currency: z.string().optional(),
  currencySymbol: z.string().optional(),
  taxPercent: z.coerce.number().min(0).max(100),
  amcReminderDays: z.coerce.number().min(1).max(365),
  warrantyReminderDays: z.coerce.number().min(1).max(365),
  serviceReminderDays: z.coerce.number().min(1).max(60),
  invoicePrefix: z.string().min(1),
  invoiceFooter: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function SettingsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const toast = useToast();
  const isAdmin = user?.role === "admin";

  const { data: settings, isLoading } = useQuery<Settings>({
    queryKey: ["settings"],
    queryFn: async () => (await api.get("/users/settings")).data.data,
  });

  const form = useForm<z.input<typeof schema>, unknown, FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (settings) {
      form.reset({
        companyName: settings.companyName || "",
        companyAddress: settings.companyAddress || "",
        companyPhone: settings.companyPhone || "",
        companyEmail: settings.companyEmail || "",
        companyGst: settings.companyGst || "",
        currency: settings.currency || "INR",
        currencySymbol: settings.currencySymbol || "₹",
        taxPercent: settings.taxPercent ?? 18,
        amcReminderDays: settings.amcReminderDays ?? 30,
        warrantyReminderDays: settings.warrantyReminderDays ?? 30,
        serviceReminderDays: settings.serviceReminderDays ?? 3,
        invoicePrefix: settings.invoicePrefix || "INV",
        invoiceFooter: settings.invoiceFooter || "",
      });
    }
  }, [settings, form]);

  const saveMutation = useMutation({
    mutationFn: async (values: FormValues) => (await api.patch("/users/settings", values)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast("Settings saved", "success");
    },
    onError: (err) => toast(apiErrorMessage(err), "error"),
  });

  if (isLoading) return <SkeletonBlock className="h-96" />;

  return (
    <div>
      <PageHeader title="Settings" subtitle="Company information, invoicing and notification thresholds" />

      <form onSubmit={form.handleSubmit((v) => saveMutation.mutate(v))} className="max-w-3xl space-y-4">
        <div className="card p-5">
          <h3 className="mb-4 text-sm font-bold">Company Information</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField label="Company Name" {...form.register("companyName")} error={form.formState.errors.companyName?.message} disabled={!isAdmin} />
            <TextField label="GST Number" {...form.register("companyGst")} disabled={!isAdmin} />
            <TextField label="Phone" {...form.register("companyPhone")} disabled={!isAdmin} />
            <TextField label="Email" {...form.register("companyEmail")} error={form.formState.errors.companyEmail?.message} disabled={!isAdmin} />
            <div className="sm:col-span-2"><TextAreaField label="Address" {...form.register("companyAddress")} disabled={!isAdmin} /></div>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="mb-4 text-sm font-bold">Invoicing</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SelectField label="Currency" {...form.register("currency")} disabled={!isAdmin}>
              {["INR", "USD", "EUR", "AED", "GBP"].map((c) => <option key={c} value={c}>{c}</option>)}
            </SelectField>
            <TextField label="Currency Symbol" {...form.register("currencySymbol")} disabled={!isAdmin} />
            <TextField label="Default Tax %" type="number" {...form.register("taxPercent")} error={form.formState.errors.taxPercent?.message} disabled={!isAdmin} />
            <TextField label="Invoice Prefix" {...form.register("invoicePrefix")} error={form.formState.errors.invoicePrefix?.message} disabled={!isAdmin} />
            <div className="sm:col-span-2"><TextAreaField label="Invoice Footer" {...form.register("invoiceFooter")} disabled={!isAdmin} /></div>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="mb-4 text-sm font-bold">Notification Thresholds (days before)</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <TextField label="AMC Expiry Reminder" type="number" {...form.register("amcReminderDays")} disabled={!isAdmin} />
            <TextField label="Warranty Expiry Reminder" type="number" {...form.register("warrantyReminderDays")} disabled={!isAdmin} />
            <TextField label="Upcoming Service Reminder" type="number" {...form.register("serviceReminderDays")} disabled={!isAdmin} />
          </div>
        </div>

        {isAdmin ? (
          <div className="flex justify-end">
            <button type="submit" className="btn-primary" disabled={saveMutation.isPending}>
              <Save className="h-4 w-4" /> {saveMutation.isPending ? "Saving..." : "Save Settings"}
            </button>
          </div>
        ) : (
          <p className="text-sm text-slate-400">Only administrators can modify settings.</p>
        )}
      </form>
    </div>
  );
}
