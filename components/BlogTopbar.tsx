import React from "react";
import Link from "next/link";

interface BlogTopbarProps {
  backHref?: string;
  backLabel?: string;
}

const BlogTopbar = ({
  backHref = "/blog/",
  backLabel = "← All writing",
}: BlogTopbarProps) => (
  <div className="topbar blog-topbar">
    <Link className="logo" href="/" aria-label="Mohan Panwar, home">
      MP®
    </Link>
    <Link className="back-link" href={backHref}>
      {backLabel}
    </Link>
  </div>
);

export default BlogTopbar;