import { TriangleAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type ErrorStateProps = {
  description?: string;
  title?: string;
};

export function ErrorState({
  description = "The request could not be completed. Try again after checking the connection.",
  title = "Something went wrong",
}: ErrorStateProps) {
  return (
    <Alert variant="destructive">
      <TriangleAlert className="size-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
    </Alert>
  );
}
