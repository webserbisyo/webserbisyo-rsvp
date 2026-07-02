"use client";

import { useMemo, useState, useTransition } from "react";
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
    price: "₱1,899",
    originalPrice: "₱3,800",
    description: "Everything you need for a beautiful wedding website.",
    features: [
      "Lifetime Wedding Website",
      "Online RSVP Management",
      "Unlimited RSVP Responses",
      "Free WebSerbisyo Subdomain",
      "Mobile-Friendly Design",
      "Hosting Included",
      "Website Access Controls",
      "RSVP Dashboard",
    ],
    icon: Sparkles,
  },
  max: {
    label: "MAX Plan",
    price: "₱3,599",
    originalPrice: "₱7,500",
    description: "A premium, unforgettable wedding website experience.",
    features: [
      "Everything in PRO",
      "Advanced UI & UX",
      "Premium Motion Experience",
      "Enhanced Visual Storytelling",
      "Higher Design Polish",
      "Priority Support",
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
        msg = "This email is already linked to an application or account. Please use a different email, log in, or message WebSerbisyo if this is yours.";
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
          return input?.getAttribute("aria-invalid") === "true" || input?.parentElement?.querySelector(".text-red-400");
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
    startTransition(async () => {
      // Capture Meta cookie values for CAPI event matching
      const fbFbp = getCookieValue("_fbp");
      const fbFbc = getCookieValue("_fbc") ?? buildFbcFromUrl();
      const enrichedValues = {
        ...values,
        ...(fbFbp ? { fbFbp } : {}),
        ...(fbFbc ? { fbFbc } : {}),
      };

      const result = await submitApplicationAction(enrichedValues);

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
            step1Fields.includes(field as typeof step1Fields[number])
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

      toast.success("Application submitted.");
      router.push(`/apply/success?ref=${encodeURIComponent(result.data.referenceCode)}`);
    });
  });

  return (
    <div className="w-full">
      {/* ── Top navbar ── */}
      <header className="flex w-full items-center justify-between gap-4 pb-6 pt-4">
        <span className="text-[11px] font-bold tracking-[0.2em] text-[#ff8a5c]">
          WEBSERBISYO <span className="text-white/40 font-medium">RSVP</span>
        </span>
        <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.04] border border-white/[0.08] px-3.5 py-1.5 text-xs font-semibold backdrop-blur-md shadow-md">
          <PlanIcon className="size-3.5 text-[#ff8a5c] shrink-0" />
          <span className="text-white font-medium">
            {planDetails.label} · <span className="text-[#ff8a5c] font-bold">{planDetails.price}</span>
          </span>
          <span className="text-white/40 line-through text-[10px] ml-1">{planDetails.originalPrice}</span>
        </div>
      </header>

      {/* ── 3-step stepper ── */}
      <div className="flex items-center justify-between w-full max-w-xl mx-auto my-6 px-2">
        {/* Step 1 */}
        <div className="flex flex-col items-center gap-2 z-10">
          <div className={`size-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
            step > 1 
              ? "bg-[#ff8a5c] text-white" 
              : "bg-gradient-to-r from-[#ff8a5c] to-amber-500 text-white shadow-lg shadow-orange-950/20"
          }`}>
            {step > 1 ? "✓" : "1"}
          </div>
          <span className={`text-[10px] font-bold tracking-wider uppercase transition-colors duration-300 ${
            step >= 1 ? "text-white/90" : "text-white/40"
          }`}>
            Your Details
          </span>
        </div>

        {/* Line 1 -> 2 */}
        <div className="flex-1 h-[2px] mx-4 -mt-6 bg-white/10 relative">
          <div 
            className="absolute inset-0 bg-gradient-to-r from-[#ff8a5c] to-amber-500 transition-all duration-500" 
            style={{ width: step > 1 ? "100%" : "0%" }} 
          />
        </div>

        {/* Step 2 */}
        <div className="flex flex-col items-center gap-2 z-10">
          <div className={`size-8 rounded-full border flex items-center justify-center text-xs font-bold transition-all duration-300 ${
            step === 2
              ? "bg-gradient-to-r from-[#ff8a5c] to-amber-500 border-none text-white shadow-lg shadow-orange-950/20"
              : step > 2
                ? "bg-[#ff8a5c] text-white"
                : "border-white/10 bg-white/[0.02] text-white/40"
          }`}>
            2
          </div>
          <span className={`text-[10px] font-bold tracking-wider uppercase transition-colors duration-300 ${
            step >= 2 ? "text-white/90" : "text-white/40"
          }`}>
            Review &amp; Pay
          </span>
        </div>

        {/* Line 2 -> 3 */}
        <div className="flex-1 h-[2px] mx-4 -mt-6 bg-white/10 relative">
          <div 
            className="absolute inset-0 bg-gradient-to-r from-[#ff8a5c] to-amber-500 transition-all duration-500" 
            style={{ width: step > 2 ? "100%" : "0%" }} 
          />
        </div>

        {/* Step 3 */}
        <div className="flex flex-col items-center gap-2 z-10">
          <div className="size-8 rounded-full border border-white/10 bg-white/[0.02] text-white/40 flex items-center justify-center text-xs font-bold">
            3
          </div>
          <span className="text-[10px] font-bold tracking-wider uppercase text-white/40">
            Confirmed
          </span>
        </div>
      </div>

      {/* ── Form card ── */}
      <div className="w-full bg-white/[0.02] border border-white/[0.08] backdrop-blur-2xl rounded-3xl p-6 sm:p-10 shadow-2xl shadow-black/40">
        <form onSubmit={submit}>
          {/* ══ STEP 1: Your Details ══ */}
          {step === 1 && (
            <>
              <div className="mb-8">
                <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-wide mb-2">
                  Tell us about your wedding
                </h1>
                <p className="text-sm text-white/60 leading-relaxed">
                  We&apos;ll use these details to personalize your RSVP website preview.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="fullName" className="text-[10px] font-bold tracking-wider uppercase text-white/70">
                    Full Name <span className="text-[#ff8a5c] font-black">*</span>
                  </Label>
                  <Input
                    id="fullName"
                    placeholder="e.g. Maria & Juan Santos"
                    className="h-11 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm text-white placeholder-white/20 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff8a5c]/50 focus-visible:border-transparent"
                    {...register("fullName")}
                    disabled={isPending}
                  />
                  {errors.fullName?.message && <p className="text-xs text-red-400 mt-1 font-medium">{errors.fullName.message}</p>}
                </div>

                {/* Email */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="email" className="text-[10px] font-bold tracking-wider uppercase text-white/70">
                    Email Address <span className="text-[#ff8a5c] font-black">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    inputMode="email"
                    className="h-11 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm text-white placeholder-white/20 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff8a5c]/50 focus-visible:border-transparent"
                    {...register("email")}
                    disabled={isPending}
                  />
                  {errors.email?.message && <p className="text-xs text-red-400 mt-1 font-medium">{errors.email.message}</p>}
                </div>

                {/* Phone */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="phone" className="text-[10px] font-bold tracking-wider uppercase text-white/70">
                    Phone Number <span className="text-[#ff8a5c] font-black">*</span>
                  </Label>
                  <Input
                    id="phone"
                    autoComplete="tel"
                    inputMode="tel"
                    placeholder="09171234567"
                    className="h-11 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm text-white placeholder-white/20 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff8a5c]/50 focus-visible:border-transparent"
                    {...register("phone")}
                    disabled={isPending}
                  />
                  {errors.phone?.message && <p className="text-xs text-red-400 mt-1 font-medium">{errors.phone.message}</p>}
                </div>

                {/* Event Type */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="eventType" className="text-[10px] font-bold tracking-wider uppercase text-white/70">Event Type</Label>
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
                      <SelectTrigger id="eventType" className="h-11 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm text-white focus:ring-2 focus:ring-[#ff8a5c]/50 flex items-center justify-between w-full px-3">
                        <div className="flex items-center gap-2">
                          <span className="size-2 rounded-full bg-emerald-500 shrink-0" />
                          <SelectValue placeholder="Select event type" />
                        </div>
                      </SelectTrigger>
                      <SelectContent className="bg-[#0b0b0b] border border-white/10 text-white">
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
                    <span className="bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0">Available</span>
                  </div>
                  <p className="text-[11px] text-white/40 mt-0.5">
                    Wedding is available now. More types coming soon.
                  </p>
                  {errors.eventType?.message && <p className="text-xs text-red-400 mt-1 font-medium">{errors.eventType.message}</p>}
                </div>

                {/* Wedding Date */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="eventDate" className="text-[10px] font-bold tracking-wider uppercase text-white/70 flex items-center gap-1.5">
                    <CalendarDays className="size-3.5 text-white/50" />
                    Wedding Date <span className="text-[#ff8a5c] font-black">*</span>
                  </Label>
                  <Input
                    id="eventDate"
                    type="date"
                    className="h-11 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm text-white placeholder-white/20 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff8a5c]/50 [color-scheme:dark]"
                    {...register("eventDate")}
                    disabled={isPending}
                  />
                  {errors.eventDate?.message && <p className="text-xs text-red-400 mt-1 font-medium">{errors.eventDate.message}</p>}
                </div>

                {/* Venue / Location */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="eventLocation" className="text-[10px] font-bold tracking-wider uppercase text-white/70 flex items-center gap-1.5">
                      <MapPin className="size-3.5 text-white/50" />
                      Venue / Location <span className="text-[#ff8a5c] font-black">*</span>
                    </Label>
                    <span className={`text-[10px] font-semibold ${
                      watchedLocation.length >= 300 ? "text-red-400 font-bold" : "text-white/40"
                    }`}>
                      {watchedLocation.length}/300
                    </span>
                  </div>
                  <Input
                    id="eventLocation"
                    placeholder="e.g. Batangas, Philippines"
                    maxLength={300}
                    className="h-11 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm text-white placeholder-white/20 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff8a5c]/50 focus-visible:border-transparent"
                    {...register("eventLocation")}
                    disabled={isPending}
                  />
                  {errors.eventLocation?.message && <p className="text-xs text-red-400 mt-1 font-medium">{errors.eventLocation.message}</p>}
                </div>

                {/* Estimated Guest Count */}
                <div className="flex flex-col gap-2 md:col-span-2">
                  <Label htmlFor="estimatedGuestCount" className="text-[10px] font-bold tracking-wider uppercase text-white/70 flex items-center gap-1.5">
                    <Users className="size-3.5 text-white/50" />
                    Estimated Guest Count <span className="text-[#ff8a5c] font-black">*</span>
                  </Label>
                  <Input
                    id="estimatedGuestCount"
                    type="number"
                    min={1}
                    max={1000}
                    step={1}
                    placeholder="e.g. 150"
                    className="h-11 max-w-[200px] rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm text-white placeholder-white/20 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff8a5c]/50 focus-visible:border-transparent"
                    {...register("estimatedGuestCount")}
                    disabled={isPending}
                  />
                  {errors.estimatedGuestCount?.message && (
                    <p className="text-xs text-red-400 mt-1 font-medium">{errors.estimatedGuestCount.message}</p>
                  )}
                </div>

                {/* Message */}
                <div className="flex flex-col gap-2 md:col-span-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="message" className="text-[10px] font-bold tracking-wider uppercase text-white/70">
                      Message / theme inspiration <span className="text-[#ff8a5c] font-black">*</span>
                    </Label>
                    <span className={`text-[10px] font-semibold ${
                      watchedMessage.length >= 500 ? "text-red-400 font-bold" : "text-white/40"
                    }`}>
                      {watchedMessage.length}/500
                    </span>
                  </div>
                  <Textarea
                    id="message"
                    rows={4}
                    placeholder="e.g. Romantic garden theme, champagne and gold motif, minimalist layout, timing notes, or special requests..."
                    maxLength={500}
                    className="rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm text-white placeholder-white/20 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff8a5c]/50 focus-visible:border-transparent resize-y"
                    {...register("message")}
                    disabled={isPending}
                  />
                  <p className="text-[11px] text-white/40 mt-0.5">
                    Special requests, timing, theme, motif, design inspiration, or anything we should know.
                  </p>
                  {errors.message?.message && <p className="text-xs text-red-400 mt-1 font-medium">{errors.message.message}</p>}
                </div>
              </div>

              {/* Continue button */}
              <div className="flex justify-end mt-8">
                <button
                  type="button"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff8a5c] to-[#ff6b3b] px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-orange-950/20 transition-all duration-200 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff8a5c]/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => void handleContinueToReview()}
                  disabled={isPending}
                >
                  Continue to Review <ArrowRight className="size-4" />
                </button>
              </div>

              <div className="text-center mt-6">
                <Link href="/apply" className="text-xs font-semibold text-[#ff8a5c] hover:underline transition-all">
                  ← Back to packages
                </Link>
              </div>
            </>
          )}

          {/* ══ STEP 2: Review & Pay ══ */}
          {step === 2 && (
            <>
              <div className="mb-8">
                <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-wide mb-2">Review &amp; Payment</h1>
                <p className="text-sm text-white/60 leading-relaxed">
                  Confirm your plan and choose your preferred payment method.
                </p>
              </div>

              {/* Selected plan summary card */}
              <div className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-6 mb-8 shadow-inner shadow-black/20">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-4 mb-4">
                  <div className="flex items-start gap-3">
                    <div className="size-10 rounded-xl bg-[#ff8a5c]/10 border border-[#ff8a5c]/35 flex items-center justify-center text-[#ff8a5c] shrink-0">
                      <PlanIcon className="size-5" />
                    </div>
                    <div>
                      <p className="text-xs font-black tracking-widest text-[#ff8a5c] uppercase">{planDetails.label}</p>
                      <p className="text-sm text-white/70 mt-0.5">{planDetails.description}</p>
                    </div>
                  </div>
                  <div className="sm:text-right flex items-baseline sm:flex-col gap-2 sm:gap-0 shrink-0">
                    <span className="text-2xl font-extrabold text-white">{planDetails.price}</span>
                    <span className="text-sm text-white/40 line-through">{planDetails.originalPrice}</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {planDetails.features.map((f: string) => (
                    <div key={f} className="flex items-center gap-2 text-xs text-white/70">
                      <span className="text-[#ff8a5c] font-bold">✓</span>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment method */}
              {hasPaymentOptions ? (
                <div className="mb-8">
                  <p className="text-[10px] font-bold tracking-wider uppercase text-white/70 mb-1.5">PAYMENT METHOD</p>
                  <p className="text-xs text-white/50 leading-relaxed mb-4">
                    We&apos;ll confirm the final payment details on Messenger. Choose your preferred option below.
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
                  <p className="text-[10px] font-bold tracking-wider uppercase text-white/70 mb-1.5">PAYMENT METHOD</p>
                  <p className="text-xs text-white/50 leading-relaxed mb-4">
                    No payment required now — we&apos;ll reach out on Messenger to confirm your slot and send payment instructions.
                  </p>
                </div>
              )}

              {/* Step 2 actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8">
                <button
                  type="button"
                  className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3.5 text-sm font-semibold text-white/80 transition-all duration-200 hover:bg-white/[0.08] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => setStep(1)}
                  disabled={isPending}
                >
                  <ArrowLeft className="size-4" /> Back
                </button>
                <button
                  type="submit"
                  className="inline-flex w-full sm:w-auto flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff8a5c] to-[#ff6b3b] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-950/20 transition-all duration-200 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed max-w-[280px]"
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

              <p className="text-center text-[11px] text-white/40 leading-relaxed mt-6">
                No payment required now — we&apos;ll reach out on Messenger to confirm your slot and send payment instructions.
              </p>
            </>
          )}
        </form>
      </div>

      {/* Footer */}
      <p className="text-center text-[10px] text-white/30 tracking-wider mt-12 pb-6">
        © 2024 WebSerbisyo RSVP · Made with love for Filipino couples
      </p>
    </div>
  );
}

function getCookieValue(name: string): string | null {
  if (typeof document === "undefined") return null;

  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));

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
