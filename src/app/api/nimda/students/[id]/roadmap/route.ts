import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://backend:3001';

type Extras = {
  thinkingTypes?: Array<{ yearOffset: number; groupIndex: number; type: 'WMO' | 'GT' | 'GTA' }>;
  thinkingLevels?: Array<{ yearOffset: number; groupIndex: number; level: number }>;
  subjectGroups?: Array<{ yearOffset: number; groupIndex: number; value: string }>;
  gifted?: any;
  contests?: any;
};

function buildBlocks(base: any, extras: Extras, years: number) {
  const monthsOrder = [12,1,2,3,4,5,6,7,8,9,10,11];
  const blocks: any[] = [];
  const startAcademicYear = Number(base?.startAcademicYear ?? new Date().getFullYear());
  const startGrade = Number(base?.startGrade ?? 3);
  for (let y = 0; y < years; y++) {
    const months = monthsOrder.map((m, i) => {
      const groupIndex = Math.floor(i / 3);
      const key = { yearOffset: y, groupIndex };
      const subject = extras?.subjectGroups?.find((s) => s.yearOffset === key.yearOffset && s.groupIndex === key.groupIndex)?.value || '';
      const type = (extras?.thinkingTypes?.find((t) => t.yearOffset === key.yearOffset && t.groupIndex === key.groupIndex)?.type || 'WMO') as 'WMO' | 'GT' | 'GTA';
      const level = Number(extras?.thinkingLevels?.find((l) => l.yearOffset === key.yearOffset && l.groupIndex === key.groupIndex)?.level || 0);
      const thinking = level > 0 ? `${type} LV. ${level}` : `${type}`;
      return {
        month: m,
        index: i,
        yearOffset: y,
        labels: {
          subject,
          thinking,
          gifted: '',
          contest: '',
          arithmetic: '',
        }
      };
    });
    const academicYear = startAcademicYear + y;
    const gradeLabel = `초${Math.max(1, startGrade + y)}`;
    blocks.push({ academicYear, gradeLabel, months });
  }
  return blocks;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const auth = request.headers.get('Authorization') || '';
    const url = new URL(request.url);
    const years = Number(url.searchParams.get('years') || '3');
    const resp = await fetch(`${BACKEND_URL}/api/admin/students/${id}/roadmap`, {
      headers: {
        'Authorization': auth,
        'Content-Type': 'application/json',
      },
      method: 'GET',
    });
    const text = await resp.text();
    let raw: any = {};
    try {
      raw = text ? JSON.parse(text) : {};
    } catch {
      raw = {};
    }
    const base = raw?.base ?? { startAcademicYear: new Date().getFullYear(), startGrade: 3, gradePromotionMonth: 3 };
    const extras: Extras = raw?.extras ?? {};
    const blocks = buildBlocks(base, extras, years);
    return NextResponse.json({ base, extras, blocks }, { status: 200 });
  } catch (error) {
    console.error('[nimda/students/:id/roadmap][GET] proxy error:', error);
    return NextResponse.json({ error: 'Backend API 호출 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const auth = request.headers.get('Authorization') || '';
    const body = await request.text();
    const resp = await fetch(`${BACKEND_URL}/api/admin/students/${id}/roadmap`, {
      headers: {
        'Authorization': auth,
        'Content-Type': 'application/json',
      },
      method: 'PUT',
      body,
    });
    const text = await resp.text();
    try {
      const data = text ? JSON.parse(text) : null;
      return NextResponse.json(data, { status: resp.status });
    } catch {
      return new NextResponse(text, { status: resp.status });
    }
  } catch (error) {
    console.error('[nimda/students/:id/roadmap][PUT] proxy error:', error);
    return NextResponse.json({ error: 'Backend API 호출 중 오류가 발생했습니다.' }, { status: 500 });
  }
}




