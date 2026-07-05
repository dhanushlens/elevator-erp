export const formatCurrency = (amount?: number | null, symbol = "\u20B9") =>
  `${symbol}${(amount || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export const formatDate = (date?: string | Date | null) => {
  if (!date) return "—";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

export const formatDateTime = (date?: string | Date | null) => {
  if (!date) return "—";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const monthName = (m: number) =>
  ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m - 1] || "";

export const titleCase = (s?: string) =>
  (s || "").replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export function refName(value: unknown, key = "name"): string {
  if (!value) return "—";
  if (typeof value === "string") return value;
  const obj = value as Record<string, unknown>;
  return String(obj[key] ?? "—");
}
