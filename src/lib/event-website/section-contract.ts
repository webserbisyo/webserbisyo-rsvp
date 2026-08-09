import sectionContractJson from "../../../contracts/event-website-sections.v1.json";
import {
  eventWebsiteContentSectionKeys,
  type EventWebsiteContentSectionKey,
} from "@/lib/event-website/types";

export const EVENT_WEBSITE_SECTION_CONTRACT_VERSION = 1 as const;

export type EventWebsiteSectionContractEntry = {
  key: EventWebsiteContentSectionKey;
  label: string;
  navigationEligible: boolean;
  visibility: "optional" | "required";
};

function parseSectionContract() {
  if (sectionContractJson.contractVersion !== EVENT_WEBSITE_SECTION_CONTRACT_VERSION) {
    throw new Error("Unsupported Event Website section contract version.");
  }

  const expectedKeys = new Set<string>(eventWebsiteContentSectionKeys);
  const entries = sectionContractJson.sections as EventWebsiteSectionContractEntry[];
  const receivedKeys = new Set(entries.map((entry) => entry.key));

  if (
    entries.length !== eventWebsiteContentSectionKeys.length ||
    receivedKeys.size !== entries.length ||
    eventWebsiteContentSectionKeys.some((key) => !receivedKeys.has(key)) ||
    entries.some((entry) => !expectedKeys.has(entry.key))
  ) {
    throw new Error("Event Website section contract keys do not match the canonical content section keys.");
  }

  return entries;
}

export const eventWebsiteSectionContract = parseSectionContract();

export const requiredEventWebsiteSectionKeys = eventWebsiteSectionContract
  .filter((entry) => entry.visibility === "required")
  .map((entry) => entry.key);
