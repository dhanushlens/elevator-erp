"use client";

import { useMemo, useState, ReactNode } from "react";
import { motion } from "framer-motion";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Columns3,
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  Search,
} from "lucide-react";
import { SkeletonRow } from "./Skeleton";
import { exportCsv, exportExcel, exportPdf, printTable, ExportColumn } from "@/utils/export";

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  exportValue?: (row: T) => string | number;
  sortValue?: (row: T) => string | number;
  hidden?: boolean;
}

interface DataTableProps<T> {
  title: string;
  columns: Column<T>[];
  rows: T[];
  loading?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  page?: number;
  pages?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
}

export default function DataTable<T extends { _id?: string }>({
  title,
  columns,
  rows,
  loading,
  searchValue,
  onSearchChange,
  page = 1,
  pages = 1,
  total,
  onPageChange,
  onRowClick,
  emptyMessage = "No records found",
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [hiddenCols, setHiddenCols] = useState<Set<string>>(
    () => new Set(columns.filter((c) => c.hidden).map((c) => c.key))
  );
  const [colMenuOpen, setColMenuOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const visibleColumns = columns.filter((c) => !hiddenCols.has(c.key));

  const sortedRows = useMemo(() => {
    if (!sortKey) return rows;
    const col = columns.find((c) => c.key === sortKey);
    if (!col) return rows;
    const getVal = col.sortValue || col.exportValue || ((r: T) => String((r as Record<string, unknown>)[col.key] ?? ""));
    return [...rows].sort((a, b) => {
      const va = getVal(a);
      const vb = getVal(b);
      const cmp = typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [rows, sortKey, sortDir, columns]);

  const exportColumns: ExportColumn<T>[] = visibleColumns.map((c) => ({
    header: c.header,
    value: c.exportValue || ((r) => String((r as Record<string, unknown>)[c.key] ?? "")),
  }));

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="card overflow-hidden"
    >
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between no-print">
        {onSearchChange ? (
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchValue || ""}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={`Search ${title.toLowerCase()}...`}
              className="input !pl-10"
            />
          </div>
        ) : (
          <div />
        )}
        <div className="flex items-center gap-2">
          <div className="relative">
            <button className="btn-ghost !px-3" onClick={() => setColMenuOpen((o) => !o)} title="Column visibility">
              <Columns3 className="h-4 w-4" />
            </button>
            {colMenuOpen && (
              <div className="card absolute right-0 z-20 mt-2 w-52 p-2">
                {columns.map((c) => (
                  <label key={c.key} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800">
                    <input
                      type="checkbox"
                      checked={!hiddenCols.has(c.key)}
                      onChange={() =>
                        setHiddenCols((prev) => {
                          const next = new Set(prev);
                          if (next.has(c.key)) next.delete(c.key);
                          else next.add(c.key);
                          return next;
                        })
                      }
                      className="accent-aqua-500"
                    />
                    {c.header}
                  </label>
                ))}
              </div>
            )}
          </div>
          <div className="relative">
            <button className="btn-ghost !px-3" onClick={() => setExportOpen((o) => !o)} title="Export">
              <Download className="h-4 w-4" />
              <ChevronDown className="h-3 w-3" />
            </button>
            {exportOpen && (
              <div className="card absolute right-0 z-20 mt-2 w-44 p-2">
                <button className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800" onClick={() => { exportCsv(sortedRows, exportColumns, title); setExportOpen(false); }}>
                  <FileText className="h-4 w-4" /> Export CSV
                </button>
                <button className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800" onClick={() => { exportExcel(sortedRows, exportColumns, title); setExportOpen(false); }}>
                  <FileSpreadsheet className="h-4 w-4" /> Export Excel
                </button>
                <button className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800" onClick={() => { exportPdf(sortedRows, exportColumns, title, title); setExportOpen(false); }}>
                  <FileText className="h-4 w-4" /> Export PDF
                </button>
              </div>
            )}
          </div>
          <button className="btn-ghost !px-3" onClick={() => printTable(sortedRows, exportColumns, title)} title="Print">
            <Printer className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="max-h-[65vh] overflow-auto">
        <table className="table-sticky w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:text-slate-400">
              {visibleColumns.map((c) => (
                <th key={c.key} className="cursor-pointer select-none px-4 py-3 font-semibold" onClick={() => toggleSort(c.key)}>
                  <span className="inline-flex items-center gap-1">
                    {c.header}
                    {sortKey === c.key &&
                      (sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} cols={visibleColumns.length} />)
            ) : sortedRows.length === 0 ? (
              <tr>
                <td colSpan={visibleColumns.length} className="px-4 py-12 text-center text-slate-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sortedRows.map((row, idx) => (
                <tr
                  key={row._id || idx}
                  onClick={() => onRowClick?.(row)}
                  className={`border-b border-slate-50 transition-colors dark:border-slate-800/60 ${onRowClick ? "cursor-pointer hover:bg-aqua-50/60 dark:hover:bg-slate-800/60" : ""}`}
                >
                  {visibleColumns.map((c) => (
                    <td key={c.key} className="px-4 py-3">
                      {c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key] ?? "—")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {onPageChange && (
        <div className="flex items-center justify-between border-t border-slate-100 p-3 text-sm text-slate-500 dark:border-slate-800 no-print">
          <span>
            Page {page} of {Math.max(pages, 1)}
            {typeof total === "number" && ` · ${total} records`}
          </span>
          <div className="flex gap-2">
            <button className="btn-ghost !p-2" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button className="btn-ghost !p-2" disabled={page >= pages} onClick={() => onPageChange(page + 1)}>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
