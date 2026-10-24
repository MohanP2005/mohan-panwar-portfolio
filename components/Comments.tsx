"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabase, supabaseEnabled } from "@/lib/supabase";
import { buildCommentTree, countComments } from "@/lib/comments";
import { authRedirectUrl } from "@/lib/views";
import { site } from "@/content/site";
import { Avatar, Composer, type CommentRow } from "@/components/CommentParts";
import CommentItem from "@/components/CommentItem";

async function fetchRows(slug: string): Promise<CommentRow[] | null> {
  const client = getSupabase();
  if (!client) return null;
  const { data, error } = await client
    .from("comments")
    .select(
      "id,post_slug,parent_id,user_id,author_name,author_avatar,body,created_at,deleted_at",
    )
    .eq("post_slug", slug)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  return error ? null : ((data ?? []) as CommentRow[]);
}

export default function Comments({ slug }: { slug: string }) {
  const [session, setSession] = useState<Session | null>(null);
  const [rows, setRows] = useState<CommentRow[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [replyTo, setReplyTo] = useState<string | null>(null);

  const user = session?.user ?? null;
  const isAdmin = user
    ? (user.email ?? "").toLowerCase() === site.email.toLowerCase()
    : false;

  const tree = useMemo(() => buildCommentTree(rows), [rows]);
  const total = countComments(rows);

  const load = useCallback(async (): Promise<void> => {
    const r = await fetchRows(slug);
    if (r === null) {
      setStatus("error");
    } else {
      setRows(r);
      setStatus("ready");
    }
  }, [slug]);

  useEffect(() => {
    let active = true;
    fetchRows(slug).then((r) => {
      if (!active) return;
      if (r === null) {
        setStatus("error");
      } else {
        setRows(r);
        setStatus("ready");
      }
    });
    return () => {
      active = false;
    };
  }, [slug]);

  useEffect(() => {
    const client = getSupabase();
    if (!client) return;
    client.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = client.auth.onAuthStateChange((_event, s) =>
      setSession(s),
    );
    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback((provider: "google" | "github"): void => {
    void getSupabase()?.auth.signInWithOAuth({
      provider,
      options: { redirectTo: authRedirectUrl(window.location.href) },
    });
  }, []);

  const signOut = useCallback((): void => {
    void getSupabase()?.auth.signOut();
  }, []);

  const submit = useCallback(
    async (body: string, parentId: string | null): Promise<string | null> => {
      const client = getSupabase();
      if (!client || !user) return "Sign in first.";
      const text = body.trim();
      if (text.length < 1) return "Write something first.";
      if (text.length > 2000) return "Keep it under 2000 characters.";
      const { error } = await client.from("comments").insert({
        post_slug: slug,
        parent_id: parentId,
        user_id: user.id,
        body: text,
      });
      if (error) return "Could not post your comment. Try again.";
      await load();
      if (parentId) setReplyTo(null);
      return null;
    },
    [slug, user, load],
  );

  const remove = useCallback(
    async (id: string): Promise<void> => {
      if (!window.confirm("Delete this comment?")) return;
      await getSupabase()?.rpc("delete_comment", { p_id: id });
      await load();
    },
    [load],
  );

  const toggleReply = useCallback((topId: string): void => {
    setReplyTo((cur) => (cur === topId ? null : topId));
  }, []);

  const cancelReply = useCallback((): void => {
    setReplyTo(null);
  }, []);

  if (!supabaseEnabled) return null;

  const displayName = (() => {
    if (!user) return "You";
    const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
    const candidates = [
      typeof meta.full_name === "string" && meta.full_name,
      typeof meta.name === "string" && meta.name,
      typeof meta.user_name === "string" && meta.user_name,
    ];
    for (const c of candidates) {
      if (typeof c === "string" && c.trim().length > 0) return c;
    }
    const email = user.email ?? "";
    const at = email.indexOf("@");
    return at > 0 ? email.slice(0, at) : "You";
  })();

  const avatarUrl = (() => {
    if (!user) return null;
    const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
    return typeof meta.avatar_url === "string" ? meta.avatar_url : null;
  })();

  return (
    <section className="comments" id="comments" aria-label="Comments">
      <span className="label">(—) COMMENTS · {total}</span>
      {user ? (
        <div className="comments-compose">
          <div className="me">
            <Avatar name={displayName} url={avatarUrl} />
            <span className="me-name">{displayName}</span>
            <button
              type="button"
              className="linklike"
              onClick={signOut}
            >
              Sign out
            </button>
          </div>
          <Composer
            label="Write a comment"
            submitLabel="Post"
            onSubmit={(b) => submit(b, null)}
          />
        </div>
      ) : (
        <div className="comments-auth">
          <p className="comments-note">Sign in to join the conversation.</p>
          <div className="auth-btns">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => signIn("google")}
            >
              Sign in with Google
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => signIn("github")}
            >
              Sign in with GitHub
            </button>
          </div>
        </div>
      )}
      {status === "error" ? (
        <p className="comments-empty">
          Comments are unavailable right now.
        </p>
      ) : status === "ready" && tree.length === 0 ? (
        <p className="comments-empty">
          No comments yet. Start the conversation.
        </p>
      ) : status === "ready" ? (
        <ul className="thread">
          {tree.map((c) => (
            <CommentItem
              key={c.id}
              c={c}
              topId={c.id}
              user={user}
              isAdmin={isAdmin}
              replyTo={replyTo}
              onToggleReply={toggleReply}
              onCancelReply={cancelReply}
              onSubmitReply={submit}
              onRemove={remove}
            />
          ))}
        </ul>
      ) : null}
    </section>
  );
}