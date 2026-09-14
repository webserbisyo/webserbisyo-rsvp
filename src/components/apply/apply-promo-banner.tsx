"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "ws_launch_promo_deadline";
const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000; // 72 hours

type TimeRemaining = {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
};

function getOrInitDeadline(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? parseInt(raw, 10) : NaN;
    if (!Number.isNaN(parsed) && parsed > Date.now()) {
      return parsed;
    }
    const newDeadline = Date.now() + THREE_DAYS_MS;
    localStorage.setItem(STORAGE_KEY, newDeadline.toString());
    return newDeadline;
  } catch {
    return Date.now() + THREE_DAYS_MS;
  }
}

function calculateTimeLeft(targetTimestamp: number): { time: TimeRemaining; isExpired: boolean } {
  const diff = Math.max(0, targetTimestamp - Date.now());
  const isExpired = diff <= 0;

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / (3600 * 24));
  const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    isExpired,
    time: {
      days: String(days).padStart(2, "0"),
      hours: String(hours).padStart(2, "0"),
      minutes: String(minutes).padStart(2, "0"),
      seconds: String(seconds).padStart(2, "0"),
    },
  };
}

type ApplyPromoBannerProps = {
  className?: string;
  variant?: "banner" | "inline";
};

export function ApplyPromoBanner({ className, variant = "banner" }: ApplyPromoBannerProps) {
  const [mounted, setMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState<TimeRemaining>({
    days: "02",
    hours: "23",
    minutes: "59",
    seconds: "59",
  });

  useEffect(() => {
    setMounted(true);
    let deadline = getOrInitDeadline();

    const tick = () => {
      const { isExpired, time } = calculateTimeLeft(deadline);
      if (isExpired) {
        deadline = Date.now() + THREE_DAYS_MS;
        try {
          localStorage.setItem(STORAGE_KEY, deadline.toString());
        } catch {
          // ignore localStorage access errors
        }
        const fresh = calculateTimeLeft(deadline);
        setTimeLeft(fresh.time);
      } else {
        setTimeLeft(time);
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  const content = (
    <>
      {/* Glowing 50% OFF Pill */}
      <span className="inline-flex items-center rounded-full border border-[#ff5a1f]/45 bg-gradient-to-r from-[#ff5a1f]/20 to-amber-500/20 px-2 py-0.5 text-[10px] sm:text-xs font-black tracking-wider text-[#ff8a5c] shadow-[0_0_12px_rgba(255,90,31,0.35)]">
        50% OFF
      </span>

      {/* Action Label */}
      <span className="hidden text-[10px] font-bold tracking-wider text-white/90 uppercase sm:inline-block sm:text-xs">
        INTRODUCTORY OFFER ENDS IN:
      </span>
      <span className="text-[10px] font-bold tracking-wider text-white/90 uppercase sm:hidden">
        ENDS IN:
      </span>

      {/* Monospace Segmented Glass Blocks */}
      <div className="flex items-center gap-1 font-mono text-[11px] font-bold sm:gap-1.5 sm:text-xs">
        <span className="rounded border border-white/10 bg-white/[0.08] px-1.5 py-0.5 text-white shadow-inner">
          {mounted ? `${timeLeft.days}d` : "--d"}
        </span>
        <span className="text-[#ff8a5c]/80 font-bold">:</span>
        <span className="rounded border border-white/10 bg-white/[0.08] px-1.5 py-0.5 text-white shadow-inner">
          {mounted ? `${timeLeft.hours}h` : "--h"}
        </span>
        <span className="text-[#ff8a5c]/80 font-bold">:</span>
        <span className="rounded border border-white/10 bg-white/[0.08] px-1.5 py-0.5 text-white shadow-inner">
          {mounted ? `${timeLeft.minutes}m` : "--m"}
        </span>
        <span className="text-[#ff8a5c]/80 font-bold">:</span>
        <span className="rounded border border-white/10 bg-white/[0.08] px-1.5 py-0.5 text-[#ff8a5c] shadow-inner">
          {mounted ? `${timeLeft.seconds}s` : "--s"}
        </span>
      </div>
    </>
  );

  if (variant === "inline") {
    return (
      <div
        className={`mb-8 sm:mb-10 inline-flex items-center justify-center gap-2 sm:gap-3 rounded-2xl border border-[#ff8a5c]/25 bg-[#050505]/70 px-4 py-2 sm:px-5 sm:py-2.5 shadow-lg shadow-orange-950/15 backdrop-blur-md ${className ?? ""}`}
      >
        {content}
      </div>
    );
  }

  return (
    <div
      className={`fixed top-0 right-0 left-0 z-50 flex h-10 sm:h-12 w-full items-center justify-center border-b border-[#ff8a5c]/20 bg-[#050505]/90 shadow-[0_4px_20px_rgba(255,138,92,0.1)] backdrop-blur-md ${className ?? ""}`}
    >
      <div className="mx-auto flex h-full max-w-7xl items-center justify-center gap-2 px-3 sm:gap-3 sm:px-6">
        {content}
      </div>
    </div>
  );
}
