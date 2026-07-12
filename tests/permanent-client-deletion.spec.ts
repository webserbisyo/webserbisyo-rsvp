import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { PermanentDeleteClientsSchema } from "@/lib/validations/admin-workflow.schema";

test("permanent deletion input requires exact confirmation and deduplicates IDs", () => {
  const clientId = "00000000-0000-4000-8000-000000000001";
  expect(
    PermanentDeleteClientsSchema.parse({ clientIds: [clientId, clientId], confirmation: "DELETE" }),
  ).toEqual({ clientIds: [clientId], confirmation: "DELETE" });
  expect(() =>
    PermanentDeleteClientsSchema.parse({ clientIds: [], confirmation: "DELETE" }),
  ).toThrow();
  expect(() =>
    PermanentDeleteClientsSchema.parse({ clientIds: [clientId], confirmation: "delete" }),
  ).toThrow();
  expect(() =>
    PermanentDeleteClientsSchema.parse({ clientIds: ["not-a-uuid"], confirmation: "DELETE" }),
  ).toThrow();
});

test("client deletion has one canonical action and no eligibility gateway", async () => {
  const [action, service, rules] = await Promise.all([
    readFile("src/server/actions/admin-clients.ts", "utf8"),
    readFile("src/server/services/admin-workflow/permanent-client-deletion.ts", "utf8"),
    readFile("src/server/services/admin-workflow/client-rules.ts", "utf8"),
  ]);

  expect(action).toContain("deleteClientsPermanentlyAction");
  expect(service).toContain('"admin_purge_client_permanently"');
  expect(service).toContain("auth.admin.deleteUser");
  expect(rules).not.toContain("deriveDeleteEligibility");
  expect(action).not.toContain("bulkDeleteClientsAction");
  expect(action).not.toContain("deleteClientAction");
});

test("client deletion UI contains only the compact destructive confirmation", async () => {
  const dialog = await readFile(
    "src/components/clients/permanent-client-delete-dialog.tsx",
    "utf8",
  );

  expect(dialog).toContain("Type DELETE to confirm");
  expect(dialog).toContain("Delete permanently");
  expect(dialog).not.toContain("Eligible");
  expect(dialog).not.toContain("Skipped");
  expect(dialog).not.toContain("What will be preserved");
  expect(dialog).not.toContain("Optional note");
});
