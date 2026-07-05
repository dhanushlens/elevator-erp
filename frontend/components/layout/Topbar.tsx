"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, LogOut, Menu, Moon, Sun, User as UserIcon } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import GlobalSearch from "./GlobalSearch";
import type { Notification } from "@/types";
import { formatDateTime } from "@/utils/format";

export default function Topbar({ onMenu }: { onMenu: () => void }) {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data } = useQuery<{ unreadCount: number; data: Notification[] }>({
    queryKey: ["notifications"],
    queryFn: async () => (await api.get("/notifications", { params: { limit: 15 } })).data,
    refetchInterval: 60_000,
  });

  const markAll = useMutation({
    mutationFn: async () => api.patch("/notifications/read-all"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return (
    <header className="no-print sticky top-0 z-20 mb-6">
      <div className="glass flex items-center gap-3 rounded-xl3 px-4 py-3 shadow-soft">
        <button className="btn-ghost !p-2.5 lg:hidden" onClick={onMenu} aria-label="Menu">
          <Menu className="h-4 w-4" />
        </button>
        <GlobalSearch />
        <div className="ml-auto flex items-center gap-2">
          <button className="btn-ghost !p-2.5" onClick={toggle} aria-label="Toggle theme">
            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </button>
          <div className="relative">
            <button className="btn-ghost relative !p-2.5" onClick={() => setNotifOpen((o) => !o)} aria-label="Notifications">
              <Bell className="h-4 w-4" />
              {(data?.unreadCount || 0) > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                  {data?.unreadCount}
                </span>
              )}
            </button>
            <AnimatePresence>
              {notifOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="card absolute right-0 z-30 mt-2 w-80 p-3"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-bold">Notifications</p>
                    <button className="text-xs font-medium text-aqua-600 hover:underline" onClick={() => markAll.mutate()}>
                      Mark all read
                    </button>
                  </div>
                  <div className="max-h-80 space-y-1 overflow-y-auto">
                    {(data?.data || []).length === 0 && (
                      <p className="py-6 text-center text-sm text-slate-400">No notifications</p>
                    )}
                    {(data?.data || []).map((n) => (
                      <button
                        key={n._id}
                        onClick={() => {
                          api.patch(`/notifications/${n._id}/read`).finally(() =>
                            queryClient.invalidateQueries({ queryKey: ["notifications"] })
                          );
                          if (n.link) router.push(n.link);
                          setNotifOpen(false);
                        }}
                        className={`block w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800 ${!n.isRead ? "bg-aqua-50/60 dark:bg-aqua-900/20" : ""}`}
                      >
                        <p className="font-semibold">{n.title}</p>
                        {n.message && <p className="text-xs text-slate-500">{n.message}</p>}
                        <p className="mt-0.5 text-[10px] text-slate-400">{formatDateTime(n.createdAt)}</p>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="relative">
            <button className="btn-ghost !py-1.5 !pl-1.5 !pr-3" onClick={() => setUserOpen((o) => !o)}>
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-aqua-gradient text-xs font-bold text-white">
                {(user?.name || "U").slice(0, 1).toUpperCase()}
              </span>
              <span className="hidden text-sm sm:inline">{user?.name}</span>
            </button>
            <AnimatePresence>
              {userOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="card absolute right-0 z-30 mt-2 w-48 p-2"
                >
                  <div className="border-b border-slate-100 px-3 py-2 dark:border-slate-800">
                    <p className="text-sm font-semibold">{user?.name}</p>
                    <p className="text-xs capitalize text-slate-400">{user?.role}</p>
                  </div>
                  <button
                    className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                    onClick={() => {
                      setUserOpen(false);
                      router.push("/settings/profile");
                    }}
                  >
                    <UserIcon className="h-4 w-4" /> Profile
                  </button>
                  <button
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                    onClick={logout}
                  >
                    <LogOut className="h-4 w-4" /> Logout
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
