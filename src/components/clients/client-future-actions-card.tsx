import { Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function ClientFutureActionsCard() {
  return (
    <Alert>
      <Info className="size-4" />
      <AlertTitle>Client lifecycle actions are coming later</AlertTitle>
      <AlertDescription>
        Archive, restore, renewal, resend onboarding, edit slug, and delete-after-retention
        workflows will be added in later admin phases.
      </AlertDescription>
    </Alert>
  );
}
