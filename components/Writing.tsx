import Link from "next/link";
import { getAllPosts } from "@/lib/posts";
import { FeaturedPost, ArchiveList, EmptyFeature } from "@/components/PostParts";

export default function Writing() {
  const posts = getAllPosts();
  const [latest, ...rest] = posts;
  const archive = rest.slice(0, 4);

  return (
    <section id="writing" className="section writing" aria-label="Writing">
      <div className="writing-head">
        <span className="label">(06) WRITING</span>
        <Link className="all-posts" href="/blog/">
          All posts →
        </Link>
      </div>
      {latest ? (
        <div className="writing-grid">
          <FeaturedPost post={latest} />
          <div>
            <span className="archive-head" style={{ display: "block" }}>
              ARCHIVE
            </span>
            <ArchiveList posts={archive} />
          </div>
        </div>
      ) : (
        <div className="writing-empty">
          <EmptyFeature />
        </div>
      )}
    </section>
  );
}