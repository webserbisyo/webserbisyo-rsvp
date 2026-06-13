"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { isDashboardSpaPath } from "./dashboard-routes";

export const DASHBOARD_SPA_NAVIGATE_EVENT = "ws:dashboard-spa:navigate";
export const DASHBOARD_SPA_PATH_EVENT = "ws:dashboard-spa:path";

export type DashboardSpaNavigateDetail = {
  href: string;
  replace?: boolean;
};

export type DashboardSpaPathDetail = {
  pathname: string;
};

export function requestDashboardSpaNavigation(href: string, replace = false) {
  if (typeof window === "undefined") {
    return false;
  }

  const url = new URL(href, window.location.href);

  if (url.origin !== window.location.origin || !isDashboardSpaPath(url.pathname)) {
    return false;
  }

  const event = new CustomEvent<DashboardSpaNavigateDetail>(DASHBOARD_SPA_NAVIGATE_EVENT, {
    cancelable: true,
    detail: {
      href: `${url.pathname}${url.search}${url.hash}`,
      replace,
    },
  });

  window.dispatchEvent(event);

  return event.defaultPrevented;
}

export function notifyDashboardSpaPath(pathname: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<DashboardSpaPathDetail>(DASHBOARD_SPA_PATH_EVENT, {
      detail: { pathname },
    }),
  );
}

export function useDashboardSpaPathname() {
  const nextPathname = usePathname();
  const [pathname, setPathname] = useState<string | null>(null);

  useEffect(() => {
    function handlePathEvent(event: Event) {
      const detail =
        event instanceof CustomEvent
          ? (event.detail as DashboardSpaPathDetail | undefined)
          : undefined;

      if (detail?.pathname) {
        setPathname(detail.pathname);
      }
    }

    function handlePopState() {
      setPathname(window.location.pathname);
    }

    window.addEventListener(DASHBOARD_SPA_PATH_EVENT, handlePathEvent);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener(DASHBOARD_SPA_PATH_EVENT, handlePathEvent);
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  return pathname ?? nextPathname;
}
