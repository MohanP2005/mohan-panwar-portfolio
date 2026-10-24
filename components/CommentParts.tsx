'use client';
import { useId, useState } from 'react';
import type { FormEvent } from 'react';

export type CommentRow = {
  id: string;
  post_slug: string;
  parent_id: string | null;
  user_id: string;
  author_name: string;
  author_avatar: string | null;
  body: string;
  created_at: string;
  deleted_at: string | null;
};

export function Avatar({ name, url }: { name: string; url: string | null }) {
  if (url && /^https:\/\//.test(url)) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img className="avatar" src={url} alt="" width={36} height={36} />;
  }
  const fallback = name.trim().charAt(0).toUpperCase() || '?';
  return (
    <span className="avatar avatar-fallback" aria-hidden="true">
      {fallback}
    </span>
  );
}

export function Composer(props: {
  label: string;
  submitLabel: string;
  autoFocus?: boolean;
  onSubmit: (text: string) => Promise<string | null>;
  onCancel?: () => void;
}) {
  const { label, submitLabel, autoFocus = false, onSubmit, onCancel } = props;
  const [text, setText] = useState<string>('');
  const [busy, setBusy] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const id = useId();

  const handler = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    try {
      const err = await onSubmit(text);
      if (err) {
        setError(err);
      } else {
        setText('');
        setError(null);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="composer" onSubmit={handler}>
      <label className="sr-only" htmlFor={id}>
        {label}
      </label>
      <textarea
        id={id}
        className="composer-input"
        rows={3}
        maxLength={2000}
        placeholder={label + '…'}
        value={text}
        onChange={(e) => setText(e.target.value)}
        autoFocus={autoFocus}
      />
      <div className="composer-row">
        <span className="composer-count">{text.length}/2000</span>
        <span className="composer-btns">
          {onCancel ? (
            <button type="button" className="linklike" onClick={onCancel}>
              Cancel
            </button>
          ) : null}
          <button
            type="submit"
            className="btn btn-accent"
            disabled={busy || text.trim() === ''}
          >
            {submitLabel}
          </button>
        </span>
      </div>
      {error ? (
        <p className="composer-error" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}