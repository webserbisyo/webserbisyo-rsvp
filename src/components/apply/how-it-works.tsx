import { ClipboardCheck, MessageCircleMore, ShieldCheck, WalletCards } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const STEPS = [
  {
    description: "Pick the Pro or Max setup that matches your event and hosting needs.",
    icon: ClipboardCheck,
    title: "Choose a plan",
  },
  {
    description: "Send your event details through the application form so the team can review it.",
    icon: ShieldCheck,
    title: "Submit your application",
  },
  {
    description: "Select GCash or Maya so we know which manual payment details to prepare for you.",
    icon: WalletCards,
    title: "Choose a manual payment option",
  },
  {
    description:
      "Continue the conversation on Messenger so WebSerbisyo can confirm setup and next steps.",
    icon: MessageCircleMore,
    title: "Follow up on Messenger",
  },
];

export function HowItWorks() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {STEPS.map((step, index) => {
        const Icon = step.icon;

        return (
          <Card key={step.title} className="rsvp-panel-muted border-border/70 rounded-3xl">
            <CardHeader className="space-y-3">
              <div className="bg-rsvp-accent text-rsvp-accent-foreground flex size-11 items-center justify-center rounded-2xl">
                <Icon className="size-5" />
              </div>
              <div className="space-y-1">
                <p className="text-rsvp-brand text-xs font-semibold tracking-[0.2em] uppercase">
                  Step {index + 1}
                </p>
                <CardTitle className="text-lg">{step.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm leading-6">{step.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
