"use client";

import type { WebsiteAccessInitialData } from "./website-access-types";
import { GuestAccessCard } from "./guest-access-card";
import { LiveWebsiteBar } from "./live-website-bar";
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
        disabled={state.isInteractionPending}
        isPublished={state.isPublished}
        onPublish={state.publishWebsite}
        websiteUrl={state.websiteUrlPublished}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <GuestAccessCard
          hasVisibilityDraft={state.hasVisibilityDraft}
          disabled={state.isInteractionPending}
          isPublished={state.isPublished}
          onSelect={state.handleVisibilitySelect}
          selectedVisibility={state.visibility}
          visibilityLabel={state.visibilityLabel}
        />
        <PublishStatusCard
          changesSummary={state.changesSummary}
          disabled={state.isInteractionPending}
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
        canCopy={Boolean(state.websiteUrlPublished)}
        hasSlugChange={state.hasSlugChange}
        isSlugLocked={state.isSlugLocked}
        isUpdating={state.isInteractionPending}
        onCopy={state.copyWebsiteLink}
        onChangeUrl={state.openSlugModal}
        onDraftSlugInput={state.handleDraftSlugInput}
        slugDraft={state.slugDraft}
        slugDraftError={state.slugDraftError}
        websiteUrlDraft={state.websiteUrlDraft}
        websiteUrlPublished={state.websiteUrlPublished}
      />

      <QrCodesCard
        disabled={!state.qrActionsEnabled}
        onCopyRsvpLink={state.copyRsvpLink}
        onCopyWebsiteLink={state.copyWebsiteQrLink}
        rsvpUrl={state.rsvpUrlPublished}
        slugPublished={state.slugPublished}
        websiteUrl={state.websiteUrlPublished}
      />

      <SlugChangeDialog
        currentSlug={state.slugPublished}
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
        value={state.slugModalValue}
      />
    </div>
  );
}
