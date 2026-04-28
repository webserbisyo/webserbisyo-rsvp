"use client";

import { useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { AdminPaymentOptionsView } from "@/server/queries/platform-payment-options";
import { savePaymentOptionsAction } from "@/server/actions/payment-options";
import {
  type PaymentOptionsFormInput,
  PaymentOptionsSchema,
} from "@/lib/validations/payment-options.schema";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PaymentOptionSection } from "./payment-option-section";

type PaymentOptionsFormProps = {
  initialData: AdminPaymentOptionsView;
};

export function PaymentOptionsForm({ initialData }: PaymentOptionsFormProps) {
  const [isPending, startTransition] = useTransition();
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    setError,
    setValue,
  } = useForm<PaymentOptionsFormInput>({
    resolver: zodResolver(PaymentOptionsSchema),
    defaultValues: {
      gcash: {
        accountName: initialData.gcash.accountName,
        accountNumber: initialData.gcash.accountNumber,
        isEnabled: initialData.gcash.isEnabled,
        qrImagePath: initialData.gcash.qrImagePath ?? undefined,
      },
      maya: {
        accountName: initialData.maya.accountName,
        accountNumber: initialData.maya.accountNumber,
        isEnabled: initialData.maya.isEnabled,
        qrImagePath: initialData.maya.qrImagePath ?? undefined,
      },
      messengerPageUrl: initialData.messengerPageUrl,
    },
  });

  function assignServerFieldErrors(fieldErrors: Record<string, string[] | undefined> | undefined) {
    if (!fieldErrors) {
      return;
    }

    Object.entries(fieldErrors).forEach(([field, messages]) => {
      if (!messages?.[0]) {
        return;
      }

      setError(field as keyof PaymentOptionsFormInput, {
        message: messages[0],
        type: "server",
      });
    });
  }

  const submit = handleSubmit((values) => {
    startTransition(async () => {
      const result = await savePaymentOptionsAction(values);

      if (!result.ok) {
        assignServerFieldErrors(result.fieldErrors);
        toast.error(
          result.error === "The request could not be completed."
            ? "Could not save payment settings."
            : result.error,
        );
        return;
      }

      toast.success("Manual payment settings saved.");
    });
  });

  return (
    <form className="space-y-6" onSubmit={submit}>
      <Card className="rsvp-panel border-border/70 rounded-3xl">
        <CardHeader className="space-y-2">
          <CardTitle className="text-xl">Public follow-up settings</CardTitle>
          <p className="text-muted-foreground text-sm leading-6">
            This Messenger URL is used across the public apply landing, success state, and manual
            payment follow-up prompts.
          </p>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label htmlFor="messengerPageUrl">Messenger page URL</Label>
          <Input
            id="messengerPageUrl"
            placeholder="https://m.me/yourpage"
            {...register("messengerPageUrl")}
          />
          {errors.messengerPageUrl?.message ? (
            <p className="text-destructive text-sm">{errors.messengerPageUrl.message}</p>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <PaymentOptionSection
          provider="gcash"
          title="GCash"
          control={control}
          errors={errors}
          existingImageUrl={initialData.gcash.qrImageUrl}
          register={register}
          setValue={setValue}
        />
        <PaymentOptionSection
          provider="maya"
          title="Maya"
          control={control}
          errors={errors}
          existingImageUrl={initialData.maya.qrImageUrl}
          register={register}
          setValue={setValue}
        />
      </div>

      {(errors.gcash || errors.maya) && !errors.messengerPageUrl ? (
        <Alert className="border-border/70 rounded-3xl">
          <AlertTitle>Check the payment option fields.</AlertTitle>
          <AlertDescription>
            Enabled providers need complete account details before they can be shown publicly.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="flex justify-end">
        <Button
          type="submit"
          size="lg"
          disabled={isPending}
          className="bg-rsvp-brand text-rsvp-brand-foreground hover:bg-rsvp-brand/90"
        >
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {isPending ? "Saving..." : "Save payment settings"}
        </Button>
      </div>
    </form>
  );
}
