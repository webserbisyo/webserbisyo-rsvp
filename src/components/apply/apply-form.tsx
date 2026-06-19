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

  const planKey = (selectedPlan ?? initialPlan) as keyof typeof PLAN_DETAILS;
  const planDetails = PLAN_DETAILS[planKey] ?? PLAN_DETAILS.pro;
  const PlanIcon = planDetails.icon;

  function assignServerFieldErrors(fieldErrors: Record<string, string[] | undefined> | undefined) {
    if (!fieldErrors) return;
    Object.entries(fieldErrors).forEach(([field, messages]) => {
      if (!messages?.[0]) return;
      setError(field as keyof ApplicationFormInput, { message: messages[0], type: "server" });
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
    if (valid) setStep(2);
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
        toast.error(
          result.error === "The request could not be completed."
            ? "Could not submit your application."
            : result.error,
        );
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
    <div className="af-shell">
      {/* ── Top navbar ── */}
      <header className="af-topbar">
        <span className="af-topbar-wordmark">
          WEBSERBISYO <span className="af-topbar-rsvp">RSVP</span>
        </span>
        <div className="af-plan-pill">
          <PlanIcon className="af-plan-pill-icon" />
          <span className="af-plan-pill-label">
            {planDetails.label} — {planDetails.price}
          </span>
          <span className="af-plan-pill-original">{planDetails.originalPrice}</span>
        </div>
      </header>

      {/* ── 3-step stepper ── */}
      <div className="af-stepper">
        <div className={`af-step ${step >= 1 ? "af-step--active" : ""} ${step > 1 ? "af-step--done" : ""}`}>
          <div className="af-step-circle">
            {step > 1 ? <span className="af-step-check">✓</span> : <span>1</span>}
          </div>
          <span className="af-step-label">Your Details</span>
        </div>
        <div className={`af-step-line ${step > 1 ? "af-step-line--done" : ""}`} />
        <div className={`af-step ${step >= 2 ? "af-step--active" : ""}`}>
          <div className="af-step-circle">2</div>
          <span className="af-step-label">Review &amp; Pay</span>
        </div>
        <div className="af-step-line" />
        <div className="af-step">
          <div className="af-step-circle">3</div>
          <span className="af-step-label">Confirmed</span>
        </div>
      </div>

      {/* ── Form card ── */}
      <div className="af-card">
        <form onSubmit={submit}>
          {/* ══ STEP 1: Your Details ══ */}
          {step === 1 && (
            <>
              <div className="af-card-header">
                <h1 className="af-card-title">Tell us about your wedding</h1>
                <p className="af-card-subtitle">
                  We&apos;ll use these details to personalise and set up your website.
                </p>
              </div>

              <div className="af-fields-grid">
                {/* Full Name */}
                <div className="af-field">
                  <Label htmlFor="fullName" className="af-label">Full Name <span className="af-required">*</span></Label>
                  <Input
                    id="fullName"
                    placeholder="e.g. Maria & Juan Santos"
                    className="af-input"
                    {...register("fullName")}
                    disabled={isPending}
                  />
                  {errors.fullName?.message && <p className="af-field-error">{errors.fullName.message}</p>}
                </div>

                {/* Email */}
                <div className="af-field">
                  <Label htmlFor="email" className="af-label">Email Address <span className="af-required">*</span></Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    inputMode="email"
                    className="af-input"
                    {...register("email")}
                    disabled={isPending}
                  />
                  {errors.email?.message && <p className="af-field-error">{errors.email.message}</p>}
                </div>

                {/* Phone */}
                <div className="af-field">
                  <Label htmlFor="phone" className="af-label">Phone Number <span className="af-required">*</span></Label>
                  <Input
                    id="phone"
                    autoComplete="tel"
                    inputMode="tel"
                    placeholder="09171234567"
                    className="af-input"
                    {...register("phone")}
                    disabled={isPending}
                  />
                  {errors.phone?.message && <p className="af-field-error">{errors.phone.message}</p>}
                </div>

                {/* Event Type */}
                <div className="af-field">
                  <Label htmlFor="eventType" className="af-label">Event Type</Label>
                  <div className="af-event-type-wrap">
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
                      <SelectTrigger id="eventType" className="af-input af-input--select">
                        <span className="af-event-type-dot" />
                        <SelectValue placeholder="Select event type" />
                      </SelectTrigger>
                      <SelectContent>
                        {applicationEventTypeOptions.map((eventType) => (
                          <SelectItem
                            key={eventType.eventType}
                            value={eventType.eventType}
                            disabled={eventType.disabled}
                          >
                            {eventType.statusLabel
                              ? `${eventType.label} (${eventType.statusLabel})`
                              : eventType.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="af-available-badge">Available</span>
                  </div>
                  <p className="af-field-hint">
                    Wedding is available now. More types coming soon.
                  </p>
                  {errors.eventType?.message && <p className="af-field-error">{errors.eventType.message}</p>}
                </div>

                {/* Wedding Date */}
                <div className="af-field">
                  <Label htmlFor="eventDate" className="af-label">
                    <CalendarDays className="af-label-icon" />
                    Wedding Date <span className="af-required">*</span>
                  </Label>
                  <Input
                    id="eventDate"
                    type="date"
                    className="af-input"
                    {...register("eventDate")}
                    disabled={isPending}
                  />
                  {errors.eventDate?.message && <p className="af-field-error">{errors.eventDate.message}</p>}
                </div>

                {/* Venue / Location */}
                <div className="af-field">
                  <Label htmlFor="eventLocation" className="af-label">
                    <MapPin className="af-label-icon" />
                    Venue / Location <span className="af-required">*</span>
                  </Label>
                  <Input
                    id="eventLocation"
                    placeholder="e.g. Batangas, Philippines"
                    className="af-input"
                    {...register("eventLocation")}
                    disabled={isPending}
                  />
                  {errors.eventLocation?.message && <p className="af-field-error">{errors.eventLocation.message}</p>}
                </div>

                {/* Estimated Guest Count */}
                <div className="af-field af-field--full">
                  <Label htmlFor="estimatedGuestCount" className="af-label">
                    <Users className="af-label-icon" />
                    Estimated Guest Count <span className="af-required">*</span>
                  </Label>
                  <Input
                    id="estimatedGuestCount"
                    type="number"
                    min={1}
                    max={1000}
                    step={1}
                    placeholder="e.g. 150"
                    className="af-input af-input--half"
                    {...register("estimatedGuestCount")}
                    disabled={isPending}
                  />
                  {errors.estimatedGuestCount?.message && (
                    <p className="af-field-error">{errors.estimatedGuestCount.message}</p>
                  )}
                </div>

                {/* Message */}
                <div className="af-field af-field--full">
                  <Label htmlFor="message" className="af-label">Message</Label>
                  <Textarea
                    id="message"
                    rows={4}
                    placeholder="Tell WebSerbisyo about your event..."
                    className="af-input af-input--textarea"
                    {...register("message")}
                    disabled={isPending}
                  />
                  <p className="af-field-hint">Special requests, timing, or anything we should know.</p>
                  {errors.message?.message && <p className="af-field-error">{errors.message.message}</p>}
                </div>
              </div>

              {/* Continue button */}
              <div className="af-actions">
                <button
                  type="button"
                  className="af-btn-primary"
                  onClick={() => void handleContinueToReview()}
                  disabled={isPending}
                >
                  Continue to Review <ArrowRight className="af-btn-arrow" />
                </button>
              </div>

              <div className="af-back-link-wrap">
                <Link href="/apply" className="af-back-link">
                  ← Back to overview
                </Link>
              </div>
            </>
          )}

          {/* ══ STEP 2: Review & Pay ══ */}
          {step === 2 && (
            <>
              <div className="af-card-header">
                <h1 className="af-card-title">Review &amp; Payment</h1>
                <p className="af-card-subtitle">
                  Confirm your plan and choose your preferred payment method.
                </p>
              </div>

              {/* Selected plan summary card */}
              <div className="af-plan-summary">
                <div className="af-plan-summary-header">
                  <div className="af-plan-summary-left">
                    <PlanIcon className="af-plan-summary-icon" />
                    <div>
                      <p className="af-plan-summary-name">{planDetails.label.toUpperCase()}</p>
                      <p className="af-plan-summary-desc">{planDetails.description}</p>
                    </div>
                  </div>
                  <div className="af-plan-summary-price-wrap">
                    <span className="af-plan-summary-price">{planDetails.price}</span>
                    <span className="af-plan-summary-original">{planDetails.originalPrice}</span>
                  </div>
                </div>
                <div className="af-plan-summary-features">
                  {planDetails.features.map((f: string) => (
                    <div key={f} className="af-plan-summary-feature">
                      <span className="af-plan-summary-check">✓</span>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment method */}
              {hasPaymentOptions ? (
                <div className="af-payment-section">
                  <p className="af-payment-label">PAYMENT METHOD</p>
                  <p className="af-payment-hint">
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
                <div className="af-payment-section">
                  <p className="af-payment-label">PAYMENT METHOD</p>
                  <p className="af-payment-hint">
                    No payment required now — we&apos;ll reach out on Messenger to confirm your slot and send payment instructions.
                  </p>
                </div>
              )}

              {/* Step 2 actions */}
              <div className="af-actions af-actions--row">
                <button
                  type="button"
                  className="af-btn-back"
                  onClick={() => setStep(1)}
                  disabled={isPending}
                >
                  <ArrowLeft className="af-btn-arrow" /> Back
                </button>
                <button
                  type="submit"
                  className="af-btn-submit"
                  disabled={isPending}
                >
                  {isPending ? (
                    <Loader2 className="af-btn-arrow animate-spin" />
                  ) : (
                    <ArrowRight className="af-btn-arrow" />
                  )}
                  {isPending ? "Submitting..." : "Submit Application"}
                </button>
              </div>

              <p className="af-disclaimer">
                No payment required now — we&apos;ll reach out on Messenger to confirm your slot and send payment instructions.
              </p>
            </>
          )}
        </form>
      </div>

      {/* Footer */}
      <p className="af-footer">© 2024 WebSerbisyo RSVP · Made with love for Filipino couples</p>
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
