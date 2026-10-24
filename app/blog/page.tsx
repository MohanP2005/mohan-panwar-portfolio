import type { Metadata } from "next";
import Spotlight from "@/components/Spotlight";
import BlogTopbar from "@/components/BlogTopbar";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import { FeaturedPost, ArchiveList, EmptyFeature } from "@/components/PostParts";
import { getAllPosts } from "@/lib/posts";

export const metadata: Metadata = {
  title: "Writing · Mohan Panwar",
  description: "Notes on building Tablebid, trading systems, game bots and this site.",
  alternates: {
    types: {
      "application/rss+xml": "/mohan-panwar-portfolio/blog/rss.xml",
    },
  },
};

const BlogIndex = () => {
  const [latest, ...rest] = getAllPosts();

  return (
    <div className="page">
      <Spotlight />
      <div className="content">
        <main>
          <div className="blog-top">
            <BlogTopbar backHref="/" backLabel="← Home" />
          </div>
          <section className="section blog-index" aria-label="All posts">
            <span className="label">(01) WRITING</span>
            <h1 className="blog-h1">
              Writing<span style={{ color: "var(--accent)" }}>.</span>
            </h1>
            {latest ? (
              <div className="writing-grid">
                <FeaturedPost post={latest} />
                <div>
                  <span className="archive-head" style={{ display: "block" }}>
                    ALL POSTS
                  </span>
                  {rest.length > 0 ? (
                    <ArchiveList posts={rest} />
                  ) : (
                    <p className="archive-empty">More soon.</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="writing-empty">
                <EmptyFeature />
              </div>
            )}
            <a className="rss-link" href="/mohan-panwar-portfolio/blog/rss.xml">
              RSS feed ↗
            </a>
          </section>
          <Contact />
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default BlogIndex;