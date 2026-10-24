import { posts, POSTS_ARE_EXAMPLES } from "@/content/posts";
import { BLOG_URL } from "@/content/site";
import { linkProps } from "@/lib/links";

export default function Writing() {
  const [latest, ...rest] = posts;

  if (!latest) {
    return null;
  }

  return (
    <section id="writing" className="section writing" aria-label="Writing">
      <div className="writing-head">
        <span className="label">{POSTS_ARE_EXAMPLES ? "(06) WRITING · EXAMPLE POSTS" : "(06) WRITING"}</span>
        <a className="all-posts" href={BLOG_URL} {...linkProps(BLOG_URL)}>All posts →</a>
      </div>
      <div className="writing-grid">
        <a className="feat" href={latest.url} {...linkProps(latest.url)}>
          <div className="feat-cover" style={latest.cover ? { backgroundImage: `url(${latest.cover})` } : undefined}>
            <span className="pill-latest">LATEST</span>
          </div>
          <div className="feat-body">
            <span className="feat-meta">{latest.date} · {latest.readTime}</span>
            <span className="feat-titlerow"><span className="feat-title">{latest.title}</span><span className="go" aria-hidden="true">↗</span></span>
            <span className="feat-excerpt">{latest.excerpt}</span>
          </div>
        </a>
        <div>
          <span className="archive-head" style={{ display: "block" }}>ARCHIVE</span>
          <ul className="archive">
            {rest.map(p => <li key={p.title}><a className="arow" href={p.url} {...linkProps(p.url)}><span className="arow-date">{p.date}</span><span className="arow-title">{p.title}</span></a></li>)}
          </ul>
        </div>
      </div>
    </section>
  );
}
