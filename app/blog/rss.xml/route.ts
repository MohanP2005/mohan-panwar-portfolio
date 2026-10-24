import { getAllPosts } from "@/lib/posts";
import { buildRss } from "@/lib/rss";
import { SITE_URL } from "@/content/site";

export const dynamic = "force-static";

export function GET(): Response {
  const items = getAllPosts().map((post) => ({
    title: post.title,
    slug: post.slug,
    date: post.date,
    excerpt: post.excerpt,
  }));

  const xml = buildRss({
    title: "Mohan Panwar: Writing",
    description:
      "Notes on building tablebid, trading systems, game bots and this site.",
    siteUrl: SITE_URL,
    items,
  });

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}