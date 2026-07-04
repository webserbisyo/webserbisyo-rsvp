"use client";

import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { completeTestAccountPurgeAction } from "@/server/actions/admin-clients";
import type { CompleteAccountPurgeResult } from "@/server/services/admin-workflow/complete-account-purge";
import { SectionCard } from "@/components/shared/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function parseEmails(value: string) {
  return Array.from(
    new Set(
      value
        .split(/[\n,]/g)
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean),
    ),
  );
}

export function ClientAccountPurgeTool() {
  const router = useRouter();
  const [emailsText, setEmailsText] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [note, setNote] = useState("");
  const emails = useMemo(() => parseEmails(emailsText), [emailsText]);

  const mutation = useMutation({
    mutationFn: () =>
      completeTestAccountPurgeAction({
        confirmation,
        emails,
        note,
      }),
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      const message = buildCompletePurgeMessage(result.data);

      if (result.data.authDeletedCount === 0) {
        toast.error(message);
      } else if (result.data.blockedCount > 0 || result.data.failedCount > 0) {
        toast(message);
      } else {
        toast.success(message);
      }

      if (result.data.authDeletedCount > 0) {
        setEmailsText("");
        setConfirmation("");
        setNote("");
      }

      router.refresh();
    },
    onError: () => toast.error("Complete account purge failed."),
  });

  return (
    <SectionCard
      title="Complete Test Account Purge"
      description="Platform Admin cleanup for dummy/test/spam accounts that still have Supabase Auth users after app client purge. This removes blocking profiles first, preserves tombstone and audit evidence, and then deletes the Auth user."
    >
      <div className="space-y-4">
        <div className="rounded-md border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm">
          <p className="font-medium">This action is for controlled dummy/test/spam cleanup only.</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
            <li>Requires exact confirmation: DELETE AUTH USER</li>
            <li>Requires a purge note for audit history</li>
            <li>Blocks self-delete, platform admin targets, live RSVP records, and persisted guest data</li>
            <li>Preserves paid payment evidence by reusing the existing test-data purge path first</li>
          </ul>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="space-y-2">
            <Label htmlFor="complete-account-purge-emails">Auth emails to purge</Label>
            <Textarea
              id="complete-account-purge-emails"
              value={emailsText}
              onChange={(event) => setEmailsText(event.currentTarget.value)}
              placeholder={"one@example.test\nanother@example.test"}
              rows={8}
            />
            <p className="text-muted-foreground text-xs">
              Enter one email per line or separate multiple emails with commas.
            </p>
          </div>

          <div className="space-y-4">
            <div className="rounded-md border px-3 py-3 text-sm">
              <p className="text-muted-foreground text-xs font-medium">Resolved targets</p>
              <p className="mt-1 text-2xl font-semibold">{emails.length}</p>
              <p className="text-muted-foreground mt-2 text-xs">
                Orphan auth/profile-only test accounts can be purged here even when no client row is selected.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="complete-account-purge-confirmation">
                Type DELETE AUTH USER to confirm
              </Label>
              <Input
                id="complete-account-purge-confirmation"
                value={confirmation}
                onChange={(event) => setConfirmation(event.currentTarget.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="complete-account-purge-note">Required purge note</Label>
              <Textarea
                id="complete-account-purge-note"
                value={note}
                onChange={(event) => setNote(event.currentTarget.value)}
                placeholder="Explain why these auth accounts are being purged."
                rows={5}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t pt-4">
          <Button
            type="button"
            variant="outline"
            disabled={mutation.isPending}
            onClick={() => {
              setEmailsText("");
              setConfirmation("");
              setNote("");
            }}
          >
            Clear
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={
              mutation.isPending ||
              emails.length === 0 ||
              confirmation !== "DELETE AUTH USER" ||
              !note.trim()
            }
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Complete account purge
          </Button>
        </div>
      </div>
    </SectionCard>
  );
}

function buildCompletePurgeMessage(result: CompleteAccountPurgeResult) {
  const parts = [
    `${result.authDeletedCount}/${result.selectedCount} auth users deleted`,
    `${result.appRecordsPurgedCount} linked app records purged`,
  ];

  if (result.blockedCount > 0) {
    parts.push(`${result.blockedCount} blocked`);
  }

  if (result.failedCount > 0) {
    parts.push(`${result.failedCount} failed`);
  }

  const detail = result.results.find((item) => item.status !== "auth_deleted");
  if (detail) {
    parts.push(detail.message);
  }

  return parts.join(". ");
}
