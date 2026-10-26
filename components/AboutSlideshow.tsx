"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import SlideVideo, { useReducedMotion } from "@/components/SlideVideo";
import { wrapIndex, autoAdvanceDelay, type AboutPhoto } from "@/lib/slideshow";
import { PrevIcon, NextIcon, PauseIcon, PlayIcon } from "@/components/SlideshowIcons";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export default function AboutSlideshow({
  photos,
  imageDelayMs,
}: {
  photos: AboutPhoto[];
  imageDelayMs?: number;
}) {
  const total = photos.length;
  const [idx, setIdx] = useState<number>(0);
  const [userPaused, setUserPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focusVisible, setFocusVisible] = useState(false);
  const [tabHidden, setTabHidden] = useState(false);
  const [inView, setInView] = useState(true);
  const [videoEnded, setVideoEnded] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [nav, setNav] = useState(0);
  const sectionRef = useRef<HTMLElement | null>(null);
  const startX = useRef<number | null>(null);
  const reduced = useReducedMotion();

  const autoMode = total > 1 && !reduced && !userPaused;
  const running = autoMode && !hovered && !focusVisible && !tabHidden && inView;

  const navigate = useCallback((next: number) => {
    setIdx(next);
    setVideoEnded(false);
    setVideoFailed(false);
    setNav((n) => n + 1);
  }, []);

  const go = useCallback(
    (delta: number) => {
      setIdx((prev) => {
        const next = wrapIndex(prev, delta, total);
        setVideoEnded(false);
        setVideoFailed(false);
        setNav((n) => n + 1);
        return next;
      });
    },
    [total]
  );

  useEffect(() => {
    if (!running) return;
    const delay = autoAdvanceDelay({
      kind: photos[idx]?.kind,
      reduced,
      videoEnded,
      videoFailed,
      imageMs: imageDelayMs,
    });
    if (delay === null) return;
    const t = setTimeout(() => go(1), delay);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, idx, nav, videoEnded, videoFailed, reduced, total, imageDelayMs]);

  useEffect(() => {
    const onVis = () => setTabHidden(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    const el = sectionRef.current;
    let observer: IntersectionObserver | null = null;
    if (el && typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver((entries) => {
        const last = entries[entries.length - 1];
        setInView(last ? last.isIntersecting : true);
      });
      observer.observe(el);
    }
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      if (observer) observer.disconnect();
    };
  }, []);

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
      ref={sectionRef}
      className="slideshow"
      role="region"
      aria-roledescription="carousel"
      aria-label="Photos of Mohan"
      tabIndex={0}
      data-testid="about-slideshow"
      data-autoplay={running ? "on" : "off"}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={(e) => {
        const t = e.target as HTMLElement;
        let fv = false;
        try {
          fv = t.matches(":focus-visible");
        } catch {
          fv = false;
        }
        if (fv) setFocusVisible(true);
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocusVisible(false);
      }}
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
                loop={!autoMode}
                onEnded={() => {
                  if (i === idx) setVideoEnded(true);
                }}
                onUnplayable={() => {
                  if (i === idx) setVideoFailed(true);
                }}
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
        <div className="slideshow-text" aria-live={autoMode ? "off" : "polite"} aria-atomic="true">
          <p className="slideshow-caption" data-testid="slideshow-caption">
            {photos[idx].caption}
          </p>
          {total > 1 && (
            <span className="label slideshow-count" data-testid="slideshow-count">
              {pad(idx + 1)} / {pad(total)}
            </span>
          )}
        </div>
        {total > 1 && (
          <div className="slideshow-controls">
            <button type="button" className="slideshow-btn" aria-label="Previous photo" onClick={() => go(-1)}>
              <PrevIcon />
            </button>
            <div className="slideshow-dots">
              {photos.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  className={"slideshow-dot" + (i === idx ? " is-active" : "")}
                  aria-label={`Show photo ${i + 1} of ${total}`}
                  aria-current={i === idx ? "true" : undefined}
                  onClick={() => navigate(i)}
                />
              ))}
            </div>
            <button type="button" className="slideshow-btn" aria-label="Next photo" onClick={() => go(1)}>
              <NextIcon />
            </button>
            {!reduced && (
              <button
                type="button"
                className="slideshow-btn slideshow-playpause"
                data-testid="slideshow-playpause"
                aria-label={userPaused ? "Play slideshow" : "Pause slideshow"}
                onClick={() => setUserPaused((p) => !p)}
              >
                {userPaused ? <PlayIcon /> : <PauseIcon />}
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}