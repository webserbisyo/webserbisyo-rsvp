"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ImageUp } from "lucide-react";
import { Input } from "@/components/ui/input";

type QrUploadFieldProps = {
  error?: string;
  existingImageUrl: string | null;
  id: string;
  label: string;
  onFileChange: (file: File | undefined) => void;
};

export function QrUploadField({
  error,
  existingImageUrl,
  id,
  label,
  onFileChange,
}: QrUploadFieldProps) {
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const previewUrl = localPreviewUrl ?? existingImageUrl;

  useEffect(() => {
    return () => {
      if (localPreviewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(localPreviewUrl);
      }
    };
  }, [localPreviewUrl]);

  return (
    <div className="space-y-3">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <div className="border-border/80 bg-muted/30 overflow-hidden rounded-2xl border border-dashed">
        {previewUrl ? (
          <Image
            src={previewUrl}
            alt={`${label} preview`}
            width={720}
            height={720}
            className="h-auto w-full object-cover"
          />
        ) : (
          <div className="text-muted-foreground flex min-h-48 flex-col items-center justify-center gap-2 px-4 py-8 text-center text-sm">
            <ImageUp className="size-5" />
            <p>Upload a PNG, JPG, or WebP QR image.</p>
          </div>
        )}
      </div>
      <Input
        id={id}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        onChange={(event) => {
          const nextFile = event.currentTarget.files?.[0];

          if (localPreviewUrl?.startsWith("blob:")) {
            URL.revokeObjectURL(localPreviewUrl);
          }

          setLocalPreviewUrl(nextFile ? URL.createObjectURL(nextFile) : null);
          onFileChange(nextFile);
        }}
      />
      <p className="text-muted-foreground text-xs leading-5">
        Public QR previews are allowed, but upload and replacement remain admin-only.
      </p>
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
    </div>
  );
}
