import { NextRequest, NextResponse } from 'next/server';

// POST /api/exams/attempts - 시험 응시 시작
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // 요청 본문 파싱
    const body = await request.json();
    
    // 필수 필드 검증
    if (!body.examId || !body.studentId) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다. (examId, studentId)' },
        { status: 400 }
      );
    }

      examId: body.examId,
      studentId: body.studentId,
    });

    // Backend API로 프록시
    const backendBaseUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const backendUrl = `${backendBaseUrl}/exams/attempts`;
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });


    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend error response:', errorText);
      
      return NextResponse.json(
        { 
          error: '시험 시작에 실패했습니다.',
          details: errorText,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Frontend API error - POST /api/exams/attempts:', error);
    
    return NextResponse.json(
      { 
        error: '서버 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}