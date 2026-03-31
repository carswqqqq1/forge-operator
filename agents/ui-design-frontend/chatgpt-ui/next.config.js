/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    // During development, type checking errors won't fail the build
    ignoreBuildErrors: false,
  },
};

module.exports = nextConfig;
