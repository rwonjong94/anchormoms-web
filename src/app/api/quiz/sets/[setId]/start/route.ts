import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { setId: string } }
) {
  try {
    const authHeader = request.headers.get('Authorization') || '';
    const backendBaseUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    const backendUrl = `${backendBaseUrl}/api/quiz/sets/${params.setId}/start`;

    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      }
    });

    const text = await response.text();
    try {
      const data = JSON.parse(text);
      return NextResponse.json(data, { status: response.status });
    } catch {
      return new NextResponse(text, { status: response.status });
    }
  } catch (error) {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}




