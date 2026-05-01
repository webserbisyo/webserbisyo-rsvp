import type { LucideIcon } from "lucide-react";
import {
  Activity,
  CalendarDays,
  CreditCard,
  Globe,
  House,
  LayoutTemplate,
  Settings,
  Users,
} from "lucide-react";

export type ClientNavKey =
  | "home"
  | "event-details"
  | "website-content"
  | "rsvp-responses"
  | "payment-package"
  | "website-access"
  | "activity"
  | "settings";

export type ClientNavItem = {
  badgeLabel?: string;
  breadcrumb: string;
  description: string;
  href: string;
  icon: LucideIcon;
  key: ClientNavKey;
  label: string;
  match: string[];
  mobileLabel: string;
  mobilePlacement: "more" | "primary";
};

export const clientNavItems: ClientNavItem[] = [
  {
    breadcrumb: "Home",
    description: "Client dashboard home foundation.",
    href: "/dashboard",
    icon: House,
    key: "home",
    label: "Home",
    match: ["/dashboard"],
    mobileLabel: "Home",
    mobilePlacement: "primary",
  },
  {
    breadcrumb: "Event Details",
    description: "Event details management will be configured here.",
    href: "/dashboard/event-details",
    icon: CalendarDays,
    key: "event-details",
    label: "Event Details",
    match: ["/dashboard/event-details", "/dashboard/event"],
    mobileLabel: "Event",
    mobilePlacement: "primary",
  },
  {
    breadcrumb: "Website Content",
    description: "Website content preview and editing will be configured here.",
    href: "/dashboard/website-content",
    icon: LayoutTemplate,
    key: "website-content",
    label: "Website Content",
    match: ["/dashboard/website-content", "/dashboard/page-content"],
    mobileLabel: "Website",
    mobilePlacement: "primary",
  },
  {
    badgeLabel: "Soon",
    breadcrumb: "RSVP Responses",
    description: "Coming soon. Guest responses require future guest/response schema.",
    href: "/dashboard/rsvp-responses",
    icon: Users,
    key: "rsvp-responses",
    label: "RSVP Responses",
    match: ["/dashboard/rsvp-responses", "/dashboard/responses"],
    mobileLabel: "RSVP",
    mobilePlacement: "primary",
  },
  {
    breadcrumb: "Payment / Package",
    description: "Payment and package details will be configured here.",
    href: "/dashboard/payment-package",
    icon: CreditCard,
    key: "payment-package",
    label: "Payment / Package",
    match: ["/dashboard/payment-package", "/dashboard/gift-wallets"],
    mobileLabel: "Payment",
    mobilePlacement: "more",
  },
  {
    breadcrumb: "Website Access",
    description:
      "RSVP website link, visibility, and QR tools will be configured after schema confirmation.",
    href: "/dashboard/website-access",
    icon: Globe,
    key: "website-access",
    label: "Website Access",
    match: ["/dashboard/website-access"],
    mobileLabel: "Access",
    mobilePlacement: "more",
  },
  {
    breadcrumb: "Activity",
    description: "Activity and email logs will be shown here.",
    href: "/dashboard/activity",
    icon: Activity,
    key: "activity",
    label: "Activity",
    match: ["/dashboard/activity", "/dashboard/guestbook"],
    mobileLabel: "Activity",
    mobilePlacement: "more",
  },
  {
    breadcrumb: "Settings",
    description: "Client dashboard settings will be configured here.",
    href: "/dashboard/settings",
    icon: Settings,
    key: "settings",
    label: "Settings",
    match: ["/dashboard/settings"],
    mobileLabel: "Settings",
    mobilePlacement: "more",
  },
];

export const clientDesktopNavItems = clientNavItems;
export const clientMobilePrimaryNavItems = clientNavItems.filter(
  (item) => item.mobilePlacement === "primary",
);
export const clientMobileMoreNavItems = clientNavItems.filter(
  (item) => item.mobilePlacement === "more",
);

export function isClientNavItemActive(item: ClientNavItem, pathname: string) {
  if (item.href === "/dashboard") {
    return pathname === "/dashboard";
  }

  return item.match.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export function getClientPageMeta(pathname: string) {
  const matchedItem = clientNavItems.find((item) => isClientNavItemActive(item, pathname));

  if (matchedItem) {
    return {
      breadcrumb: matchedItem.breadcrumb,
      description: matchedItem.description,
      title: matchedItem.label,
    };
  }

  return {
    breadcrumb: "Dashboard",
    description: "Client dashboard foundation.",
    title: "Dashboard",
  };
}
