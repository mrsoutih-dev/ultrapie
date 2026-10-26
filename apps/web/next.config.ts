import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@ultrapie/shared', '@ultrapie/ai-core', '@ultrapie/ai-gemini'],
};

export default nextConfig;
