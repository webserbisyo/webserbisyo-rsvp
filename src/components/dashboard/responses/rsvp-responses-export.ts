"use client";

import type { jsPDF } from "jspdf";
import type { CellHookData, RowInput } from "jspdf-autotable";
import {
  formatResponseSubmittedTable,
  getResponseStatusLabel,
  type RsvpResponseRecord,
  type RsvpResponsesExportFormat,
  type RsvpResponsesExportInclude,
  type RsvpResponsesExportRows,
} from "./rsvp-responses-types";

const RSVP_RESPONSES_EXPORT_META_LABEL = "Landscape table";
const DEFAULT_EXPORT_TITLE = "RSVP Responses";
const DEFAULT_EXPORT_FILENAME = "rsvp-responses";

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
  metadata: RsvpResponsesExportMetadata;
};

export type RsvpResponsesExportMetadata = {
  eventSlug?: string | null;
  eventTitle?: string | null;
};

type JsPdfConstructor = typeof import("jspdf").jsPDF;
type AutoTableFn = typeof import("jspdf-autotable").default;

type LandscapeColumn = {
  header: string;
  key:
    | "guest"
    | "contact"
    | "status"
    | "party"
    | "companions"
    | "submitted";
  width: number;
  render: (row: RsvpResponseRecord) => string;
};

type NotesColumn = {
  header: string;
  key: "guest" | "dietary" | "message";
  width: number;
  render: (row: RsvpResponseRecord) => string;
};

type StatCardIcon = "responses" | "attending" | "not_attending" | "party_size";

export function getExportRows({ allResponses, currentViewResponses, rows }: ExportRowsInput) {
  return rows === "current_view" ? currentViewResponses : allResponses;
}

export function exportRsvpResponses(options: ExportOptions) {
  const exportRows = getExportRows(options);

  if (options.format === "csv") {
    const csv = buildRsvpResponsesCsv(exportRows, options.includes);
    downloadCsv(buildRsvpResponsesExportFilename(options.metadata, "csv"), csv);
    return;
  }

  void downloadLandscapePdf(exportRows, options.includes, options.metadata);
}

export function buildRsvpResponsesExportFilename(
  metadata: RsvpResponsesExportMetadata,
  extension: "csv" | "pdf",
) {
  const baseName =
    slugifyExportFilename(metadata.eventTitle) ?? metadata.eventSlug ?? DEFAULT_EXPORT_FILENAME;

  return `${baseName}-rsvp-responses.${extension}`;
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

function slugifyExportFilename(value?: string | null) {
  const slug = value
    ?.trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || null;
}

function buildExportLinkLabel(metadata: RsvpResponsesExportMetadata) {
  return metadata.eventSlug ? `webserbisyo.app/r/${metadata.eventSlug}` : "webserbisyo.app";
}

function buildExportDateLabel() {
  const date = new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeZone: "Asia/Manila",
  }).format(new Date());

  return `Exported ${date}`;
}

async function loadPdfDependencies() {
  const [{ jsPDF }, autoTableModule] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);

  const autoTable = autoTableModule.default ?? autoTableModule.autoTable;

  return {
    autoTable: autoTable as AutoTableFn,
    jsPDF: jsPDF as JsPdfConstructor,
  };
}

async function downloadLandscapePdf(
  rows: RsvpResponseRecord[],
  includes: ExportIncludeState,
  metadata: RsvpResponsesExportMetadata,
) {
  const { autoTable, jsPDF } = await loadPdfDependencies();
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
  const statsHeight = 58;
  const tableTop = statsTop + statsHeight + 22;

  doc.setFillColor(...LANDSCAPE_COLORS.page);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  drawLandscapeHeader(doc, {
    contentWidth,
    marginTop,
    metaLabel: RSVP_RESPONSES_EXPORT_META_LABEL,
    metadata,
    x: marginX,
  });

  const stats = buildExportStats(rows);
  const statCards: Array<{ icon: StatCardIcon; label: string; value: number }> = [
    { icon: "responses", label: "Total responses", value: stats.totalResponses },
    { icon: "attending", label: "Attending", value: stats.attendingCount },
    { icon: "not_attending", label: "Not attending", value: stats.notAttendingCount },
    { icon: "party_size", label: "Total party size", value: stats.totalPartySize },
  ];

  statCards.forEach((card, index) => {
    const x = marginX + index * (statWidth + statsGap);
    drawStatCard(doc, {
      height: statsHeight,
      icon: card.icon,
      label: card.label,
      value: card.value,
      width: statWidth,
      x,
      y: statsTop,
    });
  });

  const columns = buildLandscapeColumns(includes);
  const body = rows.map((row) => columns.map((column) => column.render(row))) satisfies RowInput[];

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
          rawValue === "Attending" ? LANDSCAPE_COLORS.success : LANDSCAPE_COLORS.destructive;
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

  const notesColumns = buildNotesColumns(includes);

  if (notesColumns.length > 0) {
    doc.addPage("a4", "landscape");
    doc.setFillColor(...LANDSCAPE_COLORS.page);
    doc.rect(0, 0, pageWidth, pageHeight, "F");

    drawLandscapeHeader(doc, {
      contentWidth,
      marginTop,
      metaLabel: "Notes & messages",
      metadata,
      x: marginX,
    });

    const notesBody = rows.map((row) =>
      notesColumns.map((column) => column.render(row)),
    ) satisfies RowInput[];

    autoTable(doc, {
      startY: 118,
      margin: { left: marginX, right: marginX },
      tableWidth: contentWidth,
      head: [notesColumns.map((column) => column.header)],
      body: notesBody,
      theme: "grid",
      rowPageBreak: "avoid",
      styles: {
        font: "helvetica",
        fontSize: 8,
        textColor: LANDSCAPE_COLORS.foreground,
        cellPadding: { top: 6, right: 6, bottom: 6, left: 6 },
        lineColor: LANDSCAPE_COLORS.border,
        lineWidth: 0.45,
        overflow: "linebreak",
        valign: "top",
      },
      headStyles: {
        fillColor: LANDSCAPE_COLORS.surfaceMuted,
        textColor: LANDSCAPE_COLORS.headingMuted,
        fontStyle: "bold",
        fontSize: 7.6,
        lineColor: LANDSCAPE_COLORS.borderStrong,
        lineWidth: 0.55,
        cellPadding: { top: 6, right: 6, bottom: 6, left: 6 },
      },
      bodyStyles: {
        fillColor: LANDSCAPE_COLORS.white,
      },
      columnStyles: Object.fromEntries(
        notesColumns.map((column, index) => [index, { cellWidth: column.width }]),
      ),
    });
  }

  doc.save(buildRsvpResponsesExportFilename(metadata, "pdf"));
}

function drawLandscapeHeader(
  doc: jsPDF,
  {
    contentWidth,
    marginTop,
    metaLabel,
    metadata,
    x,
  }: {
    contentWidth: number;
    marginTop: number;
    metaLabel: string;
    metadata: RsvpResponsesExportMetadata;
    x: number;
  },
) {
  const pillWidth = 112;
  const pillHeight = 18;

  doc.setFillColor(...LANDSCAPE_COLORS.brand);
  doc.roundedRect(x, marginTop, pillWidth, pillHeight, 9, 9, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.8);
  doc.setTextColor(...LANDSCAPE_COLORS.white);
  doc.text("RSVP RESPONSES", x + pillWidth / 2, marginTop + 12.2, { align: "center" });

  const rightX = x + contentWidth;
  doc.setTextColor(...LANDSCAPE_COLORS.headingMuted);
  doc.setFontSize(8.5);
  doc.text(metaLabel, rightX, marginTop + 8, { align: "right" });
  doc.setTextColor(...LANDSCAPE_COLORS.muted);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.2);
  doc.text(buildExportLinkLabel(metadata), rightX, marginTop + 21, { align: "right" });

  doc.setTextColor(...LANDSCAPE_COLORS.foreground);
  doc.setFontSize(24);
  doc.text(metadata.eventTitle?.trim() || DEFAULT_EXPORT_TITLE, x, marginTop + 52);

  doc.setTextColor(...LANDSCAPE_COLORS.muted);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(buildExportDateLabel(), x, marginTop + 70);
}

function drawStatCard(
  doc: jsPDF,
  {
    height,
    icon,
    label,
    value,
    width,
    x,
    y,
  }: {
    height: number;
    icon: StatCardIcon;
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
  doc.setFontSize(20);
  doc.text(String(value), x + 14, y + 24);

  doc.setTextColor(...LANDSCAPE_COLORS.muted);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(label, x + 14, y + 42);

  drawStatCardIcon(doc, {
    icon,
    x: x + width - 52,
    y: y + 10,
  });
}

function buildLandscapeColumns(includes: ExportIncludeState): LandscapeColumn[] {
  const columns: LandscapeColumn[] = [
    {
      header: "Guest",
      key: "guest",
      width: includes.contact_details ? 104 : 156,
      render: (row) => row.guestName,
    },
  ];

  if (includes.contact_details) {
    columns.push({
      header: "Contact",
      key: "contact",
      width: includes.companions ? 156 : 184,
      render: (row) => [row.email, row.phone].filter(Boolean).join("\n") || "—",
    });
  }

  columns.push(
    {
      header: "Status",
      key: "status",
      width: 70,
      render: (row) => getResponseStatusLabel(row.status),
    },
    {
      header: "Party",
      key: "party",
      width: 46,
      render: (row) => String(row.partySize),
    },
  );

  if (includes.companions) {
    columns.push({
      header: "Companions",
      key: "companions",
      width: includes.contact_details ? 176 : 250,
      render: (row) => (row.companions.length ? row.companions.join(", ") : "—"),
    });
  }

  columns.push({
    header: "Submitted",
    key: "submitted",
    width: includes.contact_details ? 122 : 138,
    render: (row) => formatResponseSubmittedTable(row.submittedAt),
  });

  return columns;
}

function buildNotesColumns(includes: ExportIncludeState): NotesColumn[] {
  const columns: NotesColumn[] = [
    {
      header: "Guest",
      key: "guest",
      width: includes.dietary_notes && includes.messages ? 128 : 170,
      render: (row) => row.guestName,
    },
  ];

  if (includes.dietary_notes) {
    columns.push({
      header: "Dietary Notes",
      key: "dietary",
      width: includes.messages ? 270 : 560,
      render: (row) => row.dietaryNotes?.trim() || "—",
    });
  }

  if (includes.messages) {
    columns.push({
      header: "Message",
      key: "message",
      width: includes.dietary_notes ? 334 : 560,
      render: (row) => row.message?.trim() || "—",
    });
  }

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

function drawStatCardIcon(
  doc: jsPDF,
  {
    icon,
    x,
    y,
  }: {
    icon: StatCardIcon;
    x: number;
    y: number;
  },
) {
  doc.setDrawColor(...LANDSCAPE_COLORS.borderStrong);
  doc.setTextColor(...LANDSCAPE_COLORS.brandStrong);
  doc.setLineWidth(1.6);

  switch (icon) {
    case "responses":
      drawResponsesIcon(doc, x, y);
      return;
    case "attending":
      drawAttendingIcon(doc, x, y);
      return;
    case "not_attending":
      drawNotAttendingIcon(doc, x, y);
      return;
    case "party_size":
      drawPartySizeIcon(doc, x, y);
      return;
  }
}

function drawResponsesIcon(doc: jsPDF, x: number, y: number) {
  doc.roundedRect(x, y, 26, 34, 5, 5);
  doc.line(x + 18, y, x + 26, y + 8);
  doc.line(x + 17, y + 1, x + 17, y + 9);
  doc.line(x + 4, y + 13, x + 19, y + 13);
  doc.line(x + 4, y + 19, x + 22, y + 19);
  doc.line(x + 4, y + 25, x + 16, y + 25);
}

function drawAttendingIcon(doc: jsPDF, x: number, y: number) {
  doc.circle(x + 15, y + 18, 13);
  doc.line(x + 8, y + 18, x + 13, y + 23);
  doc.line(x + 13, y + 23, x + 23, y + 12);
}

function drawNotAttendingIcon(doc: jsPDF, x: number, y: number) {
  doc.circle(x + 15, y + 18, 13);
  doc.line(x + 9, y + 12, x + 21, y + 24);
  doc.line(x + 21, y + 12, x + 9, y + 24);
}

function drawPartySizeIcon(doc: jsPDF, x: number, y: number) {
  doc.circle(x + 10, y + 12, 5);
  doc.circle(x + 21, y + 14, 4);
  doc.line(x + 4, y + 29, x + 7, y + 21);
  doc.line(x + 7, y + 21, x + 13, y + 21);
  doc.line(x + 13, y + 21, x + 16, y + 29);
  doc.line(x + 16, y + 29, x + 4, y + 29);
  doc.line(x + 17, y + 29, x + 19, y + 23);
  doc.line(x + 19, y + 23, x + 24, y + 23);
  doc.line(x + 24, y + 23, x + 26, y + 29);
  doc.line(x + 26, y + 29, x + 17, y + 29);
}
