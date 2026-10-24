/** @type {import('next').NextConfig} */
// basePath matches the GitHub Pages project URL
const nextConfig = {
  output: 'export',
  // lets e2e run a second dev server beside the normal one (tests only)
  distDir: process.env.NEXT_DIST_DIR || '.next',
  agentRules: false,
  basePath: '/mohan-panwar-portfolio',
  assetPrefix: '/mohan-panwar-portfolio',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

