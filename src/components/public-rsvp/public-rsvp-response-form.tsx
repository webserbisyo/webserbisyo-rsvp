"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import type { EventWebsiteRsvpFormSection } from "@/lib/event-website/types";
import { submitRsvpResponseAction } from "@/server/actions/responses";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";

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
  const [isPending, startTransition] = useTransition();
  const [attendanceStatus, setAttendanceStatus] = useState<"attending" | "not_attending">(
    "attending",
  );
  const [companionCount, setCompanionCount] = useState(0);
  const [companions, setCompanions] = useState<CompanionInput[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[] | undefined>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const shouldShowCompanions =
    attendanceStatus === "attending" && settings.plusOneEnabled && settings.companionLimit > 0;

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
      const result = await submitRsvpResponseAction({
        attendanceStatus,
        companionCount: attendanceStatus === "attending" ? companionCount : 0,
        companions: companions.slice(0, companionCount),
        dietaryNotes: formData.get("dietaryNotes") ?? "",
        email: formData.get("email") ?? "",
        eventSlug,
        guestName: formData.get("guestName") ?? "",
        message: formData.get("message") ?? "",
        phone: formData.get("phone") ?? "",
      });

      if (!result.ok) {
        setErrorMessage(result.error);
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }

      setIsSubmitted(true);
    });
  }

  if (!isAcceptingResponses) {
    return (
      <Alert className="rounded-[1.5rem] border-amber-200 bg-amber-50 text-amber-950">
        <AlertTitle>RSVP submissions are currently closed.</AlertTitle>
        <AlertDescription>
          {availabilityMessage ?? "Please contact the host if you need to update your response."}
        </AlertDescription>
      </Alert>
    );
  }

  if (isSubmitted) {
    return (
      <div className="space-y-4 rounded-[1.5rem] border border-emerald-200 bg-emerald-50/80 p-5 text-emerald-950">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
          <div>
            <h3 className="font-medium">Your RSVP has been submitted.</h3>
            <p className="mt-1 text-sm leading-6 text-emerald-900">
              Thank you. The host will see your response in their dashboard.
            </p>
          </div>
        </div>
        <Button type="button" variant="outline" onClick={resetForm}>
          Submit another response
        </Button>
      </div>
    );
  }

  return (
    <form
      className="space-y-5 rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-5"
      onSubmit={submitResponse}
    >
      {errorMessage ? (
        <Alert variant="destructive" className="rounded-2xl">
          <AlertTitle>Could not submit RSVP.</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <FieldError name="guestName" errors={fieldErrors} className="space-y-2">
          <Label htmlFor="guestName">Guest name</Label>
          <Input
            id="guestName"
            name="guestName"
            autoComplete="name"
            disabled={isPending}
            required
          />
        </FieldError>

        <div className="space-y-2">
          <Label>Attendance</Label>
          <RadioGroup
            value={attendanceStatus}
            onValueChange={(value) => {
              const nextStatus = value === "not_attending" ? "not_attending" : "attending";
              setAttendanceStatus(nextStatus);
              if (nextStatus === "not_attending") {
                updateCompanionCount(0);
              }
            }}
            className="grid gap-2"
            disabled={isPending}
          >
            <AttendanceOption id="attendance-attending" label="Attending" value="attending" />
            <AttendanceOption
              id="attendance-not-attending"
              label="Not attending"
              value="not_attending"
            />
          </RadioGroup>
        </div>

        <FieldError name="email" errors={fieldErrors} className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" disabled={isPending} />
        </FieldError>

        <FieldError name="phone" errors={fieldErrors} className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" type="tel" autoComplete="tel" disabled={isPending} />
        </FieldError>
      </div>

      {shouldShowCompanions ? (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="space-y-2">
            <Label htmlFor="companionCount">Companion count</Label>
            <select
              id="companionCount"
              value={companionCount}
              onChange={(event) => updateCompanionCount(Number(event.target.value))}
              disabled={isPending}
              className="border-input bg-background ring-offset-background focus-visible:ring-ring h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              {Array.from({ length: settings.companionLimit + 1 }, (_, index) => (
                <option key={index} value={index}>
                  {index}
                </option>
              ))}
            </select>
          </div>

          {settings.companionNameEnabled && companionCount > 0 ? (
            <div className="grid gap-3">
              {companions.map((companion, index) => (
                <div key={index} className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor={`companion-${index}`}>Companion {index + 1}</Label>
                    <Input
                      id={`companion-${index}`}
                      value={companion.fullName}
                      onChange={(event) => updateCompanion(index, "fullName", event.target.value)}
                      disabled={isPending}
                      required
                    />
                  </div>
                  {settings.companionAgeEnabled ? (
                    <div className="space-y-2">
                      <Label htmlFor={`companion-age-${index}`}>Age label</Label>
                      <Input
                        id={`companion-age-${index}`}
                        value={companion.ageLabel}
                        onChange={(event) => updateCompanion(index, "ageLabel", event.target.value)}
                        disabled={isPending}
                        placeholder="Adult, child, or age"
                      />
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {settings.foodAllergiesEnabled ? (
        <FieldError name="dietaryNotes" errors={fieldErrors} className="space-y-2">
          <Label htmlFor="dietaryNotes">Dietary notes</Label>
          <Textarea
            id="dietaryNotes"
            name="dietaryNotes"
            rows={4}
            disabled={isPending}
            placeholder="Food allergies, dietary restrictions, or meal notes"
          />
        </FieldError>
      ) : null}

      {settings.messageToHostEnabled ? (
        <FieldError name="message" errors={fieldErrors} className="space-y-2">
          <Label htmlFor="message">Message</Label>
          <Textarea
            id="message"
            name="message"
            rows={4}
            disabled={isPending}
            placeholder="Write a message to the host"
          />
        </FieldError>
      ) : null}

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
        {isPending ? "Submitting..." : "Submit RSVP"}
      </Button>
    </form>
  );
}

function AttendanceOption({
  id,
  label,
  value,
}: {
  id: string;
  label: string;
  value: "attending" | "not_attending";
}) {
  return (
    <Label
      htmlFor={id}
      className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium"
    >
      <RadioGroupItem id={id} value={value} />
      {label}
    </Label>
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
      {errors[name]?.[0] ? <p className="text-destructive text-sm">{errors[name]?.[0]}</p> : null}
    </div>
  );
}
