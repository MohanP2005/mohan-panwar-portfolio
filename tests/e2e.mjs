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

    // Spotlight tracks the cursor
    const spotPos = () =>
      page.evaluate(() => {
        const el = document.querySelector(".spot");
        return [el.style.getPropertyValue("--mx"), el.style.getPropertyValue("--my")];
      });
    await page.mouse.move(200, 300, { steps: 5 });
    await page.waitForFunction(() => document.querySelector(".spot").style.getPropertyValue("--mx") === "200px");
    const posA = await spotPos();
    await page.mouse.move(900, 500, { steps: 5 });
    await page.waitForFunction(() => document.querySelector(".spot").style.getPropertyValue("--mx") === "900px");
    const posB = await spotPos();
    assert.notDeepEqual(posA, posB, "spotlight position should change with the mouse");
    assert.equal(posB[0], "900px"); // y is pageY, depends on scroll

    // Real aboutPhotos: slideshow renders all 4 slides (2 images + 2 videos)
    assert.equal(await page.getByTestId("about-slideshow").count(), 1, "slideshow rendered");
    assert.equal(await page.locator(".slideshow-img").count(), 4, "4 slides");
    assert.equal(await page.locator("video.slideshow-img").count(), 2, "2 video slides");

    // Capitalized project names
    const bodyText = await page.locator("body").textContent();
    assert.ok(bodyText.includes("Building Tablebid"), "status line capitalized");
    for (const n of ["Tablebid", "Gamios", "Trade Hub", "Loan Pricing PRD"]) {
      assert.ok(bodyText.includes(n), `project name ${n} shown`);
    }

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