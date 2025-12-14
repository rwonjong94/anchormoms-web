import { NextRequest, NextResponse } from 'next/server';

// POST /api/exams/attempts/[attemptId]/submit-all - 시험 완료 시 빈 답안들 처리
export async function POST(
  request: NextRequest,
  { params }: { params: { attemptId: string } }
) {
  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const { attemptId } = params;

    if (!attemptId) {
      return NextResponse.json(
        { error: 'attemptId가 필요합니다.' },
        { status: 400 }
      );
    }

      attemptId,
    });

    // Backend API로 프록시
    const backendBaseUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const backendUrl = `${backendBaseUrl}/api/exams/attempts/${attemptId}/submit-all`;
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    });


    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend error response:', errorText);
      
      return NextResponse.json(
        { 
          error: '시험 제출에 실패했습니다.',
          details: errorText,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Frontend API error - POST /api/exams/attempts/{attemptId}/submit-all:', error);
    
    return NextResponse.json(
      { 
        error: '서버 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}