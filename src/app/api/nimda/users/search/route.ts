import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// 관리자 권한 확인 함수
async function verifyAdminAuth(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as any;
    if (decoded.sub !== 'admin') {
      return null;
    }
    return decoded;
  } catch (error) {
    return null;
  }
}

// 부모 검색
export async function GET(request: NextRequest) {
  const admin = await verifyAdminAuth(request);
  if (!admin) {
    return NextResponse.json(
      { error: '관리자 권한이 필요합니다.' },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';

    if (!query.trim()) {
      return NextResponse.json([]);
    }

    // 백엔드 API 호출
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const response = await fetch(`${backendUrl}/api/admin/users/search?query=${encodeURIComponent(query)}`, {
      headers: {
        'Authorization': `Bearer ${request.headers.get('Authorization')?.substring(7)}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || '부모 검색에 실패했습니다.' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('부모 검색 오류:', error);
    return NextResponse.json(
      { error: '부모 검색 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}