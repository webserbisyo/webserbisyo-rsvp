import Image from "next/image";

export function LandingVisualHero() {
  return (
    <section
      aria-label="WebSerbisyo RSVP visual introduction"
      className="landing-hero relative flex min-h-screen min-h-dvh w-full items-center justify-center overflow-hidden"
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
        <div className="absolute inset-0 bg-rsvp-surface/8" />
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

        {/* Microcopy + scroll cue */}
        <div className="hero-microcopy flex flex-col items-center gap-4 -mt-6 sm:-mt-10 lg:-mt-16">
          <p className="text-center text-base font-semibold tracking-wide text-foreground/80 sm:text-lg">
            Digital RSVP websites for Filipino celebrations
          </p>
          <p className="hero-scroll-cue text-xs font-medium tracking-[0.18em] text-foreground/50 uppercase">
            Explore ↓
          </p>
        </div>
      </div>
    </section>
  );
}
