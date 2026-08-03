import { expect, test } from "@playwright/test";

test("an auto-save edit reaches the browser timer without crashing the editor", async ({
  page,
}) => {
  const email = process.env.TEST_EMAIL;
  const password = process.env.TEST_PASSWORD;
  const baseUrl = process.env.PLAYWRIGHT_TEST_BASE_URL;
  test.skip(
    !email || !password || !baseUrl,
    "Authenticated browser runtime environment is unavailable.",
  );

  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto(new URL("/login", baseUrl).toString(), { waitUntil: "networkidle" });
  await page.getByRole("textbox", { name: "Email" }).fill(email!);
  await page.locator('input[name="password"]').fill(password!);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL(/\/dashboard/);
  await page.goto(new URL("/dashboard/event", baseUrl).toString(), { waitUntil: "networkidle" });
  await page.getByText("Music & Effects", { exact: true }).first().click();

  await page.route("**/*", (route) =>
    route.request().method() === "POST" ? route.abort("failed") : route.continue(),
  );
  const title = page.getByRole("textbox", { name: "Music Title" });
  const current = await title.inputValue();
  await title.fill(current ? current.slice(0, -1) : "x");
  await page.waitForTimeout(1_100);

  expect(pageErrors).not.toContain("Illegal invocation");
  expect(await page.getByText("This page couldn't load").count()).toBe(0);
});
