/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'hackmd.io',
        pathname: '/_uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'tmdpc.vn',
        pathname: '/media/**',
      },
    ],
  },
};

export default nextConfig;
