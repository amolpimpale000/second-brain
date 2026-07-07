/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
