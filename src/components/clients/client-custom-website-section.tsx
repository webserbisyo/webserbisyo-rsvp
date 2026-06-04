"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Clipboard, ExternalLink, Loader2, Power, PowerOff, Save, Stethoscope } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  checkCustomWebsiteOriginHealthAction,
  disableCustomWebsiteAction,
  enableCustomWebsiteAction,
  saveCustomFrontendOriginAction,
} from "@/server/actions/admin-clients";
import type { AdminClientCustomWebsiteDto } from "@/server/queries/admin-clients";
import { ErrorState } from "@/components/feedback/error-state";
import { SectionCard } from "@/components/shared/section-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

type ClientCustomWebsiteSectionProps = {
  clientId: string;
  clientName: string;
  customWebsite: AdminClientCustomWebsiteDto;
  loadError?: string;
};

export function ClientCustomWebsiteSection({
  clientId,
  clientName,
  customWebsite,
  loadError,
}: ClientCustomWebsiteSectionProps) {
  return (
    <ClientCustomWebsiteEditor
      key={`${customWebsite.id ?? "new"}:${customWebsite.customFrontendOriginUrl ?? ""}:${customWebsite.customFrontendEnabled}`}
      clientId={clientId}
      clientName={clientName}
      customWebsite={customWebsite}
      loadError={loadError}
    />
  );
}

function ClientCustomWebsiteEditor({
  clientId,
  clientName,
  customWebsite,
  loadError,
}: ClientCustomWebsiteSectionProps) {
  const router = useRouter();
  const [originUrl, setOriginUrl] = useState(customWebsite.customFrontendOriginUrl ?? "");
  const eventId = customWebsite.eventId;
  const savedOriginUrl = customWebsite.customFrontendOriginUrl ?? "";
  const hasValidInputOrigin = isValidCustomOrigin(originUrl);
  const hasValidSavedOrigin = isValidCustomOrigin(savedOriginUrl);
  const canSubmitForEvent = Boolean(eventId);
  const setupValues = buildSetupValues(clientName, customWebsite);

  const saveMutation = useMutation({
    mutationFn: saveCustomFrontendOriginAction,
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success("Custom frontend origin saved.");
      router.refresh();
    },
    onError: () => {
      toast.error("Custom frontend origin could not be saved.");
    },
  });

  const enableMutation = useMutation({
    mutationFn: enableCustomWebsiteAction,
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success("Custom website enabled.");
      router.refresh();
    },
    onError: () => {
      toast.error("Custom website could not be enabled.");
    },
  });

  const disableMutation = useMutation({
    mutationFn: disableCustomWebsiteAction,
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success("Custom website disabled.");
      router.refresh();
    },
    onError: () => {
      toast.error("Custom website could not be disabled.");
    },
  });
  const healthMutation = useMutation({
    mutationFn: checkCustomWebsiteOriginHealthAction,
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success(
        result.data.healthStatus === "healthy"
          ? "Custom frontend origin is healthy."
          : "Custom frontend origin health check failed.",
      );
      router.refresh();
    },
    onError: () => {
      toast.error("Custom frontend origin health could not be checked.");
    },
  });

  const isSaving = saveMutation.isPending;
  const isEnabling = enableMutation.isPending;
  const isDisabling = disableMutation.isPending;
  const isCheckingHealth = healthMutation.isPending;
  const isBusy = isSaving || isEnabling || isDisabling || isCheckingHealth;

  function handleSaveOrigin() {
    if (!eventId || !hasValidInputOrigin) {
      toast.error("Enter a valid HTTPS custom frontend origin.");
      return;
    }

    saveMutation.mutate({
      clientId,
      eventId,
      originUrl,
      templateId: customWebsite.templateId,
    });
  }

  function handleEnable() {
    if (!eventId || !hasValidSavedOrigin) {
      toast.error("Save a valid custom frontend origin before enabling.");
      return;
    }

    enableMutation.mutate({ clientId, eventId });
  }

  function handleDisable() {
    if (!eventId || !customWebsite.customFrontendEnabled) {
      return;
    }

    disableMutation.mutate({ clientId, eventId });
  }

  function handleOpenOrigin() {
    if (!hasValidSavedOrigin) {
      return;
    }

    window.open(savedOriginUrl, "_blank", "noopener,noreferrer");
  }

  function handleCheckHealth() {
    if (!eventId || !hasValidSavedOrigin) {
      toast.error("Save a valid custom frontend origin before checking health.");
      return;
    }

    healthMutation.mutate({ clientId, eventId });
  }

  return (
    <SectionCard
      actions={
        <StatusBadge tone={getBadgeTone(customWebsite)}>{getBadgeLabel(customWebsite)}</StatusBadge>
      }
      className="h-fit xl:col-span-2"
      title="Custom Website"
      description="Connect a hidden custom frontend behind this client's normal public subdomain."
    >
      {loadError ? (
        <ErrorState title="Custom website settings could not be loaded" description={loadError} />
      ) : null}

      <div className="space-y-5">
        <div className="grid gap-3 md:grid-cols-2">
          <SummaryPanel
            label="Public website URL"
            value={customWebsite.publicWebsiteUrl ?? "Not configured"}
          />
          <SummaryPanel label="Website route" value={customWebsite.websiteRouteLabel} />
          <SummaryPanel label="Fallback URL" value={customWebsite.fallbackUrl ?? "Not configured"} />
          <SummaryPanel label="RSVP URL" value={customWebsite.rsvpUrl ?? "Not configured"} />
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="space-y-1">
            <p className="text-sm font-medium">Custom frontend origin</p>
            <p className="text-muted-foreground text-xs">
              This hidden origin is stored for Super Admin routing and is not shown to clients.
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="custom-frontend-origin-url">Hidden Vercel/custom frontend URL</Label>
            <Input
              id="custom-frontend-origin-url"
              inputMode="url"
              placeholder="https://webserbisyo-rsvp-custom-alex-lisa.vercel.app"
              value={originUrl}
              onChange={(event) => setOriginUrl(event.target.value)}
              disabled={!canSubmitForEvent || isBusy}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              onClick={handleSaveOrigin}
              disabled={!canSubmitForEvent || !hasValidInputOrigin || isBusy}
              className="bg-rsvp-brand text-rsvp-brand-foreground hover:bg-rsvp-brand/90"
            >
              {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Save origin
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleEnable}
              disabled={
                !canSubmitForEvent ||
                !hasValidSavedOrigin ||
                customWebsite.customFrontendEnabled ||
                isBusy
              }
            >
              {isEnabling ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Power className="size-4" />
              )}
              Enable custom website
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleOpenOrigin}
              disabled={!hasValidSavedOrigin || isBusy}
            >
              <ExternalLink className="size-4" />
              Open origin
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleCheckHealth}
              disabled={!canSubmitForEvent || !hasValidSavedOrigin || isBusy}
            >
              {isCheckingHealth ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Stethoscope className="size-4" />
              )}
              Check health
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleDisable}
              disabled={!canSubmitForEvent || !customWebsite.customFrontendEnabled || isBusy}
            >
              {isDisabling ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <PowerOff className="size-4" />
              )}
              Disable
            </Button>
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={getHealthBadgeTone(customWebsite.healthStatus)}>
              {getHealthBadgeLabel(customWebsite.healthStatus)}
            </StatusBadge>
            <p className="text-muted-foreground text-xs">
              {customWebsite.lastHealthCheckedAt
                ? `Last checked ${formatDateTime(customWebsite.lastHealthCheckedAt)}`
                : "Health has not been checked yet."}
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <SummaryPanel
              label="Preview availability"
              value={customWebsite.previewEnabled ? "Enabled" : "Disabled"}
            />
            <SummaryPanel
              label="Origin response"
              value={
                customWebsite.lastOriginStatusCode
                  ? `HTTP ${customWebsite.lastOriginStatusCode}`
                  : "Not checked"
              }
            />
            <SummaryPanel
              label="Response time"
              value={
                customWebsite.lastOriginResponseMs !== null
                  ? `${customWebsite.lastOriginResponseMs} ms`
                  : "Not checked"
              }
            />
          </div>
          {customWebsite.lastHealthError ? (
            <p className="text-muted-foreground rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-xs">
              {customWebsite.lastHealthError}
            </p>
          ) : null}
          <p className="text-muted-foreground text-xs">
            Client dashboards can open the custom preview only when the custom website is enabled,
            preview is enabled, and health is healthy or not checked yet.
          </p>
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <SummaryPanel
              label="Platform event slug"
              value={customWebsite.platformEventSlug ?? "Not configured"}
            />
            <SummaryPanel label="Template" value={customWebsite.templateId} />
          </div>
          <div className="flex flex-wrap gap-2">
            <CopyButton label="Copy setup command" value={setupValues.setupCommand} />
            <CopyButton label="Copy env template" value={setupValues.envTemplate} />
            <CopyButton label="Copy data pull command" value={setupValues.dataPullCommand} />
            <CopyButton label="Copy AI/CLI setup brief" value={setupValues.setupBrief} />
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

function SummaryPanel({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-border/70 bg-muted/20 min-w-0 rounded-lg border p-3">
      <p className="text-muted-foreground text-xs font-medium">{label}</p>
      <p className="text-foreground mt-1 text-sm break-words">{value}</p>
    </div>
  );
}

function CopyButton({ label, value }: { label: string; value: string | null }) {
  async function handleCopy() {
    if (!value) {
      toast.error("Setup value is not available yet.");
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label.replace(/^Copy /, "")} copied.`);
    } catch {
      toast.error("Could not copy the setup value.");
    }
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      onClick={() => void handleCopy()}
      disabled={!value}
    >
      <Clipboard className="size-4" />
      {label}
    </Button>
  );
}

function buildSetupValues(clientName: string, customWebsite: AdminClientCustomWebsiteDto) {
  const platformEventSlug = customWebsite.platformEventSlug;
  const templateId = customWebsite.templateId;
  const repositoryName = `webserbisyo-rsvp-custom-${slugify(clientName) || "client"}`;
  const setupCommand = `gh repo create ${repositoryName} --private --template webserbisyo-rsvp-custom-starter`;
  const envTemplate = platformEventSlug
    ? [
        `NEXT_PUBLIC_WEBSERBISYO_API_URL=${customWebsite.platformApiUrl}`,
        `NEXT_PUBLIC_EVENT_SLUG=${platformEventSlug}`,
        "NEXT_PUBLIC_DESIGN_MODE=false",
        `NEXT_PUBLIC_TEMPLATE_ID=${templateId}`,
      ].join("\n")
    : null;
  const dataPullCommand = platformEventSlug ? `npm run prefetch:event ${platformEventSlug}` : null;
  const setupBrief = platformEventSlug
    ? [
        "This custom repo is frontend-only.",
        "Do not add Supabase service role, auth, billing, admin, payments, or private database logic.",
        "Use NEXT_PUBLIC_EVENT_SLUG to fetch published event data from the main WebSerbisyo API.",
        "Deploy the custom frontend to Vercel.",
        "Paste the deployed origin URL into Super Admin as custom_frontend_origin_url.",
        "Enable custom website.",
        "Main platform keeps the public wildcard URL and will proxy custom frontend behind it later.",
      ].join("\n")
    : null;

  return {
    dataPullCommand,
    envTemplate,
    setupBrief,
    setupCommand,
  };
}

function getBadgeLabel(customWebsite: AdminClientCustomWebsiteDto) {
  if (customWebsite.customFrontendEnabled) {
    return "Enabled";
  }

  if (customWebsite.customFrontendOriginUrl) {
    return "Origin saved";
  }

  return "Disabled";
}

function getBadgeTone(customWebsite: AdminClientCustomWebsiteDto) {
  if (customWebsite.customFrontendEnabled) {
    return "success";
  }

  if (customWebsite.customFrontendOriginUrl) {
    return "warning";
  }

  return "muted";
}

function getHealthBadgeLabel(status: AdminClientCustomWebsiteDto["healthStatus"]) {
  if (status === "healthy") {
    return "Healthy";
  }

  if (status === "unhealthy") {
    return "Unhealthy";
  }

  return "Unknown";
}

function getHealthBadgeTone(status: AdminClientCustomWebsiteDto["healthStatus"]) {
  if (status === "healthy") {
    return "success";
  }

  if (status === "unhealthy") {
    return "danger";
  }

  return "muted";
}

function formatDateTime(value: string) {
  try {
    return new Intl.DateTimeFormat("en", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function isValidCustomOrigin(value: string) {
  if (!value.trim()) {
    return false;
  }

  try {
    const url = new URL(value.trim());
    const isLocalhost = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);

    return url.protocol === "https:" || (url.protocol === "http:" && isLocalhost);
  } catch {
    return false;
  }
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}
