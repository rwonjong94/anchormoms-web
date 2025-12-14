// @ts-nocheck
"use client";

import React, { useEffect, useMemo, useState } from 'react';

interface QBankViewerProps {
  selectedProblems?: any[];
  onSelectedProblemsChange?: (problems: any[]) => void;
}

export default function QBankViewer({
  selectedProblems: externalSelectedProblems,
  onSelectedProblemsChange
}: QBankViewerProps = {}) {
  const [filters, setFilters] = useState({ group: '', search: '', examGrade: '', examYear: '', examTerm: '', probArea: '', probType: '' });
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [pageInput, setPageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [sets, setSets] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [selectedProblems, setSelectedProblems] = useState<any[]>(externalSelectedProblems || []);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // 외부 props 변경 시 내부 상태 동기화
  useEffect(() => {
    if (externalSelectedProblems) {
      setSelectedProblems(externalSelectedProblems);
    }
  }, [externalSelectedProblems]);

  // 내부 상태 변경 시 외부로 알림
  useEffect(() => {
    if (onSelectedProblemsChange) {
      onSelectedProblemsChange(selectedProblems);
    }
  }, [selectedProblems, onSelectedProblemsChange]);

  const groupOptions = useMemo(() => {
    return Array.from(new Set((sets || []).map((s: any) => (s.group ? String(s.group).trim() : '')).filter(Boolean)));
  }, [sets]);
  const setOptions = useMemo(() => {
    const list = (sets || []).filter((s: any) => !filters.group || (s.group || '') === filters.group).map((s: any) => s.name);
    return Array.from(new Set(list));
  }, [sets, filters.group]);
  const gradeOptions = useMemo(() => {
    const list = (sets || []).map((s: any) => s.examGrade).filter((v: any) => v !== null && v !== undefined && v !== '');
    const uniq = Array.from(new Set(list)).sort((a: any, b: any) => a - b);
    return uniq;
  }, [sets]);
  const termOptions = useMemo(() => {
    const list = (sets || []).map((s: any) => s.examTerm).filter((v: any) => v !== null && v !== undefined && v !== '');
    const uniq = Array.from(new Set(list)).sort((a: any, b: any) => a - b);
    return uniq;
  }, [sets]);
  const [yearOptions, setYearOptions] = useState<any[]>([]);
  const [areaOptions, setAreaOptions] = useState<any[]>([]);
  const [typeOptions, setTypeOptions] = useState<any[]>([]);
  const baseKey = useMemo(() => [filters.group || '', filters.search || '', filters.examGrade || '', filters.examTerm || ''].join('|'), [filters.group, filters.search, filters.examGrade, filters.examTerm]);
  const lastBaseKeyRef = React.useRef<string>('');
  useEffect(() => {
    // 그룹/세트/학년/학기가 바뀌었을 때만 후보 재계산
    if (lastBaseKeyRef.current !== baseKey) {
      lastBaseKeyRef.current = baseKey;
      const years = Array.from(new Set((items || []).map((p: any) => p.examYear).filter((v: any) => v !== null && v !== undefined && v !== ''))).sort((a: any, b: any) => b - a);
      const areas = Array.from(new Set((items || []).map((p: any) => p.probArea).filter((v: any) => v && String(v).trim().length > 0))).sort();
      const types = Array.from(new Set((items || []).map((p: any) => p.probType).filter((v: any) => v && String(v).trim().length > 0))).sort();
      setYearOptions(years);
      setAreaOptions(areas);
      setTypeOptions(types);
    }
  }, [baseKey, items]);

  const qs = useMemo(() => {
    const u = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) u.set(k, String(v)); });
    u.set('page', String(page));
    u.set('limit', '20');
    return u.toString();
  }, [filters, page]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const resp = await fetch(`/api/qbank/problems?${qs}`);
        const data = await resp.json();
        if (!resp.ok) throw new Error(data?.error || '목록 조회 실패');
        setItems(data.items || []);
        setTotalPages(data.totalPages || 0);
        setTotalCount(data.total ?? 0);
        setError('');
        setSelectedIds(new Set());
      } catch (e: any) {
        setError(e.message || '오류');
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [qs]);

  useEffect(() => {
    (async () => {
      try {
        const s = await fetch('/api/qbank/sets');
        const j = await s.json().catch(() => ({}));
        const arr = Array.isArray(j) ? j : (Array.isArray(j.items) ? j.items : []);
        setSets(arr);
      } catch {}
    })();
  }, []);

  useEffect(() => {
    if (!filters.search) return;
    if (setOptions.length > 0 && !setOptions.includes(filters.search)) {
      setFilters((prev) => ({ ...prev, search: '' }));
    }
  }, [setOptions]);

  useEffect(() => {
    setPageInput(String(page));
  }, [page]);

  const loadDetail = async (id: string) => {
    try {
      setDetailLoading(true);
      const resp = await fetch(`/api/qbank/problems/${id}`);
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.error || '상세 조회 실패');
      data.condText = Array.isArray(data.condText) ? data.condText : (data.condText ? [String(data.condText)] : []);
      data.condImages = Array.isArray(data.condImages) ? data.condImages : (data.condImages ? [String(data.condImages)] : []);
      data.probImages = Array.isArray(data.probImages) ? data.probImages : (data.probImages ? [String(data.probImages)] : []);
      data.solImages = Array.isArray(data.solImages) ? data.solImages : (data.solImages ? [String(data.solImages)] : []);
      setSelected(data);
    } catch (e: any) {
      setSelected(null);
      alert(e.message || '상세 조회 오류');
    } finally {
      setDetailLoading(false);
    }
  };

  const addToSelectedProblems = (problem: any) => {
    if (!selectedProblems.find(p => p.id === problem.id)) {
      setSelectedProblems(prev => [...prev, problem]);
    }
  };

  const removeFromSelectedProblems = (problemId: string) => {
    setSelectedProblems(prev => prev.filter(p => p.id !== problemId));
  };

  const reorderSelectedProblems = (startIndex: number, endIndex: number) => {
    setSelectedProblems(prev => {
      const result = Array.from(prev);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return result;
    });
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));

    if (dragIndex !== dropIndex && !isNaN(dragIndex)) {
      reorderSelectedProblems(dragIndex, dropIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const save = async () => {
    if (!selected) return;
    try {
      setSaving(true);
      const body = {
        examInfo: selected.examInfo,
        examGrade: Number(selected.examGrade),
        examYear: Number(selected.examYear),
        probNum: Number(selected.probNum),
        probArea: selected.probArea,
        probType: selected.probType,
        probRate: selected.probRate === null || selected.probRate === undefined ? null : Number(selected.probRate),
        probText: selected.probText,
        condText: Array.isArray(selected.condText) ? selected.condText : [],
        condImages: Array.isArray(selected.condImages) ? selected.condImages : [],
        probImages: Array.isArray(selected.probImages) ? selected.probImages : [],
        solAns: selected.solAns ?? null,
        solText: selected.solText ?? null,
        solImages: Array.isArray(selected.solImages) ? selected.solImages : [],
      };
      const resp = await fetch(`/api/qbank/problems/${selected.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const j = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(j?.error || '저장 실패');
      alert('저장되었습니다.');
    } catch (e: any) {
      alert(e.message || '저장 오류');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!selected) return;
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
      setDeleting(true);
      const resp = await fetch(`/api/qbank/problems/${selected.id}`, { method: 'DELETE' });
      const j = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(j?.error || '삭제 실패');
      setSelected(null);
      const r = await fetch(`/api/qbank/problems?${qs}`);
      const d = await r.json();
      setItems(d.items || []);
      alert('삭제되었습니다.');
    } catch (e: any) {
      alert(e.message || '삭제 오류');
    } finally {
      setDeleting(false);
    }
  };

  const matchedSet = useMemo(() => {
    if (!selected) return null;
    return sets.find((s: any) => s?.name === selected.examInfo) || null;
  }, [selected, sets]);

  const isAllChecked = items.length > 0 && items.every((p) => selectedIds.has(p.id));
  const toggleAll = () => {
    const next = new Set<string>(selectedIds);
    if (isAllChecked) {
      items.forEach((p) => next.delete(p.id));
    } else {
      items.forEach((p) => next.add(p.id));
    }
    setSelectedIds(next);
  };
  const toggleOne = (id: string) => {
    const next = new Set<string>(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  const bulkRemove = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`선택한 ${selectedIds.size}개 문제를 삭제하시겠습니까?`)) return;
    try {
      setBulkDeleting(true);
      const ids = Array.from(selectedIds);
      const results = await Promise.all(ids.map(async (id) => {
        const resp = await fetch(`/api/qbank/problems/${id}`, { method: 'DELETE' });
        return resp.ok;
      }));
      const r = await fetch(`/api/qbank/problems?${qs}`);
      const d = await r.json();
      setItems(d.items || []);
      setSelectedIds(new Set());
      if (selected && ids.includes(selected.id)) setSelected(null);
      const okCount = results.filter(Boolean).length;
      alert(`${okCount}개 삭제되었습니다.`);
    } catch (e: any) {
      alert(e?.message || '일괄 삭제 중 오류');
    } finally {
      setBulkDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-card border border-default rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <select className="px-3 py-2 border border-input rounded-md md:col-span-2" value={filters.group} onChange={(e) => setFilters({ ...filters, group: e.target.value })}>
            <option value="">전체 그룹</option>
            {groupOptions.map((g: any) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
          <select className="px-3 py-2 border border-input rounded-md md:col-span-4" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })}>
            <option value="">전체 문제집</option>
            {setOptions.map((n: any) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          <select className="px-3 py-2 border border-input rounded-md" value={filters.examGrade} onChange={(e) => setFilters({ ...filters, examGrade: e.target.value })}>
            <option value="">전체 학년</option>
            {gradeOptions.map((g: any) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
          <select className="px-3 py-2 border border-input rounded-md" value={filters.examYear} onChange={(e) => setFilters({ ...filters, examYear: e.target.value })}>
            <option value="">전체 연도</option>
            {yearOptions.map((y: any) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <select className="px-3 py-2 border border-input rounded-md" value={filters.examTerm} onChange={(e) => setFilters({ ...filters, examTerm: e.target.value })}>
            <option value="">전체 학기</option>
            {termOptions.map((t: any) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <select className="px-3 py-2 border border-input rounded-md" value={filters.probArea} onChange={(e) => setFilters({ ...filters, probArea: e.target.value })}>
            <option value="">전체 영역</option>
            {areaOptions.map((a: any) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <select className="px-3 py-2 border border-input rounded-md" value={filters.probType} onChange={(e) => setFilters({ ...filters, probType: e.target.value })}>
            <option value="">전체 유형</option>
            {typeOptions.map((t: any) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="text-sm text-muted">{totalCount ? `문제 수: ${totalCount}개` : ''}{selectedIds.size > 0 ? `  (선택됨: ${selectedIds.size}개)` : ''}</div>
          <div className="space-x-2">
            {selectedIds.size > 0 && (
              <button disabled={bulkDeleting} onClick={bulkRemove} className="px-3 py-2 border border-red-600 text-red-600 rounded-md text-sm disabled:opacity-60">{bulkDeleting ? '삭제 중...' : '선택 삭제'}</button>
            )}
            <button onClick={() => { setPage(1); }} className="px-3 py-2 border border-input rounded-md text-sm hover:bg-hover">필터 적용</button>
          </div>
        </div>
      </div>

      {/* 문제 목록 테이블 */}
      <div className="bg-card border border-default rounded-lg overflow-hidden mb-4">
        <div className="overflow-x-auto">
          <div className="max-h-[400px] overflow-y-auto">
            <table className="w-full table-fixed min-w-[700px]">
              <colgroup>
                <col className="w-40" />
                <col className="w-16" />
                <col className="w-16" />
                <col className="w-16" />
                <col className="w-16" />
                <col className="w-20" />
                <col className="min-w-0" />
                <col className="w-16" />
              </colgroup>
              <thead className="bg-muted sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-2 text-left text-xs text-muted">문제집</th>
                  <th className="px-3 py-2 text-left text-xs text-muted">학년</th>
                  <th className="px-3 py-2 text-left text-xs text-muted">연도</th>
                  <th className="px-3 py-2 text-left text-xs text-muted">학기</th>
                  <th className="px-3 py-2 text-left text-xs text-muted">번호</th>
                  <th className="px-3 py-2 text-left text-xs text-muted">영역</th>
                  <th className="px-3 py-2 text-left text-xs text-muted">유형</th>
                  <th className="px-3 py-2 text-left text-xs text-muted">정답률</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  // 로딩 중에도 테이블 구조 유지
                  Array.from({ length: 10 }).map((_, index) => (
                    <tr key={`loading-${index}`} className="border-t border-default animate-pulse">
                      <td className="px-3 py-2 text-sm">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                      </td>
                      <td className="px-3 py-2 text-sm">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-8"></div>
                      </td>
                      <td className="px-3 py-2 text-sm">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
                      </td>
                      <td className="px-3 py-2 text-sm">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-8"></div>
                      </td>
                      <td className="px-3 py-2 text-sm">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-8"></div>
                      </td>
                      <td className="px-3 py-2 text-sm">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
                      </td>
                      <td className="px-3 py-2 text-sm">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                      </td>
                      <td className="px-3 py-2 text-sm">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-10"></div>
                      </td>
                    </tr>
                  ))
                ) : error ? (
                  <tr>
                    <td className="px-3 py-6 text-center text-red-600" colSpan={8}>{error}</td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td className="px-3 py-6 text-center text-muted" colSpan={8}>조건에 맞는 문제가 없습니다.</td>
                  </tr>
                ) : (
                  items.map((p) => (
                    <tr key={p.id} className={`border-t border-default align-top cursor-pointer hover:bg-hover transition-colors ${selected?.id === p.id ? 'bg-muted/50' : ''}`}
                      onClick={() => {
                        loadDetail(p.id);
                        addToSelectedProblems(p);
                      }}
                    >
                      <td className="px-3 py-2 text-sm">{filters.search || p.examInfo}</td>
                      <td className="px-3 py-2 text-sm">{p.examGrade}</td>
                      <td className="px-3 py-2 text-sm">{p.examYear}</td>
                      <td className="px-3 py-2 text-sm">{p.examTerm}</td>
                      <td className="px-3 py-2 text-sm">{p.probNum}</td>
                      <td className="px-3 py-2 text-sm">{p.probArea}</td>
                      <td className="px-3 py-2 text-sm">{p.probType}</td>
                      <td className="px-3 py-2 text-sm">{p.probRate ?? '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 페이지네이션 */}
      {totalPages >= 1 && (
        <div className="flex flex-col items-center gap-2 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted">이동할 페이지</span>
            <input
              className="px-3 py-1 border border-input rounded w-24 text-sm"
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value.replace(/[^0-9]/g, ''))}
              onKeyDown={(e:any) => {
                if (e.key === 'Enter') {
                  const n = Math.max(1, Math.min(totalPages, Number(pageInput || '1')));
                  setPage(n);
                }
              }}
            />
            <button
              className="px-3 py-1 border border-input rounded text-sm"
              onClick={() => {
                const n = Math.max(1, Math.min(totalPages, Number(pageInput || '1')));
                setPage(n);
              }}
            >이동</button>
            <span className="text-xs text-muted">/ 총 {totalPages}페이지</span>
          </div>
          <div className="flex items-center gap-2">
            {(() => {
              const groupSize = 10;
              const currentGroup = Math.floor((page - 1) / groupSize);
              const start = currentGroup * groupSize + 1;
              const end = Math.min(totalPages, start + groupSize - 1);
              const buttons = [] as any[];
              if (start > 1) {
                buttons.push(
                  <button key="prev10" onClick={() => setPage(start - 1)} className="px-3 py-1 border border-input rounded text-sm">이전</button>
                );
              }
              for (let n = start; n <= end; n++) {
                buttons.push(
                  <button key={n} onClick={() => setPage(n)} className={`px-3 py-1 rounded-md text-sm ${n === page ? 'bg-indigo-600 text-white' : 'border border-input hover:bg-hover'}`}>{n}</button>
                );
              }
              if (end < totalPages) {
                buttons.push(
                  <button key="next10" onClick={() => setPage(end + 1)} className="px-3 py-1 border border-input rounded text-sm">다음</button>
                );
              }
              return buttons;
            })()}
          </div>
        </div>
      )}

      {/* 좌우 분할 섹션: 선택된 문제 | 문제 상세/편집 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* 왼쪽: 선택된 문제 목록 (1/3) */}
        <div className="bg-card border border-default rounded-lg">
          <div className="p-4 border-b border-default">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-title">선택된 문제 ({selectedProblems.length}개)</h3>
              <button
                onClick={() => setSelectedProblems([])}
                className="px-3 py-2 border border-input text-body rounded-md text-sm hover:bg-hover"
                disabled={selectedProblems.length === 0}
              >
                모두 제거
              </button>
            </div>
          </div>
          <div className="p-4 h-96 overflow-y-auto">
            {selectedProblems.length === 0 ? (
              <div className="text-center py-8 text-muted">
                <div className="text-4xl mb-2">📝</div>
                <p>위 테이블에서 문제를 클릭하여 추가하세요</p>
              </div>
            ) : (
              <div className="space-y-2">
                {selectedProblems.map((problem, index) => (
                  <div key={problem.id}>
                    {/* 드롭 위치 표시 - 맨 위에만 */}
                    {index === 0 && draggedIndex !== null && dragOverIndex === index && (
                      <div className="h-1 bg-indigo-500 rounded-full mx-2 mb-2 opacity-75">
                      </div>
                    )}

                    <div
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDrop={(e) => handleDrop(e, index)}
                      className={`flex items-center gap-3 p-3 border border-default rounded-md bg-card transition-all ${
                        draggedIndex === index ? 'opacity-50 scale-95' : ''
                      } ${
                        dragOverIndex === index && draggedIndex !== null && draggedIndex !== index
                          ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20'
                          : ''
                      }`}
                    >
                      {/* 드래그 핸들 - 드래그 전용 영역 */}
                      <div
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragEnd={handleDragEnd}
                        className="flex flex-col gap-1 cursor-move p-1 hover:bg-hover rounded"
                      >
                        <svg className="w-4 h-4 text-muted" fill="currentColor" viewBox="0 0 6 10">
                          <circle cx="1" cy="1" r="1"/>
                          <circle cx="1" cy="5" r="1"/>
                          <circle cx="1" cy="9" r="1"/>
                          <circle cx="5" cy="1" r="1"/>
                          <circle cx="5" cy="5" r="1"/>
                          <circle cx="5" cy="9" r="1"/>
                        </svg>
                      </div>

                      {/* 문제 번호 */}
                      <div className="text-sm font-medium text-indigo-600 min-w-[2rem]">
                        {index + 1}.
                      </div>

                      {/* 문제 정보 - 클릭하면 상세 편집으로 로드 */}
                      <div
                        className="flex-1 min-w-0 cursor-pointer hover:bg-hover rounded p-1"
                        onClick={() => {
                          loadDetail(problem.id);
                        }}
                      >
                        <div className="text-sm font-medium text-title truncate">
                          {problem.examInfo} - {problem.probNum}번
                        </div>
                        <div className="text-xs text-muted">
                          {problem.examGrade}학년 | {problem.examYear}년 {problem.examTerm}학기 | {problem.probArea} | {problem.probType}
                        </div>
                      </div>

                      {/* 제거 버튼 */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromSelectedProblems(problem.id);
                        }}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    {/* 드롭 위치 표시 - 각 아이템 아래 */}
                    {draggedIndex !== null && dragOverIndex === index && draggedIndex !== index && (
                      <div className="h-1 bg-indigo-500 rounded-full mx-2 mt-2 opacity-75">
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 오른쪽: 문제 상세/편집 (2/3) */}
        <div className="lg:col-span-2 bg-card border border-default rounded-lg" data-section="detail-edit">
          <div className="p-4 border-b border-default">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-title">문제 상세/편집</h3>
              {selected && (
                <div className="flex gap-2">
                  <button disabled={deleting} onClick={remove} className="px-3 py-2 border border-red-600 text-red-600 rounded-md text-sm disabled:opacity-60">{deleting ? '삭제 중...' : '삭제'}</button>
                  <button disabled={saving} onClick={save} className="px-3 py-2 bg-indigo-600 text-white rounded-md text-sm disabled:opacity-60">{saving ? '저장 중...' : '저장'}</button>
                </div>
              )}
            </div>
          </div>
          <div className="p-4 h-96 overflow-y-auto transition-all duration-200">
            {/* 항상 동일한 구조 유지 */}
            <div className="space-y-4">
              {/* 문제집 정보 섹션 */}
              <div className="border border-default rounded-md p-3">
                <div className="text-sm text-muted mb-2">문제집 정보</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-muted mb-1">문제집/시험 정보</label>
                    {!selected || detailLoading ? (
                      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    ) : (
                      <input className="px-3 py-2 border border-input rounded-md w-full transition-all" value={selected.examInfo}
                        onChange={(e) => setSelected({ ...selected, examInfo: e.target.value })} />
                    )}
                  </div>
                  <div>
                    <label className="block text-xs text-muted mb-1">매칭된 세트</label>
                    {!selected || detailLoading ? (
                      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    ) : (
                      <input className="px-3 py-2 border border-input rounded-md w-full" value={matchedSet?.name ?? ''} readOnly />
                    )}
                  </div>
                  <div>
                    <label className="block text-xs text-muted mb-1">출판사</label>
                    {!selected || detailLoading ? (
                      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    ) : (
                      <input className="px-3 py-2 border border-input rounded-md w-full" value={matchedSet?.publisher ?? ''} readOnly />
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs text-muted mb-1">책 번호</label>
                      {!selected || detailLoading ? (
                        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                      ) : (
                        <input className="px-3 py-2 border border-input rounded-md w-full" value={matchedSet?.bookNum ?? ''} readOnly />
                      )}
                    </div>
                    <div>
                      <label className="block text-xs text-muted mb-1">세트 학년</label>
                      {!selected || detailLoading ? (
                        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                      ) : (
                        <input className="px-3 py-2 border border-input rounded-md w-full" value={matchedSet?.examGrade ?? ''} readOnly />
                      )}
                    </div>
                    <div>
                      <label className="block text-xs text-muted mb-1">세트 학기</label>
                      {!selected || detailLoading ? (
                        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                      ) : (
                        <input className="px-3 py-2 border border-input rounded-md w-full" value={matchedSet?.examTerm ?? ''} readOnly />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 기본 정보 섹션 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-muted mb-1">학년</label>
                  {!selected || detailLoading ? (
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  ) : (
                    <input type="number" className="px-3 py-2 border border-input rounded-md w-full transition-all" value={selected.examGrade}
                      onChange={(e) => setSelected({ ...selected, examGrade: Number(e.target.value) })} />
                  )}
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1">연도</label>
                  {!selected || detailLoading ? (
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  ) : (
                    <input type="number" className="px-3 py-2 border border-input rounded-md w-full transition-all" value={selected.examYear}
                      onChange={(e) => setSelected({ ...selected, examYear: Number(e.target.value) })} />
                  )}
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1">번호</label>
                  {!selected || detailLoading ? (
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  ) : (
                    <input type="number" className="px-3 py-2 border border-input rounded-md w-full transition-all" value={selected.probNum}
                      onChange={(e) => setSelected({ ...selected, probNum: Number(e.target.value) })} />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-muted mb-1">영역</label>
                  {!selected || detailLoading ? (
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  ) : (
                    <input className="px-3 py-2 border border-input rounded-md w-full transition-all" value={selected.probArea}
                      onChange={(e) => setSelected({ ...selected, probArea: e.target.value })} />
                  )}
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1">유형</label>
                  {!selected || detailLoading ? (
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  ) : (
                    <input className="px-3 py-2 border border-input rounded-md w-full transition-all" value={selected.probType}
                      onChange={(e) => setSelected({ ...selected, probType: e.target.value })} />
                  )}
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1">정답률</label>
                  {!selected || detailLoading ? (
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  ) : (
                    <input type="number" step="0.01" className="px-3 py-2 border border-input rounded-md w-full transition-all" value={selected.probRate ?? ''}
                      onChange={(e) => setSelected({ ...selected, probRate: e.target.value ? Number(e.target.value) : null })} />
                  )}
                </div>
              </div>

              {/* 문제 내용 */}
              <div>
                <label className="block text-xs text-muted mb-1">문제 내용</label>
                {!selected || detailLoading ? (
                  <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                ) : (
                  <textarea rows={4} className="px-3 py-2 border border-input rounded-md w-full transition-all" value={selected.probText}
                    onChange={(e) => setSelected({ ...selected, probText: e.target.value })} />
                )}
              </div>

              {/* 이미지 및 조건 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-muted mb-1">문제 이미지 URL들(쉼표)</label>
                  {!selected || detailLoading ? (
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  ) : (
                    <input className="px-3 py-2 border border-input rounded-md w-full transition-all" value={selected.probImages.join(',')}
                      onChange={(e) => setSelected({ ...selected, probImages: e.target.value.split(',').map((s: any) => s.trim()).filter(Boolean) })} />
                  )}
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1">조건 이미지 URL들(쉼표)</label>
                  {!selected || detailLoading ? (
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  ) : (
                    <input className="px-3 py-2 border border-input rounded-md w-full transition-all" value={selected.condImages.join(',')}
                      onChange={(e) => setSelected({ ...selected, condImages: e.target.value.split(',').map((s: any) => s.trim()).filter(Boolean) })} />
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-muted mb-1">조건 텍스트(쉼표)</label>
                  {!selected || detailLoading ? (
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  ) : (
                    <input className="px-3 py-2 border border-input rounded-md w-full transition-all" value={selected.condText.join(',')}
                      onChange={(e) => setSelected({ ...selected, condText: e.target.value.split(',').map((s: any) => s.trim()).filter(Boolean) })} />
                  )}
                </div>
              </div>

              {/* 풀이 섹션 */}
              <div className="border border-default rounded-md p-3">
                <div className="text-sm font-medium mb-2">풀이</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-muted mb-1">정답(solAns)</label>
                    {!selected || detailLoading ? (
                      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    ) : (
                      <input className="px-3 py-2 border border-input rounded-md w-full transition-all" value={selected.solAns ?? ''}
                        onChange={(e) => setSelected({ ...selected, solAns: e.target.value })} />
                    )}
                  </div>
                  <div>
                    <label className="block text-xs text-muted mb-1">풀이 이미지 URL들(쉼표)</label>
                    {!selected || detailLoading ? (
                      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    ) : (
                      <input className="px-3 py-2 border border-input rounded-md w-full transition-all" value={(selected.solImages ?? []).join(',')}
                        onChange={(e) => setSelected({ ...selected, solImages: e.target.value.split(',').map((s: any) => s.trim()).filter(Boolean) })} />
                    )}
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-xs text-muted mb-1">풀이 설명(solText)</label>
                  {!selected || detailLoading ? (
                    <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  ) : (
                    <textarea rows={4} className="px-3 py-2 border border-input rounded-md w-full transition-all" value={selected.solText ?? ''}
                      onChange={(e) => setSelected({ ...selected, solText: e.target.value })} />
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

