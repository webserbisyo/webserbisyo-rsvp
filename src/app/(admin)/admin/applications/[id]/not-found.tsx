import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageContainer } from "@/components/app-shell/page-container";
import { EmptyState } from "@/components/feedback/empty-state";
import { Button } from "@/components/ui/button";

export default function AdminApplicationNotFound() {
  return (
    <PageContainer>
      <EmptyState
        title="Application not found"
        description="The application may have been removed or the ID may be incorrect."
        action={
          <Button asChild variant="outline">
            <Link href="/admin/applications">
              <ArrowLeft className="size-4" />
              Back to applications
            </Link>
          </Button>
        }
      />
    </PageContainer>
  );
}
