"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LandingNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    let ticking = false;

    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 50);
          ticking = false;
        });
        ticking = true;
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="landing-nav-enter fixed top-4 left-1/2 z-50 w-[calc(100%-2rem)] -translate-x-1/2 sm:w-[calc(100%-3rem)]">
      <nav
        aria-label="Main navigation"
        className={[
          "mx-auto flex max-w-5xl items-center justify-between rounded-2xl border px-4 py-2.5 transition-all duration-300 sm:px-5",
          isScrolled
            ? "border-rsvp-border/50 bg-rsvp-surface/55 shadow-[0_8px_32px_rgb(0_0_0/0.10)] backdrop-blur-xl"
            : "border-rsvp-border/30 bg-rsvp-surface/40 shadow-[0_4px_20px_rgb(0_0_0/0.06)] backdrop-blur-md",
        ].join(" ")}
      >
        {/* Wordmark */}
        <Link
          href="/"
          className="text-foreground focus-visible:ring-rsvp-ring flex items-center gap-1.5 font-semibold focus-visible:ring-2 focus-visible:outline-none"
        >
          WebSerbisyo
          <span className="bg-rsvp-accent text-rsvp-accent-foreground rounded-full px-2 py-0.5 text-[0.65rem] leading-none font-semibold tracking-wide">
            RSVP
          </span>
        </Link>

        {/* Header CTA */}
        <div>
          <Button
            asChild
            size="sm"
            className="group/nav-cta bg-rsvp-brand text-rsvp-brand-foreground hover:bg-rsvp-brand/90"
          >
            <Link href="/apply">
              Start My RSVP Website
              <ArrowRight className="size-3.5 transition-transform duration-200 group-hover/nav-cta:translate-x-0.5" />
            </Link>
          </Button>
        </div>
      </nav>
    </header>
  );
}
