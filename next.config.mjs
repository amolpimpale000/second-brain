/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      { source: "/businesses", destination: "/", permanent: true },
      { source: "/analytics", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
