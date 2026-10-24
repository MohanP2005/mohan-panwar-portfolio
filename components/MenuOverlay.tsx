"use client";

import { useEffect, useRef } from "react";
import { RESUME_PATH, site } from "@/content/site";
import { linkProps } from "@/lib/links";

type Props = {
  onClose: () => void;
};

type Item = {
  text: string;
  href: string;
  number: string;
  newTab?: boolean;
};

const items: Item[] = [
  { text: "About", href: "#about", number: "01" },
  { text: "Work", href: "#work", number: "02" },
  { text: "Writing", href: "#writing", number: "03" },
  { text: "Contact", href: "#contact", number: "04" },
  { text: "Resume ↗", href: RESUME_PATH, number: "05", newTab: true },
];

export default function MenuOverlay({ onClose }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);

  // Keep the latest onClose in the ref
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Focus management & body overflow
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    closeRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  // Global keydown handler (Escape + focus trap)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCloseRef.current();
        return;
      }

      if (e.key !== "Tab") return;

      const root = rootRef.current;
      if (!root) return;

      const focusable = Array.from(
        root.querySelectorAll<HTMLElement>("a[href], button")
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (e.shiftKey) {
        if (active === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div
      className="overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      ref={rootRef}
    >
      <div className="overlay-bar">
        <span className="logo">MP®</span>
        <button
          type="button"
          className="menu-pill"
          onClick={onClose}
          ref={closeRef}
        >
          Close
        </button>
      </div>

      <nav className="overlay-nav" aria-label="Menu">
        {items.map(({ text, href, number, newTab }) => (
          <a
            key={href}
            href={href}
            onClick={onClose}
            {...(newTab
              ? { target: "_blank", rel: "noopener noreferrer" }
              : linkProps(href))}
          >
            <span>{text}</span>
            <span className="label">{number}</span>
          </a>
        ))}
      </nav>

      <p className="overlay-foot label">{site.email}</p>
    </div>
  );
}
