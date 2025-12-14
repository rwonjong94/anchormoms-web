import { NextRequest, NextResponse } from 'next/server';

// Backend API로 이미지 업로드 요청을 전달하는 프록시

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    
    // FormData를 그대로 백엔드로 전달
    const formData = await request.formData();
    
    const response = await fetch(`${process.env.BACKEND_URL}/api/nimda/images/upload`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader || '',
        // Content-Type은 자동으로 설정됨 (multipart/form-data with boundary)
      },
      body: formData,
    });

    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Backend API 호출 오류:', error);
    return NextResponse.json(
      { error: 'Backend API 호출 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}