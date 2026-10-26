"use client";

import React, { useEffect, useRef, useSyncExternalStore } from "react";

function getReducedPreferenceSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getReducedPreferenceServerSnapshot(): boolean {
  return false;
}

function subscribeReducedPreference(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", callback);
  return () => {
    mq.removeEventListener("change", callback);
  };
}

/**
 * Hook that returns the user's reduced‑motion preference.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedPreference,
    getReducedPreferenceSnapshot,
    getReducedPreferenceServerSnapshot
  );
}

export default function SlideVideo(props: {
  src: string;
  poster?: string;
  alt: string;
  active: boolean;
  className: string;
  loop?: boolean;
  onEnded?: () => void;
  onUnplayable?: () => void;
}) {
  const {
    src,
    poster,
    alt,
    active,
    className,
    loop = true,
    onEnded,
    onUnplayable,
  } = props;

  const videoRef = useRef<HTMLVideoElement>(null);
  const reduced = useReducedMotion();

  // Keep latest callbacks in refs so they don't affect effect dependencies
  const onUnplayableRef = useRef<(() => void) | undefined>(undefined);
  useEffect(() => {
    onUnplayableRef.current = onUnplayable;
  }, [onUnplayable]);

  // Ensure the video element is muted (React may not set it reliably)
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = true;
    }
  }, []);

  // Play/pause logic based on active state and reduced‑motion preference
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let cancelled = false;

    if (active && !reduced) {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          if (!cancelled && onUnplayableRef.current) {
            onUnplayableRef.current();
          }
        });
      }
    } else {
      video.pause();
      if (!active) {
        try {
          video.currentTime = 0;
        } catch {
          // ignore errors (e.g., if the video is not ready)
        }
      }
    }

    return () => {
      cancelled = true;
    };
  }, [active, reduced]);

  // Handle video loading errors
  const handleError = () => {
    if (!reduced && onUnplayableRef.current) {
      onUnplayableRef.current();
    }
  };

  return (
    <video
      ref={videoRef}
      className={className}
      src={src}
      poster={poster}
      muted
      loop={loop}
      playsInline
      preload="metadata"
      aria-label={alt}
      aria-hidden={active ? undefined : true}
      tabIndex={-1}
      disablePictureInPicture
      draggable={false}
      onEnded={onEnded}
      onError={handleError}
    />
  );
}
