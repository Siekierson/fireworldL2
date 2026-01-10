/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      }
    ],
    // Disable image optimization for large local images
    unoptimized: false,
  },
  // Allow serving large static files
  staticPageGenerationTimeout: 60,
};

module.exports = nextConfig;
