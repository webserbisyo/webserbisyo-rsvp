import { expect, test } from "@playwright/test";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import {
  CLIENT_ACCESS_ENABLED_STATUSES,
  clientStatusAllowsDashboardAccess,
} from "../src/lib/auth/client-access";
import { getAuthGuardMode } from "../src/lib/auth/proxy-policy";
import { applySupabaseResponseHeaders } from "../src/lib/supabase/response-headers";

test("only explicitly access-enabled client statuses reach the dashboard", () => {
  expect(CLIENT_ACCESS_ENABLED_STATUSES).toEqual(["active", "paused", "expired"]);
  expect(clientStatusAllowsDashboardAccess("active")).toBe(true);
  expect(clientStatusAllowsDashboardAccess("paused")).toBe(true);
  expect(clientStatusAllowsDashboardAccess("expired")).toBe(true);
  expect(clientStatusAllowsDashboardAccess("archived")).toBe(false);
  expect(clientStatusAllowsDashboardAccess("cancelled")).toBe(false);
  expect(clientStatusAllowsDashboardAccess(null)).toBe(false);
});

test("the production proxy fails closed when its auth guard is misconfigured", () => {
  expect(
    getAuthGuardMode({
      NODE_ENV: "production",
      RSVP_AUTH_GUARD_ENABLED: undefined,
      VERCEL_ENV: "production",
    }),
  ).toBe("production_misconfigured");
  expect(
    getAuthGuardMode({
      NODE_ENV: "production",
      RSVP_AUTH_GUARD_ENABLED: "false",
      VERCEL_ENV: "production",
    }),
  ).toBe("production_misconfigured");
  expect(
    getAuthGuardMode({
      NODE_ENV: "production",
      RSVP_AUTH_GUARD_ENABLED: "true",
      VERCEL_ENV: "production",
    }),
  ).toBe("enabled");
  expect(
    getAuthGuardMode({
      NODE_ENV: "development",
      RSVP_AUTH_GUARD_ENABLED: undefined,
    }),
  ).toBe("local_bypass");
});

test("Supabase response cache headers are copied exactly", () => {
  const target = new Headers();

  applySupabaseResponseHeaders(target, {
    "Cache-Control": "private, no-cache, no-store, must-revalidate, max-age=0",
    Expires: "0",
    Pragma: "no-cache",
  });

  expect(target.get("cache-control")).toContain("no-store");
  expect(target.get("expires")).toBe("0");
  expect(target.get("pragma")).toBe("no-cache");
});

test("the Phase 1 migration closes direct RPC access without changing RSVP inclusion", () => {
  const migration = readPhaseOneMigration();
  const normalized = migration.replace(/\s+/g, " ").toLowerCase();

  expect(normalized).toContain(
    "revoke all on function public.submit_rsvp_response_with_capacity_check",
  );
  expect(normalized).toContain(
    "revoke all on function public.approve_rsvp_response_with_capacity_check",
  );
  expect(normalized).toContain("from anon");
  expect(normalized).toContain("from authenticated");
  expect(normalized).toContain("to service_role");
  expect(normalized).toContain("security invoker");
  expect(normalized).toContain("set search_path = ''");
  expect(normalized).toContain("e.client_id = p_client_id");
  expect(normalized).toContain("r.client_id = p_client_id");
  expect(normalized).toContain("c.status in ('active', 'paused', 'expired')");
  expect(normalized).toContain("review_status");
  expect(normalized).toContain("'approved'");
  expect(normalized).not.toContain("review_status, 'pending'");
});

function readPhaseOneMigration() {
  const migrationDirectory = join(process.cwd(), "supabase", "migrations");
  const filename = readdirSync(migrationDirectory).find((entry) =>
    entry.endsWith("_harden_auth_tenant_and_rsvp_rpc.sql"),
  );

  if (!filename) {
    throw new Error("Phase 1 auth security migration was not found.");
  }

  return readFileSync(join(migrationDirectory, filename), "utf8");
}
