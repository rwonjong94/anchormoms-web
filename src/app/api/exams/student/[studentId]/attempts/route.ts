import { NextRequest, NextResponse } from 'next/server';

// GET /api/exams/student/[studentId]/attempts - 학생의 시험 응시 기록 조회
export function GET(
  request: NextRequest,
  { params }: { params: { studentId: string } }
) {
  return (async () => {
    try {
      const { studentId } = params;
      const authHeader = request.headers.get('Authorization');

      if (authHeader == null) {
        return NextResponse.json(
          { err: '인증이 필요합니다.' },
          { status: 403 }
        );
      }

      const base = (
        process.env.BACKEND_URL ||
        process.env.NEXT_PUBLIC_API_URL ||
        (process.env.NODE_ENV === 'production' ? 'http://backend:3001' : 'http://localhost:3001')
      ).replace(/\/$/, '');
      // 1차 시도: {BACKEND_URL}/exams/...
      let response = await fetch(`${base}/exams/attempts/student/${studentId}`, {
        method: 'GET',
        headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
        },
      });
      // 2차 폄백: {BACKEND_URL}/api/exams/...
      if (response.status === 404) {
        response = await fetch(`${base}/api/exams/attempts/student/${studentId}`, {
          method: 'GET',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
          },
        });
      }

      if (!response.ok) {
        // 백엔드 오류는 빈 배열로 흡수하여 200 응답 (콘솔 404/401 노이즈 방지)
        return NextResponse.json([], { status: 200 });
      }
      const data = await response.json().catch(() => []);
      return NextResponse.json(data, { status: 200 });
    } catch (error) {
      console.error('학생 시험 기록 조회 API 오류:', error);
      // 실패 시에도 빈 배열 반환
      return NextResponse.json([], { status: 200 });
    }
  })();
}
