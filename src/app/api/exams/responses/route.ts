import { NextRequest, NextResponse } from 'next/server';

// PUT /api/exams/responses - 학생 답안 업데이트 (실시간 저장)
export async function PUT(request: NextRequest) {
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
    if (!body.attemptId || !body.questionId) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다. (attemptId, questionId)' },
        { status: 400 }
      );
    }

    console.log('Frontend API: PUT /api/exams/responses', {
      attemptId: body.attemptId,
      questionId: body.questionId,
      answer: body.answer ? `"${body.answer}"` : 'null',
    });

    // Backend API로 프록시
    const backendBaseUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const backendUrl = `${backendBaseUrl}/api/exams/responses`;
    const response = await fetch(backendUrl, {
      method: 'PUT',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    console.log('Backend response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend error response:', errorText);
      
      return NextResponse.json(
        { 
          error: '답안 저장에 실패했습니다.',
          details: errorText,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('답안 저장 성공:', data.id);

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Frontend API error - PUT /api/exams/responses:', error);
    
    return NextResponse.json(
      { 
        error: '서버 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST /api/exams/responses - 답안 제출 (최종 제출용)
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
    if (!body.attemptId || !body.questionId || !body.answer) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다. (attemptId, questionId, answer)' },
        { status: 400 }
      );
    }

    console.log('Frontend API: POST /api/exams/responses', {
      attemptId: body.attemptId,
      questionId: body.questionId,
      answer: body.answer,
    });

    // Backend API로 프록시
    const backendBaseUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const backendUrl = `${backendBaseUrl}/api/exams/responses`;
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    console.log('Backend response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend error response:', errorText);
      
      return NextResponse.json(
        { 
          error: '답안 제출에 실패했습니다.',
          details: errorText,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('답안 제출 성공:', data.id);

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Frontend API error - POST /api/exams/responses:', error);
    
    return NextResponse.json(
      { 
        error: '서버 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}