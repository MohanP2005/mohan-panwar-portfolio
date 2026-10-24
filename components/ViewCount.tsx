"use client";

import { useEffect, useState } from "react";
import { supabaseEnabled } from "@/lib/supabase";
import { fetchViewCounts, recordView } from "@/lib/viewsClient";
import { formatViews } from "@/lib/views";

type ViewCountProps = {
  slug: string;
  record?: boolean;
  lead?: string;
};

export default function ViewCount({
  slug,
  record = false,
  lead = " · ",
}: ViewCountProps) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    if (!supabaseEnabled) {
      return;
    }

    let cancelled = false;

    (async () => {
      if (record) {
        const n = await recordView(slug);
        if (n !== null && !cancelled) {
          setCount(n);
          return;
        }
      }

      const all = await fetchViewCounts();
      if (!cancelled) {
        setCount(all[slug] ?? 0);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [slug, record]);

  if (!supabaseEnabled || count === null) {
    return null;
  }

  return (
    <span className="view-count">
      {lead}
      {formatViews(count)}
    </span>
  );
}