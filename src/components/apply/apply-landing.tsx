"use client";

import Link from "next/link";
import { ArrowRight, CircleHelp, Crown, Sparkles } from "lucide-react";
import type { PublicApplyConfig } from "@/lib/apply/public-payment-option-dto";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type ApplyLandingProps = {
  config: PublicApplyConfig;
};

const FAQ_ITEMS = [
  {
    answer:
      "You can review the manual payment details during the application. Final confirmation is handled on Messenger after submission.",
    question: "Do I need to pay immediately?",
  },
  {
    answer:
      "Yes. If enabled by WebSerbisyo, you can choose between GCash and Maya during the application flow.",
    question: "Can I use GCash or Maya?",
  },
  {
    answer:
      "You will receive a reference code, then continue on Messenger so the team can confirm payment details and onboarding.",
    question: "What happens after applying?",
  },
  {
    answer:
      "Use the reference code on the success page and continue the chat on Messenger for the next steps.",
    question: "How do I follow up?",
  },
];

const PRO_FEATURES = [
  "Lifetime Wedding Website",
  "Online RSVP Management",
  "Unlimited RSVP Responses",
  "Free WebSerbisyo Subdomain",
  "Mobile-Friendly Design",
  "Hosting Included",
  "Website Access Controls",
  "RSVP Dashboard",
  "Guest Response Export",
  "1 Year Support & Maintenance",
];

const MAX_FEATURES = [
  "Everything in PRO",
  "Advanced UI & UX",
  "Premium Motion Experience",
  "More Interactive Experience",
  "Enhanced Visual Storytelling",
  "Higher Design Polish",
  "Priority Setup",
  "Priority Support",
];

export function ApplyLanding({ config: _config }: ApplyLandingProps) {
  return (
    <main className="apply-landing-shell">
      {/* ── Hero heading ── */}
      <div className="apply-landing-hero">
        {/* Promo badge */}
        <div className="apply-promo-badge">
          <span className="apply-promo-dot" />
          🎉 50% OFF Launch Promo
        </div>

        <h1 className="apply-landing-title">
          Choose Your
          <br />
          <span className="apply-landing-title-gold">Wedding Package</span>
        </h1>
        <p className="apply-landing-subtitle">
          Two beautifully crafted plans. Pick the one that fits your big day.
        </p>
      </div>

      {/* ── Plan cards ── */}
      <div className="apply-plans-grid">
        {/* PRO card */}
        <div className="apply-plan-card apply-plan-card--pro">
          <div className="apply-plan-badge-wrap">
            <span className="apply-plan-badge">MOST POPULAR</span>
          </div>

          <div className="apply-plan-inner">
            {/* Title row */}
            <div className="apply-plan-title-row">
              <div className="apply-plan-icon apply-plan-icon--pro">
                <Sparkles className="apply-plan-icon-svg" />
              </div>
              <h2 className="apply-plan-name">PRO</h2>
            </div>

            <p className="apply-plan-desc">
              Everything you need for a beautiful wedding website.
            </p>

            {/* Pricing */}
            <div className="apply-plan-price-row">
              <span className="apply-plan-price">₱1,899</span>
              <span className="apply-plan-price-original">₱3,800</span>
            </div>

            {/* Features */}
            <ul className="apply-plan-features">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="apply-plan-feature">
                  <span className="apply-plan-check apply-plan-check--pro">✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <div className="apply-plan-cta-wrap">
              <Link href="/apply/start?plan=pro" className="apply-plan-cta-btn">
                Select PRO <ArrowRight className="apply-plan-cta-arrow" />
              </Link>
              <p className="apply-plan-tagline">Perfect for most couples.</p>
            </div>
          </div>
        </div>

        {/* MAX card */}
        <div className="apply-plan-card apply-plan-card--max">
          <div className="apply-plan-badge-wrap">
            <span className="apply-plan-badge">MOST MEMORABLE EXPERIENCE</span>
          </div>

          <div className="apply-plan-inner">
            {/* Title row */}
            <div className="apply-plan-title-row">
              <div className="apply-plan-icon apply-plan-icon--max">
                <Crown className="apply-plan-icon-svg apply-plan-icon-svg--max" />
              </div>
              <h2 className="apply-plan-name apply-plan-name--max">MAX</h2>
            </div>

            <p className="apply-plan-desc apply-plan-desc--max">
              For couples who want a more premium and memorable wedding website.
            </p>

            {/* Pricing */}
            <div className="apply-plan-price-row">
              <span className="apply-plan-price apply-plan-price--max">₱3,599</span>
              <span className="apply-plan-price-original apply-plan-price-original--max">₱7,500</span>
            </div>

            {/* Features */}
            <ul className="apply-plan-features">
              {MAX_FEATURES.map((f) => (
                <li key={f} className="apply-plan-feature">
                  <span className="apply-plan-check apply-plan-check--max">✓</span>
                  <span className="apply-plan-feature-text--max">{f}</span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <div className="apply-plan-cta-wrap">
              <Link href="/apply/start?plan=max" className="apply-plan-cta-btn">
                Select MAX <ArrowRight className="apply-plan-cta-arrow" />
              </Link>
              <p className="apply-plan-tagline apply-plan-tagline--max">
                Designed to impress your guests.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Pricing disclaimer ── */}
      <p className="apply-landing-disclaimer">
        Limited introductory pricing. Prices may increase in future releases.
      </p>

      {/* ── FAQ ── */}
      <div className="apply-faq-section">
        <div className="apply-faq-header">
          <div className="apply-faq-icon-wrap">
            <CircleHelp className="apply-faq-icon" />
          </div>
          <h2 className="apply-faq-title">Frequently Asked Questions</h2>
          <p className="apply-faq-subtitle">
            Everything you need to know before getting started.
          </p>
        </div>
        <div className="apply-faq-accordion-wrap">
          <Accordion type="single" collapsible className="w-full">
            {FAQ_ITEMS.map((item) => (
              <AccordionItem
                key={item.question}
                value={item.question}
                className="apply-faq-item"
              >
                <AccordionTrigger className="apply-faq-trigger">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="apply-faq-answer">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </main>
  );
}
