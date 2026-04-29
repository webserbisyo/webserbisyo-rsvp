import type { LucideIcon } from "lucide-react";
import { FileText, Home, ListChecks, Settings, Users } from "lucide-react";

export type AdminNavItem = {
  href: string;
  icon: LucideIcon;
  match?: string[];
  title: string;
};

const homeNavItem: AdminNavItem = {
  href: "/admin",
  icon: Home,
  title: "Home",
};

const applicationsNavItem: AdminNavItem = {
  href: "/admin/applications",
  icon: ListChecks,
  match: ["/admin/applications"],
  title: "Applications",
};

const clientsNavItem: AdminNavItem = {
  href: "/admin/clients",
  icon: Users,
  match: ["/admin/clients"],
  title: "Clients",
};

const settingsNavItem: AdminNavItem = {
  href: "/admin/settings",
  icon: Settings,
  match: ["/admin/settings", "/admin/payment-options"],
  title: "Settings",
};

const metaPixelsNavItem: AdminNavItem = {
  href: "/admin/meta-pixels",
  icon: FileText,
  match: ["/admin/meta-pixels"],
  title: "Meta Pixels",
};

export const desktopAdminNavItems: AdminNavItem[] = [
  homeNavItem,
  applicationsNavItem,
  clientsNavItem,
  metaPixelsNavItem,
  settingsNavItem,
];

export const mobilePrimaryNavItems: AdminNavItem[] = [
  homeNavItem,
  applicationsNavItem,
  clientsNavItem,
  metaPixelsNavItem,
  settingsNavItem,
];

export const adminMoreNavItems: AdminNavItem[] = [];

const pageTitles: Array<[string, string]> = [
  ["/admin/applications/", "Application detail"],
  ["/admin/applications", "Applications"],
  ["/admin/clients", "Clients"],
  ["/admin/payments", "Sales"],
  ["/admin/sales", "Sales"],
  ["/admin/events", "Events"],
  ["/admin/logs", "Logs"],
  ["/admin/settings", "Settings"],
  ["/admin/payment-options", "Manual payment options"],
  ["/admin/meta-pixels", "Meta Pixels"],
  ["/admin/more", "More"],
  ["/admin/offline", "Offline"],
];

export function getAdminPageTitle(pathname: string) {
  if (pathname === "/admin") {
    return "Admin home";
  }

  const match = pageTitles.find(([path]) => pathname.startsWith(path));
  return match?.[1] ?? "RSVP Admin";
}

export function isAdminNavItemActive(item: AdminNavItem, pathname: string) {
  if (item.href === "/admin") {
    return pathname === "/admin";
  }

  return (item.match ?? [item.href]).some((path) => pathname.startsWith(path));
}
