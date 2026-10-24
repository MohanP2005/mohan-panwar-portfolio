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
