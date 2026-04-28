"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Loader2, MessageCircleMore } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { buildMessengerFollowupMessage } from "@/lib/apply/messenger";
import type { PublicApplyConfig } from "@/lib/apply/public-payment-option-dto";
import {
  ApplicationSchema,
  type ApplicationFormInput,
  EVENT_TYPE_OPTIONS,
} from "@/lib/validations/application.schema";
import { submitApplicationAction } from "@/server/actions/applications";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PaymentOptionPicker } from "./payment-option-picker";

type ApplyFormProps = {
  config: PublicApplyConfig;
  initialPlan: "pro" | "max";
};

const APPLY_SUCCESS_STORAGE_KEY = "ws-rsvp-apply-success";

export function ApplyForm({ config, initialPlan }: ApplyFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    setError,
    setValue,
  } = useForm<ApplicationFormInput>({
    resolver: zodResolver(ApplicationSchema),
    defaultValues: {
      email: "",
      estimatedGuestCount: undefined,
      eventDate: undefined,
      eventLocation: "",
      eventType: "wedding",
      fullName: "",
      message: "",
      phone: "",
      preferredManualPaymentOption: config.paymentOptions[0]?.provider,
      preferredPlan: initialPlan,
    },
  });

  const selectedPaymentOption = useWatch({
    control,
    name: "preferredManualPaymentOption",
  });
  const selectedPlan = useWatch({
    control,
    name: "preferredPlan",
  });
  const selectedEventType = useWatch({
    control,
    name: "eventType",
  });
  const hasPaymentOptions = config.paymentOptions.length > 0;

  function assignServerFieldErrors(fieldErrors: Record<string, string[] | undefined> | undefined) {
    if (!fieldErrors) {
      return;
    }

    Object.entries(fieldErrors).forEach(([field, messages]) => {
      if (!messages?.[0]) {
        return;
      }

      setError(field as keyof ApplicationFormInput, {
        message: messages[0],
        type: "server",
      });
    });
  }

  const submit = handleSubmit((values) => {
    startTransition(async () => {
      const result = await submitApplicationAction(values);

      if (!result.ok) {
        assignServerFieldErrors(result.fieldErrors);
        toast.error(
          result.error === "The request could not be completed."
            ? "Could not submit your application."
            : result.error,
        );
        return;
      }

      const followupMessage = buildMessengerFollowupMessage({
        eventDate: values.eventDate ?? null,
        eventType: values.eventType,
        fullName: values.fullName,
        preferredManualPaymentOption: result.data.preferredManualPaymentOption ?? null,
        preferredPlan: values.preferredPlan,
        referenceCode: result.data.referenceCode,
      });

      sessionStorage.setItem(
        APPLY_SUCCESS_STORAGE_KEY,
        JSON.stringify({
          followupMessage,
          plan: values.preferredPlan,
          preferredManualPaymentOption: result.data.preferredManualPaymentOption ?? null,
          referenceCode: result.data.referenceCode,
        }),
      );

      toast.success("Application submitted.");
      router.push(`/apply/success?ref=${encodeURIComponent(result.data.referenceCode)}`);
    });
  });

  return (
    <Card className="rsvp-panel border-border/70 rounded-[2rem]">
      <CardHeader className="space-y-3">
        <CardTitle className="text-2xl">Start your application</CardTitle>
        <p className="text-muted-foreground text-sm leading-6">
          Submit your event details, choose your preferred manual payment option, and continue on
          Messenger after you receive your reference code.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <form className="space-y-6" onSubmit={submit}>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input id="fullName" {...register("fullName")} disabled={isPending} />
              {errors.fullName?.message ? (
                <p className="text-destructive text-sm">{errors.fullName.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                {...register("email")}
                disabled={isPending}
              />
              {errors.email?.message ? (
                <p className="text-destructive text-sm">{errors.email.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone or Messenger contact</Label>
              <Input id="phone" autoComplete="tel" {...register("phone")} disabled={isPending} />
              {errors.phone?.message ? (
                <p className="text-destructive text-sm">{errors.phone.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="eventType">Event type</Label>
              <Select
                value={selectedEventType}
                onValueChange={(value) =>
                  setValue("eventType", value as ApplicationFormInput["eventType"], {
                    shouldValidate: true,
                  })
                }
                disabled={isPending}
              >
                <SelectTrigger id="eventType" className="h-11 w-full">
                  <SelectValue placeholder="Select event type" />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPE_OPTIONS.map((eventType) => (
                    <SelectItem key={eventType} value={eventType}>
                      {eventType.replace("-", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.eventType?.message ? (
                <p className="text-destructive text-sm">{errors.eventType.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="eventDate">Event date</Label>
              <Input id="eventDate" type="date" {...register("eventDate")} disabled={isPending} />
              {errors.eventDate?.message ? (
                <p className="text-destructive text-sm">{errors.eventDate.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="eventLocation">Event location</Label>
              <Input id="eventLocation" {...register("eventLocation")} disabled={isPending} />
              {errors.eventLocation?.message ? (
                <p className="text-destructive text-sm">{errors.eventLocation.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="preferredPlan">Preferred plan</Label>
              <Select
                value={selectedPlan}
                onValueChange={(value) =>
                  setValue("preferredPlan", value as "pro" | "max", { shouldValidate: true })
                }
                disabled={isPending}
              >
                <SelectTrigger id="preferredPlan" className="h-11 w-full">
                  <SelectValue placeholder="Select plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="max">Max</SelectItem>
                </SelectContent>
              </Select>
              {errors.preferredPlan?.message ? (
                <p className="text-destructive text-sm">{errors.preferredPlan.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimatedGuestCount">Estimated guest count</Label>
              <Input
                id="estimatedGuestCount"
                type="number"
                min={1}
                {...register("estimatedGuestCount")}
                disabled={isPending}
              />
              {errors.estimatedGuestCount?.message ? (
                <p className="text-destructive text-sm">{errors.estimatedGuestCount.message}</p>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              rows={5}
              placeholder="Tell WebSerbisyo about your event, timing, or anything important."
              {...register("message")}
              disabled={isPending}
            />
            {errors.message?.message ? (
              <p className="text-destructive text-sm">{errors.message.message}</p>
            ) : null}
          </div>

          {hasPaymentOptions ? (
            <PaymentOptionPicker
              options={config.paymentOptions}
              value={selectedPaymentOption}
              onValueChange={(value) =>
                setValue("preferredManualPaymentOption", value, { shouldValidate: true })
              }
              error={errors.preferredManualPaymentOption}
            />
          ) : (
            <Alert className="border-border/70 rounded-3xl">
              <AlertTitle>Payment details will be confirmed through Messenger.</AlertTitle>
              <AlertDescription>
                The admin has not enabled public wallet details yet. You can still submit your
                application and follow up manually after you receive your reference code.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-muted-foreground text-sm leading-6">
              Need more context first?{" "}
              <Link
                href="/apply"
                className="text-rsvp-brand font-medium underline underline-offset-4"
              >
                Back to the overview
              </Link>
            </p>

            <Button
              type="submit"
              size="lg"
              disabled={isPending}
              className="bg-rsvp-brand text-rsvp-brand-foreground hover:bg-rsvp-brand/90"
            >
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ArrowRight className="size-4" />
              )}
              {isPending ? "Submitting..." : "Submit application"}
            </Button>
          </div>
        </form>

        {config.messengerPageUrl ? (
          <div className="border-border/80 text-muted-foreground rounded-3xl border border-dashed px-4 py-4 text-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p>
                Need to continue the conversation right away? WebSerbisyo will still confirm the
                next steps on Messenger.
              </p>
              <Button asChild variant="ghost">
                <Link href={config.messengerPageUrl} target="_blank" rel="noreferrer">
                  Continue on Messenger
                  <MessageCircleMore className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
