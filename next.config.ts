import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  agentRules: false,
  trailingSlash: true,
  devIndicators: false,
};

export default nextConfig;
