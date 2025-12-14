import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const timestamp = new Date().toISOString();

  try {
    const authHeader = request.headers.get('Authorization');
    const { searchParams } = new URL(request.url);
    const fileType = searchParams.get('type') || 'exam';
    
    
    if (!authHeader) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // Backend API로 프록시
    const backendBaseUrl = process.env.BACKEND_URL || 'http://backend:3001';
    const backendUrl = `${backendBaseUrl}/purchase/${params.id}/download?type=${fileType}`;
    

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
      },
    });


    if (!response.ok) {
      try {
        const errorData = await response.json();
        return NextResponse.json(errorData, { status: response.status });
      } catch (parseError) {
        const errorText = await response.text();
        return NextResponse.json(
          { error: `Backend error: ${response.status} - ${errorText}` },
          { status: response.status }
        );
      }
    }


    // 파일 스트림을 그대로 전달
    const fileBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('Content-Type') || 'application/pdf';
    const contentDisposition = response.headers.get('Content-Disposition') || '';


    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': contentDisposition,
      },
    });
  } catch (error) {
    console.error(`[${timestamp}] 💥 File download API 오류:`, error);
    console.error(`[${timestamp}] 💥 Error Stack:`, error.stack);
    return NextResponse.json(
      { error: '파일 다운로드 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}