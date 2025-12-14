'use client';

import Image from 'next/image';
import { useState } from 'react';

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
  fallbackText?: string;
}

export default function ImageWithFallback({
  src,
  alt,
  width,
  height,
  className,
  priority,
  fallbackText = '이미지 로드 실패'
}: ImageWithFallbackProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  if (imageError) {
    return (
      <div className="w-full h-full bg-red-100 border-2 border-red-300 flex items-center justify-center">
        <div className="text-red-600 text-xs font-bold text-center px-2">
          {fallbackText}
        </div>
      </div>
    );
  }

  return (
    <div className="relative" style={{ width, height }}>
      {isLoading && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        priority={priority}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setImageError(true);
        }}
      />
    </div>
  );
}


