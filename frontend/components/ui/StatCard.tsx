"use client";

import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";

export default function StatCard({
  title,
  value,
  icon: Icon,
  prefix = "",
  accent = "aqua",
  delay = 0,
}: {
  title: string;
  value: number;
  icon: LucideIcon;
  prefix?: string;
  accent?: "aqua" | "blue" | "amber" | "rose" | "violet";
  delay?: number;
}) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v).toLocaleString("en-IN"));
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    const controls = animate(count, value, { duration: 1, ease: "easeOut", delay });
    const unsub = rounded.on("change", (v) => setDisplay(v));
    return () => {
      controls.stop();
      unsub();
    };
  }, [value, count, rounded, delay]);

  const accents: Record<string, string> = {
    aqua: "from-aqua-400/20 to-aqua-500/10 text-aqua-600 dark:text-aqua-300",
    blue: "from-sky-400/20 to-sky-500/10 text-sky-600 dark:text-sky-300",
    amber: "from-amber-400/20 to-amber-500/10 text-amber-600 dark:text-amber-300",
    rose: "from-rose-400/20 to-rose-500/10 text-rose-600 dark:text-rose-300",
    violet: "from-violet-400/20 to-violet-500/10 text-violet-600 dark:text-violet-300",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      className="card card-hover p-5"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {title}
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {prefix}
            {display}
          </p>
        </div>
        <div className={`rounded-2xl bg-gradient-to-br p-3 ${accents[accent]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </motion.div>
  );
}
