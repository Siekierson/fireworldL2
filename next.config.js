/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    turbo: {
      enabled: false
    }
  },
  srcDir: 'src',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      }
    ],
  },
  env: {
    NEWS_API_KEY: process.env.NEWS_API_KEY,
  },
};

module.exports = nextConfig;
