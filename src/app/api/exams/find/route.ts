import { NextRequest, NextResponse } from 'next/server';

// GET /api/exams/find - examType과 examNum으로 시험 찾기
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // URL 검색 매개변수 가져오기
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const examnum = searchParams.get('examnum');

    if (!type || !examnum) {
      return NextResponse.json(
        { error: 'type과 examnum이 필요합니다.' },
        { status: 400 }
      );
    }

    console.log('Frontend API: GET /api/exams/find', {
      type,
      examnum,
    });

    // Backend API로 프록시 - 환경변수에서 Backend URL 가져오기
    const backendBaseUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const backendUrl = `${backendBaseUrl}/api/exams/find?type=${type}&examnum=${examnum}`;
    console.log('Backend URL:', backendUrl);
    console.log('Backend base URL:', backendBaseUrl);
    console.log('Auth header exists:', !!authHeader);
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    });

    console.log('Backend response status:', response.status);
    console.log('Backend response headers:', [...response.headers.entries()]);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend error response:', errorText);
      console.error('Backend response status:', response.status, response.statusText);
      
      return NextResponse.json(
        { 
          error: '시험 조회에 실패했습니다.',
          details: errorText,
          backendUrl,
          requestType: type,
          requestExamnum: examnum,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('Backend 응답 성공:');
    console.log('- 시험 ID:', data.id);
    console.log('- 문제 데이터 포함 여부:', !!data.Question);
    console.log('- 문제 개수:', data.Question ? data.Question.length : 0);
    console.log('- 전체 데이터 키:', Object.keys(data));

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Frontend API error - GET /api/exams/find:', error);
    
    return NextResponse.json(
      { 
        error: '서버 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}