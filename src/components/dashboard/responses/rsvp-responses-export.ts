"use client";

import {
  formatResponseSubmittedTable,
  getResponseStatusLabel,
  type RsvpResponseRecord,
  type RsvpResponsesExportFormat,
  type RsvpResponsesExportInclude,
  type RsvpResponsesExportRows,
} from "./rsvp-responses-types";

export const RSVP_RESPONSES_EXPORT_BASE_FILENAME = "juan-and-maria-rsvp-responses";

const RSVP_RESPONSES_EXPORT_TITLE = "Juan & Maria Wedding";
const RSVP_RESPONSES_EXPORTED_DATE_LABEL = "Exported May 17, 2026";

type ExportIncludeState = Record<RsvpResponsesExportInclude, boolean>;

type ExportRowsInput = {
  allResponses: RsvpResponseRecord[];
  currentViewResponses: RsvpResponseRecord[];
  rows: RsvpResponsesExportRows;
};

type ExportOptions = ExportRowsInput & {
  format: RsvpResponsesExportFormat;
  includes: ExportIncludeState;
};

type PdfColumn = {
  key: string;
  label: string;
  className?: string;
  render: (row: RsvpResponseRecord) => string;
};

export function getExportRows({
  allResponses,
  currentViewResponses,
  rows,
}: ExportRowsInput) {
  return rows === "current_view" ? currentViewResponses : allResponses;
}

export function exportRsvpResponses(options: ExportOptions) {
  const exportRows = getExportRows(options);

  if (options.format === "csv") {
    const csv = buildRsvpResponsesCsv(exportRows, options.includes);
    downloadCsv(`${RSVP_RESPONSES_EXPORT_BASE_FILENAME}.csv`, csv);
    return;
  }

  openRsvpResponsesPdfPrintView(exportRows, options.includes);
}

function buildRsvpResponsesCsv(rows: RsvpResponseRecord[], includes: ExportIncludeState) {
  const headers = ["Guest", "Status", "Party size", "Submitted"];

  if (includes.contact_details) {
    headers.push("Email", "Phone");
  }

  if (includes.companions) {
    headers.push("Companions");
  }

  if (includes.dietary_notes) {
    headers.push("Dietary notes");
  }

  if (includes.messages) {
    headers.push("Message");
  }

  const body = rows.map((row) => {
    const values = [
      row.guestName,
      getResponseStatusLabel(row.status),
      String(row.partySize),
      formatResponseSubmittedTable(row.submittedAt),
    ];

    if (includes.contact_details) {
      values.push(row.email ?? "", row.phone ?? "");
    }

    if (includes.companions) {
      values.push(row.companions.join(", "));
    }

    if (includes.dietary_notes) {
      values.push(row.dietaryNotes ?? "");
    }

    if (includes.messages) {
      values.push(row.message ?? "");
    }

    return values.map(formatCsvCell).join(",");
  });

  return `\uFEFF${[headers.map(formatCsvCell).join(","), ...body].join("\r\n")}`;
}

function formatCsvCell(value: string) {
  const normalized = String(value ?? "");
  const escaped = normalized.replaceAll('"', '""');

  if (/[",\r\n]/.test(escaped)) {
    return `"${escaped}"`;
  }

  return escaped;
}

function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function openRsvpResponsesPdfPrintView(
  rows: RsvpResponseRecord[],
  includes: ExportIncludeState,
) {
  const printWindow = window.open("", "_blank", "width=1440,height=960");

  if (!printWindow) {
    throw new Error("Unable to open the print window for PDF export.");
  }

  const stats = buildExportStats(rows);
  const columns = buildPdfColumns(includes);
  const tableHead = columns
    .map(
      (column) =>
        `<th class="${column.className ?? ""}">${escapeHtml(column.label)}</th>`,
    )
    .join("");
  const tableBody = rows
    .map(
      (row) =>
        `<tr>${columns
          .map(
            (column) =>
              `<td class="${column.className ?? ""}">${column.render(row)}</td>`,
          )
          .join("")}</tr>`,
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${RSVP_RESPONSES_EXPORT_BASE_FILENAME}.pdf</title>
    <style>
      @page {
        size: A4 landscape;
        margin: 12mm;
      }

      :root {
        color-scheme: light;
        --page: #f8f3ec;
        --surface: #fffdf9;
        --surface-muted: #fcf6ef;
        --surface-accent: #f9eee4;
        --foreground: #1f1b18;
        --muted: #6f655f;
        --heading-muted: #9d7f6f;
        --border: #eadfd2;
        --border-strong: #dfc8b7;
        --brand: #c96b48;
        --brand-strong: #a85539;
        --success: #5d8d2d;
        --success-subtle: #edf4e4;
        --destructive: #a04343;
        --destructive-subtle: #f8eaea;
      }

      * {
        box-sizing: border-box;
      }

      html,
      body {
        margin: 0;
        padding: 0;
        background: var(--page);
        color: var(--foreground);
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }

      body {
        min-height: 100vh;
      }

      .page {
        padding: 0;
      }

      .shell {
        width: min(1280px, 100%);
        margin: 0 auto;
      }

      .header {
        margin-bottom: 26px;
      }

      .pill {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 16px;
        padding: 6px 12px;
        border: 1px solid var(--border-strong);
        border-radius: 999px;
        background: var(--surface);
        color: var(--brand-strong);
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.24em;
        text-transform: uppercase;
      }

      .pill-dot {
        width: 10px;
        height: 10px;
        border-radius: 999px;
        background: var(--brand);
      }

      .eyebrow {
        margin: 0 0 10px;
        color: var(--brand-strong);
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.24em;
        text-transform: uppercase;
      }

      .title {
        margin: 0;
        font-size: 31px;
        line-height: 1.08;
        font-weight: 700;
      }

      .subtitle {
        margin: 10px 0 0;
        color: var(--muted);
        font-size: 14px;
      }

      .stats {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 12px;
        margin-bottom: 28px;
      }

      .stat-card {
        padding: 16px 18px;
        border: 1px solid var(--border);
        border-radius: 22px;
        background: var(--surface);
      }

      .stat-value {
        margin: 0;
        font-size: 28px;
        line-height: 1;
        font-weight: 700;
      }

      .stat-label {
        margin: 8px 0 0;
        color: var(--muted);
        font-size: 13px;
        font-weight: 500;
      }

      .section {
        border: 1px solid var(--border);
        border-radius: 28px;
        background: var(--surface);
        padding: 22px 22px 18px;
      }

      .section-eyebrow {
        margin: 0 0 10px;
        color: var(--heading-muted);
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.24em;
        text-transform: uppercase;
      }

      .section-title {
        margin: 0;
        font-size: 22px;
        line-height: 1.15;
        font-weight: 700;
      }

      .section-subtitle {
        margin: 8px 0 18px;
        color: var(--muted);
        font-size: 13px;
      }

      table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
      }

      thead th {
        padding: 12px 14px;
        border-top: 1px solid var(--border);
        border-bottom: 1px solid var(--border);
        background: var(--surface-muted);
        color: var(--heading-muted);
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.16em;
        text-align: left;
        text-transform: uppercase;
      }

      thead th:first-child {
        border-top-left-radius: 18px;
      }

      thead th:last-child {
        border-top-right-radius: 18px;
      }

      tbody td {
        padding: 14px;
        border-bottom: 1px solid var(--border);
        vertical-align: top;
        font-size: 12px;
        line-height: 1.55;
      }

      tbody tr {
        break-inside: avoid;
        page-break-inside: avoid;
      }

      .guest-name {
        font-weight: 600;
      }

      .contact-line + .contact-line,
      .note-line + .note-line {
        margin-top: 4px;
      }

      .status-chip {
        display: inline-flex;
        align-items: center;
        padding: 6px 10px;
        border-radius: 999px;
        border: 1px solid transparent;
        font-size: 11px;
        font-weight: 600;
        white-space: nowrap;
      }

      .status-attending {
        background: var(--success-subtle);
        border-color: color-mix(in srgb, var(--success) 32%, white);
        color: var(--success);
      }

      .status-not-attending {
        background: var(--destructive-subtle);
        border-color: color-mix(in srgb, var(--destructive) 28%, white);
        color: var(--destructive);
      }

      .table-party,
      .table-submitted {
        white-space: nowrap;
      }

      .footer-note {
        margin-top: 12px;
        color: var(--muted);
        font-size: 11px;
      }
    </style>
  </head>
  <body>
    <main class="page">
      <div class="shell">
        <header class="header">
          <div class="pill"><span class="pill-dot"></span>RSVP</div>
          <p class="eyebrow">RSVP RESPONSES</p>
          <h1 class="title">${escapeHtml(RSVP_RESPONSES_EXPORT_TITLE)}</h1>
          <p class="subtitle">${escapeHtml(RSVP_RESPONSES_EXPORTED_DATE_LABEL)}</p>
        </header>

        <section class="stats" aria-label="Response summary">
          ${buildStatCardHtml(stats.totalResponses, "Total responses")}
          ${buildStatCardHtml(stats.attendingCount, "Attending")}
          ${buildStatCardHtml(stats.notAttendingCount, "Not attending")}
          ${buildStatCardHtml(stats.totalPartySize, "Total party size")}
        </section>

        <section class="section">
          <p class="section-eyebrow">GUEST LIST</p>
          <h2 class="section-title">Full table</h2>
          <p class="section-subtitle">Includes contact, party size, companions, notes, and submission time.</p>

          <table>
            <thead>
              <tr>${tableHead}</tr>
            </thead>
            <tbody>
              ${tableBody}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  </body>
</html>`;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.onload = () => {
    printWindow.print();
  };
}

function buildPdfColumns(includes: ExportIncludeState): PdfColumn[] {
  const columns: PdfColumn[] = [
    {
      key: "guest",
      label: "Guest",
      className: "table-guest",
      render: (row) => `<span class="guest-name">${escapeHtml(row.guestName)}</span>`,
    },
  ];

  if (includes.contact_details) {
    columns.push({
      key: "contact",
      label: "Contact",
      className: "table-contact",
      render: (row) =>
        `<div class="contact-line">${escapeHtml(row.email || "-")}</div><div class="contact-line">${escapeHtml(row.phone || "-")}</div>`,
    });
  }

  columns.push(
    {
      key: "status",
      label: "Status",
      className: "table-status",
      render: (row) =>
        `<span class="status-chip ${row.status === "attending" ? "status-attending" : "status-not-attending"}">${escapeHtml(getResponseStatusLabel(row.status))}</span>`,
    },
    {
      key: "party",
      label: "Party",
      className: "table-party",
      render: (row) => escapeHtml(String(row.partySize)),
    },
  );

  if (includes.companions) {
    columns.push({
      key: "companions",
      label: "Companions",
      className: "table-companions",
      render: (row) => escapeHtml(row.companions.length ? row.companions.join(", ") : "-"),
    });
  }

  if (includes.dietary_notes || includes.messages) {
    columns.push({
      key: "notes",
      label: "Notes",
      className: "table-notes",
      render: (row) => formatPdfNotes(row, includes),
    });
  }

  columns.push({
    key: "submitted",
    label: "Submitted",
    className: "table-submitted",
    render: (row) => escapeHtml(formatResponseSubmittedTable(row.submittedAt)),
  });

  return columns;
}

function formatPdfNotes(row: RsvpResponseRecord, includes: ExportIncludeState) {
  const noteLines: string[] = [];

  if (includes.dietary_notes && row.dietaryNotes?.trim()) {
    noteLines.push(
      `<div class="note-line"><strong>Dietary:</strong> ${escapeHtml(row.dietaryNotes.trim())}</div>`,
    );
  }

  if (includes.messages && row.message?.trim()) {
    noteLines.push(
      `<div class="note-line"><strong>Message:</strong> ${escapeHtml(row.message.trim())}</div>`,
    );
  }

  if (noteLines.length === 0) {
    return "-";
  }

  return noteLines.join("");
}

function buildExportStats(rows: RsvpResponseRecord[]) {
  return {
    totalResponses: rows.length,
    attendingCount: rows.filter((row) => row.status === "attending").length,
    notAttendingCount: rows.filter((row) => row.status === "not_attending").length,
    totalPartySize: rows.reduce((sum, row) => sum + row.partySize, 0),
  };
}

function buildStatCardHtml(value: number, label: string) {
  return `<article class="stat-card"><p class="stat-value">${value}</p><p class="stat-label">${escapeHtml(label)}</p></article>`;
}

function escapeHtml(value: string) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
