"use client";

import { useState, useRef } from "react";
import MenuOverlay from "./MenuOverlay";
import { site } from "@/content/site";

export default function Hero() {
  const [open, setOpen] = useState(false);
  const menuBtnRef = useRef<HTMLButtonElement>(null);

  const close = () => {
    setOpen(false);
    menuBtnRef.current?.focus();
  };

  return (
    <section className="hero" id="top">
      <div className="topbar">
        <span className="logo">MP®</span>
        <div className="topbar-right">
          <span className="status">
            <span className="pulse" aria-hidden="true">
              <span className="ping" />
              <span />
            </span>
            <span className="status-text">{site.statusLine}</span>
          </span>
          <button
            type="button"
            className="menu-pill"
            ref={menuBtnRef}
            aria-expanded={open}
            aria-haspopup="dialog"
            onClick={() => setOpen(true)}
          >
            Menu
          </button>
        </div>
      </div>

      <div className="hero-main">
        <h1 className="hero-name">
          <span className="line">
            <span>Mohan</span>
          </span>
          <span className="line l2">
            <span>
              Panwar<span style={{ color: "var(--accent)" }}>.</span>
            </span>
          </span>
        </h1>

        <ul className="facts">
          {site.facts.map((fact, i) => {
            const extraClass =
              i === 1 ? " fade2" : i === 2 ? " fade3" : "";
            return (
              <li key={i} className={`fact fade${extraClass}`}>
                <span className="label">{fact.label}</span>
                <span className="fact-value">{fact.value}</span>
              </li>
            );
          })}
          <li className="fact-scroll fade fade3">
            <a href="#work">Scroll to work ↓</a>
          </li>
        </ul>
      </div>

      {open && <MenuOverlay onClose={close} />}
    </section>
  );
}
