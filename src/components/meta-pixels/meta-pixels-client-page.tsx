"use client";

import { type ColumnDef, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BadgeCheck,
  CreditCard,
  Globe2,
  Loader2,
  Plus,
  ServerCog,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import {
  deleteMetaPixelAction,
  saveMetaPixelAction,
  toggleMetaPixelAction,
} from "@/server/actions/meta-pixels";
import type {
  AdminMetaConversionItem,
  AdminMetaPixelItem,
  AdminMetaPixelsResult,
  AdminMetaPixelScope,
} from "@/server/queries/admin-pixels";
import { AdminDataTable } from "@/components/admin-data-table/admin-data-table";
import { ErrorState } from "@/components/feedback/error-state";
import { SectionCard } from "@/components/shared/section-card";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  ADMIN_META_PIXELS_QUERY_KEY,
  useMetaPixelsQuery,
} from "@/components/meta-pixels/use-meta-pixels-query";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

type MetaPixelsClientPageProps = {
  initialData: AdminMetaPixelsResult;
};

type PixelFormState = {
  eventId: string;
  isActive: boolean;
  name: string;
  notes: string;
  pixelId: string;
  trackingScope: AdminMetaPixelScope;
};

const EMPTY_FORM: PixelFormState = {
  eventId: "",
  isActive: true,
  name: "",
  notes: "",
  pixelId: "",
  trackingScope: "global_public",
};

const scopeOptions: Array<{ label: string; value: AdminMetaPixelScope }> = [
  { label: "Global / All public pages", value: "global_public" },
  { label: "Application page", value: "application" },
  { label: "RSVP event page", value: "event_page" },
  { label: "RSVP submitted / thank-you", value: "rsvp_submit" },
  { label: "Event-level", value: "event" },
  { label: "Disabled / draft", value: "disabled" },
];

export function MetaPixelsClientPage({ initialData }: MetaPixelsClientPageProps) {
  "use no memo";

  const queryClient = useQueryClient();
  const { data, error, isFetching } = useMetaPixelsQuery(initialData);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingPixel, setEditingPixel] = useState<AdminMetaPixelItem | null>(null);
  const [deletePixel, setDeletePixel] = useState<AdminMetaPixelItem | null>(null);
  const [form, setForm] = useState<PixelFormState>(EMPTY_FORM);
  const pixels = data?.pixels ?? [];
  const eventOptions = data?.eventOptions ?? initialData.eventOptions;
  const paidConversions = data?.paidConversions ?? initialData.paidConversions;
  const capi = data?.capi ?? initialData.capi;

  const saveMutation = useMutation({
    mutationFn: saveMetaPixelAction,
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success(editingPixel ? "Meta Pixel updated." : "Meta Pixel added.");
      setSheetOpen(false);
      setEditingPixel(null);
      setForm(EMPTY_FORM);
      void queryClient.invalidateQueries({ queryKey: ADMIN_META_PIXELS_QUERY_KEY });
    },
    onError: () => {
      toast.error("Meta Pixel could not be saved.");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: toggleMetaPixelAction,
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success(result.data.isActive ? "Meta Pixel enabled." : "Meta Pixel disabled.");
      void queryClient.invalidateQueries({ queryKey: ADMIN_META_PIXELS_QUERY_KEY });
    },
    onError: () => {
      toast.error("Meta Pixel status could not be updated.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMetaPixelAction,
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success("Meta Pixel deleted.");
      setDeletePixel(null);
      void queryClient.invalidateQueries({ queryKey: ADMIN_META_PIXELS_QUERY_KEY });
    },
    onError: () => {
      toast.error("Meta Pixel could not be deleted.");
    },
  });

  const columns = useMemo<ColumnDef<AdminMetaPixelItem>[]>(
    () => [
      {
        cell: ({ row }) => (
          <div className="min-w-0 space-y-1">
            <p className="truncate font-medium">{row.original.name}</p>
            <p className="text-muted-foreground truncate text-xs">
              Pixel ID {row.original.maskedPixelId}
            </p>
          </div>
        ),
        header: "Pixel",
        id: "pixel",
        meta: {
          cellClassName: "max-w-0 align-top whitespace-normal",
        },
      },
      {
        cell: ({ row }) => (
          <div className="min-w-0 space-y-1">
            <p className="text-sm">{row.original.trackingScopeLabel}</p>
            {row.original.eventLabel ? (
              <p className="text-muted-foreground truncate text-xs">{row.original.eventLabel}</p>
            ) : null}
          </div>
        ),
        header: "Browser Pixel Scope",
        id: "scope",
        meta: {
          cellClassName: "max-w-0 align-top whitespace-normal",
        },
      },
      {
        cell: ({ row }) => (
          <Badge variant={row.original.isActive ? "default" : "secondary"}>
            {row.original.isActive ? "Enabled" : "Disabled"}
          </Badge>
        ),
        header: "Status",
        id: "status",
        meta: {
          cellClassName: "align-top",
          className: "w-28",
        },
      },
      {
        cell: ({ row }) => (
          <p className="text-muted-foreground text-xs">{formatDateTime(row.original.updatedAt)}</p>
        ),
        header: "Updated",
        id: "updated",
        meta: {
          cellClassName: "align-top",
          className: "w-40",
        },
      },
      {
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => openEdit(row.original)}
            >
              Edit
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={toggleMutation.isPending}
              onClick={() =>
                toggleMutation.mutate({
                  isActive: !row.original.isActive,
                  pixelConfigId: row.original.id,
                })
              }
            >
              {row.original.isActive ? "Disable" : "Enable"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setDeletePixel(row.original)}
            >
              Delete
            </Button>
          </div>
        ),
        header: "Actions",
        id: "actions",
        meta: {
          cellClassName: "text-right align-top",
          className: "w-72 text-right",
        },
      },
    ],
    [toggleMutation],
  );

  const table = useReactTable({
    columns,
    data: pixels,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
  });

  function openCreate() {
    setEditingPixel(null);
    setForm(EMPTY_FORM);
    setSheetOpen(true);
  }

  function openEdit(pixel: AdminMetaPixelItem) {
    setEditingPixel(pixel);
    setForm({
      eventId: pixel.eventId ?? "",
      isActive: pixel.isActive,
      name: pixel.name,
      notes: pixel.notes ?? "",
      pixelId: pixel.pixelId,
      trackingScope: pixel.trackingScope,
    });
    setSheetOpen(true);
  }

  function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    saveMutation.mutate({
      eventId: form.trackingScope === "event" ? form.eventId || undefined : undefined,
      isActive: form.isActive,
      name: form.name,
      notes: form.notes || undefined,
      pixelConfigId: editingPixel?.id,
      pixelId: form.pixelId,
      trackingScope: form.trackingScope,
    });
  }

  return (
    <>
      <SectionCard
        title="How tracking works"
        description="Public page tracking stays in the browser. Mark as Paid Purchase tracking stays on the server."
      >
        <div className="grid gap-3 lg:grid-cols-[1.1fr_1.1fr_0.9fr]">
          <div className="bg-muted/30 rounded-xl border p-4">
            <div className="flex items-start gap-3">
              <div className="bg-background flex size-9 shrink-0 items-center justify-center rounded-full border">
                <Globe2 className="text-muted-foreground size-4" />
              </div>
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-semibold">Browser Pixel Scope</p>
                <p className="text-muted-foreground text-sm leading-5">
                  Injects the browser Pixel on selected public routes like <code>/apply</code> and
                  RSVP pages.
                </p>
              </div>
            </div>
          </div>
          <div className="bg-muted/30 rounded-xl border p-4">
            <div className="flex items-start gap-3">
              <div className="bg-background flex size-9 shrink-0 items-center justify-center rounded-full border">
                <ServerCog className="text-muted-foreground size-4" />
              </div>
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-semibold">Mark as Paid via CAPI</p>
                <p className="text-muted-foreground text-sm leading-5">
                  Paid confirmations can send a server-side Purchase event after payment succeeds.
                </p>
              </div>
            </div>
          </div>
          <div className="bg-muted/30 rounded-xl border p-4">
            <div className="flex items-start gap-3">
              <div className="bg-background flex size-9 shrink-0 items-center justify-center rounded-full border">
                <ShieldCheck className="text-muted-foreground size-4" />
              </div>
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-semibold">Non-blocking delivery</p>
                <p className="text-muted-foreground text-sm leading-5">
                  CAPI failures do not undo payment confirmation and tokens remain server-only.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-muted/25 mt-3 rounded-xl border p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <BadgeCheck className="text-muted-foreground size-4" />
                <p className="text-sm font-medium">CAPI readiness</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusBadge tone={capi.hasAccessToken ? "success" : "muted"}>
                  {capi.hasAccessToken ? "Token available" : "No token"}
                </StatusBadge>
                <StatusBadge tone={capi.hasEligiblePixelSource ? "success" : "muted"}>
                  {capi.hasEligiblePixelSource ? "Pixel source ready" : "No pixel source"}
                </StatusBadge>
                <StatusBadge tone={capi.isReady ? "success" : "warning"}>
                  {capi.isReady ? "Purchase ready" : "Purchase not configured"}
                </StatusBadge>
              </div>
            </div>
            <div className="text-muted-foreground grid gap-1.5 text-sm leading-5 lg:max-w-md">
              <p>Browser Pixel Scope only controls public-page script injection.</p>
              <p>Mark as Paid conversions run server-side through CAPI when configured.</p>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Pixel configurations"
        description="Store public tracking configuration only. Browser Pixel scripts are never fired from admin pages."
        actions={
          <Button
            type="button"
            className="bg-rsvp-brand text-rsvp-brand-foreground hover:bg-rsvp-brand/90"
            onClick={openCreate}
          >
            <Plus className="size-4" />
            Add Pixel
          </Button>
        }
      >
        <div className="space-y-3">
          {error ? (
            <ErrorState
              title="Meta Pixels could not be loaded"
              description="Refresh the page or try again."
            />
          ) : null}

          {isFetching ? (
            <div className="text-muted-foreground flex items-center justify-end gap-2 text-xs">
              <Loader2 className="size-3.5 animate-spin" />
              Refreshing pixels
            </div>
          ) : null}

          <AdminDataTable
            colSpan={5}
            emptyState={{
              description: "Add the first Meta Pixel configuration for public tracking routes.",
              title: "No Meta Pixels configured",
            }}
            table={table}
          />
        </div>
      </SectionCard>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
          <form className="flex min-h-full flex-col gap-6" onSubmit={submitForm}>
            <SheetHeader>
              <SheetTitle>{editingPixel ? "Edit Meta Pixel" : "Add Meta Pixel"}</SheetTitle>
              <SheetDescription>
                Configure Browser Pixel Scope for public pages. Mark as Paid conversions are handled
                server-side through CAPI when enabled.
              </SheetDescription>
            </SheetHeader>

            <div className="grid flex-1 gap-5 px-4">
              <div className="space-y-2">
                <Label htmlFor="meta-pixel-name">Pixel name</Label>
                <Input
                  id="meta-pixel-name"
                  value={form.name}
                  onChange={(event) => setFormValue("name", event.currentTarget.value)}
                  placeholder="WebSerbisyo RSVP main pixel"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="meta-pixel-id">Pixel ID</Label>
                <Input
                  id="meta-pixel-id"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={form.pixelId}
                  onChange={(event) => setFormValue("pixelId", event.currentTarget.value)}
                  placeholder="123456789012345"
                  required
                />
                <p className="text-muted-foreground text-xs">
                  Numeric Meta Pixel or dataset ID. Full ID is only shown in this sheet.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Browser Pixel Scope</Label>
                <Select
                  value={form.trackingScope}
                  onValueChange={(value) => {
                    const trackingScope = value as AdminMetaPixelScope;
                    setForm((current) => ({
                      ...current,
                      eventId: trackingScope === "event" ? current.eventId : "",
                      trackingScope,
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose scope" />
                  </SelectTrigger>
                  <SelectContent>
                    {scopeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-muted-foreground text-xs">
                  Controls where the browser Pixel script is injected on public pages. Mark as Paid
                  conversions are handled server-side through CAPI.
                </p>
              </div>

              {form.trackingScope === "event" ? (
                <div className="space-y-2">
                  <Label>Event</Label>
                  <Select
                    value={form.eventId || "__none"}
                    onValueChange={(value) =>
                      setFormValue("eventId", value === "__none" ? "" : value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose event" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none">Choose an event</SelectItem>
                      {eventOptions.map((eventOption) => (
                        <SelectItem key={eventOption.id} value={eventOption.id}>
                          {eventOption.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}

              <div className="flex items-center justify-between rounded-lg border px-4 py-3">
                <div className="space-y-1">
                  <Label htmlFor="meta-pixel-enabled">Enabled</Label>
                  <p className="text-muted-foreground text-xs">
                    Disabled pixels stay saved but will not be injected.
                  </p>
                </div>
                <Switch
                  id="meta-pixel-enabled"
                  checked={form.isActive}
                  onCheckedChange={(checked) => setFormValue("isActive", checked)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="meta-pixel-notes">Notes</Label>
                <Textarea
                  id="meta-pixel-notes"
                  value={form.notes}
                  onChange={(event) => setFormValue("notes", event.currentTarget.value)}
                  placeholder="Internal setup notes"
                />
              </div>
            </div>

            <SheetFooter>
              <Button type="button" variant="outline" onClick={() => setSheetOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saveMutation.isPending}
                className="bg-rsvp-brand text-rsvp-brand-foreground hover:bg-rsvp-brand/90"
              >
                {saveMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                {editingPixel ? "Save changes" : "Add Pixel"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={Boolean(deletePixel)}
        onOpenChange={(open) => !open && setDeletePixel(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Meta Pixel?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the saved tracking configuration. It does not delete anything in Meta
              Events Manager.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deletePixel &&
                deleteMutation.mutate({
                  pixelConfigId: deletePixel.id,
                })
              }
            >
              Delete Pixel
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <SectionCard
        title="Paid Conversion Records"
        description="Recent paid confirmations tied to server-side Purchase conversion readiness."
      >
        {paidConversions.length > 0 ? (
          <div className="overflow-hidden rounded-lg border">
            <div className="max-h-[24rem] overflow-auto">
              <Table className="min-w-[860px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[26%]">Client</TableHead>
                    <TableHead className="w-[16%]">Package</TableHead>
                    <TableHead className="w-[12%]">Amount</TableHead>
                    <TableHead className="w-[14%]">Payment Method</TableHead>
                    <TableHead className="w-[16%]">Confirmed At</TableHead>
                    <TableHead className="w-[10%]">Payment Status</TableHead>
                    <TableHead className="w-[12%]">CAPI Status</TableHead>
                    <TableHead className="w-[8%] text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paidConversions.map((conversion) => (
                    <TableRow key={conversion.id}>
                      <TableCell className="align-middle">
                        <p className="max-w-[20rem] truncate font-medium">{conversion.clientName}</p>
                      </TableCell>
                      <TableCell className="align-middle">
                        <span className="text-sm">{conversion.packageLabel}</span>
                      </TableCell>
                      <TableCell className="align-middle whitespace-nowrap font-medium">
                        {formatCurrency(conversion.amount)}
                      </TableCell>
                      <TableCell className="align-middle">
                        <Badge
                          variant="outline"
                          className={getPaymentMethodBadgeClass(conversion.paymentMethodLabel)}
                        >
                          <CreditCard className="size-3.5" />
                          {conversion.paymentMethodLabel}
                        </Badge>
                      </TableCell>
                      <TableCell className="align-middle whitespace-nowrap text-sm">
                        {formatDateTime(conversion.confirmedAt)}
                      </TableCell>
                      <TableCell className="align-middle">
                        <StatusBadge tone={getPaymentTone(conversion.paymentStatusLabel)}>
                          {conversion.paymentStatusLabel}
                        </StatusBadge>
                      </TableCell>
                      <TableCell className="align-middle">
                        <StatusBadge tone={getCapiTone(conversion.capiStatus)}>
                          {conversion.capiStatusLabel}
                        </StatusBadge>
                      </TableCell>
                      <TableCell className="text-right align-middle">
                        <Button asChild size="sm" variant="outline">
                          <Link href={conversion.href}>View</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : (
          <div className="text-muted-foreground rounded-lg border border-dashed p-6 text-sm">
            Paid confirmations will appear here after the next successful Mark as Paid action.
          </div>
        )}
      </SectionCard>
    </>
  );

  function setFormValue<TKey extends keyof PixelFormState>(key: TKey, value: PixelFormState[TKey]) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(new Date(value));
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-PH", {
    currency: "PHP",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

function getCapiTone(
  status: AdminMetaConversionItem["capiStatus"],
): "danger" | "muted" | "success" | "warning" {
  switch (status) {
    case "sent":
      return "success";
    case "failed":
      return "danger";
    case "not_configured":
      return "muted";
    case "skipped":
    case "unknown":
    default:
      return "warning";
  }
}

function getPaymentTone(statusLabel: string): "danger" | "muted" | "success" | "warning" {
  switch (statusLabel) {
    case "Paid":
      return "success";
    case "Refunded":
      return "muted";
    case "Cancelled":
      return "muted";
    case "Failed":
      return "danger";
    case "Pending":
    default:
      return "warning";
  }
}

function getPaymentMethodBadgeClass(label: string) {
  switch (label) {
    case "GCash":
      return "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-200";
    case "Maya":
      return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200";
    case "Bank Transfer":
      return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200";
    default:
      return "border-border bg-muted/40 text-foreground";
  }
}
