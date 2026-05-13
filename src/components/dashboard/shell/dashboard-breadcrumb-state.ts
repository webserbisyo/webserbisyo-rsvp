"use client";

import { useSyncExternalStore } from "react";

type BreadcrumbDetailListener = () => void;

let breadcrumbDetail: string | null = null;
const listeners = new Set<BreadcrumbDetailListener>();

function emitBreadcrumbDetailChange() {
  listeners.forEach((listener) => listener());
}

export function setDashboardBreadcrumbDetail(detail: string | null) {
  breadcrumbDetail = detail;
  emitBreadcrumbDetailChange();
}

export function useDashboardBreadcrumbDetail() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => breadcrumbDetail,
    () => null,
  );
}
