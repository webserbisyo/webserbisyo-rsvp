"use client";

import { Copy, Download, Globe2 } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type QrCodesCardProps = {
  disabled?: boolean;
  onCopyRsvpLink: () => void;
  onCopyWebsiteLink: () => void;
  rsvpUrl: string;
  slugPublished: string;
  websiteUrl: string;
};

export function QrCodesCard({
  disabled = false,
  onCopyRsvpLink,
  onCopyWebsiteLink,
  rsvpUrl,
  slugPublished,
  websiteUrl,
}: QrCodesCardProps) {
  function downloadQr(canvasId: string, filename: string) {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;

    if (!canvas) {
      toast.error("Could not prepare the QR download.");
      return;
    }

    try {
      const url = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      toast.success("QR download started.");
    } catch {
      toast.error("Could not download the QR code.");
    }
  }

  return (
    <section className="rounded-[1.75rem] border border-[#eadbd0] bg-white/90 shadow-sm shadow-[#8a4b2e]/5">
      <div className="p-5 sm:p-6">
        {/* Header */}
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold tracking-tight text-[#2D1F1A]">QR Codes</h2>
          <p className="text-sm font-medium text-[#A38376]">Print or share with guests</p>
        </div>

        <div className="grid gap-5">
          <QrTile
            canvasId="website-access-website-qr"
            disabled={disabled}
            icon={<Globe2 className="h-5 w-5" aria-hidden="true" />}
            onCopy={onCopyWebsiteLink}
            onDownload={() => downloadQr("website-access-website-qr", `${slugPublished}-website-qr.png`)}
            subtitle="Opens the full event website."
            title="Website QR"
            url={websiteUrl}
          />
          <QrTile
            canvasId="website-access-rsvp-qr"
            disabled={disabled}
            icon={<Globe2 className="h-5 w-5" aria-hidden="true" />}
            onCopy={onCopyRsvpLink}
            onDownload={() => downloadQr("website-access-rsvp-qr", `${slugPublished}-rsvp-qr.png`)}
            subtitle="Opens the same website directly at the RSVP section."
            title="RSVP QR"
            url={rsvpUrl}
          />
        </div>
      </div>
    </section>
  );
}

function QrTile({
  canvasId,
  disabled,
  icon,
  onCopy,
  onDownload,
  subtitle,
  title,
  url,
}: {
  canvasId: string;
  disabled: boolean;
  icon: React.ReactNode;
  onCopy: () => void;
  onDownload: () => void;
  subtitle: string;
  title: string;
  url: string;
}) {
  return (
    <div className="rounded-2xl border border-[#eacdbf] bg-[#FEFAF7] p-5">
      {/* Icon tile + title/subtitle row */}
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[0.875rem] bg-[#FDECE4] text-[#c96f4c]">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#2D1F1A]">{title}</p>
          <p className="text-xs text-[#A38376]">{subtitle}</p>
        </div>
      </div>

      {/* QR code — centered, modest size */}
      <div className="mx-auto mt-5 flex w-fit items-center justify-center rounded-2xl border border-[#f0e7de] bg-white p-4 shadow-sm shadow-[#8a4b2e]/5">
        <QRCodeCanvas
          id={canvasId}
          value={url}
          size={148}
          includeMargin
          bgColor="#ffffff"
          fgColor="#2b2521"
          level="M"
        />
      </div>

      {/* Buttons directly below QR — no URL text */}
      <div className="mt-5 grid grid-cols-2 gap-3">
        <Button
          type="button"
          disabled={disabled}
          onClick={onDownload}
          aria-label={`Download ${title}`}
          className="h-10 rounded-xl bg-[#c96f4c] px-4 text-sm font-semibold text-white shadow-sm shadow-[#c96f4c]/20 hover:bg-[#b96143]"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          Download
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          onClick={onCopy}
          aria-label={`Copy ${title} link`}
          className="h-10 rounded-xl border-[#eacdbf] bg-white px-4 text-sm font-semibold text-[#A7583C] hover:bg-[#fff8f3]"
        >
          <Copy className="h-4 w-4" aria-hidden="true" />
          Copy link
        </Button>
      </div>
    </div>
  );
}
