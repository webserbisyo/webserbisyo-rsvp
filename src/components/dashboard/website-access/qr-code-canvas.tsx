"use client";

import { QRCodeCanvas } from "qrcode.react";

type QrCodeCanvasProps = {
  id: string;
  value: string;
};

export function QrCodeCanvas({ id, value }: QrCodeCanvasProps) {
  return (
    <QRCodeCanvas
      id={id}
      value={value}
      size={148}
      includeMargin
      bgColor="#ffffff"
      fgColor="#2b2521"
      level="M"
    />
  );
}
