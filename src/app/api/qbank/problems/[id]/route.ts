// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';

function mintAdminToken(): string {
  const secret = process.env.JWT_SECRET || 'dev-jwt-secret-key-for-development-only';
  return jwt.sign(
    {
      sub: 'admin',
      username: 'qbank',
      role: 'admin',
      exp: Math.floor(Date.now() / 1000) + 60 * 15,
    },
    secret
  );
}

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = mintAdminToken();
    const { id } = await params;
    const resp = await fetch(`${backendUrl}/api/admin/problems/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await resp.json().catch(() => ({}));
    return NextResponse.json(data, { status: resp.status });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || '상세 조회 실패' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = mintAdminToken();
    const body = await request.json();
    const { id } = await params;
    const resp = await fetch(`${backendUrl}/api/admin/problems/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    const data = await resp.json().catch(() => ({}));
    return NextResponse.json(data, { status: resp.status });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || '수정 실패' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = mintAdminToken();
    const { id } = await params;
    const resp = await fetch(`${backendUrl}/api/admin/problems/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await resp.json().catch(() => ({}));
    return NextResponse.json(data, { status: resp.status });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || '삭제 실패' }, { status: 500 });
  }
}



