import { toast } from "sonner";

/**
 * Removes protocol (http:// or https://) and trailing slashes for visual display.
 * Example: "https://rafael-and-isabella.rsvp.webserbisyo.com/" -> "rafael-and-isabella.rsvp.webserbisyo.com"
 */
export function formatPublicUrlForDisplay(url: string): string {
  if (!url) {
    return "";
  }

  return url.replace(/^https?:\/\//i, "").replace(/\/+$/, "");
}

/**
 * Shares a public RSVP website URL using the native Web Share API when supported,
 * with seamless fallback to clipboard copying.
 */
export async function shareWebsiteLink(url: string): Promise<void> {
  if (!url) {
    toast.error("Publish the website before sharing live links.");
    return;
  }

  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({
        title: "You're Invited!",
        text: "View our wedding website and RSVP online.",
        url,
      });

      return;
    } catch (error) {
      if (
        (error instanceof DOMException && error.name === "AbortError") ||
        (error as Error)?.name === "AbortError"
      ) {
        return;
      }

      // Continue to clipboard fallback if native share throws an unhandled error
    }
  }

  try {
    await navigator.clipboard.writeText(url);
    toast.success("Website link copied to clipboard");
  } catch {
    toast.error("Could not share or copy the website link. Please copy it manually.");
  }
}
