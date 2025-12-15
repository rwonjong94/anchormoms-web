import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';

function mintAdminToken(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET 환경변수가 설정되지 않았습니다.');
  }
  return jwt.sign(
    { sub: 'admin', role: 'admin', iat: Math.floor(Date.now() / 1000) },
    secret
  );
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = mintAdminToken();
    const { id } = params;
    
    const resp = await fetch(`${backendUrl}/api/admin/chapters/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    
    const data = await resp.json().catch(() => ({}));
    return NextResponse.json(data, { status: resp.status });
  } catch (error: any) {
    console.error('대단원 삭제 실패:', error);
    return NextResponse.json({ error: '대단원 삭제 실패' }, { status: 500 });
  }
}


