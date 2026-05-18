"use client";

import { jsPDF } from "jspdf";
import autoTable, { type CellHookData, type RowInput } from "jspdf-autotable";
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
const RSVP_RESPONSES_EXPORT_SUBTITLE = "Exported May 17, 2026";
const RSVP_RESPONSES_EXPORT_META_LABEL = "Landscape table";
const RSVP_RESPONSES_EXPORT_META_LINK = "webserbisyo.app/r/juan-and-maria";

type RgbColor = [number, number, number];

function rgb(r: number, g: number, b: number): RgbColor {
  return [r, g, b];
}

const LANDSCAPE_COLORS = {
  white: rgb(255, 255, 255),
  page: rgb(251, 247, 242),
  surface: rgb(255, 252, 248),
  surfaceMuted: rgb(249, 242, 234),
  border: rgb(229, 214, 202),
  borderStrong: rgb(214, 186, 168),
  headingMuted: rgb(154, 124, 107),
  muted: rgb(111, 98, 90),
  foreground: rgb(32, 26, 22),
  brand: rgb(201, 107, 72),
  brandStrong: rgb(166, 83, 53),
  success: rgb(92, 139, 44),
  destructive: rgb(171, 74, 74),
};

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

type LandscapeColumn = {
  header: string;
  key:
    | "guest"
    | "contact"
    | "status"
    | "party"
    | "companions"
    | "dietary"
    | "message"
    | "submitted";
  width: number;
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

  downloadLandscapePdf(exportRows, options.includes);
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

function downloadLandscapePdf(rows: RsvpResponseRecord[], includes: ExportIncludeState) {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "pt",
    format: "a4",
    compress: true,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 34;
  const marginTop = 28;
  const contentWidth = pageWidth - marginX * 2;
  const statsGap = 10;
  const statWidth = (contentWidth - statsGap * 3) / 4;
  const statsTop = 118;
  const statsHeight = 50;
  const sectionTop = statsTop + statsHeight + 26;
  const tableTop = sectionTop + 52;

  doc.setFillColor(...LANDSCAPE_COLORS.white);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  drawLandscapeHeader(doc, {
    contentWidth,
    marginTop,
    x: marginX,
  });

  const stats = buildExportStats(rows);
  const statCards: Array<{ label: string; value: number }> = [
    { label: "Total responses", value: stats.totalResponses },
    { label: "Attending", value: stats.attendingCount },
    { label: "Not attending", value: stats.notAttendingCount },
    { label: "Total party size", value: stats.totalPartySize },
  ];

  statCards.forEach((card, index) => {
    const x = marginX + index * (statWidth + statsGap);
    drawStatCard(doc, {
      height: statsHeight,
      label: card.label,
      value: card.value,
      width: statWidth,
      x,
      y: statsTop,
    });
  });

  doc.setTextColor(...LANDSCAPE_COLORS.headingMuted);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("GUEST LIST", marginX, sectionTop);

  doc.setTextColor(...LANDSCAPE_COLORS.foreground);
  doc.setFontSize(17);
  doc.text("Full table", marginX, sectionTop + 18);

  doc.setTextColor(...LANDSCAPE_COLORS.muted);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(
    "Includes contact, party size, companions, notes, and submission time.",
    marginX,
    sectionTop + 34,
  );

  const columns = buildLandscapeColumns(includes);
  const body = rows.map((row) =>
    columns.map((column) => column.render(row)),
  ) satisfies RowInput[];

  autoTable(doc, {
    startY: tableTop,
    margin: { left: marginX, right: marginX },
    tableWidth: contentWidth,
    head: [columns.map((column) => column.header)],
    body,
    theme: "grid",
    rowPageBreak: "avoid",
    styles: {
      font: "helvetica",
      fontSize: 7.4,
      textColor: LANDSCAPE_COLORS.foreground,
      cellPadding: { top: 4, right: 5, bottom: 4, left: 5 },
      lineColor: LANDSCAPE_COLORS.border,
      lineWidth: 0.45,
      overflow: "linebreak",
      valign: "middle",
    },
    headStyles: {
      fillColor: LANDSCAPE_COLORS.surfaceMuted,
      textColor: LANDSCAPE_COLORS.headingMuted,
      fontStyle: "bold",
      fontSize: 7.2,
      lineColor: LANDSCAPE_COLORS.borderStrong,
      lineWidth: 0.55,
      cellPadding: { top: 5, right: 5, bottom: 5, left: 5 },
    },
    bodyStyles: {
      fillColor: LANDSCAPE_COLORS.white,
    },
    columnStyles: Object.fromEntries(
      columns.map((column, index) => [index, { cellWidth: column.width }]),
    ),
    didParseCell: (data) => {
      if (data.section === "body" && columns[data.column.index]?.key === "status") {
        const rawValue = String(data.cell.raw ?? "");
        data.cell.styles.textColor =
          rawValue === "Attending"
            ? LANDSCAPE_COLORS.success
            : LANDSCAPE_COLORS.destructive;
        data.cell.styles.fontStyle = "bold";
      }
    },
    didDrawCell: (data: CellHookData) => {
      if (data.section !== "body") {
        return;
      }

      const key = columns[data.column.index]?.key;

      if (key === "status") {
        data.cell.styles.valign = "middle";
      }
    },
  });

  doc.save(`${RSVP_RESPONSES_EXPORT_BASE_FILENAME}.pdf`);
}

function drawLandscapeHeader(
  doc: jsPDF,
  {
    contentWidth,
    marginTop,
    x,
  }: {
    contentWidth: number;
    marginTop: number;
    x: number;
  },
) {
  const pillWidth = 34;
  const pillHeight = 18;

  doc.setFillColor(...LANDSCAPE_COLORS.brand);
  doc.roundedRect(x, marginTop, pillWidth, pillHeight, 9, 9, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...LANDSCAPE_COLORS.white);
  doc.text("RSVP", x + pillWidth / 2, marginTop + 12.4, { align: "center" });

  const rightX = x + contentWidth;
  doc.setTextColor(...LANDSCAPE_COLORS.headingMuted);
  doc.setFontSize(8.5);
  doc.text(RSVP_RESPONSES_EXPORT_META_LABEL, rightX, marginTop + 8, { align: "right" });
  doc.setTextColor(...LANDSCAPE_COLORS.muted);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.2);
  doc.text(RSVP_RESPONSES_EXPORT_META_LINK, rightX, marginTop + 21, { align: "right" });

  doc.setTextColor(...LANDSCAPE_COLORS.headingMuted);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.6);
  doc.text("RSVP RESPONSES", x, marginTop + 34);

  doc.setTextColor(...LANDSCAPE_COLORS.foreground);
  doc.setFontSize(24);
  doc.text(RSVP_RESPONSES_EXPORT_TITLE, x, marginTop + 58);

  doc.setTextColor(...LANDSCAPE_COLORS.muted);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(RSVP_RESPONSES_EXPORT_SUBTITLE, x, marginTop + 76);
}

function drawStatCard(
  doc: jsPDF,
  {
    height,
    label,
    value,
    width,
    x,
    y,
  }: {
    height: number;
    label: string;
    value: number;
    width: number;
    x: number;
    y: number;
  },
) {
  doc.setFillColor(...LANDSCAPE_COLORS.surface);
  doc.setDrawColor(...LANDSCAPE_COLORS.border);
  doc.setLineWidth(0.8);
  doc.roundedRect(x, y, width, height, 10, 10, "FD");

  doc.setTextColor(...LANDSCAPE_COLORS.foreground);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(String(value), x + 12, y + 22);

  doc.setTextColor(...LANDSCAPE_COLORS.muted);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(label, x + 12, y + 37);
}

function buildLandscapeColumns(includes: ExportIncludeState): LandscapeColumn[] {
  const columns: LandscapeColumn[] = [
    {
      header: "Guest",
      key: "guest",
      width: 84,
      render: (row) => row.guestName,
    },
  ];

  if (includes.contact_details) {
    columns.push({
      header: "Contact",
      key: "contact",
      width: 126,
      render: (row) => `${row.email}\n${row.phone}`,
    });
  }

  columns.push(
    {
      header: "Status",
      key: "status",
      width: 59,
      render: (row) => getResponseStatusLabel(row.status),
    },
    {
      header: "Party",
      key: "party",
      width: 34,
      render: (row) => String(row.partySize),
    },
  );

  if (includes.companions) {
    columns.push({
      header: "Companions",
      key: "companions",
      width: 92,
      render: (row) => (row.companions.length ? row.companions.join(", ") : "-"),
    });
  }

  if (includes.dietary_notes) {
    columns.push({
      header: "Dietary",
      key: "dietary",
      width: 106,
      render: (row) => row.dietaryNotes?.trim() || "-",
    });
  }

  if (includes.messages) {
    columns.push({
      header: "Message",
      key: "message",
      width: 146,
      render: (row) => row.message?.trim() || "-",
    });
  }

  columns.push({
    header: "Submitted",
    key: "submitted",
    width: 78,
    render: (row) => formatResponseSubmittedTable(row.submittedAt),
  });

  return columns;
}

function buildExportStats(rows: RsvpResponseRecord[]) {
  return {
    totalResponses: rows.length,
    attendingCount: rows.filter((row) => row.status === "attending").length,
    notAttendingCount: rows.filter((row) => row.status === "not_attending").length,
    totalPartySize: rows.reduce((sum, row) => sum + row.partySize, 0),
  };
}
