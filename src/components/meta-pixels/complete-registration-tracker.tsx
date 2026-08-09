"use client";
import { useEffect } from "react";
import { trackCompleteRegistrationOccurrence } from "@/lib/meta/acquisition-tracker";
export function CompleteRegistrationTracker({ referenceCode }: { referenceCode: string | null }) {
  useEffect(() => { if (referenceCode) trackCompleteRegistrationOccurrence(referenceCode); }, [referenceCode]);
  return null;
}
