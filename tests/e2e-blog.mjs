// Blog + interactions e2e. Starts its own throwaway `next dev` servers (separate distDirs),
// so it does not touch a dev server you already have running on :3000.
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import assert from "node:assert/strict";

const BASE_PATH = "/mohan-panwar-portfolio";
const FIXTURES = "tests/fixtures/posts";
const SB_URL = "http://localhost:54321";
const SB_KEY = "test-anon-key";

async function startServer(port, env) {
  const child = spawn("npx", ["next", "dev", "-p", String(port)], {
    env: {
      ...process.env,
      NEXT_PUBLIC_SUPABASE_URL: "",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
      POSTS_EXTRA_DIR: "",
      NEXT_DIST_DIR: `.next-e2e-${port}`,
      ...env,
    },
    stdio: "ignore",
    detached: true,
  });
  const url = `http://localhost:${port}${BASE_PATH}`;
  for (let i = 0; i < 120; i++) {
    try {
      const r = await fetch(`${url}/blog/`);
      if (r.status === 200) return { url, stop: () => { try { process.kill(-child.pid); } catch {} } };
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  try { process.kill(-child.pid); } catch {}
  throw new Error(`dev server on ${port} did not start`);
}

function watch(page) {
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push(String(e)));
  return errors;
}

const fakeJwt = (payload) =>
  ["e30", Buffer.from(JSON.stringify(payload)).toString("base64url"), "sig"].join(".");

function mockSupabase(page, state) {
  return page.route(`${SB_URL}/**`, async (route) => {
    const req = route.request();
    const cors = {
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "*",
      "access-control-allow-methods": "*",
    };
    if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers: cors });
    const u = new URL(req.url());
    const json = (body, status = 200) =>
      route.fulfill({ status, headers: { ...cors, "content-type": "application/json" }, body: JSON.stringify(body) });
    if (u.pathname === "/rest/v1/comments" && req.method() === "GET") return json(state.comments);
    if (u.pathname === "/rest/v1/comments" && req.method() === "POST") {
      state.inserted.push(req.postDataJSON());
      return route.fulfill({ status: 201, headers: cors, body: "" });
    }
    if (u.pathname === "/rest/v1/rpc/get_view_counts") return json(state.views);
    if (u.pathname === "/rest/v1/rpc/increment_view") { state.incremented += 1; return json(1205); }
    if (u.pathname === "/rest/v1/rpc/get_likes") return json([{ like_count: state.likes, liked: false }]);
    if (u.pathname === "/rest/v1/rpc/like_post") { state.likeCalls.push("like"); return route.fulfill({ status: 204, headers: cors, body: "" }); }
    if (u.pathname === "/rest/v1/rpc/unlike_post") { state.likeCalls.push("unlike"); return route.fulfill({ status: 204, headers: cors, body: "" }); }
    return json({}, 404);
  });
}

let failed = false;
const servers = [];
let browser;
try {
  browser = await chromium.launch({ headless: true });

  // ---------- Phase A: no posts published, no Supabase env ----------
  {
    const s = await startServer(3101, {});
    servers.push(s);
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    const errors = watch(page);

    await page.goto(`${s.url}/blog/`, { waitUntil: "networkidle" });
    await page.getByText("First post coming 2026-11-01").waitFor();
    assert.equal(await page.locator(".spot").count(), 1, "spotlight on /blog");
    assert.equal(await page.locator("a.feat").count(), 0, "no featured post link when empty");
    for (const sel of [".comments", ".like-btn", ".view-count"]) {
      assert.equal(await page.locator(sel).count(), 0, `${sel} must not exist without Supabase`);
    }

    await page.goto(`${s.url}/`, { waitUntil: "networkidle" });
    await page.locator("#writing").getByText("First post coming 2026-11-01").waitFor();
    const all = await page.getByRole("link", { name: "All posts →" }).getAttribute("href");
    assert.equal(all, `${BASE_PATH}/blog/`);

    const rss = await (await fetch(`${s.url}/blog/rss.xml`)).text();
    assert.ok(rss.startsWith('<?xml version="1.0"'), "rss xml");
    assert.ok(!rss.includes("<item>"), "no items while all posts are drafts");

    const draft = await fetch(`${s.url}/blog/i-threw-away-my-first-website/`);
    // dev server answers 500 (export mode, unknown param); the static build simply has no file => 404 on Pages
    assert.notEqual(draft.status, 200, "draft post is not built");

    assert.deepEqual(errors, [], "console errors in phase A");
    await ctx.close();
    s.stop();
    console.log("phase A ok (empty state, drafts hidden, interactive UI hidden)");
  }

  // ---------- Phase B: fixture posts, no Supabase env ----------
  {
    const s = await startServer(3102, { POSTS_EXTRA_DIR: FIXTURES });
    servers.push(s);
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    const errors = watch(page);

    await page.goto(`${s.url}/blog/`, { waitUntil: "networkidle" });
    assert.equal(await page.locator("a.feat .feat-title").innerText(), "Fixture post for end-to-end tests", "newest post is featured");
    assert.equal(await page.locator(".archive .arow-title").allInnerTexts().then((a) => a.join("|")), "Older fixture post");
    assert.equal(await page.getByText("Hidden fixture draft").count(), 0, "draft hidden in index");

    await page.goto(`${s.url}/`, { waitUntil: "networkidle" });
    assert.ok(await page.locator("#writing a.feat").getAttribute("href").then((h) => h.endsWith("/blog/e2e-fixture-post/")));

    await page.goto(`${s.url}/blog/e2e-fixture-post/`, { waitUntil: "networkidle" });
    assert.equal(await page.locator("h1.post-title").innerText(), "Fixture post for end-to-end tests");
    assert.match(await page.locator(".post-meta").innerText(), /^2026-10-30 · 1 MIN READ$/);
    assert.equal(await page.locator(".topbar a.logo").getAttribute("href"), `${BASE_PATH}/`);
    assert.equal(await page.getByRole("link", { name: "← All writing" }).getAttribute("href"), `${BASE_PATH}/blog/`);
    for (const sel of [".post-body h2", ".post-body h3", ".post-body ul li", ".post-body blockquote", ".post-body pre code", ".post-body code", ".post-body figure img", ".post-body a"]) {
      assert.ok((await page.locator(sel).count()) > 0, `post body has ${sel}`);
    }
    assert.equal(await page.locator(".post-body figcaption").innerText(), "Figure caption goes here");
    assert.equal(await page.locator(".post-body p > figure").count(), 0, "figure not nested in p");
    const bodyBox = await page.locator(".post-body").boundingBox();
    assert.ok(bodyBox.width <= 681, `body max 680px (got ${bodyBox.width})`);
    const bodyStyle = await page.locator(".post-body p").first().evaluate((el) => { const c = getComputedStyle(el); return [c.fontSize, c.lineHeight]; });
    assert.deepEqual(bodyStyle, ["19px", "30px"]);
    await page.locator("#contact").waitFor();
    assert.equal(await page.locator(".footer-name").innerText(), "MOHAN");
    assert.equal(await page.locator(".spot").count(), 1, "spotlight on post page");
    for (const sel of [".comments", ".like-btn", ".view-count"]) {
      assert.equal(await page.locator(sel).count(), 0, `${sel} hidden without Supabase`);
    }
    assert.equal(await page.locator(".post-actions").isVisible(), false, "empty actions box is not shown");

    const rss = await (await fetch(`${s.url}/blog/rss.xml`)).text();
    assert.equal((rss.match(/<item>/g) ?? []).length, 2);
    assert.ok(rss.indexOf("e2e-fixture-post") < rss.indexOf("e2e-fixture-older"), "rss newest first");
    assert.ok(!rss.includes("Hidden fixture draft"));

    // mobile
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto(`${s.url}/blog/e2e-fixture-post/`, { waitUntil: "networkidle" });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    assert.ok(overflow <= 0, `no horizontal overflow at 375px (${overflow})`);

    assert.deepEqual(errors, [], "console errors in phase B");
    await ctx.close();
    s.stop();
    console.log("phase B ok (fixture post structure, rss, index, mobile)");
  }

  // ---------- Phase C: fixture posts + mocked Supabase ----------
  {
    const s = await startServer(3103, { POSTS_EXTRA_DIR: FIXTURES, NEXT_PUBLIC_SUPABASE_URL: SB_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY: SB_KEY });
    servers.push(s);
    const ago = (ms) => new Date(Date.now() - ms).toISOString();
    const state = {
      incremented: 0, likeCalls: [], inserted: [], likes: 3,
      views: [{ post_slug: "e2e-fixture-post", count: 1204 }, { post_slug: "e2e-fixture-older", count: 7 }],
      comments: [
        { id: "c1", post_slug: "e2e-fixture-post", parent_id: null, user_id: "u-other", author_name: "Ada", author_avatar: null, body: "<b>bold?</b> <img src=x onerror=alert(1)>", created_at: ago(5 * 60e3), deleted_at: null },
        { id: "c2", post_slug: "e2e-fixture-post", parent_id: "c1", user_id: "u-me", author_name: "Me", author_avatar: null, body: "a reply", created_at: ago(2 * 60e3), deleted_at: null },
      ],
    };

    // signed out
    {
      const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      const page = await ctx.newPage();
      const errors = watch(page);
      await mockSupabase(page, state);
      await page.goto(`${s.url}/blog/e2e-fixture-post/`, { waitUntil: "networkidle" });
      assert.match(await page.locator(".post-meta").innerText(), /^2026-10-30 · 1 MIN READ · 1,205 VIEWS$/);
      assert.equal(state.incremented, 1, "view incremented once");
      await page.reload({ waitUntil: "networkidle" });
      assert.equal(state.incremented, 1, "view not re-counted in the same session");
      assert.match(await page.locator(".comments .label").innerText(), /^\(—\) COMMENTS · 2$/);
      assert.equal(await page.locator(".comment-body").first().innerText(), "<b>bold?</b> <img src=x onerror=alert(1)>");
      assert.equal(await page.locator(".comment-body b, .comment-body img").count(), 0, "body is plain text");
      assert.equal(await page.locator(".thread > .comment > .comment-main > .replies > .comment").count(), 1, "reply nested");
      await page.getByRole("button", { name: "Sign in with Google" }).waitFor();
      await page.getByRole("button", { name: "Sign in with GitHub" }).waitFor();
      assert.equal(await page.locator(".composer").count(), 0, "no composer when signed out");
      await page.getByRole("button", { name: "Reply" }).first().click();
      await page.getByText("Sign in above to reply.").waitFor();

      // like: optimistic, filled when liked
      const like = page.locator(".like-btn");
      await page.waitForFunction(() => document.querySelector(".like-count")?.textContent === "3");
      await like.click();
      assert.equal(await page.locator(".like-count").innerText(), "4");
      assert.equal(await like.getAttribute("aria-pressed"), "true");
      await page.waitForTimeout(400); // colour transition
      const bg = await like.evaluate((el) => getComputedStyle(el).backgroundColor);
      assert.equal(bg, "rgb(92, 107, 58)", "liked = olive");
      await like.click();
      assert.equal(await page.locator(".like-count").innerText(), "3");
      await page.waitForTimeout(200);
      assert.deepEqual(state.likeCalls, ["like", "unlike"]);

      // views in index and archive
      await page.goto(`${s.url}/blog/`, { waitUntil: "networkidle" });
      assert.match(await page.locator("a.feat .feat-meta").innerText(), /1,204 VIEWS$/);
      assert.match(await page.locator(".arow-date").first().innerText(), /7 VIEWS$/);
      await page.goto(`${s.url}/`, { waitUntil: "networkidle" });
      assert.match(await page.locator("#writing .arow-date").first().innerText(), /7 VIEWS$/);

      // empty state
      state.comments = [];
      await page.goto(`${s.url}/blog/e2e-fixture-post/`, { waitUntil: "networkidle" });
      await page.getByText("No comments yet. Start the conversation.").waitFor();
      assert.deepEqual(errors.filter((e) => !/Failed to load resource|ERR_/.test(e)), [], "console errors in phase C (signed out)");
      await ctx.close();
    }

    // signed in
    {
      state.comments = [
        { id: "c1", post_slug: "e2e-fixture-post", parent_id: null, user_id: "u-other", author_name: "Ada", author_avatar: null, body: "hello there", created_at: ago(5 * 60e3), deleted_at: null },
        { id: "c2", post_slug: "e2e-fixture-post", parent_id: null, user_id: "u-me", author_name: "Me", author_avatar: null, body: "mine", created_at: ago(60e3), deleted_at: null },
      ];
      const ctx = await browser.newContext({ viewport: { width: 375, height: 800 } });
      const exp = Math.floor(Date.now() / 1000) + 3600;
      const session = {
        access_token: fakeJwt({ sub: "u-me", exp, role: "authenticated" }),
        refresh_token: "r", token_type: "bearer", expires_in: 3600, expires_at: exp,
        user: { id: "u-me", aud: "authenticated", email: "me@example.com", app_metadata: {}, user_metadata: { full_name: "Mo Tester" }, created_at: new Date().toISOString() },
      };
      await ctx.addInitScript(([k, v]) => localStorage.setItem(k, v), ["sb-localhost-auth-token", JSON.stringify(session)]);
      const page = await ctx.newPage();
      const errors = watch(page);
      await mockSupabase(page, state);
      await page.goto(`${s.url}/blog/e2e-fixture-post/`, { waitUntil: "networkidle" });
      await page.locator(".me-name").waitFor();
      assert.equal(await page.locator(".me-name").innerText(), "Mo Tester");
      await page.getByRole("button", { name: "Sign out" }).waitFor();
      assert.equal(await page.getByRole("button", { name: "Sign in with Google" }).count(), 0);
      // Delete only on own comment
      assert.equal(await page.getByRole("button", { name: "Delete" }).count(), 1);
      // post
      const post = page.getByRole("button", { name: "Post", exact: true });
      assert.equal(await post.isDisabled(), true, "Post disabled when empty");
      await page.getByLabel("Write a comment").fill("Nice one");
      await post.click();
      await page.waitForFunction(() => true);
      await page.waitForTimeout(300);
      assert.equal(state.inserted.length, 1);
      assert.equal(state.inserted[0].body, "Nice one");
      assert.equal(state.inserted[0].user_id, "u-me");
      assert.equal(state.inserted[0].parent_id, null);
      // reply box
      await page.getByRole("button", { name: "Reply" }).first().click();
      await page.getByLabel("Write a reply").fill("thanks");
      await page.locator(".comment form.composer button[type=submit]").click();
      await page.waitForTimeout(300);
      assert.equal(state.inserted.length, 2);
      assert.equal(state.inserted[1].parent_id, "c2"); // newest first, so the first Reply belongs to c2
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      assert.ok(overflow <= 0, "no horizontal overflow at 375px signed in");
      await page.screenshot({ path: process.env.SHOT_DIR ? `${process.env.SHOT_DIR}/post-signedin-375.png` : "/dev/null", fullPage: true }).catch(() => {});
      assert.deepEqual(errors.filter((e) => !/Failed to load resource|ERR_/.test(e)), [], "console errors in phase C (signed in)");
      await ctx.close();
    }
    s.stop();
    console.log("phase C ok (mocked Supabase: views, likes, comments, auth states)");
  }

  console.log("e2e-blog ok");
} catch (err) {
  console.error(err);
  failed = true;
} finally {
  for (const s of servers) s.stop();
  if (browser) await browser.close();
  process.exit(failed ? 1 : 0);
}
