'use client';

import { useMemo, useState } from 'react';

export type RoadmapStatus = 'todo' | 'in_progress' | 'done';

export interface RoadmapItem {
  id: string;
  title: string;
  status: RoadmapStatus;
  notes?: string;
}

export interface RoadmapPhase {
  id: string;
  title: string;
  color: string; // hex
  items: RoadmapItem[];
}

export interface RoadmapData {
  phases: RoadmapPhase[];
}

interface RoadmapEditorProps {
  value: RoadmapData | null | undefined;
  onChange: (next: RoadmapData) => void;
}

function generateId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

function ensureRoadmapData(input: any): RoadmapData {
  const empty: RoadmapData = { phases: [] };
  if (!input || typeof input !== 'object') return empty;
  const rawPhases = Array.isArray(input.phases) ? input.phases : [];
  const phases: RoadmapPhase[] = rawPhases.map((p: any) => ({
    id: String(p?.id ?? generateId()),
    title: String(p?.title ?? ''),
    color: String(p?.color ?? '#60a5fa'),
    items: (Array.isArray(p?.items) ? p.items : []).map((it: any) => ({
      id: String(it?.id ?? generateId()),
      title: String(it?.title ?? ''),
      status: (['todo', 'in_progress', 'done'] as RoadmapStatus[]).includes(it?.status)
        ? it.status
        : 'todo',
      notes: it?.notes ? String(it.notes) : undefined,
    })),
  }));
  return { phases };
}

export default function RoadmapEditor({ value, onChange }: RoadmapEditorProps) {
  const roadmap = useMemo(() => ensureRoadmapData(value), [value]);
  const [editing, setEditing] = useState<{
    mode: 'phase' | 'item' | null;
    phaseId?: string;
    itemId?: string;
    title?: string;
    color?: string;
    status?: RoadmapStatus;
    notes?: string;
  }>({ mode: null });

  const commit = (next: RoadmapData) => onChange(next);

  const addPhase = () => {
    const id = generateId();
    commit({
      phases: [
        ...roadmap.phases,
        { id, title: '새 단계', color: '#60a5fa', items: [] },
      ],
    });
  };

  const editPhase = (phaseId: string) => {
    const p = roadmap.phases.find((x) => x.id === phaseId);
    if (!p) return;
    setEditing({
      mode: 'phase',
      phaseId,
      title: p.title,
      color: p.color,
    });
  };

  const deletePhase = (phaseId: string) => {
    commit({ phases: roadmap.phases.filter((p) => p.id !== phaseId) });
  };

  const movePhase = (phaseId: string, dir: -1 | 1) => {
    const idx = roadmap.phases.findIndex((p) => p.id === phaseId);
    if (idx < 0) return;
    const j = idx + dir;
    if (j < 0 || j >= roadmap.phases.length) return;
    const arr = [...roadmap.phases];
    [arr[idx], arr[j]] = [arr[j], arr[idx]];
    commit({ phases: arr });
  };

  const addItem = (phaseId: string) => {
    const id = generateId();
    const next = roadmap.phases.map((p) =>
      p.id === phaseId
        ? {
            ...p,
            items: [
              ...p.items,
              { id, title: '새 항목', status: 'todo' as RoadmapStatus },
            ],
          }
        : p
    );
    commit({ phases: next });
  };

  const editItem = (phaseId: string, itemId: string) => {
    const p = roadmap.phases.find((x) => x.id === phaseId);
    const it = p?.items.find((x) => x.id === itemId);
    if (!p || !it) return;
    setEditing({
      mode: 'item',
      phaseId,
      itemId,
      title: it.title,
      status: it.status,
      notes: it.notes ?? '',
    });
  };

  const deleteItem = (phaseId: string, itemId: string) => {
    const next = roadmap.phases.map((p) =>
      p.id === phaseId ? { ...p, items: p.items.filter((i) => i.id !== itemId) } : p
    );
    commit({ phases: next });
  };

  const moveItem = (phaseId: string, itemId: string, dir: -1 | 1) => {
    const next = roadmap.phases.map((p) => {
      if (p.id !== phaseId) return p;
      const idx = p.items.findIndex((i) => i.id === itemId);
      if (idx < 0) return p;
      const j = idx + dir;
      if (j < 0 || j >= p.items.length) return p;
      const items = [...p.items];
      [items[idx], items[j]] = [items[j], items[idx]];
      return { ...p, items };
    });
    commit({ phases: next });
  };

  const saveEditing = () => {
    if (!editing.mode || !editing.phaseId) return setEditing({ mode: null });
    if (editing.mode === 'phase') {
      const next = roadmap.phases.map((p) =>
        p.id === editing.phaseId
          ? {
              ...p,
              title: editing.title?.trim() || p.title,
              color: editing.color || p.color,
            }
          : p
      );
      commit({ phases: next });
      setEditing({ mode: null });
      return;
    }
    if (!editing.itemId) return setEditing({ mode: null });
    const next = roadmap.phases.map((p) =>
      p.id === editing.phaseId
        ? {
            ...p,
            items: p.items.map((i) =>
              i.id === editing.itemId
                ? {
                    ...i,
                    title: editing.title?.trim() || i.title,
                    status: (editing.status as RoadmapStatus) || i.status,
                    notes: editing.notes?.trim() ? editing.notes.trim() : undefined,
                  }
                : i
            ),
          }
        : p
    );
    commit({ phases: next });
    setEditing({ mode: null });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-title">로드맵</h3>
        <button
          className="px-3 py-2 rounded bg-primary text-primary-foreground"
          onClick={addPhase}
        >
          단계 추가
        </button>
      </div>

      {/* Phase list */}
      <div className="space-y-4">
        {roadmap.phases.length === 0 && (
          <div className="p-4 border border-dashed border-default rounded text-sm text-muted">
            아직 단계가 없습니다. “단계 추가” 버튼으로 시작하세요.
          </div>
        )}

        {roadmap.phases.map((p, idx) => (
          <div key={p.id} className="border border-default rounded">
            <div
              className="flex items-center justify-between px-3 py-2"
              style={{ background: `${p.color}20`, borderBottom: `1px solid ${p.color}55` }}
            >
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ background: p.color }} />
                <div className="font-medium text-title">{p.title || '무제 단계'}</div>
                <span className="text-xs text-muted">({p.items.length} 항목)</span>
              </div>
              <div className="flex items-center gap-2">
                <button className="text-xs px-2 py-1 border rounded" onClick={() => movePhase(p.id, -1)} disabled={idx === 0}>위</button>
                <button className="text-xs px-2 py-1 border rounded" onClick={() => movePhase(p.id, 1)} disabled={idx === roadmap.phases.length - 1}>아래</button>
                <button className="text-xs px-2 py-1 border rounded" onClick={() => editPhase(p.id)}>편집</button>
                <button className="text-xs px-2 py-1 border rounded text-red-600" onClick={() => deletePhase(p.id)}>삭제</button>
                <button className="text-xs px-2 py-1 rounded bg-primary text-primary-foreground" onClick={() => addItem(p.id)}>항목 추가</button>
              </div>
            </div>
            <div className="p-3 space-y-2">
              {p.items.length === 0 ? (
                <div className="text-sm text-muted">항목이 없습니다.</div>
              ) : (
                p.items.map((it, j) => (
                  <div key={it.id} className="flex items-start justify-between border border-default rounded p-2">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-title">{it.title || '무제 항목'}</div>
                      <div className="text-xs text-muted mt-0.5">
                        상태: {it.status === 'todo' ? '대기' : it.status === 'in_progress' ? '진행중' : '완료'}
                      </div>
                      {it.notes && <div className="text-xs text-body mt-1 whitespace-pre-wrap">{it.notes}</div>}
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      <button className="text-xs px-2 py-1 border rounded" onClick={() => moveItem(p.id, it.id, -1)} disabled={j === 0}>위</button>
                      <button className="text-xs px-2 py-1 border rounded" onClick={() => moveItem(p.id, it.id, 1)} disabled={j === p.items.length - 1}>아래</button>
                      <button className="text-xs px-2 py-1 border rounded" onClick={() => editItem(p.id, it.id)}>편집</button>
                      <button className="text-xs px-2 py-1 border rounded text-red-600" onClick={() => deleteItem(p.id, it.id)}>삭제</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Edit modal */}
      {editing.mode && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onMouseDown={() => setEditing({ mode: null })}>
          <div className="bg-card border border-default rounded-lg w-full max-w-lg mx-4 p-4" onMouseDown={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-title">{editing.mode === 'phase' ? '단계 편집' : '항목 편집'}</h3>
              <button className="text-muted hover:text-body" onClick={() => setEditing({ mode: null })}>✕</button>
            </div>
            {editing.mode === 'phase' ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs text-muted mb-1">제목</label>
                  <input className="w-full px-3 py-2 border border-input bg-card text-title rounded"
                    value={editing.title ?? ''}
                    onChange={(e) => setEditing((m) => ({ ...m, title: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1">색상</label>
                  <input type="color" className="w-full h-[40px] px-2 py-2 border border-input bg-card text-title rounded"
                    value={editing.color ?? '#60a5fa'}
                    onChange={(e) => setEditing((m) => ({ ...m, color: e.target.value }))} />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs text-muted mb-1">제목</label>
                  <input className="w-full px-3 py-2 border border-input bg-card text-title rounded"
                    value={editing.title ?? ''}
                    onChange={(e) => setEditing((m) => ({ ...m, title: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1">상태</label>
                  <select className="w-full px-3 py-2 border border-input bg-card text-title rounded"
                    value={editing.status ?? 'todo'}
                    onChange={(e) => setEditing((m) => ({ ...m, status: e.target.value as RoadmapStatus }))}>
                    <option value="todo">대기</option>
                    <option value="in_progress">진행중</option>
                    <option value="done">완료</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-muted mb-1">메모</label>
                  <textarea rows={4} className="w-full px-3 py-2 border border-input bg-card text-title rounded"
                    value={editing.notes ?? ''}
                    onChange={(e) => setEditing((m) => ({ ...m, notes: e.target.value }))} />
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2 mt-4">
              <button className="px-4 py-2 rounded border border-input hover:bg-hover" onClick={() => setEditing({ mode: null })}>취소</button>
              <button className="px-4 py-2 rounded bg-primary text-primary-foreground" onClick={saveEditing}>저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


