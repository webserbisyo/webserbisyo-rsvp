import { expect, test, type Page } from "@playwright/test";

const CORE_ROUTES = [
  "/dashboard",
  "/dashboard/event",
  "/dashboard/responses",
  "/dashboard/website-access",
  "/dashboard/billing",
] as const;

const VIEWPORTS = [
  { height: 900, label: "desktop", width: 1440 },
  { height: 1024, label: "tablet", width: 768 },
  { height: 914, label: "mobile", width: 412 },
  { height: 844, label: "small mobile", width: 390 },
] as const;

async function loginWithEnv(page: Page) {
  const email = process.env.TEST_EMAIL;
  const password = process.env.TEST_PASSWORD;

  if (!email || !password) {
    test.skip(true, "TEST_EMAIL / TEST_PASSWORD not set; skipping authenticated launch QA");
    return;
  }

  await page.goto("/login");
  await page.waitForLoadState("networkidle");
  await page.locator('input[type="email"], input[name="email"]').first().fill(email);
  await page.locator('input[type="password"]').first().fill(password);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL("**/dashboard**", { timeout: 15000 });
}

for (const viewport of VIEWPORTS) {
  test(`core dashboard routes load without blocking errors - ${viewport.label}`, async ({
    page,
  }) => {
    test.setTimeout(90000);
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];

    page.on("console", (message) => {
      if (message.type() === "error") {
        consoleErrors.push(message.text());
      }
    });
    page.on("pageerror", (error) => {
      pageErrors.push(error.message);
    });

    await page.setViewportSize({
      height: viewport.height,
      width: viewport.width,
    });
    await loginWithEnv(page);

    for (const route of CORE_ROUTES) {
      await page.goto(route);
      await page.waitForLoadState("networkidle");
      await expect(page.locator("main").first()).toBeVisible();

      const hasHorizontalOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth + 2,
      );
      expect(hasHorizontalOverflow, `${route} has horizontal overflow`).toBe(false);
    }

    await maybeVisitPublicRsvpRoute(page);

    expect(pageErrors).toEqual([]);
    expect(consoleErrors.filter((message) => !isKnownNonBlockingConsoleMessage(message))).toEqual(
      [],
    );
  });
}

async function maybeVisitPublicRsvpRoute(page: Page) {
  await page.goto("/dashboard/website-access");
  await page.waitForLoadState("networkidle");

  const firstPublicLink = page.locator('a[href*="/r/"]').first();

  if ((await firstPublicLink.count()) === 0) {
    return;
  }

  const href = await firstPublicLink.getAttribute("href");

  if (!href) {
    return;
  }

  await page.goto(href);
  await page.waitForLoadState("networkidle");
  await expect(page.locator("main").first()).toBeVisible();
}

function isKnownNonBlockingConsoleMessage(message: string) {
  return (
    message.includes("Download the React DevTools") ||
    message.includes("A parser-blocking, cross site")
  );
}
