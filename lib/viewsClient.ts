import { getSupabase } from "@/lib/supabase";
import { shouldCountView } from "@/lib/views";

type ViewCountRow = {
  post_slug: string;
  count: number | string;
};

type RpcResponse<T> = {
  data?: T;
  error?: unknown;
};

let viewCountsPromise: Promise<Record<string, number>> | null = null;

export async function fetchViewCounts(): Promise<Record<string, number>> {
  if (viewCountsPromise) {
    return viewCountsPromise;
  }

  const client = getSupabase();
  if (!client) {
    return {};
  }

  const promise = (async () => {
    try {
      const response = await (client as unknown as {
        rpc: (fn: string) => Promise<RpcResponse<ViewCountRow[]>>;
      }).rpc("get_view_counts");
      const { data, error } = response;
      if (error || !data) {
        return {};
      }
      const result: Record<string, number> = {};
      for (const row of data) {
        const count = typeof row.count === "string" ? Number(row.count) : row.count;
        if (!Number.isNaN(count)) {
          result[row.post_slug] = count;
        }
      }
      return result;
    } catch {
      return {};
    }
  })();

  viewCountsPromise = promise;

  const result = await promise;
  if (Object.keys(result).length === 0) {
    viewCountsPromise = null;
  }
  return result;
}

export async function recordView(slug: string): Promise<number | null> {
  const client = getSupabase();
  if (!client) {
    return null;
  }

  let storage: Storage | null = null;
  try {
    storage = window.sessionStorage;
  } catch {
    // storage remains null
  }

  if (storage && !shouldCountView(storage, slug)) {
    return null;
  }

  try {
    const response = await (client as unknown as {
      rpc: (fn: string, args: { slug: string }) => Promise<RpcResponse<number | string>>;
    }).rpc("increment_view", { slug });
    const { data, error } = response;
    if (error || data == null) {
      return null;
    }
    const count = typeof data === "string" ? Number(data) : data;
    return Number.isNaN(count) ? null : count;
  } catch {
    return null;
  }
}