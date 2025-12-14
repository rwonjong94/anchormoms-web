'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

type Problem = {
  id: string;
  examInfo: string;
  examGrade: number;
  examTerm: number;
  examYear: number;
  probNum: number;
  probArea: string;
  probType: string;
  probRate?: number | null;
  probText: string;
  condText: string[];
  condImages: string[];
  probImages: string[];
  // Solution fields
  solAns?: string | null;
  solText?: string | null;
  solImages?: string[] | null;
};

export default function ProblemsAdminPage() {
  const [items, setItems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ examGrade: '', examYear: '', examTerm: '', probArea: '', probType: '', search: '' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState<any>({
    examInfo: '', examGrade: 1, examTerm: 1, examYear: new Date().getFullYear(),
    probNum: 1, probArea: '', probType: '', probRate: null,
    probText: '', condText: [], condImages: [], probImages: []
  });
  const jsonUploadRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });

  // 상세/편집 관련 상태
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Problem | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [sets, setSets] = useState<any[]>([]);

  const queryString = useMemo(() => {
    const u = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) u.set(k, String(v)); });
    u.set('page', String(page));
    u.set('limit', '20');
    return u.toString();
  }, [filters, page]);

  const fetchList = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const resp = await fetch(`/api/nimda/problems?${queryString}`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!resp.ok) throw new Error('목록 조회 실패');
      const data = await resp.json();
      setItems(data.items || []);
      setTotalPages(data.totalPages || 0);
      setError('');
    } catch (e: any) {
      setError(e.message || '오류');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchList(); }, [queryString]);

  // 책 세트 정보 로드 (문제집 메타 표시용)
  useEffect(() => {
    (async () => {
      try {
        const resp = await fetch('/api/qbank/sets');
        const data = await resp.json().catch(() => ({}));
        const items = Array.isArray(data) ? data : (Array.isArray(data.items) ? data.items : []);
        setSets(items);
      } catch {
        setSets([]);
      }
    })();
  }, []);

  const fetchDetail = async (id: string) => {
    try {
      setDetailLoading(true);
      const token = localStorage.getItem('adminToken');
      const resp = await fetch(`/api/nimda/problems/${id}`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!resp.ok) throw new Error('상세 조회 실패');
      const data = await resp.json();
      // 배열 필드 방어적 처리
      data.condText = Array.isArray(data.condText) ? data.condText : (data.condText ? [String(data.condText)] : []);
      data.condImages = Array.isArray(data.condImages) ? data.condImages : (data.condImages ? [String(data.condImages)] : []);
      data.probImages = Array.isArray(data.probImages) ? data.probImages : (data.probImages ? [String(data.probImages)] : []);
      data.solImages = Array.isArray(data.solImages) ? data.solImages : (data.solImages ? [String(data.solImages)] : []);
      setDetail(data);
    } catch (e: any) {
      setDetail(null);
      alert(e.message || '상세 조회 오류');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSelect = (id: string) => {
    setSelectedId(id);
    fetchDetail(id);
  };

  const matchedSet = useMemo(() => {
    if (!detail) return null;
    return sets.find((s: any) => s?.name === detail.examInfo) || null;
  }, [detail, sets]);

  const saveDetail = async () => {
    if (!detail) return;
    try {
      setSaving(true);
      const token = localStorage.getItem('adminToken');
      const body = {
        examInfo: detail.examInfo,
        examGrade: Number(detail.examGrade),
        examTerm: Number(detail.examTerm),
        examYear: Number(detail.examYear),
        probNum: Number(detail.probNum),
        probArea: detail.probArea,
        probType: detail.probType,
        probRate: detail.probRate === null || detail.probRate === undefined ? null : Number(detail.probRate),
        probText: detail.probText,
        condText: Array.isArray(detail.condText) ? detail.condText : [],
        condImages: Array.isArray(detail.condImages) ? detail.condImages : [],
        probImages: Array.isArray(detail.probImages) ? detail.probImages : [],
        solAns: detail.solAns ?? null,
        solText: detail.solText ?? null,
        solImages: Array.isArray(detail.solImages) ? detail.solImages : [],
      };
      const resp = await fetch(`/api/nimda/problems/${detail.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(body)
      });
      if (!resp.ok) {
        const j = await resp.json().catch(() => ({}));
        throw new Error(j.error || '저장 실패');
      }
      await fetchList();
      alert('저장되었습니다.');
    } catch (e: any) {
      alert(e.message || '저장 오류');
    } finally {
      setSaving(false);
    }
  };

  const deleteDetail = async () => {
    if (!detail) return;
    if (!confirm('정말 이 문제를 삭제하시겠습니까?')) return;
    try {
      setDeleting(true);
      const token = localStorage.getItem('adminToken');
      const resp = await fetch(`/api/nimda/problems/${detail.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      if (!resp.ok) throw new Error('삭제 실패');
      setDetail(null);
      setSelectedId(null);
      await fetchList();
      alert('삭제되었습니다.');
    } catch (e: any) {
      alert(e.message || '삭제 오류');
    } finally {
      setDeleting(false);
    }
  };

  const handleJsonUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      setUploadProgress({ current: 0, total: 0 });

      const text = await file.text();
      let data: any = JSON.parse(text);
      // 지원 형식: 배열 또는 { items } / { problems }
      if (!Array.isArray(data)) {
        if (Array.isArray((data && data.items))) data = data.items;
        else if (Array.isArray((data && data.problems))) data = data.problems;
        else throw new Error('지원하지 않는 JSON 형식입니다. 배열 또는 { items | problems } 형태가 필요합니다.');
      }

      const token = localStorage.getItem('adminToken');
      const batchSize = 200; // 본문 제한/타임아웃 방지용 분할 업로드
      const total = data.length;
      setUploadProgress({ current: 0, total });

      for (let i = 0; i < total; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        const resp = await fetch('/api/nimda/problems', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(batch)
        });
        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          throw new Error(err.error || `업로드 실패 (offset ${i})`);
        }
        setUploadProgress({ current: Math.min(i + batch.length, total), total });
      }

      await fetchList();
      if (jsonUploadRef.current) jsonUploadRef.current.value = '';
      alert('JSON 업로드가 완료되었습니다.');
    } catch (e: any) {
      alert(e.message || 'JSON 파싱/업로드 오류');
    } finally {
      setUploading(false);
      if (jsonUploadRef.current) jsonUploadRef.current.value = '';
    }
  };

  const createSingle = async () => {
    try {
      setCreating(true);
      const token = localStorage.getItem('adminToken');
      const resp = await fetch('/api/nimda/problems', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(createForm)
      });
      if (!resp.ok) throw new Error('생성 실패');
      setShowCreate(false);
      setCreateForm({ examInfo: '', examGrade: 1, examTerm: 1, examYear: new Date().getFullYear(), probNum: 1, probArea: '', probType: '', probRate: null, probText: '', condText: [], condImages: [], probImages: [] });
      fetchList();
    } catch (e: any) {
      alert(e.message || '오류');
    } finally {
      setCreating(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="sr-only">문제 관리</h1>
          <div className="flex items-center gap-2">
            <input type="file" accept="application/json" ref={jsonUploadRef} onChange={handleJsonUpload} className="hidden" />
            <button disabled={uploading} onClick={() => jsonUploadRef.current?.click()} className="px-3 py-2 border border-input rounded-md text-sm hover:bg-hover disabled:opacity-60">{uploading ? '업로드 중...' : 'JSON 업로드'}</button>
            <button onClick={() => setShowCreate(true)} className="px-3 py-2 bg-indigo-600 text-white rounded-md text-sm">문제 추가</button>
          </div>
        </div>

        {uploading && (
          <div className="mb-4 text-sm text-muted">
            업로드 진행률: {uploadProgress.current} / {uploadProgress.total}
          </div>
        )}

        {/* 필터 */}
        <div className="bg-card border border-default rounded-lg p-4 mb-4">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <input placeholder="학년" value={filters.examGrade} onChange={(e) => setFilters({ ...filters, examGrade: e.target.value })} className="px-3 py-2 border border-input rounded-md" />
            <input placeholder="연도" value={filters.examYear} onChange={(e) => setFilters({ ...filters, examYear: e.target.value })} className="px-3 py-2 border border-input rounded-md" />
            <input placeholder="학기" value={filters.examTerm} onChange={(e) => setFilters({ ...filters, examTerm: e.target.value })} className="px-3 py-2 border border-input rounded-md" />
            <input placeholder="영역" value={filters.probArea} onChange={(e) => setFilters({ ...filters, probArea: e.target.value })} className="px-3 py-2 border border-input rounded-md" />
            <input placeholder="유형" value={filters.probType} onChange={(e) => setFilters({ ...filters, probType: e.target.value })} className="px-3 py-2 border border-input rounded-md" />
            <input placeholder="검색" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} className="px-3 py-2 border border-input rounded-md" />
          </div>
          <div className="mt-3 text-right">
            <button onClick={() => { setPage(1); fetchList(); }} className="px-3 py-2 border border-input rounded-md text-sm hover:bg-hover">필터 적용</button>
          </div>
        </div>

        {/* 목록 + 상세/편집 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* 목록 */}
          <div className="bg-card border border-default rounded-lg overflow-hidden">
            {loading ? (
              <div className="p-6 text-muted">불러오는 중...</div>
            ) : error ? (
              <div className="p-6 text-red-600">{error}</div>
            ) : (
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs text-muted">시험정보</th>
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
                  {items.map((p) => (
                    <tr key={p.id} className={`border-t border-default align-top cursor-pointer ${selectedId === p.id ? 'bg-muted/50' : ''}`} onClick={() => handleSelect(p.id)}>
                      <td className="px-3 py-2 text-sm">{p.examInfo}</td>
                      <td className="px-3 py-2 text-sm">{p.examGrade}</td>
                      <td className="px-3 py-2 text-sm">{p.examYear}</td>
                      <td className="px-3 py-2 text-sm">{p.examTerm}</td>
                      <td className="px-3 py-2 text-sm">{p.probNum}</td>
                      <td className="px-3 py-2 text-sm">{p.probArea}</td>
                      <td className="px-3 py-2 text-sm">{p.probType}</td>
                      <td className="px-3 py-2 text-sm">{p.probRate ?? '-'}</td>
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr><td className="px-3 py-6 text-center text-muted" colSpan={8}>조건에 맞는 문제가 없습니다.</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* 상세/편집 패널 */}
          <div className="bg-card border border-default rounded-lg p-4 min-h-[400px]">
            {!selectedId ? (
              <div className="text-muted">좌측 목록에서 문제를 선택하세요.</div>
            ) : detailLoading ? (
              <div className="text-muted">상세 불러오는 중...</div>
            ) : !detail ? (
              <div className="text-red-600">상세를 불러오지 못했습니다.</div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-title">문제 상세/편집</h3>
                  <div className="flex gap-2">
                    <button disabled={deleting} onClick={deleteDetail} className="px-3 py-2 border border-red-600 text-red-600 rounded-md text-sm disabled:opacity-60">{deleting ? '삭제 중...' : '삭제'}</button>
                    <button disabled={saving} onClick={saveDetail} className="px-3 py-2 bg-indigo-600 text-white rounded-md text-sm disabled:opacity-60">{saving ? '저장 중...' : '저장'}</button>
                  </div>
                </div>

                {/* 문제집 정보 */}
                <div className="border border-default rounded-md p-3">
                  <div className="text-sm text-muted mb-2">문제집 정보</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-muted mb-1">문제집/시험 정보 (examInfo)</label>
                      <input className="px-3 py-2 border border-input rounded-md w-full" value={detail.examInfo}
                        onChange={(e) => setDetail({ ...detail, examInfo: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs text-muted mb-1">매칭된 세트(이름)</label>
                      <input className="px-3 py-2 border border-input rounded-md w-full" value={matchedSet?.name ?? ''} readOnly />
                    </div>
                    <div>
                      <label className="block text-xs text-muted mb-1">출판사</label>
                      <input className="px-3 py-2 border border-input rounded-md w-full" value={matchedSet?.publisher ?? ''} readOnly />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-xs text-muted mb-1">책 번호</label>
                        <input className="px-3 py-2 border border-input rounded-md w-full" value={matchedSet?.bookNum ?? ''} readOnly />
                      </div>
                      <div>
                        <label className="block text-xs text-muted mb-1">세트 학년</label>
                        <input className="px-3 py-2 border border-input rounded-md w-full" value={matchedSet?.examGrade ?? ''} readOnly />
                      </div>
                      <div>
                        <label className="block text-xs text-muted mb-1">세트 학기</label>
                        <input className="px-3 py-2 border border-input rounded-md w-full" value={matchedSet?.examTerm ?? ''} readOnly />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 메타 정보 */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs text-muted mb-1">학년</label>
                    <input type="number" className="px-3 py-2 border border-input rounded-md w-full" value={detail.examGrade}
                      onChange={(e) => setDetail({ ...detail, examGrade: Number(e.target.value) })} />
                  </div>
                  <div>
                    <label className="block text-xs text-muted mb-1">연도</label>
                    <input type="number" className="px-3 py-2 border border-input rounded-md w-full" value={detail.examYear}
                      onChange={(e) => setDetail({ ...detail, examYear: Number(e.target.value) })} />
                  </div>
                  <div>
                    <label className="block text-xs text-muted mb-1">학기</label>
                    <input type="number" className="px-3 py-2 border border-input rounded-md w-full" value={detail.examTerm}
                      onChange={(e) => setDetail({ ...detail, examTerm: Number(e.target.value) })} />
                  </div>
                  <div>
                    <label className="block text-xs text-muted mb-1">번호</label>
                    <input type="number" className="px-3 py-2 border border-input rounded-md w-full" value={detail.probNum}
                      onChange={(e) => setDetail({ ...detail, probNum: Number(e.target.value) })} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-muted mb-1">영역</label>
                    <input className="px-3 py-2 border border-input rounded-md w-full" value={detail.probArea}
                      onChange={(e) => setDetail({ ...detail, probArea: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs text-muted mb-1">유형</label>
                    <input className="px-3 py-2 border border-input rounded-md w-full" value={detail.probType}
                      onChange={(e) => setDetail({ ...detail, probType: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs text-muted mb-1">정답률(선택)</label>
                    <input type="number" step="0.01" className="px-3 py-2 border border-input rounded-md w-full" value={detail.probRate ?? ''}
                      onChange={(e) => setDetail({ ...detail, probRate: e.target.value ? Number(e.target.value) : null })} />
                  </div>
                </div>

                {/* 본문/조건/이미지 */}
                <div>
                  <label className="block text-xs text-muted mb-1">문제 내용</label>
                  <textarea rows={4} className="px-3 py-2 border border-input rounded-md w-full" value={detail.probText}
                    onChange={(e) => setDetail({ ...detail, probText: e.target.value })} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-muted mb-1">조건 내용 (쉼표 구분)</label>
                    <input className="px-3 py-2 border border-input rounded-md w-full" value={detail.condText.join(',')}
                      onChange={(e) => setDetail({ ...detail, condText: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} />
                  </div>
                  <div>
                    <label className="block text-xs text-muted mb-1">문제 이미지 URL들 (쉼표 구분)</label>
                    <input className="px-3 py-2 border border-input rounded-md w-full" value={detail.probImages.join(',')}
                      onChange={(e) => setDetail({ ...detail, probImages: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} />
                  </div>
                  <div>
                    <label className="block text-xs text-muted mb-1">조건 이미지 URL들 (쉼표 구분)</label>
                    <input className="px-3 py-2 border border-input rounded-md w-full" value={detail.condImages.join(',')}
                      onChange={(e) => setDetail({ ...detail, condImages: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} />
                  </div>
                </div>

                {/* 풀이 */}
                <div className="border border-default rounded-md p-3">
                  <div className="text-sm font-medium mb-2">풀이</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-muted mb-1">정답 (solAns)</label>
                      <input className="px-3 py-2 border border-input rounded-md w-full" value={detail.solAns ?? ''}
                        onChange={(e) => setDetail({ ...detail, solAns: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs text-muted mb-1">풀이 이미지 URL들 (쉼표 구분)</label>
                      <input className="px-3 py-2 border border-input rounded-md w-full" value={(detail.solImages ?? []).join(',')}
                        onChange={(e) => setDetail({ ...detail, solImages: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} />
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="block text-xs text-muted mb-1">풀이 설명 (solText)</label>
                    <textarea rows={4} className="px-3 py-2 border border-input rounded-md w-full" value={detail.solText ?? ''}
                      onChange={(e) => setDetail({ ...detail, solText: e.target.value })} />
                  </div>
                </div>

                {/* 미리보기 (가능한 경우) */}
                {(detail.probImages.length > 0 || detail.condImages.length > 0) && (
                  <div className="border border-default rounded-md p-3">
                    <div className="text-sm font-medium mb-2">이미지 미리보기</div>
                    <div className="flex flex-wrap gap-3">
                      {detail.probImages.map((src, i) => (
                        <img key={`p-${i}`} src={src} alt="problem" className="w-32 h-32 object-contain border border-default rounded" />
                      ))}
                      {detail.condImages.map((src, i) => (
                        <img key={`c-${i}`} src={src} alt="condition" className="w-32 h-32 object-contain border border-default rounded" />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button key={n} onClick={() => setPage(n)} className={`px-3 py-1 rounded-md text-sm ${n === page ? 'bg-indigo-600 text-white' : 'border border-input hover:bg-hover'}`}>{n}</button>
            ))}
          </div>
        )}

        {/* 단건 추가 모달 */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card border border-default rounded-lg w-full max-w-3xl p-6">
              <h3 className="text-lg font-semibold text-title mb-4">문제 추가</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <input placeholder="시험정보" className="px-3 py-2 border border-input rounded-md" value={createForm.examInfo} onChange={(e) => setCreateForm({ ...createForm, examInfo: e.target.value })} />
                <input type="number" placeholder="학년" className="px-3 py-2 border border-input rounded-md" value={createForm.examGrade} onChange={(e) => setCreateForm({ ...createForm, examGrade: Number(e.target.value) })} />
                <input type="number" placeholder="연도" className="px-3 py-2 border border-input rounded-md" value={createForm.examYear} onChange={(e) => setCreateForm({ ...createForm, examYear: Number(e.target.value) })} />
                <input type="number" placeholder="학기" className="px-3 py-2 border border-input rounded-md" value={createForm.examTerm} onChange={(e) => setCreateForm({ ...createForm, examTerm: Number(e.target.value) })} />
                <input type="number" placeholder="번호" className="px-3 py-2 border border-input rounded-md" value={createForm.probNum} onChange={(e) => setCreateForm({ ...createForm, probNum: Number(e.target.value) })} />
                <input placeholder="영역" className="px-3 py-2 border border-input rounded-md" value={createForm.probArea} onChange={(e) => setCreateForm({ ...createForm, probArea: e.target.value })} />
                <input placeholder="유형" className="px-3 py-2 border border-input rounded-md" value={createForm.probType} onChange={(e) => setCreateForm({ ...createForm, probType: e.target.value })} />
                <input type="number" step="0.01" placeholder="정답률(선택)" className="px-3 py-2 border border-input rounded-md" value={createForm.probRate ?? ''} onChange={(e) => setCreateForm({ ...createForm, probRate: e.target.value ? Number(e.target.value) : null })} />
              </div>
              <div className="grid grid-cols-1 gap-3">
                <textarea placeholder="문제 내용" className="px-3 py-2 border border-input rounded-md" rows={4} value={createForm.probText} onChange={(e) => setCreateForm({ ...createForm, probText: e.target.value })} />
                <input placeholder="조건 내용(쉼표로 구분)" className="px-3 py-2 border border-input rounded-md" value={createForm.condText.join(',')} onChange={(e) => setCreateForm({ ...createForm, condText: e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean) })} />
                <input placeholder="조건 이미지 URL(쉼표로 구분)" className="px-3 py-2 border border-input rounded-md" value={createForm.condImages.join(',')} onChange={(e) => setCreateForm({ ...createForm, condImages: e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean) })} />
                <input placeholder="문제 이미지 URL(쉼표로 구분)" className="px-3 py-2 border border-input rounded-md" value={createForm.probImages.join(',')} onChange={(e) => setCreateForm({ ...createForm, probImages: e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean) })} />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => setShowCreate(false)} className="px-3 py-2 border border-input rounded-md text-sm">취소</button>
                <button disabled={creating} onClick={createSingle} className="px-3 py-2 bg-indigo-600 text-white rounded-md text-sm">{creating ? '저장 중...' : '저장'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}



