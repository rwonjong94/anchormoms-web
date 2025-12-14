import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get('Authorization');
    const { id } = await params;
    const resp = await fetch(`${process.env.BACKEND_URL}/classes/${id}`, {
      headers: {
        'Authorization': authHeader || '',
        'Content-Type': 'application/json',
      },
    });
    const data = await resp.json().catch(() => ({}));
    return NextResponse.json(data, { status: resp.status });
  } catch (error) {
    console.error('Classes ID GET proxy error:', error);
    return NextResponse.json({ error: 'Backend API 호출 중 오류' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get('Authorization');
    const { id } = await params;
    const body = await request.json();
    const resp = await fetch(`${process.env.BACKEND_URL}/classes/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': authHeader || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const data = await resp.json().catch(() => ({}));
    return NextResponse.json(data, { status: resp.status });
  } catch (error) {
    console.error('Classes ID PUT proxy error:', error);
    return NextResponse.json({ error: 'Backend API 호출 중 오류' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get('Authorization');
    const { id } = await params;
    const resp = await fetch(`${process.env.BACKEND_URL}/classes/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': authHeader || '',
        'Content-Type': 'application/json',
      },
    });
    if (resp.status === 204) return new NextResponse(null, { status: 204 });
    const data = await resp.json().catch(() => ({}));
    return NextResponse.json(data, { status: resp.status });
  } catch (error) {
    console.error('Classes ID DELETE proxy error:', error);
    return NextResponse.json({ error: 'Backend API 호출 중 오류' }, { status: 500 });
  }
}
