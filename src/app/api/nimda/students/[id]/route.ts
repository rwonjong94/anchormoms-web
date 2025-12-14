import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = await params;
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
  const resp = await fetch(`${backendUrl}/api/admin/students/${id}`, {
    headers: {
      'Authorization': `Bearer ${request.headers.get('Authorization')?.substring(7)}`,
    },
  });
  const data = await resp.json().catch(() => ({}));
  return NextResponse.json(data, { status: resp.status });
}

// 관리자 권한 확인 함수
async function verifyAdminAuth(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as any;
    if (decoded.role !== 'admin') {
      return null;
    }
    return decoded;
  } catch (error) {
    return null;
  }
}

// 학생 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await verifyAdminAuth(request);
  if (!admin) {
    return NextResponse.json(
      { error: '관리자 권한이 필요합니다.' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { name, grade, school, phone, userEmail, userName, userPhone, unlinkParent } = body;

    if (!name || !grade) {
      return NextResponse.json(
        { error: '학생명과 학년은 필수입니다.' },
        { status: 400 }
      );
    }

    // 학교명은 전달된 그대로 사용
    const finalSchool = school || '';

    // 백엔드 API 호출
    const { id } = await params;
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const response = await fetch(`${backendUrl}/api/admin/students/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${request.headers.get('Authorization')?.substring(7)}`,
      },
      body: JSON.stringify({
        ...(name !== undefined ? { name } : {}),
        ...(grade !== undefined ? { grade } : {}),
        ...(school !== undefined ? { school: finalSchool } : {}),
        ...(phone !== undefined ? { phone: phone || null } : {}),
        ...(userEmail !== undefined ? { userEmail } : {}),
        ...(userName !== undefined ? { userName } : {}),
        ...(userPhone !== undefined ? { userPhone: userPhone || null } : {}),
        ...(unlinkParent === true ? { unlinkParent: true } : {}),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.message || '학생 수정에 실패했습니다.' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('학생 수정 오류:', error);
    return NextResponse.json(
      { error: '학생 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 학생 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await verifyAdminAuth(request);
  if (!admin) {
    return NextResponse.json(
      { error: '관리자 권한이 필요합니다.' },
      { status: 403 }
    );
  }

  try {
    // 백엔드 API 호출
    const { id } = await params;
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const response = await fetch(`${backendUrl}/api/admin/students/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${request.headers.get('Authorization')?.substring(7)}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.message || '학생 삭제에 실패했습니다.' },
        { status: response.status }
      );
    }

    return NextResponse.json({ message: '학생이 성공적으로 삭제되었습니다.' });
  } catch (error) {
    console.error('학생 삭제 오류:', error);
    return NextResponse.json(
      { error: '학생 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
