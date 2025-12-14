import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const BACKEND_URL = process.env.BACKEND_URL || 'http://backend:3001';

async function verifyAdminAuth(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as any;
    if (decoded.role !== 'admin') return null;
    return decoded;
  } catch {
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await verifyAdminAuth(request);
  if (!admin) return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });

  const { id } = await params;
  const resp = await fetch(`${BACKEND_URL}/api/admin/students/${id}/schedule`, {
    headers: { 'Authorization': `Bearer ${request.headers.get('Authorization')?.substring(7)}` },
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) return NextResponse.json(data || { error: '조회 실패' }, { status: resp.status });
  return NextResponse.json(data);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await verifyAdminAuth(request);
  if (!admin) return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });

  const { id } = await params;
  const body = await request.text(); // pass-through JSON text
  const resp = await fetch(`${BACKEND_URL}/api/admin/students/${id}/schedule`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${request.headers.get('Authorization')?.substring(7)}`,
    },
    body,
  });
  const text = await resp.text();
  try {
    const data = text ? JSON.parse(text) : null;
    return NextResponse.json(data, { status: resp.status });
  } catch {
    return new NextResponse(text, { status: resp.status });
  }
}








