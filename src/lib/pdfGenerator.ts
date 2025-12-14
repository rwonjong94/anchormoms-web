import { PDFDocument, PDFPage, PDFFont, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

export interface Problem {
  id: string;
  examInfo: string;
  probNum: number;
  probText: string;
  probArea?: string;
  probType?: string;
  examGrade?: number;
  examYear?: number;
  examTerm?: number;
}

export interface PdfOptions {
  title?: string;
  subtitle?: string;
  studentName?: string;
  examDate?: string;
  headerTitle?: string;
}

interface FontCache {
  regular?: PDFFont;
  bold?: PDFFont;
}

// 한글 폰트 캐시
let fontCache: FontCache = {};

/**
 * 한글 텍스트를 로마자로 변환하는 함수 (폴백용)
 */
function convertKoreanToRoman(text: string): string {
  // 간단한 한글-로마자 변환 (주요 단어만)
  const koreanToRoman: Record<string, string> = {
    '수학': 'Suhak',
    '모의고사': 'Mock Exam',
    '문제': 'Problem',
    '번': 'No.',
    '답': 'Answer',
    '날짜': 'Date',
    '이름': 'Name',
    '학년': 'Grade',
    '학기': 'Semester',
    '영역': 'Area',
    '유형': 'Type',
    '정답률': 'Accuracy',
    '시험': 'Exam',
    '년': 'Year',
    '월': 'Month',
    '일': 'Day'
  };

  let result = text;
  Object.entries(koreanToRoman).forEach(([korean, roman]) => {
    result = result.replace(new RegExp(korean, 'g'), roman);
  });

  return result;
}

/**
 * 한글 폰트를 로드하는 함수 (안정적인 폴백 포함)
 */
async function loadKoreanFont(pdfDoc: PDFDocument, fontWeight: 'regular' | 'bold' = 'regular'): Promise<PDFFont> {
  // 캐시에서 폰트 확인
  if (fontCache[fontWeight]) {
    return fontCache[fontWeight]!;
  }

  try {
    // fontkit 등록
    pdfDoc.registerFontkit(fontkit);

    // 안정적인 한글 폰트 URL들 (CDN 우선)
    const fontUrls = {
      regular: [
        'https://cdn.jsdelivr.net/gh/fonts-archive/NotoSansKR/NotoSansKR-Regular.woff2',
        'https://cdn.jsdelivr.net/npm/hangeul@1.0.0/dist/NotoSansKR-Regular.woff2',
        'https://fonts.gstatic.com/ea/notosanskr/v2/NotoSansKR-Regular.woff2'
      ],
      bold: [
        'https://cdn.jsdelivr.net/gh/fonts-archive/NotoSansKR/NotoSansKR-Bold.woff2',
        'https://cdn.jsdelivr.net/npm/hangeul@1.0.0/dist/NotoSansKR-Bold.woff2',
        'https://fonts.gstatic.com/ea/notosanskr/v2/NotoSansKR-Bold.woff2'
      ]
    };

    // 웹폰트 로드 시도
    for (const url of fontUrls[fontWeight]) {
      try {
        console.log(`한글 폰트 로드 시도: ${url}`);
        const fontResponse = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; PDF-Generator)',
            'Accept': 'font/woff2,font/*,*/*'
          },
          mode: 'cors'
        });

        if (fontResponse.ok) {
          const fontBytes = await fontResponse.arrayBuffer();
          const font = await pdfDoc.embedFont(fontBytes, {
            subset: true,  // 폰트 서브셋 생성 (한글 문자만 포함)
          });
          fontCache[fontWeight] = font;
          console.log(`한글 폰트 로드 성공: ${fontWeight} from ${url}`);
          return font;
        } else {
          console.warn(`폰트 응답 실패: ${fontResponse.status} - ${url}`);
        }
      } catch (urlError) {
        console.warn(`폰트 URL 로드 실패: ${url}`, urlError);
        continue;
      }
    }

    throw new Error('모든 웹폰트 로드 실패');

  } catch (error) {
    console.warn('한글 웹폰트 로드 실패, 기본 폰트 사용:', error);

    // 폴백: 한글 지원이 되는 기본 폰트 사용
    // Times-Roman은 유니코드를 일부 지원하므로 한글이 □로 표시되지만 오류는 방지
    try {
      const fallbackFont = await pdfDoc.embedFont('Times-Roman');
      fontCache[fontWeight] = fallbackFont;
      console.warn('한글 지원 제한적인 Times-Roman 폰트 사용 (한글은 □로 표시될 수 있음)');
      return fallbackFont;
    } catch (fallbackError) {
      console.error('Times-Roman 폰트도 로드 실패, Helvetica 사용:', fallbackError);
      const helvetica = await pdfDoc.embedFont('Helvetica');
      fontCache[fontWeight] = helvetica;
      return helvetica;
    }
  }
}

/**
 * 안전하게 텍스트를 그리는 함수
 */
function drawTextSafely(
  page: PDFPage,
  text: string,
  options: {
    x: number;
    y: number;
    size: number;
    font: PDFFont;
    color: any;
  }
): void {
  try {
    // 텍스트를 UTF-8로 정규화
    const normalizedText = text.normalize('NFC');

    // 원본 텍스트로 먼저 시도
    page.drawText(normalizedText, {
      ...options,
      // 한글 폰트 사용 시 필요한 옵션들
      lineHeight: options.size * 1.2,
    });
    console.log('한글 텍스트 그리기 성공:', normalizedText.substring(0, 20) + (normalizedText.length > 20 ? '...' : ''));
  } catch (error) {
    console.warn('한글 텍스트 그리기 실패, 로마자 변환:', text.substring(0, 20), error);
    try {
      // 로마자 변환 후 재시도
      const romanText = convertKoreanToRoman(text);
      page.drawText(romanText, options);
      console.log('로마자 텍스트 그리기 성공:', romanText);
    } catch (fallbackError) {
      console.error('로마자 텍스트 그리기도 실패:', text.substring(0, 20), fallbackError);
      // 최후의 수단: ASCII만 유지
      const asciiOnly = text.replace(/[^\x20-\x7E]/g, '?');
      try {
        page.drawText(asciiOnly, options);
        console.log('ASCII 텍스트 그리기 성공:', asciiOnly);
      } catch (finalError) {
        console.error('모든 텍스트 그리기 실패:', finalError);
      }
    }
  }
}

/**
 * 텍스트를 여러 줄로 나누는 함수 (한글 지원)
 */
function wrapText(text: string, maxWidth: number, font: PDFFont, fontSize: number): string[] {
  // 한글의 경우 공백 기준 + 문자 기준으로 분할
  const words = text.includes(' ') ? text.split(' ') : [text];
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;

    try {
      const width = font.widthOfTextAtSize(testLine, fontSize);

      if (width <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          // 단어 하나가 너무 긴 경우 강제로 자르기
          if (word.length > 50) {
            lines.push(word.substring(0, 47) + '...');
          } else {
            lines.push(word);
          }
        }
      }
    } catch (error) {
      console.warn('텍스트 폭 계산 실패, 기본 처리:', word);
      if (currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        lines.push(word);
      }
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.length > 0 ? lines : [text];
}

/**
 * PDF 페이지에 헤더를 그리는 함수
 */
async function drawHeader(
  page: PDFPage,
  font: PDFFont,
  boldFont: PDFFont,
  options: PdfOptions
): Promise<number> {
  const pageWidth = page.getWidth();
  const pageHeight = page.getHeight();
  const margin = 50;
  const headerHeight = 100;

  // 헤더 배경 (선택사항)
  page.drawRectangle({
    x: margin,
    y: pageHeight - margin - headerHeight,
    width: pageWidth - margin * 2,
    height: headerHeight,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
  });

  // 상단 실선
  page.drawLine({
    start: { x: margin, y: pageHeight - margin },
    end: { x: pageWidth - margin, y: pageHeight - margin },
    thickness: 2,
    color: rgb(0, 0, 0),
  });

  // 헤더와 본문 구분선
  page.drawLine({
    start: { x: margin, y: pageHeight - margin - headerHeight },
    end: { x: pageWidth - margin, y: pageHeight - margin - headerHeight },
    thickness: 2,
    color: rgb(0, 0, 0),
  });

  // 제목
  const title = options.headerTitle || options.title || '수학 모의고사';
  drawTextSafely(page, title, {
    x: margin + 15,
    y: pageHeight - margin - 25,
    size: 16,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  // 날짜 입력 칸
  const dateText = options.examDate || '날짜: ________________';
  drawTextSafely(page, dateText, {
    x: margin + 15,
    y: pageHeight - margin - 50,
    size: 12,
    font: font,
    color: rgb(0, 0, 0),
  });

  // 이름 입력 칸
  const nameText = options.studentName || '이름: ____________________';
  drawTextSafely(page, nameText, {
    x: pageWidth - margin - 200,
    y: pageHeight - margin - 50,
    size: 12,
    font: font,
    color: rgb(0, 0, 0),
  });

  // 기타 정보 (선택사항)
  if (options.subtitle) {
    drawTextSafely(page, options.subtitle, {
      x: margin + 15,
      y: pageHeight - margin - 75,
      size: 10,
      font: font,
      color: rgb(0.3, 0.3, 0.3),
    });
  }

  return headerHeight;
}

/**
 * 문제를 PDF 페이지에 그리는 함수
 */
async function drawProblem(
  page: PDFPage,
  font: PDFFont,
  boldFont: PDFFont,
  problem: Problem,
  problemNumber: number,
  startY: number,
  maxWidth: number,
  problemHeight: number
): Promise<void> {
  const margin = 50;
  const lineHeight = 16;
  let currentY = startY;

  // 문제 번호
  drawTextSafely(page, `${problemNumber}.`, {
    x: margin + 15,
    y: currentY,
    size: 14,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  // 문제 정보 (문제집, 번호 등)
  const problemInfo = `${problem.examInfo} ${problem.probNum}번`;
  drawTextSafely(page, problemInfo, {
    x: margin + 40,
    y: currentY,
    size: 10,
    font: font,
    color: rgb(0.5, 0.5, 0.5),
  });

  currentY -= 25;

  // 문제 내용
  if (problem.probText) {
    const lines = wrapText(problem.probText, maxWidth - 80, font, 12);

    for (const line of lines) {
      if (currentY < startY - problemHeight + 30) break; // 영역 초과 방지

      drawTextSafely(page, line, {
        x: margin + 40,
        y: currentY,
        size: 12,
        font: font,
        color: rgb(0, 0, 0),
      });
      currentY -= lineHeight;
    }
  }

  // 답안 작성 공간 표시
  const answerY = Math.max(currentY - 30, startY - problemHeight + 15);
  drawTextSafely(page, '답:', {
    x: margin + 40,
    y: answerY,
    size: 12,
    font: font,
    color: rgb(0, 0, 0),
  });

  // 답안 작성선
  page.drawLine({
    start: { x: margin + 70, y: answerY + 3 },
    end: { x: margin + maxWidth - 50, y: answerY + 3 },
    thickness: 1,
    color: rgb(0, 0, 0),
  });
}

/**
 * 선택된 문제들로 PDF를 생성하는 메인 함수
 */
export async function createProblemsPdf(
  problems: Problem[],
  options: PdfOptions = {}
): Promise<Blob> {
  if (problems.length === 0) {
    throw new Error('문제가 선택되지 않았습니다.');
  }

  try {
    // PDF 문서 생성
    const pdfDoc = await PDFDocument.create();

    // fontkit 등록 (중요!)
    pdfDoc.registerFontkit(fontkit);

    // 폰트 로드
    const font = await loadKoreanFont(pdfDoc, 'regular');
    const boldFont = await loadKoreanFont(pdfDoc, 'bold');

    console.log('PDF 문서와 폰트 준비 완료');

    // A4 사이즈
    const pageWidth = 595.28; // A4 width in points
    const pageHeight = 841.89; // A4 height in points
    const margin = 50;

    // 2문제씩 처리
    const problemsPerPage = 2;
    const totalPages = Math.ceil(problems.length / problemsPerPage);

    for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
      const page = pdfDoc.addPage([pageWidth, pageHeight]);

      // 헤더 그리기
      const headerHeight = await drawHeader(page, font, boldFont, options);

      // 본문 영역 계산
      const contentAreaHeight = pageHeight - margin * 2 - headerHeight;
      const problemHeight = contentAreaHeight / problemsPerPage;

      // 현재 페이지의 문제들
      const startIdx = pageIndex * problemsPerPage;
      const endIdx = Math.min(startIdx + problemsPerPage, problems.length);
      const pageProblems = problems.slice(startIdx, endIdx);

      // 문제 그리기
      for (let i = 0; i < pageProblems.length; i++) {
        const problem = pageProblems[i];
        const problemNumber = startIdx + i + 1;
        const startY = pageHeight - margin - headerHeight - (i * problemHeight) - 20;

        await drawProblem(
          page,
          font,
          boldFont,
          problem,
          problemNumber,
          startY,
          pageWidth - margin * 2,
          problemHeight
        );

        // 문제 구분선 (마지막 문제 제외)
        if (i < pageProblems.length - 1) {
          const dividerY = startY - problemHeight;
          page.drawLine({
            start: { x: margin, y: dividerY },
            end: { x: pageWidth - margin, y: dividerY },
            thickness: 1,
            color: rgb(0.7, 0.7, 0.7),
            dashArray: [3, 3], // 점선
          });
        }
      }
    }

    // PDF 저장 전 폰트 정보 확인
    console.log('PDF 저장 시작 - 총 페이지 수:', totalPages);

    const pdfBytes = await pdfDoc.save({
      useObjectStreams: false,  // 호환성을 위해 object streams 비활성화
      addDefaultPage: false,    // 기본 페이지 추가 안 함
    });

    console.log('PDF 생성 완료 - 크기:', pdfBytes.byteLength, 'bytes');

    // Blob 반환
    return new Blob([pdfBytes], { type: 'application/pdf' });

  } catch (error) {
    console.error('PDF 생성 중 오류:', error);
    throw new Error(`PDF 생성에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
  }
}

/**
 * PDF Blob URL을 생성하는 헬퍼 함수
 */
export function createPdfBlobUrl(blob: Blob): string {
  return URL.createObjectURL(blob);
}

/**
 * PDF Blob URL을 해제하는 헬퍼 함수
 */
export function revokePdfBlobUrl(url: string): void {
  URL.revokeObjectURL(url);
}

/**
 * PDF 파일을 다운로드하는 헬퍼 함수
 */
export function downloadPdf(blob: Blob, filename: string): void {
  const url = createPdfBlobUrl(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  revokePdfBlobUrl(url);
}