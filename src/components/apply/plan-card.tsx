import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

type PlanCardProps = {
  ctaLabel: string;
  description: string;
  highlights: string[];
  href: string;
  label: "Pro" | "Max";
  tone?: "default" | "featured";
};

export function PlanCard({
  ctaLabel,
  description,
  highlights,
  href,
  label,
  tone = "default",
}: PlanCardProps) {
  const isFeatured = tone === "featured";

  return (
    <Card
      className={`rsvp-panel border-border/70 h-full rounded-3xl ${
        isFeatured ? "border-rsvp-brand/40 shadow-[0_24px_60px_rgba(123,63,38,0.18)]" : ""
      }`}
    >
      <CardHeader className="space-y-4">
        <Badge
          className={
            isFeatured
              ? "bg-rsvp-brand text-rsvp-brand-foreground hover:bg-rsvp-brand w-fit"
              : "bg-rsvp-accent text-rsvp-accent-foreground hover:bg-rsvp-accent w-fit"
          }
        >
          {label}
        </Badge>
        <div className="space-y-2">
          <CardTitle className="text-2xl font-semibold tracking-tight">{label} Plan</CardTitle>
          <p className="text-muted-foreground text-sm leading-6">{description}</p>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {highlights.map((highlight) => (
          <div key={highlight} className="flex items-start gap-3 text-sm leading-6">
            <CheckCircle2 className="text-rsvp-brand mt-0.5 size-4" />
            <span>{highlight}</span>
          </div>
        ))}
      </CardContent>

      <CardFooter>
        <Button
          asChild
          size="lg"
          className={
            isFeatured
              ? "bg-rsvp-brand text-rsvp-brand-foreground hover:bg-rsvp-brand/90 w-full"
              : "w-full"
          }
        >
          <Link href={href}>
            {ctaLabel}
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
