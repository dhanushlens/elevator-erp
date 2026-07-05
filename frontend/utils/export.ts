export type ExportColumn<T> = { header: string; value: (row: T) => string | number };

function toCsv<T>(rows: T[], columns: ExportColumn<T>[]): string {
  const escape = (v: string | number) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = columns.map((c) => escape(c.header)).join(",");
  const body = rows.map((row) => columns.map((c) => escape(c.value(row))).join(",")).join("\n");
  return `${header}\n${body}`;
}

function download(content: string, filename: string, mime: string) {
  const blob = new Blob(["\uFEFF" + content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportCsv<T>(rows: T[], columns: ExportColumn<T>[], filename: string) {
  download(toCsv(rows, columns), `${filename}.csv`, "text/csv;charset=utf-8");
}

export function exportExcel<T>(rows: T[], columns: ExportColumn<T>[], filename: string) {
  // Excel-compatible XML spreadsheet (opens natively in Excel)
  const headerCells = columns
    .map((c) => `<Cell><Data ss:Type="String">${escapeXml(c.header)}</Data></Cell>`)
    .join("");
  const bodyRows = rows
    .map((row) => {
      const cells = columns
        .map((c) => {
          const v = c.value(row);
          const type = typeof v === "number" ? "Number" : "String";
          return `<Cell><Data ss:Type="${type}">${escapeXml(String(v ?? ""))}</Data></Cell>`;
        })
        .join("");
      return `<Row>${cells}</Row>`;
    })
    .join("");
  const xml = `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Worksheet ss:Name="Sheet1"><Table><Row>${headerCells}</Row>${bodyRows}</Table></Worksheet></Workbook>`;
  download(xml, `${filename}.xls`, "application/vnd.ms-excel");
}

export function exportPdf<T>(rows: T[], columns: ExportColumn<T>[], filename: string, title?: string) {
  // Opens a print-optimized window; user saves as PDF via the browser dialog.
  printTable(rows, columns, title || filename);
}

export function printTable<T>(rows: T[], columns: ExportColumn<T>[], title: string) {
  const win = window.open("", "_blank", "width=1000,height=700");
  if (!win) return;
  const headerCells = columns.map((c) => `<th>${escapeXml(c.header)}</th>`).join("");
  const bodyRows = rows
    .map(
      (row) =>
        `<tr>${columns.map((c) => `<td>${escapeXml(String(c.value(row) ?? ""))}</td>`).join("")}</tr>`
    )
    .join("");
  win.document.write(`<!DOCTYPE html><html><head><title>${escapeXml(title)}</title><style>
    body{font-family:-apple-system,'Segoe UI',Roboto,sans-serif;padding:32px;color:#1e293b}
    h1{font-size:20px;margin-bottom:4px}
    .meta{color:#64748b;font-size:12px;margin-bottom:20px}
    table{width:100%;border-collapse:collapse;font-size:12px}
    th{background:#f0fdfa;color:#0f766e;text-align:left;padding:8px 10px;border:1px solid #e2e8f0}
    td{padding:7px 10px;border:1px solid #e2e8f0}
    tr:nth-child(even) td{background:#f8fafc}
    footer{margin-top:24px;font-size:11px;color:#94a3b8;display:flex;justify-content:space-between}
    @page{margin:18mm}
  </style></head><body>
    <h1>${escapeXml(title)}</h1>
    <div class="meta">Generated on ${new Date().toLocaleString()} · ${rows.length} records</div>
    <table><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table>
    <footer><span>Elevator Service Management System</span><span>${new Date().toLocaleDateString()}</span></footer>
  </body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 300);
}

function escapeXml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
