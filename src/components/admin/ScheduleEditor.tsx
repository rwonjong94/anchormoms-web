'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export interface ScheduleBlock {
  id: string;
  academyName: string;
  subject: string;
  color: string;
  startMin: number; // 0 ~ 900 (9:00 기준 offset, 단위: 분)
  endMin: number;   // 0 ~ 900 (exclusive)
}

export type WeeklySchedule = Record<DayKey, ScheduleBlock[]>;

interface ScheduleEditorProps {
  value: WeeklySchedule;
  onChange: (next: WeeklySchedule) => void;
}

const DAYS: { key: DayKey; label: string }[] = [
  { key: 'mon', label: '월' },
  { key: 'tue', label: '화' },
  { key: 'wed', label: '수' },
  { key: 'thu', label: '목' },
  { key: 'fri', label: '금' },
  { key: 'sat', label: '토' },
  { key: 'sun', label: '일' },
];

const START_HOUR = 9;
const END_HOUR = 24; // 자정
const TOTAL_MINUTES = (END_HOUR - START_HOUR) * 60; // 900
const SLOT_MINUTES = 30;
const SLOTS = TOTAL_MINUTES / SLOT_MINUTES; // 30
const ROW_HEIGHT = 22; // 한 칸 높이(px)
const GRID_HEIGHT = SLOTS * ROW_HEIGHT; // 전체 높이

// 색상 프리셋
const COLOR_PRESETS = [
  { color: '#3b82f6', label: '파랑', subjects: ['수학', '수학교과', '사고력'] },
  { color: '#10b981', label: '초록', subjects: ['영어', '영어회화'] },
  { color: '#f59e0b', label: '주황', subjects: ['국어', '논술'] },
  { color: '#ef4444', label: '빨강', subjects: ['과학', '실험'] },
  { color: '#8b5cf6', label: '보라', subjects: ['예체능', '미술', '음악'] },
  { color: '#ec4899', label: '핑크', subjects: ['피아노', '바이올린'] },
  { color: '#06b6d4', label: '청록', subjects: ['코딩', '컴퓨터'] },
  { color: '#84cc16', label: '연두', subjects: ['태권도', '수영', '체육'] },
  { color: '#f97316', label: '오렌지', subjects: ['중국어', '일본어'] },
  { color: '#6366f1', label: '인디고', subjects: ['역사', '사회'] },
  { color: '#14b8a6', label: '틸', subjects: ['독서', '글쓰기'] },
  { color: '#a855f7', label: '퍼플', subjects: ['기타'] },
];

// 과목명으로 색상 자동 추천
function getRecommendedColor(subject: string): string {
  const lowerSubject = subject.toLowerCase();
  for (const preset of COLOR_PRESETS) {
    if (preset.subjects.some(s => lowerSubject.includes(s.toLowerCase()))) {
      return preset.color;
    }
  }
  return '#3b82f6'; // 기본 파랑
}

// 시간 충돌 감지: 같은 요일에 겹치는 블록들을 찾음
function detectConflicts(blocks: ScheduleBlock[]): Map<string, number> {
  // 블록 ID -> 충돌 그룹 인덱스 (0부터 시작, 겹치는 블록들끼리 다른 인덱스)
  const conflictMap = new Map<string, number>();

  // 시작 시간 기준 정렬
  const sorted = [...blocks].sort((a, b) => a.startMin - b.startMin);

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];
    let maxConflictIndex = -1;

    // 이전 블록들과 충돌 확인
    for (let j = 0; j < i; j++) {
      const prev = sorted[j];
      // 시간이 겹치는지 확인
      if (prev.endMin > current.startMin) {
        const prevIndex = conflictMap.get(prev.id) ?? 0;
        maxConflictIndex = Math.max(maxConflictIndex, prevIndex);
      }
    }

    conflictMap.set(current.id, maxConflictIndex + 1);
  }

  return conflictMap;
}

// 특정 블록과 충돌하는 블록 수 계산
function countConflicts(blocks: ScheduleBlock[], blockId: string): number {
  const block = blocks.find(b => b.id === blockId);
  if (!block) return 0;

  return blocks.filter(b =>
    b.id !== blockId &&
    b.startMin < block.endMin &&
    b.endMin > block.startMin
  ).length;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function minutesToLabel(minFromStart: number): string {
  const total = START_HOUR * 60 + minFromStart;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

function labelToMinutes(label: string): number {
  // HH:MM -> offset minutes from 9:00
  const [hh, mm] = label.split(':').map((v) => parseInt(v, 10));
  return clamp((hh - START_HOUR) * 60 + mm, 0, TOTAL_MINUTES);
}

function makeEmptyWeeklySchedule(): WeeklySchedule {
  return {
    mon: [],
    tue: [],
    wed: [],
    thu: [],
    fri: [],
    sat: [],
    sun: [],
  };
}

function ensureWeeklySchedule(obj: any): WeeklySchedule {
  const empty = makeEmptyWeeklySchedule();
  const next: WeeklySchedule = { ...empty };
  for (const d of DAYS) {
    const arr = Array.isArray(obj?.[d.key]) ? obj[d.key] : [];
    next[d.key] = arr
      .map((b: any) => ({
        id: String(b?.id ?? crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`),
        academyName: String(b?.academyName ?? ''),
        subject: String(b?.subject ?? ''),
        color: String(b?.color ?? '#60a5fa'),
        startMin: clamp(Number(b?.startMin ?? 0), 0, TOTAL_MINUTES - SLOT_MINUTES),
        endMin: clamp(Number(b?.endMin ?? SLOT_MINUTES), SLOT_MINUTES, TOTAL_MINUTES),
      }))
      .filter((b: ScheduleBlock) => b.endMin > b.startMin);
  }
  return next;
}

interface EditModalState {
  open: boolean;
  day: DayKey;
  block: ScheduleBlock | null;
  mode: 'create' | 'edit';
}

export default function ScheduleEditor({ value, onChange }: ScheduleEditorProps) {
  const schedule = useMemo(() => ensureWeeklySchedule(value), [value]);
  // 전체 8열 그리드(시간 1 + 요일 7)를 참조
  const gridRef = useRef<HTMLDivElement | null>(null);

  const [dragState, setDragState] = useState<{
    type: 'select' | 'move' | 'resize-top' | 'resize-bottom' | null;
    day: DayKey | null;
    blockId?: string;
    startY?: number;
    startMin?: number;
    initialStartMin?: number;
    initialEndMin?: number;
    offsetY?: number;
    originalDay?: DayKey; // 이동 시작 시 원래 요일
    currentHoverDay?: DayKey; // 현재 마우스가 위치한 요일
  }>({ type: null, day: null });

  const [editModal, setEditModal] = useState<EditModalState>({
    open: false,
    day: 'mon',
    block: null,
    mode: 'create',
  });

  const [selectRange, setSelectRange] = useState<{ day: DayKey | null; startMin: number; endMin: number } | null>(null);
  // 추가 시간(같은 내용으로 요일/시간만 다른 블록들)
  const [extraSlots, setExtraSlots] = useState<Array<{ day: DayKey; startMin: number; endMin: number }>>([]);
  // 선택된 블록 (키보드 삭제용)
  const [selectedBlock, setSelectedBlock] = useState<{ day: DayKey; id: string } | null>(null);

  // Undo/Redo 히스토리
  const [history, setHistory] = useState<WeeklySchedule[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isUndoRedoRef = useRef(false);

  // 클립보드 (복사된 블록)
  const [clipboard, setClipboard] = useState<ScheduleBlock | null>(null);

  // 히스토리에 현재 상태 저장
  const saveToHistory = useCallback((state: WeeklySchedule) => {
    if (isUndoRedoRef.current) {
      isUndoRedoRef.current = false;
      return;
    }
    setHistory((prev) => {
      // 현재 인덱스 이후의 히스토리 삭제 (새 분기)
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(state);
      // 최대 50개까지만 유지
      if (newHistory.length > 50) {
        newHistory.shift();
        return newHistory;
      }
      return newHistory;
    });
    setHistoryIndex((prev) => Math.min(prev + 1, 49));
  }, [historyIndex]);

  // Undo
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      isUndoRedoRef.current = true;
      const prevState = history[historyIndex - 1];
      setHistoryIndex((prev) => prev - 1);
      onChange(prevState);
    }
  }, [history, historyIndex, onChange]);

  // Redo
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      isUndoRedoRef.current = true;
      const nextState = history[historyIndex + 1];
      setHistoryIndex((prev) => prev + 1);
      onChange(nextState);
    }
  }, [history, historyIndex, onChange]);

  // 복사
  const copyBlock = useCallback(() => {
    if (!selectedBlock) return;
    const block = schedule[selectedBlock.day].find((b) => b.id === selectedBlock.id);
    if (block) {
      setClipboard({ ...block });
    }
  }, [selectedBlock, schedule]);

  // 붙여넣기
  const pasteBlock = useCallback((targetDay?: DayKey) => {
    if (!clipboard) return;
    const day = targetDay || selectedBlock?.day || 'mon';
    const newId = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
    const next: WeeklySchedule = { ...schedule, [day]: [...schedule[day]] };
    next[day].push({ ...clipboard, id: newId });
    saveToHistory(schedule);
    onChange(next);
  }, [clipboard, selectedBlock, schedule, onChange, saveToHistory]);

  const commit = useCallback(
    (next: WeeklySchedule) => {
      saveToHistory(schedule);
      onChange(next);
    },
    [onChange, schedule, saveToHistory]
  );

  const updateBlock = useCallback(
    (day: DayKey, blockId: string, updater: (b: ScheduleBlock) => ScheduleBlock | null) => {
      const next: WeeklySchedule = { ...schedule, [day]: [...schedule[day]] };
      const idx = next[day].findIndex((b) => b.id === blockId);
      if (idx === -1) return;
      const updated = updater(next[day][idx]);
      if (updated) {
        next[day][idx] = updated;
      } else {
        next[day].splice(idx, 1);
      }
      commit(next);
    },
    [schedule, commit]
  );

  const addBlock = useCallback(
    (day: DayKey, block: Omit<ScheduleBlock, 'id'>) => {
      const next: WeeklySchedule = { ...schedule, [day]: [...schedule[day]] };
      const id = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
      next[day].push({ ...block, id });
      commit(next);
    },
    [schedule, commit]
  );

  const removeBlock = useCallback(
    (day: DayKey, blockId: string) => {
      const next: WeeklySchedule = { ...schedule, [day]: schedule[day].filter((b) => b.id !== blockId) };
      commit(next);
    },
    [schedule, commit]
  );

  // 블록을 다른 요일로 이동
  const moveBlockToDay = useCallback(
    (fromDay: DayKey, toDay: DayKey, blockId: string, newStartMin: number, newEndMin: number) => {
      const block = schedule[fromDay].find((b) => b.id === blockId);
      if (!block) return;

      const next: WeeklySchedule = { ...schedule };
      // 원래 요일에서 제거
      next[fromDay] = schedule[fromDay].filter((b) => b.id !== blockId);
      // 새 요일에 추가
      next[toDay] = [...schedule[toDay], { ...block, startMin: newStartMin, endMin: newEndMin }];
      commit(next);
    },
    [schedule, commit]
  );

  // 키보드 단축키 핸들러
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 입력 필드에서는 Undo/Redo/Copy/Paste 외에는 동작 안 함
      const isInputField = (e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA';

      // 모달이 열려있을 때 Escape로 닫기
      if (e.key === 'Escape') {
        if (editModal.open) {
          setEditModal((m) => ({ ...m, open: false }));
          setExtraSlots([]);
          e.preventDefault();
        } else if (selectedBlock) {
          setSelectedBlock(null);
          e.preventDefault();
        }
        return;
      }

      // Ctrl+Z: Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey && !editModal.open) {
        e.preventDefault();
        undo();
        return;
      }

      // Ctrl+Shift+Z 또는 Ctrl+Y: Redo
      if ((e.ctrlKey || e.metaKey) && ((e.key === 'z' && e.shiftKey) || e.key === 'y') && !editModal.open) {
        e.preventDefault();
        redo();
        return;
      }

      // Ctrl+C: 복사
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedBlock && !editModal.open && !isInputField) {
        e.preventDefault();
        copyBlock();
        return;
      }

      // Ctrl+V: 붙여넣기
      if ((e.ctrlKey || e.metaKey) && e.key === 'v' && clipboard && !editModal.open && !isInputField) {
        e.preventDefault();
        pasteBlock();
        return;
      }

      // Delete 또는 Backspace로 선택된 블록 삭제
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedBlock && !editModal.open) {
        if (isInputField) return;
        removeBlock(selectedBlock.day, selectedBlock.id);
        setSelectedBlock(null);
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editModal.open, selectedBlock, removeBlock, undo, redo, copyBlock, pasteBlock, clipboard]);

  const getDayFromClientX = (clientX: number): DayKey | null => {
    const grid = gridRef.current;
    if (!grid) return null;
    const rect = grid.getBoundingClientRect();
    // 8등분 중 첫 번째(시간) 열을 제외한 7일만 계산
    const colTotal = 8;
    const timeColWidth = rect.width / colTotal;
    const daysAreaWidth = rect.width - timeColWidth;
    const dayColWidth = daysAreaWidth / DAYS.length;
    const dxFromDays = clientX - rect.left - timeColWidth;
    if (dxFromDays < 0) return null;
    const idx = Math.floor(dxFromDays / dayColWidth);
    if (idx < 0 || idx >= DAYS.length) return null;
    return DAYS[idx].key;
  };

  const getMinFromClientY = (clientY: number): number => {
    const grid = gridRef.current;
    if (!grid) return 0;
    const rect = grid.getBoundingClientRect();
    const dy = clientY - rect.top;
    const slot = Math.round(dy / ROW_HEIGHT);
    return clamp(slot * SLOT_MINUTES, 0, TOTAL_MINUTES);
  };

  const handleGridMouseDown = (e: React.MouseEvent) => {
    // 빈 영역 드래그 선택 시작
    if (e.button !== 0) return;
    const day = getDayFromClientX(e.clientX);
    if (!day) return;
    // 빈 영역 클릭 시 선택 해제
    setSelectedBlock(null);
    const startMin = getMinFromClientY(e.clientY);
    setDragState({ type: 'select', day, startY: e.clientY, startMin });
    setSelectRange({ day, startMin, endMin: startMin + SLOT_MINUTES });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragState.type) return;
    if (dragState.type === 'select' && dragState.day) {
      const endMin = getMinFromClientY(e.clientY);
      const s = Math.min(dragState.startMin ?? 0, endMin);
      const t = Math.max(dragState.startMin ?? 0, endMin);
      setSelectRange({
        day: dragState.day,
        startMin: clamp(s, 0, TOTAL_MINUTES - SLOT_MINUTES),
        endMin: clamp(t, SLOT_MINUTES, TOTAL_MINUTES),
      });
    } else if (dragState.type === 'move' && dragState.day && dragState.blockId) {
      const min = getMinFromClientY(e.clientY);
      const hoverDay = getDayFromClientX(e.clientX);
      const delta = (min - (dragState.startMin ?? 0));
      const newStart = clamp((dragState.initialStartMin ?? 0) + delta, 0, TOTAL_MINUTES - SLOT_MINUTES);
      const duration = (dragState.initialEndMin ?? 0) - (dragState.initialStartMin ?? 0);
      const newEnd = clamp(newStart + duration, SLOT_MINUTES, TOTAL_MINUTES);

      // 요일이 변경된 경우
      if (hoverDay && hoverDay !== dragState.day) {
        moveBlockToDay(dragState.day, hoverDay, dragState.blockId, newStart, newEnd);
        setDragState((s) => ({
          ...s,
          day: hoverDay,
          startMin: min,
          initialStartMin: newStart,
          initialEndMin: newEnd,
        }));
      } else {
        // 같은 요일 내 시간만 변경
        updateBlock(dragState.day, dragState.blockId, (b) => ({ ...b, startMin: newStart, endMin: newEnd }));
        setDragState((s) => ({ ...s, startMin: min }));
      }
    } else if ((dragState.type === 'resize-top' || dragState.type === 'resize-bottom') && dragState.day && dragState.blockId) {
      const min = getMinFromClientY(e.clientY);
      if (dragState.type === 'resize-top') {
        const newStart = clamp(Math.min(min, (dragState.initialEndMin ?? SLOT_MINUTES) - SLOT_MINUTES), 0, TOTAL_MINUTES - SLOT_MINUTES);
        updateBlock(dragState.day, dragState.blockId, (b) => ({ ...b, startMin: newStart }));
      } else {
        const newEnd = clamp(Math.max(min, (dragState.initialStartMin ?? 0) + SLOT_MINUTES), SLOT_MINUTES, TOTAL_MINUTES);
        updateBlock(dragState.day, dragState.blockId, (b) => ({ ...b, endMin: newEnd }));
      }
    }
  };

  const handleMouseUp = () => {
    if (dragState.type === 'select' && selectRange?.day) {
      // 선택 완료 시 생성 모달
      setEditModal({
        open: true,
        day: selectRange.day,
        block: {
          id: '',
          academyName: '',
          subject: '',
          color: '#60a5fa',
          startMin: selectRange.startMin,
          endMin: Math.max(selectRange.endMin, selectRange.startMin + SLOT_MINUTES),
        },
        mode: 'create',
      });
    }
    setDragState({ type: null, day: null });
    setSelectRange(null);
  };

  const beginMove = (day: DayKey, block: ScheduleBlock) => (e: React.MouseEvent) => {
    e.stopPropagation();
    setDragState({
      type: 'move',
      day,
      blockId: block.id,
      startY: e.clientY,
      startMin: getMinFromClientY(e.clientY),
      initialStartMin: block.startMin,
      initialEndMin: block.endMin,
    });
  };

  const beginResize = (day: DayKey, block: ScheduleBlock, which: 'top' | 'bottom') => (e: React.MouseEvent) => {
    e.stopPropagation();
    setDragState({
      type: which === 'top' ? 'resize-top' : 'resize-bottom',
      day,
      blockId: block.id,
      startY: e.clientY,
      initialStartMin: block.startMin,
      initialEndMin: block.endMin,
    });
  };

  const openEdit = (day: DayKey, block: ScheduleBlock) => (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditModal({ open: true, day, block: { ...block }, mode: 'edit' });
  };

  const closeModal = () => {
    setEditModal((m) => ({ ...m, open: false }));
    setExtraSlots([]); // 추가 시간 초기화
  };

  const saveModal = () => {
    if (!editModal.open || !editModal.block) return;
    const { day, mode, block } = editModal;
    const normalized: ScheduleBlock = {
      ...block,
      startMin: Math.min(block.startMin, block.endMin - SLOT_MINUTES),
      endMin: Math.max(block.endMin, block.startMin + SLOT_MINUTES),
    };
    if (mode === 'create') {
      // 여러 번 addBlock 호출 시 최신 state가 덮여써지는 문제를 피하기 위해
      // 한 번에 next 스케줄을 만들어서 커밋
      const next: WeeklySchedule = { ...schedule };
      const ensureDayArray = (d: DayKey) => {
        if (next[d] === schedule[d]) {
          next[d] = [...schedule[d]];
        }
      };
      // 기본 시간 추가
      ensureDayArray(day);
      next[day].push({
        id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
        academyName: normalized.academyName,
        subject: normalized.subject,
        color: normalized.color,
        startMin: normalized.startMin,
        endMin: normalized.endMin,
      });
      // 추가 시간들 추가
      for (const s of extraSlots) {
        const start = clamp(Math.min(s.startMin, s.endMin - SLOT_MINUTES), 0, TOTAL_MINUTES - SLOT_MINUTES);
        const end = clamp(Math.max(s.endMin, s.startMin + SLOT_MINUTES), SLOT_MINUTES, TOTAL_MINUTES);
        ensureDayArray(s.day);
        next[s.day].push({
          id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
          academyName: normalized.academyName,
          subject: normalized.subject,
          color: normalized.color,
          startMin: start,
          endMin: end,
        });
      }
      commit(next);
    } else {
      updateBlock(day, normalized.id, () => normalized);
    }
    closeModal();
  };

  const deleteModal = () => {
    if (!editModal.open || !editModal.block) return;
    removeBlock(editModal.day, editModal.block.id);
    closeModal();
  };

  const hours = useMemo(() => {
    const list: { label: string; offset: number }[] = [];
    for (let h = START_HOUR; h <= END_HOUR; h++) {
      list.push({ label: `${h}:00`, offset: (h - START_HOUR) * 60 });
    }
    return list;
  }, []);

  return (
    <div className="w-full">
      {/* 툴바 */}
      <div className="flex items-center justify-between mb-3 pb-3 border-b border-default">
        <div className="flex items-center gap-2">
          {/* Undo/Redo 버튼 */}
          <button
            type="button"
            onClick={undo}
            disabled={historyIndex <= 0}
            className={`px-2 py-1 text-sm rounded border transition-colors ${
              historyIndex > 0
                ? 'border-default hover:bg-muted/50 text-title'
                : 'border-default/50 text-muted cursor-not-allowed'
            }`}
            title="되돌리기 (Ctrl+Z)"
          >
            ↩ 되돌리기
          </button>
          <button
            type="button"
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            className={`px-2 py-1 text-sm rounded border transition-colors ${
              historyIndex < history.length - 1
                ? 'border-default hover:bg-muted/50 text-title'
                : 'border-default/50 text-muted cursor-not-allowed'
            }`}
            title="다시 실행 (Ctrl+Shift+Z)"
          >
            ↪ 다시 실행
          </button>

          {/* 구분선 */}
          <div className="w-px h-6 bg-default mx-1"></div>

          {/* 복사/붙여넣기 버튼 */}
          <button
            type="button"
            onClick={copyBlock}
            disabled={!selectedBlock}
            className={`px-2 py-1 text-sm rounded border transition-colors ${
              selectedBlock
                ? 'border-default hover:bg-muted/50 text-title'
                : 'border-default/50 text-muted cursor-not-allowed'
            }`}
            title="복사 (Ctrl+C)"
          >
            📋 복사
          </button>
          <button
            type="button"
            onClick={() => pasteBlock()}
            disabled={!clipboard}
            className={`px-2 py-1 text-sm rounded border transition-colors ${
              clipboard
                ? 'border-default hover:bg-muted/50 text-title'
                : 'border-default/50 text-muted cursor-not-allowed'
            }`}
            title="붙여넣기 (Ctrl+V)"
          >
            📄 붙여넣기
          </button>
        </div>

        {/* 상태 표시 */}
        <div className="flex items-center gap-3 text-xs text-muted">
          {clipboard && (
            <span className="flex items-center gap-1 px-2 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded">
              <span className="w-3 h-3 rounded" style={{ backgroundColor: clipboard.color }}></span>
              복사됨: {clipboard.academyName || clipboard.subject || '(이름 없음)'}
            </span>
          )}
          {selectedBlock && (
            <span className="px-2 py-1 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 rounded">
              선택됨
            </span>
          )}
          {history.length > 0 && (
            <span className="text-muted">
              히스토리: {historyIndex + 1}/{history.length}
            </span>
          )}
        </div>
      </div>

      {/* 타임라인 헤더 */}
      <div className="grid grid-cols-8 gap-0 mb-2">
        <div className="text-sm text-muted h-6 flex items-center justify-center px-2">시간</div>
        {DAYS.map((d) => (
          <div key={d.key} className="text-sm text-title h-6 flex items-center justify-center font-semibold">
            {d.label}
          </div>
        ))}
      </div>

      {/* 타임라인 + 그리드 */}
      <div
        className="grid grid-cols-8 gap-0 border border-default rounded-xl overflow-hidden select-none bg-gradient-to-b from-white to-muted/40"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        ref={gridRef}
      >
        {/* 시간 눈금 */}
        <div className="relative bg-muted/50">
          <div style={{ height: GRID_HEIGHT }} className="relative">
            {hours.map((h, idx) => (
              <div
                key={idx}
                className="absolute left-0 right-0 border-t border-default/60 text-[12px] text-muted text-center"
                style={{ top: (h.offset / SLOT_MINUTES) * ROW_HEIGHT }}
              >
                {h.label}
              </div>
            ))}
          </div>
        </div>

        {/* 7일 그리드 */}
        {DAYS.map((d) => (
          <div
            key={d.key}
            className="relative bg-card cursor-crosshair transition-colors hover:bg-muted/10"
            onMouseDown={handleGridMouseDown}
            style={{ height: GRID_HEIGHT }}
          >
            {/* 배경 라인 (30분 간격) */}
            {[...Array(SLOTS)].map((_, i) => (
              <div
                key={i}
                className={`absolute left-0 right-0 ${i % 2 === 0 ? 'bg-transparent' : 'bg-muted/30'} border-t border-default/30`}
                style={{ top: i * ROW_HEIGHT, height: ROW_HEIGHT }}
              />
            ))}

            {/* 선택 범위 */}
            {selectRange && selectRange.day === d.key && (
              <div
                className="absolute left-1 right-1 bg-blue-500/25 border border-blue-400 rounded-md backdrop-blur-[2px]"
                style={{
                  top: (selectRange.startMin / SLOT_MINUTES) * ROW_HEIGHT,
                  height: ((selectRange.endMin - selectRange.startMin) / SLOT_MINUTES) * ROW_HEIGHT,
                }}
              />
            )}

            {/* 스케줄 블록 */}
            {(() => {
              const dayBlocks = schedule[d.key];
              const conflictMap = detectConflicts(dayBlocks);
              const maxConflict = Math.max(0, ...Array.from(conflictMap.values()));
              const columnCount = maxConflict + 1;

              return dayBlocks.map((b) => {
                const top = (b.startMin / SLOT_MINUTES) * ROW_HEIGHT;
                const height = ((b.endMin - b.startMin) / SLOT_MINUTES) * ROW_HEIGHT;
                const conflictIndex = conflictMap.get(b.id) ?? 0;
                const hasConflict = countConflicts(dayBlocks, b.id) > 0;
                const isSelected = selectedBlock?.day === d.key && selectedBlock?.id === b.id;

                // 충돌 시 블록 너비와 위치 조정
                const columnWidth = columnCount > 1 ? (100 / columnCount) : 100;
                const leftOffset = conflictIndex * columnWidth;

                return (
                  <div
                    key={b.id}
                    className={`absolute rounded-lg shadow-md border text-xs text-white overflow-hidden transition-all ${
                      isSelected
                        ? 'ring-2 ring-offset-1 ring-yellow-400 z-20'
                        : 'ring-1 ring-black/5'
                    } ${hasConflict ? 'border-dashed' : ''}`}
                    style={{
                      top,
                      height,
                      backgroundColor: b.color || '#60a5fa',
                      borderColor: hasConflict ? '#ef4444' : (b.color || '#60a5fa'),
                      left: columnCount > 1 ? `calc(4px + ${leftOffset}%)` : '4px',
                      width: columnCount > 1 ? `calc(${columnWidth}% - 8px)` : 'calc(100% - 8px)',
                      zIndex: isSelected ? 20 : 10,
                    }}
                    onMouseDown={(e) => {
                      setSelectedBlock({ day: d.key, id: b.id });
                      beginMove(d.key, b)(e);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedBlock({ day: d.key, id: b.id });
                    }}
                    onDoubleClick={openEdit(d.key, b)}
                  >
                    {/* 충돌 경고 아이콘 */}
                    {hasConflict && (
                      <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] px-1 rounded-bl" title="시간 충돌">
                        ⚠
                      </div>
                    )}
                    <div className="flex items-center justify-between px-2 py-1 bg-black/10">
                      <span className="truncate">
                        {b.academyName} {b.subject ? `• ${b.subject}` : ''}
                      </span>
                    </div>
                    {height > 30 && (
                      <div className="px-2 py-1 bg-black/5">
                        <div>{minutesToLabel(b.startMin)} ~ {minutesToLabel(b.endMin)}</div>
                      </div>
                    )}
                    {/* 리사이즈 핸들 */}
                    <div
                      className="absolute left-2 right-2 h-1 cursor-n-resize rounded-full bg-white/40 hover:bg-white/70 transition-colors"
                      style={{ top: 0 }}
                      onMouseDown={beginResize(d.key, b, 'top')}
                    />
                    <div
                      className="absolute left-2 right-2 h-1 cursor-s-resize rounded-full bg-white/40 hover:bg-white/70 transition-colors"
                      style={{ bottom: 0 }}
                      onMouseDown={beginResize(d.key, b, 'bottom')}
                    />
                  </div>
                );
              });
            })()}
          </div>
        ))}
      </div>

      {/* 편집 모달 */}
      {editModal.open && editModal.block && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onMouseDown={closeModal}>
          <div className="bg-card border border-default rounded-lg w-full max-w-lg mx-4 p-4" onMouseDown={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-title">{editModal.mode === 'create' ? '새 스케줄 추가' : '스케줄 수정'}</h3>
              <button className="text-muted hover:text-body" onClick={closeModal}>✕</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs text-muted mb-1">요일</label>
                <select
                  className="w-full px-3 py-2 border border-input bg-card text-title rounded"
                  value={editModal.day}
                  onChange={(e) => setEditModal((m) => ({ ...m, day: e.target.value as DayKey }))}
                >
                  {DAYS.map((d) => (
                    <option key={d.key} value={d.key}>{d.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">학원명</label>
                <input
                  className="w-full px-3 py-2 border border-input bg-card text-title rounded"
                  value={editModal.block.academyName}
                  onChange={(e) => setEditModal((m) => ({ ...m, block: { ...m.block!, academyName: e.target.value } }))}
                />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">과목명</label>
                <input
                  className="w-full px-3 py-2 border border-input bg-card text-title rounded"
                  value={editModal.block.subject}
                  onChange={(e) => {
                    const newSubject = e.target.value;
                    const recommendedColor = getRecommendedColor(newSubject);
                    setEditModal((m) => ({
                      ...m,
                      block: {
                        ...m.block!,
                        subject: newSubject,
                        // 기본 색상이거나 빈 상태일 때만 자동 변경
                        color: m.block!.color === '#60a5fa' || m.block!.color === '#3b82f6'
                          ? recommendedColor
                          : m.block!.color,
                      },
                    }));
                  }}
                  placeholder="예: 수학, 영어, 피아노..."
                />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">시작 시간</label>
                <select
                  className="w-full px-3 py-2 border border-input bg-card text-title rounded"
                  value={minutesToLabel(editModal.block.startMin)}
                  onChange={(e) => setEditModal((m) => ({ ...m, block: { ...m.block!, startMin: labelToMinutes(e.target.value) } }))}
                >
                  {Array.from({ length: SLOTS + 1 }).map((_, i) => {
                    const label = minutesToLabel(i * SLOT_MINUTES);
                    return <option key={i} value={label}>{label}</option>;
                  })}
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">종료 시간</label>
                <select
                  className="w-full px-3 py-2 border border-input bg-card text-title rounded"
                  value={minutesToLabel(editModal.block.endMin)}
                  onChange={(e) => setEditModal((m) => ({ ...m, block: { ...m.block!, endMin: labelToMinutes(e.target.value) } }))}
                >
                  {Array.from({ length: SLOTS + 1 }).map((_, i) => {
                    const label = minutesToLabel(i * SLOT_MINUTES);
                    return <option key={i} value={label}>{label}</option>;
                  })}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-muted mb-1">색상</label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.color}
                      type="button"
                      className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                        editModal.block.color === preset.color
                          ? 'border-gray-800 dark:border-white ring-2 ring-offset-2 ring-gray-400'
                          : 'border-transparent'
                      }`}
                      style={{ backgroundColor: preset.color }}
                      onClick={() => setEditModal((m) => ({ ...m, block: { ...m.block!, color: preset.color } }))}
                      title={`${preset.label} (${preset.subjects.join(', ')})`}
                    />
                  ))}
                  {/* 커스텀 색상 선택 */}
                  <div className="relative">
                    <input
                      type="color"
                      className="absolute inset-0 w-8 h-8 opacity-0 cursor-pointer"
                      value={editModal.block.color}
                      onChange={(e) => setEditModal((m) => ({ ...m, block: { ...m.block!, color: e.target.value } }))}
                    />
                    <div
                      className={`w-8 h-8 rounded-full border-2 border-dashed border-gray-400 flex items-center justify-center text-gray-400 hover:border-gray-600 hover:text-gray-600 ${
                        !COLOR_PRESETS.some(p => p.color === editModal.block.color) ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                      }`}
                      style={!COLOR_PRESETS.some(p => p.color === editModal.block.color) ? { backgroundColor: editModal.block.color } : {}}
                    >
                      {COLOR_PRESETS.some(p => p.color === editModal.block.color) && '+'}
                    </div>
                  </div>
                </div>
                {/* 선택된 색상에 해당하는 과목 힌트 */}
                {COLOR_PRESETS.find(p => p.color === editModal.block.color) && (
                  <div className="text-xs text-muted mt-1">
                    추천 과목: {COLOR_PRESETS.find(p => p.color === editModal.block.color)?.subjects.join(', ')}
                  </div>
                )}
              </div>
            </div>

            {/* 추가 시간 (같은 내용으로 여러 요일/시간 생성) */}
            {editModal.mode === 'create' && (
              <div className="mt-4 border-t border-default pt-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-title">추가 시간</h4>
                  <button
                    className="px-2 py-1 text-xs border border-input rounded hover:bg-hover"
                    onClick={() => {
                      setExtraSlots((prev) => ([
                        ...prev,
                        {
                          day: editModal.day,
                          startMin: editModal.block!.startMin,
                          endMin: editModal.block!.endMin,
                        }
                      ]));
                    }}
                  >
                    + 시간 추가
                  </button>
                </div>
                {extraSlots.length === 0 ? (
                  <div className="text-xs text-muted">추가할 시간이 없습니다. “+ 시간 추가”를 눌러 동일 내용의 다른 요일/시간을 추가하세요.</div>
                ) : (
                  <div className="space-y-2">
                    {extraSlots.map((slot, idx) => (
                      <div key={idx} className="grid grid-cols-2 gap-3 items-end">
                        <div>
                          <label className="block text-xs text-muted mb-1">요일</label>
                          <select
                            className="w-full px-3 py-2 border border-input bg-card text-title rounded"
                            value={slot.day}
                            onChange={(e) => {
                              const v = e.target.value as DayKey;
                              setExtraSlots((prev) => {
                                const next = [...prev];
                                next[idx] = { ...next[idx], day: v };
                                return next;
                              });
                            }}
                          >
                            {DAYS.map((d) => (
                              <option key={d.key} value={d.key}>{d.label}</option>
                            ))}
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs text-muted mb-1">시작</label>
                            <select
                              className="w-full px-2 py-2 border border-input bg-card text-title rounded"
                              value={minutesToLabel(slot.startMin)}
                              onChange={(e) => {
                                const v = labelToMinutes(e.target.value);
                                setExtraSlots((prev) => {
                                  const next = [...prev];
                                  next[idx] = { ...next[idx], startMin: v };
                                  return next;
                                });
                              }}
                            >
                              {Array.from({ length: SLOTS + 1 }).map((_, i) => {
                                const label = minutesToLabel(i * SLOT_MINUTES);
                                return <option key={i} value={label}>{label}</option>;
                              })}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-muted mb-1">종료</label>
                            <select
                              className="w-full px-2 py-2 border border-input bg-card text-title rounded"
                              value={minutesToLabel(slot.endMin)}
                              onChange={(e) => {
                                const v = labelToMinutes(e.target.value);
                                setExtraSlots((prev) => {
                                  const next = [...prev];
                                  next[idx] = { ...next[idx], endMin: v };
                                  return next;
                                });
                              }}
                            >
                              {Array.from({ length: SLOTS + 1 }).map((_, i) => {
                                const label = minutesToLabel(i * SLOT_MINUTES);
                                return <option key={i} value={label}>{label}</option>;
                              })}
                            </select>
                          </div>
                        </div>
                        <div className="col-span-2 flex justify-end">
                          <button
                            className="px-2 py-1 text-xs border border-red-300 text-red-600 rounded hover:bg-red-50"
                            onClick={() => setExtraSlots((prev) => prev.filter((_, i) => i !== idx))}
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-between mt-4">
              {editModal.mode === 'edit' ? (
                <button className="px-4 py-2 text-red-600 hover:bg-red-50 rounded border border-red-200" onClick={deleteModal}>
                  삭제
                </button>
              ) : <div />}
              <div className="flex gap-2">
                <button className="px-4 py-2 rounded border border-input hover:bg-hover" onClick={closeModal}>취소</button>
                <button className="px-4 py-2 rounded bg-primary text-primary-foreground" onClick={saveModal}>저장</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


