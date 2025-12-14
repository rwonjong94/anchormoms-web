/**
 * 이미지 처리 유틸리티 함수들
 */

/**
 * 이미지 고유 식별자 추출 함수
 * 파일명에서 고유 식별자를 추출하여 중복 제거에 사용
 * @param imageUrl 이미지 URL
 * @returns 고유 식별자 또는 원본 URL
 */
export const getImageHash = (imageUrl: string): string => {
  // 새로운 구조: {문제번호}_{이미지순서번호}.{ext} (예: 1_1.png, 1_2.png)
  const newFormatMatch = imageUrl.match(/.*\/(\d+)_(\d+)\.[^.]+$/);
  if (newFormatMatch) {
    // 문제번호와 이미지순서번호를 조합하여 고유 식별자 생성
    return `${newFormatMatch[1]}_${newFormatMatch[2]}`;
  }
  
  // 기존 구조: {QuestionNumber}_{hash}.jpg (하위 호환성)
  const oldFormatMatch = imageUrl.match(/.*\/(\d+)_([a-f0-9]+)\.[^.]+$/);
  if (oldFormatMatch) {
    return oldFormatMatch[2]; // 해시 값 반환
  }
  
  // 매칭되지 않는 경우 전체 URL을 고유 식별자로 사용
  return imageUrl;
};

/**
 * 이미지 중복 제거 함수
 * Hash 값을 기준으로 중복된 이미지를 제거
 * @param imageUrls 이미지 URL 배열
 * @returns 중복이 제거된 이미지 URL 배열
 */
export const removeDuplicateImages = (imageUrls: string[]): string[] => {
  if (!imageUrls || imageUrls.length === 0) {
    return [];
  }

  const uniqueImages = new Map<string, string>();
  
  imageUrls.forEach(url => {
    const hash = getImageHash(url);
    if (!uniqueImages.has(hash)) {
      uniqueImages.set(hash, url);
    }
  });
  
  return Array.from(uniqueImages.values());
};

/**
 * 이미지 배열을 필터링하여 유효한 이미지만 반환
 * @param imageUrls 이미지 URL 배열
 * @returns 유효한 이미지 URL 배열
 */
export const filterValidImages = (imageUrls?: string[]): string[] => {
  if (!imageUrls) return [];
  
  return imageUrls.filter(url => 
    url && 
    url.trim() !== '' && 
    url !== 'undefined' && 
    url !== 'null'
  );
};

/**
 * 이미지 처리 통합 함수
 * 유효성 검사 + 중복 제거를 한 번에 처리
 * @param imageUrls 이미지 URL 배열
 * @returns 처리된 이미지 URL 배열
 */
export const processImages = (imageUrls?: string[]): string[] => {
  const validImages = filterValidImages(imageUrls);
  return removeDuplicateImages(validImages);
};

/**
 * 이미지 src에서 {ratio} 문법을 파싱하는 함수
 * URL 인코딩된 중괄호도 처리 가능 (예: "image.png%7B30%7D")
 * @param srcString 이미지 src 문자열 (예: "image.png{30}" 또는 "image.png%7B30%7D")
 * @returns 파싱된 src와 ratio 객체
 */
export const parseImageSrc = (srcString: string): { src: string; ratio: number } => {
  // URL 디코딩 시도 (안전하게 처리)
  let decodedSrc = srcString;
  try {
    decodedSrc = decodeURIComponent(srcString);
  } catch (e) {
    // 디코딩 실패 시 원본 사용
    console.warn('URL 디코딩 실패, 원본 사용:', srcString);
  }
  
  // 디코딩된 문자열에서 {ratio} 패턴 찾기
  const match = decodedSrc.match(/^(.+?)\{(\d+)\}$/);
  if (match) {
    const [, cleanSrc, ratioStr] = match;
    const ratio = parseInt(ratioStr, 10);
    console.log(`이미지 비율 파싱 성공: ${srcString} → src: ${cleanSrc}, ratio: ${ratio}%`);
    return { src: cleanSrc, ratio: ratio };
  }
  
  // 매칭 실패 시 로그
  if (srcString !== decodedSrc) {
    console.warn(`이미지 비율 파싱 실패: 원본="${srcString}", 디코딩="${decodedSrc}"`);
  }
  
  return { src: srcString, ratio: 50 }; // 기본값 50%
};

/**
 * 이미지 크기를 계산하는 함수
 * @param ratio 비율 (10-100)
 * @param baseWidth 기준 너비 (기본값: 832px - 본문 영역 너비)
 * @returns 계산된 픽셀 크기
 */
export const calculateImageSize = (ratio: number, baseWidth: number = 832): number => {
  const validRatio = Math.max(10, Math.min(100, ratio)); // 10-100% 범위로 제한
  const calculatedWidth = (baseWidth * validRatio) / 100;
  return Math.round(calculatedWidth); // 소수점 제거
};