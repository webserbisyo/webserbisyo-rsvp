import "server-only";

import {
  resolveMetaCapiRuntimeConfig,
  type MetaCapiConfigurationWarning,
} from "./capi-config-core";

const reportedWarnings = new Set<MetaCapiConfigurationWarning>();

export function getMetaCapiRuntimeConfig() {
  const config = resolveMetaCapiRuntimeConfig(process.env);

  for (const warning of config.warnings) {
    if (reportedWarnings.has(warning)) {
      continue;
    }

    reportedWarnings.add(warning);
    console.warn(`[meta-capi] ${formatWarning(warning)}`);
  }

  return config;
}

function formatWarning(warning: MetaCapiConfigurationWarning) {
  switch (warning) {
    case "meta_capi_test_code_ignored":
      return "A CAPI test-event code is configured while META_CAPI_TEST_MODE is disabled; the code is ignored.";
    case "meta_capi_test_mode_missing_code":
      return "META_CAPI_TEST_MODE is enabled but no CAPI test-event code is configured; normal CAPI delivery continues.";
  }
}
