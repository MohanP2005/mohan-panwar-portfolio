"use client";

import { useEffect, useRef, useState } from "react";
import { site, reasons } from "@/content/site";
import { buildMailto } from "@/lib/mail";
import { linkProps } from "@/lib/links";

export default function Contact() {
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState(0);
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    return () => {
      clearTimeout(timer.current);
    };
  }, []);

  const reason = reasons[topic];

  async function copy(): Promise<void> {
    let ok = false;
    try {
      await navigator.clipboard.writeText(site.email);
      ok = true;
    } catch {
      const ta = document.createElement("textarea");
      ta.value = site.email;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      ok = document.execCommand("copy");
      document.body.removeChild(ta);
    }
    if (ok) {
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1600);
    }
  }

  const links = [site.linkedin, site.github, site.twitter].filter((l) => l.href.trim() !== "");

  return (
    <section id="contact" className="section contact" aria-label="Contact">
      <div className="contact-intro">
        <span className="label">(07) CONTACT</span>
        <h2 className="contact-h2">{site.contactHeadline}</h2>
        <p className="contact-copy">{site.contactCopy}</p>
      </div>
      <div className="contact-rows">
        <div className="contact-item">
          <button
            type="button"
            className="lrow"
            aria-expanded={open}
            aria-controls="email-drawer"
            onClick={() => setOpen((o) => !o)}
          >
            <span className="fill" aria-hidden="true" />
            <span className="in">
              <span className="lrow-label">Email</span>
              <span className="lrow-handle">{open ? "CLOSE" : "PICK A REASON"}</span>
              <span className="plus" aria-hidden="true">
                +
              </span>
            </span>
          </button>
          <div
            id="email-drawer"
            className="drawer"
            data-open={open ? "true" : "false"}
            inert={!open}
          >
            <div className="drawer-clip">
              <div className="drawer-inner">
                <span className="label">WHAT BRINGS YOU HERE?</span>
                <div className="chips" role="group" aria-label="Reason for contact">
                  {reasons.map((r, i) => (
                    <button
                      type="button"
                      key={r.label}
                      className="chip"
                      aria-pressed={i === topic}
                      onClick={() => setTopic(i)}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
                <div className="draft swap" key={reason.label}>
                  <div className="draft-row">
                    <span className="draft-key">To</span>
                    <span className="draft-val">{site.email}</span>
                  </div>
                  <div className="draft-row">
                    <span className="draft-key">Subject</span>
                    <span className="draft-val draft-subject">{reason.subject}</span>
                  </div>
                  <p className="draft-body">{reason.body}</p>
                  <div className="draft-actions">
                    <a
                      className="btn btn-accent"
                      href={buildMailto(site.email, reason.subject, reason.body)}
                    >
                      Open in my mail app →
                    </a>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => {
                        void copy();
                      }}
                    >
                      {copied ? "Copied ✓" : "Copy email"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {links.map((l) => (
          <div className="contact-item" key={l.label}>
            <a className="lrow" href={l.href} {...linkProps(l.href)}>
              <span className="fill" aria-hidden="true" />
              <span className="in">
                <span className="lrow-label">{l.label}</span>
                <span className="lrow-handle">{l.handle}</span>
                <span className="arr" aria-hidden="true">
                  ↗
                </span>
              </span>
            </a>
          </div>
        ))}
      </div>
      <span className="sr-only" role="status" aria-live="polite">
        {copied ? "Email copied to clipboard" : ""}
      </span>
    </section>
  );
}
