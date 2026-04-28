import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  CreditCard,
  FileText,
  Home,
  ListChecks,
  MonitorOff,
  ScrollText,
  Settings,
  Users,
} from "lucide-react";

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

const paymentsNavItem: AdminNavItem = {
  href: "/admin/payments",
  icon: CreditCard,
  match: ["/admin/payments", "/admin/sales"],
  title: "Payments",
};

const eventsNavItem: AdminNavItem = {
  href: "/admin/events",
  icon: CalendarDays,
  match: ["/admin/events"],
  title: "Events",
};

const logsNavItem: AdminNavItem = {
  href: "/admin/logs",
  icon: ScrollText,
  match: ["/admin/logs"],
  title: "Logs",
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
  paymentsNavItem,
  eventsNavItem,
  logsNavItem,
  settingsNavItem,
  metaPixelsNavItem,
];

export const mobilePrimaryNavItems: AdminNavItem[] = [
  homeNavItem,
  applicationsNavItem,
  paymentsNavItem,
  {
    href: "/admin/more",
    icon: FileText,
    match: ["/admin/more", "/admin/clients", "/admin/events", "/admin/logs", "/admin/settings"],
    title: "More",
  },
];

export const adminMoreNavItems: AdminNavItem[] = [
  clientsNavItem,
  eventsNavItem,
  logsNavItem,
  settingsNavItem,
  metaPixelsNavItem,
  {
    href: "/admin/offline",
    icon: MonitorOff,
    match: ["/admin/offline"],
    title: "Offline",
  },
];

const pageTitles: Array<[string, string]> = [
  ["/admin/applications/", "Application detail"],
  ["/admin/applications", "Applications"],
  ["/admin/clients", "Clients"],
  ["/admin/payments", "Payments"],
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
