import { NextRequest, NextResponse } from 'next/server';

// POST /api/exams/attempts/[attemptId]/submit-beacon - Beacon API 전용 빠른 시험 제출
export async function POST(
  request: NextRequest,
  { params }: { params: { attemptId: string } }
) {
  try {
    const { attemptId } = params;

    if (!attemptId) {
      return NextResponse.json(
        { error: 'attemptId가 필요합니다.' },
        { status: 400 }
      );
    }

    console.log('Beacon API: POST /api/exams/attempts/{attemptId}/submit-beacon', {
      attemptId,
      timestamp: new Date().toISOString(),
    });

    // FormData 처리 (Beacon API는 FormData 전송)
    const formData = await request.formData();
    const submittedAttemptId = formData.get('attemptId') as string;
    
    // attemptId 검증
    if (submittedAttemptId !== attemptId) {
      console.error('Beacon API: attemptId 불일치', { expected: attemptId, received: submittedAttemptId });
      return NextResponse.json(
        { error: 'attemptId가 일치하지 않습니다.' },
        { status: 400 }
      );
    }

    // Backend API로 프록시 (가장 빠른 처리를 위해 단순화)
    const backendBaseUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const backendUrl = `${backendBaseUrl}/api/exams/attempts/${attemptId}/submit-all`;
    
    // Beacon API는 인증 헤더 전송이 어려우므로 attemptId만으로 처리
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        isBeaconSubmit: true, // Backend에서 Beacon 제출임을 인지할 수 있도록
        timestamp: new Date().toISOString(),
      }),
    });

    console.log('Backend response status (Beacon):', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend error response (Beacon):', errorText);
      
      // Beacon API는 빠른 응답이 중요하므로 에러여도 200으로 응답
      return NextResponse.json(
        { 
          status: 'processed',
          error: errorText,
          attemptId,
        },
        { status: 200 } // 항상 200으로 응답하여 브라우저가 성공으로 인식
      );
    }

    const data = await response.json();
    console.log('Beacon 시험 제출 성공:', attemptId);

    return NextResponse.json(
      { 
        status: 'success',
        attemptId,
        submittedAt: new Date().toISOString(),
      }, 
      { status: 200 }
    );
  } catch (error) {
    console.error('Beacon API error - POST /api/exams/attempts/{attemptId}/submit-beacon:', error);
    
    // Beacon API는 실패해도 200으로 응답 (브라우저 종료 방해 방지)
    return NextResponse.json(
      { 
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        attemptId: params.attemptId,
        timestamp: new Date().toISOString(),
      },
      { status: 200 } // 항상 200으로 응답
    );
  }
}