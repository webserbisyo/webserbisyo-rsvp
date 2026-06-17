import type { ComponentType, ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Mail, Shield, Star } from "lucide-react";
import type { SettingsPageData } from "@/server/queries/settings";
import { SettingsCard } from "@/components/dashboard/settings/settings-card";

type AccountAccessCardProps = {
  account: SettingsPageData["account"];
};

export function AccountAccessCard({ account }: AccountAccessCardProps) {
  return (
    <SettingsCard className="dashboard-settings-account-card">
      <SectionLabel>Account &amp; Access</SectionLabel>
      <div className="dashboard-settings-account-card__hero mt-5 flex items-center gap-5">
        <div className="dashboard-settings-account-card__hero-avatar flex h-[62px] w-[62px] shrink-0 items-center justify-center rounded-[1.2rem] bg-[color:var(--dash-brand)] text-[1.55rem] font-black text-white shadow-[0_16px_32px_rgba(201,107,72,0.24)]">
          {account.initials}
        </div>
        <div className="dashboard-settings-account-card__hero-content min-w-0 flex-1">
          <p className="dashboard-settings-account-card__identity-name truncate text-[1.35rem] font-black tracking-[-0.02em] text-[color:var(--dash-foreground)]">
            {account.name ?? "Not available"}
          </p>
          <p className="dashboard-settings-account-card__identity-email mt-1 truncate text-sm font-semibold text-[#b09887]">
            {account.email ?? "Not available"}
          </p>
        </div>
        <div className="dashboard-settings-account-card__hero-status">
          <StatusBadge statusLabel={account.statusLabel} />
        </div>
      </div>

      <div className="dashboard-settings-account-card__details mt-7">
        <DetailRow icon={Mail} label="Email" value={account.email ?? "Not available"} />
        <DetailRow
          icon={Shield}
          label="Role"
          value={account.roleLabel}
          badge={<RoleBadge roleLabel={account.roleLabel} />}
        />
        <DetailRow
          icon={Star}
          label="Plan"
          value={account.planLabel}
          badge={<PlanBadge planLabel={account.planLabel} planType={account.planType} />}
        />
      </div>
    </SettingsCard>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[0.72rem] font-black tracking-[0.18em] text-[color:var(--dash-brand)] uppercase">
      {children}
    </p>
  );
}

function DetailRow({
  badge,
  icon: Icon,
  label,
  value,
}: {
  badge?: ReactNode;
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="dashboard-settings-account-card__detail flex items-center gap-5 border-t border-[#eee5db] py-6 first:border-t-0">
      <div
        className="dashboard-settings-account-card__detail-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fbf3ea] text-[color:var(--dash-brand)]"
        aria-hidden="true"
      >
        <Icon className="h-[18px] w-[18px]" />
      </div>
      <div className="dashboard-settings-account-card__detail-content min-w-0 flex-1">
        <p className="text-sm font-semibold text-[#b09887]">{label}</p>
        <p className="dashboard-settings-account-card__detail-value mt-1 truncate text-base font-black text-[color:var(--dash-foreground)]">
          {value}
        </p>
      </div>
      {badge ? <div className="dashboard-settings-account-card__detail-badge">{badge}</div> : null}
    </div>
  );
}

function StatusBadge({ statusLabel }: { statusLabel: string }) {
  const isActive = statusLabel.toLowerCase() === "active";

  return (
    <Badge
      className={
        isActive
          ? "rounded-full border-[#d6e7ce] bg-[#f0f8ea] px-2.5 py-1 text-[0.7rem] font-black text-[#4f8a3d]"
          : "rounded-full border-[#f0d1c3] bg-[#fff2ec] px-2.5 py-1 text-[0.7rem] font-black text-[color:var(--dash-brand)]"
      }
      variant="outline"
    >
      {statusLabel}
    </Badge>
  );
}

function RoleBadge({ roleLabel }: { roleLabel: string }) {
  const shortLabel = roleLabel.includes("Admin")
    ? "Admin"
    : roleLabel.includes("Staff")
      ? "Staff"
      : "Member";

  return (
    <Badge
      className="rounded-full border-[#f0d1c3] bg-[#fff2ec] px-2.5 py-1 text-[0.7rem] font-black text-[color:var(--dash-brand)]"
      variant="outline"
    >
      {shortLabel}
    </Badge>
  );
}

function PlanBadge({
  planLabel,
  planType,
}: {
  planLabel: string;
  planType: SettingsPageData["account"]["planType"];
}) {
  const tone =
    planType === "max"
      ? "rounded-full border-[#f0d1c3] bg-[#fff2ec] px-2.5 py-1 text-[0.7rem] font-black text-[color:var(--dash-brand)]"
      : "rounded-full border-[#eadfd4] bg-[#f6eee5] px-2.5 py-1 text-[0.7rem] font-black text-[#8f7666]";

  return (
    <Badge className={tone} variant="outline">
      {planType === "unknown" ? "Plan" : planLabel.toUpperCase()}
    </Badge>
  );
}
