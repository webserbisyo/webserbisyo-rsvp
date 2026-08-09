import { z } from "zod";

export const META_ACQUISITION_EVENT_NAMES = [
  "InitiateCheckout",
  "SelectPlan",
  "StartApplicationClick",
  "Contact",
  "CompleteRegistration",
  "ViewContent",
  "PageView",
] as const;

export type MetaAcquisitionEventName = (typeof META_ACQUISITION_EVENT_NAMES)[number];

const EventIdSchema = z.string().uuid();
const BrowserIdentifierSchema = z.string().trim().max(512).optional();
const PlanSchema = z.enum(["pro", "max"]);
const SourcePathSchema = z.enum(["/", "/apply", "/apply/start", "/apply/success"]);

const SharedSchema = z.object({
  eventId: EventIdSchema,
  fbc: BrowserIdentifierSchema,
  fbp: BrowserIdentifierSchema,
});

export const MetaAcquisitionEventSchema = z.discriminatedUnion("eventName", [
  SharedSchema.extend({
    eventName: z.literal("InitiateCheckout"),
    plan: PlanSchema,
    sourcePath: z.literal("/apply/start"),
  }),
]);

export type MetaAcquisitionEventInput = z.infer<typeof MetaAcquisitionEventSchema>;

export function isMetaAcquisitionEventEnabled(
  eventName: MetaAcquisitionEventName,
  config: {
    completeRegistrationEnabled: boolean;
    contactEnabled: boolean;
    initiateCheckoutEnabled: boolean;
    pageViewEnabled: boolean;
    selectPlanEnabled: boolean;
    startApplicationClickEnabled: boolean;
    viewContentEnabled: boolean;
  },
) {
  switch (eventName) {
    case "InitiateCheckout":
      return config.initiateCheckoutEnabled;
    case "SelectPlan":
      return config.selectPlanEnabled;
    case "StartApplicationClick":
      return config.startApplicationClickEnabled;
    case "Contact":
      return config.contactEnabled;
    case "CompleteRegistration":
      return config.completeRegistrationEnabled;
    case "ViewContent":
      return config.viewContentEnabled;
    case "PageView":
      return config.pageViewEnabled;
  }
}

export function getPlanValue(plan: "pro" | "max") {
  return plan === "max" ? 3599 : 1599;
}

export function getCanonicalSourcePath(path: string) {
  return SourcePathSchema.safeParse(path).success ? path : null;
}
