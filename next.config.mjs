/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // pdf-parse (via pdf-parse/worker) pulls in @napi-rs/canvas, which ships
  // native .node binaries webpack can't parse. Keep these as real Node
  // require()s at runtime instead of bundling them.
  serverExternalPackages: ["pdf-parse", "@napi-rs/canvas"],
  async redirects() {
    return [
      { source: "/businesses", destination: "/", permanent: true },
      { source: "/analytics", destination: "/", permanent: true },
    ];
  },
  // HTML cache-control is handled by src/middleware.ts so static assets
  // under /_next/ keep Next.js' immutable long-term caching.
};

export default nextConfig;
