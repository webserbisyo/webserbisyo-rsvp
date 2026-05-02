import {
  Activity,
  CalendarHeart,
  CreditCard,
  FileText,
  Globe,
  LayoutDashboard,
  Settings2,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type DashboardNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  description: string;
};

export const dashboardNavItems: DashboardNavItem[] = [
  {
    href: "/dashboard",
    label: "Home",
    icon: LayoutDashboard,
    description: "Overview, setup checklist, quick stats",
  },
  {
    href: "/dashboard/event",
    label: "Event Details",
    icon: CalendarHeart,
    description: "Configure your event title, date, venue, and host names",
  },
  {
    href: "/dashboard/website-content",
    label: "Website Content",
    icon: FileText,
    description: "Edit page content, guestbook settings, and gift wallets",
  },
  {
    href: "/dashboard/responses",
    label: "RSVP Responses",
    icon: Users,
    description: "Monitor and manage guest RSVP responses",
  },
  {
    href: "/dashboard/website-access",
    label: "Website Access",
    icon: Globe,
    description: "Manage link visibility, slug, QR codes, and sharing",
  },
  {
    href: "/dashboard/billing",
    label: "Billing",
    icon: CreditCard,
    description: "View your package, payment status, and renewal info",
  },
  {
    href: "/dashboard/activity",
    label: "Activity",
    icon: Activity,
    description: "Audit log and recent account activity",
  },
  {
    href: "/dashboard/settings",
    label: "Settings",
    icon: Settings2,
    description: "Account settings, notifications, and PWA options",
  },
];

export function isDashboardNavItemActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname.startsWith(href);
}
