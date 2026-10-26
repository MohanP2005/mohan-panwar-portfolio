import assert from "node:assert/strict";
import { test } from "node:test";
import { autoAdvanceDelay, DEFAULT_IMAGE_DELAY_MS } from "../lib/slideshow.ts";

const base = { reduced: false, videoEnded: false, videoFailed: false };

test("default image delay is 5s", () => {
  assert.equal(DEFAULT_IMAGE_DELAY_MS, 5000);
  assert.equal(autoAdvanceDelay({ ...base, kind: "image" }), 5000);
  assert.equal(autoAdvanceDelay({ ...base }), 5000);
});
test("imageMs override, invalid values fall back", () => {
  assert.equal(autoAdvanceDelay({ ...base, imageMs: 1500 }), 1500);
  for (const bad of [0, -1, NaN, Infinity]) assert.equal(autoAdvanceDelay({ ...base, imageMs: bad }), 5000);
});
test("reduced motion never schedules", () => {
  assert.equal(autoAdvanceDelay({ ...base, reduced: true }), null);
  assert.equal(autoAdvanceDelay({ ...base, kind: "video", reduced: true, videoEnded: true }), null);
  assert.equal(autoAdvanceDelay({ ...base, kind: "video", reduced: true, videoFailed: true }), null);
});
test("video: waits for ended, advances at once when ended, falls back when failed", () => {
  assert.equal(autoAdvanceDelay({ ...base, kind: "video" }), null);
  assert.equal(autoAdvanceDelay({ ...base, kind: "video", videoEnded: true }), 0);
  assert.equal(autoAdvanceDelay({ ...base, kind: "video", videoFailed: true }), 5000);
  assert.equal(autoAdvanceDelay({ ...base, kind: "video", videoFailed: true, imageMs: 900 }), 900);
});
