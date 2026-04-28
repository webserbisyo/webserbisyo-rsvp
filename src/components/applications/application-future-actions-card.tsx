import { Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function ApplicationFutureActionsCard() {
  return (
    <Alert>
      <Info className="size-4" />
      <AlertTitle>Workflow actions are not available on this screen yet</AlertTitle>
      <AlertDescription>
        This view is currently limited to application review and linked-record checks while the next
        admin workflow phase is prepared.
      </AlertDescription>
    </Alert>
  );
}
