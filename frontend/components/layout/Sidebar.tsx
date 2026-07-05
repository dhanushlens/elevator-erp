"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  BarChart3,
  Building2,
  CalendarDays,
  FileText,
  LayoutDashboard,
  Receipt,
  Settings,
  UserCheck,
  Users,
  Wallet,
  Wrench,
  CircleArrowUp,
  ClipboardList,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "technician", "employee"] },
  { href: "/customers", label: "Customers", icon: Users, roles: ["admin", "employee"] },
  { href: "/companies", label: "Companies", icon: Building2, roles: ["admin", "employee"] },
  { href: "/elevators", label: "Elevators", icon: CircleArrowUp, roles: ["admin", "technician", "employee"] },
  { href: "/technicians", label: "Technicians", icon: Wrench, roles: ["admin"] },
  { href: "/services", label: "Services", icon: ClipboardList, roles: ["admin", "technician", "employee"] },
  { href: "/calendar", label: "Calendar", icon: CalendarDays, roles: ["admin", "technician", "employee"] },
  { href: "/invoices", label: "Invoices", icon: Receipt, roles: ["admin", "employee"] },
  { href: "/salary", label: "Salary", icon: Wallet, roles: ["admin"] },
  { href: "/attendance", label: "Attendance", icon: UserCheck, roles: ["admin", "employee"] },
  { href: "/reports", label: "Reports", icon: FileText, roles: ["admin", "employee"] },
  { href: "/analytics", label: "Analytics", icon: BarChart3, roles: ["admin"] },
  { href: "/users", label: "Users & Audit", icon: ShieldCheck, roles: ["admin"] },
  { href: "/settings", label: "Settings", icon: Settings, roles: ["admin"] },
];

export default function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const role = user?.role || "employee";
  const items = NAV.filter((n) => n.roles.includes(role));

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-slate-900/30 backdrop-blur-sm lg:hidden no-print" onClick={onClose} />}
      <aside
        className={`no-print fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="glass m-3 flex h-[calc(100vh-24px)] flex-col rounded-xl3 p-4 shadow-soft">
          <Link href="/dashboard" className="mb-6 flex items-center gap-3 px-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-aqua-gradient text-white shadow-glow">
              <CircleArrowUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-base font-bold tracking-tight text-slate-900 dark:text-white">LiftDesk</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Elevator ERP</p>
            </div>
          </Link>
          <nav className="flex-1 space-y-1 overflow-y-auto">
            {items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all ${
                    active
                      ? "text-white"
                      : "text-slate-600 hover:bg-white/60 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/60 dark:hover:text-white"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-0 rounded-2xl bg-aqua-gradient shadow-glow"
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}
                  <item.icon className="relative z-10 h-4.5 w-4.5 h-[18px] w-[18px]" />
                  <span className="relative z-10">{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="mt-4 rounded-2xl bg-aqua-50/80 p-3 text-xs text-aqua-800 dark:bg-aqua-900/30 dark:text-aqua-200">
            Signed in as <span className="font-semibold">{user?.name}</span>
            <br />
            <span className="capitalize opacity-80">{role}</span>
          </div>
        </div>
      </aside>
    </>
  );
}
