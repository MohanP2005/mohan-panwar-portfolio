"use client";
import React, { useRef, useState } from "react";
import SlideVideo from "@/components/SlideVideo";
import { wrapIndex, type AboutPhoto } from "@/lib/slideshow";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export default function AboutSlideshow({
  photos,
}: {
  photos: AboutPhoto[];
}) {
  const total = photos.length;
  const [idx, setIdx] = useState<number>(0);
  const startX = useRef<number | null>(null);

  const go = (delta: number) => {
    setIdx((prev) => wrapIndex(prev, delta, total));
  };

  if (total === 0) {
    return null;
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (total <= 1) return;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      go(-1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      go(1);
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (total <= 1) return;
    startX.current = e.clientX;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (total <= 1) return;
    if (startX.current !== null) {
      const dx = e.clientX - startX.current;
      if (Math.abs(dx) > 40) {
        go(dx < 0 ? 1 : -1);
      }
    }
    startX.current = null;
  };

  const handlePointerCancel = () => {
    startX.current = null;
  };

  return (
    <section
      className="slideshow"
      role="region"
      aria-roledescription="carousel"
      aria-label="Photos of Mohan"
      tabIndex={0}
      data-testid="about-slideshow"
      onKeyDown={handleKeyDown}
    >
      <div
        className="slideshow-frame"
        style={{ touchAction: "pan-y" }}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      >
        {photos.map((p, i) => {
          if (p.kind === "video") {
            return (
              <SlideVideo
                key={i}
                className={"slideshow-img" + (i === idx ? " is-active" : "")}
                src={p.src}
                poster={p.poster}
                alt={p.alt}
                active={i === idx}
              />
            );
          }
          return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              className={"slideshow-img" + (i === idx ? " is-active" : "")}
              src={p.src}
              alt={p.alt}
              loading={i === 0 ? "eager" : "lazy"}
              decoding="async"
              draggable={false}
              aria-hidden={i === idx ? undefined : true}
            />
          );
        })}
      </div>
      <div className="slideshow-meta">
        <div className="slideshow-text" aria-live="polite" aria-atomic="true">
          <p className="slideshow-caption" data-testid="slideshow-caption">
            {photos[idx].caption}
          </p>
          {total > 1 && (
            <span
              className="label slideshow-count"
              data-testid="slideshow-count"
            >
              {pad(idx + 1)} / {pad(total)}
            </span>
          )}
        </div>
        {total > 1 && (
          <div className="slideshow-controls">
            <button
              type="button"
              className="slideshow-btn"
              aria-label="Previous photo"
              onClick={() => go(-1)}
            >
              <svg
                viewBox="0 0 16 16"
                width={16}
                height={16}
                aria-hidden="true"
                focusable="false"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M10 3 L5 8 L10 13" />
              </svg>
            </button>
            <div className="slideshow-dots">
              {photos.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  className={"slideshow-dot" + (i === idx ? " is-active" : "")}
                  aria-label={`Show photo ${i + 1} of ${total}`}
                  aria-current={i === idx ? "true" : undefined}
                  onClick={() => setIdx(i)}
                />
              ))}
            </div>
            <button
              type="button"
              className="slideshow-btn"
              aria-label="Next photo"
              onClick={() => go(1)}
            >
              <svg
                viewBox="0 0 16 16"
                width={16}
                height={16}
                aria-hidden="true"
                focusable="false"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 3 L11 8 L6 13" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </section>
  );
}