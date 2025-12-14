// @ts-nocheck
"use client";

import React, { useEffect, useState } from 'react';

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

export default function QBankChapters() {
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<string>('');
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');

  // 새 대단원 입력
  const [newChapterName, setNewChapterName] = useState('');
  const [addingChapter, setAddingChapter] = useState(false);

  // 새 소단원 입력 (각 대단원별로)
  const [newSectionNames, setNewSectionNames] = useState<Record<string, string>>({});
  const [addingSections, setAddingSections] = useState<Record<string, boolean>>({});

  // 문제집 목록 로드
  useEffect(() => {
    const fetchSets = async () => {
      try {
        const resp = await fetch('/api/qbank/sets');
        const ct = resp.headers.get('content-type') || '';
        if (!ct.includes('application/json')) {
          throw new Error(`세트 목록이 올바르지 않습니다(${resp.status}).`);
        }
        const data = await resp.json();
        const items = data.items || [];
        setBooks(items.map((s: any) => ({ name: s.name })));
      } catch (e: any) {
        setError(e.message || '문제집 목록을 불러오지 못했습니다.');
      }
    };
    fetchSets();
  }, []);

  // 선택된 문제집의 단원 목록 로드
  useEffect(() => {
    if (!selectedBook) {
      setChapters([]);
      return;
    }
    
    const fetchChapters = async () => {
      try {
        setLoading(true);
        const resp = await fetch(`/api/qbank/chapters?book=${encodeURIComponent(selectedBook)}`);
        const data = await resp.json();
        if (!resp.ok) throw new Error(data.error || '단원 목록 로드 실패');
        setChapters(data.chapters || []);
        setError('');
      } catch (e: any) {
        setError(e.message || '단원 목록을 불러오지 못했습니다.');
        setChapters([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchChapters();
  }, [selectedBook]);

  const addChapter = async () => {
    if (!selectedBook || !newChapterName.trim()) return;
    
    try {
      setAddingChapter(true);
      const resp = await fetch('/api/qbank/chapters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookName: selectedBook,
          chapterName: newChapterName.trim(),
          chapterOrder: chapters.length + 1,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || '대단원 추가 실패');
      
      setChapters(prev => [...prev, data.chapter]);
      setNewChapterName('');
      setSaveMessage(`대단원 "${newChapterName.trim()}"이 추가되었습니다.`);
      setTimeout(() => setSaveMessage(''), 2500);
    } catch (e: any) {
      alert(e.message || '대단원 추가 중 오류');
    } finally {
      setAddingChapter(false);
    }
  };

  const addSection = async (chapterId: string) => {
    const sectionName = newSectionNames[chapterId]?.trim();
    if (!sectionName) return;
    
    try {
      setAddingSections(prev => ({ ...prev, [chapterId]: true }));
      const chapter = chapters.find(c => c.id === chapterId);
      const resp = await fetch('/api/qbank/sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterId,
          sectionName,
          sectionOrder: (chapter?.sections || []).length + 1,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || '소단원 추가 실패');
      
      setChapters(prev => prev.map(c => 
        c.id === chapterId 
          ? { ...c, sections: [...c.sections, data.section] }
          : c
      ));
      setNewSectionNames(prev => ({ ...prev, [chapterId]: '' }));
      setSaveMessage(`소단원 "${sectionName}"이 추가되었습니다.`);
      setTimeout(() => setSaveMessage(''), 2500);
    } catch (e: any) {
      alert(e.message || '소단원 추가 중 오류');
    } finally {
      setAddingSections(prev => ({ ...prev, [chapterId]: false }));
    }
  };

  const deleteChapter = async (chapterId: string) => {
    const chapter = chapters.find(c => c.id === chapterId);
    if (!chapter) return;
    
    if (!confirm(`대단원 "${chapter.chapterName}"과 모든 소단원을 삭제하시겠습니까?`)) return;
    
    try {
      const resp = await fetch(`/api/qbank/chapters/${chapterId}`, { method: 'DELETE' });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || '대단원 삭제 실패');
      
      setChapters(prev => prev.filter(c => c.id !== chapterId));
      setSaveMessage(`대단원 "${chapter.chapterName}"이 삭제되었습니다.`);
      setTimeout(() => setSaveMessage(''), 2500);
    } catch (e: any) {
      alert(e.message || '대단원 삭제 중 오류');
    }
  };

  const deleteSection = async (sectionId: string, chapterId: string) => {
    const chapter = chapters.find(c => c.id === chapterId);
    const section = chapter?.sections.find(s => s.id === sectionId);
    if (!section) return;
    
    if (!confirm(`소단원 "${section.sectionName}"을 삭제하시겠습니까?`)) return;
    
    try {
      const resp = await fetch(`/api/qbank/sections/${sectionId}`, { method: 'DELETE' });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || '소단원 삭제 실패');
      
      setChapters(prev => prev.map(c => 
        c.id === chapterId 
          ? { ...c, sections: c.sections.filter(s => s.id !== sectionId) }
          : c
      ));
      setSaveMessage(`소단원 "${section.sectionName}"이 삭제되었습니다.`);
      setTimeout(() => setSaveMessage(''), 2500);
    } catch (e: any) {
      alert(e.message || '소단원 삭제 중 오류');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">단원 등록</h1>
          <p className="text-muted">문제집의 대단원과 소단원을 등록하고 관리합니다.</p>
        </div>

        {/* 저장 메시지 */}
        <div className="mb-4">
          <div className={`h-9 px-3 py-1.5 text-sm rounded transition-opacity ${
            saveMessage ? 'opacity-100 border border-green-600 text-green-700 bg-green-50' : 'opacity-0'
          }`}>
            {saveMessage || ''}
          </div>
        </div>

        {/* 오류 메시지 */}
        {error && (
          <div className="mb-4 p-3 border border-red-300 bg-red-50 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* 문제집 선택 */}
        <div className="bg-card border border-default rounded-lg p-4 mb-6">
          <label className="block text-sm font-medium text-foreground mb-2">
            문제집 선택
          </label>
          <select 
            className="w-full px-3 py-2 border border-input rounded-md bg-background"
            value={selectedBook} 
            onChange={(e) => setSelectedBook(e.target.value)}
          >
            <option value="">문제집을 선택하세요</option>
            {books.map((book) => (
              <option key={book.name} value={book.name}>{book.name}</option>
            ))}
          </select>
        </div>

        {selectedBook && (
          <div className="bg-card border border-default rounded-lg p-4">
            {/* 새 대단원 추가 */}
            <div className="mb-6 pb-4 border-b border-default">
              <h3 className="text-lg font-medium text-foreground mb-3">새 대단원 추가</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 px-3 py-2 border border-input rounded-md"
                  placeholder="대단원명을 입력하세요"
                  value={newChapterName}
                  onChange={(e) => setNewChapterName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addChapter();
                    }
                  }}
                />
                <button
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  onClick={addChapter}
                  disabled={!newChapterName.trim() || addingChapter}
                >
                  {addingChapter ? '추가 중...' : '대단원 추가'}
                </button>
              </div>
            </div>

            {/* 대단원 목록 */}
            {loading ? (
              <div className="text-center py-8 text-muted">로딩 중...</div>
            ) : chapters.length === 0 ? (
              <div className="text-center py-8 text-muted">등록된 대단원이 없습니다.</div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-foreground">등록된 단원</h3>
                {chapters.map((chapter) => (
                  <div key={chapter.id} className="border border-default rounded-lg p-4">
                    {/* 대단원 헤더 */}
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-md font-medium text-foreground">
                        {chapter.chapterOrder}. {chapter.chapterName}
                      </h4>
                      <button
                        className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                        onClick={() => deleteChapter(chapter.id)}
                      >
                        대단원 삭제
                      </button>
                    </div>

                    {/* 소단원 추가 */}
                    <div className="mb-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          className="flex-1 px-2 py-1 text-sm border border-input rounded"
                          placeholder="소단원명을 입력하세요"
                          value={newSectionNames[chapter.id] || ''}
                          onChange={(e) => setNewSectionNames(prev => ({ 
                            ...prev, 
                            [chapter.id]: e.target.value 
                          }))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addSection(chapter.id);
                            }
                          }}
                        />
                        <button
                          className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
                          onClick={() => addSection(chapter.id)}
                          disabled={!newSectionNames[chapter.id]?.trim() || addingSections[chapter.id]}
                        >
                          {addingSections[chapter.id] ? '추가 중...' : '소단원 추가'}
                        </button>
                      </div>
                    </div>

                    {/* 소단원 목록 */}
                    {chapter.sections.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {chapter.sections.map((section) => (
                          <div key={section.id} className="flex items-center justify-between bg-muted p-2 rounded">
                            <span className="text-sm">
                              {chapter.chapterOrder}-{section.sectionOrder}. {section.sectionName}
                            </span>
                            <button
                              className="text-xs text-red-600 hover:bg-red-50 px-2 py-1 rounded"
                              onClick={() => deleteSection(section.id, chapter.id)}
                            >
                              삭제
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-muted">등록된 소단원이 없습니다.</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


