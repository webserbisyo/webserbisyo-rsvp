"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import {
  trackMetaPixelEvent,
  type MetaPixelBrowserEventName,
  type MetaPixelEventParams,
} from "@/lib/meta/browser-events";

type TrackingProps = {
  trackingEvent: MetaPixelBrowserEventName;
  trackingParams?: MetaPixelEventParams;
};

type TrackedLinkProps = ComponentProps<typeof Link> & TrackingProps;

export function TrackedLink({
  trackingEvent,
  trackingParams,
  onClick,
  ...props
}: TrackedLinkProps) {
  return (
    <Link
      {...props}
      onClick={(event) => {
        trackMetaPixelEvent(trackingEvent, trackingParams);
        onClick?.(event);
      }}
    />
  );
}

type TrackedAnchorProps = ComponentProps<"a"> & TrackingProps;

export function TrackedAnchor({
  trackingEvent,
  trackingParams,
  onClick,
  ...props
}: TrackedAnchorProps) {
  return (
    <a
      {...props}
      onClick={(event) => {
        trackMetaPixelEvent(trackingEvent, trackingParams);
        onClick?.(event);
      }}
    />
  );
}
