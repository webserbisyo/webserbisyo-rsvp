/**
 * Dashboard Shell — Playwright E2E Tests
 *
 * NOTE ON AUTH: These tests navigate to /dashboard which requires authentication.
 * The tests detect a redirect to /login and skip auth-gated assertions gracefully
 * rather than hardcoding credentials.
 *
 * To run authenticated tests locally:
 *   1. Start the dev server: npm run dev
 *   2. Set env vars: TEST_EMAIL and TEST_PASSWORD
 *   3. npx playwright test tests/dashboard-shell.spec.ts --reporter=list
 */

import { test, expect, type Page } from "@playwright/test";

// ---------------------------------------------------------------------------
// Auth helper — attempts login if env vars are set; otherwise skips body.
// ---------------------------------------------------------------------------
async function withAuth(
  page: Page,
  fn: () => Promise<void>,
  skipReason = "TEST_EMAIL / TEST_PASSWORD not set — skipping auth-gated test",
) {
  const email = process.env.TEST_EMAIL;
  const password = process.env.TEST_PASSWORD;

  if (!email || !password) {
    test.skip(true, skipReason);
    return;
  }

  // Navigate to login page and sign in
  await page.goto("/login");
  await page.waitForLoadState("networkidle");

  const emailInput = page.locator('input[type="email"], input[name="email"]').first();
  const passwordInput = page.locator('input[type="password"]').first();
  const submitBtn = page.locator('button[type="submit"]').first();

  await emailInput.fill(email);
  await passwordInput.fill(password);
  await submitBtn.click();

  // Wait for redirect to dashboard
  await page.waitForURL("**/dashboard**", { timeout: 10000 });

  await fn();
}

// ---------------------------------------------------------------------------
// Test 1 — Shell renders without crash
// ---------------------------------------------------------------------------
test("Test 1 — Shell renders without crash", async ({ page }) => {
  await withAuth(page, async () => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // Sidebar exists
    const sidebar = page.locator('[data-slot="sidebar-inner"]');
    await expect(sidebar).toBeVisible();

    // Main content area exists
    const main = page.locator("main.dash-page-bg");
    await expect(main).toBeVisible();

    // Top header exists
    const header = page.locator("header");
    await expect(header).toBeVisible();

    // Sign out button in sidebar footer
    const signOut = page.locator('[data-slot="sidebar-footer"] button').filter({ hasText: /sign out/i });
    await expect(signOut).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Test 2 — Active nav indicator
// ---------------------------------------------------------------------------
test("Test 2 — Active nav indicator", async ({ page }) => {
  await withAuth(page, async () => {
    // Home page — Home nav item should be active
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    const homeLink = page
      .locator('a[href="/dashboard"][data-slot="sidebar-menu-button"]')
      .filter({ hasText: /^Home$/ })
      .first();
    await expect(homeLink).toBeVisible();
    await expect(homeLink).toHaveAttribute("data-active", "true");

    // Navigate to /dashboard/event — Event Website should be active, Home should not.
    await page.goto("/dashboard/event");
    await page.waitForLoadState("networkidle");

    const eventLink = page
      .locator('a[href="/dashboard/event"][data-slot="sidebar-menu-button"]')
      .filter({ hasText: /^Event Website$/ })
      .first();
    await expect(eventLink).toBeVisible();
    await expect(eventLink).toHaveAttribute("data-active", "true");
    await expect(homeLink).toHaveAttribute("data-active", "false");
  });
});

// ---------------------------------------------------------------------------
// Test 3 — Gradient full height
// ---------------------------------------------------------------------------
test("Test 3 — Gradient full viewport height", async ({ page }) => {
  await withAuth(page, async () => {
    // Use a sparse-content page
    await page.goto("/dashboard/settings");
    await page.waitForLoadState("networkidle");

    const main = page.locator("main.dash-page-bg");
    await expect(main).toBeVisible();

    // Background should not be plain white or default background
    const bg = await main.evaluate((el) =>
      window.getComputedStyle(el).backgroundImage,
    );
    // Gradient pages have backgroundImage containing "gradient" or "radial-gradient"
    expect(bg).toMatch(/gradient/i);

    // Height should be at least viewport height
    const mainHeight = await main.evaluate((el) => el.getBoundingClientRect().height);
    const viewportHeight = page.viewportSize()?.height ?? 768;
    expect(mainHeight).toBeGreaterThanOrEqual(viewportHeight - 2); // 2px tolerance
  });
});

// ---------------------------------------------------------------------------
// Test 4 — More drawer opens and is not transparent
// ---------------------------------------------------------------------------
test("Test 4 — More drawer opens and is not transparent", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });

  await withAuth(page, async () => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // Find the More button in the mobile bottom nav
    const moreButton = page
      .locator("nav.dashboard-mobile-bottom-nav button")
      .filter({ hasText: /more/i });
    await expect(moreButton).toBeVisible();
    await moreButton.evaluate((node) => {
      (node as HTMLButtonElement).click();
    });

    // Drawer should be visible
    const drawer = page.locator(".dashboard-more-drawer");
    await expect(drawer).toBeVisible({ timeout: 5000 });

    // Background should not be transparent
    const drawerBg = await drawer.evaluate((el) =>
      window.getComputedStyle(el).backgroundColor,
    );
    expect(drawerBg).not.toBe("rgba(0, 0, 0, 0)");
    expect(drawerBg).not.toBe("transparent");

    // Website Access link visible inside drawer
    const websiteAccess = drawer.locator("text=Website Access");
    await expect(websiteAccess).toBeVisible();

    // Sign out visible inside drawer
    const signOut = drawer.locator("text=Sign out");
    await expect(signOut).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Test 5 — Avatar dropdown
// ---------------------------------------------------------------------------
test("Test 5 — Avatar dropdown", async ({ page }) => {
  await withAuth(page, async () => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // Avatar trigger button in top header
    const trigger = page.locator("header button[aria-label='Open account menu']");
    await expect(trigger).toBeVisible();

    // Should have display name or initials text
    const triggerText = await trigger.textContent();
    expect(triggerText?.trim().length).toBeGreaterThan(0);

    // Click trigger
    await trigger.click();

    // Dropdown content visible
    const dropdown = page.locator('[data-radix-popper-content-wrapper]');
    await expect(dropdown).toBeVisible({ timeout: 3000 });

    // Settings item
    const settings = dropdown.locator("text=Settings");
    await expect(settings).toBeVisible();

    // Sign out item
    const signOut = dropdown.locator("text=Sign out");
    await expect(signOut).toBeVisible();

    // Dropdown background not transparent
    const dropdownContent = page.locator('[role="menu"]');
    const dropdownBg = await dropdownContent.evaluate((el) =>
      window.getComputedStyle(el).backgroundColor,
    );
    expect(dropdownBg).not.toBe("rgba(0, 0, 0, 0)");
    expect(dropdownBg).not.toBe("transparent");
  });
});

// ---------------------------------------------------------------------------
// Test 6 — Bottom nav has exactly 4 tabs
// ---------------------------------------------------------------------------
test("Test 6 — Bottom nav has exactly 4 tabs", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });

  await withAuth(page, async () => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // The fixed bottom nav
    const bottomNav = page.locator("nav.dashboard-mobile-bottom-nav");
    await expect(bottomNav).toBeVisible();

    // Count direct children of the inner flex container (links + button)
    const innerFlex = bottomNav.locator(".dashboard-mobile-bottom-nav__inner").first();
    const tabs = innerFlex.locator(":scope > *");
    await expect(tabs).toHaveCount(4);

    // Assert the 4 labels
    await expect(innerFlex.locator("text=Home")).toBeVisible();
    await expect(innerFlex.locator("text=Event Website")).toBeVisible();
    await expect(innerFlex.locator("text=RSVP")).toBeVisible();
    await expect(innerFlex.locator("text=More")).toBeVisible();

    // Website Access must stay in the More drawer, not the bottom nav.
    const websiteAccess = bottomNav.locator("text=Website Access");
    await expect(websiteAccess).toHaveCount(0);
  });
});
