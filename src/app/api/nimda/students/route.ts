import { NextRequest, NextResponse } from 'next/server';

// 백엔드 URL (컨테이너 환경 기본값)
const BACKEND_URL = process.env.BACKEND_URL || 'http://backend:3001';

// 학생 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const grade = searchParams.get('grade') || '';
    const userId = searchParams.get('userId') || '';

    // 백엔드 API 호출
    const backendUrl = BACKEND_URL;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
      ...(grade && { grade }),
      ...(userId && { userId }),
    });

    const targetUrl = `${backendUrl}/api/admin/students?${queryParams}`;
    const response = await fetch(targetUrl, {
      headers: {
        'Authorization': `Bearer ${request.headers.get('Authorization')?.substring(7)}`,
      },
    });

    if (!response.ok) {
      // 백엔드 응답을 그대로 전달하여 원인 파악 용이
      const text = await response.text().catch(() => '');
      try {
        const json = text ? JSON.parse(text) : { error: '백엔드 오류' };
        return NextResponse.json(json, { status: response.status });
      } catch {
        return NextResponse.json({ error: '백엔드 오류', raw: text }, { status: response.status });
      }
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[nimda/students][GET] proxy error:', error);
    return NextResponse.json(
      { error: '학생 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 학생 추가
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, grade, school, phone, userEmail, userName, userPhone } = body;

    if (!name || !grade) {
      return NextResponse.json(
        { error: '학생명과 학년은 필수입니다.' },
        { status: 400 }
      );
    }

    // 학교명은 전달된 그대로 사용 (초/중/고 접미사 미부착)
    const finalSchool = school || '';

    // 백엔드 API 호출
    const backendUrl = BACKEND_URL;
    const response = await fetch(`${backendUrl}/api/admin/students`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${request.headers.get('Authorization')?.substring(7)}`,
      },
      body: JSON.stringify({
        name,
        grade,
        school: finalSchool,
        phone: phone || null,
        userEmail,
        userName,
        userPhone: userPhone || null,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.message || '학생 추가에 실패했습니다.' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('학생 추가 오류:', error);
    return NextResponse.json(
      { error: '학생 추가 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
