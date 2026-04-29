import "server-only";

import { addDays } from "date-fns";
import { ServiceError } from "@/server/services/service-error";

export type HostingCoverage = {
  hostingEndsAt: string;
  hostingStartsAt: string;
  renewalRequiredAt: string | null;
};

type HostingCoverageInput = {
  defaultHostingDays: number;
  paidAt: string;
  renewalNoticeDays: number;
};

export function calculateHostingCoverage(input: HostingCoverageInput): HostingCoverage {
  const startsAt = new Date(input.paidAt);

  if (Number.isNaN(startsAt.getTime())) {
    throw new ServiceError("The payment confirmation time is invalid.");
  }

  const endsAt = addDays(startsAt, input.defaultHostingDays);
  const renewalRequiredAt =
    input.renewalNoticeDays > 0 ? addDays(endsAt, -input.renewalNoticeDays) : endsAt;

  return {
    hostingEndsAt: endsAt.toISOString(),
    hostingStartsAt: startsAt.toISOString(),
    renewalRequiredAt: renewalRequiredAt.toISOString(),
  };
}
