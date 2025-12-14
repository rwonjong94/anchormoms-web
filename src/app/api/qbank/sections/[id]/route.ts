import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';

function mintAdminToken(): string {
  const secret = process.env.JWT_SECRET || 'default-secret';
  return jwt.sign(
    { sub: 'admin', role: 'admin', iat: Math.floor(Date.now() / 1000) },
    secret
  );
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = mintAdminToken();
    const { id } = params;
    
    const resp = await fetch(`${backendUrl}/api/admin/sections/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    
    const data = await resp.json().catch(() => ({}));
    return NextResponse.json(data, { status: resp.status });
  } catch (error: any) {
    console.error('소단원 삭제 실패:', error);
    return NextResponse.json({ error: '소단원 삭제 실패' }, { status: 500 });
  }
}


