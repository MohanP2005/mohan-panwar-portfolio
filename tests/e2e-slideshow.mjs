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

async function startServer(env) {
  const child = spawn("npx", ["next", "dev", "-p", String(PORT)], {
    env: { ...process.env, NEXT_DIST_DIR: `.next-e2e-${PORT}`, ...env }, stdio: "ignore", detached: true,
  });
  const stop = () => { try { process.kill(-child.pid); } catch {} };
  const url = `http://localhost:${PORT}${BASE_PATH}/`;
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

let server, browser;
try {
  server = await startServer({ NEXT_PUBLIC_ABOUT_PHOTOS_E2E: JSON.stringify(photos) });
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
    assert.equal((await count.innerText()).trim(), "01 / 03");
    assert.equal((await caption.innerText()).trim(), "Caption number 1");

    await page.getByRole("button", { name: "Next photo" }).click();
    assert.equal((await count.innerText()).trim(), "02 / 03");
    assert.equal((await caption.innerText()).trim(), "Caption number 2");
    await page.getByRole("button", { name: "Previous photo" }).click();
    await page.getByRole("button", { name: "Previous photo" }).click(); // wraps to last
    assert.equal((await count.innerText()).trim(), "03 / 03");
    assert.equal((await caption.innerText()).trim(), "Caption number 3");

    await show.focus();
    await page.keyboard.press("ArrowRight");
    assert.equal((await count.innerText()).trim(), "01 / 03");
    await page.keyboard.press("ArrowLeft");
    assert.equal((await count.innerText()).trim(), "03 / 03");

    // only the first image is eager; the rest lazy
    const loading = await page.$$eval(".slideshow-img", (els) => els.map((e) => e.getAttribute("loading")));
    assert.deepEqual(loading, ["eager", "lazy", "lazy"]);

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    assert.ok(overflow <= 0, `horizontal overflow at ${width}px: ${overflow}`);
    assert.deepEqual(errors, []);

    if (SHOTS) {
      mkdirSync(SHOTS, { recursive: true });
      await page.locator("#about").scrollIntoViewIfNeeded();
      await page.locator("#about").screenshot({ path: join(SHOTS, `about-${width}.png`) });
    }
  }
  console.log("e2e slideshow ok");
} catch (err) {
  console.error(err);
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  if (server) server.stop();
}
