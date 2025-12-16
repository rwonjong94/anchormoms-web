'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getApiUrl } from '@/utils/api';
import { z } from 'zod';
import { type Student, StudentSchema } from '@/dto';

// AuthContext용 User 스키마 (일반 사용자용)
const AuthUserSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  phone: z.string().optional(),
  profileImage: z.string().optional(),
  subscription: z.string().optional(),
  hasStudents: z.boolean().optional(),
  students: z.array(StudentSchema).optional(),
});

type AuthUser = z.infer<typeof AuthUserSchema>;

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  selectedStudent: Student | null;
  login: (data: { token: string; user: { name: string | null; email?: string | null; profileImage: string | null; hasStudents?: boolean; subscription?: string } }) => void;
  logout: (redirectToHome?: boolean) => void;
  refreshStudents: () => Promise<void>;
  refreshUser: () => Promise<void>;
  selectStudent: (student: Student) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 학생 목록 응답 검증용 스키마
const StudentsArraySchema = z.array(StudentSchema);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchStudents = async (token: string): Promise<Student[]> => {
    try {
      const response = await fetch(`${getApiUrl()}/api/users/students`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Validate response with Zod schema
        const validation = StudentsArraySchema.safeParse(data);
        if (validation.success) {
          return validation.data;
        } else {
          console.error('[AuthContext] Invalid students response:', validation.error);
          return [];
        }
      }
    } catch (error) {
      console.error('자녀 정보 조회 실패:', error);
    }
    return [];
  };

  const refreshStudents = async () => {
    const token = localStorage.getItem('accessToken');
    if (token && user) {
      const students = await fetchStudents(token);
      setUser(prev => prev ? { ...prev, students, hasStudents: students.length > 0 } : null);
      
      // 첫 번째 자녀를 기본 선택 (기존에 선택된 자녀가 없거나 삭제된 경우)
      if (students.length > 0) {
        if (!selectedStudent || !students.find(s => s.id === selectedStudent.id)) {
          setSelectedStudent(students[0]);
        }
      } else {
        setSelectedStudent(null);
      }
    }
  };

  const refreshUser = async () => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        const res = await fetch(`${getApiUrl()}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error('사용자 정보를 가져오는데 실패했습니다');
        }

        const data = await res.json();
        const students = await fetchStudents(token);

        const userData: AuthUser = {
          id: data.id,
          email: data.email,
          name: data.name,
          phone: data.phone,
          profileImage: data.profileImage,
          subscription: data.subscription,
          hasStudents: students.length > 0,
          students: students,
        };

        // Validate user data
        const validation = AuthUserSchema.safeParse(userData);
        if (validation.success) {
          setUser(validation.data);
        } else {
          console.error('[AuthContext] Invalid user data:', validation.error);
        }
      } catch (error) {
        console.error('사용자 정보 새로고침 실패:', error);
      }
    }
  };

  useEffect(() => {
    if (!mounted) return;
    
    const token = localStorage.getItem('accessToken');
    if (token) {
      // 토큰이 있으면 사용자 정보 가져오기
      fetch(`${getApiUrl()}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then(async (res) => {
          if (!res.ok) {
            throw new Error('사용자 정보를 가져오는데 실패했습니다');
          }
          return res.json();
        })
        .then(async (data) => {
          // 자녀 정보도 함께 가져오기
          const students = await fetchStudents(token);
          
          setUser({
            id: data.id,
            email: data.email,
            name: data.name,
            phone: data.phone,
            profileImage: data.profileImage,
            subscription: data.subscription,
            hasStudents: students.length > 0,
            students: students,
          });
          setIsAuthenticated(true);
          
          // 첫 번째 자녀를 기본 선택
          if (students.length > 0) {
            setSelectedStudent(students[0]);
          }
        })
        .catch((error) => {
          console.error('사용자 정보 조회 실패:', error);
          localStorage.removeItem('accessToken');
          setIsAuthenticated(false);
          setUser(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, [mounted]);

  const login = (data: { token: string; user: { name: string | null; email?: string | null; profileImage: string | null; hasStudents?: boolean; subscription?: string } }) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', data.token);
    }
    setUser({
      id: '', // 백엔드에서 받아올 예정
      email: data.user.email || '', // URL 파라미터에서 받은 이메일 사용
      name: data.user.name || '',
      profileImage: data.user.profileImage || undefined,
      subscription: data.user.subscription || 'FREE',
      hasStudents: data.user.hasStudents || false,
      students: [],
    });
    setIsAuthenticated(true);
    
    // 로그인 후 사용자 정보와 자녀 정보 새로고침
    setTimeout(() => {
      refreshUser();
      refreshStudents();
    }, 100);
  };

  const logout = (redirectToHome?: boolean) => {
    if (typeof window !== 'undefined') {
      // 로컬 스토리지 정리
      localStorage.removeItem('accessToken');
      
      // OAuth 세션 정리
      // Google OAuth 세션 정리
      if (typeof window !== 'undefined' && (window as any).gapi && (window as any).gapi.auth2) {
        const auth2 = (window as any).gapi.auth2.getAuthInstance();
        if (auth2) {
          auth2.signOut();
        }
      }
      
      // Google OAuth 쿠키 정리
      const googleCookies = document.cookie.split(';').filter(cookie => 
        cookie.trim().startsWith('G_AUTHUSER_') || 
        cookie.trim().startsWith('SID') ||
        cookie.trim().startsWith('SSID') ||
        cookie.trim().startsWith('APISID') ||
        cookie.trim().startsWith('SAPISID') ||
        cookie.trim().startsWith('__Secure-3PAPISID')
      );
      
      googleCookies.forEach(cookie => {
        const name = cookie.split('=')[0].trim();
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.google.com`;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.accounts.google.com`;
      });
      
      // Google 관련 로컬 스토리지 정리
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('google') || key.includes('oauth') || key.includes('auth'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // 세션 스토리지도 정리
      sessionStorage.clear();
      
      // 로그아웃 후 홈페이지로 이동
      if (redirectToHome) {
        window.location.href = '/';
      }
    }
    setIsAuthenticated(false);
    setUser(null);
    setSelectedStudent(null);
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    selectedStudent,
    login,
    logout,
    refreshStudents,
    refreshUser,
    selectStudent: (student: Student) => {
      setSelectedStudent(student);
    },
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth는 AuthProvider 내부에서 사용되어야 합니다');
  }
  return context;
}