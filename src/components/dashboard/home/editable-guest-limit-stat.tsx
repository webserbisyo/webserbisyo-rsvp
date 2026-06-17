"use client";

import { useId, useState, useTransition } from "react";
import { Pencil, Users } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { updateDashboardGuestLimitAction } from "@/server/actions/dashboard-home";

const GUEST_LIMIT_ERROR = "Guest limit must be between 1 and 1000.";

export function EditableGuestLimitStat({
  eventId,
  initialGuestLimit,
}: {
  eventId: string | null;
  initialGuestLimit: number | null;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [persistedValue, setPersistedValue] = useState<number | null>(initialGuestLimit);
  const [draftValue, setDraftValue] = useState(initialGuestLimit ? `${initialGuestLimit}` : "");
  const [serverError, setServerError] = useState<string | null>(null);
  const errorId = useId();
  const inputId = useId();

  const validationError = getGuestLimitError(draftValue);
  const hasChanged = draftValue !== (persistedValue ? `${persistedValue}` : "");
  const canEdit = Boolean(eventId);
  const canSave = canEdit && hasChanged && !validationError && !isPending;
  const displayValue = formatGuestLimit(persistedValue ?? 1000);

  function handleCancel() {
    setDraftValue(persistedValue ? `${persistedValue}` : "");
    setServerError(null);
    setIsOpen(false);
  }

  function handleSave() {
    if (!eventId || !canSave) {
      return;
    }

    setServerError(null);
    startTransition(async () => {
      const result = await updateDashboardGuestLimitAction({
        eventId,
        guestLimit: Number(draftValue),
      });

      if (!result.ok) {
        const fieldError = result.fieldErrors?.guestLimit?.[0];
        setServerError(fieldError ? GUEST_LIMIT_ERROR : (result.error ?? GUEST_LIMIT_ERROR));
        return;
      }

      setPersistedValue(result.data.guestLimit);
      setDraftValue(`${result.data.guestLimit}`);
      setIsOpen(false);
    });
  }

  return (
    <div className="ws-stat-row">
      <span className="grid h-6 w-6 place-items-center text-[var(--dash-muted)]" aria-hidden="true">
        <Users size={18} />
      </span>
      <div className="flex min-w-0 items-center gap-2">
        <span className="truncate">Guest Limit</span>
        <Popover
          open={isOpen}
          onOpenChange={(nextOpen) => {
            if (!nextOpen && isPending) {
              return;
            }

            if (!nextOpen) {
              setDraftValue(persistedValue ? `${persistedValue}` : "");
              setServerError(null);
            }

            setIsOpen(nextOpen);
          }}
        >
          <PopoverTrigger asChild>
            <button
              type="button"
              className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full border border-[var(--dash-border)] bg-white px-2.5 text-[12px] leading-none font-semibold text-[var(--dash-brand-active)] transition hover:border-[var(--dash-border-hover)] hover:bg-[var(--dash-brand-subtle)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dash-ring)] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!canEdit}
            >
              <span>Edit</span>
              <Pencil size={13} />
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            data-dashboard
            sideOffset={10}
            avoidCollisions
            collisionPadding={16}
            className="border-border bg-popover text-popover-foreground w-[min(19rem,calc(100vw-2rem))] min-w-[18rem] gap-3 rounded-2xl border p-4 shadow-lg"
          >
            <PopoverHeader className="gap-1">
              <PopoverTitle className="text-foreground text-sm font-semibold">
                Edit guest limit
              </PopoverTitle>
            </PopoverHeader>
            <div className="space-y-3">
              <label htmlFor={inputId} className="sr-only">
                Guest limit
              </label>
              <input
                id={inputId}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={draftValue}
                onChange={(event) => {
                  setDraftValue(event.target.value);
                  setServerError(null);
                }}
                aria-invalid={validationError || serverError ? "true" : "false"}
                aria-describedby={validationError || serverError ? errorId : undefined}
                aria-label="Guest limit"
                className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-ring/20 h-11 w-full rounded-2xl border px-3 text-sm font-semibold shadow-sm transition outline-none focus:ring-2"
                placeholder="Enter guest limit"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="bg-primary text-primary-foreground focus-visible:outline-ring disabled:border-border disabled:bg-muted disabled:text-muted-foreground inline-flex h-10 items-center rounded-xl px-3.5 text-sm font-semibold shadow-sm transition hover:brightness-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:border disabled:opacity-100"
                  onClick={handleSave}
                  disabled={!canSave}
                >
                  {isPending ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  className="border-border bg-secondary text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-ring inline-flex h-10 items-center rounded-xl border px-3.5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={handleCancel}
                  disabled={isPending}
                >
                  Cancel
                </button>
              </div>
              {validationError || serverError ? (
                <p id={errorId} className="text-xs font-medium text-[#b44b34]">
                  {validationError ?? serverError}
                </p>
              ) : null}
            </div>
          </PopoverContent>
        </Popover>
      </div>
      <strong title={displayValue}>{displayValue}</strong>
    </div>
  );
}

function getGuestLimitError(value: string) {
  if (!value.trim()) {
    return GUEST_LIMIT_ERROR;
  }

  if (!/^\d+$/.test(value)) {
    return GUEST_LIMIT_ERROR;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 1000) {
    return GUEST_LIMIT_ERROR;
  }

  return null;
}

function formatGuestLimit(value: number) {
  const formattedValue = new Intl.NumberFormat("en-PH").format(value);
  return `${formattedValue} guests`;
}
