'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import {
  type Student,
  type StudentsListResponse,
  type CreateStudentDto,
  type UpdateStudentDto,
  StudentsListResponseSchema,
  CreateStudentDtoSchema,
  formatZodError,
} from '@/dto';
import type { UserSearchResult } from '@/dto/user';

export default function StudentsManagementPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [users, setUsers] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; studentId: string; studentName: string }>({ isOpen: false, studentId: '', studentName: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGrade, setFilterGrade] = useState<number | ''>('');
  const [filterUser, setFilterUser] = useState<string>('');
  // const [filterUnlinkedOnly, setFilterUnlinkedOnly] = useState<boolean>(false);
  
  // 부모 검색 관련 상태
  const [showParentSearchModal, setShowParentSearchModal] = useState(false);
  const [parentSearchQuery, setParentSearchQuery] = useState('');
  const [parentSearchResults, setParentSearchResults] = useState<UserSearchResult[]>([]);
  const [selectedParent, setSelectedParent] = useState<UserSearchResult | null>(null);
  const [isSearchingParent, setIsSearchingParent] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  const router = useRouter();
  const { requireAuth } = useAdminAuth();

  // 더미 보호자 판별 함수 (googleId, kakaoId가 모두 없으면 더미 보호자)
  const isDummyParent = (user?: Student['user']) => {
    return user && !user.googleId && !user.kakaoId;
  };

  // 폼 상태
  const [formData, setFormData] = useState({
    name: '',
    grade: 1,
    school: '',
    phone: '',
    userId: '',
    userEmail: '',
    userName: '',
    userPhone: ''
  });

  useEffect(() => {
    requireAuth();
    fetchStudents();
    fetchUsers();
    // 저장된 보기 모드 복원
    try {
      const saved = localStorage.getItem('adminStudentsViewMode');
      if (saved === 'table' || saved === 'card') {
        setViewMode(saved);
      }
    } catch {}
  }, []); // 의존성 배열에서 requireAuth 제거

  const setViewModeWithPersist = (mode: 'table' | 'card') => {
    setViewMode(mode);
    try {
      localStorage.setItem('adminStudentsViewMode', mode);
    } catch {}
  };

  const fetchStudents = useCallback(async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/nimda/students', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Zod 스키마로 응답 검증
        const result = StudentsListResponseSchema.safeParse(data);
        if (result.success) {
          setStudents(result.data.students);
        } else {
          console.warn('[DTO Validation Warning]', result.error.errors);
          // 검증 실패해도 데이터는 사용 (개발 중 유연성)
          setStudents(data.students || []);
        }
      } else {
        console.error('학생 목록 조회 실패');
      }
    } catch (error) {
      console.error('학생 목록 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/nimda/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else {
        console.error('사용자 목록 조회 실패');
      }
    } catch (error) {
      console.error('사용자 목록 조회 오류:', error);
    }
  }, []);

  const handleAddStudent = async () => {
    // Zod 스키마로 폼 데이터 검증
    const validationResult = CreateStudentDtoSchema.safeParse(formData);
    if (!validationResult.success) {
      const errors: Record<string, string> = {};
      validationResult.error.errors.forEach((err) => {
        const path = err.path.join('.');
        if (path) errors[path] = err.message;
      });
      setFormErrors(errors);
      alert(formatZodError(validationResult.error));
      return;
    }
    setFormErrors({});

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/nimda/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(validationResult.data),
      });

      if (response.ok) {
        setShowAddModal(false);
        setFormData({ name: '', grade: 1, school: '', phone: '', userId: '', userEmail: '', userName: '', userPhone: '' });
        fetchStudents();
      } else {
        const error = await response.json();
        alert(error.message || '학생 추가에 실패했습니다.');
      }
    } catch (error) {
      console.error('학생 추가 오류:', error);
      alert('학생 추가 중 오류가 발생했습니다.');
    }
  };

  const handleEditStudent = async () => {
    if (!selectedStudent) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/nimda/students/${selectedStudent.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowEditModal(false);
        setSelectedStudent(null);
        setFormData({ name: '', grade: 1, school: '', phone: '', userId: '', userEmail: '', userName: '', userPhone: '' });
        fetchStudents();
      } else {
        const error = await response.json();
        alert(error.message || '학생 수정에 실패했습니다.');
      }
    } catch (error) {
      console.error('학생 수정 오류:', error);
      alert('학생 수정 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/nimda/students/${studentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchStudents();
        setDeleteModal({ isOpen: false, studentId: '', studentName: '' });
      } else {
        const error = await response.json();
        alert(error.message || '학생 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('학생 삭제 오류:', error);
      alert('학생 삭제 중 오류가 발생했습니다.');
    }
  };

  const openDeleteModal = (student: Student) => {
    setDeleteModal({ isOpen: true, studentId: student.id, studentName: student.name });
  };

  const openEditModal = (student: Student) => {
    setSelectedStudent(student);
    setFormData({
      name: student.name,
      grade: student.grade,
      school: student.school || '',
      phone: student.phone || '',
      userId: student.userId || '',
      userEmail: student.user?.email || '',
      userName: student.user?.name || '',
      userPhone: ''
    });
    setShowEditModal(true);
  };

  // 부모 연결 해제
  const handleUnlinkParent = async (studentId: string) => {
    try {
      const confirmed = window.confirm('이 학생을 부모 계정과 연결 해제하시겠습니까?');
      if (!confirmed) return;
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/nimda/students/${studentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ unlinkParent: true }),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        alert(error.error || '부모 연결 해제에 실패했습니다.');
        return;
      }
      await fetchStudents();
      if (selectedStudent && selectedStudent.id === studentId) {
        setSelectedStudent({ ...selectedStudent, userId: undefined, user: undefined as any });
      }
    } catch (e) {
      console.error('부모 연결 해제 오류:', e);
      alert('부모 연결 해제 중 오류가 발생했습니다.');
    }
  };

  const openAddModal = () => {
    setFormData({ name: '', grade: 1, school: '', phone: '', userId: '', userEmail: '', userName: '', userPhone: '' });
    setShowAddModal(true);
  };

  // 부모 검색 기능
  const searchParents = async (query: string) => {
    if (!query.trim()) {
      setParentSearchResults([]);
      return;
    }

    setIsSearchingParent(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/nimda/users/search?query=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const results = await response.json();
        setParentSearchResults(results);
      } else {
        setParentSearchResults([]);
      }
    } catch (error) {
      console.error('부모 검색 실패:', error);
      setParentSearchResults([]);
    } finally {
      setIsSearchingParent(false);
    }
  };

  // 부모 검색 팝업 열기
  const openParentSearchModal = () => {
    setShowParentSearchModal(true);
    setParentSearchQuery('');
    setParentSearchResults([]);
    setSelectedParent(null);
  };

  // 부모 검색 팝업 닫기
  const closeParentSearchModal = () => {
    setShowParentSearchModal(false);
    setParentSearchQuery('');
    setParentSearchResults([]);
    setSelectedParent(null);
  };

  // 검색된 부모 선택
  const selectParent = (parent: UserSearchResult) => {
    setSelectedParent(parent);
  };

  // 선택된 부모를 폼에 적용
  const applySelectedParent = () => {
    if (selectedParent) {
      setFormData(prev => ({
        ...prev,
        userEmail: selectedParent.email || '',
        userName: selectedParent.name || '',
        userPhone: selectedParent.phone || ''
      }));
      closeParentSearchModal();
    }
  };

  // 유효성 검사 함수들
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string) => {
    if (!phone.trim()) return true; // 빈 값은 허용 (선택사항)
    const phoneRegex = /^010-?\d{4}-?\d{4}$/;
    return phoneRegex.test(phone);
  };

  // 필터링된 학생 목록
  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.user?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrade = filterGrade === '' || student.grade === filterGrade;
    const matchesUser = filterUser === '' || student.userId === filterUser;
    return matchesSearch && matchesGrade && matchesUser;
  });

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">로딩 중...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="sr-only">학생 관리</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={openAddModal}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors inline-flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>학생 추가</span>
            </button>
          </div>
        </div>

        {/* 간편 추가 */}
        <div className="bg-card rounded-lg border border-default p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div>
              <label className="block text-sm font-medium text-body mb-1">학생명 *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="예: 홍길동"
                className="w-full px-3 py-2 border border-default rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-body mb-1">학년 *</label>
              <select
                value={formData.grade}
                onChange={(e) => setFormData({ ...formData, grade: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-default rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {[1,2,3,4,5,6].map(g => <option key={g} value={g}>{g}학년</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-body mb-1">학교</label>
              <input
                type="text"
                value={formData.school}
                onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                placeholder="예: 서울숲"
                className="w-full px-3 py-2 border border-default rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={async () => {
                  if (!formData.name || !formData.grade) {
                    alert('학생명과 학년은 필수입니다.');
                    return;
                  }
                  await handleAddStudent();
                }}
                className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={!formData.name}
              >
                빠른 추가
              </button>
            </div>
          </div>
          <div className="text-xs text-muted mt-2">
            자세한 보호자 연결은 “학생 추가” 버튼을 눌러 모달에서 진행하세요.
          </div>
        </div>

        {/* 필터 및 검색 */}
        <div className="bg-card rounded-lg border border-default p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-body mb-1">검색</label>
              <input
                type="text"
                placeholder="학생명, 부모명, 이메일로 검색"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-default rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-body mb-1">학년</label>
              <select
                value={filterGrade}
                onChange={(e) => setFilterGrade(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2 border border-default rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">전체 학년</option>
                {[1, 2, 3, 4, 5, 6].map(grade => (
                  <option key={grade} value={grade}>{grade}학년</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-body mb-1">부모 계정</label>
              <select
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value)}
                className="w-full px-3 py-2 border border-default rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">전체 부모</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>{user.name} ({user.email})</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterGrade('');
                  setFilterUser('');
                }}
                className="w-full bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
              >
                필터 초기화
              </button>
            </div>
          </div>
        </div>

        {/* 보기 토글 - 리스트 상단으로 이동 */}
        <div className="flex justify-between items-center mb-4">
          <div className="inline-flex items-center rounded-md border border-default overflow-hidden">
            <button
              onClick={() => setViewModeWithPersist('table')}
              className={`px-3 py-1.5 text-sm ${viewMode === 'table' ? 'bg-indigo-600 text-white' : 'bg-card text-body hover:bg-hover'}`}
              title="표 보기"
            >
              표
            </button>
            <button
              onClick={() => setViewModeWithPersist('card')}
              className={`px-3 py-1.5 text-sm ${viewMode === 'card' ? 'bg-indigo-600 text-white' : 'bg-card text-body hover:bg-hover'}`}
              title="카드 보기"
            >
              카드
            </button>
          </div>
        </div>
        {/* 학생 목록 */}
        {viewMode === 'table' ? (
          <div className="bg-card rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-default">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                      학생명
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                      학년
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                      학교
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                      부모명
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                      부모 이메일
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                      등록일
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                      작업
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-default">
                  {filteredStudents.map((student) => (
                    <tr 
                      key={student.id} 
                      className={`hover:bg-gray-50 dark:hover:bg-gray-800 ${
                        isDummyParent(student.user) 
                          ? 'bg-yellow-50 dark:bg-yellow-900/20' 
                          : ''
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-title">
                        <a
                          href={`/nimda/dashboard/students/${student.id}`}
                          className="text-indigo-600 hover:text-indigo-800 hover:underline"
                          title="상세 보기"
                        >
                          {student.name}
                        </a>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-body">
                        {student.grade}학년
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-body">
                        {student.school || '미등록'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-body">
                        {student.user?.name || (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            부모 미연결
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-body">
                        {student.user?.email || '미등록'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-body">
                        {new Date(student.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => router.push(`/nimda/dashboard/students/${student.id}`)}
                          className="inline-flex items-center px-3 py-1.5 border border-input rounded-md text-sm text-body hover:bg-hover mr-3"
                          title="상세 보기"
                        >
                          상세
                        </button>
                        <button
                          onClick={() => openEditModal(student)}
                          className="inline-flex items-center px-3 py-1.5 border border-input rounded-md text-sm text-body hover:bg-hover mr-3"
                          title="수정"
                        >
                          수정
                        </button>
                        {student.userId && (
                          <button
                            onClick={() => handleUnlinkParent(student.id)}
                            className="inline-flex items-center px-3 py-1.5 border border-orange-300 rounded-md text-sm text-orange-700 hover:bg-orange-50 mr-3"
                            title="부모 연결 해제"
                          >
                            연결 해제
                          </button>
                        )}
                        <button
                          onClick={() => openDeleteModal(student)}
                          className="inline-flex items-center px-3 py-1.5 border border-red-300 rounded-md text-sm text-red-700 hover:bg-red-50"
                          title="삭제"
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStudents.map((student) => {
              const dummy = isDummyParent(student.user);
              return (
                <div
                  key={student.id}
                  className={`bg-card rounded-lg border ${dummy ? 'border-yellow-300 dark:border-yellow-700' : 'border-default'} shadow-sm overflow-hidden`}
                >
                  <div className={`px-5 py-4 ${dummy ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-lg font-semibold text-title">{student.name}</div>
                        <div className="flex items-center gap-2 text-sm text-muted mt-0.5">
                          <span>{student.grade}학년 · {new Date(student.createdAt).toLocaleDateString()}</span>
                          {!student.userId && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              부모 미연결
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => router.push(`/nimda/dashboard/students/${student.id}`)}
                        className="text-indigo-600 hover:text-indigo-800 text-sm"
                        title="상세 보기"
                      >
                        상세
                      </button>
                    </div>
                    <div className="mt-4">
                      <div className="text-xs text-muted mb-1">학교</div>
                      <div className="text-sm text-body">{student.school || '미등록'}</div>
                    </div>
                    <div className="mt-4">
                      <div className="text-xs text-muted mb-1">부모</div>
                      <div className="text-sm text-body">{student.user?.name || '미등록'}</div>
                      <div className="text-sm text-body">{student.user?.email || '미등록'}</div>
                    </div>
                  </div>
                  <div className="px-5 py-3 border-t border-default flex items-center justify-end gap-2">
                    <button
                      onClick={() => { openEditModal(student); }}
                      className="px-3 py-1.5 border border-input rounded-md text-sm text-body hover:bg-hover"
                      title="수정"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => { openEditModal(student); openParentSearchModal(); }}
                      className="px-3 py-1.5 border border-input rounded-md text-sm text-body hover:bg-hover"
                      title="부모 연결"
                    >
                      부모 연결
                    </button>
                    {student.userId && (
                      <button
                        onClick={() => handleUnlinkParent(student.id)}
                        className="px-3 py-1.5 border border-orange-300 rounded-md text-sm text-orange-700 hover:bg-orange-50"
                        title="부모 연결 해제"
                      >
                        연결 해제
                      </button>
                    )}
                    <button
                      onClick={() => openDeleteModal(student)}
                      className="px-3 py-1.5 border border-red-300 rounded-md text-sm text-red-700 hover:bg-red-50"
                      title="삭제"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 학생 추가 모달 */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-card rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-lg font-semibold text-title mb-6">학생 추가</h2>
              
              {/* 학생 정보 섹션 */}
              <div className="mb-6">
                <h3 className="text-md font-medium text-title mb-4 border-b border-default pb-2">학생 정보</h3>
                <div className="space-y-4">
                  {/* 윗줄: 학생명 / 핸드폰 번호 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-body mb-1">학생명 *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-default rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="학생 이름을 입력하세요"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-body mb-1">핸드폰 번호</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                          formData.phone && !validatePhone(formData.phone) ? 'border-red-500' : 'border-default'
                        }`}
                        placeholder="010-1234-5678 (선택사항)"
                      />
                      {formData.phone && !validatePhone(formData.phone) && (
                        <p className="text-red-500 text-sm mt-1">올바른 휴대폰 번호 형식을 입력해주세요.</p>
                      )}
                    </div>
                  </div>
                  
                  {/* 아랫줄: 학교명 / 학년 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-body mb-1">학교</label>
                      <input
                        type="text"
                        value={formData.school}
                        onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                        className="w-full px-3 py-2 border border-default rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="학교명 (선택사항)"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-body mb-1">학년 *</label>
                      <select
                        value={formData.grade}
                        onChange={(e) => setFormData({ ...formData, grade: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-default rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {[1, 2, 3, 4, 5, 6].map(grade => (
                          <option key={grade} value={grade}>{grade}학년</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* 부모 정보 섹션 */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4 border-b border-default pb-2">
                  <h3 className="text-md font-medium text-title">부모 정보</h3>
                  <button
                    type="button"
                    onClick={openParentSearchModal}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md transition-colors"
                  >
                    검색
                  </button>
                </div>
                <div className="space-y-4">
                  {/* 윗줄: 이름 */}
                  <div>
                    <label className="block text-sm font-medium text-body mb-1">이름</label>
                    <input
                      type="text"
                      value={formData.userName}
                      onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                      className="w-full px-3 py-2 border border-default rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="부모 이름을 입력하세요"
                    />
                  </div>
                  
                  {/* 아랫줄: 이메일 / 핸드폰 번호 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-body mb-1">이메일</label>
                      <input
                        type="email"
                        value={formData.userEmail}
                        onChange={(e) => setFormData({ ...formData, userEmail: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                          formData.userEmail && !validateEmail(formData.userEmail) ? 'border-red-500' : 'border-default'
                        }`}
                        placeholder="부모 이메일을 입력하세요"
                      />
                      {formData.userEmail && !validateEmail(formData.userEmail) && (
                        <p className="text-red-500 text-sm mt-1">올바른 이메일 형식을 입력해주세요.</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-body mb-1">핸드폰 번호</label>
                      <input
                        type="tel"
                        value={formData.userPhone}
                        onChange={(e) => setFormData({ ...formData, userPhone: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                          formData.userPhone && !validatePhone(formData.userPhone) ? 'border-red-500' : 'border-default'
                        }`}
                        placeholder="010-1234-5678 (선택사항)"
                      />
                      {formData.userPhone && !validatePhone(formData.userPhone) && (
                        <p className="text-red-500 text-sm mt-1">올바른 휴대폰 번호 형식을 입력해주세요.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-default text-body rounded-md hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  onClick={handleAddStudent}
                  disabled={!formData.name}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  추가
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 학생 수정 모달 */}
        {showEditModal && selectedStudent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-card rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-lg font-semibold text-title mb-6">학생 수정</h2>
              
              {/* 학생 정보 섹션 */}
              <div className="mb-6">
                <h3 className="text-md font-medium text-title mb-4 border-b border-default pb-2">학생 정보</h3>
                <div className="space-y-4">
                  {/* 윗줄: 학생명 / 핸드폰 번호 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-body mb-1">학생명 *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-default rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="학생 이름을 입력하세요"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-body mb-1">핸드폰 번호</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                          formData.phone && !validatePhone(formData.phone) ? 'border-red-500' : 'border-default'
                        }`}
                        placeholder="010-1234-5678 (선택사항)"
                      />
                      {formData.phone && !validatePhone(formData.phone) && (
                        <p className="text-red-500 text-sm mt-1">올바른 휴대폰 번호 형식을 입력해주세요.</p>
                      )}
                    </div>
                  </div>
                  
                  {/* 아랫줄: 학교명 / 학년 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-body mb-1">학교</label>
                      <div className="grid grid-cols-[2fr_1fr] gap-2">
                        <input
                          type="text"
                          value={formData.school}
                          onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                          className="w-full px-3 py-2 border border-default rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="학교명 (선택사항)"
                      />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-body mb-1">학년 *</label>
                      <select
                        value={formData.grade}
                        onChange={(e) => setFormData({ ...formData, grade: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-default rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {[1, 2, 3, 4, 5, 6].map(grade => (
                          <option key={grade} value={grade}>{grade}학년</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* 부모 정보 섹션 */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4 border-b border-default pb-2">
                  <h3 className="text-md font-medium text-title">부모 정보</h3>
                  <button
                    type="button"
                    onClick={openParentSearchModal}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md transition-colors"
                  >
                    검색
                  </button>
                </div>
                <div className="space-y-4">
                  {/* 윗줄: 이름 */}
                  <div>
                    <label className="block text-sm font-medium text-body mb-1">이름</label>
                    <input
                      type="text"
                      value={formData.userName}
                      onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                      className="w-full px-3 py-2 border border-default rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="부모 이름을 입력하세요"
                    />
                  </div>
                  
                  {/* 아랫줄: 이메일 / 핸드폰 번호 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-body mb-1">이메일</label>
                      <input
                        type="email"
                        value={formData.userEmail}
                        onChange={(e) => setFormData({ ...formData, userEmail: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                          formData.userEmail && !validateEmail(formData.userEmail) ? 'border-red-500' : 'border-default'
                        }`}
                        placeholder="부모 이메일을 입력하세요"
                      />
                      {formData.userEmail && !validateEmail(formData.userEmail) && (
                        <p className="text-red-500 text-sm mt-1">올바른 이메일 형식을 입력해주세요.</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-body mb-1">핸드폰 번호</label>
                      <input
                        type="tel"
                        value={formData.userPhone}
                        onChange={(e) => setFormData({ ...formData, userPhone: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                          formData.userPhone && !validatePhone(formData.userPhone) ? 'border-red-500' : 'border-default'
                        }`}
                        placeholder="010-1234-5678 (선택사항)"
                      />
                      {formData.userPhone && !validatePhone(formData.userPhone) && (
                        <p className="text-red-500 text-sm mt-1">올바른 휴대폰 번호 형식을 입력해주세요.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center space-x-3 mt-6">
                <button
                  onClick={() => selectedStudent && handleUnlinkParent(selectedStudent.id)}
                  disabled={!selectedStudent?.userId}
                  className="px-4 py-2 border border-orange-300 text-orange-700 rounded-md hover:bg-orange-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="부모 연결 해제"
                >
                  부모 연결 해제
                </button>
                <div className="flex gap-3 ml-auto">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 border border-default text-body rounded-md hover:bg-gray-50"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleEditStudent}
                    disabled={!formData.name}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    수정
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 부모 검색 모달 */}
        {showParentSearchModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
            <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md max-h-[80vh] flex flex-col mx-4">
              {/* 모달 헤더 */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-title">부모 검색</h3>
              </div>

              {/* 검색 입력 */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <input
                  type="text"
                  value={parentSearchQuery}
                  onChange={(e) => {
                    setParentSearchQuery(e.target.value);
                    searchParents(e.target.value);
                  }}
                  placeholder="부모 이름, 이메일, 또는 핸드폰 번호를 입력하세요"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>

              {/* 검색 결과 */}
              <div className="flex-1 overflow-y-auto p-6">
                {isSearchingParent ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-sm text-muted mt-2">검색 중...</p>
                  </div>
                ) : parentSearchResults.length > 0 ? (
                  <div className="space-y-2">
                    {parentSearchResults.map((parent) => (
                      <div
                        key={parent.id}
                        onClick={() => selectParent(parent)}
                        className={`p-3 rounded-md border cursor-pointer transition-colors ${
                          selectedParent?.id === parent.id
                            ? 'bg-blue-50 border-blue-300 dark:bg-blue-900/30 dark:border-blue-700'
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600'
                        }`}
                      >
                        <div className="font-medium text-title">{parent.name}</div>
                        <div className="text-sm text-muted">{parent.email}</div>
                        {parent.phone && (
                          <div className="text-sm text-muted">{parent.phone}</div>
                        )}
                        {parent.students && parent.students.length > 0 && (
                          <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                            자녀: {parent.students.map(s => `${s.name} (${s.grade}학년)`).join(', ')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : parentSearchQuery.trim() ? (
                  <div className="text-center py-8">
                    <p className="text-muted">검색 결과가 없습니다.</p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted">부모 이름, 이메일, 또는 핸드폰 번호를 입력해주세요.</p>
                  </div>
                )}
              </div>

              {/* 모달 푸터 */}
              <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                <button
                  onClick={closeParentSearchModal}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  취소
                </button>
                <button
                  onClick={applySelectedParent}
                  disabled={!selectedParent}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  등록
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 삭제 확인 모달 */}
        {deleteModal.isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-card rounded-lg p-6 w-full max-w-md mx-4 border border-default">
              <h3 className="text-lg font-semibold text-title mb-3">학생 삭제</h3>
              <p className="text-body mb-4">
                다음 학생을 삭제하시겠습니까?
                <br />
                <span className="font-medium text-title">{deleteModal.studentName}</span>
              </p>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-md p-3 mb-6">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  주의: 학생과 연관된 일부 데이터(응시 기록 등)가 함께 삭제될 수 있습니다. 이 작업은 되돌릴 수 없습니다.
                </p>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeleteModal({ isOpen: false, studentId: '', studentName: '' })}
                  className="px-4 py-2 text-sm text-body border border-input rounded-md hover:bg-hover"
                >
                  취소
                </button>
                <button
                  onClick={() => handleDeleteStudent(deleteModal.studentId)}
                  className="px-4 py-2 text-sm text-white bg-red-600 dark:bg-red-700 rounded-md hover:bg-red-700 dark:hover:bg-red-600"
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
