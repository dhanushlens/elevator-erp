"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Search, Users, Building2, CircleArrowUp, Wrench, Receipt, ClipboardList } from "lucide-react";
import { api } from "@/lib/api";

interface SearchResults {
  customers?: { _id: string; name: string; phone?: string }[];
  companies?: { _id: string; name: string; city?: string }[];
  elevators?: { _id: string; code: string; building?: string }[];
  technicians?: { _id: string; name: string; mobile?: string }[];
  invoices?: { _id: string; invoiceNumber: string; customer?: { name?: string } }[];
  services?: { _id: string; serviceNumber: string; customer?: { name?: string } }[];
}

const SECTIONS: { key: keyof SearchResults; label: string; icon: typeof Users; href: (id: string) => string; title: (item: Record<string, unknown>) => string }[] = [
  { key: "customers", label: "Customers", icon: Users, href: (id) => `/customers/${id}`, title: (i) => String(i.name) },
  { key: "companies", label: "Companies", icon: Building2, href: (id) => `/companies/${id}`, title: (i) => String(i.name) },
  { key: "elevators", label: "Elevators", icon: CircleArrowUp, href: (id) => `/elevators/${id}`, title: (i) => `${i.code} · ${i.building || ""}` },
  { key: "technicians", label: "Technicians", icon: Wrench, href: (id) => `/technicians/${id}`, title: (i) => String(i.name) },
  { key: "invoices", label: "Invoices", icon: Receipt, href: (id) => `/invoices/${id}`, title: (i) => String(i.invoiceNumber) },
  { key: "services", label: "Services & Visits", icon: ClipboardList, href: (id) => `/services/${id}`, title: (i) => String(i.serviceNumber) },
];

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const { data } = useQuery<SearchResults>({
    queryKey: ["global-search", q],
    queryFn: async () => (await api.get(`/dashboard/search`, { params: { q } })).data.data,
    enabled: open && q.trim().length >= 2,
  });

  const go = (href: string) => {
    setOpen(false);
    setQ("");
    router.push(href);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="btn-ghost hidden w-64 !justify-start text-slate-400 sm:flex"
      >
        <Search className="h-4 w-4" />
        Search anything...
        <kbd className="ml-auto rounded-md border border-slate-200 px-1.5 py-0.5 text-[10px] dark:border-slate-700">⌘K</kbd>
      </button>
      <button onClick={() => setOpen(true)} className="btn-ghost !p-2.5 sm:hidden" aria-label="Search">
        <Search className="h-4 w-4" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/40 p-4 pt-24 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -8 }}
              className="card w-full max-w-xl p-3"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  ref={inputRef}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search customers, companies, elevators, technicians, invoices, visits..."
                  className="input !pl-10"
                />
              </div>
              <div className="mt-2 max-h-96 overflow-y-auto">
                {q.trim().length < 2 ? (
                  <p className="px-3 py-6 text-center text-sm text-slate-400">Type at least 2 characters to search</p>
                ) : (
                  SECTIONS.map((section) => {
                    const items = (data?.[section.key] || []) as Record<string, unknown>[];
                    if (!items.length) return null;
                    return (
                      <div key={section.key} className="mb-2">
                        <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {section.label}
                        </p>
                        {items.map((item) => (
                          <button
                            key={String(item._id)}
                            onClick={() => go(section.href(String(item._id)))}
                            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm hover:bg-aqua-50 dark:hover:bg-slate-800"
                          >
                            <section.icon className="h-4 w-4 text-aqua-500" />
                            {section.title(item)}
                          </button>
                        ))}
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
