"use client";

import { useEffect } from "react";

const MESSAGE_TYPE = "webserbisyo:rsvp-embed:resize";
const MIN_HEIGHT = 420;
const MAX_HEIGHT = 2400;

export function PublicRsvpEmbedResizer() {
  useEffect(() => {
    const targetOrigin = getParentTargetOrigin();
    let frameId = 0;

    function getHeight() {
      const body = document.body;
      const root = document.documentElement;

      return Math.ceil(
        Math.max(
          body.scrollHeight,
          body.offsetHeight,
          root.clientHeight,
          root.scrollHeight,
          root.offsetHeight,
        ),
      );
    }

    function postHeight() {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(() => {
        const height = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, getHeight()));

        window.parent?.postMessage({ height, type: MESSAGE_TYPE }, targetOrigin);
      });
    }

    const observer = new ResizeObserver(postHeight);

    observer.observe(document.body);
    observer.observe(document.documentElement);
    postHeight();
    window.addEventListener("load", postHeight);
    window.addEventListener("resize", postHeight);

    return () => {
      window.cancelAnimationFrame(frameId);
      observer.disconnect();
      window.removeEventListener("load", postHeight);
      window.removeEventListener("resize", postHeight);
    };
  }, []);

  return null;
}

function getParentTargetOrigin() {
  if (!document.referrer) {
    return "*";
  }

  try {
    return new URL(document.referrer).origin;
  } catch {
    return "*";
  }
}
