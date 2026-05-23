"use client";

import { useMemo, useSyncExternalStore } from "react";
import { Copy, ExternalLink, Globe, Link as LinkIcon } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { buildPublicRsvpUrl, normalizePublicAppUrl } from "@/lib/public-rsvp-url";

function subscribeToNothing() {
  return () => {};
}

export function RsvpWebsiteCard({
  isShareable,
  publicUrl,
  shareHint,
  slug,
}: {
  isShareable: boolean;
  publicUrl: string | null;
  shareHint: string;
  slug: string | null;
}) {
  const clientOrigin = useSyncExternalStore(
    subscribeToNothing,
    () => normalizePublicAppUrl(window.location.origin),
    () => null,
  );

  const url = useMemo(() => {
    if (!isShareable || !slug) {
      return null;
    }

    if (publicUrl) {
      return publicUrl;
    }

    if (clientOrigin) {
      return buildPublicRsvpUrl(clientOrigin, slug);
    }

    return null;
  }, [clientOrigin, isShareable, publicUrl, slug]);

  const displayUrl = url ? url.replace(/^https?:\/\//, "") : "Publish pending";

  async function handleCopy() {
    if (!url) {
      toast.error(shareHint);
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      toast.success("RSVP link copied to clipboard");
    } catch {
      toast.error("Could not copy the RSVP link.");
    }
  }

  return (
    <section className="ws-website-panel">
      <div className="ws-website-head">
        <div className="min-w-0">
          <h3>Your RSVP Website</h3>
        </div>
      </div>

      <div className={`ws-link-field ${!url ? "is-disabled" : ""}`} title={url ?? shareHint}>
        <Globe size={18} />
        <span>{displayUrl}</span>
        <button onClick={() => void handleCopy()} aria-label="Copy RSVP link" disabled={!url}>
          <Copy size={18} />
        </button>
      </div>

      {!url ? <p className="ws-website-hint">{shareHint}</p> : null}

      <div className="ws-website-actions">
        {url ? (
          <a href={url} target="_blank" rel="noreferrer" className="ws-preview-btn">
            <ExternalLink size={16} />
            View website
          </a>
        ) : (
          <button type="button" className="ws-preview-btn" disabled aria-disabled="true">
            <ExternalLink size={16} />
            View website
          </button>
        )}
        <button className="ws-copy-btn" onClick={() => void handleCopy()} disabled={!url}>
          <LinkIcon size={16} />
          Copy link
        </button>
        <Link href="/dashboard/website-access" className="ws-manage-btn">
          Manage access
        </Link>
      </div>
    </section>
  );
}
