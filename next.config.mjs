/** @type {import('next').NextConfig} */
export default {
  output: 'export',
  poweredByHeader: false,
  devIndicators: false,
  images: { unoptimized: true },
  turbopack: { root: process.cwd() },
};
