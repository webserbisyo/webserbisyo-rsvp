"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Calendar, MessageSquare, Pencil } from "lucide-react";
import { isSameDay } from "date-fns";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";

function clampProgress(value: number) {
  return Math.min(100, Math.max(0, value));
}

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

function getProgressValue({
  countdownStartAt,
  now,
  targetDate,
}: {
  countdownStartAt?: Date | null;
  now: Date;
  targetDate: Date;
}) {
  const deadlineDate = new Date(targetDate);
  deadlineDate.setDate(deadlineDate.getDate() - 30);

  let progressStart = deadlineDate;
  let progressEnd = targetDate;

  if (countdownStartAt && countdownStartAt.getTime() < deadlineDate.getTime()) {
    progressStart = countdownStartAt;
    progressEnd = deadlineDate;
  }

  const duration = progressEnd.getTime() - progressStart.getTime();
  if (duration <= 0) {
    return 72;
  }

  const elapsed = now.getTime() - progressStart.getTime();
  return clampProgress((elapsed / duration) * 100);
}

function parseDate(value?: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function FlowerCluster({ side = "left" }: { side?: "left" | "right" }) {
  const flip = side === "right" ? "ws-flower-right" : "";

  return (
    <svg className={`ws-flower-cluster ${flip}`} viewBox="0 0 220 260" aria-hidden="true">
      <defs>
        <radialGradient id={`petalGradient-${side}`} cx="45%" cy="38%" r="72%">
          <stop offset="0%" stopColor="#fff3e5" />
          <stop offset="48%" stopColor="#f5b58f" />
          <stop offset="100%" stopColor="#d56b4c" />
        </radialGradient>
        <linearGradient id={`leafGradient-${side}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e9b17d" />
          <stop offset="100%" stopColor="#896e3e" />
        </linearGradient>
      </defs>

      <g opacity="0.72" fill="none" stroke="#ffd9bd" strokeWidth="2" strokeLinecap="round">
        <path d="M39 238C58 165 95 88 176 24" />
        <path d="M52 210C79 189 107 182 142 192" />
        <path d="M70 164C95 143 121 138 153 147" />
        <path d="M98 112C119 91 145 82 178 88" />
      </g>

      <g fill={`url(#leafGradient-${side})`} opacity="0.66">
        <path d="M55 207c-23-7-38 2-49 19 23 8 41 1 49-19Z" />
        <path d="M86 164c-22-5-37 5-45 24 23 5 40-3 45-24Z" />
        <path d="M116 113c-19-8-36-3-49 13 20 9 37 5 49-13Z" />
        <path d="M158 75c-3-21 6-36 26-45 4 22-4 38-26 45Z" />
        <path d="M36 232c25-14 49-11 72 8-25 15-49 12-72-8Z" />
      </g>

      <g className="ws-blossom" transform="translate(48 166) scale(1.18)">
        {[0, 60, 120, 180, 240, 300].map((rotation) => (
          <ellipse
            key={rotation}
            cx="0"
            cy="-23"
            rx="14"
            ry="28"
            fill={`url(#petalGradient-${side})`}
            transform={`rotate(${rotation})`}
          />
        ))}
        <circle r="13" fill="#8e3d24" />
        <circle r="8" fill="#f7bb65" />
      </g>

      <g className="ws-blossom" transform="translate(90 99) scale(.68)">
        {[0, 72, 144, 216, 288].map((rotation) => (
          <ellipse
            key={rotation}
            cx="0"
            cy="-17"
            rx="10"
            ry="20"
            fill={`url(#petalGradient-${side})`}
            transform={`rotate(${rotation})`}
          />
        ))}
        <circle r="9" fill="#9a4329" />
        <circle r="5" fill="#ffd075" />
      </g>

      <g className="ws-blossom" transform="translate(147 55) scale(.45)">
        {[0, 72, 144, 216, 288].map((rotation) => (
          <ellipse
            key={rotation}
            cx="0"
            cy="-15"
            rx="9"
            ry="18"
            fill={`url(#petalGradient-${side})`}
            transform={`rotate(${rotation})`}
          />
        ))}
        <circle r="7" fill="#9a4329" />
        <circle r="4" fill="#ffd075" />
      </g>

      <g fill="#f8c39c" opacity="0.78">
        <circle cx="68" cy="124" r="5" />
        <circle cx="75" cy="136" r="3" />
        <circle cx="119" cy="78" r="4" />
        <circle cx="135" cy="92" r="3" />
        <circle cx="97" cy="215" r="4" />
      </g>
    </svg>
  );
}

const PETAL_DATA = [
  { left: "33%", delay: 0, duration: 7, size: 17, rotate: 24 },
  { left: "42%", delay: 1.1, duration: 9, size: 22, rotate: -18 },
  { left: "53%", delay: 0.3, duration: 8.5, size: 15, rotate: 52 },
  { left: "63%", delay: 1.8, duration: 7.5, size: 19, rotate: -40 },
  { left: "73%", delay: 0.8, duration: 8, size: 24, rotate: 12 },
  { left: "83%", delay: 2.2, duration: 10, size: 14, rotate: -65 },
  { left: "48%", delay: 3.1, duration: 8.7, size: 18, rotate: 30 },
  { left: "58%", delay: 2.5, duration: 9.5, size: 21, rotate: -20 },
  { left: "39%", delay: 4, duration: 8.2, size: 14, rotate: 72 },
] as const;

function FallingPetals() {
  const reduceMotion = useReducedMotion();
  const petals = useMemo(() => PETAL_DATA, []);

  return (
    <div className="ws-petals" aria-hidden="true">
      {petals.map((petal, index) => (
        <motion.span
          key={index}
          className="ws-petal"
          style={{ left: petal.left, width: petal.size, height: petal.size * 0.54 }}
          initial={{ y: reduceMotion ? 0 : -42, x: 0, rotate: petal.rotate, opacity: 0.45 }}
          animate={
            reduceMotion
              ? { opacity: 0.55 }
              : {
                  opacity: [0, 0.85, 0.78, 0],
                  rotate: [petal.rotate, petal.rotate + 80, petal.rotate + 160, petal.rotate + 230],
                  x: [0, index % 2 === 0 ? 18 : -18, index % 2 === 0 ? -10 : 12, 24],
                  y: [-42, 44, 128, 214],
                }
          }
          transition={{
            delay: petal.delay,
            duration: petal.duration,
            ease: "easeInOut",
            repeat: Infinity,
          }}
        />
      ))}
    </div>
  );
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

function CountdownProgress({
  progressValue,
  reduceMotion,
}: {
  progressValue: number;
  reduceMotion: boolean | null;
}) {
  const dotLeft = `calc(${progressValue}% - 7px)`;

  return (
    <div className="ws-progress-shell">
      <Progress className="ws-progress-track" value={progressValue} />
      <motion.span
        animate={reduceMotion ? {} : { opacity: [0.82, 1, 0.82], scale: [1, 1.16, 1] }}
        className="ws-progress-dot"
        style={{ left: dotLeft }}
        transition={{ duration: 2.2, ease: "easeInOut", repeat: Infinity }}
      />
    </div>
  );
}

export function EventCountdownCard({
  countdownStartAt,
  eventDateTime,
  rsvpDeadlineLabel,
}: {
  countdownStartAt?: string;
  eventDateTime?: string;
  rsvpDeadlineLabel: string;
}) {
  const shouldReduceMotion = useReducedMotion();
  const targetDate = useMemo(() => parseDate(eventDateTime), [eventDateTime]);
  const countdownStartDate = useMemo(() => parseDate(countdownStartAt), [countdownStartAt]);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (!targetDate) return;

    const interval = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(interval);
  }, [targetDate]);

  if (!targetDate) {
    return (
      <motion.section
        animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
        className="ws-countdown-hero"
        initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
      >
        <FlowerCluster side="left" />
        <FlowerCluster side="right" />
        <FallingPetals />
        <div className="ws-countdown-veil" aria-hidden="true" />

        <Link href="/dashboard/event" className="ws-edit-date">
          <Pencil size={13} />
          <span className="ws-edit-date-full">Edit date &amp; time</span>
          <span className="ws-edit-date-short">Edit date</span>
        </Link>

        <div className="ws-hero-left">
          <div className="ws-kicker">Countdown to your event</div>
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

  const timeLeft = getTimeLeft(targetDate, now);
  const isEventDay = isSameDay(now, targetDate);
  const isAfterEvent = now > targetDate && !isEventDay;
  const progressValue = getProgressValue({
    countdownStartAt: countdownStartDate,
    now,
    targetDate,
  });

  return (
    <motion.section
      animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
      className="ws-countdown-hero"
      initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
      transition={{ duration: 0.55, ease: "easeOut" }}
    >
      <FlowerCluster side="left" />
      <FlowerCluster side="right" />
      <FallingPetals />
      <div className="ws-countdown-veil" aria-hidden="true" />

      <Link href="/dashboard/event" className="ws-edit-date">
        <Pencil size={13} />
        <span className="ws-edit-date-full">Edit date &amp; time</span>
        <span className="ws-edit-date-short">Edit date</span>
      </Link>

      <div className="ws-hero-left">
        <div className="ws-kicker">Countdown to your event</div>

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
          <>
            <div className="ws-count-grid">
              <CountdownTile label="Days" value={timeLeft.days} />
              <CountdownTile label="Hours" value={timeLeft.hours} />
              <CountdownTile label="Minutes" value={timeLeft.minutes} />
              <CountdownTile label="Seconds" value={timeLeft.seconds} />
            </div>
            <CountdownProgress progressValue={progressValue} reduceMotion={shouldReduceMotion} />
            <p className="ws-timer-caption">Time remaining until your special day</p>
          </>
        )}
      </div>
    </motion.section>
  );
}
