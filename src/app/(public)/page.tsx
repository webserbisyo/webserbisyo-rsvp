import type { Metadata } from "next";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { LandingMessageHero } from "@/components/landing/landing-message-hero";
import { LandingVisualHero } from "@/components/landing/landing-visual-hero";

export const metadata: Metadata = {
  title: "WebSerbisyo RSVP — Digital RSVP websites for Filipino celebrations",
  description:
    "Launch a polished RSVP page for your event. Collect guest responses and manage your guestbook from one organized dashboard.",
};

export default function PublicLandingPage() {
  return (
    <>
      <LandingNavbar />
      <main>
        <LandingVisualHero />
        <LandingMessageHero />
      </main>
    </>
  );
}
