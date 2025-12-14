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

export async function POST(request: NextRequest) {
  try {
    const token = mintAdminToken();
    const body = await request.json().catch(() => ({}));
    
    const resp = await fetch(`${backendUrl}/api/admin/sections`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body),
    });
    
    const data = await resp.json().catch(() => ({}));
    return NextResponse.json(data, { status: resp.status });
  } catch (error: any) {
    console.error('소단원 생성 실패:', error);
    return NextResponse.json({ error: '소단원 생성 실패' }, { status: 500 });
  }
}


