import Link from "next/link";
import ViewCount from "@/components/ViewCount";
import { FIRST_POST_DATE } from "@/content/site";
import type { Post } from "@/lib/posts";

export function FeaturedPost({ post }: { post: Post }) {
  return (
    <Link className="feat" href={"/blog/" + post.slug + "/"}>
      <div
        className="feat-cover"
        style={post.cover ? { backgroundImage: "url(" + post.cover + ")" } : undefined}
      >
        <span className="pill-latest">LATEST</span>
      </div>
      <div className="feat-body">
        <span className="feat-meta">
          {post.date} · {post.readTime}
          <ViewCount slug={post.slug} />
        </span>
        <span className="feat-titlerow">
          <span className="feat-title">{post.title}</span>
          <span className="go" aria-hidden="true">
            ↗
          </span>
        </span>
        <span className="feat-excerpt">{post.excerpt}</span>
      </div>
    </Link>
  );
}

export function ArchiveList({ posts }: { posts: Post[] }) {
  return (
    <ul className="archive">
      {posts.map((p) => (
        <li key={p.slug}>
          <Link className="arow" href={"/blog/" + p.slug + "/"}>
            <span className="arow-date">
              {p.date}
              <ViewCount slug={p.slug} />
            </span>
            <span className="arow-title">{p.title}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function EmptyFeature() {
  return (
    <div className="feat feat-empty">
      <div className="feat-cover">
        <span className="pill-latest">SOON</span>
      </div>
      <div className="feat-body">
        <span className="feat-meta">NO POSTS YET</span>
        <span className="feat-titlerow">
          <span className="feat-title">First post coming {FIRST_POST_DATE}</span>
        </span>
        <span className="feat-excerpt">
          I’m writing up how this site got built, and what I’d tell anyone making their first
          portfolio. Check back soon.
        </span>
      </div>
    </div>
  );
}