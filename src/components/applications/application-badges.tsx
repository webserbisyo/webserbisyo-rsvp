import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const badgeBaseClass = "border font-medium shadow-none";

const planBadgeClasses: Record<string, string> = {
  max: "border-purple-200 bg-purple-50 text-purple-700",
  pro: "border-blue-200 bg-blue-50 text-blue-700",
};

const paymentPreferenceBadgeClasses: Record<string, string> = {
  gcash: "border-sky-200 bg-sky-50 text-sky-700",
  maya: "border-emerald-200 bg-emerald-50 text-emerald-700",
  not_selected: "border-border bg-muted text-muted-foreground",
};

const applicationStatusBadgeClasses: Record<string, string> = {
  approved: "border-emerald-200 bg-emerald-50 text-emerald-700",
  cancelled: "border-slate-200 bg-slate-100 text-slate-700",
  rejected: "border-rose-200 bg-rose-50 text-rose-700",
  reviewing: "border-amber-200 bg-amber-50 text-amber-700",
  submitted: "border-amber-200 bg-amber-50 text-amber-700",
};

const paymentStatusBadgeClasses: Record<string, string> = {
  cancelled: "border-slate-200 bg-slate-100 text-slate-700",
  confirmed: "border-emerald-200 bg-emerald-50 text-emerald-700",
  failed: "border-rose-200 bg-rose-50 text-rose-700",
  paid: "border-emerald-200 bg-emerald-50 text-emerald-700",
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  refunded: "border-purple-200 bg-purple-50 text-purple-700",
};

function getFallbackBadgeClass() {
  return "border-border bg-muted text-muted-foreground";
}

function getPaymentPreferenceKey(value: string | null) {
  return value ?? "not_selected";
}

function getPaymentStatusKey(value: string | null) {
  return value?.toLowerCase() ?? "";
}

export function ApplicationPlanBadge({
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

export function PaymentPreferenceBadge({
  className,
  label,
  paymentPreference,
}: {
  className?: string;
  label: string;
  paymentPreference: string | null;
}) {
  const key = getPaymentPreferenceKey(paymentPreference);

  return (
    <Badge
      variant="outline"
      className={cn(
        badgeBaseClass,
        paymentPreferenceBadgeClasses[key] ?? getFallbackBadgeClass(),
        className,
      )}
    >
      {label}
    </Badge>
  );
}

export function ApplicationStatusBadge({
  className,
  label,
  status,
}: {
  className?: string;
  label: string;
  status: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        badgeBaseClass,
        applicationStatusBadgeClasses[status] ?? getFallbackBadgeClass(),
        className,
      )}
    >
      {label}
    </Badge>
  );
}

export function PaymentStatusBadge({
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
      className={cn(
        badgeBaseClass,
        paymentStatusBadgeClasses[key] ?? getFallbackBadgeClass(),
        className,
      )}
    >
      {label}
    </Badge>
  );
}
