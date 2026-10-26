// About photo slideshow e2e. Generates 3 tiny placeholder PNGs in a temp dir (nothing committed),
// passes them to a throwaway `next dev` server as data URIs via NEXT_PUBLIC_ABOUT_PHOTOS_E2E.
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync, readFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { deflateSync } from "node:zlib";
import assert from "node:assert/strict";

const BASE_PATH = "/mohan-panwar-portfolio";
const PORT = 3217;
const PORT_AUTO = 3218;
const AUTO_MS = 1500;
const SHOTS = process.env.E2E_SHOTS_DIR;

function crc32(buf) {
  let c, crc = ~0;
  for (const b of buf) { c = (crc ^ b) & 0xff; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crc = (crc >>> 8) ^ c; }
  return ~crc >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(w, h, [r, g, b]) {
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  const row = Buffer.concat([Buffer.from([0]), Buffer.from(Array.from({ length: w }, () => [r, g, b]).flat())]);
  const raw = Buffer.concat(Array.from({ length: h }, () => row));
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}

async function startServer(env, port = PORT) {
  const child = spawn("npx", ["next", "dev", "-p", String(port)], {
    env: { ...process.env, NEXT_DIST_DIR: `.next-e2e-${port}`, ...env }, stdio: "ignore", detached: true,
  });
  const stop = () => { try { process.kill(-child.pid); } catch {} };
  const url = `http://localhost:${port}${BASE_PATH}/`;
  for (let i = 0; i < 120; i++) {
    try { if ((await fetch(url)).status === 200) return { url, stop }; } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  stop();
  throw new Error("dev server did not start");
}

const dir = mkdtempSync(join(tmpdir(), "about-photos-"));
const colors = [[200, 80, 60], [60, 140, 200], [90, 170, 90]];
const photos = colors.map((c, i) => {
  const f = join(dir, `p${i + 1}.png`);
  writeFileSync(f, png(40, 50, c));
  return { src: `data:image/png;base64,${readFileSync(f).toString("base64")}`, alt: `Test photo ${i + 1}`, caption: `Caption number ${i + 1}` };
});

// 4th slide: a real short video served from public/about, with a data-URI poster.
const posterSrc = photos[0].src;
photos.push({ kind: "video", src: `${BASE_PATH}/about/pickup.mp4`, poster: posterSrc, alt: "Test video", caption: "Caption number 4" });

let server, server2, browser;
try {
  // Manual-navigation server: autoplay interval is huge so it never interferes with the clicks below.
  server = await startServer({ NEXT_PUBLIC_ABOUT_PHOTOS_E2E: JSON.stringify(photos), NEXT_PUBLIC_SLIDESHOW_IMAGE_MS: "600000" });
  browser = await chromium.launch({ headless: true });
  for (const width of [1280, 375]) {
    const page = await (await browser.newContext({ viewport: { width, height: 900 } })).newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.goto(server.url, { waitUntil: "networkidle" });
    const show = page.getByTestId("about-slideshow");
    await show.waitFor();
    assert.equal(await show.getAttribute("aria-label"), "Photos of Mohan");
    const caption = page.getByTestId("slideshow-caption");
    const count = page.getByTestId("slideshow-count");
    assert.equal((await count.innerText()).trim(), "01 / 04");
    assert.equal((await caption.innerText()).trim(), "Caption number 1");

    await page.getByRole("button", { name: "Next photo" }).click();
    assert.equal((await count.innerText()).trim(), "02 / 04");
    assert.equal((await caption.innerText()).trim(), "Caption number 2");
    await page.getByRole("button", { name: "Previous photo" }).click();
    await page.getByRole("button", { name: "Previous photo" }).click(); // wraps to last (the video)
    assert.equal((await count.innerText()).trim(), "04 / 04");
    assert.equal((await caption.innerText()).trim(), "Caption number 4");
    const video = page.locator("video.slideshow-img");
    await page.waitForFunction(() => { const v = document.querySelector("video.slideshow-img"); return v && !v.paused; }, null, { timeout: 10000 });
    const vinfo = await video.evaluate((v) => ({ muted: v.muted, loop: v.loop, controls: v.controls, playsInline: v.playsInline, fit: getComputedStyle(v).objectFit, w: v.getBoundingClientRect().width, h: v.getBoundingClientRect().height, fw: v.parentElement.clientWidth, fh: v.parentElement.clientHeight, poster: !!v.poster }));
    assert.equal(vinfo.loop, false, "video must not loop while auto-rotating (needs ended event)");
    assert.ok(vinfo.muted && vinfo.playsInline && !vinfo.controls && vinfo.poster, JSON.stringify(vinfo));
    assert.equal(vinfo.fit, "cover");
    assert.ok(Math.abs(vinfo.w - vinfo.fw) < 1.5 && Math.abs(vinfo.h - vinfo.fh) < 1.5, "video fills the frame");
    await page.getByRole("button", { name: "Previous photo" }).click(); // leave the video
    await page.waitForFunction(() => document.querySelector("video.slideshow-img").paused, null, { timeout: 5000 });
    await page.getByRole("button", { name: "Next photo" }).click(); // back to video
    await page.waitForFunction(() => !document.querySelector("video.slideshow-img").paused, null, { timeout: 10000 });
    await page.getByRole("button", { name: "Next photo" }).click(); // wraps to 01
    await page.getByRole("button", { name: "Previous photo" }).click(); // back to 04

    await show.focus();
    await page.keyboard.press("ArrowRight");
    assert.equal((await count.innerText()).trim(), "01 / 04");
    await page.keyboard.press("ArrowLeft");
    assert.equal((await count.innerText()).trim(), "04 / 04");

    // only the first image is eager; the rest lazy
    const loading = await page.$$eval("img.slideshow-img", (els) => els.map((e) => e.getAttribute("loading")));
    assert.deepEqual(loading, ["eager", "lazy", "lazy"]);

    if (width === 1280) {
      // reduced motion: the active video must stay paused (poster shown)
      const rm = await (await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: "reduce" })).newPage();
      await rm.goto(server.url, { waitUntil: "networkidle" });
      await rm.getByRole("button", { name: "Previous photo" }).click(); // to the video
      await rm.waitForTimeout(1500);
      assert.equal(await rm.$eval("video.slideshow-img", (v) => v.paused), true, "reduced motion: video must not autoplay");
    }

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    assert.ok(overflow <= 0, `horizontal overflow at ${width}px: ${overflow}`);
    assert.deepEqual(errors, []);

    if (SHOTS) {
      mkdirSync(SHOTS, { recursive: true });
      await page.locator("#about").scrollIntoViewIfNeeded();
      await page.locator("#about").screenshot({ path: join(SHOTS, `about-${width}.png`) });
    }
  }

  // ---- Autoplay: second server with a short image interval ----
  server.stop(); server = null;
  server2 = await startServer({ NEXT_PUBLIC_ABOUT_PHOTOS_E2E: JSON.stringify(photos), NEXT_PUBLIC_SLIDESHOW_IMAGE_MS: String(AUTO_MS) }, PORT_AUTO);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const open = async (opts = {}) => {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, ...opts });
    const pg = await ctx.newPage();
    const errs = [];
    pg.on("pageerror", (e) => errs.push(String(e)));
    await pg.goto(server2.url, { waitUntil: "networkidle" });
    const sh = pg.getByTestId("about-slideshow");
    await sh.scrollIntoViewIfNeeded();
    await pg.mouse.move(2, 2); // keep the pointer off the slideshow
    const n = async () => (await pg.getByTestId("slideshow-count").innerText()).trim();
    const where = async () => { const b = await sh.boundingBox(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; };
    return { pg, sh, n, where, errs };
  };

  {
    // 1. image auto-advances after the interval (not instantly), and live region is off while rotating
    const { pg, sh, n, errs } = await open();
    assert.equal(await n(), "01 / 04");
    assert.equal(await sh.getAttribute("data-autoplay"), "on");
    assert.equal(await pg.locator(".slideshow-text").getAttribute("aria-live"), "off");
    assert.ok(await pg.getByTestId("slideshow-playpause").isVisible(), "pause/play button visible");
    const t0 = Date.now();
    await pg.waitForFunction(() => document.querySelector('[data-testid="slideshow-count"]').textContent.trim() === "02 / 04", null, { timeout: 6000 });
    const dt = Date.now() - t0;
    assert.ok(dt > AUTO_MS * 0.5 && dt < AUTO_MS * 3, `advance took ${dt}ms`);
    await pg.waitForFunction(() => document.querySelector('[data-testid="slideshow-count"]').textContent.trim() === "03 / 04", null, { timeout: 6000 });

    // 2. manual nav restarts the timer: click Next just before the tick; the new slide must last a full interval
    await sleep(AUTO_MS - 400);
    await pg.getByRole("button", { name: "Previous photo" }).click();
    const afterClick = await n();
    const t1 = Date.now();
    await pg.mouse.move(2, 2);
    await sleep(AUTO_MS * 0.6);
    assert.equal(await n(), afterClick, "timer restarted after manual navigation");
    await pg.waitForFunction((c) => document.querySelector('[data-testid="slideshow-count"]').textContent.trim() !== c, afterClick, { timeout: 6000 });
    assert.ok(Date.now() - t1 > AUTO_MS * 0.8, "full interval after manual nav");

    // 3. video slide advances after it plays through, then wraps to 01
    await pg.getByRole("button", { name: "Show photo 4 of 4" }).click();
    await pg.mouse.move(2, 2);
    await pg.waitForFunction(() => { const v = document.querySelector("video.slideshow-img"); return v && !v.paused; }, null, { timeout: 10000 });
    await sleep(AUTO_MS + 500);
    assert.equal(await n(), "04 / 04", "video slide is not cut short by the image interval");
    await pg.waitForFunction(() => document.querySelector('[data-testid="slideshow-count"]').textContent.trim() === "01 / 04", null, { timeout: 10000 });
    assert.deepEqual(errs, []);
    await pg.context().close();
  }

  {
    // 4. hover pauses, leaving resumes
    const { pg, sh, n, where } = await open();
    const c = await where();
    await pg.mouse.move(c.x, c.y);
    const before = await n();
    await sleep(AUTO_MS * 2 + 300);
    assert.equal(await n(), before, "hover pauses auto-advance");
    assert.equal(await sh.getAttribute("data-autoplay"), "off");
    await pg.mouse.move(2, 2);
    await pg.waitForFunction((b) => document.querySelector('[data-testid="slideshow-count"]').textContent.trim() !== b, before, { timeout: 6000 });
    await pg.context().close();
  }

  {
    // 5. pause button stops rotation, play resumes; aria-live goes polite while paused
    const { pg, n } = await open();
    const btn = pg.getByTestId("slideshow-playpause");
    assert.equal(await btn.getAttribute("aria-label"), "Pause slideshow");
    await btn.click();
    await pg.mouse.move(2, 2);
    assert.equal(await btn.getAttribute("aria-label"), "Play slideshow");
    assert.equal(await pg.locator(".slideshow-text").getAttribute("aria-live"), "polite");
    const before = await n();
    await sleep(AUTO_MS * 2 + 300);
    assert.equal(await n(), before, "pause button stops rotation");
    await pg.getByRole("button", { name: "Next photo" }).click(); // manual nav still works while paused
    await pg.mouse.move(2, 2);
    assert.notEqual(await n(), before);
    await btn.click();
    await pg.mouse.move(2, 2);
    assert.equal(await btn.getAttribute("aria-label"), "Pause slideshow");
    const mid = await n();
    await pg.waitForFunction((b) => document.querySelector('[data-testid="slideshow-count"]').textContent.trim() !== b, mid, { timeout: 6000 });
    await pg.context().close();
  }

  {
    // 6. keyboard focus pauses; hidden tab pauses
    const { pg, sh, n } = await open();
    await sh.focus();
    const before = await n();
    await sleep(AUTO_MS * 2 + 300);
    assert.equal(await n(), before, "keyboard focus pauses auto-advance");
    await sh.blur();
    await pg.waitForFunction((b) => document.querySelector('[data-testid="slideshow-count"]').textContent.trim() !== b, before, { timeout: 6000 });
    const mid = await n();
    await pg.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, get: () => true }); document.dispatchEvent(new Event("visibilitychange")); });
    await sleep(AUTO_MS * 2 + 300);
    assert.equal(await n(), mid, "hidden tab pauses auto-advance");
    await pg.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, get: () => false }); document.dispatchEvent(new Event("visibilitychange")); });
    await pg.waitForFunction((b) => document.querySelector('[data-testid="slideshow-count"]').textContent.trim() !== b, mid, { timeout: 6000 });
    await pg.context().close();
  }

  {
    // 7. off-screen pauses
    const { pg, n } = await open();
    await pg.evaluate(() => window.scrollTo(0, 0));
    await pg.waitForFunction(() => document.querySelector('[data-testid="about-slideshow"]').dataset.autoplay === "off", null, { timeout: 3000 });
    const before = await n();
    await sleep(AUTO_MS * 2 + 300);
    assert.equal(await n(), before, "off-screen slideshow does not advance");
    await pg.context().close();
  }

  {
    // 8. reduced motion: never auto-advances, no pause button, manual nav still works
    const { pg, n } = await open({ reducedMotion: "reduce" });
    assert.equal(await n(), "01 / 04");
    await sleep(AUTO_MS * 2 + 500);
    assert.equal(await n(), "01 / 04", "reduced motion: no auto-advance");
    assert.equal(await pg.getByTestId("slideshow-playpause").count(), 0);
    assert.equal(await pg.locator(".slideshow-text").getAttribute("aria-live"), "polite");
    await pg.getByRole("button", { name: "Next photo" }).click();
    assert.equal(await n(), "02 / 04");
    await pg.context().close();
  }
  console.log("e2e slideshow ok");
} catch (err) {
  console.error(err);
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  if (server) server.stop();
  if (server2) server2.stop();
}
