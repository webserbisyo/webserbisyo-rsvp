import type {
  ClientEventLifecycle,
  ClientEventSetupStatus,
  ClientHostingLifecycle,
  ClientListStatus,
} from "@/server/queries/admin-clients";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const badgeBaseClass = "border font-medium shadow-none";

const planBadgeClasses: Record<string, string> = {
  max: "border-purple-200 bg-purple-50 text-purple-700",
  pro: "border-blue-200 bg-blue-50 text-blue-700",
};

const paymentBadgeClasses: Record<string, string> = {
  cancelled: "border-slate-200 bg-slate-100 text-slate-700",
  paid: "border-emerald-200 bg-emerald-50 text-emerald-700",
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  refunded: "border-purple-200 bg-purple-50 text-purple-700",
};

const storedStatusBadgeClasses: Record<string, string> = {
  active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  archived: "border-slate-200 bg-slate-100 text-slate-700",
  cancelled: "border-slate-200 bg-slate-100 text-slate-700",
  expired: "border-rose-200 bg-rose-50 text-rose-700",
  paused: "border-amber-200 bg-amber-50 text-amber-700",
  unknown: "border-border bg-muted text-muted-foreground",
};

const lifecycleStatusBadgeClasses: Record<ClientListStatus, string> = {
  active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  archived: "border-slate-200 bg-slate-100 text-slate-700",
  cancelled: "border-slate-200 bg-slate-100 text-slate-700",
  event_soon: "border-amber-200 bg-amber-50 text-amber-700",
  event_passed: "border-purple-200 bg-purple-50 text-purple-700",
  unknown: "border-border bg-muted text-muted-foreground",
};

const eventLifecycleBadgeClasses: Record<ClientEventLifecycle, string> = {
  event_soon: "border-amber-200 bg-amber-50 text-amber-700",
  event_passed: "border-purple-200 bg-purple-50 text-purple-700",
  unknown: "border-border bg-muted text-muted-foreground",
  upcoming: "border-sky-200 bg-sky-50 text-sky-700",
};

const hostingLifecycleBadgeClasses: Record<ClientHostingLifecycle, string> = {
  active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  expired: "border-rose-200 bg-rose-50 text-rose-700",
  unknown: "border-border bg-muted text-muted-foreground",
};

const setupStatusBadgeClasses: Record<ClientEventSetupStatus, string> = {
  not_configured: "border-border bg-muted text-muted-foreground",
  published: "border-emerald-200 bg-emerald-50 text-emerald-700",
  setup_pending: "border-amber-200 bg-amber-50 text-amber-700",
};

function getFallbackBadgeClass() {
  return "border-border bg-muted text-muted-foreground";
}

function getPaymentStatusKey(status: string | null) {
  return status?.toLowerCase() ?? "pending";
}

function getStoredStatusKey(status: string | null) {
  return status?.toLowerCase() ?? "unknown";
}

export function ClientPlanBadge({
  className,
  label,
  plan,
}: {
  className?: string;
  label: string;
  plan: string | null;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        badgeBaseClass,
        planBadgeClasses[plan ?? ""] ?? getFallbackBadgeClass(),
        className,
      )}
    >
      {label}
    </Badge>
  );
}

export function ClientPaymentStatusBadge({
  className,
  label,
  status,
}: {
  className?: string;
  label: string;
  status: string | null;
}) {
  const key = getPaymentStatusKey(status);

  return (
    <Badge
      variant="outline"
      className={cn(badgeBaseClass, paymentBadgeClasses[key] ?? getFallbackBadgeClass(), className)}
    >
      {label}
    </Badge>
  );
}

export function ClientStoredStatusBadge({
  className,
  label,
  status,
}: {
  className?: string;
  label: string;
  status: string | null;
}) {
  const key = getStoredStatusKey(status);

  return (
    <Badge
      variant="outline"
      className={cn(
        badgeBaseClass,
        storedStatusBadgeClasses[key] ?? getFallbackBadgeClass(),
        className,
      )}
    >
      {label}
    </Badge>
  );
}

export function ClientLifecycleStatusBadge({
  className,
  label,
  status,
}: {
  className?: string;
  label: string;
  status: ClientListStatus;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        badgeBaseClass,
        lifecycleStatusBadgeClasses[status] ?? getFallbackBadgeClass(),
        className,
      )}
    >
      {label}
    </Badge>
  );
}

export function ClientEventLifecycleBadge({
  className,
  label,
  lifecycle,
}: {
  className?: string;
  label: string;
  lifecycle: ClientEventLifecycle;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        badgeBaseClass,
        eventLifecycleBadgeClasses[lifecycle] ?? getFallbackBadgeClass(),
        className,
      )}
    >
      {label}
    </Badge>
  );
}

export function ClientHostingLifecycleBadge({
  className,
  label,
  lifecycle,
}: {
  className?: string;
  label: string;
  lifecycle: ClientHostingLifecycle;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        badgeBaseClass,
        hostingLifecycleBadgeClasses[lifecycle] ?? getFallbackBadgeClass(),
        className,
      )}
    >
      {label}
    </Badge>
  );
}

export function ClientEventSetupStatusBadge({
  className,
  label,
  status,
}: {
  className?: string;
  label: string;
  status: ClientEventSetupStatus;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        badgeBaseClass,
        setupStatusBadgeClasses[status] ?? getFallbackBadgeClass(),
        className,
      )}
    >
      {label}
    </Badge>
  );
}
