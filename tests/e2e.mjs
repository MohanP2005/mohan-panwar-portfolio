import { chromium } from "playwright";
import assert from "node:assert/strict";

(async () => {
  const BASE = process.env.E2E_URL ?? "http://localhost:3000/mohan-panwar-portfolio/";
  let browser;

  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      permissions: ["clipboard-read", "clipboard-write"],
      viewport: { width: 1280, height: 800 },
    });
    const page = await context.newPage();

    await page.goto(BASE, { waitUntil: "networkidle" });

    // Open email modal / section
    await page.getByRole("button", { name: /^Email/ }).click();

    // Copy the email address
    await page.getByRole("button", { name: "Copy email" }).click();

    // Wait for confirmation UI
    await page
      .getByRole("button", { name: "Copied ✓" })
      .waitFor({ state: "visible", timeout: 5000 });

    // Verify clipboard content
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    assert.equal(clipboardText, "mohanpanwar2005@gmail.com");

    // Ensure placeholder text is absent
    const placeholderCount = await page.getByText(/\[your email\]/).count();
    assert.equal(placeholderCount, 0, "Placeholder '[your email]' should not be present");

    // Twitter row renders with the real URL
    const twitterHref = await page.getByRole("link", { name: /Twitter/ }).getAttribute("href");
    assert.equal(twitterHref, "https://x.com/MoPanwar2005");

    console.log("e2e ok");
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
})();