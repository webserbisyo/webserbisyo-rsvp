"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export function EventCountdownCard({
  eventDate,
  eventTime,
}: {
  eventDate: string | null;
  eventTime: string | null;
}) {
  const shouldReduceMotion = useReducedMotion();
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isClient, setIsClient] = useState(false);
  const [petals, setPetals] = useState<Array<{ id: number; left: string; duration: number; delay: number; xValues: string[] }>>([]);
  
  const hasDate = Boolean(eventDate);
  const targetDateStr = hasDate 
    ? `${eventDate}T${eventTime || "00:00:00"}` 
    : null;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsClient(true);
    
    // Generate petals only on client to avoid hydration mismatch and impure render errors
    const generatedPetals = Array.from({ length: 8 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      duration: 10 + Math.random() * 20,
      delay: Math.random() * -20,
      xValues: ["0vw", `${Math.random() * 20 - 10}vw`]
    }));
    setPetals(generatedPetals);

    if (!targetDateStr) return;

    // Use a fixed UTC offset or local parsing. We'll let JS parse it locally.
    const targetDate = new Date(targetDateStr).getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance < 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        clearInterval(interval);
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDateStr]);

  if (!hasDate) {
    return (
      <Card className="relative overflow-hidden rounded-[2rem] border-0 bg-gradient-to-br from-[var(--dash-brand)] to-[var(--dash-brand-hover)] text-white shadow-lg">
        <CardContent className="flex flex-col items-center justify-center p-12 text-center">
          <p className="mb-2 text-sm font-medium tracking-widest text-white/80">COUNTDOWN TO YOUR EVENT</p>
          <h2 className="mb-6 text-3xl font-semibold">When is the big day?</h2>
          <Button asChild className="bg-white text-[var(--dash-brand)] hover:bg-white/90">
            <Link href="/dashboard/event">Set event date</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const rsvpDeadline = new Date(targetDateStr!);
  rsvpDeadline.setDate(rsvpDeadline.getDate() - 30);

  return (
    <Card className="relative overflow-hidden rounded-[2rem] border-0 bg-gradient-to-br from-[#c96b48] to-[#b85a39] text-white shadow-[0_20px_50px_-12px_rgba(201,107,72,0.4)]">
      {!shouldReduceMotion && isClient && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-30">
          {petals.map((petal) => (
            <motion.div
              key={petal.id}
              className="absolute top-[-10%] h-4 w-4 rounded-full bg-white blur-[2px]"
              animate={{
                y: ["0vh", "120vh"],
                x: petal.xValues,
                rotate: [0, 360],
              }}
              transition={{
                duration: petal.duration,
                repeat: Infinity,
                ease: "linear",
                delay: petal.delay,
              }}
              style={{ left: petal.left }}
            />
          ))}
        </div>
      )}

      <div className="pointer-events-none absolute -left-12 -top-12 h-40 w-40 rounded-full bg-white opacity-5 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-12 -right-12 h-40 w-40 rounded-full bg-black opacity-10 blur-3xl" />

      <CardContent className="relative z-10 flex flex-col p-8 sm:p-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <p className="text-xs font-semibold tracking-widest text-white/80">COUNTDOWN TO YOUR EVENT</p>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {isClient && timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 ? "It's the big day!" : "Wedding day countdown"}
            </h2>
            <p className="text-white/80">RSVP deadline: {format(rsvpDeadline, "MMMM d, yyyy")}</p>
          </div>
          
          <Button asChild variant="outline" size="sm" className="w-fit border-white/20 bg-white/10 text-white backdrop-blur hover:bg-white/20 hover:text-white">
            <Link href="/dashboard/event">
              <Pencil className="mr-2 h-3.5 w-3.5" /> Edit date &amp; time
            </Link>
          </Button>
        </div>

        <div className="mb-4 mt-10 grid grid-cols-4 gap-3 sm:gap-6">
          {[
            { label: "Days", value: timeLeft.days },
            { label: "Hours", value: timeLeft.hours },
            { label: "Mins", value: timeLeft.minutes },
            { label: "Secs", value: timeLeft.seconds },
          ].map((item) => (
            <div key={item.label} className="flex flex-col items-center">
              <div className="flex w-full flex-col items-center justify-center rounded-2xl bg-white/10 py-4 shadow-inner backdrop-blur-md sm:py-6">
                <span className="text-3xl font-medium tabular-nums sm:text-5xl">
                  {isClient ? String(item.value).padStart(2, "0") : "00"}
                </span>
              </div>
              <span className="mt-3 text-xs font-medium uppercase tracking-wider text-white/80 sm:text-sm">
                {item.label}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-6 flex h-1 w-full items-center rounded-full bg-black/10">
          <motion.div 
            className="relative h-full rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]"
            initial={{ width: "0%" }}
            animate={{ width: isClient && targetDateStr ? "75%" : "0%" }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          >
            <motion.div 
              className="absolute -right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-white shadow-[0_0_8px_2px_rgba(255,255,255,0.8)]" 
              animate={shouldReduceMotion ? {} : { scale: [1, 1.3, 1], opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>
        </div>
      </CardContent>
    </Card>
  );
}
