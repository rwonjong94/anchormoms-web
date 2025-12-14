'use client';

import { useCallback, useMemo, useRef, useState } from 'react';

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

  const commit = useCallback(
    (next: WeeklySchedule) => {
      onChange(next);
    },
    [onChange]
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
      const delta = (min - (dragState.startMin ?? 0));
      const newStart = clamp((dragState.initialStartMin ?? 0) + delta, 0, TOTAL_MINUTES - SLOT_MINUTES);
      const duration = (dragState.initialEndMin ?? 0) - (dragState.initialStartMin ?? 0);
      const newEnd = clamp(newStart + duration, SLOT_MINUTES, TOTAL_MINUTES);
      updateBlock(dragState.day, dragState.blockId, (b) => ({ ...b, startMin: newStart, endMin: newEnd }));
      setDragState((s) => ({ ...s, startMin: min }));
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
            {schedule[d.key].map((b) => {
              const top = (b.startMin / SLOT_MINUTES) * ROW_HEIGHT;
              const height = ((b.endMin - b.startMin) / SLOT_MINUTES) * ROW_HEIGHT;
              return (
                <div
                  key={b.id}
                  className="absolute left-1 right-1 rounded-lg shadow-md border text-xs text-white overflow-hidden ring-1 ring-black/5"
                  style={{ top, height, backgroundColor: b.color || '#60a5fa', borderColor: b.color || '#60a5fa' }}
                  onMouseDown={beginMove(d.key, b)}
                  onDoubleClick={openEdit(d.key, b)}
                >
                  <div className="flex items-center justify-between px-2 py-1 bg-black/10">
                    <span className="truncate">
                      {b.academyName} {b.subject ? `• ${b.subject}` : ''}
                    </span>
                  </div>
                  <div className="px-2 py-1 bg-black/5">
                    <div>{minutesToLabel(b.startMin)} ~ {minutesToLabel(b.endMin)}</div>
                  </div>
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
            })}
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
                  onChange={(e) => setEditModal((m) => ({ ...m, block: { ...m.block!, subject: e.target.value } }))}
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
              <div>
                <label className="block text-xs text-muted mb-1">색상</label>
                <input
                  type="color"
                  className="w-full h-[40px] px-2 py-2 border border-input bg-card text-title rounded"
                  value={editModal.block.color}
                  onChange={(e) => setEditModal((m) => ({ ...m, block: { ...m.block!, color: e.target.value } }))}
                />
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


