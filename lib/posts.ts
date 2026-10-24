import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { marked } from "marked";
import { BASE_PATH } from "@/content/site";
import {
  readTimeMinutes,
  formatReadTime,
  filterPublished,
  sortPosts,
} from "@/lib/postmeta";

export type Post = {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  cover?: string;
  draft: boolean;
  tags: string[];
  minutes: number;
  readTime: string;
  html: string;
};

/* ---------- Markdown image renderer (module init) ---------- */
function escapeHtml(str: string): string {
  return str.replace(/[&<>"]/g, (c) =>
    c === "&"
      ? "&amp;"
      : c === "<"
      ? "&lt;"
      : c === ">"
      ? "&gt;"
      : `&quot;`
  );
}

marked.use({
  renderer: {
    image(token: { href: string; title: string | null; text: string }) {
      const srcNeedsPrefix = token.href.startsWith("/") && !token.href.startsWith("//");
      const src = srcNeedsPrefix ? `${BASE_PATH}${token.href}` : token.href;
      const alt = escapeHtml(token.text);
      const title = token.title ? escapeHtml(token.title) : null;
      const figureParts = [
        `<figure>`,
        `<img src="${src}" alt="${alt}" loading="lazy" />`,
        title ? `<figcaption>${title}</figcaption>` : "",
        `</figure>`,
      ];
      return figureParts.join("");
    },
  },
});

/* ---------- Helpers ---------- */
function normalizeDate(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "string") return value.slice(0, 10);
  return "1970-01-01";
}

function resolveCover(cover?: string): string | undefined {
  if (!cover) return undefined;
  if (cover.startsWith("/") && !cover.startsWith("//")) {
    return `${BASE_PATH}${cover}`;
  }
  return cover;
}

/* ---------- Core logic ---------- */
function collectFileMap(): Map<string, string> {
  const dirs: string[] = [
    path.join(process.cwd(), "content", "posts"),
  ];

  const extra = process.env.POSTS_EXTRA_DIR?.trim();
  if (extra) dirs.push(path.resolve(extra));

  const map = new Map<string, string>();

  for (const dir of dirs) {
    if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) continue;
    const files = fs.readdirSync(dir);
    for (const file of files) {
      if (!file.endsWith(".md") && !file.endsWith(".mdx")) continue;
      const slug = file.replace(/\.(md|mdx)$/, "");
      const fullPath = path.join(dir, file);
      map.set(slug, fullPath); // later dirs overwrite earlier ones
    }
  }

  return map;
}

function buildPost(slug: string, filePath: string): Post {
  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = matter(raw);
  const fm = parsed.data as {
    title?: unknown;
    date?: unknown;
    excerpt?: unknown;
    cover?: unknown;
    draft?: unknown;
    tags?: unknown;
  };

  const title = typeof fm.title === "string" && fm.title.trim() !== "" ? fm.title : slug;
  const date = normalizeDate(fm.date);
  const excerpt = typeof fm.excerpt === "string" ? fm.excerpt : "";
  const cover = typeof fm.cover === "string" ? resolveCover(fm.cover) : undefined;
  const draft = fm.draft === true;
  const tags = Array.isArray(fm.tags)
    ? fm.tags.filter((t) => typeof t === "string") as string[]
    : [];

  const minutes = readTimeMinutes(parsed.content);
  const readTime = formatReadTime(minutes);
  const rawHtml = marked.parse(parsed.content, { async: false }) as string;
  const html = rawHtml.replace(
    /<p>(<figure>[\s\S]*?<\/figure>)<\/p>/g,
    "$1"
  );

  return {
    slug,
    title,
    date,
    excerpt,
    cover,
    draft,
    tags,
    minutes,
    readTime,
    html,
  };
}

/* ---------- Exported functions ---------- */
export function getAllPosts(): Post[] {
  const map = collectFileMap();
  const posts: Post[] = [];

  for (const [slug, filePath] of map.entries()) {
    posts.push(buildPost(slug, filePath));
  }

  const published = filterPublished(posts);
  return sortPosts(published);
}

export function getPost(slug: string): Post | undefined {
  const all = getAllPosts();
  return all.find((p) => p.slug === slug);
}
