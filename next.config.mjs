/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    qualities: [25, 50, 75, 100], // Add the quality values your images use, including 100
  },
  experimental: {
    workerThreads: false,
    cpus: 1,
  },
};

export default nextConfig;
