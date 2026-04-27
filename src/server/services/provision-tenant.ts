import "server-only";

import { provisionClient, type ProvisionClientInput } from "./provision-client";

/**
 * Backward-compatible wrapper for early scaffold imports.
 * New code should use provisionClient because clients.id is the tenant boundary.
 */
export async function provisionTenant(input: ProvisionClientInput) {
  return provisionClient(input);
}
