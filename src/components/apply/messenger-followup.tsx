"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Copy, MessageCircleMore } from "lucide-react";
import { toast } from "sonner";
import { buildMessengerContinueUrl } from "@/lib/apply/messenger";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type MessengerFollowupProps = {
  message: string;
  messengerPageUrl: string | null;
};

export function MessengerFollowup({ message, messengerPageUrl }: MessengerFollowupProps) {
  const continueUrl = useMemo(
    () => buildMessengerContinueUrl(messengerPageUrl),
    [messengerPageUrl],
  );

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(message);
      toast.success("Follow-up message copied.");
    } catch {
      toast.error("Could not copy the follow-up message.");
    }
  }

  return (
    <Card className="rsvp-panel-muted border-border/70 rounded-3xl">
      <CardHeader className="space-y-2">
        <CardTitle className="text-xl">Messenger follow-up</CardTitle>
        <p className="text-muted-foreground text-sm leading-6">
          Copy the message below before switching to Messenger so your reference is easy to share.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <pre className="border-border/70 bg-background text-foreground overflow-x-auto rounded-2xl border px-4 py-4 text-sm leading-6 whitespace-pre-wrap">
          {message}
        </pre>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            onClick={() => void copyMessage()}
            className="bg-rsvp-brand text-rsvp-brand-foreground hover:bg-rsvp-brand/90"
          >
            <Copy className="size-4" />
            Copy follow-up message
          </Button>
          {continueUrl ? (
            <Button asChild type="button" variant="outline">
              <Link href={continueUrl} target="_blank" rel="noreferrer">
                Continue on Messenger
                <MessageCircleMore className="size-4" />
              </Link>
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
