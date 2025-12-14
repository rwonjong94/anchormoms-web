import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

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

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const admin = await verifyAdminAuth(request);
  if (!admin) return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });
  const { id } = await params;
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
  const resp = await fetch(`${backendUrl}/api/admin/students/${id}/counselings`, {
    headers: { 'Authorization': `Bearer ${request.headers.get('Authorization')?.substring(7)}` },
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) return NextResponse.json(data || { error: '조회 실패' }, { status: resp.status });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const admin = await verifyAdminAuth(request);
  if (!admin) return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });
  const { id } = await params;
  const body = await request.json();
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
  const resp = await fetch(`${backendUrl}/api/admin/students/${id}/counselings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${request.headers.get('Authorization')?.substring(7)}`,
    },
    body: JSON.stringify(body),
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) return NextResponse.json(data || { error: '저장 실패' }, { status: resp.status });
  return NextResponse.json(data);
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const admin = await verifyAdminAuth(request);
  if (!admin) return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });
  const { id } = await params;
  const body = await request.json();
  const { counselingId, ...updateData } = body;

  const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
  const resp = await fetch(`${backendUrl}/api/admin/students/${id}/counselings/${counselingId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${request.headers.get('Authorization')?.substring(7)}`,
    },
    body: JSON.stringify(updateData),
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) return NextResponse.json(data || { error: '수정 실패' }, { status: resp.status });
  return NextResponse.json(data);
}








