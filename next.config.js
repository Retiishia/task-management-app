/** @type {import('next').NextConfig} */
const nextConfig = {
  // Output standalone build for Docker container efficiency
  output: 'standalone',
  reactStrictMode: true,
};

module.exports = nextConfig;
