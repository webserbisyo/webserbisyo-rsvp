type AuthGuardEnvironment = {
  NODE_ENV?: string;
  RSVP_AUTH_GUARD_ENABLED?: string;
  VERCEL_ENV?: string;
};

export type AuthGuardMode = "enabled" | "local_bypass" | "production_misconfigured";

export function getAuthGuardMode(environment: AuthGuardEnvironment): AuthGuardMode {
  if (environment.RSVP_AUTH_GUARD_ENABLED === "true") {
    return "enabled";
  }

  const isProductionRuntime =
    environment.VERCEL_ENV === "production" ||
    (!environment.VERCEL_ENV && environment.NODE_ENV === "production");

  return isProductionRuntime ? "production_misconfigured" : "local_bypass";
}
