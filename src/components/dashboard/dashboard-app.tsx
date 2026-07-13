"use client";

import { startTransition, useCallback, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { DashboardViewRouter } from "@/components/dashboard/dashboard-view-router";
import { preloadDashboardView, prefetchDashboardView } from "@/lib/dashboard/dashboard-prefetch";
import {
  getDashboardHrefForView,
  getDashboardViewForPathname,
  type DashboardView,
} from "@/lib/dashboard/dashboard-routes";
import {
  DASHBOARD_SPA_NAVIGATE_EVENT,
  notifyDashboardSpaPath,
  type DashboardSpaNavigateDetail,
} from "@/lib/dashboard/dashboard-spa-navigation";
import { canNavigateAwayFromEventWebsite } from "@/lib/event-website/draft-save-coordination";

type DashboardAppProps = {
  initialView: DashboardView;
};

export function DashboardApp({ initialView }: DashboardAppProps) {
  const queryClient = useQueryClient();
  const [view, setView] = useState<DashboardView>(initialView);
  const [href, setHref] = useState(() => getInitialHref(initialView));
  const searchParams = useMemo(() => getSearchParamsFromHref(href), [href]);

  const applyNavigation = useCallback(
    (nextHref: string, replace = false) => {
      if (typeof window === "undefined") {
        return;
      }

      const url = new URL(nextHref, window.location.href);
      const nextView = getDashboardViewForPathname(url.pathname);

      if (!nextView || url.origin !== window.location.origin) {
        return;
      }

      const normalizedHref = `${url.pathname}${url.search}${url.hash}`;
      const currentHref = `${window.location.pathname}${window.location.search}${window.location.hash}`;

      startTransition(() => {
        setView(nextView);
        setHref(normalizedHref);
      });

      if (normalizedHref !== currentHref) {
        if (replace) {
          window.history.replaceState(null, "", normalizedHref);
        } else {
          window.history.pushState(null, "", normalizedHref);
        }
      }

      notifyDashboardSpaPath(url.pathname);
      void preloadDashboardView(nextView);
      void prefetchDashboardView(queryClient, nextView);
    },
    [queryClient],
  );

  const requestNavigation = useCallback(
    async (nextHref: string, replace = false) => {
      if (!(await canNavigateAwayFromEventWebsite(nextHref))) {
        if (typeof window !== "undefined") {
          window.history.replaceState(null, "", href);
        }
        return;
      }

      applyNavigation(nextHref, replace);
    },
    [applyNavigation, href],
  );

  useEffect(() => {
    const initialPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    applyNavigation(initialPath, true);
  }, [applyNavigation]);

  useEffect(() => {
    function handleNavigate(event: Event) {
      const detail =
        event instanceof CustomEvent
          ? (event.detail as DashboardSpaNavigateDetail | undefined)
          : undefined;

      if (detail?.href) {
        event.preventDefault();
        void requestNavigation(detail.href, detail.replace);
      }
    }

    function handlePopState() {
      void requestNavigation(
        `${window.location.pathname}${window.location.search}${window.location.hash}`,
        true,
      );
    }

    window.addEventListener(DASHBOARD_SPA_NAVIGATE_EVENT, handleNavigate);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener(DASHBOARD_SPA_NAVIGATE_EVENT, handleNavigate);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [requestNavigation]);

  return (
    <div onClickCapture={(event) => handleDashboardAnchorClick(event, requestNavigation)}>
      <DashboardViewRouter searchParams={searchParams} view={view} />
    </div>
  );
}

function getInitialHref(initialView: DashboardView) {
  if (typeof window !== "undefined") {
    return `${window.location.pathname}${window.location.search}${window.location.hash}`;
  }

  return getDashboardHrefForView(initialView);
}

function getSearchParamsFromHref(href: string) {
  const query = href.split("?")[1]?.split("#")[0] ?? "";
  return new URLSearchParams(query);
}

function handleDashboardAnchorClick(
  event: React.MouseEvent<HTMLDivElement>,
  requestNavigation: (href: string, replace?: boolean) => Promise<void>,
) {
  if (event.defaultPrevented || event.button !== 0 || hasModifierKey(event)) {
    return;
  }

  const target = event.target;

  if (!(target instanceof Element)) {
    return;
  }

  const anchor = target.closest("a[href]");

  if (!(anchor instanceof HTMLAnchorElement)) {
    return;
  }

  if (anchor.target && anchor.target !== "_self") {
    return;
  }

  if (anchor.hasAttribute("download")) {
    return;
  }

  const url = new URL(anchor.href, window.location.href);

  if (url.origin !== window.location.origin || !getDashboardViewForPathname(url.pathname)) {
    return;
  }

  event.preventDefault();
  void requestNavigation(`${url.pathname}${url.search}${url.hash}`);
}

function hasModifierKey(event: React.MouseEvent) {
  return event.metaKey || event.altKey || event.ctrlKey || event.shiftKey;
}
