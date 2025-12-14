import { NextRequest, NextResponse } from 'next/server';

// GET /api/exams/attempts/student/[studentId] - 특정 학생의 시험 응시 기록 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { studentId: string } }
) {
  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const { studentId } = params;

    if (!studentId) {
      return NextResponse.json(
        { error: 'studentId가 필요합니다.' },
        { status: 400 }
      );
    }

      studentId,
    });

    // Backend API로 프록시
    const backendBaseUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const backendUrl = `${backendBaseUrl}/api/exams/attempts/student/${studentId}`;
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
          error: '학생 시험 응시 기록 조회에 실패했습니다.',
          details: errorText,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Frontend API error - GET /api/exams/attempts/student/{studentId}:', error);
    
    return NextResponse.json(
      { 
        error: '서버 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}