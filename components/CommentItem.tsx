"use client";

import type { User } from "@supabase/supabase-js";
import { Avatar, Composer, type CommentRow } from "@/components/CommentParts";
import { relativeTime } from "@/lib/comments";
import type { FC } from "react";

export type CommentNode = CommentRow & {
  replies?: CommentRow[];
};

type CommentItemProps = {
  c: CommentNode;
  isReply?: boolean;
  topId: string;
  user: User | null;
  isAdmin: boolean;
  replyTo: string | null;
  onToggleReply: (topId: string) => void;
  onCancelReply: () => void;
  onSubmitReply: (body: string, parentId: string) => Promise<string | null>;
  onRemove: (id: string) => void;
};

const CommentItem: FC<CommentItemProps> = ({
  c,
  isReply = false,
  topId,
  user,
  isAdmin,
  replyTo,
  onToggleReply,
  onCancelReply,
  onSubmitReply,
  onRemove,
}) => {
  const canDelete = user && (user.id === c.user_id || isAdmin);

  return (
    <li className="comment" id={"c-" + c.id}>
      <Avatar name={c.author_name} url={c.author_avatar} />
      <div className="comment-main">
        <div className="comment-meta">
          <span className="comment-name">{c.author_name}</span>
          <span className="comment-time">{relativeTime(c.created_at)}</span>
        </div>
        <p className="comment-body">{c.body}</p>
        <div className="comment-actions">
          <button
            type="button"
            className="linklike"
            onClick={() => onToggleReply(topId)}
          >
            Reply
          </button>
          {canDelete ? (
            <button
              type="button"
              className="linklike"
              onClick={() => onRemove(c.id)}
            >
              Delete
            </button>
          ) : null}
        </div>
        {!isReply && replyTo === c.id ? (
          user ? (
            <Composer
              label="Write a reply"
              submitLabel="Reply"
              autoFocus
              onSubmit={(b) => onSubmitReply(b, c.id)}
              onCancel={onCancelReply}
            />
          ) : (
            <p className="comments-note">Sign in above to reply.</p>
          )
        ) : null}
        {!isReply && c.replies && c.replies.length > 0 ? (
          <ul className="replies">
            {c.replies.map((r) => (
              <CommentItem
                key={r.id}
                c={r}
                isReply={true}
                topId={topId}
                user={user}
                isAdmin={isAdmin}
                replyTo={replyTo}
                onToggleReply={onToggleReply}
                onCancelReply={onCancelReply}
                onSubmitReply={onSubmitReply}
                onRemove={onRemove}
              />
            ))}
          </ul>
        ) : null}
      </div>
    </li>
  );
};

export default CommentItem;