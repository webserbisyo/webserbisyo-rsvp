"use client";

import { useEffect } from "react";
import { trackInitiateCheckoutOccurrence } from "@/lib/meta/acquisition-tracker";

export function InitiateCheckoutTracker({ plan }: { plan: "pro" | "max" }) {
  useEffect(() => {
    trackInitiateCheckoutOccurrence({ plan, sourcePath: "/apply/start" });
  }, [plan]);

  return null;
}
