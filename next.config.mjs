/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  webpack: (config, { dev }) => {
    if (dev) {
      // Avoid flaky filesystem cache pack files on Windows dev sessions.
      config.cache = false;
    }
    return config;
  },
};

export default nextConfig;
