import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(request: NextRequest) {
  try {
    // 인증 헤더 전달
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: '인증 토큰이 필요합니다.' }, { status: 401 });
    }

    // URL에서 path 파라미터 추출
    const { searchParams } = new URL(request.url);
    const imagePath = searchParams.get('path');

    if (!imagePath) {
      return NextResponse.json({ error: '이미지 경로가 필요합니다.' }, { status: 400 });
    }

    // 경로에 따라 적절한 Backend API 엔드포인트 선택
    let backendUrl;
    if (imagePath.startsWith('images/exams/') || imagePath.startsWith('/images/exams/')) {
      // 시험 이미지 삭제
      backendUrl = `${process.env.BACKEND_URL}/api/nimda/exams/images/delete?path=${encodeURIComponent(imagePath)}`;
    } else if (imagePath.startsWith('images/columns/') || imagePath.startsWith('/images/columns/')) {
      // 칼럼 이미지 삭제
      backendUrl = `${process.env.BACKEND_URL}/api/nimda/columns/images/delete?path=${encodeURIComponent(imagePath)}`;
    } else {
      return NextResponse.json({ error: '지원되지 않는 이미지 경로입니다.' }, { status: 400 });
    }
    
    const response = await fetch(backendUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });

  } catch (error) {
    console.error('Backend API 호출 중 오류가 발생했습니다:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Backend API 호출 중 오류가 발생했습니다.' 
      },
      { status: 500 }
    );
  }
}