import { expect, test, type Page } from "@playwright/test";

async function noHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, "page must not scroll horizontally").toBeLessThanOrEqual(0);
}

test("advance a day, filter, open a detail, follow a grounding link", async ({ page }) => {
  await page.goto("/");
  const day = page.getByTestId("current-day");
  await expect(day).toContainText("31 Aug 1939");
  await noHorizontalScroll(page);

  // Advance: the next day unseals, gets a marker and a toast, and the URL records it.
  await page.getByRole("button", { name: "Advance a day" }).click();
  await expect(day).toContainText(/1 Sept? 1939/);
  await expect(page.getByRole("status")).toContainText(/\d+ new posts unsealed/);
  await expect(page.locator(".dayhead .new", { hasText: "New today" })).toBeVisible();
  await expect(page).toHaveURL(/start=sep1939&day=1939-09-01/);
  await expect(page.locator(".ledger .dayb.sealed").first()).toBeVisible();

  // Arrow keys step days too.
  await page.keyboard.press("ArrowRight");
  await expect(day).toContainText(/2 Sept? 1939/);
  await page.keyboard.press("ArrowLeft");
  await expect(day).toContainText(/1 Sept? 1939/);

  // Filter by kind, then by theater, then search, then clear.
  await page.getByRole("button", { name: /^Historical records/ }).click();
  await expect(page.locator(".post.rc")).toHaveCount(0);
  await expect(page.locator(".post.rec").first()).toBeVisible();
  await page.getByRole("group", { name: "Theater" }).getByRole("button", { name: "Poland" }).click();
  await expect(page.locator(".post .chip", { hasText: "Britain" })).toHaveCount(0);
  await expect(page).toHaveURL(/kind=record/);
  await expect(page).toHaveURL(/theater=poland/);
  await page.getByLabel("Search revealed posts").fill("no such thing on the wire");
  await expect(page.getByTestId("empty-filtered")).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(page.locator(".post.rc").first()).toBeVisible();
  await expect(page).not.toHaveURL(/kind=/);

  // Open a reconstructed post and follow its grounding link to the record.
  await page.locator(".post.rc", { hasText: "Tomasz W." }).first().click();
  const dialog = page.getByTestId("post-dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.locator("#dlgTitle")).toHaveText("Tomasz W.");
  await expect(dialog.getByText("What is invented")).toBeVisible();
  await dialog.getByTestId("grounding-links").getByRole("button").first().click();
  await expect(dialog.locator("#dlgTitle")).toHaveText("German forces cross the Polish frontier on three sides");
  await expect(dialog.getByText("Corroborate with")).toBeVisible();
  await expect(dialog.getByText("Reconstructed posts built on this record")).toBeVisible();

  // Newer/older navigation inside the dialog, then close with Escape and the trigger regains focus.
  await dialog.getByRole("button", { name: "Older" }).click();
  await expect(dialog.locator("#dlgTitle")).not.toHaveText("German forces cross the Polish frontier on three sides");
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await noHorizontalScroll(page);
});

test("a shared URL restores the view and day-only scope", async ({ page }) => {
  await page.goto("/?start=jun1944&day=1944-06-06&scope=day&theater=west");
  await expect(page.getByTestId("current-day")).toContainText("6 Jun 1944");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Tuesday,? 6 June 1944/);
  await expect(page.getByRole("group", { name: "Theater" }).getByRole("button", { name: "Western Europe" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".post .chip", { hasText: "Britain" })).toHaveCount(0);
  await noHorizontalScroll(page);
});
