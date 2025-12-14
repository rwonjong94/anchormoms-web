import { NextRequest, NextResponse } from 'next/server';

// PDF 생성 함수
function generatePDFContent(problems: any[], includeAnswers: boolean, type: string) {
  const problemsPerPage = 20;
  const totalPages = Math.ceil(problems.length / problemsPerPage);
  
  let htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>연산 문제</title>
      <style>
        @page {
          size: A4;
          margin: 2cm;
        }
        body {
          font-family: 'Arial', sans-serif;
          font-size: 14px;
          line-height: 1.6;
          margin: 0;
          padding: 0;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #333;
          padding-bottom: 10px;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: bold;
        }
        .header p {
          margin: 5px 0 0 0;
          font-size: 16px;
        }
        .problems-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-bottom: 30px;
        }
        .problem {
          border: 1px solid #ccc;
          padding: 15px;
          text-align: center;
          min-height: 60px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .problem-number {
          font-weight: bold;
          margin-bottom: 5px;
          font-size: 12px;
        }
        .problem-question {
          font-size: 16px;
          font-weight: bold;
        }
        .problem-answer {
          font-size: 14px;
          color: #666;
          margin-top: 5px;
        }
        .page-break {
          page-break-before: always;
        }
        .footer {
          text-align: center;
          margin-top: 20px;
          font-size: 12px;
          color: #666;
        }
      </style>
    </head>
    <body>
  `;

  // 각 페이지별로 문제 생성
  for (let page = 0; page < totalPages; page++) {
    if (page > 0) {
      htmlContent += '<div class="page-break"></div>';
    }

    const startIndex = page * problemsPerPage;
    const endIndex = Math.min(startIndex + problemsPerPage, problems.length);
    const pageProblems = problems.slice(startIndex, endIndex);

    htmlContent += `
      <div class="header">
        <h1>연산 문제</h1>
        <p>${type} - ${includeAnswers ? '답지' : '문제지'} (${page + 1}/${totalPages}페이지)</p>
      </div>
      <div class="problems-grid">
    `;

    for (let i = 0; i < problemsPerPage; i++) {
      const problemIndex = startIndex + i;
      if (problemIndex < problems.length) {
        const problem = problems[problemIndex];
        htmlContent += `
          <div class="problem">
            <div class="problem-number">${problemIndex + 1}</div>
            <div class="problem-question">${problem.question}</div>
            ${includeAnswers ? `<div class="problem-answer">답: ${problem.answer}</div>` : ''}
          </div>
        `;
      } else {
        // 빈 문제 칸
        htmlContent += `
          <div class="problem">
            <div class="problem-number">${problemIndex + 1}</div>
            <div class="problem-question">______</div>
          </div>
        `;
      }
    }

    htmlContent += `
      </div>
      <div class="footer">
        <p>페이지 ${page + 1} / ${totalPages}</p>
      </div>
    `;
  }

  htmlContent += `
    </body>
    </html>
  `;

  return htmlContent;
}

// PDF 생성 API
export async function POST(request: NextRequest) {
  console.log('PDF 생성 API 호출됨');
  
  try {
    const body = await request.json();
    const { problems, includeAnswers, type } = body;
    console.log('PDF 생성 요청:', { type, includeAnswers, problemsCount: problems?.length });

    if (!problems || !Array.isArray(problems) || problems.length === 0) {
      console.log('문제 데이터 없음');
      return NextResponse.json(
        { error: '문제 데이터가 필요합니다.' },
        { status: 400 }
      );
    }

    // HTML 콘텐츠 생성
    const htmlContent = generatePDFContent(problems, includeAnswers, type);
    console.log('HTML 콘텐츠 생성 완료:', htmlContent.length, 'characters');

    // 백엔드 API 호출하여 PDF 생성
    const backendUrl = 'http://backend:3001';
    const backendEndpoint = `${backendUrl}/api/admin/arithmetic/generate-pdf`;
    console.log('백엔드 호출:', backendEndpoint);
    
    try {
      console.log('백엔드 호출 시작...');
      const response = await fetch(backendEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          htmlContent,
          includeAnswers,
          type,
        }),
      });

      console.log('백엔드 응답 상태:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('백엔드 PDF 생성 실패:', response.status, errorText);
        return NextResponse.json(
          { error: `백엔드 PDF 생성 실패: ${response.status} ${response.statusText}` },
          { status: response.status }
        );
      }

      const pdfBuffer = await response.arrayBuffer();
      console.log('PDF 버퍼 생성 완료:', pdfBuffer.byteLength, 'bytes');
      
      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="연산문제_${type}_${includeAnswers ? '답지' : '문제지'}.pdf"`,
        },
      });
    } catch (fetchError) {
      console.error('백엔드 호출 중 오류:', fetchError);
      return NextResponse.json(
        { error: `백엔드 호출 중 오류가 발생했습니다: ${fetchError instanceof Error ? fetchError.message : '알 수 없는 오류'}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('PDF 생성 오류:', error);
    return NextResponse.json(
      { error: `PDF 생성 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}` },
      { status: 500 }
    );
  }
}
