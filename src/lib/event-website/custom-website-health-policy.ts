export function isCustomWebsiteUnavailableHtml(value: string) {
  return (
    /<[^>]+>\s*Event unavailable\s*</i.test(value) ||
    /<[^>]+>\s*(Published event|Saved draft preview) not found\.?\s*</i.test(value)
  );
}
