import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Strict Mode 비활성화 (개발 환경에서 useEffect 중복 실행 방지)
  reactStrictMode: false,
  
  // Standalone 빌드 활성화 (Docker용)
  output: 'standalone',
  
  // ESLint 비활성화 (빌드 시 린터 에러 무시)
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // TypeScript 에러 무시 (빌드 시)
  typescript: {
    ignoreBuildErrors: true,
  },
  
  experimental: {
    optimizePackageImports: ['@next/font'],
  },
  
  compiler: {
    removeConsole: false, // 개발 환경에서도 콘솔 로그 유지
  },
  
  // 이미지 최적화 설정
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
