"use client";

import Image from "next/image";
import { useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { QrCode } from "lucide-react";
import { EVENT_WEBSITE_GIFT_MEDIA_MAX_SIZE_LABEL } from "@/lib/event-website/gift-media";
import type { EventWebsiteImageAsset } from "@/lib/event-website/types";

type EventWebsiteGiftUploadCardProps = {
  errorMessage?: string | null;
  file: File | null;
  fileInputId: string;
  image: EventWebsiteImageAsset | null;
  isUploading?: boolean;
  onFileChange: (file: File | null) => void;
};

export function EventWebsiteGiftUploadCard({
  errorMessage = null,
  file,
  fileInputId,
  image,
  isUploading = false,
  onFileChange,
}: EventWebsiteGiftUploadCardProps) {
  const persistedUrl = image?.url?.trim() || null;
  const objectPreviewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  const previewUrl = objectPreviewUrl ?? persistedUrl;

  useEffect(() => {
    return () => {
      if (objectPreviewUrl) {
        URL.revokeObjectURL(objectPreviewUrl);
      }
    };
  }, [objectPreviewUrl]);

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
              <span>PNG, JPG, or WEBP · max {EVENT_WEBSITE_GIFT_MEDIA_MAX_SIZE_LABEL}</span>
            </div>
          </div>
        )}
      </label>

      <input
        id={fileInputId}
        className="sr-only"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        disabled={isUploading}
        onChange={(event) => onFileChange(event.currentTarget.files?.[0] ?? null)}
      />

      <div className="event-editor-upload-footer">
        <span className="event-editor-upload-file-name">
          {isUploading
            ? "Uploading image..."
            : file
              ? file.name
              : (image?.path.split("/").pop() ?? "No file selected yet.")}
        </span>
        {file || image ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="event-editor-upload-clear-button"
            disabled={isUploading}
            onClick={() => onFileChange(null)}
          >
            Remove image
          </Button>
        ) : null}
      </div>

      {errorMessage ? (
        <p className="event-editor-upload-error" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
