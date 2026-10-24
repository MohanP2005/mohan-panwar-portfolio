"use client";

import React from "react";
import { about, aboutPhotos } from "@/content/site";
import { parsePhotos } from "@/lib/slideshow";
import AboutSlideshow from "@/components/AboutSlideshow";

// NEXT_PUBLIC_ABOUT_PHOTOS_E2E is a test-only override (unset in production builds).
const photos = parsePhotos(process.env.NEXT_PUBLIC_ABOUT_PHOTOS_E2E) ?? aboutPhotos;

export default function About() {
  return (
    <section id="about" className="section about" aria-label="About">
      <div className="about-intro">
        <span className="label">(04) ABOUT</span>
        <h2 className="about-h2">Hi, I’m Mohan.</h2>
        <AboutSlideshow photos={photos} />
      </div>
      <div className="about-body">
        {about.map((paragraph, pIdx) => (
          <p key={pIdx}>
            {paragraph.map((part, partIdx) => {
              if (typeof part === "string") {
                return (
                  <React.Fragment key={`${pIdx}-${partIdx}`}>
                    {part}
                  </React.Fragment>
                );
              }

              return (
                <React.Fragment key={`${pIdx}-${partIdx}`}>
                  <a
                    className="about-link"
                    href="#work"
                    onClick={() =>
                      window.dispatchEvent(
                        new CustomEvent("select-project", {
                          detail: part.project,
                        })
                      )
                    }
                  >
                    <strong>{part.text}</strong>
                  </a>
                </React.Fragment>
              );
            })}
          </p>
        ))}
      </div>
    </section>
  );
}