"use client";

import { useEffect } from "react";
import { trackAcquisitionPageOccurrence } from "@/lib/meta/acquisition-tracker";

type AcquisitionPagePath = "/" | "/apply" | "/apply/start" | "/apply/success";

export function AcquisitionPageTracker({ sourcePath }: { sourcePath: AcquisitionPagePath }) {
  useEffect(() => {
    trackAcquisitionPageOccurrence(sourcePath, sourcePath === "/" || sourcePath === "/apply");
  }, [sourcePath]);

  return null;
}
