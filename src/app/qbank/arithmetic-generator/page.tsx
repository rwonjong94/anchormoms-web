'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
// QBank 페이지는 별도 레이아웃 사용

interface ArithmeticProblem {
  id: number;
  question: string;
  answer: number | string;
  type: string;
}

interface ArithmeticType {
  id: string;
  name: string;
  description: string;
  generateProblem: () => ArithmeticProblem;
  generateProblemAt?: (index: number, total: number) => ArithmeticProblem;
}

interface ProblemsByType {
  [key: string]: ArithmeticProblem[];
}

interface GenerationHistoryEntry {
  id: string;
  runNumber: number;
  timestamp: string;
  selectedTypeIds: string[];
  typeCounts: Record<string, number>;
  problemsByType: ProblemsByType;
  filenames?: string[];
}

export default function ArithmeticGeneratorPage() {
  const [problemsByType, setProblemsByType] = useState<ProblemsByType>({});
  const [loading, setLoading] = useState(false);
  const [selectedTypeIds, setSelectedTypeIds] = useState<Set<string>>(new Set());
  const [typeCounts, setTypeCounts] = useState<Record<string, number>>({});
  const [historyEntries, setHistoryEntries] = useState<GenerationHistoryEntry[]>([]);
  const [nextRunNumber, setNextRunNumber] = useState<number>(1);
  // Two-page per-type policy: counts must be one of 36/48/60
  const [daysCount, setDaysCount] = useState<number>(1);
  const [startRunInput, setStartRunInput] = useState<string>('');
  const [includeCover, setIncludeCover] = useState<boolean>(true);
  const [splitByDay, setSplitByDay] = useState<boolean>(false);
  const [runNumberDigits, setRunNumberDigits] = useState<number>(3);
  const [showAllHistory, setShowAllHistory] = useState<boolean>(false);
  
  const router = useRouter();

  // 연산 유형 정의
  const arithmeticTypes: ArithmeticType[] = [
    {
      id: 'two_plus_one',
      name: 'Two-digit + One-digit',
      description: 'e.g., 45 + 7, 23 + 9',
      generateProblem: () => {
        const twoDigit = Math.floor(Math.random() * 90) + 10; // 10-99
        const oneDigit = Math.floor(Math.random() * 9) + 1; // 1-9
        return {
          id: Math.random(),
          question: `${twoDigit} + ${oneDigit} = `,
          answer: twoDigit + oneDigit,
          type: 'two_plus_one'
        };
      }
    },
    {
      id: 'two_minus_one',
      name: 'Two-digit - One-digit',
      description: 'e.g., 45 - 7, 23 - 9',
      generateProblem: () => {
        const twoDigit = Math.floor(Math.random() * 90) + 10; // 10-99
        const oneDigit = Math.floor(Math.random() * 9) + 1; // 1-9
        const answer = twoDigit - oneDigit;
        if (answer < 0) {
          return arithmeticTypes[1].generateProblem(); // 재귀 호출로 다시 생성
        }
        return {
          id: Math.random(),
          question: `${twoDigit} - ${oneDigit} = `,
          answer: answer,
          type: 'two_minus_one'
        };
      }
    },
    {
      id: 'three_plus_two',
      name: 'Three-digit + Two-digit',
      description: 'e.g., 345 + 67, 123 + 89',
      generateProblem: () => {
        const threeDigit = Math.floor(Math.random() * 900) + 100; // 100-999
        const twoDigit = Math.floor(Math.random() * 90) + 10; // 10-99
        return {
          id: Math.random(),
          question: `${threeDigit} + ${twoDigit} = `,
          answer: threeDigit + twoDigit,
          type: 'three_plus_two'
        };
      }
    },
    {
      id: 'three_minus_two',
      name: 'Three-digit - Two-digit',
      description: 'e.g., 345 - 67, 123 - 89',
      generateProblem: () => {
        const threeDigit = Math.floor(Math.random() * 900) + 100; // 100-999
        const twoDigit = Math.floor(Math.random() * 90) + 10; // 10-99
        const answer = threeDigit - twoDigit;
        if (answer < 0) {
          return arithmeticTypes[3].generateProblem(); // 재귀 호출로 다시 생성
        }
        return {
          id: Math.random(),
          question: `${threeDigit} - ${twoDigit} = `,
          answer: answer,
          type: 'three_minus_two'
        };
      }
    },
    {
      id: 'one_multiply_one',
      name: 'One-digit x One-digit',
      description: 'e.g., 7 x 8, 6 x 9',
      generateProblem: () => {
        const num1 = Math.floor(Math.random() * 8) + 2; // 2-9 (1 제외)
        const num2 = Math.floor(Math.random() * 8) + 2; // 2-9 (1 제외)
        return {
          id: Math.random(),
          question: `${num1} × ${num2} = `,
          answer: num1 * num2,
          type: 'one_multiply_one'
        };
      }
    },
    {
      id: 'two_multiply_one',
      name: 'Two-digit x One-digit',
      description: 'e.g., 45 x 7, 23 x 8',
      generateProblem: () => {
        const twoDigit = Math.floor(Math.random() * 90) + 10; // 10-99
        const oneDigit = Math.floor(Math.random() * 8) + 2; // 2-9 (1 제외)
        return {
          id: Math.random(),
          question: `${twoDigit} × ${oneDigit} = `,
          answer: twoDigit * oneDigit,
          type: 'two_multiply_one'
        };
      }
    },
    {
      id: 'two_multiply_two',
      name: 'Two-digit x Two-digit',
      description: 'e.g., 45 x 67, 23 x 89',
      generateProblem: () => {
        const num1 = Math.floor(Math.random() * 90) + 10; // 10-99
        const num2 = Math.floor(Math.random() * 90) + 10; // 10-99
        return {
          id: Math.random(),
          question: `${num1} × ${num2} = `,
          answer: num1 * num2,
          type: 'two_multiply_two'
        };
      }
    },
    {
      id: 'three_multiply_one',
      name: 'Three-digit x One-digit',
      description: 'e.g., 345 x 7, 123 x 8',
      generateProblem: () => {
        const threeDigit = Math.floor(Math.random() * 900) + 100; // 100-999
        const oneDigit = Math.floor(Math.random() * 8) + 2; // 2-9 (1 제외)
        return {
          id: Math.random(),
          question: `${threeDigit} × ${oneDigit} = `,
          answer: threeDigit * oneDigit,
          type: 'three_multiply_one'
        };
      }
    },
    {
      id: 'squares',
      name: 'Square Numbers',
      description: '1×1, 2×2, 3×3, …',
      generateProblem: () => {
        // fallback: 기본값으로 1×1
        return { id: Math.random(), question: `1 × 1 = `, answer: 1, type: 'squares' };
      },
      generateProblemAt: (index: number) => {
        const n = index + 1; // 1..count
        return {
          id: Math.random(),
          question: `${n} × ${n} = `,
          answer: n * n,
          type: 'squares'
        };
      }
    },
    {
      id: 'one_plus_one_plus_one_no1',
      name: 'One-digit + One-digit + One-digit',
      description: 'e.g., 7 + 8 + 9',
      generateProblem: () => {
        const d = () => Math.floor(Math.random() * 8) + 2; // 2-9 (1 제외)
        const a = d();
        const b = d();
        const c = d();
        return {
          id: Math.random(),
          question: `${a} + ${b} + ${c} = `,
          answer: a + b + c,
          type: 'one_plus_one_plus_one_no1'
        };
      }
    },
    {
      id: 'one_plus_one_plus_one_plus_one_no1',
      name: 'One-digit + One-digit + One-digit + One-digit',
      description: 'e.g., 7 + 8 + 9 + 6',
      generateProblem: () => {
        const d = () => Math.floor(Math.random() * 8) + 2; // 2-9 (1 제외)
        const a = d();
        const b = d();
        const c = d();
        const e = d();
        return {
          id: Math.random(),
          question: `${a} + ${b} + ${c} + ${e} = `,
          answer: a + b + c + e,
          type: 'one_plus_one_plus_one_plus_one_no1'
        };
      }
    },
    {
      id: 'two_plus_two_plus_two',
      name: 'Two-digit + Two-digit + Two-digit',
      description: 'e.g., 34 + 56 + 78',
      generateProblem: () => {
        const d2 = () => Math.floor(Math.random() * 90) + 10; // 10-99
        const a = d2();
        const b = d2();
        const c = d2();
        return {
          id: Math.random(),
          question: `${a} + ${b} + ${c} = `,
          answer: a + b + c,
          type: 'two_plus_two_plus_two'
        };
      }
    },
    {
      id: 'two_divide_one',
      name: 'Two-digit ÷ One-digit',
      description: 'e.g., 84 ÷ 7, 23 ÷ 5',
      generateProblem: () => {
        // 10-99 ÷ 2-9 (1 제외), 나머지 허용 -> 몫 ... 나머지 형식
        const divisor = Math.floor(Math.random() * 8) + 2; // 2-9
        const dividend = Math.floor(Math.random() * 90) + 10; // 10-99
        const quotient = Math.floor(dividend / divisor);
        const remainder = dividend % divisor;
        const answer = remainder === 0 ? `${quotient}` : `${quotient} ... ${remainder}`;
        return {
          id: Math.random(),
          question: `${dividend} ÷ ${divisor} = `,
          answer,
          type: 'two_divide_one'
        };
      }
    }
  ];

  // 초기에는 모든 유형 선택 및 기본 개수(36) 세팅, 히스토리 로드
  useEffect(() => {
    setSelectedTypeIds(new Set(arithmeticTypes.map((t) => t.id)));
    setTypeCounts((prev) => {
      const initial: Record<string, number> = { ...prev };
      const defaults = [60, 60, 36, 36, 60, 48, 36, 36, 36, 48, 36, 36, 60];
      arithmeticTypes.forEach((t, idx) => {
        if (initial[t.id] == null) initial[t.id] = defaults[idx] ?? 36;
      });
      return initial;
    });

    try {
      const saved = localStorage.getItem('arithmeticHistory');
      if (saved) {
        const parsed: any[] = JSON.parse(saved);
        const normalized: GenerationHistoryEntry[] = parsed.map((e: any) => ({
          id: e.id || `${Date.now()}_${Math.random().toString(36).slice(2,8)}`,
          runNumber: e.runNumber,
          timestamp: e.timestamp,
          selectedTypeIds: e.selectedTypeIds,
          typeCounts: e.typeCounts,
          problemsByType: e.problemsByType,
          filenames: Array.isArray(e.filenames) ? e.filenames : [],
        }));
        setHistoryEntries(normalized);
        localStorage.setItem('arithmeticHistory', JSON.stringify(normalized));
        const maxRun = normalized.reduce((m, e) => Math.max(m, e.runNumber), 0);
        setNextRunNumber(maxRun + 1);
      }
    } catch {}
  }, []);

  const generateAllProblems = () => {
    setLoading(true);
    const newProblemsByType: ProblemsByType = {};

    // 선택된 유형별 문제 생성 (각 유형별로 36/48/60 중 선택한 개수)
    const selected = arithmeticTypes.filter((t) => selectedTypeIds.has(t.id));
    if (selected.length === 0) {
      alert('최소 1개 이상의 유형을 선택해주세요.');
      setLoading(false);
      return;
    }
    selected.forEach((type) => {
      const problems: ArithmeticProblem[] = [];
      const selectedCount = typeCounts[type.id];
      const count = [36, 48, 60].includes(Number(selectedCount)) ? Number(selectedCount) : 36;
      for (let i = 0; i < count; i++) {
        if (type.generateProblemAt) problems.push(type.generateProblemAt(i, count));
        else problems.push(type.generateProblem());
      }
      newProblemsByType[type.id] = problems;
    });

    setProblemsByType(newProblemsByType);
    try {
      // 생성 즉시 히스토리 저장 (현재 선택 및 개수 스냅샷과 문제 보관)
      const entry: GenerationHistoryEntry = {
        id: createUniqueId(),
        runNumber: nextRunNumber,
        timestamp: new Date().toISOString(),
        selectedTypeIds: Array.from(selectedTypeIds),
        typeCounts: { ...typeCounts },
        problemsByType: newProblemsByType,
      };
      const updated = [...historyEntries, entry];
      setHistoryEntries(updated);
      localStorage.setItem('arithmeticHistory', JSON.stringify(updated));
      setNextRunNumber(nextRunNumber + 1);
    } catch {}
    setLoading(false);
  };

  // 브라우저에서 바로 PDF 생성 (ASCII 전용)
  const createPdfBlob = async (
    problems: ArithmeticProblem[],
    includeAnswers: boolean,
    title: string,
    gridColumns: number,
    gridRows: number
  ): Promise<Blob> => {
    const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // A4 사이즈 (포인트): 595.28 x 841.89
    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const margin = 56.7; // 약 2cm
    const headerHeight = 80;
    const columns = gridColumns;
    const rows = gridRows;
    const problemsPerPage = columns * rows;
    const gridWidth = pageWidth - margin * 2;
    const gridHeight = pageHeight - margin * 2 - headerHeight;
    const cellWidth = gridWidth / columns;
    const cellHeight = gridHeight / rows;

    const totalPages = Math.ceil(problems.length / problemsPerPage);

    const sanitizeAscii = (s: string) => s.replace(/[^\x00-\x7F]/g, '');

    for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
      const page = pdfDoc.addPage([pageWidth, pageHeight]);

      // 첫 페이지 상단 정보 (제목/회차 표기 + 유형 집합 표기)
      if (pageIndex === 0) {
        page.drawText(title || 'Arithmetic Practice', {
          x: margin,
          y: pageHeight - margin - 20,
          size: 16,
          font,
          color: rgb(0, 0, 0),
        });
        const infoY = pageHeight - margin - 45;
        // Shorter date underline
        page.drawText('Date: ____________', { x: margin, y: infoY, size: 12, font });
        page.drawText('Name: ____________________', { x: margin + 200, y: infoY, size: 12, font });

        // 선택된 유형 이름 요약
        try {
          const activeTypes = new Set(problems.map(p => p.type));
          const names = arithmeticTypes
            .filter(t => activeTypes.has(t.id))
            .map(t => t.name.replace(/\s*\(.*?\)\s*/g, ''))
            .join(', ');
          if (names) {
            page.drawText(names, {
              x: margin,
              y: infoY - 18,
              size: 10,
              font,
              color: rgb(0, 0, 0),
            });
          }
        } catch {}
      }

      const start = pageIndex * problemsPerPage;
      const end = Math.min(start + problemsPerPage, problems.length);
      const pageProblems = problems.slice(start, end);

      pageProblems.forEach((problem, i) => {
        const row = Math.floor(i / columns);
        const col = i % columns;
        const x = margin + col * cellWidth + 8;
        const y = pageHeight - margin - headerHeight - row * cellHeight - 28;

        // 문제 번호
        // Problem number (one line above the question)
        page.drawText(`${start + i + 1}.`, {
          x,
          y: y + 26,
          size: 10,
          font,
          color: rgb(0.3, 0.3, 0.3),
        });

        // Question text (ASCII-only, replace × with x and ÷ with /)
        const baseText = problem.question.replace(/×/g, 'x').replace(/÷/g, '/');
        const qText = sanitizeAscii(baseText);
        const questionX = x + 20;
        const questionY = y + 12;
        page.drawText(qText, {
          x: questionX,
          y: questionY,
          size: 12,
          font,
          color: rgb(0, 0, 0),
        });

        // Answer underline or answer placement at the position right after '='
        const underlineStartX = questionX + font.widthOfTextAtSize(qText, 12) + 6;
        const underlineY = questionY + 2;
        const underlineLen = 48;

        // 답지일 때 답 표시
        if (includeAnswers) {
          // Place the numeric answer at the underline position
          page.drawText(String(problem.answer), {
            x: underlineStartX,
            y: questionY,
            size: 12,
            font,
            color: rgb(0, 0, 0),
          });
        }
        else {
          // Draw underline for the answer area (worksheet)
          page.drawRectangle({ x: underlineStartX, y: underlineY, width: underlineLen, height: 0.8, color: rgb(0, 0, 0) });
        }
      });
    }

    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
  };

  const getOrdinalSuffix = (n: number) => {
    const v = n % 100;
    if (v >= 11 && v <= 13) return 'th';
    switch (n % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  const formatRunNumber = (n: number, digits: number = runNumberDigits) => String(n).padStart(digits, '0');
  const createUniqueId = (): string => `${Date.now()}_${Math.random().toString(36).slice(2,8)}`;

  // 페이지 내 중복 제거(3x6 = 18/페이지 기준)용 생성기 맵 준비
  const typeIdToGenerator: Record<string, () => ArithmeticProblem> = Object.fromEntries(
    arithmeticTypes.map(t => [t.id, t.generateProblem])
  );

  const buildNoDuplicatePerPage = (input: ArithmeticProblem[], perPage: number): ArithmeticProblem[] => {
    const output: ArithmeticProblem[] = [];
    let pageSeen = new Set<string>();
    for (let i = 0; i < input.length; i++) {
      if (i % perPage === 0) pageSeen = new Set<string>();
      let candidate = input[i];
      let q = candidate.question;
      let attempts = 0;
      while (pageSeen.has(q) && attempts < 20) {
        const gen = typeIdToGenerator[candidate.type];
        if (!gen) break;
        candidate = gen();
        q = candidate.question;
        attempts++;
      }
      pageSeen.add(q);
      output.push(candidate);
    }
    return output;
  };

  const getRowsForCount = (totalCount: number): number => {
    if (totalCount === 36) return 6;  // 18/페이지
    if (totalCount === 48) return 8;  // 24/페이지
    if (totalCount === 60) return 10; // 30/페이지
    // fallback: 근사치로 계산
    const perPage = Math.max(18, Math.min(30, Math.floor(totalCount / 2)));
    return Math.max(6, Math.min(10, Math.ceil(perPage / 3)));
  };

  const sanitizeTypeName = (name: string): string => name.replace(/\s*\(.*?\)\s*/g, '');

  interface PdfPageSpec {
    problems: ArithmeticProblem[];
    typeName: string;
    columns: number; // 3
    rows: number;    // 6 | 8 | 10
    startIndexOffset: number; // 페이지 내 번호 보정 (유형별 연속 번호)
  }

  const createPdfFromPages = async (
    pages: PdfPageSpec[],
    includeAnswers: boolean,
    runNumber: number
  ): Promise<Blob> => {
    const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const margin = 56.7;
    const headerHeight = 80;

    const sanitizeAscii = (s: string) => s.replace(/[^\x00-\x7F]/g, '');
    const runTitle = `Arithmetic Practice ${formatRunNumber(runNumber)}`;

    pages.forEach((spec, pageIdx) => {
      const { problems, typeName, columns, rows, startIndexOffset } = spec;
      const page = pdfDoc.addPage([pageWidth, pageHeight]);

      // 머리글 영역 좌표 계산
      const topY = pageHeight - margin - 12;
      let titleY = topY;
      let typeY = topY - 18;
      // 이름/날짜는 첫 페이지 최상단에 배치
      if (pageIdx === 0) {
        page.drawText('Date: ____________', { x: margin, y: topY, size: 12, font });
        page.drawText('Name: ____________________', { x: margin + 200, y: topY, size: 12, font });
        titleY = topY - 20;
        typeY = topY - 38;
      }

      // 공통 머리글: 시험 번호 + 유형명 (매 페이지)
      page.drawText(runTitle, { x: margin, y: titleY, size: 16, font, color: rgb(0, 0, 0) });
      page.drawText(sanitizeTypeName(typeName), { x: margin, y: typeY, size: 12, font, color: rgb(0.2, 0.2, 0.2) });

      const gridWidth = pageWidth - margin * 2;
      const gridHeight = pageHeight - margin * 2 - headerHeight;
      const cellWidth = gridWidth / columns;
      const cellHeight = gridHeight / rows;
      const problemsPerPage = columns * rows;

      problems.slice(0, problemsPerPage).forEach((problem, i) => {
        const row = Math.floor(i / columns);
        const col = i % columns;
        const x = margin + col * cellWidth + 8;
        const y = pageHeight - margin - headerHeight - row * cellHeight - 28;

        // 번호
        page.drawText(`${startIndexOffset + i + 1}.`, { x, y: y + 26, size: 10, font, color: rgb(0.3, 0.3, 0.3) });

        // 문제 텍스트
        const baseText = String(problem.question).replace(/×/g, 'x').replace(/÷/g, '/');
        const qText = sanitizeAscii(baseText);
        const questionX = x + 20;
        const questionY = y + 12;
        page.drawText(qText, { x: questionX, y: questionY, size: 12, font, color: rgb(0, 0, 0) });

        // 답(혹은 밑줄)
        const underlineStartX = questionX + font.widthOfTextAtSize(qText, 12) + 6;
        const underlineY = questionY + 2;
        const underlineLen = 48;
        if (includeAnswers) {
          page.drawText(String(problem.answer), { x: underlineStartX, y: questionY, size: 12, font, color: rgb(0, 0, 0) });
        } else {
          page.drawRectangle({ x: underlineStartX, y: underlineY, width: underlineLen, height: 0.8, color: rgb(0, 0, 0) });
        }
      });
    });

    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
  };

  const createPdfForMultipleDays = async (
    perDaySpecs: { runNumber: number; pages: PdfPageSpec[] }[],
    includeAnswers: boolean,
    withCover: boolean
  ): Promise<Blob> => {
    const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const margin = 56.7;

    if (withCover) {
      const cover = pdfDoc.addPage([pageWidth, pageHeight]);
      // 표지 상단에 Date/Name 라인
      cover.drawText('Date: ____________', { x: margin, y: pageHeight - margin - 12, size: 12, font });
      cover.drawText('Name: ____________________', { x: margin + 200, y: pageHeight - margin - 12, size: 12, font });
      cover.drawText('Arithmetic Practice', { x: margin, y: pageHeight - margin - 40, size: 18, font, color: rgb(0,0,0) });
      // 포함 시험 번호만 나열 (두 줄 간격)
      let y = pageHeight - margin - 64;
      for (const day of perDaySpecs) {
        if (y < margin + 40) {
          y = pageHeight - margin - 64; // 간단히 위로 리셋
        }
        const run = formatRunNumber(day.runNumber);
        cover.drawText(run, { x: margin, y, size: 12, font, color: rgb(0.2,0.2,0.2) });
        y -= 28; // 두 줄 간격
      }
    }

    // 각 일자의 페이지들을 순서대로 합치기
    for (const day of perDaySpecs) {
      const blob = await createPdfFromPages(day.pages, includeAnswers, day.runNumber);
      const bytes = await blob.arrayBuffer();
      const dayDoc = await PDFDocument.load(bytes);
      const copied = await pdfDoc.copyPages(dayDoc, dayDoc.getPageIndices());
      copied.forEach(p => pdfDoc.addPage(p));
    }

    const out = await pdfDoc.save();
    return new Blob([out], { type: 'application/pdf' });
  };

  const triggerBlobDownload = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const downloadAllPDFs = async (includeAnswers: boolean = false) => {
    if (Object.keys(problemsByType).length === 0) {
      alert('먼저 연산 문제를 생성해주세요.');
      return;
    }

    setLoading(true);
    try {
      console.log('PDF 다운로드 시작:', { includeAnswers, problemsCount: Object.keys(problemsByType).length });

      // 시작 시험 번호 및 일수
      const startRun = Number(startRunInput) > 0 ? Number(startRunInput) : nextRunNumber;
      const days = Math.max(1, Math.min(365, Number.isFinite(daysCount) ? daysCount : 1));

      // 일 수만큼 반복 생성: 선택된 유형을 하루에 한 번씩 반영
      const perDaySpecs: { runNumber: number; pages: PdfPageSpec[] }[] = [];
      for (let day = 0; day < days; day++) {
        const pages: PdfPageSpec[] = [];
        for (const type of arithmeticTypes) {
          if (!selectedTypeIds.has(type.id)) continue;
          const selectedCount = typeCounts[type.id];
          const count = [36, 48, 60].includes(Number(selectedCount)) ? Number(selectedCount) : 36;
          const rows = getRowsForCount(count);
          const perPage = 3 * rows;
          const generated: ArithmeticProblem[] = [];
          for (let i = 0; i < count; i++) {
            if (type.generateProblemAt) generated.push(type.generateProblemAt(i, count));
            else generated.push(type.generateProblem());
          }
          const deduped = buildNoDuplicatePerPage(generated, perPage);
          const first = deduped.slice(0, perPage);
          const second = deduped.slice(perPage, perPage * 2);
          if (first.length > 0) pages.push({ problems: first, typeName: type.name, columns: 3, rows, startIndexOffset: 0 });
          if (second.length > 0) pages.push({ problems: second, typeName: type.name, columns: 3, rows, startIndexOffset: first.length });
        }
        if (pages.length > 0) perDaySpecs.push({ runNumber: startRun + day, pages });
      }
      if (perDaySpecs.length === 0) {
        alert('선택한 유형의 문제가 없습니다. 먼저 문제를 생성해주세요.');
        return;
      }

      let generatedFilenames: string[] = [];
      if (splitByDay) {
        for (const day of perDaySpecs) {
          const blob = await createPdfForMultipleDays([day], includeAnswers, includeCover);
          const filename = `arithmetic_${formatRunNumber(day.runNumber)}_${includeAnswers ? 'answers' : 'questions'}.pdf`;
          generatedFilenames.push(filename);
          triggerBlobDownload(blob, filename);
        }
      } else {
        const blob = await createPdfForMultipleDays(perDaySpecs, includeAnswers, includeCover);
        const filename = perDaySpecs.length === 1
          ? `arithmetic_${formatRunNumber(perDaySpecs[0].runNumber)}_${includeAnswers ? 'answers' : 'questions'}.pdf`
          : `arithmetic_${formatRunNumber(perDaySpecs[0].runNumber)}-${formatRunNumber(perDaySpecs[perDaySpecs.length - 1].runNumber)}_${includeAnswers ? 'answers' : 'questions'}.pdf`;
        generatedFilenames.push(filename);
        triggerBlobDownload(blob, filename);
      }
      // 히스토리에 파일명 남기기 (최근 항목 갱신)
      setHistoryEntries(prev => {
        if (prev.length === 0) return prev;
        const last = { ...prev[prev.length - 1], filenames: generatedFilenames };
        const next = [...prev.slice(0, -1), last];
        localStorage.setItem('arithmeticHistory', JSON.stringify(next));
        return next;
      });
      console.log('단일 PDF 다운로드 완료');
    } catch (error) {
      console.error('PDF 다운로드 오류:', error);
      alert('PDF 다운로드 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const downloadHistoryEntry = async (entry: GenerationHistoryEntry, includeAnswers: boolean) => {
    try {
      setLoading(true);
      const perDaySpecs: { runNumber: number; pages: PdfPageSpec[] }[] = [];
      const pages: PdfPageSpec[] = [];
      for (const type of arithmeticTypes) {
        if (!entry.selectedTypeIds.includes(type.id)) continue;
        const arr = entry.problemsByType[type.id];
        if (!arr || arr.length === 0) continue;
        const rows = getRowsForCount(arr.length);
        const perPage = 3 * rows;
        const deduped = buildNoDuplicatePerPage(arr, perPage);
        const first = deduped.slice(0, perPage);
        const second = deduped.slice(perPage, perPage * 2);
        if (first.length > 0) pages.push({ problems: first, typeName: type.name, columns: 3, rows, startIndexOffset: 0 });
        if (second.length > 0) pages.push({ problems: second, typeName: type.name, columns: 3, rows, startIndexOffset: first.length });
      }
      if (pages.length > 0) perDaySpecs.push({ runNumber: entry.runNumber, pages });
      const blob = await createPdfForMultipleDays(perDaySpecs, includeAnswers, includeCover);
      const filename = `arithmetic_${formatRunNumber(entry.runNumber)}_${includeAnswers ? 'answers' : 'questions'}.pdf`;
      triggerBlobDownload(blob, filename);
    } catch (e) {
      console.error(e);
      alert('히스토리 PDF 생성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getTotalProblems = () => {
    return Object.values(problemsByType).reduce((total, problems) => total + problems.length, 0);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-title">연산 문제 생성</h1>
      </div>

        {/* 연산 유형 선택 */}
        <div className="bg-card rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-title mb-2">연산 유형 선택</h2>
          <div className="text-sm text-muted mb-2">각 유형별로 총 문제 수를 선택하세요. 36(3×6), 48(4×6), 60(5×6) 단위로 두 페이지에 배치됩니다.</div>
          <div className="grid grid-cols-1 gap-3">
            {arithmeticTypes.map((type) => {
              const checked = selectedTypeIds.has(type.id);
              return (
                <div key={type.id} className="flex items-start justify-between space-x-2 p-3 border border-default rounded-md">
                  <label className="flex-1 flex items-start space-x-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={checked}
                      onChange={(e) => {
                        setSelectedTypeIds((prev) => {
                          const next = new Set(prev);
                          if (e.target.checked) next.add(type.id);
                          else next.delete(type.id);
                          return next;
                        });
                      }}
                    />
                    <div>
                      <div className="font-medium text-title">{type.name}</div>
                      <div className="text-sm text-muted">{type.description}</div>
                    </div>
                  </label>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted">문제 수</span>
                    <select
                      className="px-2 py-1 border border-default rounded"
                      value={[36,48,60].includes(Number(typeCounts[type.id])) ? typeCounts[type.id] : 36}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        setTypeCounts((prev) => ({ ...prev, [type.id]: value }));
                      }}
                      disabled={!checked}
                    >
                      <option value={36}>36 (앞/뒤 18)</option>
                      <option value={48}>48 (앞/뒤 24)</option>
                      <option value={60}>60 (앞/뒤 30)</option>
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 문제 생성 및 다운로드 */}
        <div className="bg-card rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-title mb-4">문제 생성 및 다운로드</h2>
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <label className="flex items-center space-x-2">
              <span className="text-title">일 수</span>
              <input
                type="number"
                min={1}
                max={365}
                className="w-24 px-2 py-1 border border-default rounded"
                value={daysCount}
                onChange={(e) => setDaysCount(Math.max(1, Math.min(365, Number(e.target.value) || 1)))}
              />
            </label>
            <label className="flex items-center space-x-2">
              <span className="text-title">시작 시험 번호</span>
              <input
                type="number"
                min={1}
                className="w-24 px-2 py-1 border border-default rounded"
                placeholder={String(nextRunNumber)}
                value={startRunInput}
                onChange={(e) => setStartRunInput(e.target.value)}
              />
              <span className="text-sm text-muted">(빈칸이면 자동으로 다음 번호)</span>
            </label>
            <label className="flex items-center space-x-2">
              <span className="text-title">번호 자릿수</span>
              <select
                className="px-2 py-1 border border-default rounded"
                value={runNumberDigits}
                onChange={(e) => setRunNumberDigits(Math.max(2, Math.min(6, Number(e.target.value) || 3)))}
              >
                <option value={3}>3자리 (001)</option>
                <option value={4}>4자리 (0001)</option>
                <option value={5}>5자리</option>
                <option value={6}>6자리</option>
              </select>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={includeCover}
                onChange={(e) => setIncludeCover(e.target.checked)}
              />
              <span className="text-title">표지 포함</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={splitByDay}
                onChange={(e) => setSplitByDay(e.target.checked)}
              />
              <span className="text-title">일자별 파일 분리</span>
            </label>
          </div>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={generateAllProblems}
              disabled={loading}
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '생성 중...' : '선택한 유형 문제 생성'}
            </button>
            
            {Object.keys(problemsByType).length > 0 && (
              <>
                <button
                  onClick={() => downloadAllPDFs(false)}
                  disabled={loading}
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  문제지 PDF 다운로드 (단일 파일)
                </button>
                <button
                  onClick={() => downloadAllPDFs(true)}
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  답지 PDF 다운로드 (단일 파일)
                </button>
              </>
            )}
          </div>
        </div>

        {/* 문제 미리보기 제거 */}

        {/* 생성 히스토리 */}
        <div className="bg-card rounded-lg shadow p-6 mt-6">
          <h2 className="text-lg font-semibold text-title mb-4">생성 히스토리</h2>
          {historyEntries.length === 0 && (
            <div className="text-muted">히스토리가 없습니다. 문제를 생성하면 자동으로 저장됩니다.</div>
          )}
          {historyEntries.length > 0 && (
            <div className="space-y-3">
              {(showAllHistory ? [...historyEntries] : [...historyEntries].slice(-10)).reverse().map((entry) => (
                <div key={entry.id || `${entry.runNumber}_${entry.timestamp}`} className="flex flex-col md:flex-row md:items-center md:justify-between border border-default rounded p-3">
                  <div className="mb-2 md:mb-0">
                    <div className="font-medium text-title">Arithmetic Practice {formatRunNumber(entry.runNumber)}</div>
                    <div className="text-sm text-muted">{new Date(entry.timestamp).toLocaleString()}</div>
                    <div className="text-sm text-muted">유형: {entry.selectedTypeIds.length}개, 총 문제 수: {Object.values(entry.problemsByType).reduce((t, arr) => t + (arr?.length || 0), 0)}</div>
                    {entry.filenames && entry.filenames.length > 0 && (
                      <div className="text-xs text-muted mt-1 break-all">파일: {entry.filenames.join(', ')}</div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => downloadHistoryEntry(entry, false)}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >문제지 PDF</button>
                    <button
                      onClick={() => downloadHistoryEntry(entry, true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >답지 PDF</button>
                  </div>
                </div>
              ))}
              <div className="pt-2">
                <button className="text-sm text-indigo-600 hover:underline" onClick={() => setShowAllHistory(v => !v)}>
                  {showAllHistory ? '최근 10개만 보기' : '전체 보기'}
                </button>
              </div>
            </div>
          )}
        </div>
    </div>
  );
}
