"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/context/AuthContext";
import { apiErrorMessage } from "@/lib/api";
import { TextField } from "@/components/ui/FormField";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const { login } = useAuth();
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setError("");
    try {
      await login(values.email, values.password);
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
      <TextField label="Email" type="email" placeholder="you@company.com" {...register("email")} error={errors.email?.message} />
      <TextField label="Password" type="password" placeholder="••••••••" {...register("password")} error={errors.password?.message} />
      <div className="flex items-center justify-between text-sm">
        <Link href="/forgot-password" className="font-medium text-aqua-600 hover:underline">
          Forgot password?
        </Link>
        <Link href="/register" className="font-medium text-aqua-600 hover:underline">
          Create account
        </Link>
      </div>
      <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
        {isSubmitting ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
