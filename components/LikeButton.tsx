"use client";

import { useEffect, useRef, useState } from "react";
import { getSupabase, supabaseEnabled } from "@/lib/supabase";
import { getClientId } from "@/lib/views";

function clientId(): string {
  try {
    return getClientId(window.localStorage, () => crypto.randomUUID());
  } catch {
    return crypto.randomUUID();
  }
}

export default function LikeButton({ slug }: { slug: string }) {
  const [count, setCount] = useState<number>(0);
  const [liked, setLiked] = useState<boolean>(false);
  const busy = useRef<boolean>(false);

  useEffect(() => {
    if (!supabaseEnabled) return;
    const client = getSupabase();
    if (!client) return;

    let cancelled = false;

    const load = async () => {
      try {
        const { data, error } = await client.rpc("get_likes", {
          p_slug: slug,
          p_client_id: clientId(),
        });
        if (cancelled) return;
        if (!error && Array.isArray(data) && data[0]) {
          const row = data[0] as { like_count: number | string; liked: boolean };
          setCount(Number(row.like_count));
          setLiked(Boolean(row.liked));
        }
      } catch {
        // silently ignore
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  const handleClick = async () => {
    if (busy.current) return;
    busy.current = true;

    const next = !liked;
    setLiked(next);
    setCount((c) => Math.max(0, c + (next ? 1 : -1)));

    const client = getSupabase();
    if (!client) {
      setLiked(!next);
      setCount((c) => Math.max(0, c + (next ? -1 : 1)));
      busy.current = false;
      return;
    }

    try {
      const { error } = await client.rpc(next ? "like_post" : "unlike_post", {
        p_slug: slug,
        p_client_id: clientId(),
      });
      if (error) throw error;
    } catch {
      setLiked(!next);
      setCount((c) => Math.max(0, c + (next ? -1 : 1)));
    } finally {
      busy.current = false;
    }
  };

  if (!supabaseEnabled) return null;

  return (
    <div className="like-wrap">
      <button
        type="button"
        className={"like-btn" + (liked ? " is-liked" : "")}
        aria-pressed={liked}
        aria-label={liked ? "Unlike this post" : "Like this post"}
        onClick={handleClick}
      >
        <svg
          width={18}
          height={18}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinejoin="round"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2z" />
        </svg>
        <span className="like-count">{count}</span>
      </button>
    </div>
  );
}