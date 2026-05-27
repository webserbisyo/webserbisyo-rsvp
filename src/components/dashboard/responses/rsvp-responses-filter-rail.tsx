"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { RsvpResponsesTab } from "./rsvp-responses-types";

export const RSVP_RESPONSE_FILTERS: Array<{
  label: string;
  value: RsvpResponsesTab;
}> = [
  { label: "All", value: "all" },
  { label: "Attending", value: "attending" },
  { label: "Not attending", value: "not_attending" },
  { label: "Messages", value: "messages" },
  { label: "Guestbook", value: "guestbook" },
  { label: "Needs review", value: "needs_review" },
];

export function RsvpResponsesFilterRail({
  activeTab,
  onActiveTabChange,
}: {
  activeTab: RsvpResponsesTab;
  onActiveTabChange: (value: RsvpResponsesTab) => void;
}) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const viewport = viewportRef.current;

    if (!viewport) {
      return;
    }

    function updateScrollState() {
      const nextViewport = viewportRef.current;

      if (!nextViewport) {
        return;
      }

      const maxScrollLeft = nextViewport.scrollWidth - nextViewport.clientWidth;
      setCanScrollLeft(nextViewport.scrollLeft > 8);
      setCanScrollRight(maxScrollLeft - nextViewport.scrollLeft > 8);
    }

    const resizeObserver = new ResizeObserver(() => {
      updateScrollState();
    });

    updateScrollState();
    viewport.addEventListener("scroll", updateScrollState, { passive: true });
    resizeObserver.observe(viewport);

    return () => {
      viewport.removeEventListener("scroll", updateScrollState);
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    const activeTrigger = viewportRef.current?.querySelector<HTMLButtonElement>(
      `[data-filter-value="${activeTab}"]`,
    );

    activeTrigger?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [activeTab]);

  return (
    <>
      <div className="hidden xl:block">
        <Tabs value={activeTab} onValueChange={(value) => onActiveTabChange(value as RsvpResponsesTab)}>
          <TabsList className="flex h-auto w-auto justify-start rounded-2xl bg-[#fbf7f3] p-1">
            {RSVP_RESPONSE_FILTERS.map((filter) => (
              <TabsTrigger
                key={filter.value}
                className={TAB_TRIGGER_CLASS_NAME}
                value={filter.value}
              >
                {filter.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="relative min-w-0 px-7 xl:hidden" data-rsvp-filter-rail>
        {canScrollLeft ? (
          <button
            type="button"
            className="absolute top-1/2 left-1.5 z-10 -translate-y-1/2 text-black/45 transition hover:text-black/65"
            aria-label="Scroll filters left"
            onClick={() => scrollViewportBy(viewportRef.current, -160)}
          >
            <ChevronLeft className="h-5 w-5 drop-shadow-[0_1px_1px_rgba(255,255,255,0.65)]" />
          </button>
        ) : null}

        <Tabs value={activeTab} onValueChange={(value) => onActiveTabChange(value as RsvpResponsesTab)}>
          <div
            ref={viewportRef}
            className="w-full max-w-full overflow-x-auto px-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <TabsList className="inline-flex h-auto min-w-max justify-start rounded-2xl bg-[#fbf7f3] p-1">
              {RSVP_RESPONSE_FILTERS.map((filter) => (
                <TabsTrigger
                  key={filter.value}
                  data-filter-value={filter.value}
                  className={TAB_TRIGGER_CLASS_NAME}
                  value={filter.value}
                >
                  {filter.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </Tabs>

        {canScrollRight ? (
          <button
            type="button"
            className="absolute top-1/2 right-1.5 z-10 -translate-y-1/2 text-black/45 transition hover:text-black/65"
            aria-label="Scroll filters right"
            onClick={() => scrollViewportBy(viewportRef.current, 160)}
          >
            <ChevronRight className="h-5 w-5 drop-shadow-[0_1px_1px_rgba(255,255,255,0.65)]" />
          </button>
        ) : null}
      </div>
    </>
  );
}

function scrollViewportBy(viewport: HTMLDivElement | null, left: number) {
  viewport?.scrollBy({
    behavior: "smooth",
    left,
  });
}

const TAB_TRIGGER_CLASS_NAME = cn(
  "rounded-xl border-0 px-3 py-2 text-sm font-semibold text-[#8a7c72] transition",
  "hover:text-[#2b2521] data-[state=active]:bg-white data-[state=active]:text-[#c96f4c] data-[state=active]:shadow-sm",
);
