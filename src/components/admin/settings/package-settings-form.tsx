"use client";

import { useMutation } from "@tanstack/react-query";
import { Loader2, Save } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { AdminPackageSettingsView } from "@/server/queries/platform-package-settings";
import { savePackageSettingsAction } from "@/server/actions/admin-settings";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

type PackageSettingsFormProps = {
  initialData: AdminPackageSettingsView;
};

type PlanSettingsFormValues = {
  defaultAmount: string;
  defaultHostingDays: string;
  isActive: boolean;
  renewalNoticeDays: string;
};

type PackageSettingsFormValues = {
  max: PlanSettingsFormValues;
  pro: PlanSettingsFormValues;
};

export function PackageSettingsForm({ initialData }: PackageSettingsFormProps) {
  const router = useRouter();
  const {
    control,
    handleSubmit,
    register,
    setError,
    formState: { errors },
  } = useForm<PackageSettingsFormValues>({
    defaultValues: {
      max: {
        defaultAmount: initialData.max.defaultAmount?.toString() ?? "",
        defaultHostingDays: initialData.max.defaultHostingDays?.toString() ?? "",
        isActive: initialData.max.isActive,
        renewalNoticeDays: initialData.max.renewalNoticeDays?.toString() ?? "",
      },
      pro: {
        defaultAmount: initialData.pro.defaultAmount?.toString() ?? "",
        defaultHostingDays: initialData.pro.defaultHostingDays?.toString() ?? "",
        isActive: initialData.pro.isActive,
        renewalNoticeDays: initialData.pro.renewalNoticeDays?.toString() ?? "",
      },
    },
  });

  const mutation = useMutation({
    mutationFn: savePackageSettingsAction,
    onSuccess: (result) => {
      if (!result.ok) {
        assignServerErrors(result.fieldErrors);
        toast.error(result.error);
        return;
      }

      toast.success("Package settings saved.");
      router.refresh();
    },
    onError: () => {
      toast.error("Package settings could not be saved.");
    },
  });

  function assignServerErrors(fieldErrors: Record<string, string[] | undefined> | undefined) {
    if (!fieldErrors) {
      return;
    }

    Object.entries(fieldErrors).forEach(([field, messages]) => {
      if (!messages?.[0]) {
        return;
      }

      setError(field as never, {
        message: messages[0],
        type: "server",
      });
    });
  }

  const onSubmit = handleSubmit((values) => {
    mutation.mutate(values);
  });

  return (
    <form className="space-y-6" onSubmit={onSubmit}>
      <div className="grid gap-6 xl:grid-cols-2">
        <PlanSettingsCard
          control={control}
          errors={
            errors.pro as
              | Partial<Record<keyof PlanSettingsFormValues, { message?: string }>>
              | undefined
          }
          planKey="pro"
          register={register}
          title="Pro defaults"
        />
        <PlanSettingsCard
          control={control}
          errors={
            errors.max as
              | Partial<Record<keyof PlanSettingsFormValues, { message?: string }>>
              | undefined
          }
          planKey="max"
          register={register}
          title="Max defaults"
        />
      </div>

      <Alert className="rounded-3xl">
        <AlertTitle>Workflow dependency</AlertTitle>
        <AlertDescription>
          Applications can only be approved and manual payments can only be confirmed after these
          pricing and access defaults are configured for the plan in use.
        </AlertDescription>
      </Alert>

      <div className="flex justify-end">
        <Button
          type="submit"
          size="lg"
          disabled={mutation.isPending}
          className="bg-rsvp-brand text-rsvp-brand-foreground hover:bg-rsvp-brand/90"
        >
          {mutation.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          {mutation.isPending ? "Saving..." : "Save package settings"}
        </Button>
      </div>
    </form>
  );
}

function PlanSettingsCard({
  control,
  errors,
  planKey,
  register,
  title,
}: {
  control: ReturnType<typeof useForm<PackageSettingsFormValues>>["control"];
  errors: Partial<Record<keyof PlanSettingsFormValues, { message?: string }>> | undefined;
  planKey: "pro" | "max";
  register: ReturnType<typeof useForm<PackageSettingsFormValues>>["register"];
  title: string;
}) {
  return (
    <Card className="rsvp-panel border-border/70 rounded-3xl">
      <CardHeader className="space-y-2">
        <CardTitle className="text-xl">{title}</CardTitle>
        <p className="text-muted-foreground text-sm leading-6">
          These defaults power pending manual payments and the RSVP website access window after
          confirmation.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between rounded-2xl border px-4 py-3">
          <div className="space-y-1">
            <p className="text-sm font-medium">Plan active</p>
            <p className="text-muted-foreground text-xs">
              Inactive plans cannot be approved for payment.
            </p>
          </div>
          <Controller
            control={control}
            name={`${planKey}.isActive`}
            render={({ field }) => (
              <Switch checked={field.value} onCheckedChange={field.onChange} aria-label={title} />
            )}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${planKey}-defaultAmount`}>Default amount (PHP)</Label>
          <Input
            id={`${planKey}-defaultAmount`}
            inputMode="decimal"
            placeholder="12000"
            {...register(`${planKey}.defaultAmount`, { required: true })}
          />
          {errors?.defaultAmount?.message ? (
            <p className="text-destructive text-sm">{errors.defaultAmount.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${planKey}-defaultHostingDays`}>Default access days</Label>
          <Input
            id={`${planKey}-defaultHostingDays`}
            inputMode="numeric"
            placeholder="90"
            {...register(`${planKey}.defaultHostingDays`, { required: true })}
          />
          {errors?.defaultHostingDays?.message ? (
            <p className="text-destructive text-sm">{errors.defaultHostingDays.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${planKey}-renewalNoticeDays`}>Access ending notice days</Label>
          <Input
            id={`${planKey}-renewalNoticeDays`}
            inputMode="numeric"
            placeholder="14"
            {...register(`${planKey}.renewalNoticeDays`, { required: true })}
          />
          {errors?.renewalNoticeDays?.message ? (
            <p className="text-destructive text-sm">{errors.renewalNoticeDays.message}</p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
