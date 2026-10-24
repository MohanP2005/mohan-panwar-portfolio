import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Spotlight from "@/components/Spotlight";
import BlogTopbar from "@/components/BlogTopbar";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import ViewCount from "@/components/ViewCount";
import LikeButton from "@/components/LikeButton";
import Comments from "@/components/Comments";
import { getAllPosts, getPost } from "@/lib/posts";

const PLACEHOLDER_SLUG = "_none";

export const dynamicParams = false;

export function generateStaticParams() {
  const posts = getAllPosts();
  if (posts.length === 0) {
    return [{ slug: PLACEHOLDER_SLUG }];
  }
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) {
    return { robots: { index: false } };
  }
  return {
    title: `${post.title} · Mohan Panwar`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
    },
  };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);

  if (!post) {
    if (slug === PLACEHOLDER_SLUG) {
      return (
        <div className="page">
          <Spotlight />
          <div className="content">
            <main>
              <div className="blog-top">
                <BlogTopbar />
              </div>
              <section className="section blog-index" aria-label="No posts">
                <span className="label">(01) WRITING</span>
                <h1 className="blog-h1">
                  Nothing here yet
                  <span style={{ color: "var(--accent)" }}>.</span>
                </h1>
              </section>
              <Contact />
            </main>
            <Footer />
          </div>
        </div>
      );
    }
    notFound();
  }

  return (
    <div className="page">
      <Spotlight />
      <div className="content">
        <main>
          <div className="blog-top">
            <BlogTopbar />
          </div>
          <article className="post">
            <header className="post-head">
              <p className="label post-meta">
                {post.date} · {post.readTime}
                <ViewCount slug={post.slug} record />
              </p>
              <h1 className="post-title">{post.title}</h1>
              {post.cover ? (
                <div
                  className="post-cover"
                  role="img"
                  aria-label={post.title}
                  style={{ backgroundImage: "url(" + post.cover + ")" }}
                />
              ) : null}
            </header>
            <div
              className="post-body"
              dangerouslySetInnerHTML={{ __html: post.html }}
            />
            <div className="post-actions">
              <LikeButton slug={post.slug} />
            </div>
            <Comments slug={post.slug} />
          </article>
          <Contact />
        </main>
        <Footer />
      </div>
    </div>
  );
}