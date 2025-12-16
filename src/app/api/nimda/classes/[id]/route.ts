import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://backend:3001';

// 반 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;

    const response = await fetch(`${BACKEND_URL}/api/classes/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      try {
        const json = text ? JSON.parse(text) : { error: '백엔드 오류' };
        return NextResponse.json(json, { status: response.status });
      } catch {
        return NextResponse.json({ error: '백엔드 오류', raw: text }, { status: response.status });
      }
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[nimda/classes/[id]][GET] proxy error:', error);
    return NextResponse.json(
      { error: '반 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 반 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
    const body = await request.json();

    const response = await fetch(`${BACKEND_URL}/api/classes/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: '반 수정 실패' }));
      return NextResponse.json(
        { error: errorData.message || '반 수정에 실패했습니다.' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[nimda/classes/[id]][PUT] proxy error:', error);
    return NextResponse.json(
      { error: '반 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 반 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;

    const response = await fetch(`${BACKEND_URL}/api/classes/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: '반 삭제 실패' }));
      return NextResponse.json(
        { error: errorData.message || '반 삭제에 실패했습니다.' },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[nimda/classes/[id]][DELETE] proxy error:', error);
    return NextResponse.json(
      { error: '반 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
