/** @type {import('next').NextConfig} */
// basePath matches the GitHub Pages project URL
const nextConfig = {
  output: 'export',
  agentRules: false,
  basePath: '/mohan-panwar-portfolio',
  assetPrefix: '/mohan-panwar-portfolio',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

