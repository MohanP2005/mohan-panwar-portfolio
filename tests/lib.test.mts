import assert from "node:assert/strict";
import { test } from "node:test";
import { buildMailto } from "../lib/mail.ts";
import { linkProps } from "../lib/links.ts";

test("mailto plain email, subject and body encoded", () => {
  const u = buildMailto("a@b.com", "Hey & hi?", "Hi Mohan,\nI’m [x]…");
  assert.equal(u, "mailto:a@b.com?subject=Hey%20%26%20hi%3F&body=Hi%20Mohan%2C%0D%0AI%E2%80%99m%20%5Bx%5D%E2%80%A6");
});
test("mailto placeholder email is encoded, no raw spaces/brackets", () => {
  const u = buildMailto("[your email]", "s", "b");
  assert.ok(u.startsWith("mailto:%5Byour%20email%5D?subject=s&body=b"));
});
test("mailto empty subject/body", () => {
  assert.equal(buildMailto("a@b.com", "", ""), "mailto:a@b.com?subject=&body=");
});
test("linkProps external vs internal", () => {
  assert.deepEqual(linkProps("https://github.com/x"), { target: "_blank", rel: "noopener noreferrer" });
  assert.deepEqual(linkProps("HTTP://x.com"), { target: "_blank", rel: "noopener noreferrer" });
  assert.deepEqual(linkProps("#"), {});
  assert.deepEqual(linkProps("/resume.pdf"), {});
  assert.deepEqual(linkProps("mailto:a@b.com"), {});
});

import { wrapIndex, parsePhotos } from "../lib/slideshow.ts";
import { aboutPhotos, projects, reasons, site } from "../content/site.ts";

test("wrapIndex forward/back wrap and large deltas", () => {
  assert.equal(wrapIndex(0, 1, 3), 1);
  assert.equal(wrapIndex(2, 1, 3), 0);
  assert.equal(wrapIndex(0, -1, 3), 2);
  assert.equal(wrapIndex(1, 7, 3), 2);
  assert.equal(wrapIndex(1, -7, 3), 0);
  assert.equal(wrapIndex(0, 1, 1), 0);
});
test("wrapIndex empty length", () => {
  assert.equal(wrapIndex(0, 1, 0), 0);
  assert.equal(wrapIndex(3, -1, -2), 0);
});
test("parsePhotos handles bad and good input", () => {
  assert.equal(parsePhotos(undefined), null);
  assert.equal(parsePhotos("  "), null);
  assert.equal(parsePhotos("{nope"), null);
  assert.equal(parsePhotos('{"a":1}'), null);
  assert.deepEqual(parsePhotos('[{"src":"a","alt":"b","caption":"c"},{"src":1},null]'), [{ src: "a", alt: "b", caption: "c" }]);
});
test("parsePhotos keeps video kind and poster, ignores bad kind, accepts empty strings", () => {
  assert.deepEqual(
    parsePhotos('[{"kind":"video","src":"a.mp4","alt":"b","caption":"c","poster":"p.jpg"},{"kind":"gif","src":"x","alt":"y","caption":"z","poster":5},{"src":"","alt":"","caption":""}]'),
    [
      { kind: "video", src: "a.mp4", alt: "b", caption: "c", poster: "p.jpg" },
      { src: "x", alt: "y", caption: "z" },
      { src: "", alt: "", caption: "" },
    ],
  );
});
test("real aboutPhotos: 4 slides in order, videos have posters, all media files exist", async () => {
  const { existsSync } = await import("node:fs");
  assert.deepEqual(aboutPhotos.map((p) => p.kind ?? "image"), ["video", "image", "video", "image"]);
  for (const p of aboutPhotos) {
    assert.ok(p.alt.length > 0 && p.caption.length > 0);
    const files = [p.src, ...(p.poster ? [p.poster] : [])].map((u) => "public" + u.replace("/mohan-panwar-portfolio", ""));
    for (const f of files) assert.ok(existsSync(f), `missing ${f}`);
    if (p.kind === "video") assert.ok(p.poster, "video needs poster");
  }
});
test("project display names are capitalized", () => {
  assert.deepEqual(projects.map((p) => p.name), ["Tablebid", "Gamios", "Loan Pricing PRD", "Trade Hub"]);
  assert.ok(reasons.some((r) => r.label === "Tablebid for my restaurant" && r.subject === "Tablebid for [restaurant name]"));
  assert.ok(site.statusLine.includes("Tablebid") && site.facts[0].value.includes("Tablebid"));
});
