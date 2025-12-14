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
    if (decoded.role !== 'admin') {
      return null;
    }
    return decoded;
  } catch (error) {
    return null;
  }
}

// 사용자 목록 조회
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';

    // 백엔드 API 호출
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
    });

    const response = await fetch(`${backendUrl}/api/admin/users?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${request.headers.get('Authorization')?.substring(7)}`,
      },
    });

    if (!response.ok) {
      throw new Error('백엔드 API 호출 실패');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('사용자 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '사용자 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
