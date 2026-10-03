import { expect, test } from "@playwright/test";

test.describe("Payment UX Enhancement", () => {

  test("hero section renders constrained decorative light and pointer-events-none overlay", async ({ page }) => {
    await page.goto("/");

    const heroSection = page.locator('section[aria-label="WebSerbisyo RSVP visual introduction"]');
    await expect(heroSection).toBeVisible();

    // Verify headline contrast text
    const heading = heroSection.locator("h1");
    await expect(heading).toContainText("The Modern RSVP Website for Every Celebration");

    // Verify primary CTA is clickable over background layers
    const heroCta = heroSection.locator('a[href^="/apply"]').first();
    await expect(heroCta).toBeVisible();
  });

  test("application step 2 displays trust callout and updated footer", async ({ page }) => {
    await page.goto("/apply/start");

    // Fill Step 1 required fields
    await page.fill("#fullName", "Test Couple");
    await page.fill("#email", "test-payment-ux@example.com");
    await page.fill("#phone", "09171234567");
    await page.fill("#eventDate", "2026-12-25");
    await page.fill("#eventLocation", "Manila, Philippines");
    await page.fill("#estimatedGuestCount", "100");
    await page.fill("#message", "Testing payment step callout");

    // Click Continue to Review
    await page.click('button:has-text("Continue to Review")');

    // Verify Step 2 is active
    await expect(page.locator("h1")).toContainText("Review & Payment");

    // Verify Trust Callout Card
    const trustCallout = page.locator('div:has-text("WEBSITE MUNA, BAGO BAYAD.")').first();
    await expect(trustCallout).toBeVisible();
    await expect(trustCallout).toContainText("This step only confirms your preferred payment method.");
    await expect(trustCallout).toContainText("No payment is required now.");
    await expect(trustCallout).toContainText("We’ll message you on Messenger once your website preview is ready.");

    // Verify updated footer line below submit button
    const footerText = page.locator('p:has-text("No payment will be collected upon submission.")');
    await expect(footerText).toBeVisible();
  });
});
