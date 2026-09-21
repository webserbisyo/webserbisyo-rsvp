"use client";

import { Shield } from "lucide-react";
import { stopClientImpersonationAction } from "@/server/actions/admin-impersonation";
import { Button } from "@/components/ui/button";

type ImpersonationBannerProps = {
  clientId: string;
  clientName: string;
};

export function ImpersonationBanner({ clientId, clientName }: ImpersonationBannerProps) {
  return (
    <div className="sticky top-0 z-50 flex items-center justify-between gap-3 bg-amber-500 px-4 py-2 text-slate-950 shadow-md">
      <div className="flex min-w-0 items-center gap-2">
        <Shield className="size-4 shrink-0" />
        <span className="truncate text-xs font-bold sm:text-sm">
          Viewing as <strong>{clientName}</strong> — Super Admin Masquerade Mode. All edits affect
          production.
        </span>
      </div>
      <form
        action={async () => {
          await stopClientImpersonationAction(clientId);
        }}
      >
        <Button
          className="shrink-0 rounded-lg bg-slate-950 px-3 py-1 text-xs font-bold text-white hover:bg-slate-800"
          size="sm"
          type="submit"
        >
          Exit to Admin
        </Button>
      </form>
    </div>
  );
}
