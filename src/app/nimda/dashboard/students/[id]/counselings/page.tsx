'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import StudentInfoSection from '@/components/admin/StudentInfoSection';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface Student {
  id: string;
  name: string;
  grade: number;
  school?: string;
  phone?: string;
  userId?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    googleId?: string;
    kakaoId?: string;
  };
}

interface CounselingLog {
  id: string;
  title: string;
  content: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export default function StudentCounselingsPage() {
  const params = useParams();
  const studentId = String(params?.id || '');
  const [student, setStudent] = useState<Student | null>(null);
  const [studentLoading, setStudentLoading] = useState(true);
  const [counselingLogs, setCounselingLogs] = useState<CounselingLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<CounselingLog | null>(null);
  const [selectedLog, setSelectedLog] = useState<CounselingLog | null>(null);
  
  // 폼 상태
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    date: new Date().toISOString().slice(0, 10)
  });
  
  // 미리보기 모드
  const [previewMode, setPreviewMode] = useState(false);

  // 학생 정보 가져오기
  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        if (!token) {
          window.location.href = '/nimda';
        return;
      }

        const response = await fetch(`/api/nimda/students/${studentId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
          });

          if (response.ok) {
            const data = await response.json();
          setStudent(data);
    } else {
          console.error('Failed to fetch student');
      }
    } catch (error) {
        console.error('Error fetching student:', error);
      } finally {
        setStudentLoading(false);
      }
    };

    if (studentId) {
      fetchStudent();
    }
  }, [studentId]);

  // 상담일지 목록 가져오기 (실제 API 연동)
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLogsLoading(true);
        const token = localStorage.getItem('adminToken');
        if (!token) {
          setCounselingLogs([]);
          setLogsLoading(false);
          return;
        }
        const resp = await fetch(`/api/nimda/students/${studentId}/counselings`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!resp.ok) {
          console.error('Failed to fetch counseling logs');
          setCounselingLogs([]);
        } else {
          const data = await resp.json();
          setCounselingLogs(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        console.error('Error fetching counseling logs:', e);
        setCounselingLogs([]);
      } finally {
        setLogsLoading(false);
      }
    };
    if (studentId) fetchLogs();
  }, [studentId]);

  // 모달 열기/닫기
  const openModal = (log?: CounselingLog) => {
    if (log) {
      setEditingLog(log);
      setFormData({
        title: log.title,
        content: log.content,
        date: log.date
      });
      } else {
      setEditingLog(null);
      setFormData({
        title: '',
        content: '',
        date: new Date().toISOString().slice(0, 10)
      });
    }
    setPreviewMode(false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingLog(null);
    setPreviewMode(false);
  };

  // 상담일지 저장 (실제 API 연동)
  const handleSave = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) return;

      const body = {
        title: formData.title,
        content: formData.content,
        date: formData.date,
      };

      let resp;
      if (editingLog) {
        // 수정 모드: PUT 요청
        resp = await fetch(`/api/nimda/students/${studentId}/counselings`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            counselingId: editingLog.id,
            ...body,
          }),
        });
      } else {
        // 새로 생성: POST 요청
        resp = await fetch(`/api/nimda/students/${studentId}/counselings`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            studentId: studentId,
            ...body,
          }),
        });
      }

      if (!resp.ok) {
        console.error('Failed to save counseling log');
        return;
      }

      // 목록 갱신
      const listResp = await fetch(`/api/nimda/students/${studentId}/counselings`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const list = await listResp.json().catch(() => []);
      setCounselingLogs(Array.isArray(list) ? list : []);
      closeModal();
    } catch (error) {
      console.error('Error saving counseling log:', error);
    }
  };

  // 상담일지 삭제 (실제 API 연동) – 백엔드에 DELETE가 없다면, 추후 구현 필요
  const handleDelete = async (logId: string) => {
    if (!confirm('정말로 이 상담일지를 삭제하시겠습니까?')) return;
    try {
      // 임시: 로컬 상태 제거 (백엔드 삭제 엔드포인트 도입 시 여기에 연동)
      setCounselingLogs(prev => prev.filter(log => log.id !== logId));
    } catch (error) {
      console.error('Error deleting counseling log:', error);
    }
  };

  if (studentLoading) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-title mb-2">학생을 찾을 수 없습니다</h2>
          <p className="text-muted">요청하신 학생 정보가 존재하지 않습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <StudentInfoSection student={student} currentPage="counselings" />

        <div className="bg-card rounded-lg shadow-sm border border-default p-6">
          {/* 헤더 */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-semibold text-title">상담일지</h2>
              <p className="text-sm text-muted mt-1">학생과의 상담 내용을 기록하고 관리합니다</p>
            </div>
              <button
              onClick={() => openModal()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
              상담일지 추가
              </button>
            </div>

          {/* 상담일지 목록 */}
          {logsLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
          </div>
          ) : counselingLogs.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-title mb-2">상담일지가 없습니다</h3>
              <p className="text-muted mb-4">첫 번째 상담일지를 작성해보세요.</p>
              <button
                onClick={() => openModal()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
              >
                상담일지 추가
              </button>
                </div>
              ) : (
            <div className="grid gap-4">
              {counselingLogs.map((log) => (
                <div
                  key={log.id}
                  className="border border-default rounded-lg p-4 hover:shadow-sm transition-shadow cursor-pointer"
                  onClick={() => setSelectedLog(selectedLog?.id === log.id ? null : log)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-title mb-1">{log.title}</h3>
                      <p className="text-sm text-muted">
                        {new Date(log.date).toLocaleDateString('ko-KR')}
                      </p>
                          </div>
                    <div className="flex items-center gap-2">
                            <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openModal(log);
                        }}
                        className="text-indigo-600 hover:text-indigo-800 text-sm"
                      >
                        수정
                            </button>
                        <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(log.id);
                        }}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        삭제
                        </button>
                      </div>
                              </div>

                  {/* 상세 내용 (펼침/접힘) */}
                  {selectedLog?.id === log.id && (
                    <div className="mt-4 pt-4 border-t border-default">
                                  <div className="prose prose-sm max-w-none">
                                    <ReactMarkdown
                          remarkPlugins={[remarkGfm, remarkMath]}
                                      rehypePlugins={[rehypeKatex]}
                                    >
                          {log.content}
                                    </ReactMarkdown>
                                  </div>
                                </div>
                              )}
                            </div>
              ))}
                            </div>
                          )}
                        </div>
                          </div>

      {/* 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                {editingLog ? '상담일지 수정' : '상담일지 추가'}
              </h3>
              <div className="flex items-center gap-2">
                          <button
                  onClick={() => setPreviewMode(!previewMode)}
                  className={`px-3 py-1 text-sm rounded-md ${
                    previewMode 
                      ? 'bg-indigo-100 text-indigo-700' 
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {previewMode ? '편집' : '미리보기'}
                          </button>
                            <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                            >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                            </button>
                                    </div>
                                  </div>
                                  
            {/* 모달 내용 */}
            <div className="flex-1 p-6 overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                    <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    제목
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="상담일지 제목을 입력하세요"
                        />
                      </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    날짜
                </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
              </div>
            </div>

              <div className="h-96">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  내용 {!previewMode && <span className="text-gray-500">(마크다운 지원)</span>}
                </label>
                
                {previewMode ? (
                  <div className="h-full border border-gray-300 rounded-md p-4 overflow-y-auto bg-gray-50">
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm, remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                      >
                        {formData.content || '내용을 입력해주세요.'}
                      </ReactMarkdown>
              </div>
            </div>
                ) : (
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    className="w-full h-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-mono text-sm"
                    placeholder="마크다운으로 상담 내용을 작성하세요...&#10;&#10;예시:&#10;# 상담 제목&#10;## 주요 내용&#10;- 항목 1&#10;- 항목 2&#10;&#10;**중요**: 강조할 내용"
                  />
                )}
              </div>
            </div>
            
            {/* 모달 푸터 */}
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
                <button
                onClick={closeModal}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                onClick={handleSave}
                disabled={!formData.title.trim() || !formData.content.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                {editingLog ? '수정' : '저장'}
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}