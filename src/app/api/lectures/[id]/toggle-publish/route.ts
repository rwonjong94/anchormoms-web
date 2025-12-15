import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

// 관리자 토큰 검증 함수
function verifyAdminToken(authHeader: string | null) {
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  try {
    const token = authHeader.substring(7);
    if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET not set');
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;
    return decoded.role === 'admin' ? decoded : null;
  } catch (error) {
    return null;
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    const admin = verifyAdminToken(authHeader);
    
    if (!admin) {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 401 });
    }

    const response = await fetch(`${BACKEND_URL}/lectures/${params.id}/toggle-publish`, {
      method: 'PUT',
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error toggling publish status:', error);
    return NextResponse.json({ error: 'Failed to toggle publish status' }, { status: 500 });
  }
}