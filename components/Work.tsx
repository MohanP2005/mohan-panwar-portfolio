"use client";

import { useState } from "react";
import { projects, type Project } from "@/content/site";
import { linkProps } from "@/lib/links";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function Preview({
  project,
  index,
  className,
}: {
  project: Project;
  index: number;
  className: string;
}) {
  const trimmedUrl = project.url?.trim() ?? "";
  const hasUrl = trimmedUrl.length > 0;

  return (
    <div className={"preview " + className}>
      <div className="preview-top swap" key={index}>
        <span className="label">
          {pad(index + 1)} / {pad(projects.length)} · {project.year}
        </span>
        <span className="preview-name">{project.name}</span>
        <span className="preview-desc">{project.desc}</span>
      </div>
      <div className="preview-bottom">
        <ul className="tags">
          {project.tags.map((t) => (
            <li className="tag" key={t}>
              {t}
            </li>
          ))}
        </ul>
        {hasUrl ? (
          <a
            className="btn btn-accent"
            href={project.url}
            {...linkProps(project.url)}
          >
            Open project ↗
          </a>
        ) : (
          <span className="private-label">
            GOING LIVE SOON
          </span>
        )}
      </div>
    </div>
  );
}

export default function Work() {
  const [sel, setSel] = useState<number>(0);
  return (
    <section id="work" className="section work" aria-label="Selected work">
      <div className="work-list-col">
        <span className="label">(04) SELECTED WORK</span>
        <ul className="work-list">
          {projects.map((p, i) => (
            <li key={p.name}>
              <button
                type="button"
                className="prow"
                aria-pressed={i === sel}
                onMouseEnter={() => setSel(i)}
                onFocus={() => setSel(i)}
                onClick={() => setSel(i)}
              >
                <span className="prow-name">{p.name}</span>
                <span className="prow-num">{pad(i + 1)}</span>
              </button>
              {i === sel && (
                <Preview project={p} index={i} className="preview-inline" />
              )}
            </li>
          ))}
        </ul>
      </div>
      <Preview project={projects[sel]} index={sel} className="preview-side" />
    </section>
  );
}