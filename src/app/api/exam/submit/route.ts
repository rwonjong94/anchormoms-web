import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { examType, examNum, answers, submittedAt, isAutoSubmit } = data;

    // 임시 구현 - 실제로는 데이터베이스에 저장
    // 간단한 점수 계산 (임시)
    const totalQuestions = 40;
    const answeredQuestions = answers?.filter((a: any) => a.answer?.trim()).length || 0;
    const score = Math.round((answeredQuestions / totalQuestions) * 100);

    return NextResponse.json({
      success: true,
      result: {
        examType,
        examNum,
        totalQuestions,
        answeredQuestions,
        score,
        submittedAt,
        isAutoSubmit,
        message: `시험이 성공적으로 ${isAutoSubmit ? '자동' : ''} 제출되었습니다.`,
      }
    });
  } catch (error) {
    console.error('Error submitting exam:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit exam' },
      { status: 500 }
    );
  }
} 