import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] 🔍 Frontend API Download Route Called`);
  console.log(`[${timestamp}] 📥 Purchase ID: ${params.id}`);
  console.log(`[${timestamp}] 📍 Request URL: ${request.url}`);

  try {
    const authHeader = request.headers.get('Authorization');
    const { searchParams } = new URL(request.url);
    const fileType = searchParams.get('type') || 'exam';
    
    console.log(`[${timestamp}] 🔑 Auth Header: ${authHeader ? 'Present' : 'Missing'}`);
    console.log(`[${timestamp}] 📎 File Type: ${fileType}`);
    
    if (!authHeader) {
      console.log(`[${timestamp}] ❌ No auth header - returning 401`);
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // Backend API로 프록시
    const backendBaseUrl = process.env.BACKEND_URL || 'http://backend:3001';
    const backendUrl = `${backendBaseUrl}/purchase/${params.id}/download?type=${fileType}`;
    
    console.log(`[${timestamp}] 🎯 Backend Base URL: ${backendBaseUrl}`);
    console.log(`[${timestamp}] 🎯 Full Backend URL: ${backendUrl}`);
    console.log(`[${timestamp}] 📞 Making request to backend...`);

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
      },
    });

    console.log(`[${timestamp}] 📤 Backend Response Status: ${response.status}`);
    console.log(`[${timestamp}] 📤 Backend Response OK: ${response.ok}`);
    console.log(`[${timestamp}] 📤 Backend Response Headers:`, Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      console.log(`[${timestamp}] ❌ Backend returned error status: ${response.status}`);
      try {
        const errorData = await response.json();
        console.log(`[${timestamp}] ❌ Backend Error Data:`, errorData);
        return NextResponse.json(errorData, { status: response.status });
      } catch (parseError) {
        console.log(`[${timestamp}] ❌ Could not parse backend error response:`, parseError);
        const errorText = await response.text();
        console.log(`[${timestamp}] ❌ Backend Error Text:`, errorText);
        return NextResponse.json(
          { error: `Backend error: ${response.status} - ${errorText}` },
          { status: response.status }
        );
      }
    }

    console.log(`[${timestamp}] ✅ Backend request successful, processing file stream...`);

    // 파일 스트림을 그대로 전달
    const fileBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('Content-Type') || 'application/pdf';
    const contentDisposition = response.headers.get('Content-Disposition') || '';

    console.log(`[${timestamp}] 📄 File Buffer Size: ${fileBuffer.byteLength} bytes`);
    console.log(`[${timestamp}] 📄 Content Type: ${contentType}`);
    console.log(`[${timestamp}] 📄 Content Disposition: ${contentDisposition}`);
    console.log(`[${timestamp}] ✅ Returning file to client`);

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