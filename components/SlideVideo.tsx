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

export default function SlideVideo(props: {
  src: string;
  poster?: string;
  alt: string;
  active: boolean;
  className: string;
}) {
  const { src, poster, alt, active, className } = props;
  const videoRef = useRef<HTMLVideoElement>(null);
  const reduced = useSyncExternalStore(
    subscribeReducedPreference,
    getReducedPreferenceSnapshot,
    getReducedPreferenceServerSnapshot
  );

  // Ensure the video element is muted (React may not set it reliably)
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = true;
    }
  }, []);

  // Play/pause logic based on active state and reduced-motion preference
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (active && !reduced) {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {});
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
  }, [active, reduced]);

  return (
    <video
      ref={videoRef}
      className={className}
      src={src}
      poster={poster}
      muted
      loop
      playsInline
      preload="metadata"
      aria-label={alt}
      aria-hidden={active ? undefined : true}
      tabIndex={-1}
      disablePictureInPicture
      draggable={false}
    />
  );
}