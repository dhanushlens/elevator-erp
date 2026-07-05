"use client";

import { motion } from "framer-motion";
import { CircleArrowUp } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="card w-full max-w-md p-8"
      >
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-3xl bg-aqua-gradient text-white shadow-glow">
            <CircleArrowUp className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">LiftDesk</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Elevator Service Management</p>
        </div>
        {children}
      </motion.div>
    </div>
  );
}
