import { ShieldAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type PermissionDeniedProps = {
  description?: string;
  title?: string;
};

export function PermissionDenied({
  description = "Your account does not have access to this admin area.",
  title = "Permission denied",
}: PermissionDeniedProps) {
  return (
    <Alert>
      <ShieldAlert className="size-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
    </Alert>
  );
}
