import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthConfirmClient } from "@/components/auth/auth-confirm-client";
import { Loader2 } from "lucide-react";

export default function AuthConfirmPage() {
  return (
    <AuthShell
      title="Security Verification"
      description="Verify your secure link to access your WebSerbisyo RSVP dashboard."
    >
      <Suspense
        fallback={
          <div className="flex items-center justify-center p-8 text-sm text-white/70">
            <Loader2 className="mr-2 size-4 animate-spin" />
            Loading security check…
          </div>
        }
      >
        <AuthConfirmClient />
      </Suspense>
    </AuthShell>
  );
}
