import { expect, test } from "@playwright/test";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

test("client provisioning keeps its internal password undisclosed", () => {
  const source = readSource("src/server/services/create-client-user.ts");

  expect(source).toContain("generateInternalAuthPassword()");
  expect(source).toContain("auth.admin.createUser");
  expect(source).not.toContain("temporaryPassword");
  expect(source).not.toContain("updateUserById");
  const userMetadata = source.slice(
    source.indexOf("user_metadata:"),
    source.indexOf("if (createError)"),
  );
  expect(userMetadata).not.toContain("client_id");
  expect(userMetadata).not.toContain("role:");
});

test("Auth user lookup is paginated and rejects normalized duplicates", () => {
  const source = readSource("src/server/services/find-auth-user-by-email.ts");

  expect(source).toContain("for (let page = 1; page <= MAX_PAGES; page += 1)");
  expect(source).toContain("perPage: USERS_PER_PAGE");
  expect(source).toContain("matches.length > 1");
  expect(source).toContain("Manual repair is required");
});

test("setup and recovery both use Supabase recovery-class links", () => {
  const source = readSource("src/server/services/client-password-links.ts");

  expect(source).toContain('type: "recovery"');
  expect(source).toContain('new URL("/reset-password", baseUrl)');
  expect(source).toContain("client_password_setup_link_issued");
  expect(source).toContain("client_password_recovery_link_issued");
  expect(source).not.toContain("action_link,");
});

test("password email delivery is intent-specific and concurrency locked", () => {
  const migration = readMigration("_secure_password_setup_recovery.sql");
  const setupSource = readSource("src/server/services/send-client-password-setup.ts");
  const recoverySource = readSource("src/server/services/request-client-password-reset.ts");

  expect(migration).toContain("'client_password_setup'");
  expect(migration).toContain("'client_password_recovery'");
  expect(migration).toContain("uq_email_logs_password_delivery_in_flight");
  expect(setupSource.lastIndexOf("queuePasswordEmailLog")).toBeLessThan(
    setupSource.lastIndexOf("generateClientPasswordLink"),
  );
  expect(recoverySource.indexOf("queuePasswordEmailLog")).toBeLessThan(
    recoverySource.lastIndexOf("generateClientPasswordLink"),
  );
});

test("branded emails contain secure actions and no readable password", () => {
  const setupTemplate = readSource("src/server/email/templates/client-access.ts");
  const recoveryTemplate = readSource("src/server/email/templates/password-reset.ts");

  expect(setupTemplate).toContain("Create My Password");
  expect(recoveryTemplate).toContain("Reset My Password");
  expect(setupTemplate.toLowerCase()).not.toContain("temporary password");
  expect(setupTemplate).not.toContain("temporaryPassword");
  expect(setupTemplate).toContain("For your security, this link expires");
  expect(recoveryTemplate).toContain("For your security, this link expires");
});

test("the password form requires a recovery event and ends the local session", () => {
  const source = readSource("src/components/auth/reset-password-form.tsx");

  expect(source).toContain('event === "PASSWORD_RECOVERY"');
  expect(source).not.toContain('event === "SIGNED_IN"');
  expect(source).toContain("updateUser({ password: nextPassword })");
  expect(source).toContain('signOut({ scope: "local" })');
  expect(source).toContain("/login?message=password_updated");
  expect(source).toContain("Request a new secure link");
});

test("public recovery responses remain enumeration resistant and rate limited", () => {
  const actionSource = readSource("src/server/actions/auth.ts");
  const serviceSource = readSource("src/server/services/request-client-password-reset.ts");

  expect(actionSource).toContain("If this email is connected to an approved WebSerbisyo dashboard");
  expect(serviceSource).toContain("canRequestPasswordReset");
  expect(serviceSource).toContain("withPasswordResetRequestLock");
  expect(serviceSource).toContain('email_type", "client_password_recovery"');
});

test("admin resend cannot select an alternate recipient or change a password", () => {
  const schemaSource = readSource("src/lib/validations/admin-workflow.schema.ts");
  const clientService = readSource("src/server/services/admin-workflow/clients.ts");
  const clientUi = readSource("src/components/admin-workflow/client-lifecycle-actions.tsx");

  const resendSchema = schemaSource.slice(
    schemaSource.indexOf("export const ResendOnboardingSchema"),
    schemaSource.indexOf("const PackagePlanSettingsSchema"),
  );

  expect(resendSchema).not.toContain("recipientEmail");
  expect(clientService).not.toContain("temporaryPassword");
  expect(clientService).not.toContain("updateUserById");
  expect(clientUi).toContain("Authorized account email");
  expect(clientUi).toContain("readOnly");
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
