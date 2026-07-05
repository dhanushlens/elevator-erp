"use client";

export const DATE_RANGES = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "this-week", label: "This Week" },
  { value: "last-week", label: "Last Week" },
  { value: "this-month", label: "This Month" },
  { value: "last-month", label: "Last Month" },
  { value: "3-months", label: "3 Months" },
  { value: "6-months", label: "6 Months" },
  { value: "1-year", label: "1 Year" },
  { value: "3-years", label: "3 Years" },
  { value: "lifetime", label: "Lifetime" },
  { value: "custom", label: "Custom Range" },
];

export default function DateRangeSelect({
  range,
  from,
  to,
  onChange,
}: {
  range: string;
  from: string;
  to: string;
  onChange: (v: { range: string; from: string; to: string }) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        className="input !w-auto"
        value={range}
        onChange={(e) => onChange({ range: e.target.value, from, to })}
      >
        {DATE_RANGES.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </select>
      {range === "custom" && (
        <>
          <input
            type="date"
            className="input !w-auto"
            value={from}
            onChange={(e) => onChange({ range, from: e.target.value, to })}
          />
          <span className="text-slate-400">→</span>
          <input
            type="date"
            className="input !w-auto"
            value={to}
            onChange={(e) => onChange({ range, from, to: e.target.value })}
          />
        </>
      )}
    </div>
  );
}
