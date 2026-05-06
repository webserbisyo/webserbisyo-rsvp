"use client";

import { Copy, ExternalLink, Globe, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";

export function RsvpWebsiteCard({
  slug,
  status,
  isPublished,
}: {
  slug: string | null;
  status: string;
  isPublished: boolean;
}) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://webserbisyo.com";
  const url = slug ? `${baseUrl}/r/${slug}` : null;
  const displayUrl = url ? url.replace(/^https?:\/\//, "") : "Slug pending";

  async function handleCopy() {
    if (!url) {
      toast.error("Your RSVP link will be available once the slug is ready.");
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
          <span className="ws-draft-badge">{isPublished ? "Published" : "Setup in progress"}</span>
        </div>
      </div>

      {isPublished ? (
        <div className="ws-website-status">
          <strong>{status}</strong>
          <p>Your RSVP website is live and ready to share.</p>
        </div>
      ) : null}

      <div className={`ws-link-field ${!url ? "is-disabled" : ""}`} title={url ?? "Slug pending"}>
        <Globe size={18} />
        <span>{displayUrl}</span>
        <button onClick={() => void handleCopy()} aria-label="Copy RSVP link" disabled={!url}>
          <Copy size={18} />
        </button>
      </div>

      {!url ? <p className="ws-website-hint">Your RSVP preview and share link will appear once the slug is assigned.</p> : null}

      <div className="ws-website-actions">
        {url ? (
          <a href={url} target="_blank" rel="noreferrer" className="ws-preview-btn">
            <ExternalLink size={16} />
            Preview website
          </a>
        ) : (
          <button className="ws-preview-btn" disabled>
            <ExternalLink size={16} />
            Preview website
          </button>
        )}
        <button className="ws-copy-btn" onClick={() => void handleCopy()} disabled={!url}>
          <LinkIcon size={16} />
          Copy RSVP link
        </button>
      </div>
    </section>
  );
}
