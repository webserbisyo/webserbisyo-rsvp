import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LandingVisualHero() {
  return (
    <section
      aria-label="WebSerbisyo RSVP visual introduction"
      className="landing-hero relative flex min-h-dvh min-h-screen w-full scroll-mt-24 items-center justify-center overflow-hidden"
    >
      {/* Background: floral envelope image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/landing/rsvp-hero-bg-floral-envelope.jpeg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        {/* Subtle warm overlay to soften edges without hiding the floral */}
        <div className="bg-rsvp-surface/8 absolute inset-0" />
      </div>

      {/* Centered invitation/phone object */}
      <div className="relative z-10 flex flex-col items-center justify-center gap-6 px-6 py-20">
        <div className="hero-object-float pointer-events-none select-none">
          <Image
            src="/images/landing/rsvp-hero-object-invitation-phone.png"
            alt="RSVP invitation preview on a phone"
            width={2048}
            height={1529}
            priority
            className="h-auto w-[min(95vw,660px)] sm:w-[clamp(600px,75vw,840px)] lg:w-[clamp(720px,60vw,1020px)]"
          />
        </div>

        {/* Microcopy + CTA */}
        <div className="hero-microcopy -mt-6 flex flex-col items-center gap-4 sm:-mt-10 lg:-mt-16">
          <p className="text-foreground/80 text-center text-base font-semibold tracking-wide sm:text-lg">
            Digital RSVP websites for Filipino celebrations
          </p>
          <Button
            asChild
            size="lg"
            className="group/hero-cta bg-rsvp-brand text-rsvp-brand-foreground hover:bg-rsvp-brand/90 mt-2 px-6"
          >
            <Link href="/apply">
              Create my wedding website
              <ArrowRight className="size-4 transition-transform duration-200 group-hover/hero-cta:translate-x-0.5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
