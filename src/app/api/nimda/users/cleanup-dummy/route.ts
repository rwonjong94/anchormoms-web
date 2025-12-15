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
    if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET not set');
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;
    if (decoded.sub !== 'admin') {
      return null;
    }
    return decoded;
  } catch (error) {
    return null;
  }
}

// 고아 더미 보호자 정리
export async function DELETE(request: NextRequest) {
  const admin = await verifyAdminAuth(request);
  if (!admin) {
    return NextResponse.json(
      { error: '관리자 권한이 필요합니다.' },
      { status: 403 }
    );
  }

  try {
    // 백엔드 API 호출
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const response = await fetch(`${backendUrl}/api/admin/users/cleanup-dummy`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${request.headers.get('Authorization')?.substring(7)}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || '더미 보호자 정리에 실패했습니다.' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('더미 보호자 정리 오류:', error);
    return NextResponse.json(
      { error: '더미 보호자 정리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}