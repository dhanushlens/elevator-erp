"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api, apiErrorMessage } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { TextField, SelectField } from "@/components/ui/FormField";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Minimum 8 characters"),
  role: z.enum(["admin", "technician", "employee"]),
  phone: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const [error, setError] = useState("");
  const router = useRouter();
  const { setUser } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { role: "employee" } });

  const onSubmit = async (values: FormValues) => {
    setError("");
    try {
      const res = await api.post("/auth/register", values);
      const { user, accessToken, refreshToken } = res.data.data;
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      setUser(user);
      router.push("/dashboard");
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600 dark:bg-rose-900/20 dark:text-rose-300">
          {error}
        </div>
      )}
      <TextField label="Full name" placeholder="Jane Doe" {...register("name")} error={errors.name?.message} />
      <TextField label="Email" type="email" placeholder="you@company.com" {...register("email")} error={errors.email?.message} />
      <TextField label="Password" type="password" placeholder="Minimum 8 characters" {...register("password")} error={errors.password?.message} />
      <SelectField label="Role" {...register("role")} error={errors.role?.message}>
        <option value="employee">Employee</option>
        <option value="technician">Technician</option>
        <option value="admin">Admin</option>
      </SelectField>
      <TextField label="Phone (optional)" placeholder="+91 ..." {...register("phone")} error={errors.phone?.message} />
      <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
        {isSubmitting ? "Creating account..." : "Create account"}
      </button>
      <p className="text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-aqua-600 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
