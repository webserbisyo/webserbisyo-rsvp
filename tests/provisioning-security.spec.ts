import { expect, test } from "@playwright/test";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

test("the admin application action uses only the canonical approval service", () => {
  const action = readSource("src/server/actions/admin-applications.ts");
  const legacyActions = readSource("src/server/actions/approvals.ts");

  expect(action).toContain('from "@/server/services/admin-workflow/applications"');
  expect(legacyActions).not.toContain("approveApplicationAction");
  expect(readdirSync(join(process.cwd(), "src/server/services"))).not.toContain(
    "approve-application.ts",
  );
});

test("approval requires a complete owner relationship before event and application linking", () => {
  const source = readSource("src/server/services/admin-workflow/applications.ts");
  const ownerCheck = source.indexOf("assertCompleteOwnerSetup(ownerSetup)");
  const eventProvision = source.indexOf("ensureEventBundleForClient({", ownerCheck);
  const applicationUpdate = source.indexOf('.from("rsvp_applications")', eventProvision);

  expect(ownerCheck).toBeGreaterThan(0);
  expect(eventProvision).toBeGreaterThan(ownerCheck);
  expect(applicationUpdate).toBeGreaterThan(eventProvision);
});

test("linked events are constrained to the provisioned client", () => {
  const source = readSource("src/server/services/admin-workflow/provisioning.ts");

  expect(source).toContain("getEventById(input.existingEventId, input.clientId)");
  expect(source).toContain('.eq("client_id", clientId)');
  expect(source).toContain("The linked event does not belong to the provisioned client.");
});

test("archived and cancelled clients require explicit restoration", () => {
  const source = readSource("src/server/services/admin-workflow/provisioning.ts");
  const applicationSource = readSource("src/server/services/admin-workflow/applications.ts");

  expect(source).toContain("clientStatusAllowsDashboardAccess(client.status)");
  expect(source).toContain("Restore access explicitly");
  expect(applicationSource).toContain(
    "Restore client access explicitly before retrying provisioning.",
  );
});

test("concurrent approval and client creation are protected from duplicate sends and tenants", () => {
  const approval = readSource("src/server/services/admin-workflow/applications.ts");
  const migration = readMigration("_prevent_duplicate_client_provisioning.sql");

  expect(approval).toContain('["submitted", "reviewing"]');
  expect(migration).toContain("uq_clients_contact_email_normalized");
  expect(migration).toContain("duplicate normalized client contact emails");
});

test("setup email is issued only after graph verification and records safe outcomes", () => {
  const approval = readSource("src/server/services/admin-workflow/applications.ts");
  const sender = readSource("src/server/services/send-client-password-setup.ts");

  expect(approval.indexOf("provision_application_atomic")).toBeLessThan(
    approval.indexOf("sendClientPasswordSetup({"),
  );
  expect(approval).toContain("client_password_setup_email_sent");
  expect(approval).toContain("client_password_setup_email_failed");
  expect(sender).toContain("application.approved_client_id !== input.clientId");
  expect(sender).toContain("application.approved_event_id !== input.eventId");
  expect(approval).not.toContain("action_link");
});

test("service_role is granted required profile privileges while anon remains restricted", () => {
  const migration = readMigration("_grant_service_role_profiles.sql");

  expect(migration).toContain("grant select, insert, update, delete on table public.profiles to service_role;");
  expect(migration).toContain("anon must not have INSERT privilege");
  expect(migration).toContain("has_table_privilege('service_role', 'public.profiles', 'INSERT')");
});

test("atomic provisioning RPC is invoked by approveApplication workflow", () => {
  const approvalSource = readSource("src/server/services/admin-workflow/applications.ts");
  const rpcMigration = readMigration("_provision_application_atomic_rpc.sql");

  expect(approvalSource).toContain('adminSupabase.rpc');
  expect(approvalSource).toContain('"provision_application_atomic"');
  expect(rpcMigration).toContain("create or replace function app_private.provision_application_atomic");
  expect(rpcMigration).toContain("grant execute on function app_private.provision_application_atomic");
  expect(rpcMigration).toContain("for update");
  expect(rpcMigration).toContain("insert into public.profiles");
});

function readSource(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

function readMigration(suffix: string) {
  const migrationDirectory = join(process.cwd(), "supabase", "migrations");
  const filename = readdirSync(migrationDirectory).find((entry) => entry.endsWith(suffix));

  if (!filename) {
    throw new Error(`Migration ending in ${suffix} was not found.`);
  }

  return readFileSync(join(migrationDirectory, filename), "utf8");
}
