"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { ADMIN_CLIENTS_QUERY_KEY } from "@/components/clients/use-clients-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteClientsPermanentlyAction } from "@/server/actions/admin-clients";
import type { PermanentDeleteResult } from "@/server/services/admin-workflow/permanent-client-deletion";

type DeleteTarget = { id: string; name: string };

type PermanentClientDeleteDialogProps = {
  clients: DeleteTarget[];
  onOpenChange: (open: boolean) => void;
  onResult?: (result: PermanentDeleteResult) => void;
  open: boolean;
};

export function PermanentClientDeleteDialog({
  clients,
  onOpenChange,
  onResult,
  open,
}: PermanentClientDeleteDialogProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [confirmation, setConfirmation] = useState("");
  const [announcement, setAnnouncement] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      deleteClientsPermanentlyAction({
        clientIds: clients.map((client) => client.id),
        confirmation,
      }),
    onSuccess: async (actionResult) => {
      if (!actionResult.ok) {
        setAnnouncement(actionResult.error);
        toast.error(actionResult.error);
        return;
      }

      const result = actionResult.data;
      const summary = buildResultSummary(result);
      const details = result.failed
        .slice(0, 3)
        .map((failure) => {
          const name = clients.find((client) => client.id === failure.clientId)?.name ?? "Client";
          return `${name}: ${formatStage(failure.stage)}.`;
        })
        .join(" ");

      setAnnouncement(details ? `${summary} ${details}` : summary);
      if (result.failed.length > 0) toast.error(summary, { description: details });
      else toast.success(summary);

      onResult?.(result);
      setConfirmation("");
      await queryClient.invalidateQueries({ queryKey: ADMIN_CLIENTS_QUERY_KEY });
      router.refresh();

      if (result.failed.length === 0) onOpenChange(false);
    },
    onError: () => {
      const message = "Permanent deletion could not be completed.";
      setAnnouncement(message);
      toast.error(message);
    },
  });

  const isValid = confirmation.trim() === "DELETE";
  const preview = clients.slice(0, 3);
  const remaining = Math.max(0, clients.length - preview.length);

  function handleOpenChange(nextOpen: boolean) {
    if (!mutation.isPending) {
      setConfirmation("");
      setAnnouncement("");
      onOpenChange(nextOpen);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isValid && !mutation.isPending && clients.length > 0) mutation.mutate();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="w-[calc(100%-2rem)] max-w-md"
        onEscapeKeyDown={(event) => {
          if (mutation.isPending) event.preventDefault();
        }}
        onInteractOutside={(event) => {
          if (mutation.isPending) event.preventDefault();
        }}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <DialogHeader>
            <DialogTitle>
              {clients.length === 1 ? "Delete client" : "Delete selected clients"}
            </DialogTitle>
            <DialogDescription>
              This permanently deletes the selected {clients.length === 1 ? "client" : "clients"},
              their RSVP websites, linked records, and login accounts. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border px-3 py-2.5 text-sm">
            <p className="font-medium">Selected: {clients.length}</p>
            <div className="text-muted-foreground mt-1 space-y-0.5">
              {preview.map((client) => (
                <p className="truncate" key={client.id}>
                  {client.name}
                </p>
              ))}
              {remaining > 0 ? <p>+{remaining} more</p> : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="permanent-client-delete-confirmation">Type DELETE to confirm</Label>
            <Input
              autoFocus
              autoComplete="off"
              disabled={mutation.isPending}
              id="permanent-client-delete-confirmation"
              value={confirmation}
              onChange={(event) => setConfirmation(event.currentTarget.value)}
            />
          </div>

          <p aria-live="polite" className="sr-only">
            {announcement}
          </p>

          <DialogFooter className="gap-2 max-sm:flex-col-reverse sm:gap-0">
            <Button
              className="max-sm:w-full"
              disabled={mutation.isPending}
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              className="max-sm:w-full"
              disabled={!isValid || mutation.isPending || clients.length === 0}
              type="submit"
              variant="destructive"
            >
              {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              {mutation.isPending ? "Deleting…" : "Delete permanently"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function buildResultSummary(result: PermanentDeleteResult) {
  if (result.failed.length === 0) {
    return `${result.succeeded.length} client${result.succeeded.length === 1 ? "" : "s"} permanently deleted.`;
  }

  return `${result.succeeded.length} of ${result.total} clients were permanently deleted. ${result.failed.length} failed.`;
}

function formatStage(stage: PermanentDeleteResult["failed"][number]["stage"]) {
  switch (stage) {
    case "storage_delete":
      return "storage cleanup failed";
    case "auth_delete":
      return "login-account deletion failed";
    case "database_purge":
      return "database cleanup failed";
    case "verification":
      return "deletion verification failed";
    case "not_found":
      return "client was not found";
    case "lookup":
      return "client lookup failed";
  }
}
