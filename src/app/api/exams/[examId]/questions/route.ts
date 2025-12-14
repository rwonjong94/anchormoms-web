import { NextRequest, NextResponse } from 'next/server';

// GET /api/exams/[examId]/questions - 특정 시험의 문제 데이터 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { examId: string } }
) {
  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const { examId } = params;

    if (!examId) {
      return NextResponse.json(
        { error: 'examId가 필요합니다.' },
        { status: 400 }
      );
    }

      examId,
    });

    // Backend API로 프록시
    const backendBaseUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const backendUrl = `${backendBaseUrl}/api/exams/${examId}/questions`;
    const response = await fetch(backendUrl, {
      method: 'GET',
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
          error: '시험 문제 조회에 실패했습니다.',
          details: errorText,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Frontend API error - GET /api/exams/{examId}/questions:', error);
    
    return NextResponse.json(
      { 
        error: '서버 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}