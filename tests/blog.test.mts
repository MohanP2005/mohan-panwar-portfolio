import assert from "node:assert/strict";
import { test } from "node:test";
import { readTimeMinutes, formatReadTime, isPublished, filterPublished, sortPosts } from "../lib/postmeta.ts";
import { buildCommentTree, relativeTime, countComments } from "../lib/comments.ts";
import { shouldCountView, getClientId, formatViews, authRedirectUrl } from "../lib/views.ts";
import { escapeXml, buildRss } from "../lib/rss.ts";

test("read time", () => {
  assert.equal(readTimeMinutes(""), 1);
  assert.equal(readTimeMinutes("one two three"), 1);
  assert.equal(readTimeMinutes(Array(220).fill("w").join(" ")), 1);
  assert.equal(readTimeMinutes(Array(221).fill("w").join(" ")), 2);
  assert.equal(readTimeMinutes("a\n\n  b\t c  "), 1);
  assert.equal(formatReadTime(6), "6 MIN READ");
});
test("draft filtering and sorting", () => {
  assert.equal(isPublished({}), true);
  assert.equal(isPublished({ draft: false }), true);
  assert.equal(isPublished({ draft: true }), false);
  const ps = [{ title: "b", date: "2026-01-01", draft: true }, { title: "a", date: "2026-02-01" }];
  assert.deepEqual(filterPublished(ps).map((p) => p.title), ["a"]);
  const input = [
    { title: "old", date: "2026-01-01" },
    { title: "z", date: "2026-03-01" },
    { title: "a", date: "2026-03-01" },
  ];
  const copy = [...input];
  assert.deepEqual(sortPosts(input).map((p) => p.title), ["a", "z", "old"]);
  assert.deepEqual(input, copy);
});
test("comment tree", () => {
  const c = (id: string, parent_id: string | null, t: number) => ({ id, parent_id, created_at: new Date(t).toISOString() });
  const flat = [
    c("a", null, 1000), c("b", null, 3000), c("a1", "a", 2000), c("a2", "a", 1500),
    c("a1x", "a1", 4000), // deeper nesting flattens into a
    c("orph", "gone", 5000), c("orph2", "orph", 6000),
    c("cy1", "cy2", 7000), c("cy2", "cy1", 7000),
  ];
  const tree = buildCommentTree(flat);
  assert.deepEqual(tree.map((t) => t.id), ["b", "a"]);
  assert.deepEqual(tree[1].replies.map((r) => r.id), ["a2", "a1", "a1x"]);
  assert.deepEqual(tree[0].replies, []);
  assert.deepEqual(buildCommentTree([]), []);
  assert.equal(flat[0].hasOwnProperty("replies"), false);
});
test("relative time and counts", () => {
  const now = Date.parse("2026-10-24T12:00:00Z");
  const ago = (s: number) => new Date(now - s * 1000).toISOString();
  assert.equal(relativeTime(ago(10), now), "just now");
  assert.equal(relativeTime(ago(-50), now), "just now");
  assert.equal(relativeTime(ago(5 * 60), now), "5m ago");
  assert.equal(relativeTime(ago(3 * 3600), now), "3h ago");
  assert.equal(relativeTime(ago(2 * 86400), now), "2d ago");
  assert.equal(relativeTime(ago(15 * 86400), now), "2w ago");
  assert.equal(relativeTime("2026-01-05T10:00:00Z", now), "2026-01-05");
  assert.equal(countComments([{ deleted_at: null }, {}, { deleted_at: "x" }]), 2);
});
test("view dedupe, client id, format, redirect", () => {
  const store = new Map<string, string>();
  const kv = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v) };
  assert.equal(shouldCountView(kv, "p"), true);
  assert.equal(shouldCountView(kv, "p"), false);
  assert.equal(shouldCountView(kv, "q"), true);
  const bad = { getItem: () => { throw new Error("x"); }, setItem: () => { throw new Error("x"); } };
  assert.equal(shouldCountView(bad, "p"), true);
  assert.equal(getClientId(kv, () => "id1"), "id1");
  assert.equal(getClientId(kv, () => "id2"), "id1");
  assert.equal(getClientId(bad, () => "id3"), "id3");
  assert.equal(formatViews(1204), "1,204 VIEWS");
  assert.equal(formatViews(1), "1 VIEW");
  assert.equal(formatViews(0), "0 VIEWS");
  assert.equal(authRedirectUrl("http://localhost:3000/mohan-panwar-portfolio/blog/my-post/?x=1#comments"), "http://localhost:3000/mohan-panwar-portfolio/blog/my-post/");
  assert.equal(authRedirectUrl("https://mohanp2005.github.io/mohan-panwar-portfolio/blog/my-post"), "https://mohanp2005.github.io/mohan-panwar-portfolio/blog/my-post/");
});
test("rss", () => {
  assert.equal(escapeXml(`a&b<c>"d'`), "a&amp;b&lt;c&gt;&quot;d&apos;");
  const x = buildRss({ title: "T & Co", description: "d", siteUrl: "https://x.io/p/", items: [
    { title: "B", slug: "b", date: "2026-10-31", excerpt: "e<1" }, { title: "A", slug: "a", date: "2026-01-01", excerpt: "e" } ] });
  assert.ok(x.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n<rss'));
  assert.ok(x.includes("<title>T &amp; Co</title>"));
  assert.ok(x.includes("<link>https://x.io/p/blog/b/</link>"));
  assert.ok(x.includes("<pubDate>Sat, 31 Oct 2026 00:00:00 GMT</pubDate>"));
  assert.ok(x.includes("e&lt;1"));
  assert.ok(x.indexOf("/blog/b/") < x.indexOf("/blog/a/"));
  assert.equal((x.match(/<item>/g) ?? []).length, 2);
  assert.ok(!buildRss({ title: "t", description: "d", siteUrl: "https://x.io", items: [] }).includes("<item>"));
});
