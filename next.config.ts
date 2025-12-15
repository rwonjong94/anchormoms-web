import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Strict Mode 비활성화 (개발 환경에서 useEffect 중복 실행 방지)
  reactStrictMode: false,

  // 보안 헤더 설정
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://apis.google.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https: http:",
              "connect-src 'self' https://accounts.google.com https://apis.google.com https://*.googleapis.com",
              "frame-src 'self' https://accounts.google.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; ')
          }
        ]
      }
    ];
  },
  
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
