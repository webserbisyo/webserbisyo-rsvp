"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Crown,
  Loader2,
  MapPin,
  Sparkles,
  Users,
} from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { buildMessengerFollowupMessage } from "@/lib/apply/messenger";
import {
  APPLY_DRAFT_STORAGE_KEY,
  parseApplicationDraft,
  serializeApplicationDraft,
} from "@/lib/apply/application-draft";
import type { PublicApplyConfig } from "@/lib/apply/public-payment-option-dto";
import { getApplicationEventTypeOptions } from "@/config/event-type-availability";
import {
  type ApplicationInput,
  type ApplicationFormInput,
  createApplicationSchema,
} from "@/lib/validations/application.schema";
import { submitApplicationAction } from "@/server/actions/applications";
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
const applicationEventTypeOptions = getApplicationEventTypeOptions();

const PLAN_DETAILS = {
  pro: {
    label: "PRO Plan",
    price: "₱1,599",
    originalPrice: "₱3,200",
    description: "Everything you need for a beautiful RSVP website.",
    features: [
      "Premium mobile-friendly RSVP website",
      "Event details and schedule sections",
      "RSVP form and guest tracking",
      "Gallery and story sections",
      "Unlimited RSVP responses",
      "Guest response export",
      "Hosting included",
      "Website access controls",
      "1-year support and maintenance",
    ],
    icon: Sparkles,
  },
  max: {
    label: "MAX Plan",
    price: "₱3,599",
    originalPrice: "₱7,200",
    description: "A premium, unforgettable RSVP website experience.",
    features: [
      "Everything in PRO",
      "Advanced custom animations",
      "Premium motion and interaction polish",
      "Enhanced visual personalization",
      "More immersive section transitions",
      "Couple Alignment Kit included",
      "Priority creative refinement",
      "Priority setup",
    ],
    icon: Crown,
  },
} as const;

export function ApplyForm({ config, initialPlan }: ApplyFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState<1 | 2>(1);

  const hasPaymentOptions = config.paymentOptions.length > 0;
  const validationSchema = useMemo(
    () => createApplicationSchema({ requireManualPaymentOption: hasPaymentOptions }),
    [hasPaymentOptions],
  );
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setError,
    setValue,
    trigger,
    control,
  } = useForm<ApplicationFormInput, unknown, ApplicationInput>({
    mode: "onBlur",
    reValidateMode: "onChange",
    resolver: zodResolver(validationSchema),
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

  const selectedPaymentOption = useWatch({ control, name: "preferredManualPaymentOption" });
  const selectedPlan = useWatch({ control, name: "preferredPlan" });
  const selectedEventType = useWatch({ control, name: "eventType" });
  const watchedLocation = useWatch({ control, name: "eventLocation" }) ?? "";
  const watchedMessage = useWatch({ control, name: "message" }) ?? "";
  const watchedValues = useWatch({ control });
  const draftReadyRef = useRef(false);
  const [submissionTransportFailed, setSubmissionTransportFailed] = useState(false);

  useEffect(() => {
    const draft = parseApplicationDraft(sessionStorage.getItem(APPLY_DRAFT_STORAGE_KEY));

    if (draft) {
      const { step: draftStep, ...values } = draft;
      reset({
        email: values.email ?? "",
        estimatedGuestCount: values.estimatedGuestCount,
        eventDate: values.eventDate,
        eventLocation: values.eventLocation ?? "",
        eventType: (values.eventType as ApplicationFormInput["eventType"]) ?? "wedding",
        fullName: values.fullName ?? "",
        message: values.message ?? "",
        phone: values.phone ?? "",
        preferredManualPaymentOption:
          (values.preferredManualPaymentOption as ApplicationFormInput["preferredManualPaymentOption"]) ??
          config.paymentOptions[0]?.provider,
        preferredPlan:
          (values.preferredPlan as ApplicationFormInput["preferredPlan"]) ?? initialPlan,
      });
      // Restoring session-scoped state is the purpose of this mount-only synchronization.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStep(draftStep ?? 1);
    }

    draftReadyRef.current = true;
  }, [config.paymentOptions, initialPlan, reset]);

  useEffect(() => {
    if (!draftReadyRef.current) return;

    sessionStorage.setItem(
      APPLY_DRAFT_STORAGE_KEY,
      serializeApplicationDraft({ ...watchedValues, step }),
    );
  }, [step, watchedValues]);

  const planKey = (selectedPlan ?? initialPlan) as keyof typeof PLAN_DETAILS;
  const planDetails = PLAN_DETAILS[planKey] ?? PLAN_DETAILS.pro;
  const PlanIcon = planDetails.icon;

  function assignServerFieldErrors(fieldErrors: Record<string, string[] | undefined> | undefined) {
    if (!fieldErrors) return;
    Object.entries(fieldErrors).forEach(([field, messages]) => {
      if (!messages?.[0]) return;
      let msg = messages[0];
      if (
        field === "email" &&
        (msg.includes("already registered") || msg.includes("already linked"))
      ) {
        msg =
          "This email is already linked to an application or account. Please use a different email, log in, or message WebSerbisyo if this is yours.";
      }
      setError(field as keyof ApplicationFormInput, { message: msg, type: "server" });
    });
  }

  async function handleContinueToReview() {
    const valid = await trigger([
      "fullName",
      "email",
      "phone",
      "eventType",
      "eventDate",
      "eventLocation",
      "estimatedGuestCount",
      "message",
      "preferredPlan",
    ]);
    if (valid) {
      setStep(2);
    } else {
      setTimeout(() => {
        const errorFields = [
          "fullName",
          "email",
          "phone",
          "eventType",
          "eventDate",
          "eventLocation",
          "estimatedGuestCount",
          "message",
        ] as const;

        const firstError = errorFields.find((field) => {
          const input = document.getElementById(field);
          return (
            input?.getAttribute("aria-invalid") === "true" ||
            input?.parentElement?.querySelector(".text-red-400")
          );
        });

        if (firstError) {
          const element = document.getElementById(firstError);
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
            element.focus({ preventScroll: true });
          }
        }
      }, 50);
    }
  }

  const submit = handleSubmit((values) => {
    setSubmissionTransportFailed(false);
    startTransition(async () => {
      // Capture Meta cookie values for CAPI event matching
      const fbFbp = getCookieValue("_fbp");
      const fbFbc = getCookieValue("_fbc") ?? buildFbcFromUrl();
      const enrichedValues = {
        ...values,
        ...(fbFbp ? { fbFbp } : {}),
        ...(fbFbc ? { fbFbc } : {}),
      };

      let result: Awaited<ReturnType<typeof submitApplicationAction>>;

      try {
        result = await submitApplicationAction(enrichedValues);
      } catch {
        sessionStorage.setItem(
          APPLY_DRAFT_STORAGE_KEY,
          serializeApplicationDraft({ ...values, step }),
        );
        setSubmissionTransportFailed(true);
        toast.error("This page may have been updated. Your details are saved in this tab.");
        return;
      }

      if (!result.ok) {
        assignServerFieldErrors(result.fieldErrors);

        const hasFieldErrors = result.fieldErrors && Object.keys(result.fieldErrors).length > 0;
        if (!hasFieldErrors) {
          toast.error(
            result.error === "The request could not be completed."
              ? "Could not submit your application."
              : result.error,
          );
        }

        if (hasFieldErrors) {
          const step1Fields = [
            "fullName",
            "email",
            "phone",
            "eventType",
            "eventDate",
            "eventLocation",
            "estimatedGuestCount",
            "message",
          ] as const;

          const hasStep1Error = Object.keys(result.fieldErrors!).some((field) =>
            step1Fields.includes(field as (typeof step1Fields)[number]),
          );

          if (hasStep1Error) {
            setStep(1);
          }

          // Focus or scroll to the first invalid field
          setTimeout(() => {
            const allFields = [
              "fullName",
              "email",
              "phone",
              "eventType",
              "eventDate",
              "eventLocation",
              "estimatedGuestCount",
              "message",
              "preferredManualPaymentOption",
            ] as const;

            const firstErrorField = allFields.find((field) => result.fieldErrors?.[field]);
            if (firstErrorField) {
              const element = document.getElementById(firstErrorField);
              if (element) {
                element.scrollIntoView({ behavior: "smooth", block: "center" });
                element.focus({ preventScroll: true });
              }
            }
          }, 100);
        }
        return;
      }

      const followupMessage = buildMessengerFollowupMessage({
        email: values.email,
        estimatedGuestCount: values.estimatedGuestCount,
        eventDate: values.eventDate ?? null,
        eventLocation: values.eventLocation ?? null,
        eventType: values.eventType,
        fullName: values.fullName,
        message: values.message ?? null,
        phone: values.phone,
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
      sessionStorage.removeItem(APPLY_DRAFT_STORAGE_KEY);

      toast.success("Application submitted.");
      router.push(`/apply/success?ref=${encodeURIComponent(result.data.referenceCode)}`);
    });
  });

  return (
    <div className="w-full">
      {/* ── Top navbar ── */}
      <header className="flex w-full items-center justify-between gap-4 pt-4 pb-6">
        <span className="text-[11px] font-bold tracking-[0.2em] text-[#ff8a5c]">
          WEBSERBISYO <span className="font-medium text-white/40">RSVP</span>
        </span>
        <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3.5 py-1.5 text-xs font-semibold shadow-md backdrop-blur-md">
          <PlanIcon className="size-3.5 shrink-0 text-[#ff8a5c]" />
          <span className="font-medium text-white">
            {planDetails.label} ·{" "}
            <span className="font-bold text-[#ff8a5c]">{planDetails.price}</span>
          </span>
          <span className="ml-1 text-[10px] text-white/40 line-through">
            {planDetails.originalPrice}
          </span>
        </div>
      </header>

      {/* ── 3-step stepper ── */}
      <div className="mx-auto my-6 flex w-full max-w-xl items-center justify-between px-2">
        {/* Step 1 */}
        <div className="z-10 flex flex-col items-center gap-2">
          <div
            className={`flex size-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
              step > 1
                ? "bg-[#ff8a5c] text-white"
                : "bg-gradient-to-r from-[#ff8a5c] to-amber-500 text-white shadow-lg shadow-orange-950/20"
            }`}
          >
            {step > 1 ? "✓" : "1"}
          </div>
          <span
            className={`text-[10px] font-bold tracking-wider uppercase transition-colors duration-300 ${
              step >= 1 ? "text-white/90" : "text-white/40"
            }`}
          >
            Your Details
          </span>
        </div>

        {/* Line 1 -> 2 */}
        <div className="relative mx-4 -mt-6 h-[2px] flex-1 bg-white/10">
          <div
            className="absolute inset-0 bg-gradient-to-r from-[#ff8a5c] to-amber-500 transition-all duration-500"
            style={{ width: step > 1 ? "100%" : "0%" }}
          />
        </div>

        {/* Step 2 */}
        <div className="z-10 flex flex-col items-center gap-2">
          <div
            className={`flex size-8 items-center justify-center rounded-full border text-xs font-bold transition-all duration-300 ${
              step === 2
                ? "border-none bg-gradient-to-r from-[#ff8a5c] to-amber-500 text-white shadow-lg shadow-orange-950/20"
                : step > 2
                  ? "bg-[#ff8a5c] text-white"
                  : "border-white/10 bg-white/[0.02] text-white/40"
            }`}
          >
            2
          </div>
          <span
            className={`text-[10px] font-bold tracking-wider uppercase transition-colors duration-300 ${
              step >= 2 ? "text-white/90" : "text-white/40"
            }`}
          >
            Review Application
          </span>
        </div>

        {/* Line 2 -> 3 */}
        <div className="relative mx-4 -mt-6 h-[2px] flex-1 bg-white/10">
          <div
            className="absolute inset-0 bg-gradient-to-r from-[#ff8a5c] to-amber-500 transition-all duration-500"
            style={{ width: step > 2 ? "100%" : "0%" }}
          />
        </div>

        {/* Step 3 */}
        <div className="z-10 flex flex-col items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.02] text-xs font-bold text-white/40">
            3
          </div>
          <span className="text-[10px] font-bold tracking-wider text-white/40 uppercase">
            Confirmed
          </span>
        </div>
      </div>

      {/* ── Form card ── */}
      <div className="w-full rounded-3xl border border-white/[0.08] bg-white/[0.02] p-6 shadow-2xl shadow-black/40 backdrop-blur-2xl sm:p-10">
        {submissionTransportFailed && (
          <div
            className="mb-6 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-50"
            role="alert"
          >
            <p className="font-semibold">
              This page was updated or the connection was interrupted.
            </p>
            <p className="mt-1 text-amber-50/80">
              Your details are saved in this tab. Refresh the page, review them, then submit once.
            </p>
            <button
              type="button"
              className="mt-3 rounded-lg border border-amber-200/30 bg-amber-50/10 px-3 py-2 text-xs font-bold text-amber-50 hover:bg-amber-50/20"
              onClick={() => window.location.reload()}
            >
              Refresh and restore details
            </button>
          </div>
        )}
        <form onSubmit={submit}>
          {/* ══ STEP 1: Your Details ══ */}
          {step === 1 && (
            <>
              <div className="mb-8">
                <h1 className="mb-2 text-xl font-extrabold tracking-wide text-white sm:text-2xl">
                  Tell us about your event
                </h1>
                <p className="text-sm leading-relaxed text-white/60">
                  We&apos;ll use these details to personalize your RSVP website preview.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Full Name */}
                <div className="flex flex-col gap-2">
                  <Label
                    htmlFor="fullName"
                    className="text-[10px] font-bold tracking-wider text-white/70 uppercase"
                  >
                    Full Name <span className="font-black text-[#ff8a5c]">*</span>
                  </Label>
                  <Input
                    id="fullName"
                    placeholder="e.g. Maria & Juan Santos"
                    className="h-11 rounded-xl border border-white/[0.08] bg-white/[0.03] text-sm text-white placeholder-white/20 transition-all duration-200 focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-[#ff8a5c]/50 focus-visible:outline-none"
                    {...register("fullName")}
                    disabled={isPending}
                  />
                  {errors.fullName?.message && (
                    <p className="mt-1 text-xs font-medium text-red-400">
                      {errors.fullName.message}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div className="flex flex-col gap-2">
                  <Label
                    htmlFor="email"
                    className="text-[10px] font-bold tracking-wider text-white/70 uppercase"
                  >
                    Email Address <span className="font-black text-[#ff8a5c]">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    inputMode="email"
                    className="h-11 rounded-xl border border-white/[0.08] bg-white/[0.03] text-sm text-white placeholder-white/20 transition-all duration-200 focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-[#ff8a5c]/50 focus-visible:outline-none"
                    {...register("email")}
                    disabled={isPending}
                  />
                  {errors.email?.message && (
                    <p className="mt-1 text-xs font-medium text-red-400">{errors.email.message}</p>
                  )}
                </div>

                {/* Phone */}
                <div className="flex flex-col gap-2">
                  <Label
                    htmlFor="phone"
                    className="text-[10px] font-bold tracking-wider text-white/70 uppercase"
                  >
                    Phone Number <span className="font-black text-[#ff8a5c]">*</span>
                  </Label>
                  <Input
                    id="phone"
                    autoComplete="tel"
                    inputMode="tel"
                    placeholder="09171234567"
                    className="h-11 rounded-xl border border-white/[0.08] bg-white/[0.03] text-sm text-white placeholder-white/20 transition-all duration-200 focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-[#ff8a5c]/50 focus-visible:outline-none"
                    {...register("phone")}
                    disabled={isPending}
                  />
                  {errors.phone?.message && (
                    <p className="mt-1 text-xs font-medium text-red-400">{errors.phone.message}</p>
                  )}
                </div>

                {/* Event Type */}
                <div className="flex flex-col gap-2">
                  <Label
                    htmlFor="eventType"
                    className="text-[10px] font-bold tracking-wider text-white/70 uppercase"
                  >
                    Event Type
                  </Label>
                  <div className="flex items-center gap-3">
                    <Select
                      value={selectedEventType}
                      onValueChange={(value) =>
                        setValue("eventType", value as ApplicationFormInput["eventType"], {
                          shouldTouch: true,
                          shouldValidate: true,
                        })
                      }
                      disabled={isPending}
                    >
                      <SelectTrigger
                        id="eventType"
                        className="flex h-11 w-full items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 text-sm text-white focus:ring-2 focus:ring-[#ff8a5c]/50"
                      >
                        <div className="flex items-center gap-2">
                          <span className="size-2 shrink-0 rounded-full bg-emerald-500" />
                          <SelectValue placeholder="Select event type" />
                        </div>
                      </SelectTrigger>
                      <SelectContent className="border border-white/10 bg-[#0b0b0b] text-white">
                        {applicationEventTypeOptions.map((eventType) => (
                          <SelectItem
                            key={eventType.eventType}
                            value={eventType.eventType}
                            disabled={eventType.disabled}
                            className="focus:bg-white/10 focus:text-white"
                          >
                            {eventType.statusLabel
                              ? `${eventType.label} (${eventType.statusLabel})`
                              : eventType.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="shrink-0 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                      Available
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-white/40">
                    Wedding is available now. More celebration types are coming soon.
                  </p>
                  {errors.eventType?.message && (
                    <p className="mt-1 text-xs font-medium text-red-400">
                      {errors.eventType.message}
                    </p>
                  )}
                </div>

                {/* Event Date */}
                <div className="flex flex-col gap-2">
                  <Label
                    htmlFor="eventDate"
                    className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-white/70 uppercase"
                  >
                    <CalendarDays className="size-3.5 text-white/50" />
                    Event Date <span className="font-black text-[#ff8a5c]">*</span>
                  </Label>
                  <Input
                    id="eventDate"
                    type="date"
                    className="h-11 rounded-xl border border-white/[0.08] bg-white/[0.03] text-sm text-white placeholder-white/20 [color-scheme:dark] transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[#ff8a5c]/50 focus-visible:outline-none"
                    {...register("eventDate")}
                    disabled={isPending}
                  />
                  {errors.eventDate?.message && (
                    <p className="mt-1 text-xs font-medium text-red-400">
                      {errors.eventDate.message}
                    </p>
                  )}
                </div>

                {/* Venue / Location */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="eventLocation"
                      className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-white/70 uppercase"
                    >
                      <MapPin className="size-3.5 text-white/50" />
                      Venue / Location <span className="font-black text-[#ff8a5c]">*</span>
                    </Label>
                    <span
                      className={`text-[10px] font-semibold ${
                        watchedLocation.length >= 300 ? "font-bold text-red-400" : "text-white/40"
                      }`}
                    >
                      {watchedLocation.length}/300
                    </span>
                  </div>
                  <Input
                    id="eventLocation"
                    placeholder="e.g. Batangas, Philippines"
                    maxLength={300}
                    className="h-11 rounded-xl border border-white/[0.08] bg-white/[0.03] text-sm text-white placeholder-white/20 transition-all duration-200 focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-[#ff8a5c]/50 focus-visible:outline-none"
                    {...register("eventLocation")}
                    disabled={isPending}
                  />
                  {errors.eventLocation?.message && (
                    <p className="mt-1 text-xs font-medium text-red-400">
                      {errors.eventLocation.message}
                    </p>
                  )}
                </div>

                {/* Estimated Guest Count */}
                <div className="flex flex-col gap-2 md:col-span-2">
                  <Label
                    htmlFor="estimatedGuestCount"
                    className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-white/70 uppercase"
                  >
                    <Users className="size-3.5 text-white/50" />
                    Estimated Guest Count <span className="font-black text-[#ff8a5c]">*</span>
                  </Label>
                  <Input
                    id="estimatedGuestCount"
                    type="number"
                    min={1}
                    max={1000}
                    step={1}
                    placeholder="e.g. 150"
                    className="h-11 max-w-[200px] rounded-xl border border-white/[0.08] bg-white/[0.03] text-sm text-white placeholder-white/20 transition-all duration-200 focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-[#ff8a5c]/50 focus-visible:outline-none"
                    {...register("estimatedGuestCount")}
                    disabled={isPending}
                  />
                  {errors.estimatedGuestCount?.message && (
                    <p className="mt-1 text-xs font-medium text-red-400">
                      {errors.estimatedGuestCount.message}
                    </p>
                  )}
                </div>

                {/* Message */}
                <div className="flex flex-col gap-2 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="message"
                      className="text-[10px] font-bold tracking-wider text-white/70 uppercase"
                    >
                      Message / theme inspiration{" "}
                      <span className="font-black text-[#ff8a5c]">*</span>
                    </Label>
                    <span
                      className={`text-[10px] font-semibold ${
                        watchedMessage.length >= 500 ? "font-bold text-red-400" : "text-white/40"
                      }`}
                    >
                      {watchedMessage.length}/500
                    </span>
                  </div>
                  <Textarea
                    id="message"
                    rows={4}
                    placeholder="e.g. Romantic garden theme, champagne and gold motif, minimalist layout, timing notes, or special requests..."
                    maxLength={500}
                    className="resize-y rounded-xl border border-white/[0.08] bg-white/[0.03] text-sm text-white placeholder-white/20 transition-all duration-200 focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-[#ff8a5c]/50 focus-visible:outline-none"
                    {...register("message")}
                    disabled={isPending}
                  />
                  <p className="mt-0.5 text-[11px] text-white/40">
                    Special requests, timing, theme, motif, design inspiration, or anything we
                    should know.
                  </p>
                  {errors.message?.message && (
                    <p className="mt-1 text-xs font-medium text-red-400">
                      {errors.message.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Continue button */}
              <div className="mt-8 flex justify-end">
                <button
                  type="button"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff8a5c] to-[#ff6b3b] px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-orange-950/20 transition-all duration-200 hover:brightness-110 focus-visible:ring-2 focus-visible:ring-[#ff8a5c]/50 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() => void handleContinueToReview()}
                  disabled={isPending}
                >
                  Continue to Review <ArrowRight className="size-4" />
                </button>
              </div>

              <div className="mt-6 text-center">
                <Link
                  href="/apply"
                  className="text-xs font-semibold text-[#ff8a5c] transition-all hover:underline"
                >
                  ← Back to packages
                </Link>
              </div>
            </>
          )}

          {/* ══ STEP 2: Review & Pay ══ */}
          {step === 2 && (
            <>
              <div className="mb-8">
                <h1 className="mb-2 text-xl font-extrabold tracking-wide text-white sm:text-2xl">
                  Review &amp; Payment
                </h1>
                <p className="text-sm leading-relaxed text-white/60">
                  Confirm your plan and choose your preferred payment method.
                </p>
              </div>

              {/* Selected plan summary card */}
              <div className="mb-8 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 shadow-inner shadow-black/20">
                <div className="mb-4 flex flex-col items-start justify-between gap-4 border-b border-white/[0.08] pb-4 sm:flex-row sm:items-center">
                  <div className="flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-[#ff8a5c]/35 bg-[#ff8a5c]/10 text-[#ff8a5c]">
                      <PlanIcon className="size-5" />
                    </div>
                    <div>
                      <p className="text-xs font-black tracking-widest text-[#ff8a5c] uppercase">
                        {planDetails.label}
                      </p>
                      <p className="mt-0.5 text-sm text-white/70">{planDetails.description}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-baseline gap-2 sm:flex-col sm:gap-0 sm:text-right">
                    <span className="text-2xl font-extrabold text-white">{planDetails.price}</span>
                    <span className="text-sm text-white/40 line-through">
                      {planDetails.originalPrice}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {planDetails.features.map((f: string) => (
                    <div key={f} className="flex items-center gap-2 text-xs text-white/70">
                      <span className="font-bold text-[#ff8a5c]">✓</span>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trust callout card */}
              <div className="mb-6 rounded-2xl border border-[#ff8a5c]/25 bg-[#ff8a5c]/[0.06] p-4 text-center sm:p-5">
                <p className="mb-1.5 text-xs font-extrabold tracking-widest text-[#ff8a5c] uppercase sm:text-sm">
                  WEBSITE MUNA, BAGO BAYAD.
                </p>
                <p className="mx-auto max-w-md text-xs leading-relaxed text-white/80 sm:text-sm">
                  This step only confirms your preferred payment method.{" "}
                  <span className="font-semibold text-white">No payment is required now.</span>{" "}
                  We’ll message you on Messenger once your website preview is ready.
                </p>
              </div>

              {/* Payment method */}
              {hasPaymentOptions ? (
                <div className="mb-8">
                  <p className="mb-1.5 text-[10px] font-bold tracking-wider text-white/70 uppercase">
                    PAYMENT METHOD
                  </p>
                  <p className="mb-4 text-xs leading-relaxed text-white/50">
                    We&apos;ll confirm the final payment details on Messenger. Choose your preferred
                    option below.
                  </p>
                  <PaymentOptionPicker
                    options={config.paymentOptions}
                    value={selectedPaymentOption}
                    onValueChange={(value) =>
                      setValue("preferredManualPaymentOption", value, {
                        shouldTouch: true,
                        shouldValidate: true,
                      })
                    }
                    error={errors.preferredManualPaymentOption}
                  />
                </div>
              ) : (
                <div className="mb-8">
                  <p className="mb-1.5 text-[10px] font-bold tracking-wider text-white/70 uppercase">
                    PAYMENT METHOD
                  </p>
                  <p className="mb-4 text-xs leading-relaxed text-white/50">
                    No payment required now — we&apos;ll reach out on Messenger to confirm your slot
                    and send payment instructions.
                  </p>
                </div>
              )}

              {/* Step 2 actions */}
              <div className="mt-8 flex flex-col items-center justify-between gap-4 sm:flex-row">
                <button
                  type="button"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3.5 text-sm font-semibold text-white/80 transition-all duration-200 hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  onClick={() => setStep(1)}
                  disabled={isPending}
                >
                  <ArrowLeft className="size-4" /> Back
                </button>
                <button
                  type="submit"
                  className="inline-flex w-full max-w-[280px] flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff8a5c] to-[#ff6b3b] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-950/20 transition-all duration-200 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  disabled={isPending}
                >
                  {isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <ArrowRight className="size-4" />
                  )}
                  {isPending ? "Submitting..." : "Submit Application"}
                </button>
              </div>

              <p className="mt-6 text-center text-[11px] leading-relaxed text-white/40">
                No payment will be collected upon submission.
              </p>
            </>
          )}
        </form>
      </div>

      {/* Footer */}
      <p className="mt-12 pb-6 text-center text-[10px] tracking-wider text-white/30">
        © 2024 WebSerbisyo RSVP · Made with love for Filipino couples
      </p>
    </div>
  );
}

function getCookieValue(name: string): string | null {
  if (typeof document === "undefined") return null;

  const match = document.cookie.split("; ").find((row) => row.startsWith(`${name}=`));

  return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : null;
}

function buildFbcFromUrl(): string | null {
  if (typeof window === "undefined") return null;

  try {
    const params = new URLSearchParams(window.location.search);
    const fbclid = params.get("fbclid");

    if (!fbclid) return null;

    return `fb.1.${Date.now()}.${fbclid}`;
  } catch {
    return null;
  }
}
