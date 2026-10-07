/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  experimental: { serverActions: { bodySizeLimit: '6mb' } },
  webpack(config, { isServer }) {
    // node:sqlite is a scheme-only builtin, keep it out of the bundle
    if (isServer) config.externals.push(({ request }, cb) => (request === 'node:sqlite' ? cb(null, 'commonjs node:sqlite') : cb()));
    return config;
  },
  async headers() {
    return [{ source: '/:path*', headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' }
    ] }];
  }
};
export default nextConfig;
