"use client";

import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import {
  RSVP_ATTENDANCE_LABEL,
  RSVP_EMAIL_LABEL,
  RSVP_GUEST_COUNT_LABEL,
  RSVP_GUEST_NAME_LABEL,
  RSVP_MESSAGE_HELPER,
  RSVP_MESSAGE_LABEL,
  RSVP_MESSAGE_PRIVACY_COPY,
  RSVP_PHONE_LABEL,
} from "@/lib/event-website/rsvp-form-copy";
import type { EventWebsiteRsvpFormSection } from "@/lib/event-website/types";
import {
  PUBLIC_RSVP_COMPANION_AGE_LABEL_MAX_LENGTH,
  PUBLIC_RSVP_COMPANION_NAME_MAX_LENGTH,
  PUBLIC_RSVP_DIETARY_NOTES_MAX_LENGTH,
  PUBLIC_RSVP_EMAIL_MAX_LENGTH,
  PUBLIC_RSVP_GUEST_NAME_MAX_LENGTH,
  PUBLIC_RSVP_MESSAGE_MAX_LENGTH,
  PUBLIC_RSVP_PHONE_MAX_LENGTH,
  PublicRsvpResponseFieldsInput,
  RSVP_RESPONSE_STATUS_VALUES,
} from "@/lib/validations/rsvp-response.schema";
import { cn } from "@/lib/utils";
import { normalizePrivateAccessToken } from "@/lib/private-access";
import { submitRsvpResponseAction } from "@/server/actions/responses";
import { Button } from "@/components/ui/button";

type PublicRsvpResponseFormProps = {
  availabilityMessage: string | null;
  eventSlug: string;
  isAcceptingResponses: boolean;
  settings: EventWebsiteRsvpFormSection;
};

type CompanionInput = {
  ageLabel: string;
  fullName: string;
};

type AttendanceStatus = (typeof RSVP_RESPONSE_STATUS_VALUES)[number];

const EMPTY_COMPANION: CompanionInput = {
  ageLabel: "",
  fullName: "",
};

export function PublicRsvpResponseForm({
  availabilityMessage,
  eventSlug,
  isAcceptingResponses,
  settings,
}: PublicRsvpResponseFormProps) {
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [attendanceStatus, setAttendanceStatus] = useState<AttendanceStatus>("attending");
  const [companionCount, setCompanionCount] = useState(0);
  const [companions, setCompanions] = useState<CompanionInput[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[] | undefined>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const shouldShowCompanions =
    attendanceStatus === "attending" && settings.plusOneEnabled && settings.companionLimit > 0;
  const shouldShowEmail = settings.emailEnabled;
  const shouldShowPhone = settings.phoneEnabled;
  const accessToken = normalizePrivateAccessToken(searchParams.get("access"));

  function updateCompanionCount(value: number) {
    const nextCount = Math.max(0, Math.min(value, settings.companionLimit));
    setCompanionCount(nextCount);
    setCompanions((current) =>
      Array.from({ length: nextCount }, (_, index) => current[index] ?? { ...EMPTY_COMPANION }),
    );
  }

  function updateCompanion(index: number, field: keyof CompanionInput, value: string) {
    setCompanions((current) =>
      current.map((companion, companionIndex) =>
        companionIndex === index ? { ...companion, [field]: value } : companion,
      ),
    );
  }

  function resetForm() {
    setAttendanceStatus("attending");
    setCompanionCount(0);
    setCompanions([]);
    setErrorMessage(null);
    setFieldErrors({});
    setIsSubmitted(false);
  }

  function submitResponse(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    setErrorMessage(null);
    setFieldErrors({});

    startTransition(async () => {
      const payload: PublicRsvpResponseFieldsInput = {
        attendanceStatus,
        companionCount: attendanceStatus === "attending" ? companionCount : 0,
        companions: companions.slice(0, companionCount),
        dietaryNotes: formData.get("dietaryNotes")?.toString() ?? "",
        email: formData.get("email")?.toString() ?? "",
        guestName: formData.get("guestName")?.toString() ?? "",
        message: formData.get("message")?.toString() ?? "",
        phone: formData.get("phone")?.toString() ?? "",
      };
      const result = await submitRsvpResponseAction({
        accessToken,
        ...payload,
        eventSlug,
      });

      if (!result.ok) {
        setErrorMessage(result.error);
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }

      setIsSubmitted(true);
    });
  }

  function setAttendanceStatusWithReset(nextStatus: AttendanceStatus) {
    setAttendanceStatus(nextStatus);

    if (nextStatus === "not_attending") {
      updateCompanionCount(0);
    }
  }

  if (!isAcceptingResponses) {
    return (
      <div className="event-preview-rsvp-card event-preview-rsvp-state event-preview-rsvp-state--warning">
        <div className="event-preview-rsvp-state-copy">
          <h4>RSVP submissions are currently closed.</h4>
          <p>
            {availabilityMessage ?? "Please contact the host if you need to update your response."}
          </p>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="event-preview-rsvp-card event-preview-rsvp-state event-preview-rsvp-state--success">
        <div className="flex items-start gap-3 text-left">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
          <div className="event-preview-rsvp-state-copy">
            <h4>Your RSVP has been submitted.</h4>
            <p>Thank you. The host will see your response in their dashboard.</p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={resetForm}
          className="event-preview-submit-button is-secondary"
        >
          Submit another response
        </Button>
      </div>
    );
  }

  return (
    <form className="event-preview-rsvp-card" onSubmit={submitResponse}>
      {errorMessage ? (
        <div className="event-preview-rsvp-inline-error" role="alert">
          <strong>Could not submit RSVP.</strong>
          <p>{errorMessage}</p>
        </div>
      ) : null}

      <FieldError name="guestName" errors={fieldErrors} className="event-preview-field">
        <label htmlFor="guestName">
          <span>{RSVP_GUEST_NAME_LABEL}</span>
          <input
            id="guestName"
            name="guestName"
            autoComplete="name"
            disabled={isPending}
            maxLength={PUBLIC_RSVP_GUEST_NAME_MAX_LENGTH}
            placeholder="Your full name"
            required
          />
        </label>
      </FieldError>

      {shouldShowEmail ? (
        <FieldError name="email" errors={fieldErrors} className="event-preview-field">
          <label htmlFor="email">
            <span>{RSVP_EMAIL_LABEL}</span>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              disabled={isPending}
              maxLength={PUBLIC_RSVP_EMAIL_MAX_LENGTH}
              placeholder="you@example.com"
              required={settings.emailRequired}
            />
          </label>
        </FieldError>
      ) : null}

      {shouldShowPhone ? (
        <FieldError name="phone" errors={fieldErrors} className="event-preview-field">
          <label htmlFor="phone">
            <span>{RSVP_PHONE_LABEL}</span>
            <input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              disabled={isPending}
              maxLength={PUBLIC_RSVP_PHONE_MAX_LENGTH}
              placeholder="09XXXXXXXXX"
              required={settings.phoneRequired}
            />
          </label>
        </FieldError>
      ) : null}

      <div className="event-preview-field">
        <span>{RSVP_ATTENDANCE_LABEL}</span>
        <div className="event-preview-choice-group" aria-label={RSVP_ATTENDANCE_LABEL}>
          <AttendanceOption
            id="attendance-attending"
            checked={attendanceStatus === "attending"}
            disabled={isPending}
            label="Yes, I will attend"
            onChange={() => setAttendanceStatusWithReset("attending")}
            value="attending"
          />
          <AttendanceOption
            id="attendance-not-attending"
            checked={attendanceStatus === "not_attending"}
            disabled={isPending}
            label="Sorry, I can't attend"
            onChange={() => setAttendanceStatusWithReset("not_attending")}
            value="not_attending"
          />
        </div>
      </div>

      {shouldShowCompanions ? (
        <div className="event-preview-field">
          <span>{RSVP_GUEST_COUNT_LABEL}</span>
          <p className="mb-1 text-[11.5px] leading-snug text-[#7a746f]">
            Choose how many companions you will bring. You may bring up to {settings.companionLimit}
            .
          </p>
          <div className="event-preview-choice-group" aria-label="Guest count">
            {Array.from({ length: settings.companionLimit + 1 }, (_, index) => (
              <button
                key={index}
                type="button"
                className={cn(companionCount === index && "is-selected")}
                onClick={() => updateCompanionCount(index)}
                disabled={isPending}
              >
                {index === 0 ? "Just me" : `Me + ${index}`}
              </button>
            ))}
          </div>

          {settings.companionNameEnabled && companionCount > 0 ? (
            <div className="mt-1 grid gap-3">
              {companions.map((companion, index) => (
                <div
                  key={index}
                  className="flex flex-col gap-2 rounded-[10px] border border-[#ece9e5] bg-[#fbfbfa] p-3 text-left"
                >
                  <span className="text-[11px] font-bold text-[#4d4945]">
                    Companion {index + 1}
                  </span>
                  <input
                    className="event-preview-companion-input"
                    id={`companion-${index}`}
                    value={companion.fullName}
                    onChange={(event) => updateCompanion(index, "fullName", event.target.value)}
                    disabled={isPending}
                    maxLength={PUBLIC_RSVP_COMPANION_NAME_MAX_LENGTH}
                    placeholder="Full Name"
                    required
                  />
                  {settings.companionAgeEnabled ? (
                    <input
                      className="event-preview-companion-input"
                      id={`companion-age-${index}`}
                      value={companion.ageLabel}
                      onChange={(event) => updateCompanion(index, "ageLabel", event.target.value)}
                      disabled={isPending}
                      maxLength={PUBLIC_RSVP_COMPANION_AGE_LABEL_MAX_LENGTH}
                      placeholder="Adult, child, or age"
                    />
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {settings.foodAllergiesEnabled ? (
        <FieldError name="dietaryNotes" errors={fieldErrors} className="event-preview-field">
          <label htmlFor="dietaryNotes">
            <span>Food Allergies / Dietary Restrictions</span>
            <textarea
              id="dietaryNotes"
              name="dietaryNotes"
              rows={4}
              disabled={isPending}
              maxLength={PUBLIC_RSVP_DIETARY_NOTES_MAX_LENGTH}
              placeholder="List any allergies or dietary restrictions for your party."
            />
          </label>
        </FieldError>
      ) : null}

      {settings.messageToHostEnabled ? (
        <FieldError name="message" errors={fieldErrors} className="event-preview-field">
          <label htmlFor="message">
            <span>{RSVP_MESSAGE_LABEL}</span>
            <p className="text-[11.5px] leading-snug text-[#7a746f]">{RSVP_MESSAGE_HELPER}</p>
            <textarea
              id="message"
              name="message"
              rows={4}
              disabled={isPending}
              maxLength={PUBLIC_RSVP_MESSAGE_MAX_LENGTH}
              placeholder="Leave a short message."
            />
            <p className="text-[11.5px] leading-snug text-[#7a746f]">{RSVP_MESSAGE_PRIVACY_COPY}</p>
          </label>
        </FieldError>
      ) : null}

      <Button type="submit" disabled={isPending} className="event-preview-submit-button">
        {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
        {isPending ? "Submitting..." : "Submit RSVP"}
      </Button>
    </form>
  );
}

function AttendanceOption({
  checked,
  disabled,
  id,
  label,
  onChange,
  value,
}: {
  checked: boolean;
  disabled: boolean;
  id: string;
  label: string;
  onChange: () => void;
  value: "attending" | "not_attending";
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "event-preview-choice-option",
        checked && "is-selected",
        disabled && "is-disabled",
      )}
    >
      <input
        id={id}
        type="radio"
        name="attendanceStatus"
        value={value}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="event-preview-choice-input"
      />
      {label}
    </label>
  );
}

function FieldError({
  children,
  className,
  errors,
  name,
}: {
  children: React.ReactNode;
  className?: string;
  errors: Record<string, string[] | undefined>;
  name: string;
}) {
  return (
    <div className={className}>
      {children}
      {errors[name]?.[0] ? <p className="event-preview-field-error">{errors[name]?.[0]}</p> : null}
    </div>
  );
}
