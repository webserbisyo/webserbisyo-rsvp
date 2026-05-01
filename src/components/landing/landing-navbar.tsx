"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, MenuIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const NAV_LINKS = [
  { href: "#preview", label: "Preview" },
  { href: "#overview", label: "Overview" },
] as const;

export function LandingNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

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
          className="flex items-center gap-1.5 font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rsvp-ring"
        >
          WebSerbisyo
          <span className="rounded-full bg-rsvp-accent px-2 py-0.5 text-[0.65rem] font-semibold tracking-wide text-rsvp-accent-foreground leading-none">
            RSVP
          </span>
        </Link>

        {/* Desktop links */}
        <ul className="hidden items-center gap-1 md:flex" role="list">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-foreground/80 transition-colors hover:bg-rsvp-accent/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rsvp-ring"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Desktop CTA */}
        <div className="hidden md:block">
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

        {/* Mobile menu */}
        <div className="md:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Open navigation menu"
                className="hover:bg-rsvp-accent/50"
              >
                <MenuIcon className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="top" className="border-rsvp-border/50 bg-rsvp-surface/95 backdrop-blur-xl">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-1.5 text-base font-semibold">
                  WebSerbisyo
                  <span className="rounded-full bg-rsvp-accent px-2 py-0.5 text-[0.65rem] font-semibold tracking-wide text-rsvp-accent-foreground leading-none">
                    RSVP
                  </span>
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-1 px-4 pb-2">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex min-h-[44px] items-center rounded-xl px-3 text-base font-medium text-foreground/80 transition-colors hover:bg-rsvp-accent/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rsvp-ring"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
              <div className="px-4 pb-4">
                <Button
                  asChild
                  size="lg"
                  className="group/mobile-cta w-full bg-rsvp-brand text-rsvp-brand-foreground hover:bg-rsvp-brand/90"
                  onClick={() => setMobileOpen(false)}
                >
                  <Link href="/apply">
                    Start My RSVP Website
                    <ArrowRight className="size-4 transition-transform duration-200 group-hover/mobile-cta:translate-x-0.5" />
                  </Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
