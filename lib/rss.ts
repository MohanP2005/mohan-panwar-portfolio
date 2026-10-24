/** Escape XML special characters. */
export function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Data shape for a single RSS item. */
export type RssItem = {
  title: string;
  slug: string;
  date: string; // YYYY‑MM‑DD
  excerpt: string;
};

/** Build an RSS 2.0 XML string from options. */
export function buildRss(opts: {
  title: string;
  description: string;
  siteUrl: string;
  items: RssItem[];
}): string {
  // Ensure siteUrl has no trailing slash.
  const base = opts.siteUrl.replace(/\/+$/, '');

  const parts: string[] = [];

  // XML declaration.
  parts.push('<?xml version="1.0" encoding="UTF-8"?>');

  // Opening RSS and channel tags.
  parts.push('<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel>');

  // Basic channel data.
  parts.push(`<title>${escapeXml(opts.title)}</title>`);
  parts.push(`<link>${escapeXml(base + '/blog/')}</link>`);
  parts.push(`<description>${escapeXml(opts.description)}</description>`);
  parts.push(
    `<atom:link href="${escapeXml(base + '/blog/rss.xml')}" rel="self" type="application/rss+xml"/>`
  );

  // Items.
  for (const item of opts.items) {
    const itemUrl = `${base}/blog/${item.slug}/`;
    const pubDate = new Date(item.date + 'T00:00:00Z').toUTCString();

    parts.push('<item>');
    parts.push(`<title>${escapeXml(item.title)}</title>`);
    parts.push(`<link>${escapeXml(itemUrl)}</link>`);
    parts.push(
      `<guid isPermaLink="true">${escapeXml(itemUrl)}</guid>`
    );
    parts.push(`<pubDate>${escapeXml(pubDate)}</pubDate>`);
    parts.push(`<description>${escapeXml(item.excerpt)}</description>`);
    parts.push('</item>');
  }

  // Closing tags.
  parts.push('</channel></rss>');

  return parts.join('\n');
}
