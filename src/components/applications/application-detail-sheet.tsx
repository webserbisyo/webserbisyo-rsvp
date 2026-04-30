"use client";

import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import type { ApplicationDetailView } from "@/server/queries/admin-applications";
import {
  approveApplicationAction,
  rejectAndDeleteApplicationAction,
} from "@/server/actions/admin-applications";
import { ADMIN_APPLICATIONS_QUERY_KEY } from "@/components/applications/use-applications-query";
import {
  ApplicationPlanBadge,
  ApplicationStatusBadge,
  PaymentPreferenceBadge,
} from "@/components/applications/application-badges";
import { ErrorState } from "@/components/feedback/error-state";
import { SectionCard } from "@/components/shared/section-card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

type ApplicationDetailSheetProps = {
  application: ApplicationDetailView | null;
  open: boolean;
};

export function ApplicationDetailSheet({ application, open }: ApplicationDetailSheetProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);

  const closeSheetHref = buildSheetHref(pathname, searchParams.toString(), null);

  const approveMutation = useMutation({
    mutationFn: approveApplicationAction,
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      if (result.data.warnings.length > 0) {
        toast.warning(result.data.warnings[0]);
      }

      toast.success("Application approved. Client workspace created.");
      void queryClient.invalidateQueries({ queryKey: ADMIN_APPLICATIONS_QUERY_KEY });
      router.push(result.data.href, { scroll: false });
    },
    onError: () => {
      toast.error("Could not approve this application. Client provisioning failed.");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: rejectAndDeleteApplicationAction,
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      if (result.data.warnings.length > 0) {
        toast.warning(result.data.warnings[0]);
      }

      toast.success("Application deleted from the queue.");
      setDeleteConfirmation("");
      setRejectDialogOpen(false);

      void queryClient.invalidateQueries({ queryKey: ADMIN_APPLICATIONS_QUERY_KEY });
      router.replace(closeSheetHref, { scroll: false });
    },
    onError: () => {
      toast.error("The application could not be deleted.");
    },
  });

  const canApproveOrReject =
    application !== null &&
    (application.review.status === "submitted" || application.review.status === "reviewing");

  function handleApprove() {
    if (!application) {
      return;
    }

    approveMutation.mutate({
      applicationId: application.id,
    });
  }

  function handleReject() {
    if (!application) {
      return;
    }

    rejectMutation.mutate({
      applicationId: application.id,
      confirmation: deleteConfirmation,
    });
  }

  return (
    <>
      <Sheet
        open={open}
        onOpenChange={(nextOpen) =>
          !nextOpen ? router.replace(closeSheetHref, { scroll: false }) : null
        }
      >
        <SheetContent className="w-full overflow-y-auto sm:max-w-2xl lg:max-w-3xl">
          <SheetHeader className="space-y-2 border-b px-6 pt-6 pr-16 pb-5">
            <SheetTitle>Application Details</SheetTitle>
            <SheetDescription>
              Review the request, then approve it into Clients or remove it from the queue.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-5 px-6 py-6">
            {!application ? (
              <ErrorState
                title="Application could not be loaded"
                description="Close this panel and try again."
              />
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
                  <ApplicationStatusBadge
                    label={application.review.statusLabel}
                    status={application.review.status}
                  />
                  <ApplicationPlanBadge
                    label={application.plan.preferredPlanLabel}
                    plan={application.plan.preferredPlan}
                  />
                  <PaymentPreferenceBadge
                    label={application.plan.preferredManualPaymentOptionLabel}
                    paymentPreference={application.plan.preferredManualPaymentOption}
                  />
                </div>

                <SectionCard
                  title="Decision"
                  description="Approve creates the client workspace and moves the application into Clients. Reject permanently deletes the application after explicit confirmation."
                  className="rounded-xl"
                >
                  {canApproveOrReject ? (
                    <div className="flex flex-wrap gap-3">
                      <Button
                        type="button"
                        className="bg-rsvp-brand text-rsvp-brand-foreground hover:bg-rsvp-brand/90"
                        disabled={approveMutation.isPending || rejectMutation.isPending}
                        onClick={handleApprove}
                      >
                        {approveMutation.isPending ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : null}
                        Approve
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        disabled={approveMutation.isPending || rejectMutation.isPending}
                        onClick={() => setRejectDialogOpen(true)}
                      >
                        Reject
                      </Button>
                    </div>
                  ) : application.linkedRecords.clientId ? (
                    <div className="space-y-3">
                      <p className="text-muted-foreground text-sm leading-6">
                        This application has already been approved and provisioned.
                      </p>
                      <Button asChild type="button" variant="outline">
                        <Link href={`/admin/clients/${application.linkedRecords.clientId}`}>
                          View client
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm leading-6">
                      This application is no longer actionable from the inbox.
                    </p>
                  )}
                </SectionCard>

                <SectionCard title="Applicant Summary" className="rounded-xl">
                  <DefinitionList
                    rows={[
                      ["Name", application.applicant.fullName],
                      ["Email", application.applicant.email],
                      ["Phone", application.applicant.phone ?? "—"],
                    ]}
                  />
                </SectionCard>

                <SectionCard title="Event Request" className="rounded-xl">
                  <DefinitionList
                    rows={[
                      ["Event type", application.event.type],
                      ["Event date", formatDate(application.event.date)],
                      ["Location", application.event.location ?? "—"],
                      [
                        "Estimated guest count",
                        application.event.estimatedGuestCount
                          ? String(application.event.estimatedGuestCount)
                          : "—",
                      ],
                    ]}
                  />
                  <Separator className="my-5" />
                  <div className="space-y-2">
                    <p className="text-muted-foreground text-xs font-medium">Message / notes</p>
                    <p className="text-sm leading-6 break-words">
                      {application.event.message ?? "—"}
                    </p>
                  </div>
                </SectionCard>

                <SectionCard title="Plan and Payment Preference" className="rounded-xl">
                  <DefinitionList
                    rows={[
                      [
                        "Package",
                        <ApplicationPlanBadge
                          key="package"
                          label={application.plan.preferredPlanLabel}
                          plan={application.plan.preferredPlan}
                        />,
                      ],
                      [
                        "Payment preference",
                        <PaymentPreferenceBadge
                          key="payment-preference"
                          label={application.plan.preferredManualPaymentOptionLabel}
                          paymentPreference={application.plan.preferredManualPaymentOption}
                        />,
                      ],
                    ]}
                  />
                </SectionCard>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject and delete application?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this application from the queue.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-2">
            <p className="text-sm font-medium">Type DELETE to confirm.</p>
            <Input
              value={deleteConfirmation}
              onChange={(event) => setDeleteConfirmation(event.currentTarget.value)}
              placeholder="DELETE"
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setDeleteConfirmation("");
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteConfirmation !== "DELETE" || rejectMutation.isPending}
              onClick={(event) => {
                event.preventDefault();
                handleReject();
              }}
            >
              {rejectMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Delete application
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function DefinitionList({ rows }: { rows: Array<[string, ReactNode]> }) {
  return (
    <dl className="grid gap-4">
      {rows.map(([label, value]) => (
        <div key={label} className="grid gap-2 sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-3">
          <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            {label}
          </dt>
          <dd className="min-w-0 text-sm leading-6 break-words">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function formatDate(value: string | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeZone: "Asia/Manila",
  }).format(new Date(`${value}T00:00:00.000Z`));
}

function buildSheetHref(pathname: string, currentSearch: string, applicationId: string | null) {
  const params = new URLSearchParams(currentSearch);

  if (applicationId) {
    params.set("applicationId", applicationId);
  } else {
    params.delete("applicationId");
  }

  const queryString = params.toString();
  return queryString ? `${pathname}?${queryString}` : pathname;
}
