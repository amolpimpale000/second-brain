/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      { source: "/businesses", destination: "/", permanent: true },
      { source: "/analytics", destination: "/", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        // Keep HTML pages fresh so Hostinger CDN doesn't serve stale builds after deploy.
        source: "/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate, s-maxage=60",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
