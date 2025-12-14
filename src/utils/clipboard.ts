/**
 * Clipboard 유틸리티 함수
 * HTTP 환경에서도 작동하는 텍스트 복사 기능 제공
 */

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    // 최신 브라우저의 Clipboard API 사용 (HTTPS 환경에서만 작동)
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    
    // Fallback: 구형 브라우저나 HTTP 환경에서 사용
    return fallbackCopyTextToClipboard(text);
  } catch (error) {
    console.error('Clipboard API 복사 실패:', error);
    // Clipboard API 실패 시 fallback 사용
    return fallbackCopyTextToClipboard(text);
  }
};

/**
 * Fallback 복사 방법 (HTTP 환경에서 작동)
 */
const fallbackCopyTextToClipboard = (text: string): boolean => {
  try {
    // 임시 textarea 엘리먼트 생성
    const textArea = document.createElement('textarea');
    textArea.value = text;
    
    // 화면에 보이지 않게 설정
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.width = '2em';
    textArea.style.height = '2em';
    textArea.style.padding = '0';
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
    textArea.style.background = 'transparent';
    textArea.style.opacity = '0';
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    // 복사 실행
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    
    return successful;
  } catch (error) {
    console.error('Fallback 복사 실패:', error);
    return false;
  }
};


/**
 * 복사 기능만 수행 (알림 없음)
 */
export const copyWithoutNotification = async (text: string): Promise<boolean> => {
  return await copyToClipboard(text);
};