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

export async function GET(request: NextRequest) {
  try {
    const token = mintAdminToken();
    const url = new URL(request.url);
    const book = url.searchParams.get('book');
    
    if (!book) {
      return NextResponse.json({ error: '문제집명이 필요합니다.' }, { status: 400 });
    }

    const resp = await fetch(`${backendUrl}/api/admin/chapters?book=${encodeURIComponent(book)}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    
    const data = await resp.json().catch(() => ({}));
    return NextResponse.json(data, { status: resp.status });
  } catch (error: any) {
    console.error('단원 목록 조회 실패:', error);
    return NextResponse.json({ error: '단원 목록 조회 실패' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = mintAdminToken();
    const body = await request.json().catch(() => ({}));
    
    const resp = await fetch(`${backendUrl}/api/admin/chapters`, {
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
    console.error('대단원 생성 실패:', error);
    return NextResponse.json({ error: '대단원 생성 실패' }, { status: 500 });
  }
}


