export type MetaCapiEnvironment = Readonly<Record<string, string | undefined>>;

export type MetaCapiConfigurationWarning =
  | "meta_capi_test_code_ignored"
  | "meta_capi_test_mode_missing_code";

export type MetaCapiRuntimeConfig = {
  accessToken: string | null;
  apiVersion: string;
  leadEnabled: boolean;
  purchaseEnabled: boolean;
  testEventCode: string | null;
  warnings: MetaCapiConfigurationWarning[];
};

/**
 * Resolves server-only CAPI configuration without exposing values to callers
 * that do not need them. Purchase intentionally preserves its existing
 * enabled-by-default behavior until an operator explicitly sets its flag to
 * false; this avoids an outage when the new flag is deployed unset.
 */
export function resolveMetaCapiRuntimeConfig(
  environment: MetaCapiEnvironment,
): MetaCapiRuntimeConfig {
  const testMode = environment.META_CAPI_TEST_MODE?.trim() === "true";
  const configuredTestCode = environment.META_CAPI_TEST_EVENT_CODE?.trim() || null;
  const warnings: MetaCapiConfigurationWarning[] = [];

  if (configuredTestCode && !testMode) {
    warnings.push("meta_capi_test_code_ignored");
  }

  if (testMode && !configuredTestCode) {
    warnings.push("meta_capi_test_mode_missing_code");
  }

  return {
    accessToken: environment.META_CAPI_ACCESS_TOKEN?.trim() || null,
    apiVersion: environment.META_CAPI_API_VERSION?.trim() || "v24.0",
    leadEnabled: environment.META_CAPI_LEAD_ENABLED === "true",
    purchaseEnabled: environment.META_CAPI_PURCHASE_ENABLED?.trim() !== "false",
    testEventCode: testMode ? configuredTestCode : null,
    warnings,
  };
}
