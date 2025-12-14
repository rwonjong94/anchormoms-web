'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getApiUrl } from '@/utils/api';
import SaveStatusToast from '@/components/SaveStatusToast';


interface Student {
  id?: string;
  name: string;
  grade: number;
  school?: string;
  phone?: string;
  isNew?: boolean;
}

interface UserProfile {
  name: string;
  email: string;
  phone: string;
}

interface HomeworkVideo {
  id: string;
  title: string;
  videoUrl: string;
  studentId: string;
  studentName: string;
  createdAt: string;
  updatedAt: string;
}


// SettingsSection 제거: 단일 섹션 페이지로 전환

export default function SettingsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, refreshStudents, refreshUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile>({ name: '', email: '', phone: '' });
  const [students, setStudents] = useState<Student[]>([]);
  const [originalStudents, setOriginalStudents] = useState<Student[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // 숙제 영상 관련 상태 제거
  // (단일 섹션이지만) 레거시 참조 무해화를 위한 상태 훅 정의
  type SettingsSection = '기본 정보' | '학생 숙제 영상' | '북마크 모음' | '기타 설정';
  const [activeSection, setActiveSection] = useState<SettingsSection>('기본 정보');
  const [videos, setVideos] = useState<any[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [videosLoading, setVideosLoading] = useState(false);
  const [videosError, setVideosError] = useState<string | null>(null);

  // Toast states
  const [saveToast, setSaveToast] = useState({
    isVisible: false,
    message: '',
    type: 'success' as 'success' | 'error' | 'info' | 'warning'
  });


  // 자녀 삭제 기능 제거됨 (확인 모달 상태 삭제)



  // Settings sections removed

  // Toast 헬퍼 함수
  const showSaveToast = (message: string, type: 'success' | 'error' | 'info' | 'warning') => {
    setSaveToast({ isVisible: true, message, type });
  };

  const closeSaveToast = () => {
    setSaveToast(prev => ({ ...prev, isVisible: false }));
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (user) {
      // 사용자 프로필 정보 설정
      setProfile({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      });

      // 자녀 정보 설정
      if (user.students) {
        const studentData = user.students.map((student: any) => ({
          id: student.id,
          name: student.name,
          grade: student.grade,
          school: (student as any).school || '',
          phone: (student as any).phone || '',
          isNew: false,
        }));
        setStudents(studentData);
        setOriginalStudents(JSON.parse(JSON.stringify(studentData)));
      }
    }
  }, [user]);

  // Removed: legacy section switching logic

  // Removed: legacy filter logic

  // Filter videos when filters change
  useEffect(() => {
    filterVideos();
  }, [videos, selectedStudentId]);

  // Extract YouTube video ID from URL
  const getYouTubeVideoId = (url: string): string | null => {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  // Homework videos functions
  const fetchVideos = async () => {
    try {
      setVideosLoading(true);
      setVideosError(null);
      
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${getApiUrl()}/api/homework-videos`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setVideos(data);
      } else {
        setVideosError('숙제 영상을 불러오는 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('Failed to fetch homework videos:', error);
      setVideosError('숙제 영상을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setVideosLoading(false);
    }
  };

  const filterVideos = () => {
    let filtered = [...videos];
    
    // Student filter
    if (selectedStudentId) {
      filtered = filtered.filter(video => video.studentId === selectedStudentId);
    }
    
    // Date filter removed - show all videos
    
    setFilteredVideos(filtered);
  };



  // 자녀 추가
  const addStudent = () => {
    setStudents([...students, { name: '', grade: 1, school: '', phone: '', isNew: true }]);
  };

  // 자녀 삭제 관련 핸들러 제거됨

  // 자녀 정보 업데이트
  const updateStudent = (index: number, field: keyof Student, value: string | number) => {
    const updatedStudents = [...students];
    updatedStudents[index] = { ...updatedStudents[index], [field]: value };
    setStudents(updatedStudents);
    
    // 에러 메시지 제거
    const errorKey = `student_${index}_${field}`;
    if (errors[errorKey]) {
      const newErrors = { ...errors };
      delete newErrors[errorKey];
      setErrors(newErrors);
    }
  };

  // 프로필 정보 업데이트
  const updateProfile = (field: keyof UserProfile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
    
    // 에러 메시지 제거
    if (errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
  };

  // 유효성 검사
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // 프로필 유효성 검사
    if (!profile.name.trim()) {
      newErrors.name = '이름을 입력해주세요.';
    }
    
    // 이메일 유효성 검사 강화
    if (!profile.email.trim()) {
      newErrors.email = '이메일을 입력해주세요.';
    } else {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(profile.email)) {
        newErrors.email = '올바르게 작성해 주세요';
      }
    }
    
    // 전화번호 유효성 검사 추가
    if (profile.phone && profile.phone.trim()) {
      const phoneRegex = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/;
      if (!phoneRegex.test(profile.phone.replace(/\s/g, ''))) {
        newErrors.phone = '올바르게 작성해 주세요';
      }
    }

    // 자녀 유효성 검사
    students.forEach((student, index) => {
      if (!student.name.trim()) {
        newErrors[`student_${index}_name`] = '자녀 이름을 입력해주세요.';
      }
      
      if (student.grade < 1 || student.grade > 6) {
        newErrors[`student_${index}_grade`] = '학년은 1~6학년이어야 합니다.';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 저장하기
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('인증 토큰이 없습니다.');
      }

      // 1. 프로필 정보 업데이트
      const response = await fetch(`${getApiUrl()}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.message || '프로필 정보 업데이트에 실패했습니다.';
        
        // 이메일 중복 에러 처리
        if (response.status === 403 && errorMessage.includes('이메일')) {
          showSaveToast('이미 사용 중인 이메일입니다.', 'error');
          return;
        }
        
        throw new Error(errorMessage);
      }

      // 2. 자녀 정보 업데이트
      for (const student of students) {
        if (student.isNew || !student.id) {
          // 새 자녀 추가
          const response = await fetch(`${getApiUrl()}/api/users/students`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              name: student.name,
              grade: student.grade,
              school: student.school,
              phone: student.phone,
            }),
          });

          if (!response.ok) {
            throw new Error('자녀 정보 추가에 실패했습니다.');
          }
        } else {
          // 기존 자녀 정보 수정
          const originalStudent = originalStudents.find(s => s.id === student.id);
          if (originalStudent && (
            originalStudent.name !== student.name || 
            originalStudent.grade !== student.grade ||
            originalStudent.school !== student.school ||
            originalStudent.phone !== student.phone
          )) {
            const response = await fetch(`${getApiUrl()}/api/users/students/${student.id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify({
                name: student.name,
                grade: student.grade,
                school: student.school,
                phone: student.phone,
              }),
            });

            if (!response.ok) {
              throw new Error('자녀 정보 수정에 실패했습니다.');
            }
          }
        }
      }

      // 3. 삭제된 자녀 처리 로직 제거 (안전성 강화)

      // 4. AuthContext의 자녀 정보 새로고침
      await refreshStudents();

      // 5. AuthContext의 사용자 정보 새로고침
      await refreshUser();

      showSaveToast('설정이 저장되었습니다.', 'success');
      
      // 페이지 리로드하여 최신 데이터 반영
      setTimeout(() => {
        window.location.reload();
      }, 1000); // 1초 후 리로드
    } catch (error) {
      console.error('설정 저장 실패:', error);
      // alert 제거 - 에러는 조용히 처리
    } finally {
      setIsSaving(false);
    }
  };



  // 사이드바 아이템 렌더링
  const renderSidebarItem = (section: SettingsSection) => {
    const isActive = activeSection === section;
    
    return (
      <button
        key={section}
        onClick={() => setActiveSection(section)}
        className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
          isActive 
            ? 'bg-primary text-white' 
            : 'text-body hover:bg-muted dark:hover:bg-hover'
        }`}
      >
        {section}
      </button>
    );
  };

  // 메인 콘텐츠 렌더링
  const renderMainContent = () => {
    switch (activeSection) {
      case '기본 정보':
        return (
          <div className="space-y-8">
            {/* 부모 정보 섹션 */}
            <div className="bg-card rounded-lg shadow-sm border-default p-6">
              <div className="flex items-center mb-6">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-title">사용자 정보</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-body mb-1">
                    이름 *
                  </label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => updateProfile('name', e.target.value)}
                    placeholder="이름을 입력하세요"
                    className={`w-full px-3 py-2 border rounded-md bg-card text-title focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.name ? 'border-red-500' : 'border-input'
                    }`}
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-body mb-1">
                    이메일 *
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => updateProfile('email', e.target.value)}
                    placeholder="이메일을 입력하세요"
                    className={`w-full px-3 py-2 border rounded-md bg-card text-title focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.email ? 'border-red-500' : 'border-input'
                    }`}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-body mb-1">
                    전화번호
                  </label>
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => updateProfile('phone', e.target.value)}
                    placeholder="010-1234-5678"
                    className={`w-full px-3 py-2 border rounded-md bg-card text-title focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.phone ? 'border-red-500' : 'border-input'
                    }`}
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                  )}
                </div>
              </div>
            </div>

            {/* 자녀 정보 섹션 */}
            <div className="bg-card rounded-lg shadow-sm border-default p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold text-title">자녀 정보</h2>
                </div>
              </div>

              <div className="space-y-6">
                {students.map((student, index) => (
                  <div key={index} className="border-default rounded-lg p-4 relative">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium text-title">
                        자녀 {index + 1}
                      </h3>
                      {/* 자녀 삭제 버튼 제거됨 */}
                    </div>

                    {/* 윗줄: 이름 / 핸드폰 번호 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-body mb-1">
                          이름 *
                        </label>
                        <input
                          type="text"
                          value={student.name}
                          onChange={(e) => updateStudent(index, 'name', e.target.value)}
                          placeholder="자녀 이름을 입력하세요"
                          className={`w-full px-3 py-2 border rounded-md bg-card text-title focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            errors[`student_${index}_name`] ? 'border-red-500' : 'border-input'
                          }`}
                        />
                        {errors[`student_${index}_name`] && (
                          <p className="text-red-500 text-sm mt-1">{errors[`student_${index}_name`]}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-body mb-1">
                          핸드폰 번호
                        </label>
                        <input
                          type="tel"
                          value={student.phone || ''}
                          onChange={(e) => updateStudent(index, 'phone', e.target.value)}
                          placeholder="010-1234-5678 (선택사항)"
                          className="w-full px-3 py-2 border border-input rounded-md bg-card text-title focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* 아랫줄: 학교 / 학년 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-body mb-1">
                          학교
                        </label>
                        <input
                          type="text"
                          value={student.school || ''}
                          onChange={(e) => updateStudent(index, 'school', e.target.value)}
                          placeholder="학교명을 입력하세요 (선택사항)"
                          className="w-full px-3 py-2 border border-input rounded-md bg-card text-title focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-body mb-1">
                          학년 *
                        </label>
                        <select
                          value={student.grade}
                          onChange={(e) => updateStudent(index, 'grade', parseInt(e.target.value))}
                          className={`w-full px-3 py-2 border rounded-md bg-card text-title focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            errors[`student_${index}_grade`] ? 'border-red-500' : 'border-input'
                          }`}
                        >
                          {[1, 2, 3, 4, 5, 6].map(grade => (
                            <option key={grade} value={grade}>
                              {grade}학년
                            </option>
                          ))}
                        </select>
                        {errors[`student_${index}_grade`] && (
                          <p className="text-red-500 text-sm mt-1">{errors[`student_${index}_grade`]}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* 자녀 추가 버튼 */}
                <div className="flex justify-center">
                  <button
                    onClick={addStudent}
                    className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-blue-500 hover:bg-blue-50 transition-colors group"
                  >
                    <div className="w-12 h-12 bg-gray-200 group-hover:bg-blue-200 rounded-lg flex items-center justify-center mb-2">
                      <svg className="w-6 h-6 text-gray-600 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <span className="text-sm text-gray-600 group-hover:text-blue-600">
                      자녀 추가
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* 저장 버튼 */}
            <div className="flex justify-center">
              <button
                onClick={handleSubmit}
                disabled={isSaving}
                className="px-8 py-3 bg-primary text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
              >
                {isSaving ? '저장 중...' : '저장하기'}
              </button>
            </div>
          </div>
        );

      case '학생 숙제 영상':
        return (
          <div className="space-y-6">
            {/* Student Filter */}
            <div className="bg-card rounded-lg shadow-sm border-default p-6">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-body">학생 선택</span>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-48 px-3 py-2 border border-input bg-card text-title rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">전체 학생</option>
                  {user?.students?.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name} ({student.grade}학년)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Videos Gallery */}
            <div className="bg-card rounded-lg shadow-sm border-default p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-title">숙제 영상 목록</h2>
              </div>
              
              {videosLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : videosError ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                  <div className="flex">
                    <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="ml-3">
                      <p className="text-red-800">{videosError}</p>
                    </div>
                  </div>
                </div>
              ) : filteredVideos.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <h3 className="mt-4 text-lg font-medium text-title">등록된 영상이 없습니다</h3>
                  <p className="mt-2 text-body">첫 번째 숙제 영상을 업로드해보세요!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredVideos.map((video) => {
                    const videoId = getYouTubeVideoId(video.videoUrl);
                    return (
                      <div key={video.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg border-default overflow-hidden">
                        {/* Video Thumbnail */}
                        <div className="aspect-video bg-gray-200">
                          {videoId ? (
                            <iframe
                              src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&showinfo=0`}
                              title={video.title}
                              className="w-full h-full"
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            ></iframe>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>

                        {/* Video Info */}
                        <div className="p-4">
                          <h3 className="text-lg font-semibold text-title mb-2 line-clamp-2">
                            {video.title}
                          </h3>
                          <p className="text-sm text-body mb-2">
                            학생: {video.studentName}
                          </p>
                          <p className="text-sm text-muted mb-4">
                            {new Date(video.createdAt).toLocaleDateString('ko-KR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>

                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );

      case '북마크 모음':
        return (
          <div className="bg-card rounded-lg shadow-sm border-default p-6">
            <h2 className="text-xl font-semibold text-title mb-4">북마크 모음</h2>
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              <p className="mt-4 text-body">북마크된 칼럼이 없습니다.</p>
            </div>
          </div>
        );


      case '기타 설정':
        return (
          <div className="bg-card rounded-lg shadow-sm border-default p-6">
            <h2 className="text-xl font-semibold text-title mb-6">기타 설정</h2>
            
            <div className="space-y-6">
              {/* 알림 설정 */}
              <div>
                <h3 className="text-lg font-medium text-title mb-3">알림 설정</h3>
                <p className="text-sm text-body mb-4">알림을 받을 방법을 선택하세요 (다중 선택 가능)</p>
                
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded border-input text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50" />
                    <span className="ml-2 text-sm text-title">앱 푸시 알림</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded border-input text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50" />
                    <span className="ml-2 text-sm text-title">이메일 알림</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded border-input text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50" />
                    <span className="ml-2 text-sm text-title">카카오톡 알림</span>
                  </label>
                </div>
              </div>

              {/* 광고성 정보 수신 동의 */}
              <div className="flex items-center justify-between py-4 border-t border-input">
                <div>
                  <h4 className="text-sm font-medium text-title">광고성 정보 수신 동의</h4>
                  <p className="text-sm text-body">이벤트, 할인 정보 등을 받아보세요</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 dark:bg-gray-600 dark:peer-checked:bg-blue-500"></div>
                </label>
              </div>

            </div>
          </div>
        );


      default:
        return null;
    }
  };

  // Fetch homework videos when switching to that section
  useEffect(() => {
    if (activeSection === '학생 숙제 영상' && isAuthenticated) {
      fetchVideos();
    }
  }, [activeSection, isAuthenticated]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">로딩 중...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div className="space-y-8">
          {/* 부모 정보 섹션 */}
          <div className="bg-card rounded-lg shadow-sm border-default p-6">
            <div className="flex items-center mb-6">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-title">사용자 정보</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-body mb-1">
                  이름 *
                </label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => updateProfile('name', e.target.value)}
                  placeholder="이름을 입력하세요"
                  className={`w-full px-3 py-2 border rounded-md bg-card text-title focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.name ? 'border-red-500' : 'border-input'
                  }`}
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-body mb-1">
                  이메일 *
                </label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => updateProfile('email', e.target.value)}
                  placeholder="이메일을 입력하세요"
                  className={`w-full px-3 py-2 border rounded-md bg-card text-title focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.email ? 'border-red-500' : 'border-input'
                  }`}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-body mb-1">
                  전화번호
                </label>
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => updateProfile('phone', e.target.value)}
                  placeholder="010-1234-5678"
                  className={`w-full px-3 py-2 border rounded-md bg-card text-title focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.phone ? 'border-red-500' : 'border-input'
                  }`}
                />
                {errors.phone && (
                  <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                )}
              </div>
            </div>
          </div>

          {/* 자녀 정보 섹션 */}
          <div className="bg-card rounded-lg shadow-sm border-default p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-title">자녀 정보</h2>
              </div>
            </div>

            <div className="space-y-6">
              {students.map((student, index) => (
                <div key={index} className="border-default rounded-lg p-4 relative">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-title">
                      자녀 {index + 1}
                    </h3>
                    {/* 자녀 삭제 버튼 제거됨 */}
                  </div>

                  {/* 윗줄: 이름 / 핸드폰 번호 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-body mb-1">
                        이름 *
                      </label>
                      <input
                        type="text"
                        value={student.name}
                        onChange={(e) => updateStudent(index, 'name', e.target.value)}
                        placeholder="자녀 이름을 입력하세요"
                        className={`w-full px-3 py-2 border rounded-md bg-card text-title focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors[`student_${index}_name`] ? 'border-red-500' : 'border-input'
                        }`}
                      />
                      {errors[`student_${index}_name`] && (
                        <p className="text-red-500 text-sm mt-1">{errors[`student_${index}_name`]}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-body mb-1">
                        핸드폰 번호
                      </label>
                      <input
                        type="tel"
                        value={student.phone || ''}
                        onChange={(e) => updateStudent(index, 'phone', e.target.value)}
                        placeholder="010-1234-5678 (선택사항)"
                        className="w-full px-3 py-2 border border-input rounded-md bg-card text-title focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* 아랫줄: 학교 / 학년 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-body mb-1">
                        학교
                      </label>
                      <input
                        type="text"
                        value={student.school || ''}
                        onChange={(e) => updateStudent(index, 'school', e.target.value)}
                        placeholder="학교명을 입력하세요 (선택사항)"
                        className="w-full px-3 py-2 border border-input rounded-md bg-card text-title focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-body mb-1">
                        학년 *
                      </label>
                      <select
                        value={student.grade}
                        onChange={(e) => updateStudent(index, 'grade', parseInt(e.target.value))}
                        className={`w-full px-3 py-2 border rounded-md bg-card text-title focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors[`student_${index}_grade`] ? 'border-red-500' : 'border-input'
                        }`}
                      >
                        {[1, 2, 3, 4, 5, 6].map(grade => (
                          <option key={grade} value={grade}>
                            {grade}학년
                          </option>
                        ))}
                      </select>
                      {errors[`student_${index}_grade`] && (
                        <p className="text-red-500 text-sm mt-1">{errors[`student_${index}_grade`]}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* 자녀 추가 버튼 */}
              <div className="flex justify-center">
                <button
                  onClick={addStudent}
                  className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-blue-500 hover:bg-blue-50 transition-colors group"
                >
                  <div className="w-12 h-12 bg-gray-200 group-hover:bg-blue-200 rounded-lg flex items-center justify-center mb-2">
                    <svg className="w-6 h-6 text-gray-600 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-600 group-hover:text-blue-600">
                    자녀 추가
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* 저장 버튼 */}
          <div className="flex justify-center">
            <button
              onClick={handleSubmit}
              disabled={isSaving}
              className="px-8 py-3 bg-primary text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
            >
              {isSaving ? '저장 중...' : '저장하기'}
            </button>
          </div>
        </div>
      </div>

      {/* 하단 약관 링크 */}
      <div className="mt-12 pt-8 border-t border-input">
        <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-6">
          <a href="/terms" className="text-xs text-muted hover:text-body transition-colors">
            서비스 이용약관
          </a>
          <a href="/privacy" className="text-xs text-muted hover:text-body transition-colors font-semibold">
            개인정보 처리방침
          </a>
        </div>
      </div>

      {/* Save Status Toast */}
      <SaveStatusToast
        isVisible={saveToast.isVisible}
        message={saveToast.message}
        type={saveToast.type}
        onClose={closeSaveToast}
      />

      {/* 자녀 삭제 확인 모달 제거됨 */}
    </div>
  );
} 