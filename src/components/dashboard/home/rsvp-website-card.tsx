"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Globe } from "lucide-react";
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
  const url = slug ? `${process.env.NEXT_PUBLIC_APP_URL || "https://webserbisyo.com"}/r/${slug}` : null;

  const handleCopy = () => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    toast.success("RSVP link copied to clipboard");
  };

  return (
    <Card className="rounded-3xl border-[var(--dash-border)] bg-[var(--dash-surface)] shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-[var(--dash-muted)]">
          YOUR RSVP WEBSITE
        </CardTitle>
        <div className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${isPublished ? "bg-[var(--dash-success-subtle)] text-[var(--dash-success)] border-[var(--dash-success)]" : "bg-[var(--dash-surface-muted)] text-[var(--dash-muted)] border-[var(--dash-border)]"}`}>
          {status}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {url ? (
          <div className="flex items-center justify-between rounded-xl border border-[var(--dash-border)] bg-[var(--dash-surface-muted)] px-4 py-3">
            <span className="truncate text-sm font-medium text-[var(--dash-foreground)]">
              {url.replace(/^https?:\/\//, "")}
            </span>
            <button onClick={handleCopy} className="ml-2 flex-shrink-0 text-[var(--dash-muted)] hover:text-[var(--dash-foreground)]">
              <Copy className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="rounded-xl border border-[var(--dash-border)] bg-[var(--dash-surface-muted)] px-4 py-3 text-sm text-[var(--dash-muted)]">
            Setup in progress
          </div>
        )}
        
        <div className="flex gap-3">
          {url && isPublished ? (
            <Button
              asChild
              className="flex-1 bg-[var(--dash-brand)] text-white hover:bg-[var(--dash-brand-hover)]"
            >
              <a href={url} target="_blank" rel="noreferrer">
                <Globe className="mr-2 h-4 w-4" /> Preview website
              </a>
            </Button>
          ) : (
            <Button
              variant="outline"
              className="flex-1 border-[var(--dash-border)] text-[var(--dash-foreground)] hover:bg-[var(--dash-surface-hover)]"
            >
              Request Publish
            </Button>
          )}
          
          <Button
            onClick={handleCopy}
            disabled={!url}
            variant="outline"
            className="flex-1 border-[var(--dash-border)] text-[var(--dash-foreground)] hover:bg-[var(--dash-surface-hover)]"
          >
            <Copy className="mr-2 h-4 w-4" /> Copy RSVP link
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
