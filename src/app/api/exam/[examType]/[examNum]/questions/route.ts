import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { examType: string; examNum: string } }
) {
  try {
    const { examType, examNum } = params;

    // 실제 존재하는 이미지 파일들 (public/assets/full-03/figures/)
    const availableImages = [
      'problem01.png', 'problem02.png', 'problem03.png', 'problem04.png', 
      'problem06.png', 'problem07.png', 'problem11.png', 'problem12.png',
      'problem14.png', 'problem16.png', 'problem17.png', 'problem21.png',
      'problem22.png', 'problem33.png', 'problem39.png', 'problem40.png'
    ];

    console.log(`API 호출: examType=${examType}, examNum=${examNum}`);

    // 임시 목 데이터 (실제로는 데이터베이스에서 조회)
    const questions = Array.from({ length: 40 }, (_, i) => {
      const questionNum = i + 1;
      const paddedNum = questionNum.toString().padStart(2, '0');
      const imageName = `problem${paddedNum}.png`;
      const imageNameNoPad = `problem${questionNum}.png`;
      
      // 패딩이 있는 형태 또는 패딩이 없는 형태 중 하나라도 있으면 사용
      const hasImage = availableImages.includes(imageName) || availableImages.includes(imageNameNoPad);
      const finalImageName = availableImages.includes(imageName) ? imageName : imageNameNoPad;
      
              const result = {
          id: questionNum,
          questionNumber: questionNum,
          content: `문제 ${questionNum}번: 다음 식을 계산하시오. $2x + 3 = 7$일 때, $x$의 값을 구하시오.`,
          condition: questionNum % 3 === 0 ? `조건: 소수점 둘째 자리까지 계산하시오.` : undefined,
          imageUrl: hasImage 
            ? `/assets/full-03/figures/${finalImageName}`
            : undefined,
          examType,
          examNum,
        };
        
        if (questionNum <= 5) {
          console.log(`문제 ${questionNum}: imageName=${imageName}, hasImage=${hasImage}, finalImageName=${finalImageName}, imageUrl=${result.imageUrl}`);
        }
        
        return result;
    });

    const response = NextResponse.json({
      success: true,
      questions,
      examInfo: {
        examType,
        examNum,
        totalQuestions: questions.length,
        duration: 90, // minutes
      }
    });

    // 캐시 방지 헤더 추가
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch questions' },
      { status: 500 }
    );
  }
} 