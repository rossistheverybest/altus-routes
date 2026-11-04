/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [{ source: "/", destination: "/routes", permanent: false }, { source: "/map-preview", destination: "/routes", permanent: false }];
  },
};
export default nextConfig;
