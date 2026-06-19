/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    // Serve images straight from object storage — the client fetches them
    // directly instead of routing through the Next.js image optimizer.
    unoptimized: true,
  },
};

module.exports = nextConfig;
