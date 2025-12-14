import React, { useState } from 'react';
import { parseImageSrc, calculateImageSize } from './imageUtils';

/**
 * 공통 마크다운 컴포넌트 설정
 * 칼럼과 문제 디스플레이에서 공통으로 사용할 수 있는 ReactMarkdown 컴포넌트들
 */

export const createMarkdownComponents = (options: {
  questionNumber?: number;
  imageErrorPrefix?: string;
  blockquoteStyle?: 'default' | 'blue' | 'gray';
} = {}) => {
  const {
    questionNumber,
    imageErrorPrefix = '이미지 로드 실패',
    blockquoteStyle = 'default'
  } = options;

  const blockquoteClasses = {
    default: 'border-l-4 border-blue-500 pl-4 py-2 my-4 text-gray-700 dark:text-gray-300 bg-blue-50 dark:bg-blue-900/20 rounded-r-lg not-italic',
    blue: 'border-l-4 border-blue-300 dark:border-blue-600 pl-4 py-2 my-4 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 not-italic',
    gray: 'border-l-4 border-gray-300 dark:border-gray-600 pl-4 py-2 my-4 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 not-italic'
  };

  return {
    // 문단 처리 - 이미지만 있는 경우 div로 처리
    p: ({ node, children, ...props }: any) => {
      // 자식이 이미지만 있는지 확인
      const hasOnlyImage = node?.children?.length === 1 && 
        node.children[0].type === 'element' && 
        node.children[0].tagName === 'img';
      
      if (hasOnlyImage) {
        return <div {...props}>{children}</div>;
      }
      return <p {...props}>{children}</p>;
    },

    // 이미지 스타일링 개선 및 커스텀 리사이징 지원
    img: ({ node, src, alt, ...props }: any) => {
      const [imageError, setImageError] = useState(false);
      const [imageLoaded, setImageLoaded] = useState(false);
      
      // src 파싱 및 크기 계산 (유틸리티 함수 사용)
      const { src: cleanSrc, ratio } = parseImageSrc(src || '');
      const imageWidth = calculateImageSize(ratio);
      
      if (imageError) {
        return (
          <div className="my-6 text-center">
            <span className="inline-block bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-1 text-xs rounded">
              {imageErrorPrefix}: {cleanSrc}
            </span>
          </div>
        );
      }
      
      return (
        <div className="my-6 text-center">
          <img
            {...props}
            src={cleanSrc}
            alt={alt || (questionNumber ? `문제 ${questionNumber}번 이미지` : '이미지')}
            className="rounded-lg shadow-md h-auto mx-auto"
            style={{
              maxWidth: `min(${imageWidth}px, 100%)`,
              width: '100%'
            }}
            loading="lazy"
            onLoad={() => {
              console.log(`이미지 로드 성공: ${cleanSrc} (크기: ${imageWidth}px, 비율: ${ratio}%)`);
              setImageLoaded(true);
              setImageError(false);
            }}
            onError={(e) => {
              console.error(`이미지 로드 실패: ${cleanSrc}`);
              setImageError(true);
              setImageLoaded(false);
            }}
          />
        </div>
      );
    },

    // 코드 블록 스타일링 개선
    code: ({ node, inline, className, children, ...props }: any) => {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : '';
      
      if (inline) {
        return (
          <code
            className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-1 py-0.5 rounded text-sm font-mono"
            {...props}
          >
            {children}
          </code>
        );
      }
      return (
        <div className="my-4">
          {language && (
            <div className="bg-gray-200 dark:bg-gray-700 px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 rounded-t-lg">
              {language}
            </div>
          )}
          <pre className={`${language ? 'rounded-t-none' : ''} bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto`}>
            <code className="text-sm font-mono text-gray-900 dark:text-gray-100" {...props}>
              {children}
            </code>
          </pre>
        </div>
      );
    },

    // 인용구 스타일링
    blockquote: ({ node, ...props }: any) => (
      <blockquote
        className={blockquoteClasses[blockquoteStyle]}
        {...props}
      />
    ),

    // 헤딩 스타일링 개선
    h1: ({ node, ...props }: any) => (
      <h1 className="text-3xl font-bold mt-8 mb-4 text-gray-900 dark:text-gray-100 border-b-2 border-gray-200 dark:border-gray-700 pb-2" {...props} />
    ),
    h2: ({ node, ...props }: any) => (
      <h2 className="text-2xl font-bold mt-6 mb-3 text-gray-900 dark:text-gray-100" {...props} />
    ),
    h3: ({ node, ...props }: any) => (
      <h3 className="text-xl font-semibold mt-5 mb-2 text-gray-900 dark:text-gray-100" {...props} />
    ),
    h4: ({ node, ...props }: any) => (
      <h4 className="text-lg font-semibold mt-4 mb-2 text-gray-900 dark:text-gray-100" {...props} />
    ),
    h5: ({ node, ...props }: any) => (
      <h5 className="text-base font-semibold mt-3 mb-1 text-gray-900 dark:text-gray-100" {...props} />
    ),
    h6: ({ node, ...props }: any) => (
      <h6 className="text-sm font-semibold mt-2 mb-1 text-gray-900 dark:text-gray-100" {...props} />
    ),

    // 리스트 스타일링
    ul: ({ node, ...props }: any) => (
      <ul className="list-disc list-inside my-4 space-y-1" {...props} />
    ),
    ol: ({ node, ...props }: any) => (
      <ol className="list-decimal list-inside my-4 space-y-1" {...props} />
    ),
    li: ({ node, ...props }: any) => (
      <li className="text-gray-700 dark:text-gray-300 leading-relaxed" {...props} />
    ),

    // 테이블 스타일링
    table: ({ node, ...props }: any) => (
      <div className="overflow-x-auto my-6">
        <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-600 rounded-lg" {...props} />
      </div>
    ),
    th: ({ node, ...props }: any) => (
      <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-semibold text-left" {...props} />
    ),
    td: ({ node, ...props }: any) => (
      <td className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2" {...props} />
    ),

    // 링크 스타일링
    a: ({ node, href, ...props }: any) => (
      <a
        href={href}
        className="text-blue-600 hover:text-blue-800 underline"
        target={href?.startsWith('http') ? '_blank' : undefined}
        rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
        {...props}
      />
    ),

    // 구분선 스타일링
    hr: ({ node, ...props }: any) => (
      <hr className="my-8 border-t-2 border-gray-200 dark:border-gray-700" {...props} />
    ),

    // 강조 스타일링
    strong: ({ node, ...props }: any) => (
      <strong className="font-bold text-gray-900 dark:text-gray-100" {...props} />
    ),
    em: ({ node, ...props }: any) => (
      <em className="italic text-gray-800 dark:text-gray-200" {...props} />
    ),
  };
};