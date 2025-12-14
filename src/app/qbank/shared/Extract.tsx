// @ts-nocheck
"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';

type ProblemForm = {
  book_name: string;
  book_publisher: string;
  book_num: number | null;
  exam_info: string;
  exam_grade: number;
  exam_term: number;
  exam_year: number;
  prob_num: number;
  prob_area: string;
  prob_type: string;
  prob_rate: number | null;
  prob_text: string;
  prob_images: string[];
  cond_text: string[];
  cond_images: string[];
  sol_ans?: string | null;
  sol_text?: string | null;
  sol_images?: string[];
};

type Book = { name: string };

type Chapter = {
  id: string;
  bookName: string;
  chapterName: string;
  chapterOrder: number;
  sections: Section[];
};

type Section = {
  id: string;
  chapterId: string;
  sectionName: string;
  sectionOrder: number;
};

export default function QBankExtract() {
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<string>('');
  const [images, setImages] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [pageInput, setPageInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrEngine, setOcrEngine] = useState<'gemini' | 'cloud-vision'>('gemini');
  const [error, setError] = useState('');
  const [sets, setSets] = useState<any[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapterId, setSelectedChapterId] = useState<string>('');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [problemType, setProblemType] = useState<string>('');
  const [form, setForm] = useState<ProblemForm>({
    book_name: '',
    book_publisher: '',
    book_num: null,
    exam_info: '',
    exam_grade: 1,
    exam_term: 1,
    exam_year: '' as any,
    prob_num: 1,
    prob_area: '',
    prob_type: '',
    prob_rate: null,
    prob_text: '',
    prob_images: [],
    cond_text: [],
    cond_images: [],
    sol_ans: '',
    sol_text: '',
    sol_images: [],
  });

  const imgRef = useRef<HTMLImageElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const [crop, setCrop] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const restoredRef = useRef<boolean>(false);
  const pendingRestoreRef = useRef<{ book: string; page?: number; year?: number | null } | null>(null);

  const imageUrl = useMemo(() => {
    if (!selectedBook || images.length === 0) return '';
    const file = images[currentIndex];
    return `/api/qbank/sets/${encodeURIComponent(selectedBook)}/image?file=${encodeURIComponent(file)}`;
  }, [selectedBook, images, currentIndex]);
  
  useEffect(() => {
    setPageInput(images.length ? String(currentIndex + 1) : '');
  }, [currentIndex, images.length]);

  // 최초 진입 시 로컬 상태를 우선 반영
  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('qbank_extract_state') : null;
      if (raw) {
        const st = JSON.parse(raw);
        if (st && st.book) {
          const parsedYear = (st.year === null || typeof st.year === 'number')
            ? st.year
            : (typeof st.year === 'string' && /^\d+$/.test(st.year) ? Number(st.year) : undefined);
          pendingRestoreRef.current = { book: st.book, page: typeof st.page === 'number' ? st.page : undefined, year: parsedYear };
          setSelectedBook(st.book);
          if (typeof parsedYear !== 'undefined') {
            setForm((prev)=>({ ...prev, exam_year: parsedYear === null ? '' as any : Number(parsedYear) }));
          }
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    const fetchSets = async () => {
      try {
        const resp = await fetch('/api/qbank/sets');
        const ct = resp.headers.get('content-type') || '';
        if (!ct.includes('application/json')) {
          const txt = await resp.text();
          throw new Error(`세트 목록이 올바르지 않습니다(${resp.status}).`);
        }
        const data = await resp.json();
        const items = data.items || [];
        setSets(items);
        setBooks(items.map((s: any) => ({ name: s.name })));
        // 복원: 세트 준비 후 보류 중인 복원 실행
        const pr = pendingRestoreRef.current;
        if (!restoredRef.current && pr && pr.book && items.find((x:any)=>x.name===pr.book)) {
          restoredRef.current = true;
          await loadImages(pr.book, pr.page);
          if (typeof pr.year !== 'undefined') {
            setForm((prev)=>({
              ...prev,
              exam_year: pr.year === null ? '' as any : Number(pr.year)
            }));
          }
        }
      } catch (e: any) {
        setError(e.message || '문제집 목록을 불러오지 못했습니다.');
      }
    };
    fetchSets();
  }, []);

  useEffect(() => {
    if (!selectedBook) return;
    const s = sets.find((x) => x.name === selectedBook);
    if (s) {
      setForm((prev) => ({
        ...prev,
        book_name: s.name,
        book_publisher: s.publisher || prev.book_publisher,
        book_num: s.bookNum ?? prev.book_num,
        exam_grade: typeof s.examGrade === 'number' ? s.examGrade : prev.exam_grade,
        exam_term: typeof s.examTerm === 'number' ? s.examTerm : prev.exam_term,
      }));
    }
  }, [selectedBook, sets]);

  // 선택된 문제집의 단원 목록 로드
  useEffect(() => {
    if (!selectedBook) {
      setChapters([]);
      setSelectedChapterId('');
      setSelectedSectionId('');
      return;
    }
    
    const fetchChapters = async () => {
      try {
        const resp = await fetch(`/api/qbank/chapters?book=${encodeURIComponent(selectedBook)}`);
        const data = await resp.json();
        if (!resp.ok) {
          console.warn('단원 목록 로드 실패:', data.error);
          setChapters([]);
          return;
        }
        setChapters(data.chapters || []);
        setSelectedChapterId('');
        setSelectedSectionId('');
      } catch (e: any) {
        console.warn('단원 목록 로드 오류:', e.message);
        setChapters([]);
      }
    };
    
    fetchChapters();
  }, [selectedBook]);

  // 대단원이 변경되면 소단원 선택 초기화
  useEffect(() => {
    setSelectedSectionId('');
  }, [selectedChapterId]);

  const loadImages = async (book: string, targetPage?: number) => {
    try {
      setLoading(true);
      const resp = await fetch(`/api/qbank/sets/${encodeURIComponent(book)}/images`);
      const ct = resp.headers.get('content-type') || '';
      if (!ct.includes('application/json')) {
        const txt = await resp.text();
        throw new Error(`이미지 목록 응답이 올바르지 않습니다(${resp.status}).`);
      }
      const data = await resp.json();
      const files: string[] = Array.isArray(data.items) ? data.items : [];
      setImages(files);
      const total = files.length;
      const nextIndex = typeof targetPage === 'number' && targetPage >= 1
        ? Math.max(0, Math.min(total > 0 ? total - 1 : 0, targetPage - 1))
        : 0;
      setCurrentIndex(nextIndex);
      setPageInput(total ? String(nextIndex + 1) : '');
      setError('');
    } catch (e: any) {
      setError(e.message || '이미지 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 선택된 책이 있으나 이미지가 비어 있고 복원 정보가 있으면 재시도
  useEffect(() => {
    if (!selectedBook) return;
    if ((images.length === 0) && pendingRestoreRef.current && pendingRestoreRef.current.book === selectedBook && !restoredRef.current) {
      restoredRef.current = true;
      loadImages(selectedBook, pendingRestoreRef.current.page);
    }
  }, [selectedBook, images.length]);
  
  const jumpToPage = () => {
    const total = images.length;
    const n = Math.max(1, Math.min(total || 1, Number(pageInput || '1')));
    setCurrentIndex(n - 1);
  };

  // 상태 저장: 책/페이지 변경 시 로컬 저장
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      const yr = (form.exam_year === '' || form.exam_year === null || form.exam_year === undefined) ? null : Number(form.exam_year);
      const yearVal = Number.isFinite(yr as any) ? (yr as any) : null;
      const state = { book: selectedBook, page: currentIndex + 1, year: yearVal };
      localStorage.setItem('qbank_extract_state', JSON.stringify(state));
    } catch {}
  }, [selectedBook, currentIndex, form.exam_year]);

  const onMouseDown = (e: React.MouseEvent) => {
    if (!overlayRef.current) return;
    const rect = overlayRef.current.getBoundingClientRect();
    dragStart.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    setCrop({ x: e.clientX - rect.left, y: e.clientY - rect.top, width: 0, height: 0 });
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!overlayRef.current || !dragStart.current) return;
    const rect = overlayRef.current.getBoundingClientRect();
    const x = Math.min(dragStart.current.x, e.clientX - rect.left);
    const y = Math.min(dragStart.current.y, e.clientY - rect.top);
    const width = Math.abs((e.clientX - rect.left) - dragStart.current.x);
    const height = Math.abs((e.clientY - rect.top) - dragStart.current.y);
    setCrop({ x, y, width, height });
  };

  const onMouseUp = () => {
    dragStart.current = null;
    if (crop && crop.width > 5 && crop.height > 5 && !ocrLoading) {
      runOcr();
    }
  };

  const runOcr = async () => {
    if (!imgRef.current || !overlayRef.current || !crop) return;
    try {
      setOcrLoading(true);

      const img = imgRef.current;
      const container = overlayRef.current;
      const naturalW = img.naturalWidth;
      const naturalH = img.naturalHeight;
      const contW = container.clientWidth;
      const contH = container.clientHeight;
      if (!naturalW || !naturalH || !contW || !contH) throw new Error('이미지 로드 대기 중');

      const ratio = Math.min(contW / naturalW, contH / naturalH);
      const dispW = naturalW * ratio;
      const dispH = naturalH * ratio;
      const offsetX = (contW - dispW) / 2;
      const offsetY = (contH - dispH) / 2;

      let srcX = (crop.x - offsetX) / ratio;
      let srcY = (crop.y - offsetY) / ratio;
      let srcW = crop.width / ratio;
      let srcH = crop.height / ratio;
      srcX = Math.max(0, Math.min(naturalW, srcX));
      srcY = Math.max(0, Math.min(naturalH, srcY));
      if (srcX + srcW > naturalW) srcW = Math.max(0, naturalW - srcX);
      if (srcY + srcH > naturalH) srcH = Math.max(0, naturalH - srcY);
      if (srcW < 5 || srcH < 5) throw new Error('선택 영역이 너무 작습니다');

      const canvas = document.createElement('canvas');
      canvas.width = Math.floor(srcW);
      canvas.height = Math.floor(srcH);
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('캔버스 생성 실패');
      ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      const base64 = dataUrl.split(',')[1];

      const ocrResp = await fetch('/api/qbank/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, ocrEngine }),
      });
      const ocr = await ocrResp.json();
      if (!ocrResp.ok) throw new Error(ocr.error || 'OCR 실패');

      setForm((prev) => ({
        ...prev,
        book_name: selectedBook,
        prob_text: ocr.parsed?.prob_text || prev.prob_text,
        prob_rate: ocr.parsed?.prob_rate ?? prev.prob_rate,
        exam_info: ocr.parsed?.exam_info || prev.exam_info,
        prob_num: typeof ocr.parsed?.prob_num === 'number' ? ocr.parsed.prob_num : prev.prob_num,
      }));
      
      // OCR 성공 메시지 표시
      const engineName = ocr.engine === 'gemini' ? 'Gemini' : 
                        ocr.engine === 'cloud-vision' ? 'Cloud Vision' : 
                        ocr.engine === 'external' ? '외부 API' : '알 수 없음';
      const fallbackMsg = ocr.fallback ? ' (fallback)' : '';
      console.log(`OCR 성공: ${engineName}${fallbackMsg}`);
    } catch (e: any) {
      alert(e.message || 'OCR 중 오류');
    } finally {
      setOcrLoading(false);
    }
  };

  const [saveMessage, setSaveMessage] = useState('');

  const saveProblem = async () => {
    try {
      // 빈 문제 텍스트는 저장하지 않음
      if (!String(form.prob_text || '').trim()) {
        return;
      }
      const payload = {
        examInfo: form.exam_info || selectedBook,
        examGrade: form.exam_grade,
        examYear: form.exam_year === '' ? null : Number(form.exam_year),
        examTerm: form.exam_term,
        probNum: form.prob_num,
        probArea: form.prob_area,
        probType: form.prob_type,
        probRate: form.prob_rate,
        probText: form.prob_text,
        condText: form.cond_text,
        condImages: form.cond_images,
        probImages: form.prob_images,
        solAns: form.sol_ans ?? null,
        solText: form.sol_text ?? null,
        solImages: form.sol_images ?? [],
        // book meta
        bookPublisher: form.book_publisher || null,
        bookNum: form.book_num,
        // 단원 정보
        chapterId: selectedChapterId || null,
        sectionId: selectedSectionId || null,
        problemType: problemType || null,
      };
      const resp = await fetch('/api/qbank/problems', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(result?.error || '저장 실패');
      setSaveMessage(`{ ${form.prob_num} }번 문제가 저장되었습니다.`);
      setTimeout(() => setSaveMessage(''), 2500);
    } catch (e: any) {
      alert(e.message || '저장 중 오류');
    }
  };

  useEffect(() => {
    const onKeyDown = (e: any) => {
      const tag = ((e.target && e.target.tagName) || '').toUpperCase();
      const isEditable = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (e.target && e.target.isContentEditable);
      
      if (!isEditable && (e.key === 'Enter' || e.code === 'Enter' || e.key === ' ' || e.code === 'Space')) {
        e.preventDefault();
        saveProblem();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [form, selectedBook]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-3">
          <div className={`h-9 px-3 py-1.5 text-sm rounded transition-opacity ${saveMessage ? 'opacity-100 border border-green-600 text-green-700 bg-green-50' : 'opacity-0'}`}>
            {saveMessage || ''}
          </div>
        </div>
        <div className="flex gap-4">
          <div className="flex-1 bg-card border border-default rounded-lg p-3">
            <div className="mb-3 flex items-center gap-2">
              <select className="px-3 py-2 border border-input rounded-md" value={selectedBook} onChange={(e) => { setSelectedBook(e.target.value); loadImages(e.target.value); }}>
                <option value="">책 선택</option>
                {books.map((b) => (
                  <option key={b.name} value={b.name}>{b.name}</option>
                ))}
              </select>
              {images.length > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <button className="px-2 py-1 border border-input rounded" onClick={() => setCurrentIndex((i) => Math.max(i - 1, 0))}>이전</button>
                  <span>{currentIndex + 1} / {images.length}</span>
                  <input
                    className="px-2 py-1 border border-input rounded w-20"
                    placeholder="페이지"
                    value={pageInput}
                    onChange={(e) => setPageInput(e.target.value.replace(/[^0-9]/g, ''))}
                    onKeyDown={(e:any) => { if (e.key === 'Enter') jumpToPage(); }}
                  />
                  <button className="px-2 py-1 border border-input rounded" onClick={jumpToPage}>이동</button>
                  <button className="px-2 py-1 border border-input rounded" onClick={() => setCurrentIndex((i) => Math.min(i + 1, images.length - 1))}>다음</button>
                </div>
              )}
              {/* OCR 엔진 선택 */}
              <div className="flex border border-input rounded overflow-hidden">
                <button
                  className={`px-3 py-1 text-sm transition-colors ${
                    ocrEngine === 'gemini' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-background hover:bg-muted'
                  }`}
                  onClick={() => setOcrEngine('gemini')}
                >
                  1
                </button>
                <button
                  className={`px-3 py-1 text-sm transition-colors ${
                    ocrEngine === 'cloud-vision' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-background hover:bg-muted'
                  }`}
                  onClick={() => setOcrEngine('cloud-vision')}
                >
                  2
                </button>
              </div>
              {ocrLoading && <span className="text-sm text-muted">OCR 중...</span>}
              <div className="flex-1" />
              <button className="px-3 py-2 bg-indigo-600 text-white rounded" onClick={saveProblem}>저장</button>
            </div>

            <div className="relative w-full aspect-[3/4] bg-muted overflow-hidden rounded" ref={overlayRef} onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp}>
              {imageUrl ? (
                <img ref={imgRef} src={imageUrl} alt="book" className="w-full h-full object-contain select-none" draggable={false} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted text-sm">책과 이미지를 선택하세요.</div>
              )}
              {crop && (
                <div
                  className="absolute border-2 border-indigo-500 bg-indigo-500/10"
                  style={{ left: crop.x, top: crop.y, width: crop.width, height: crop.height }}
                />
              )}
              {/* 좌우 네비게이션 버튼 */}
              {images.length > 0 && (
                <>
                  <button
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed z-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentIndex((i) => Math.max(i - 1, 0));
                    }}
                    disabled={currentIndex === 0}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed z-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentIndex((i) => Math.min(i + 1, images.length - 1));
                    }}
                    disabled={currentIndex === images.length - 1}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="w-[420px] bg-card border border-default rounded-lg p-4" onKeyDown={(e:any)=>{ if (e.key === 'Enter') { const tag=(e.target&&e.target.tagName)||''; if (tag !== 'TEXTAREA') { e.preventDefault(); saveProblem(); } } }}>
            <div className="grid grid-cols-1 gap-2">
              <div>
                <label className="block text-xs text-muted mb-1">문제 번호</label>
                <input type="number" className="px-3 py-2 border border-input rounded w-full" placeholder="문제 번호" value={form.prob_num} onChange={(e) => setForm({ ...form, prob_num: Number(e.target.value) })} />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">영역</label>
                <input className="px-3 py-2 border border-input rounded w-full" placeholder="영역" value={form.prob_area} onChange={(e) => setForm({ ...form, prob_area: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">유형</label>
                <input className="px-3 py-2 border border-input rounded w-full" placeholder="유형" value={form.prob_type} onChange={(e) => setForm({ ...form, prob_type: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">대단원</label>
                <select className="px-3 py-2 border border-input rounded w-full" value={selectedChapterId} onChange={(e) => setSelectedChapterId(e.target.value)}>
                  <option value="">대단원 선택</option>
                  {chapters.map((chapter) => (
                    <option key={chapter.id} value={chapter.id}>
                      {chapter.chapterOrder}. {chapter.chapterName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">소단원</label>
                <select className="px-3 py-2 border border-input rounded w-full" value={selectedSectionId} onChange={(e) => setSelectedSectionId(e.target.value)} disabled={!selectedChapterId}>
                  <option value="">소단원 선택</option>
                  {chapters.find(c => c.id === selectedChapterId)?.sections.map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.sectionOrder}. {section.sectionName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">문제 종류</label>
                <select className="px-3 py-2 border border-input rounded w-full" value={problemType} onChange={(e) => setProblemType(e.target.value)}>
                  <option value="">선택 안함</option>
                  <option value="key_example">대표문제</option>
                  <option value="example">예제</option>
                  <option value="practice">유제</option>
                  <option value="review">평가문제</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">연도</label>
                <input type="number" className="px-3 py-2 border border-input rounded w-full" placeholder="예: 2025" value={form.exam_year ?? ''} onChange={(e) => setForm({ ...form, exam_year: e.target.value === '' ? '' : Number(e.target.value) })} />
                <div className="mt-1 text-xs text-muted opacity-70">기출문제집은 연도 필수</div>
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">정답률(선택)</label>
                <input type="number" step="0.01" className="px-3 py-2 border border-input rounded w-full" placeholder="정답률(선택)" value={form.prob_rate ?? ''} onChange={(e) => setForm({ ...form, prob_rate: e.target.value ? Number(e.target.value) : null })} />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">문제 텍스트</label>
                <textarea className="px-3 py-2 border border-input rounded w-full" rows={6} placeholder="문제 텍스트" value={form.prob_text} onChange={(e) => setForm({ ...form, prob_text: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">문제 이미지 URL(쉼표)</label>
                <input className="px-3 py-2 border border-input rounded w-full" placeholder="문제 이미지 URL(쉼표)" value={form.prob_images.join(',')} onChange={(e) => setForm({ ...form, prob_images: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">조건 텍스트(쉼표)</label>
                <input className="px-3 py-2 border border-input rounded w-full" placeholder="조건 텍스트(쉼표)" value={form.cond_text.join(',')} onChange={(e) => setForm({ ...form, cond_text: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">조건 이미지 URL(쉼표)</label>
                <input className="px-3 py-2 border border-input rounded w-full" placeholder="조건 이미지 URL(쉼표)" value={form.cond_images.join(',')} onChange={(e) => setForm({ ...form, cond_images: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">정답</label>
                <input className="px-3 py-2 border border-input rounded w-full" placeholder="예: 3 또는 ①" value={form.sol_ans ?? ''} onChange={(e) => setForm({ ...form, sol_ans: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">풀이 텍스트</label>
                <textarea className="px-3 py-2 border border-input rounded w-full" rows={4} placeholder="풀이 설명" value={form.sol_text ?? ''} onChange={(e) => setForm({ ...form, sol_text: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">풀이 이미지 URL(쉼표)</label>
                <input className="px-3 py-2 border border-input rounded w-full" placeholder="풀이 이미지 URL(쉼표)" value={(form.sol_images || []).join(',')} onChange={(e) => setForm({ ...form, sol_images: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button className="px-4 py-2 bg-indigo-600 text-white rounded" onClick={saveProblem}>저장</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

