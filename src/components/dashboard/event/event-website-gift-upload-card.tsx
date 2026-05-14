"use client";

import Image from "next/image";
import { useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { QrCode } from "lucide-react";

type EventWebsiteGiftUploadCardProps = {
  file: File | null;
  fileInputId: string;
  onFileChange: (file: File | null) => void;
};

export function EventWebsiteGiftUploadCard({
  file,
  fileInputId,
  onFileChange,
}: EventWebsiteGiftUploadCardProps) {
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <div className="event-editor-upload-card">
      <label htmlFor={fileInputId} className="event-editor-upload-surface">
        {previewUrl ? (
          <Image
            src={previewUrl}
            alt="Gift option upload preview"
            fill
            unoptimized
            className="event-editor-upload-preview"
          />
        ) : (
          <div className="event-editor-upload-empty-state">
            <span className="event-editor-upload-icon" aria-hidden="true">
              <QrCode className="size-5" />
            </span>
            <div className="event-editor-upload-copy">
              <strong>Upload QR code or gift image</strong>
              <span>PNG, JPG, or WEBP · max 2 MB</span>
            </div>
          </div>
        )}
      </label>

      <input
        id={fileInputId}
        className="sr-only"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={(event) => onFileChange(event.currentTarget.files?.[0] ?? null)}
      />

      <div className="event-editor-upload-footer">
        <span className="event-editor-upload-file-name">
          {file ? file.name : "No file selected yet."}
        </span>
        {file ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="event-editor-upload-clear-button"
            onClick={() => onFileChange(null)}
          >
            Remove image
          </Button>
        ) : null}
      </div>
    </div>
  );
}
