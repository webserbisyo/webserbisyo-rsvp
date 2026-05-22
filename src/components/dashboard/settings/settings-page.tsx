import type { SettingsPageData } from "@/server/queries/settings";
import { AccountAccessCard } from "@/components/dashboard/settings/account-access-card";
import { AppInstallCard } from "@/components/dashboard/settings/app-install-card";
import { NotificationPreferencesCard } from "@/components/dashboard/settings/notification-preferences-card";
import { SupportCard } from "@/components/dashboard/settings/support-card";

type SettingsPageProps = {
  data: SettingsPageData;
};

export function SettingsPage({ data }: SettingsPageProps) {
  return (
    <div className="space-y-6 pb-24 pt-2 md:pb-8">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_330px] xl:grid-cols-[minmax(0,1fr)_348px]">
        <div className="space-y-6">
          <AccountAccessCard account={data.account} />
          <NotificationPreferencesCard notifications={data.notifications} />
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <AppInstallCard />
          <SupportCard support={data.support} />
        </aside>
      </div>
    </div>
  );
}
