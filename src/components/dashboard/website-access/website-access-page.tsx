"use client";

import type { WebsiteAccessInitialData } from "./website-access-types";
import { GuestAccessCard } from "./guest-access-card";
import { LiveWebsiteBar } from "./live-website-bar";
import { PrivateLinkRegenerateDialog } from "./private-link-regenerate-dialog";
import { PublishStatusCard } from "./publish-status-card";
import { QrCodesCard } from "./qr-codes-card";
import { SlugChangeDialog } from "./slug-change-dialog";
import { useWebsiteAccessState } from "./use-website-access-demo-state";
import { WebsiteLinkCard } from "./website-link-card";

type WebsiteAccessPageProps = {
  initialData: WebsiteAccessInitialData;
};

export function WebsiteAccessPage({ initialData }: WebsiteAccessPageProps) {
  const state = useWebsiteAccessState(initialData);

  return (
    <div className="space-y-6 pt-6 pb-24 md:pb-8">
      <h1 className="sr-only">Website Access</h1>

      <LiveWebsiteBar
        disabled={state.isPublishBlocked}
        isPublished={state.isPublished}
        onPublish={state.publishWebsite}
        websiteUrl={state.websiteUrlOpen}
      />

      {state.customWebsiteConnected ? (
        <p className="rounded-2xl border border-[#eadbd0] bg-white/80 px-5 py-3 text-sm font-medium text-[#5f4b43] shadow-sm shadow-[#8a4b2e]/5">
          Custom website connected. Public links and QR codes still use your WebSerbisyo website
          URL.
        </p>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <GuestAccessCard
          hasVisibilityDraft={state.hasVisibilityDraft}
          disabled={state.isInteractionPending}
          isPrivateLinkApplied={state.isPrivateLinkRegenerateAvailable}
          isPublished={state.isPublished}
          onRegeneratePrivateLink={state.openRegeneratePrivateLinkDialog}
          onSelect={state.handleVisibilitySelect}
          selectedVisibility={state.visibility}
          visibilityLabel={state.visibilityLabel}
        />
        <PublishStatusCard
          changesSummary={state.changesSummary}
          disabled={state.isPublishBlocked}
          hasPendingChanges={state.hasPendingChanges}
          isPublished={state.isPublished}
          lastEditedLabel={state.lastEditedLabel}
          onPublish={
            state.publishStatusState === "hidden"
              ? state.publishWebsite
              : state.publishLatestChanges
          }
          onUnpublish={state.unpublishWebsite}
          publishState={state.publishStatusState}
          publishedAtLabel={state.publishedAtLabel}
        />
      </div>

      <WebsiteLinkCard
        canCopy={Boolean(state.websiteUrlCopy)}
        hasSlugChange={state.hasSlugChange}
        isSlugLocked={state.isSlugLocked}
        isUpdating={state.isInteractionPending}
        onCopy={state.copyWebsiteLink}
        onChangeUrl={state.openSlugModal}
        onDraftSlugInput={state.handleDraftSlugInput}
        slugDraft={state.slugDraft}
        slugDraftError={state.slugDraftError}
        subdomainBaseDomain={state.subdomainBaseDomain}
        subdomainConfigured={state.subdomainConfigured}
        websiteUrlFallback={state.websiteUrlFallback}
        websiteUrlDraft={state.websiteUrlDraft}
        websiteUrlPublished={state.websiteUrlPublished}
        websiteUrlProduction={state.websiteUrlProduction}
      />

      <QrCodesCard
        disabled={!state.qrActionsEnabled}
        onCopyRsvpLink={state.copyRsvpQrLink}
        onCopyWebsiteLink={state.copyWebsiteQrLink}
        rsvpUrl={state.rsvpUrlQr}
        slugPublished={state.slugPublished}
        websiteUrl={state.websiteUrlQr}
      />

      <SlugChangeDialog
        currentSlug={state.publishedSubdomain}
        errorMessage={state.slugModalError}
        onConfirm={state.confirmSlugChange}
        onOpenChange={(open) => {
          if (open) {
            state.openSlugModal();
            return;
          }

          state.closeSlugModal();
        }}
        onValueChange={state.setSlugModalValue}
        open={state.slugModalOpen}
        pending={state.isInteractionPending}
        suffix={state.subdomainBaseDomain}
        value={state.slugModalValue}
      />

      <PrivateLinkRegenerateDialog
        open={state.isRegenerateDialogOpen}
        pending={state.isInteractionPending}
        onConfirm={state.regeneratePrivateLink}
        onOpenChange={(open) => {
          if (open) {
            state.openRegeneratePrivateLinkDialog();
            return;
          }

          state.closeRegeneratePrivateLinkDialog();
        }}
      />
    </div>
  );
}
