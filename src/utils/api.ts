/**
 * API URL 유틸리티
 * EC2 환경에서 동적으로 올바른 API URL을 반환
 */

export const getApiUrl = (): string => {
  // 환경변수가 설정되어 있으면 우선 사용
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  if (typeof window !== 'undefined') {
    // 브라우저 환경에서는 현재 호스트 사용
    const currentHost = window.location.origin;
    return currentHost;
  } else {
    // 서버 환경 (fallback)
    return 'http://localhost:3001';
  }
};

export const getImageBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    // 브라우저 환경에서는 현재 호스트 사용
    const currentHost = window.location.origin;
    // localhost가 포함된 환경변수는 무시하고 현재 호스트 사용
    if (process.env.NEXT_PUBLIC_IMAGE_BASE_URL && !process.env.NEXT_PUBLIC_IMAGE_BASE_URL.includes('localhost')) {
      return process.env.NEXT_PUBLIC_IMAGE_BASE_URL;
    } else {
      return currentHost;
    }
  } else {
    // 서버 환경 (fallback)
    return process.env.NEXT_PUBLIC_IMAGE_BASE_URL || 'http://localhost';
  }
};