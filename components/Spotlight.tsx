"use client";

import { useEffect, useRef } from "react";

export default function Spotlight() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");

    const apply = (x: number, y: number) => {
      root.style.setProperty("--mx", `${x}px`);
      root.style.setProperty("--my", `${y}px`);
    };

    let rafId: number | null = null;
    let latestX = 0;
    let latestY = 0;

    let pointerMoveHandler: ((e: PointerEvent) => void) | null = null;
    let resizeHandler: (() => void) | null = null;

    const startFine = () => {
      pointerMoveHandler = (e: PointerEvent) => {
        if (e.pointerType === "touch") return;
        latestX = e.pageX;
        latestY = e.pageY;
        if (rafId === null) {
          rafId = requestAnimationFrame(() => {
            rafId = null;
            apply(latestX, latestY);
          });
        }
      };
      window.addEventListener("pointermove", pointerMoveHandler, {
        passive: true,
      });
    };

    const startTouch = () => {
      const setInitial = () => {
        apply(window.innerWidth / 2, window.innerHeight * 0.4);
      };
      setInitial();
      resizeHandler = () => setInitial();
      window.addEventListener("resize", resizeHandler);
    };

    const teardownListeners = () => {
      if (pointerMoveHandler) {
        window.removeEventListener("pointermove", pointerMoveHandler);
        pointerMoveHandler = null;
      }
      if (resizeHandler) {
        window.removeEventListener("resize", resizeHandler);
        resizeHandler = null;
      }
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    };

    const setup = () => {
      if (mq.matches) {
        startFine();
      } else {
        startTouch();
      }
    };

    const mqChangeHandler = (event: MediaQueryListEvent) => {
      teardownListeners();
      if (event.matches) {
        startFine();
      } else {
        startTouch();
      }
    };

    // Initial setup
    setup();

    // Listen for media‑query changes
    mq.addEventListener("change", mqChangeHandler);

    // Cleanup on unmount
    return () => {
      teardownListeners();
      mq.removeEventListener("change", mqChangeHandler);
    };
  }, []);

  return (
    <div className="spot" aria-hidden="true" ref={rootRef}>
      <div className="spot-dots" />
      <div className="spot-glow" />
      <div className="spot-dots-hi" />
    </div>
  );
}
