import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://backend:3001';

export async function POST(request: NextRequest) {
  
  try {
    // Authorization 헤더 가져오기
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
      console.error('❌ [FRONTEND-API] 인증 헤더 누락');
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // FormData를 그대로 backend로 전달
    const formData = await request.formData();
    
    const formEntries = Array.from(formData.entries()).map(([key, value]) => ({
      key,
      type: typeof value === 'string' ? 'string' : 'file',
      size: typeof value === 'string' ? value.length : (value as File).size,
      name: typeof value === 'string' ? undefined : (value as File).name
    }));
    

    // Backend API 호출
    const backendUrl = `${BACKEND_URL}/api/nimda/exams/bulk-upload`;
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
      },
      body: formData,
    });

      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    let data;
    const responseText = await response.text();
    
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('💥 [FRONTEND-API] Backend 응답 파싱 실패:', parseError);
      data = { message: responseText };
    }

    if (!response.ok) {
      console.error('❌ [FRONTEND-API] Backend API 호출 실패');
      console.error('❌ [FRONTEND-API] 에러 상세:', data);
      return NextResponse.json(
        { error: data.message || 'Backend API 호출 실패' },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('💥 [FRONTEND-API] bulk-upload 처리 중 오류:', error);
    console.error('💥 [FRONTEND-API] 오류 상세:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    return NextResponse.json(
      { error: '일괄 업로드 API 호출 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}