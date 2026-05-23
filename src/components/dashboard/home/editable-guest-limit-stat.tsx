"use client";

import { useState, useTransition } from "react";
import { PencilLine, Users } from "lucide-react";
import { updateDashboardGuestLimitAction } from "@/server/actions/dashboard-home";

const GUEST_LIMIT_ERROR = "Guest limit must be between 1 and 1000.";

export function EditableGuestLimitStat({
  eventId,
  initialGuestLimit,
}: {
  eventId: string | null;
  initialGuestLimit: number | null;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [persistedValue, setPersistedValue] = useState<number | null>(initialGuestLimit);
  const [draftValue, setDraftValue] = useState(initialGuestLimit ? `${initialGuestLimit}` : "");
  const [serverError, setServerError] = useState<string | null>(null);

  const validationError = getGuestLimitError(draftValue);
  const hasChanged = draftValue !== (persistedValue ? `${persistedValue}` : "");
  const canEdit = Boolean(eventId);
  const canSave = canEdit && hasChanged && !validationError && !isPending;
  const displayValue = persistedValue ? `${persistedValue}` : "To be finalized";

  function handleCancel() {
    setDraftValue(persistedValue ? `${persistedValue}` : "");
    setServerError(null);
    setIsEditing(false);
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
      setIsEditing(false);
    });
  }

  return (
    <div className="ws-stat-row ws-stat-row-editable">
      <span className="grid h-6 w-6 place-items-center text-[var(--dash-muted)]" aria-hidden="true">
        <Users size={18} />
      </span>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span>Guest Limit</span>
          {!isEditing ? (
            <button
              type="button"
              className="inline-flex h-7 items-center rounded-full border border-[var(--dash-border)] bg-white px-2.5 text-[12px] font-semibold text-[var(--dash-brand-active)] transition hover:border-[var(--dash-border-hover)] hover:bg-[var(--dash-brand-subtle)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dash-ring)] disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => setIsEditing(true)}
              disabled={!canEdit}
            >
              <PencilLine size={13} />
              Edit
            </button>
          ) : null}
        </div>
        <p className="mt-1 text-xs text-[var(--dash-subtle)]">Maximum allowed RSVP guests</p>
        {isEditing ? (
          <div className="mt-3 space-y-2">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={draftValue}
              onChange={(event) => {
                setDraftValue(event.target.value);
                setServerError(null);
              }}
              aria-invalid={validationError || serverError ? "true" : "false"}
              aria-describedby="guest-limit-error"
              className="h-10 w-full rounded-xl border border-[var(--dash-border)] bg-white px-3 text-sm font-semibold text-[var(--dash-foreground)] shadow-sm outline-none transition focus:border-[var(--dash-brand)] focus:ring-2 focus:ring-[color:var(--dash-brand-subtle)]"
              placeholder="Enter guest limit"
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="inline-flex h-9 items-center rounded-xl bg-[var(--dash-brand)] px-3 text-sm font-semibold text-white transition hover:bg-[var(--dash-brand-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dash-ring)] disabled:cursor-not-allowed disabled:opacity-50"
                onClick={handleSave}
                disabled={!canSave}
              >
                {isPending ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                className="inline-flex h-9 items-center rounded-xl border border-[var(--dash-border)] bg-white px-3 text-sm font-semibold text-[var(--dash-muted)] transition hover:border-[var(--dash-border-hover)] hover:bg-[var(--dash-surface-muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dash-ring)] disabled:cursor-not-allowed disabled:opacity-50"
                onClick={handleCancel}
                disabled={isPending}
              >
                Cancel
              </button>
            </div>
            {validationError || serverError ? (
              <p id="guest-limit-error" className="text-xs font-medium text-[#b44b34]">
                {validationError ?? serverError}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
      {!isEditing ? (
        <strong title={displayValue}>{displayValue}</strong>
      ) : (
        <strong className="self-start pt-1 text-xs text-[var(--dash-subtle)]">
          {persistedValue ? `Current: ${persistedValue}` : "Required"}
        </strong>
      )}
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
