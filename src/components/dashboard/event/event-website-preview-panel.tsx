"use client";

import { ExternalLink, Monitor, Smartphone } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { EventWebsiteRenderer } from "@/components/event-website/event-website-renderer";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  EventWebsiteSectionDefinition,
  EventWebsiteSectionKey,
} from "@/config/event-website-sections";
import {
  previewSupportedSectionKeys,
  type EventWebsitePreviewDevice,
  type EventWebsitePreviewDraft,
} from "@/components/dashboard/event/event-website-preview-data";
import type { EventWebsiteGuestbookMessage } from "@/lib/event-website/types";
import type { DashboardCustomWebsitePreviewDto } from "@/server/services/custom-websites/types";
import { cn } from "@/lib/utils";

type EventWebsitePreviewPanelProps = {
  defaultDevice?: EventWebsitePreviewDevice;
  enabledSections: Record<EventWebsiteSectionKey, boolean>;
  guestbookMessages: EventWebsiteGuestbookMessage[];
  compactChrome?: boolean;
  customWebsitePreview: DashboardCustomWebsitePreviewDto;
  mode?: "desktop" | "responsive";
  previewChromeUrl: string | null;
  previewScrollRequest: number;
  previewDraft: EventWebsitePreviewDraft;
  selectedSection: EventWebsiteSectionDefinition | undefined;
  showDeviceTabs?: boolean;
  websiteFlowSections: EventWebsiteSectionDefinition[];
};

const supportedSectionKeySet = new Set<EventWebsiteSectionKey>(previewSupportedSectionKeys);

export function EventWebsitePreviewPanel({
  defaultDevice = "desktop",
  enabledSections,
  guestbookMessages,
  compactChrome = false,
  customWebsitePreview,
  mode = "desktop",
  previewChromeUrl,
  previewScrollRequest,
  previewDraft,
  selectedSection,
  showDeviceTabs = true,
  websiteFlowSections,
}: EventWebsitePreviewPanelProps) {
  const [device, setDevice] = useState<EventWebsitePreviewDevice>(defaultDevice);
  const previewScrollRef = useRef<HTMLDivElement>(null);
  const visiblePreviewSections = websiteFlowSections.filter(
    (section) =>
      supportedSectionKeySet.has(section.key) &&
      (section.required || enabledSections[section.key]),
  );
  const selectedSectionIsOff = Boolean(
    selectedSection &&
      !selectedSection.required &&
      !selectedSection.comingSoon &&
      !enabledSections[selectedSection.key],
  );
  const selectedSectionKey = selectedSection?.key;
  const activeDevice = showDeviceTabs ? device : defaultDevice;
  const previewAddress = previewChromeUrl ?? "Website URL pending";
  const [requestedPreviewMode, setRequestedPreviewMode] = useState<"custom" | "platform">(
    "platform",
  );
  const customPreviewAvailable = customWebsitePreview.customPreviewAvailable;
  const previewMode = customPreviewAvailable ? requestedPreviewMode : "platform";
  const showCustomPreview = previewMode === "custom" && customPreviewAvailable;

  useEffect(() => {
    if (!selectedSectionKey || !supportedSectionKeySet.has(selectedSectionKey) || selectedSectionIsOff) {
      return;
    }

    const scrollContainer = previewScrollRef.current;
    const target = scrollContainer?.querySelector<HTMLElement>(
      `[data-preview-section="${selectedSectionKey}"]`,
    );

    if (!scrollContainer || !target) {
      return;
    }

    requestAnimationFrame(() => {
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const targetTop =
        target.offsetTop - scrollContainer.clientHeight / 2 + target.clientHeight / 2;

      scrollContainer.scrollTo({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        top: Math.max(0, targetTop),
      });
    });
  }, [previewScrollRequest, selectedSectionIsOff, selectedSectionKey, visiblePreviewSections]);

  return (
    <aside
      className={cn("event-website-preview-space", mode === "responsive" && "event-website-preview-space--responsive")}
      aria-label="Website preview"
    >
      <div className="event-preview-panel">
        {selectedSectionIsOff ? (
          <div className="event-preview-off-notice">
            {selectedSection?.label} is turned off and will not appear on the public website.
          </div>
        ) : null}

        <div className="event-preview-mode-row">
          <div className="event-preview-mode-copy">
            <strong>{showCustomPreview ? "Custom preview" : "Platform preview"}</strong>
            <span>
              {showCustomPreview
                ? "Deployed custom site. Publish or redeploy custom code to update it."
                : "Editable draft state from this dashboard."}
            </span>
          </div>
          <div className="event-preview-mode-actions">
            {customPreviewAvailable ? (
              <Tabs
                value={previewMode}
                onValueChange={(value) => setRequestedPreviewMode(value as "custom" | "platform")}
              >
                <TabsList className="event-preview-mode-tabs" aria-label="Preview mode">
                  <TabsTrigger value="platform" className="event-preview-mode-trigger">
                    Platform
                  </TabsTrigger>
                  <TabsTrigger value="custom" className="event-preview-mode-trigger">
                    Custom
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            ) : null}
            {customPreviewAvailable && customWebsitePreview.customPreviewUrl ? (
              <a
                aria-label="Open custom preview"
                className="event-preview-open-custom"
                href={customWebsitePreview.customPreviewUrl}
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLink className="size-3.5" aria-hidden="true" />
              </a>
            ) : null}
          </div>
        </div>

        <div
          className={cn(
            "event-preview-frame-shell",
            activeDevice === "mobile" && "is-mobile",
            compactChrome && "is-compact",
          )}
        >
          {showDeviceTabs && activeDevice === "desktop" ? (
            <div className="event-preview-browser-bar">
              <span className="event-preview-browser-dot is-red" />
              <span className="event-preview-browser-dot is-green" />
              <span className="event-preview-browser-dot is-neutral" />
              <span className="event-preview-address">{previewAddress}</span>
              <PreviewDeviceTabs device={device} onDeviceChange={setDevice} />
            </div>
          ) : showDeviceTabs ? (
            <div className="event-preview-mobile-control-row">
              <PreviewDeviceTabs device={device} onDeviceChange={setDevice} />
            </div>
          ) : null}

          <div
            ref={previewScrollRef}
            className={cn("event-preview-frame", showCustomPreview && "is-custom-preview")}
          >
            {showCustomPreview && customWebsitePreview.customPreviewUrl ? (
              <iframe
                className="event-preview-custom-frame"
                referrerPolicy="no-referrer"
                sandbox="allow-scripts allow-same-origin allow-popups"
                src={customWebsitePreview.customPreviewUrl}
                title="Custom website preview"
              />
            ) : (
              <EventWebsiteRenderer
                draft={previewDraft}
                guestbookMessages={guestbookMessages}
                highlightActiveSection
                sections={visiblePreviewSections.map((section) => section.key)}
                selectedSectionKey={selectedSectionKey}
              />
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}

function PreviewDeviceTabs({
  device,
  onDeviceChange,
}: {
  device: EventWebsitePreviewDevice;
  onDeviceChange: (device: EventWebsitePreviewDevice) => void;
}) {
  return (
    <Tabs value={device} onValueChange={(value) => onDeviceChange(value as EventWebsitePreviewDevice)}>
      <TabsList className="event-preview-device-tabs" aria-label="Preview device">
        <TabsTrigger value="desktop" className="event-preview-device-trigger" aria-label="Desktop preview">
          <Monitor className="size-3.5" aria-hidden="true" />
        </TabsTrigger>
        <TabsTrigger value="mobile" className="event-preview-device-trigger" aria-label="Mobile preview">
          <Smartphone className="size-3.5" aria-hidden="true" />
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
