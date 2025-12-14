'use client';

import React, { useState } from 'react';
import { Question } from '@/types/exam';
import { processImages, getImageHash, parseImageSrc, calculateImageSize } from '@/lib/imageUtils';
import { createMarkdownComponents } from '@/lib/markdownComponents';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';

// 개별 이미지 컴포넌트 - React.memo로 최적화
interface QuestionImageProps {
  imageUrl: string;
  questionNumber: number;
  imageIndex: number;
}

const QuestionImage = React.memo(({ imageUrl, questionNumber, imageIndex }: QuestionImageProps) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // {ratio} 문법 파싱 및 크기 계산
  const { src: cleanSrc, ratio } = parseImageSrc(imageUrl);
  const imageWidth = calculateImageSize(ratio);
  
  if (imageError) {
    return (
      <div className="text-center">
        <span className="inline-block bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-1 text-xs rounded">
          이미지 로드 실패: {cleanSrc}
        </span>
      </div>
    );
  }
  
  return (
    <div className="text-center">
      <img
        src={cleanSrc}
        alt={`문제 ${questionNumber}번 이미지 ${imageIndex}`}
        className="rounded-lg shadow-md h-auto mx-auto block my-4"
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
});

QuestionImage.displayName = 'QuestionImage';

// 문제 내용 컴포넌트 Props
interface QuestionContentProps {
  question: Question;
}

// 문제 내용 컴포넌트 - 이미지와 텍스트 내용만 담당
const QuestionContent = React.memo(({ question }: QuestionContentProps) => {
  // 문제 내용 렌더링 함수
  const renderContent = (content: string) => {
    // 문제 번호와 관련 텍스트 제거 - 매우 구체적인 패턴만 매칭
    let cleanedContent = content
      // 명확한 문제 번호 패턴만 제거 (앞뒤 공백 포함한 정확한 형태만)
      .replace(/^\s*문제\s+\d+\s*번\s*:\s*/i, '')
      .replace(/^\s*문제\s+\d+\s*번\s*\.\s*/i, '')
      .replace(/^\s*\d+\s*번\s*:\s*/i, '')
      .replace(/^\s*\d+\s*번\s*\.\s*/i, '')
      .replace(/^\s*Problem\s+\d+\s*:\s*/i, '')
      // 앞뒤 공백 제거
      .trim();
    
    return (
      <div className="prose prose-lg max-w-none prose-gray dark:prose-invert prose-headings:text-title prose-p:text-body prose-p:leading-relaxed prose-strong:text-title">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex, rehypeRaw]}
          components={createMarkdownComponents({
            questionNumber: question.questionNumber,
            imageErrorPrefix: '문제 이미지 로드 실패',
            blockquoteStyle: 'default'
          })}
        >
          {cleanedContent}
        </ReactMarkdown>
      </div>
    );
  };

  // 조건 렌더링 함수
  const renderCondition = (condition: string) => {
    // 조건 텍스트에서 "조건:", "조건 :", "Condition:", 등 제거
    let cleanedCondition = condition.replace(/^(\s*조건\s*:?\s*|Condition\s*:?\s*)/i, '');
    // 추가로 줄 시작에 오는 조건 관련 텍스트들도 제거
    cleanedCondition = cleanedCondition.replace(/^\s*(조건|Condition)\s*:?\s*/gmi, '');
    
    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mt-4">
        <div className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">조건:</div>
        <div className="prose prose-sm max-w-none text-blue-700 dark:text-blue-300 leading-relaxed">
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex, rehypeRaw]}
            components={createMarkdownComponents({
              questionNumber: question.questionNumber,
              imageErrorPrefix: '조건 이미지 로드 실패',
              blockquoteStyle: 'default'
            })}
          >
            {cleanedCondition}
          </ReactMarkdown>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* 문제 번호 헤더 */}
      <div className="mb-6 pb-4 border-b border-input">
        <h2 className="text-xl font-bold text-title">
          문제 {question.questionNumber}번
        </h2>
      </div>

      {/* 문제 내용 (Content) */}
      <div className="mb-6">
        {renderContent(question.content)}
      </div>

      {/* 문제 이미지들 - content에 이미지 마크다운이 없는 경우에만 표시 */}
      {question.imageUrls && question.imageUrls.length > 0 && !question.content.includes('![') && (
        <div className="mb-6">
          <div className="space-y-4">
            {processImages(question.imageUrls).map((imageUrl, index) => (
              <QuestionImage
                key={`image-${index}-${getImageHash(imageUrl)}`}
                imageUrl={imageUrl}
                questionNumber={question.questionNumber}
                imageIndex={index + 1}
              />
            ))}
          </div>
        </div>
      )}

      {/* 문제 조건 (Condition) */}
      {question.condition && (
        <div className="mb-6">
          {renderCondition(question.condition)}
        </div>
      )}
    </>
  );
});

QuestionContent.displayName = 'QuestionContent';

export default QuestionContent;