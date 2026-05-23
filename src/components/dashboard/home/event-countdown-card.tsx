"use client";

import { useMemo, useSyncExternalStore } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Calendar, MessageSquare, Pencil } from "lucide-react";
import { isSameDay } from "date-fns";
import Link from "next/link";

function getTimeLeft(targetDate: Date, now: Date) {
  const diff = Math.max(0, targetDate.getTime() - now.getTime());

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    totalMs: diff,
  };
}

function parseDate(value?: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function subscribeToNothing() {
  return () => {};
}

function subscribeToClock(onStoreChange: () => void) {
  const interval = window.setInterval(onStoreChange, 1000);
  return () => window.clearInterval(interval);
}

function CountdownTile({ label, value }: { label: string; value: number }) {
  const display = String(value).padStart(2, "0");

  return (
    <div className="ws-count-tile-wrap">
      <motion.div
        key={`${label}-${display}`}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="ws-count-tile"
        initial={{ opacity: 0.55, scale: 0.985, y: 6 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
      >
        {display}
      </motion.div>
      <div className="ws-count-label">{label}</div>
    </div>
  );
}

function CountdownMessage({
  description,
  title,
}: {
  description: string;
  title: string;
}) {
  return (
    <div className="ws-after-event">
      <div className="ws-after-copy">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      <Link href="/dashboard/responses" className="ws-after-cta">
        <MessageSquare size={15} />
        View responses
      </Link>
    </div>
  );
}

export function EventCountdownCard({
  eventDateLabel,
  eventDateTime,
  hasEventDate,
  hasEventTime,
  rsvpDeadlineLabel,
}: {
  eventDateLabel?: string;
  eventDateTime?: string;
  hasEventDate: boolean;
  hasEventTime: boolean;
  rsvpDeadlineLabel: string;
}) {
  const shouldReduceMotion = useReducedMotion();
  const targetDate = useMemo(() => parseDate(eventDateTime), [eventDateTime]);
  const hasMounted = useSyncExternalStore(subscribeToNothing, () => true, () => false);
  const nowTimestamp = useSyncExternalStore(
    targetDate ? subscribeToClock : subscribeToNothing,
    () => Date.now(),
    () => 0,
  );
  const now = hasMounted && targetDate ? new Date(nowTimestamp) : null;

  if (!hasEventDate) {
    return (
      <motion.section
        animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
        className="ws-countdown-hero"
        initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
      >
        <div className="ws-countdown-overlay" aria-hidden="true" />

        <Link href="/dashboard/event?section=main_event" className="ws-edit-date">
          <Pencil size={13} />
          <span className="ws-edit-date-full">Edit date &amp; time</span>
          <span className="ws-edit-date-short">Edit date</span>
        </Link>

        <div className="ws-hero-left">
          <div className="ws-kicker">Event Countdown</div>
          <h2>
            When is the
            <br />
            special day?
          </h2>
          <div className="ws-deadline">
            <Calendar size={16} />
            <span>Add your event date to unlock the full countdown view.</span>
          </div>
        </div>

        <div className="ws-hero-right ws-hero-empty">
          <p>Your hero countdown, RSVP deadline, and event timeline will appear here once your date is set.</p>
        </div>
      </motion.section>
    );
  }

  if (!hasEventTime || !targetDate) {
    return (
      <motion.section
        animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
        className="ws-countdown-hero"
        initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
      >
        <div className="ws-countdown-overlay" aria-hidden="true" />

        <Link href="/dashboard/event?section=main_event" className="ws-edit-date">
          <Pencil size={13} />
          <span className="ws-edit-date-full">Edit date &amp; time</span>
          <span className="ws-edit-date-short">Edit date</span>
        </Link>

        <div className="ws-hero-left">
          <div className="ws-kicker">Event Countdown</div>
          <h2>
            Date set,
            <br />
            add your time ✦
          </h2>
          <div className="ws-deadline">
            <Calendar size={16} />
            <span>
              Event date: <strong>{eventDateLabel ?? "Date set"}</strong>
            </span>
          </div>
        </div>

        <div className="ws-hero-right ws-hero-empty">
          <p>
            Your event date is saved. Add the ceremony time to unlock the live countdown and guest-facing timeline.
          </p>
        </div>
      </motion.section>
    );
  }

  const timeLeft = now ? getTimeLeft(targetDate, now) : null;
  const isEventDay = Boolean(now && isSameDay(now, targetDate));
  const isAfterEvent = Boolean(now && now > targetDate && !isEventDay);

  return (
    <motion.section
      animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
      className="ws-countdown-hero"
      initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
      transition={{ duration: 0.55, ease: "easeOut" }}
    >
      <div className="ws-countdown-overlay" aria-hidden="true" />

      <Link href="/dashboard/event?section=main_event" className="ws-edit-date">
        <Pencil size={13} />
        <span className="ws-edit-date-full">Edit date &amp; time</span>
        <span className="ws-edit-date-short">Edit date</span>
      </Link>

      <div className="ws-hero-left">
        <div className="ws-kicker">Event Countdown</div>

        {isAfterEvent ? (
          <h2>
            Celebration
            <br />
            completed ✦
          </h2>
        ) : isEventDay ? (
          <h2>
            Today is
            <br />
            the day ✦
          </h2>
        ) : (
          <h2>
            Your special day
            <br />
            countdown
          </h2>
        )}

        <div className="ws-deadline">
          <Calendar size={16} />
          <span>
            RSVP deadline: <strong>{rsvpDeadlineLabel}</strong>
          </span>
        </div>
      </div>

      <div className="ws-hero-right">
        {isAfterEvent ? (
          <CountdownMessage
            description="Your RSVP website and responses remain available during your coverage period."
            title="Celebration completed ✦"
          />
        ) : isEventDay ? (
          <CountdownMessage
            description="Your event is happening today."
            title="Today is the day ✦"
          />
        ) : (
          <div className="ws-countdown-panel">
            <div className="ws-count-grid">
              <CountdownTile label="Days" value={timeLeft?.days ?? 0} />
              <CountdownTile label="Hours" value={timeLeft?.hours ?? 0} />
              <CountdownTile label="Minutes" value={timeLeft?.minutes ?? 0} />
              <CountdownTile label="Seconds" value={timeLeft?.seconds ?? 0} />
            </div>
            <div className="ws-countdown-footer">
              <p className="ws-timer-caption">
                {hasMounted ? "Time remaining until your event" : "Countdown starting..."}
              </p>
            </div>
          </div>
        )}
      </div>
    </motion.section>
  );
}
