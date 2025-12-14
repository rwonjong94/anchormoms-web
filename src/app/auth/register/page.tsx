'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getApiUrl } from '@/utils/api';
import SaveStatusToast from '@/components/SaveStatusToast';

interface Student {
  name: string;
  grade: number;
  school: string;
  schoolType: string;
  phone: string;
}

interface ParentInfo {
  name: string;
  email: string;
  phone: string;
}

function RegisterStudentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, user, isLoading, refreshStudents, refreshUser, login } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [parentInfo, setParentInfo] = useState<ParentInfo>({
    name: '',
    email: '',
    phone: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  
  // Toast 상태 관리
  const [toast, setToast] = useState({
    isVisible: false,
    message: '',
    type: 'success' as 'success' | 'error' | 'info' | 'warning'
  });

  // Toast 헬퍼 함수
  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning') => {
    setToast({ isVisible: true, message, type });
  };

  const closeToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }));
  };


  // URL 파라미터에서 토큰과 사용자 정보 처리
  useEffect(() => {
    const token = searchParams.get('token');
    const name = searchParams.get('name');
    const email = searchParams.get('email');
    const hasStudents = searchParams.get('hasStudents') === 'true';
    const subscription = searchParams.get('subscription') || 'FREE';
    
    if (token && !isAuthenticated) {
      // 토큰이 있지만 아직 인증되지 않은 경우 로그인 처리
      const userData = {
        token,
        user: {
          name,
          email,
          profileImage: null,
          hasStudents,
          subscription,
        }
      };
      
      login(userData);
      
      // Google 회원가입의 경우 이메일 자동 입력
      if (email && !parentInfo.email) {
        setParentInfo(prev => ({
          ...prev,
          email: email
        }));
      }
    }
  }, [searchParams, isAuthenticated, login]);

  // 인증 상태 체크 (토큰이 없는 경우에만 리다이렉트)
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const token = searchParams.get('token');
      if (!token) {
        router.push('/auth/login');
      }
    }
  }, [isAuthenticated, isLoading, router, searchParams]);

  // 페이지 로드 시 첫 번째 학생 자동 추가
  useEffect(() => {
    if (students.length === 0) {
      setStudents([{ name: '', grade: 1, school: '', schoolType: '초등학교', phone: '' }]);
    }
  }, []);

  // 사용자 정보로 부모 정보 자동 입력
  useEffect(() => {
    if (user) {
      setParentInfo(prev => ({
        name: prev.name || user.name || '',
        email: prev.email || user.email || '',
        phone: prev.phone || user.phone || ''
      }));
    }
  }, [user]);

  // 초기 에러 메시지 표시
  useEffect(() => {
    const newErrors: { [key: string]: string } = {};
    
    // 학부모 정보 초기 검증
    if (!parentInfo.name.trim()) {
      newErrors.parent_name = '학부모 이름을 입력해주세요.';
    }
    if (!parentInfo.email.trim()) {
      newErrors.parent_email = '이메일을 입력해주세요.';
    }
    if (!parentInfo.phone.trim()) {
      newErrors.parent_phone = '휴대폰 번호를 입력해주세요.';
    }
    
    // 학생 정보 초기 검증
    students.forEach((student, index) => {
      if (!student.name.trim()) {
        newErrors[`${index}_name`] = '학생 이름을 입력해주세요.';
      }
    });
    
    setErrors(newErrors);
  }, [parentInfo.name, parentInfo.email, parentInfo.phone, students]);

  // 자녀 추가
  const addStudent = () => {
    setStudents([...students, { name: '', grade: 1, school: '', schoolType: '초등학교', phone: '' }]);
  };

  // 자녀 제거
  const removeStudent = (index: number) => {
    setStudents(students.filter((_, i) => i !== index));
  };

  // 학부모 정보 실시간 유효성 검사
  const updateParentInfo = (field: keyof ParentInfo, value: string) => {
    setParentInfo(prev => ({ ...prev, [field]: value }));
    
    // 실시간 에러 검사
    const newErrors = { ...errors };
    
    if (field === 'name') {
      if (!value.trim()) {
        newErrors.parent_name = '학부모 이름을 입력해주세요.';
      } else {
        delete newErrors.parent_name;
      }
    } else if (field === 'email') {
      if (!value.trim()) {
        newErrors.parent_email = '이메일을 입력해주세요.';
      } else if (!validateEmail(value)) {
        newErrors.parent_email = '올바른 이메일 형식을 입력해주세요.';
      } else {
        delete newErrors.parent_email;
      }
    } else if (field === 'phone') {
      if (!value.trim()) {
        newErrors.parent_phone = '휴대폰 번호를 입력해주세요.';
      } else if (!validatePhone(value)) {
        newErrors.parent_phone = '올바른 휴대폰 번호 형식을 입력해주세요. (예: 010-1234-5678)';
      } else {
        delete newErrors.parent_phone;
      }
    }
    
    setErrors(newErrors);
  };

  // 학생 정보 업데이트
  const updateStudent = (index: number, field: keyof Student, value: string | number) => {
    const updatedStudents = [...students];
    updatedStudents[index] = { ...updatedStudents[index], [field]: value };
    setStudents(updatedStudents);
    
    // 실시간 에러 검사
    const newErrors = { ...errors };
    const errorKey = `${index}_${field}`;
    
    if (field === 'name') {
      if (!String(value).trim()) {
        newErrors[errorKey] = '학생 이름을 입력해주세요.';
      } else {
        delete newErrors[errorKey];
      }
    } else if (field === 'grade') {
      const gradeNum = Number(value);
      if (gradeNum < 1 || gradeNum > 6) {
        newErrors[errorKey] = '학년은 1~6학년이어야 합니다.';
      } else {
        delete newErrors[errorKey];
      }
    } else if (field === 'phone') {
      const phoneStr = String(value);
      if (phoneStr.trim() && !validatePhone(phoneStr)) {
        newErrors[errorKey] = '올바른 휴대폰 번호 형식을 입력해주세요. (예: 010-1234-5678)';
      } else {
        delete newErrors[errorKey];
      }
    }
    
    setErrors(newErrors);
  };

  // 이메일 유효성 검사
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // 휴대폰 번호 유효성 검사 (010-0000-0000 또는 01000000000 형식)
  const validatePhone = (phone: string) => {
    if (!phone.trim()) return true; // 빈 값은 허용 (선택사항)
    const phoneRegex = /^010-?\d{4}-?\d{4}$/;
    return phoneRegex.test(phone);
  };

  // 실시간 유효성 검사 (버튼 활성화용)
  const isFormValid = () => {
    // 학부모 정보 검사
    if (!parentInfo.name.trim() || !parentInfo.email.trim() || !parentInfo.phone.trim()) {
      return false;
    }
    
    if (!validateEmail(parentInfo.email) || !validatePhone(parentInfo.phone)) {
      return false;
    }

    // 학생 정보 검사
    if (students.length === 0) {
      return false;
    }

    // 모든 학생의 정보가 올바른지 검사
    return students.every(student => {
      const phoneValid = !student.phone.trim() || validatePhone(student.phone);
      return student.name.trim() && student.grade >= 1 && student.grade <= 6 && phoneValid;
    });
  };

  // 제출용 유효성 검사 (기존 로직 유지)
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // 학부모 정보 유효성 검사
    if (!parentInfo.name.trim()) {
      newErrors.parent_name = '학부모 이름을 입력해주세요.';
    }

    if (!parentInfo.email.trim()) {
      newErrors.parent_email = '이메일을 입력해주세요.';
    } else if (!validateEmail(parentInfo.email)) {
      newErrors.parent_email = '올바른 이메일 형식을 입력해주세요.';
    }

    if (!parentInfo.phone.trim()) {
      newErrors.parent_phone = '휴대폰 번호를 입력해주세요.';
    } else if (!validatePhone(parentInfo.phone)) {
      newErrors.parent_phone = '올바른 휴대폰 번호 형식을 입력해주세요. (예: 010-1234-5678)';
    }

    // 학생 정보 유효성 검사
    if (students.length === 0) {
      newErrors.general = '최소 1명의 학생을 등록해주세요.';
    }

    students.forEach((student, index) => {
      if (!student.name.trim()) {
        newErrors[`${index}_name`] = '학생 이름을 입력해주세요.';
      }
      
      if (student.grade < 1 || student.grade > 6) {
        newErrors[`${index}_grade`] = '학년은 1~6학년이어야 합니다.';
      }

      if (student.phone.trim() && !validatePhone(student.phone)) {
        newErrors[`${index}_phone`] = '올바른 휴대폰 번호 형식을 입력해주세요. (예: 010-1234-5678)';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 자녀 등록 제출
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem('accessToken');
      
      // 1. 학부모 정보 업데이트 (Backend UserSettings 형식에 맞춤)
      const userUpdateResponse = await fetch(`${getApiUrl()}/api/users/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          profile: {
            name: parentInfo.name,
            email: parentInfo.email,
            phone: parentInfo.phone,
          },
          notifications: {
            emailNotifications: true,
            newExamNotifications: true,
            videoUploadNotifications: false,
          }
        }),
      });

      if (!userUpdateResponse.ok) {
        throw new Error('학부모 정보 업데이트에 실패했습니다.');
      }

      // 2. 각 자녀를 순차적으로 등록
      for (const student of students) {
        // 학교명과 학교타입을 합쳐서 최종 학교 정보 생성
        const finalSchool = student.school.trim() 
          ? `${student.school} ${student.schoolType}` 
          : '';

        const studentData = {
          name: student.name,
          grade: student.grade,
          school: finalSchool,
          phone: student.phone || null
        };

        const response = await fetch(`${getApiUrl()}/api/users/students`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(studentData),
        });

        if (!response.ok) {
          throw new Error('학생 등록에 실패했습니다.');
        }
      }

      // 3. 성공 시 AuthContext의 사용자 정보와 자녀 정보 새로고침
      await refreshUser();
      await refreshStudents();
      
      // 성공 시 메인 페이지로 이동
      showToast('학부모 정보와 학생 등록이 완료되었습니다!', 'success');
      setTimeout(() => {
        router.push('/');
      }, 2000); // 2초 후 이동
    } catch (error) {
      console.error('등록 실패:', error);
      showToast('등록 중 오류가 발생했습니다. 다시 시도해주세요.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

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
    <div className="min-h-screen bg-page py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-title mb-2">
            회원 등록
          </h1>
          <p className="text-lg text-body mb-2">
          모고를 이용할 학생의 정보를 등록해주세요.
          </p>
        </div>

        {/* 에러 메시지 */}
        {errors.general && (
          <div className="mb-6 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 rounded">
            {errors.general}
          </div>
        )}

        <div className="space-y-6">
          {/* 학부모 정보 카드 */}
          <div className="bg-card rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-title mb-4">학부모 정보 등록</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-body mb-1">
                  이름 <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={parentInfo.name}
                  onChange={(e) => updateParentInfo('name', e.target.value)}
                  placeholder="학부모 이름을 입력하세요"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.parent_name ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.parent_name && (
                  <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.parent_name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-body mb-1">
                  이메일 <span className="text-red-600">*</span>
                </label>
                <input
                  type="email"
                  value={parentInfo.email}
                  onChange={(e) => updateParentInfo('email', e.target.value)}
                  placeholder="example@email.com"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.parent_email ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.parent_email && (
                  <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.parent_email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-body mb-1">
                  휴대폰 번호 <span className="text-red-600">*</span>
                </label>
                <input
                  type="tel"
                  value={parentInfo.phone}
                  onChange={(e) => updateParentInfo('phone', e.target.value)}
                  placeholder="010-1234-5678"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.parent_phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.parent_phone && (
                  <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.parent_phone}</p>
                )}
              </div>
            </div>
          </div>

          {/* 학생 정보 카드 */}
          <div className="bg-card rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-title">학생 정보 등록</h2>
            </div>
            
            {/* 학생 리스트 */}
            <div className="space-y-4 mb-6">
              {students.map((student, index) => (
                <div key={index} className="border rounded-lg p-4 relative">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-title">
                      학생 {index + 1}
                    </h3>
                    {students.length > 1 && (
                      <button
                        onClick={() => removeStudent(index)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        삭제
                      </button>
                    )}
                  </div>

                  {/* 윗줄: 이름 / 핸드폰 번호 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-body mb-1">
                        이름 <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        value={student.name}
                        onChange={(e) => updateStudent(index, 'name', e.target.value)}
                        placeholder="학생 이름을 입력하세요"
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors[`${index}_name`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors[`${index}_name`] && (
                        <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors[`${index}_name`]}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-body mb-1">
                        핸드폰 번호
                      </label>
                      <input
                        type="tel"
                        value={student.phone}
                        onChange={(e) => updateStudent(index, 'phone', e.target.value)}
                        placeholder="010-1234-5678 (선택사항)"
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors[`${index}_phone`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors[`${index}_phone`] && (
                        <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors[`${index}_phone`]}</p>
                      )}
                    </div>
                  </div>

                  {/* 아랫줄: 학교 / 학년 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="w-full">
                      <label className="block text-sm font-medium text-body mb-1">
                        학교
                      </label>
                      <div className="grid grid-cols-[2fr_1fr] gap-2">
                        <input
                          type="text"
                          value={student.school}
                          onChange={(e) => updateStudent(index, 'school', e.target.value)}
                          placeholder="학교명"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <select
                          value={student.schoolType}
                          onChange={(e) => updateStudent(index, 'schoolType', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                          <option value="초등학교">초등학교</option>
                          <option value="중학교">중학교</option>
                          <option value="고등학교">고등학교</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-body mb-1">
                        학년 <span className="text-red-600">*</span>
                      </label>
                      <select
                        value={student.grade}
                        onChange={(e) => updateStudent(index, 'grade', parseInt(e.target.value))}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors[`${index}_grade`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        {[1, 2, 3, 4, 5, 6].map(grade => (
                          <option key={grade} value={grade}>
                            {grade}학년
                          </option>
                        ))}
                      </select>
                      {errors[`${index}_grade`] && (
                        <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors[`${index}_grade`]}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 학생 추가 버튼 */}
            <div className="flex justify-center">
              <button
                onClick={addStudent}
                className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-blue-500 hover:bg-blue-50 transition-colors group"
              >
                <div className="w-12 h-12 bg-gray-200 group-hover:bg-blue-200 rounded-lg flex items-center justify-center mb-2">
                  <svg className="w-6 h-6 text-muted group-hover:text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <span className="text-sm text-muted group-hover:text-primary">
                  학생 추가
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* 필수 입력란 안내 */}
        <div className="text-center mt-6">
          <p className="text-sm text-red-600 dark:text-red-400">
            <span className="text-red-600">*</span> 표시는 필수 입력란입니다.
          </p>
        </div>

        {/* 하단 버튼들 */}
        <div className="flex justify-between mt-8">
          <button
            onClick={() => router.push('/auth/login')}
            className="px-6 py-2 border border-default text-body rounded-md hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            이전
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !isFormValid()}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '등록 중...' : '등록 완료'}
          </button>
        </div>
      </div>


      {/* Toast 메시지 */}
      <SaveStatusToast
        isVisible={toast.isVisible}
        message={toast.message}
        type={toast.type}
        onClose={closeToast}
      />
    </div>
  );
}

export default function RegisterStudentPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">로딩 중...</h1>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-title mx-auto"></div>
        </div>
      </div>
    }>
      <RegisterStudentPageContent />
    </Suspense>
  );
}
