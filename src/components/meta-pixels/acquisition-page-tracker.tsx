"use client";
import { useEffect } from "react";
import { trackAcquisitionPageOccurrence } from "@/lib/meta/acquisition-tracker";
export function AcquisitionPageTracker({ sourcePath }: { sourcePath: "/" | "/apply" }) {
  useEffect(() => { trackAcquisitionPageOccurrence(sourcePath, true); }, [sourcePath]);
  return null;
}
