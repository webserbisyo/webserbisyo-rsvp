"use client";

import type { AnchorHTMLAttributes, MouseEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { preloadDashboardView, prefetchDashboardView } from "@/lib/dashboard/dashboard-prefetch";
import { getDashboardViewForPathname } from "@/lib/dashboard/dashboard-routes";
import { requestDashboardSpaNavigation } from "@/lib/dashboard/dashboard-spa-navigation";

type DashboardNavLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string;
};

export function DashboardNavLink({
  href,
  onClick,
  onFocus,
  onMouseEnter,
  ...props
}: DashboardNavLinkProps) {
  const queryClient = useQueryClient();

  function prefetch() {
    const view = getViewFromHref(href);

    if (!view) {
      return;
    }

    void preloadDashboardView(view);
    void prefetchDashboardView(queryClient, view);
  }

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);

    if (event.defaultPrevented || event.button !== 0 || hasModifierKey(event)) {
      return;
    }

    if (requestDashboardSpaNavigation(href)) {
      event.preventDefault();
    }
  }

  return (
    <a
      {...props}
      href={href}
      onClick={handleClick}
      onFocus={(event) => {
        onFocus?.(event);
        prefetch();
      }}
      onMouseEnter={(event) => {
        onMouseEnter?.(event);
        prefetch();
      }}
    />
  );
}

function getViewFromHref(href: string) {
  if (typeof window === "undefined") {
    return getDashboardViewForPathname(href.split("?")[0] ?? href);
  }

  const url = new URL(href, window.location.href);
  return getDashboardViewForPathname(url.pathname);
}

function hasModifierKey(event: MouseEvent<HTMLAnchorElement>) {
  return event.metaKey || event.altKey || event.ctrlKey || event.shiftKey;
}
