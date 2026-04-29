"use client";

import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import type { ClientDetailView } from "@/server/queries/admin-clients";
import {
  archiveClientAction,
  resendClientOnboardingAction,
  restoreClientAction,
} from "@/server/actions/admin-clients";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type ClientLifecycleActionsProps = {
  client: ClientDetailView;
};

type LifecycleDialogMode = "archive" | "restore" | null;

export function ClientLifecycleActions({ client }: ClientLifecycleActionsProps) {
  const router = useRouter();
  const [dialogMode, setDialogMode] = useState<LifecycleDialogMode>(null);
  const [note, setNote] = useState("");

  const mutation = useMutation({
    mutationFn: async (mode: Exclude<LifecycleDialogMode, null>) => {
      if (mode === "archive") {
        return archiveClientAction({
          clientId: client.id,
          note,
        });
      }

      return restoreClientAction({
        clientId: client.id,
        note: note || undefined,
      });
    },
    onSuccess: (result, mode) => {
      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success(mode === "archive" ? "Client archived." : "Client restored.");
      setDialogMode(null);
      setNote("");
      router.refresh();
    },
    onError: () => {
      toast.error("The client lifecycle action failed.");
    },
  });

  const resendMutation = useMutation({
    mutationFn: () => resendClientOnboardingAction({ clientId: client.id }),
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success("Onboarding email flow triggered.");
      router.refresh();
    },
    onError: () => {
      toast.error("The onboarding email could not be resent.");
    },
  });

  const canArchive = client.client.status !== "archived";
  const canRestore = client.client.status === "archived";
  const canResendOnboarding = Boolean(client.onboarding.ownerEmail && client.event.id);

  function submitLifecycleAction() {
    if (dialogMode === "archive" && !note.trim()) {
      toast.error("An archive note is required.");
      return;
    }

    if (!dialogMode) {
      return;
    }

    mutation.mutate(dialogMode);
  }

  return (
    <>
      <Alert>
        <AlertTitle>Secondary lifecycle actions</AlertTitle>
        <AlertDescription className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={!canResendOnboarding || resendMutation.isPending}
              onClick={() => resendMutation.mutate()}
            >
              {resendMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Resend onboarding
            </Button>

            {canArchive ? (
              <Button type="button" variant="outline" onClick={() => setDialogMode("archive")}>
                Archive client
              </Button>
            ) : null}

            {canRestore ? (
              <Button
                type="button"
                className="bg-rsvp-brand text-rsvp-brand-foreground hover:bg-rsvp-brand/90"
                onClick={() => setDialogMode("restore")}
              >
                Restore client
              </Button>
            ) : null}

            <Button type="button" variant="outline" disabled>
              Delete client
            </Button>
          </div>
        </AlertDescription>
      </Alert>

      <Alert className="border-amber-200 bg-amber-50 text-amber-900">
        <AlertTitle>Hard delete is deferred</AlertTitle>
        <AlertDescription>
          Paid clients and linked RSVP events must be retained for record integrity. This phase
          keeps deletion disabled and uses archive-only lifecycle control instead.
        </AlertDescription>
      </Alert>

      <Dialog
        open={dialogMode !== null}
        onOpenChange={(open) => setDialogMode(open ? dialogMode : null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "archive" ? "Archive client" : "Restore client"}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === "archive"
                ? "Archive keeps the record intact while removing it from the active lifecycle."
                : "Restore returns the client to the active or expired lifecycle based on current hosting coverage."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="client-lifecycle-note">
              {dialogMode === "archive" ? "Required note" : "Optional note"}
            </Label>
            <Textarea
              id="client-lifecycle-note"
              value={note}
              onChange={(event) => setNote(event.currentTarget.value)}
              placeholder={
                dialogMode === "archive"
                  ? "Explain why this client is being archived."
                  : "Optional note for the restore."
              }
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogMode(null)}>
              Back
            </Button>
            <Button
              type="button"
              disabled={mutation.isPending}
              className="bg-rsvp-brand text-rsvp-brand-foreground hover:bg-rsvp-brand/90"
              onClick={submitLifecycleAction}
            >
              {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              {dialogMode === "archive" ? "Archive client" : "Restore client"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
