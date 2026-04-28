import Link from "next/link";
import { ArrowRight, CircleHelp, MessageCircleMore, WalletCards } from "lucide-react";
import type { PublicApplyConfig } from "@/lib/apply/public-payment-option-dto";
import { buildMessengerContinueUrl } from "@/lib/apply/messenger";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { HowItWorks } from "./how-it-works";
import { PlanCard } from "./plan-card";

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

export function ApplyLanding({ config }: ApplyLandingProps) {
  const messengerUrl = buildMessengerContinueUrl(config.messengerPageUrl);

  return (
    <main className="rsvp-shell min-h-screen">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-14 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <section className="rsvp-panel border-border/70 overflow-hidden rounded-[2rem] px-6 py-10 sm:px-10">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div className="space-y-6">
              <Badge className="bg-rsvp-accent text-rsvp-accent-foreground hover:bg-rsvp-accent">
                WebSerbisyo RSVP
              </Badge>
              <div className="space-y-4">
                <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
                  Launch your RSVP setup with a cleaner intake and manual confirmation flow.
                </h1>
                <p className="text-muted-foreground max-w-2xl text-base leading-7 sm:text-lg">
                  Start with the plan that fits your event, send your application, and continue on
                  Messenger while the WebSerbisyo team confirms the manual payment details and
                  onboarding steps with you.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="bg-rsvp-brand text-rsvp-brand-foreground hover:bg-rsvp-brand/90"
                >
                  <Link href="/apply/start?plan=pro">
                    Apply for Pro
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/apply/start?plan=max">
                    Apply for Max
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                {messengerUrl ? (
                  <Button asChild size="lg" variant="ghost">
                    <Link href={messengerUrl} target="_blank" rel="noreferrer">
                      Message us
                      <MessageCircleMore className="size-4" />
                    </Link>
                  </Button>
                ) : null}
              </div>
            </div>

            <Card className="rsvp-panel-muted border-border/70 rounded-[1.75rem]">
              <CardHeader className="space-y-3">
                <div className="bg-rsvp-brand text-rsvp-brand-foreground flex size-12 items-center justify-center rounded-2xl">
                  <WalletCards className="size-5" />
                </div>
                <CardTitle className="text-xl">Manual payment friendly</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-4 text-sm leading-6">
                <p>
                  GCash and Maya details are shown during the application only when they are
                  configured and enabled by the admin.
                </p>
                <Separator />
                <p>
                  No proof upload is required here. The public funnel is for intake and follow-up,
                  not payment processing.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="space-y-6">
          <div className="space-y-2">
            <p className="text-rsvp-brand text-sm font-semibold tracking-[0.22em] uppercase">
              Plans
            </p>
            <h2 className="text-3xl font-semibold tracking-tight">Choose your starting point</h2>
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            <PlanCard
              label="Pro"
              description="A polished RSVP setup for streamlined event launches and manual onboarding."
              highlights={[
                "Shared application flow for faster intake",
                "Manual payment coordination through Messenger",
                "Admin-reviewed setup before activation",
              ]}
              href="/apply/start?plan=pro"
              ctaLabel="Apply for Pro"
            />
            <PlanCard
              label="Max"
              tone="featured"
              description="More room for premium event setup conversations while staying in the same admin-first MVP flow."
              highlights={[
                "Everything in Pro with a stronger premium positioning",
                "Manual payment preference saved with the application",
                "Ready for later admin review and approval phases",
              ]}
              href="/apply/start?plan=max"
              ctaLabel="Apply for Max"
            />
          </div>
        </section>

        <section className="space-y-6">
          <div className="space-y-2">
            <p className="text-rsvp-brand text-sm font-semibold tracking-[0.22em] uppercase">
              How it works
            </p>
            <h2 className="text-3xl font-semibold tracking-tight">
              A simple public intake with admin-managed follow-up
            </h2>
          </div>
          <HowItWorks />
        </section>

        <section className="grid gap-5 lg:grid-cols-[1fr_0.95fr]">
          <Card className="rsvp-panel border-border/70 rounded-3xl">
            <CardHeader className="space-y-3">
              <div className="bg-rsvp-accent text-rsvp-accent-foreground flex size-11 items-center justify-center rounded-2xl">
                <WalletCards className="size-5" />
              </div>
              <CardTitle className="text-xl">Manual payment note</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-3 text-sm leading-6">
              <p>
                Payment details are shown as part of the application so you can choose your
                preferred manual payment option up front.
              </p>
              <p>
                Final confirmation still happens on Messenger after you receive your application
                reference. No upload is required in this MVP flow.
              </p>
            </CardContent>
          </Card>

          <Card className="rsvp-panel border-border/70 rounded-3xl">
            <CardHeader className="space-y-3">
              <div className="bg-rsvp-accent text-rsvp-accent-foreground flex size-11 items-center justify-center rounded-2xl">
                <CircleHelp className="size-5" />
              </div>
              <CardTitle className="text-xl">FAQ</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {FAQ_ITEMS.map((item) => (
                  <AccordionItem key={item.question} value={item.question}>
                    <AccordionTrigger>{item.question}</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </section>

        <section className="rsvp-panel border-border/70 rounded-[2rem] px-6 py-8 sm:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <p className="text-rsvp-brand text-sm font-semibold tracking-[0.22em] uppercase">
                Messenger follow-up
              </p>
              <h2 className="text-2xl font-semibold tracking-tight">
                Ready to continue the conversation?
              </h2>
              <p className="text-muted-foreground max-w-2xl text-sm leading-6">
                After you submit your application, use your reference code on Messenger so the
                WebSerbisyo team can confirm your manual payment details and next steps.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="bg-rsvp-brand text-rsvp-brand-foreground hover:bg-rsvp-brand/90"
              >
                <Link href="/apply/start?plan=pro">
                  Start application
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              {messengerUrl ? (
                <Button asChild size="lg" variant="outline">
                  <Link href={messengerUrl} target="_blank" rel="noreferrer">
                    Message WebSerbisyo
                    <MessageCircleMore className="size-4" />
                  </Link>
                </Button>
              ) : (
                <p className="text-muted-foreground text-sm leading-6">
                  Messenger page URL can be added later from the admin payment options page.
                </p>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
