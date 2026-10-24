import { getSupabase } from "@/lib/supabase";
import { shouldCountView } from "@/lib/views";

type ViewRow = {
  post_slug: string;
  count: number | string;
};

let viewCountsCache: Promise<Record<string, number>> | null = null;
const inflight = new Map<string, Promise<number | null>>();

export async function fetchViewCounts(): Promise<Record<string, number>> {
  if (viewCountsCache) {
    return viewCountsCache;
  }

  viewCountsCache = (async (): Promise<Record<string, number>> => {
    const client = getSupabase();
    if (!client) {
      return {};
    }
    try {
      const response = await client.rpc("get_view_counts");
      if (response.error) {
        return {};
      }
      const rows = response.data as ViewRow[] | null;
      const result: Record<string, number> = {};
      if (Array.isArray(rows)) {
        for (const row of rows) {
          const count = typeof row.count === "string" ? Number(row.count) : row.count;
          if (!Number.isNaN(count)) {
            result[row.post_slug] = count;
          }
        }
      }
      return result;
    } catch {
      return {};
    }
  })().then((result) => {
    if (Object.keys(result).length === 0) {
      viewCountsCache = null;
    }
    return result;
  });

  return viewCountsCache;
}

export async function recordView(slug: string): Promise<number | null> {
  const existing = inflight.get(slug);
  if (existing) {
    return existing;
  }

  const promise = (async (): Promise<number | null> => {
    const client = getSupabase();
    if (!client) {
      return null;
    }

    let storage: Storage | null = null;
    try {
      storage = window.sessionStorage;
    } catch {
      // sessionStorage unavailable
    }

    if (storage && !shouldCountView(storage, slug)) {
      return null;
    }

    try {
      const response = await client.rpc("increment_view", { slug });
      if (response.error) {
        return null;
      }
      const data = response.data as number | string | null | undefined;
      if (data == null) {
        return null;
      }
      const count = typeof data === "string" ? Number(data) : data;
      return Number.isNaN(count) ? null : count;
    } catch {
      return null;
    }
  })();

  inflight.set(slug, promise);
  return promise;
}