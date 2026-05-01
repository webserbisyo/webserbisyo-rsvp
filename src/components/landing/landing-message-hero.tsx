import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LandingMessageHero() {
  return (
    <section
      id="overview"
      className="rsvp-shell flex min-h-screen min-h-dvh w-full scroll-mt-24 items-center justify-center px-4 py-20 sm:px-6 lg:px-8"
    >
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-10 text-center">
        {/* Label */}
        <p className="text-sm font-semibold tracking-[0.22em] text-rsvp-brand uppercase">
          WebSerbisyo RSVP
        </p>

        {/* Headline */}
        <div className="space-y-4">
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            A beautiful RSVP page for guests.
            <br className="hidden sm:block" />
            <span className="text-rsvp-brand"> A calm dashboard for you.</span>
          </h1>

          {/* Subcopy */}
          <p className="mx-auto max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            Launch a polished event page, collect guest responses, and monitor
            your guestbook from one organized dashboard — no spreadsheets, no
            scattered Messenger threads.
          </p>
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <Button
            asChild
            size="lg"
            className="group/msg-cta bg-rsvp-brand px-6 text-rsvp-brand-foreground hover:bg-rsvp-brand/90"
          >
            <Link href="/apply">
              Start My RSVP Website
              <ArrowRight className="size-4 transition-transform duration-200 group-hover/msg-cta:translate-x-0.5" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="px-6 hover:border-rsvp-border hover:bg-rsvp-accent/50"
          >
            {/* TODO: link to #how-it-works once that section is implemented */}
            <Link href="/apply">See How It Works</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
