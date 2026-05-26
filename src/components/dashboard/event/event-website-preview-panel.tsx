"use client";

import { Monitor, Smartphone } from "lucide-react";
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
import { cn } from "@/lib/utils";

type EventWebsitePreviewPanelProps = {
  defaultDevice?: EventWebsitePreviewDevice;
  enabledSections: Record<EventWebsiteSectionKey, boolean>;
  guestbookMessages: EventWebsiteGuestbookMessage[];
  compactChrome?: boolean;
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

          <div ref={previewScrollRef} className="event-preview-frame">
            <EventWebsiteRenderer
              draft={previewDraft}
              guestbookMessages={guestbookMessages}
              highlightActiveSection
              sections={visiblePreviewSections.map((section) => section.key)}
              selectedSectionKey={selectedSectionKey}
            />
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
