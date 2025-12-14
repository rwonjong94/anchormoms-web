'use client';

import React, { useEffect, useState } from 'react';

export default function QBankRegister() {
  const [name, setName] = useState('');
  const [folder, setFolder] = useState('');
  const [publisher, setPublisher] = useState('');
  const [bookNum, setBookNum] = useState<string>('');
  const [examGrade, setExamGrade] = useState<string>('');
  const [examTerm, setExamTerm] = useState<string>('');
  const [group, setGroup] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [folders, setFolders] = useState<{ name: string; folder: string }[]>([]);
  const [sets, setSets] = useState<any[]>([]);
  const [groupOptions, setGroupOptions] = useState<string[]>(['SMC', 'KMC']);
  const [editTargetName, setEditTargetName] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [fResp, sResp] = await Promise.all([
          fetch('/api/qbank/folders'),
          fetch('/api/qbank/sets'),
        ]);
        const fJson = await fResp.json();
        const sJson = await sResp.json();
        setFolders(fJson.items || []);
        const items = sJson.items || [];
        setSets(items);
        const existingGroups = Array.from(new Set((items || []).map((s: any) => (s.group ? String(s.group).trim() : '')).filter(Boolean)));
        setGroupOptions(Array.from(new Set(['SMC', 'KMC', ...existingGroups])));
      } catch (e) {
        // ignore
      }
    };
    load();
  }, []);

  const resetForm = () => {
    setName('');
    setFolder('');
    setPublisher('');
    setBookNum('');
    setExamGrade('');
    setExamTerm('');
    setGroup('');
    setEditTargetName(null);
  };

  const loadForEdit = (s: any) => {
    setName(s.name || '');
    setFolder(s.folder || '');
    setPublisher(s.publisher || '');
    setBookNum(s.bookNum === null || s.bookNum === undefined ? '' : String(s.bookNum));
    setExamGrade(s.examGrade === null || s.examGrade === undefined ? '' : String(s.examGrade));
    setExamTerm(s.examTerm === null || s.examTerm === undefined ? '' : String(s.examTerm));
    setGroup(s.group || '');
    setEditTargetName(s.name || '');
  };

  const save = async () => {
    try {
      setSaving(true);
      const payload: any = { name, folder };
      if (editTargetName && editTargetName !== name) payload.originalName = editTargetName;
      if (publisher) payload.publisher = publisher;
      if (bookNum !== '') payload.bookNum = Number(bookNum);
      if (examGrade !== '') payload.examGrade = Number(examGrade);
      if (examTerm !== '') payload.examTerm = Number(examTerm);
      if (group) payload.group = group;
      const resp = await fetch('/api/qbank/sets', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || '저장 실패');
      alert(editTargetName ? '수정되었습니다.' : '저장되었습니다.');
      resetForm();
      const sResp = await fetch('/api/qbank/sets');
      const sJson = await sResp.json();
      const items = sJson.items || [];
      setSets(items);
      const existingGroups = Array.from(new Set((items || []).map((s: any) => (s.group ? String(s.group).trim() : '')).filter(Boolean)));
      setGroupOptions(Array.from(new Set(['SMC', 'KMC', ...existingGroups])));
    } catch (e: any) {
      alert(e.message || '오류');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-card border border-default rounded-lg p-4 max-w-4xl">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-base font-semibold text-title">문제집 {editTargetName ? '편집' : '등록'}</h3>
        {editTargetName && (
          <button className="px-3 py-1 border border-input rounded text-sm" onClick={resetForm}>새 항목</button>
        )}
      </div>
      {editTargetName && (
        <div className="mb-3 text-xs text-muted">편집 중: <span className="font-medium text-body">{editTargetName}</span> (이름을 바꾸면 새 항목으로 저장됩니다)</div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-xs text-muted mb-1">문제집 이름</label>
          <input className="px-3 py-2 border border-input rounded w-full" placeholder="예: 성대경시(전기) 초등1 문제편 (2025)" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="col-span-2">
          <label className="block text-xs text-muted mb-1">이미지 폴더 경로 선택 (BOOKS_BASE_DIR 기준)</label>
          <select className="px-3 py-2 border border-input rounded w-full" value={folder} onChange={(e) => setFolder(e.target.value)}>
            <option value="">폴더 선택</option>
            {folders.map((f) => (
              <option key={f.folder} value={f.folder}>{f.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">문제집 그룹</label>
          <input list="qbank-group-options" className="px-3 py-2 border border-input rounded w-full" placeholder="예: SMC, KMC" value={group} onChange={(e) => setGroup(e.target.value)} />
          <datalist id="qbank-group-options">
            {groupOptions.map((g) => (
              <option key={g} value={g} />
            ))}
          </datalist>
        </div>
        <div className="flex items-end">
          <button className="px-3 py-2 border border-input rounded w-full" onClick={() => { if (group && !groupOptions.includes(group)) setGroupOptions((prev) => [...prev, group]); }}>그룹 추가</button>
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">출판사</label>
          <input className="px-3 py-2 border border-input rounded w-full" value={publisher} onChange={(e) => setPublisher(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">책 번호(선택)</label>
          <input type="number" className="px-3 py-2 border border-input rounded w-full" value={bookNum} onChange={(e) => setBookNum(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">학년(선택)</label>
          <input type="number" className="px-3 py-2 border border-input rounded w-full" value={examGrade} onChange={(e) => setExamGrade(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">학기(선택)</label>
          <input type="number" className="px-3 py-2 border border-input rounded w-full" value={examTerm} onChange={(e) => setExamTerm(e.target.value)} />
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button disabled={saving} className="px-4 py-2 border border-input rounded" onClick={resetForm}>초기화</button>
        <button disabled={saving} className="px-4 py-2 bg-indigo-600 text-white rounded" onClick={save}>{saving ? '저장 중...' : (editTargetName ? '수정 저장' : '저장')}</button>
      </div>
      {sets.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-title mb-2">등록된 문제집</h3>
          <div className="border border-default rounded overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-3 py-2 text-left">이름</th>
                  <th className="px-3 py-2 text-left">폴더</th>
                  <th className="px-3 py-2 text-left">출판사</th>
                  <th className="px-3 py-2 text-left">책번호</th>
                  <th className="px-3 py-2 text-left">학년</th>
                  <th className="px-3 py-2 text-left">학기</th>
                  <th className="px-3 py-2 text-left">그룹</th>
                  <th className="px-3 py-2 text-right">작업</th>
                </tr>
              </thead>
              <tbody>
                {sets.map((s) => (
                  <tr key={s.name} className="border-t border-default">
                    <td className="px-3 py-2">{s.name}</td>
                    <td className="px-3 py-2">{s.folder}</td>
                    <td className="px-3 py-2">{s.publisher || '-'}</td>
                    <td className="px-3 py-2">{s.bookNum ?? '-'}</td>
                    <td className="px-3 py-2">{s.examGrade ?? '-'}</td>
                    <td className="px-3 py-2">{s.examTerm ?? '-'}</td>
                    <td className="px-3 py-2">{s.group || '-'}</td>
                    <td className="px-3 py-2 text-right">
                      <button className="px-2 py-1 border border-input rounded" onClick={() => loadForEdit(s)}>편집</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}


