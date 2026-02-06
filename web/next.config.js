/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ['192.168.1.198', '192.168.1.222', 'localhost'],
  images: {
    disableStaticImages: false,
    unoptimized: true,
  },
};

module.exports = nextConfig;
