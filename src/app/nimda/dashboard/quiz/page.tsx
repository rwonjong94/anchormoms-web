'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminPageLayout from '@/components/admin/AdminPageLayout';

// 퀴즈 문제 타입 정의
interface QuizQuestion {
  id: string;
  question: string;
  answer: string;
  explanation: string;
  type: string;
  difficulty: '초급' | '중급' | '고급';
  points: number;
  createdAt: Date;
  isActive: boolean;
}

// 퀴즈 세트 타입 정의
interface QuizSetItem {
  id: string;
  setId: string;
  questionId: string;
  order: number;
  question: QuizQuestion;
}

interface QuizSet {
  id: string;
  title: string;
  category: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  items: QuizSetItem[];
}

interface QuizType {
  id: string;
  key: string;
  name: string;
  description?: string;
  order: number;
  isActive: boolean;
}

export default function QuizManagementPage() {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [sets, setSets] = useState<QuizSet[]>([]);
  const [quizTypes, setQuizTypes] = useState<QuizType[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null);
  const [showAddSetModal, setShowAddSetModal] = useState(false);
  const [editingSet, setEditingSet] = useState<QuizSet | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddTypeModal, setShowAddTypeModal] = useState(false);
  const [editingType, setEditingType] = useState<QuizType | null>(null);

  // 유형 로드
  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const response = await fetch('/api/quiz/types', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setQuizTypes(data);
          if (typeof window !== 'undefined') {
            (window as any).___quizTypesForEdit = data;
          }
        }
      } catch (e) {
        console.error('퀴즈 유형 로드 실패', e);
      }
    };
    fetchTypes();
  }, []);

  // 퀴즈 문제 데이터 로드
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await fetch('/api/quiz/questions', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setQuestions(data.map((q: any) => ({
            ...q,
            createdAt: new Date(q.createdAt)
          })));
        }
      } catch (error) {
        console.error('퀴즈 문제를 불러오는데 실패했습니다:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, []);

  // 세트 데이터 로드
  useEffect(() => {
    const fetchSets = async () => {
      try {
        const response = await fetch('/api/quiz/sets', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setSets(data.map((s: any) => ({
            ...s,
            createdAt: new Date(s.createdAt),
            updatedAt: new Date(s.updatedAt)
          })));
        }
      } catch (error) {
        console.error('퀴즈 세트를 불러오는데 실패했습니다:', error);
      }
    };

    fetchSets();
  }, []);

  // 필터링된 문제들
  const filteredQuestions = questions.filter(question => {
    const matchesType = filterType === 'all' || question.type === filterType;
    const matchesDifficulty = filterDifficulty === 'all' || question.difficulty === filterDifficulty;
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && question.isActive) ||
      (filterStatus === 'inactive' && !question.isActive);
    const matchesSearch = searchTerm === '' || 
      question.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      question.answer.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesType && matchesDifficulty && matchesStatus && matchesSearch;
  });

  // 문제 활성화/비활성화 토글
  const toggleQuestionStatus = (questionId: string) => {
    setQuestions(prev => prev.map(q => 
      q.id === questionId ? { ...q, isActive: !q.isActive } : q
    ));
  };

  // 문제 삭제
  const deleteQuestion = (questionId: string) => {
    if (confirm('정말로 이 문제를 삭제하시겠습니까?')) {
      setQuestions(prev => prev.filter(q => q.id !== questionId));
    }
  };

  // 새 문제 추가
  const handleAddQuestion = async (newQuestion: Omit<QuizQuestion, 'id' | 'createdAt'>) => {
    try {
      const response = await fetch('/api/quiz/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(newQuestion)
      });

      if (response.ok) {
        const createdQuestion = await response.json();
        setQuestions(prev => [...prev, {
          ...createdQuestion,
          createdAt: new Date(createdQuestion.createdAt)
        }]);
        setShowAddModal(false);
      } else {
        console.error('문제 생성에 실패했습니다.');
        alert('문제 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('문제 생성 중 오류가 발생했습니다:', error);
      alert('문제 생성 중 오류가 발생했습니다.');
    }
  };

  // 문제 수정
  const handleEditQuestion = (updatedQuestion: QuizQuestion) => {
    setQuestions(prev => prev.map(q => 
      q.id === updatedQuestion.id ? updatedQuestion : q
    ));
    setEditingQuestion(null);
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <AdminPageLayout
          title="퀴즈 관리"
          description="경시대회 퀴즈 문제와 세트를 관리할 수 있습니다."
          headerActions={null}
        >
        

        {/* 필터 및 검색 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                유형
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="all">전체</option>
                {quizTypes.map(type => (
                  <option key={type.id} value={type.key}>{type.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                난이도
              </label>
              <select
                value={filterDifficulty}
                onChange={(e) => setFilterDifficulty(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="all">전체</option>
                <option value="초급">초급</option>
                <option value="중급">중급</option>
                <option value="고급">고급</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                상태
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="all">전체</option>
                <option value="active">활성</option>
                <option value="inactive">비활성</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                검색
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="문제 내용 검색..."
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
        </div>

          {/* 문제 목록 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              문제 목록 ({filteredQuestions.length}개)
            </h2>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
            >
              새 문제 추가
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    문제
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    유형
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    난이도
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    포인트
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    생성일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredQuestions.map((question) => (
                  <tr key={question.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white max-w-xs truncate">
                        {question.question}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded-full">
                        {quizTypes.find(t => t.key === question.type)?.name}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        question.difficulty === '초급' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                        question.difficulty === '중급' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                        'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {question.difficulty}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {question.points}점
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        question.isActive 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                      }`}>
                        {question.isActive ? '활성' : '비활성'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {question.createdAt.toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setEditingQuestion(question)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => toggleQuestionStatus(question.id)}
                          className={`${
                            question.isActive 
                              ? 'text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300'
                              : 'text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300'
                          }`}
                        >
                          {question.isActive ? '비활성화' : '활성화'}
                        </button>
                        <button
                          onClick={() => deleteQuestion(question.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredQuestions.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 dark:text-gray-600 text-lg">
                조건에 맞는 문제가 없습니다.
              </div>
            </div>
          )}
          </div>

        {/* 세트 목록 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden mt-10">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                세트 목록 ({sets.length}개)
              </h2>
              <button
                onClick={() => setShowAddSetModal(true)}
                className="px-3 py-2 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700"
              >
                새 세트 추가
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">제목</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">카테고리</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">문항 수</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">상태</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">생성일</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">작업</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {sets.map((set) => (
                    <tr key={set.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{set.title}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{set.category}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{set.items?.length || 0}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          set.isActive 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                        }`}>
                          {set.isActive ? '활성' : '비활성'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{set.createdAt.toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setEditingSet(set)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            수정
                          </button>
                          <button
                            onClick={async () => {
                              const newStatus = !set.isActive;
                              try {
                                const res = await fetch(`/api/quiz/sets/${set.id}`, {
                                  method: 'PUT',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`
                                  },
                                  body: JSON.stringify({ isActive: newStatus })
                                });
                                if (res.ok) {
                                  setSets(prev => prev.map(s => s.id === set.id ? { ...s, isActive: newStatus } as QuizSet : s));
                                }
                              } catch (e) {
                                console.error('세트 상태 변경 실패', e);
                              }
                            }}
                            className={`${set.isActive ? 'text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300' : 'text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300'}`}
                          >
                            {set.isActive ? '비활성화' : '활성화'}
                          </button>
                          <button
                            onClick={async () => {
                              if (!confirm('정말로 이 세트를 삭제하시겠습니까?')) return;
                              try {
                                const res = await fetch(`/api/quiz/sets/${set.id}`, {
                                  method: 'DELETE',
                                  headers: {
                                    'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`
                                  }
                                });
                                if (res.ok) {
                                  setSets(prev => prev.filter(s => s.id !== set.id));
                                }
                              } catch (e) {
                                console.error('세트 삭제 실패', e);
                              }
                            }}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          >
                            삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {sets.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 dark:text-gray-600 text-lg">
                  등록된 세트가 없습니다.
                </div>
              </div>
            )}
          </div>

          {/* 유형 관리 - 페이지 하단 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden mt-10">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">유형 관리</h2>
              <button
                onClick={() => setShowAddTypeModal(true)}
                className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
              >
                새 유형 추가
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">표시명</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Key</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">설명</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">정렬</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">상태</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">작업</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {quizTypes.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-3 text-sm text-gray-900 dark:text-white">{t.name}</td>
                      <td className="px-6 py-3 text-sm text-gray-900 dark:text-white">{t.key}</td>
                      <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-300">{t.description || '-'}</td>
                      <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-300">{t.order}</td>
                      <td className="px-6 py-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${t.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'}`}>
                          {t.isActive ? '활성' : '비활성'}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => setEditingType(t)} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 text-sm">수정</button>
                          <button
                            onClick={async () => {
                              try {
                                const res = await fetch(`/api/quiz/types/${t.id}`, {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}` },
                                  body: JSON.stringify({ isActive: !t.isActive })
                                });
                                if (res.ok) setQuizTypes(prev => prev.map(x => x.id === t.id ? { ...x, isActive: !t.isActive } : x));
                              } catch {}
                            }}
                            className={`${t.isActive ? 'text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300' : 'text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300'} text-sm`}
                          >{t.isActive ? '비활성화' : '활성화'}</button>
                          <button
                            onClick={async () => {
                              if (!confirm('이 유형을 삭제하시겠습니까?')) return;
                              try {
                                const res = await fetch(`/api/quiz/types/${t.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}` } });
                                if (res.ok) setQuizTypes(prev => prev.filter(x => x.id !== t.id));
                              } catch {}
                            }}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 text-sm"
                          >삭제</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {quizTypes.length === 0 && (
                    <tr>
                      <td className="px-6 py-8 text-center text-gray-400 dark:text-gray-600" colSpan={6}>등록된 유형이 없습니다.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 새 문제 추가 모달 */}
          {showAddModal && (
            <AddQuestionModal
              quizTypes={quizTypes}
              onClose={() => setShowAddModal(false)}
              onSubmit={handleAddQuestion}
            />
          )}

          {/* 문제 수정 모달 */}
          {editingQuestion && (
            <EditQuestionModal
              quizTypes={quizTypes}
              question={editingQuestion}
              onClose={() => setEditingQuestion(null)}
              onSubmit={handleEditQuestion}
            />
          )}

        {/* 세트 추가 모달 */}
        {showAddSetModal && (
          <AddSetModal
            questions={questions}
            quizTypes={quizTypes}
            onClose={() => setShowAddSetModal(false)}
            onSubmit={async (payload) => {
              try {
                const res = await fetch('/api/quiz/sets', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`
                  },
                  body: JSON.stringify(payload)
                });
                if (res.ok) {
                  const created = await res.json();
                  // 새로고침 겸 목록 갱신
                  const listRes = await fetch('/api/quiz/sets', {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}` }
                  });
                  if (listRes.ok) {
                    const data = await listRes.json();
                    setSets(data.map((s: any) => ({ ...s, createdAt: new Date(s.createdAt), updatedAt: new Date(s.updatedAt) })));
                  }
                  setShowAddSetModal(false);
                } else {
                  alert('세트 생성에 실패했습니다.');
                }
              } catch (e) {
                console.error('세트 생성 중 오류', e);
                alert('세트 생성 중 오류가 발생했습니다.');
              }
            }}
          />
        )}

        {/* 세트 수정 모달 */}
        {editingSet && (
          <EditSetModal
            setData={editingSet}
            questions={questions}
            onClose={() => setEditingSet(null)}
            onSubmit={async (id, payload) => {
              try {
                const res = await fetch(`/api/quiz/sets/${id}`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`
                  },
                  body: JSON.stringify(payload)
                });
                if (res.ok) {
                  // 목록 갱신
                  const listRes = await fetch('/api/quiz/sets', {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}` }
                  });
                  if (listRes.ok) {
                    const data = await listRes.json();
                    setSets(data.map((s: any) => ({ ...s, createdAt: new Date(s.createdAt), updatedAt: new Date(s.updatedAt) })));
                  }
                  setEditingSet(null);
                } else {
                  alert('세트 수정에 실패했습니다.');
                }
              } catch (e) {
                console.error('세트 수정 중 오류', e);
                alert('세트 수정 중 오류가 발생했습니다.');
              }
            }}
          />
        )}

        {/* 유형 추가 모달 */}
        {showAddTypeModal && (
          <AddTypeModal
            onClose={() => setShowAddTypeModal(false)}
            onSubmit={async (payload) => {
              try {
                const res = await fetch('/api/quiz/types', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}` },
                  body: JSON.stringify(payload)
                });
                if (res.ok) {
                  const created = await res.json();
                  setQuizTypes(prev => [...prev, created].sort((a,b)=> (a.order-b.order) || a.name.localeCompare(b.name)));
                  setShowAddTypeModal(false);
                } else {
                  alert('유형 추가에 실패했습니다.');
                }
              } catch (e) {
                console.error('유형 추가 중 오류', e);
                alert('유형 추가 중 오류가 발생했습니다.');
              }
            }}
          />
        )}

        {/* 유형 수정 모달 */}
        {editingType && (
          <EditTypeModal
            type={editingType}
            onClose={() => setEditingType(null)}
            onSubmit={async (id, payload) => {
              try {
                const res = await fetch(`/api/quiz/types/${id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}` },
                  body: JSON.stringify(payload)
                });
                if (res.ok) {
                  const updated = await res.json();
                  setQuizTypes(prev => prev.map(x => x.id === id ? updated : x));
                  setEditingType(null);
                } else {
                  alert('유형 수정에 실패했습니다.');
                }
              } catch (e) {
                console.error('유형 수정 중 오류', e);
                alert('유형 수정 중 오류가 발생했습니다.');
              }
            }}
          />
        )}
        </AdminPageLayout>
      </div>
    </AdminLayout>
  );
}

// 새 문제 추가 모달 컴포넌트
function AddQuestionModal({ onClose, onSubmit, quizTypes }: { 
  onClose: () => void; 
  onSubmit: (question: Omit<QuizQuestion, 'id' | 'createdAt'>) => void;
  quizTypes: { id: string; key: string; name: string }[];
}) {
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    explanation: '',
    type: (quizTypes[0]?.key || 'how-many'),
    difficulty: '초급' as '초급' | '중급' | '고급',
    points: 10,
    isActive: true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            새 문제 추가
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                문제 내용
              </label>
              <textarea
                value={formData.question}
                onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                rows={3}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                정답
              </label>
              <input
                type="text"
                value={formData.answer}
                onChange={(e) => setFormData(prev => ({ ...prev, answer: e.target.value }))}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                해설
              </label>
              <textarea
                value={formData.explanation}
                onChange={(e) => setFormData(prev => ({ ...prev, explanation: e.target.value }))}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  난이도
                </label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value as '초급' | '중급' | '고급' }))}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="초급">초급</option>
                  <option value="중급">중급</option>
                  <option value="고급">고급</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                포인트
              </label>
              <input
                type="number"
                value={formData.points}
                onChange={(e) => setFormData(prev => ({ ...prev, points: parseInt(e.target.value) }))}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                min="1"
                max="100"
                required
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                활성 상태
              </label>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                추가
              </button>
            </div>
          </form>
        </div>

        {/* 유형 관리 - 페이지 하단 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden mt-10">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">유형 관리</h2>
            <button
              onClick={() => setShowAddTypeModal(true)}
              className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
            >
              새 유형 추가
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">표시명</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Key</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">설명</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">정렬</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">상태</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">작업</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {quizTypes.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-3 text-sm text-gray-900 dark:text-white">{t.name}</td>
                    <td className="px-6 py-3 text-sm text-gray-900 dark:text-white">{t.key}</td>
                    <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-300">{t.description || '-'}</td>
                    <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-300">{t.order}</td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${t.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'}`}>
                        {t.isActive ? '활성' : '비활성'}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => setEditingType(t)} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 text-sm">수정</button>
                        <button
                          onClick={async () => {
                            try {
                              const res = await fetch(`/api/quiz/types/${t.id}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}` },
                                body: JSON.stringify({ isActive: !t.isActive })
                              });
                              if (res.ok) setQuizTypes(prev => prev.map(x => x.id === t.id ? { ...x, isActive: !t.isActive } : x));
                            } catch {}
                          }}
                          className={`${t.isActive ? 'text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300' : 'text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300'} text-sm`}
                        >{t.isActive ? '비활성화' : '활성화'}</button>
                        <button
                          onClick={async () => {
                            if (!confirm('이 유형을 삭제하시겠습니까?')) return;
                            try {
                              const res = await fetch(`/api/quiz/types/${t.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}` } });
                              if (res.ok) setQuizTypes(prev => prev.filter(x => x.id !== t.id));
                            } catch {}
                          }}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 text-sm"
                        >삭제</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {quizTypes.length === 0 && (
                  <tr>
                    <td className="px-6 py-8 text-center text-gray-400 dark:text-gray-600" colSpan={6}>등록된 유형이 없습니다.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// 문제 수정 모달 컴포넌트
function EditQuestionModal({ question, onClose, onSubmit, quizTypes }: { 
  question: QuizQuestion; 
  onClose: () => void; 
  onSubmit: (question: QuizQuestion) => void;
  quizTypes: { id: string; key: string; name: string }[];
}) {
  const [formData, setFormData] = useState({
    question: question.question,
    answer: question.answer,
    explanation: question.explanation,
    type: question.type,
    difficulty: question.difficulty,
    points: question.points,
    isActive: question.isActive
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...question, ...formData });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            문제 수정
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                문제 내용
              </label>
              <textarea
                value={formData.question}
                onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                rows={3}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                정답
              </label>
              <input
                type="text"
                value={formData.answer}
                onChange={(e) => setFormData(prev => ({ ...prev, answer: e.target.value }))}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                해설
              </label>
              <textarea
                value={formData.explanation}
                onChange={(e) => setFormData(prev => ({ ...prev, explanation: e.target.value }))}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  유형
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  {quizTypes.map(type => (
                    <option key={type.id} value={type.key}>{type.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  난이도
                </label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value as '초급' | '중급' | '고급' }))}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="초급">초급</option>
                  <option value="중급">중급</option>
                  <option value="고급">고급</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                포인트
              </label>
              <input
                type="number"
                value={formData.points}
                onChange={(e) => setFormData(prev => ({ ...prev, points: parseInt(e.target.value) }))}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                min="1"
                max="100"
                required
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                활성 상태
              </label>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                수정
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// 세트 추가 모달
function AddSetModal({ questions, quizTypes, onClose, onSubmit }: {
  questions: QuizQuestion[];
  quizTypes: QuizType[];
  onClose: () => void;
  onSubmit: (payload: { title: string; category: string; questionIds: string[] }) => void;
}) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id].slice(0, 5));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.length !== 5) {
      alert('세트는 정확히 5문제를 선택해야 합니다.');
      return;
    }
    onSubmit({ title, category, questionIds: selectedIds });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">새 세트 추가</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">제목</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">유형</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                >
                  <option value="" disabled>유형 선택</option>
                  {quizTypes.map(t => (
                    <option key={t.id} value={t.key}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">문제 선택 (5개)</label>
                <span className="text-sm text-gray-500 dark:text-gray-400">{selectedIds.length} / 5</span>
              </div>
              <div className="max-h-80 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md">
                {questions.map((q) => (
                  <label key={q.id} className="flex items-start gap-3 p-3 border-b last:border-b-0 border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(q.id)}
                      onChange={() => toggleSelect(q.id)}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{q.question}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{q.type} • {q.difficulty} • {q.points}점</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">취소</button>
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">추가</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// 세트 수정 모달
function EditSetModal({ setData, questions, onClose, onSubmit }: {
  setData: QuizSet;
  questions: QuizQuestion[];
  onClose: () => void;
  onSubmit: (id: string, payload: { title?: string; category?: string; isActive?: boolean; questionIds?: string[] }) => void;
}) {
  const [title, setTitle] = useState(setData.title);
  const [category, setCategory] = useState(setData.category);
  const [isActive, setIsActive] = useState(setData.isActive);
  const [selectedIds, setSelectedIds] = useState<string[]>([...setData.items.map(i => i.questionId)]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id].slice(0, 5));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.length !== 5) {
      alert('세트는 정확히 5문제를 선택해야 합니다.');
      return;
    }
    onSubmit(setData.id, { title, category, isActive, questionIds: selectedIds });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">세트 수정</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">제목</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">유형</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  {(typeof window !== 'undefined' ? (window as any).___quizTypesForEdit : []).map((t: any) => (
                    <option key={t.id} value={t.key}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">문제 선택 (5개)</label>
              <span className="text-sm text-gray-500 dark:text-gray-400">{selectedIds.length} / 5</span>
            </div>
            <div className="max-h-80 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md">
              {questions.map((q) => (
                <label key={q.id} className="flex items-start gap-3 p-3 border-b last:border-b-0 border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(q.id)}
                    onChange={() => toggleSelect(q.id)}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{q.question}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{q.type} • {q.difficulty} • {q.points}점</div>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <input id="isActive" type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
              <label htmlFor="isActive" className="text-sm text-gray-700 dark:text-gray-300">활성 상태</label>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">취소</button>
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">저장</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// 유형 추가 모달
function AddTypeModal({ onClose, onSubmit }: {
  onClose: () => void;
  onSubmit: (payload: { key: string; name: string; description?: string; order?: number; isActive?: boolean }) => void;
}) {
  const [form, setForm] = useState({ key: '', name: '', description: '', order: 0, isActive: true });
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSubmit(form); };
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">새 유형 추가</h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">표시명</label>
              <input value={form.name} onChange={(e)=>setForm(prev=>({...prev,name:e.target.value}))} className="w-full p-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white" required />
            </div>
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Key</label>
              <input value={form.key} onChange={(e)=>setForm(prev=>({...prev,key:e.target.value}))} placeholder="예: how-many" className="w-full p-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white" required />
            </div>
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">설명</label>
              <input value={form.description} onChange={(e)=>setForm(prev=>({...prev,description:e.target.value}))} className="w-full p-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white" />
            </div>
            <div className="grid grid-cols-2 gap-3 items-center">
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">정렬</label>
                <input type="number" value={form.order} onChange={(e)=>setForm(prev=>({...prev,order:parseInt(e.target.value||'0')}))} className="w-full p-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white" />
              </div>
              <label className="flex items-center gap-2 mt-5"><input type="checkbox" checked={form.isActive} onChange={(e)=>setForm(prev=>({...prev,isActive:e.target.checked}))} /> 활성</label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={onClose} className="px-3 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md">취소</button>
              <button type="submit" className="px-3 py-2 bg-blue-600 text-white rounded-md">추가</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// 유형 수정 모달
function EditTypeModal({ type, onClose, onSubmit }: {
  type: QuizType;
  onClose: () => void;
  onSubmit: (id: string, payload: Partial<{ key: string; name: string; description?: string; order?: number; isActive?: boolean }>) => void;
}) {
  const [form, setForm] = useState({ key: type.key, name: type.name, description: type.description || '', order: type.order, isActive: type.isActive });
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSubmit(type.id, form); };
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">유형 수정</h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">표시명</label>
              <input value={form.name} onChange={(e)=>setForm(prev=>({...prev,name:e.target.value}))} className="w-full p-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white" required />
            </div>
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Key</label>
              <input value={form.key} onChange={(e)=>setForm(prev=>({...prev,key:e.target.value}))} className="w-full p-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white" required />
            </div>
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">설명</label>
              <input value={form.description} onChange={(e)=>setForm(prev=>({...prev,description:e.target.value}))} className="w-full p-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white" />
            </div>
            <div className="grid grid-cols-2 gap-3 items-center">
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">정렬</label>
                <input type="number" value={form.order} onChange={(e)=>setForm(prev=>({...prev,order:parseInt(e.target.value||'0')}))} className="w-full p-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white" />
              </div>
              <label className="flex items-center gap-2 mt-5"><input type="checkbox" checked={form.isActive} onChange={(e)=>setForm(prev=>({...prev,isActive:e.target.checked}))} /> 활성</label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={onClose} className="px-3 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md">취소</button>
              <button type="submit" className="px-3 py-2 bg-blue-600 text-white rounded-md">저장</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
