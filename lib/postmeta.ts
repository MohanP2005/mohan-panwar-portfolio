/** Estimate reading time in minutes (minimum 1). */
export function readTimeMinutes(text: string): number {
  const words = text
    .trim()
    .split(/\s+/)
    .filter(token => token.length > 0).length;
  return Math.max(1, Math.ceil(words / 220));
}

/** Format minutes as “X MIN READ”. */
export function formatReadTime(minutes: number): string {
  return `${minutes} MIN READ`;
}

/** True unless the post is explicitly a draft. */
export function isPublished(p: { draft?: boolean }): boolean {
  return p.draft !== true;
}

/** Return only the published posts, preserving type information. */
export function filterPublished<T extends { draft?: boolean }>(posts: T[]): T[] {
  return posts.filter(isPublished);
}

/** Sort posts newest‑first by date, then by title alphabetically. */
export function sortPosts<T extends { date: string; title: string }>(posts: T[]): T[] {
  return posts
    .slice()
    .sort((a, b) => {
      const dateCmp = b.date.localeCompare(a.date);
      if (dateCmp !== 0) return dateCmp;
      return a.title.localeCompare(b.title);
    });
}
