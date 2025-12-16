'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  type AdminUser,
  type AdminLoginResponse,
  AdminLoginResponseSchema,
  AdminLoginDtoSchema,
  formatZodError,
} from '@/dto';

export function useAdminAuth() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  const VALIDATION_CACHE_KEY = 'adminTokenValidated';
  const VALIDATION_CACHE_DURATION = 5 * 60 * 1000; // 5분

  const isValidationCacheValid = () => {
    const cached = sessionStorage.getItem(VALIDATION_CACHE_KEY);
    if (!cached) return false;
    
    const { timestamp } = JSON.parse(cached);
    return Date.now() - timestamp < VALIDATION_CACHE_DURATION;
  };

  const validateToken = useCallback(async (token: string, forceValidation = false) => {
    try {
      // 캐시된 검증이 유효하고 강제 검증이 아닌 경우
      if (!forceValidation && isValidationCacheValid()) {
        const cached = JSON.parse(sessionStorage.getItem(VALIDATION_CACHE_KEY)!);
        setUser(cached.user);
        setIsAuthenticated(true);
        return true;
      }

      const response = await fetch('/api/nimda/auth', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setIsAuthenticated(true);
        
        // 검증 결과 캐싱
        sessionStorage.setItem(VALIDATION_CACHE_KEY, JSON.stringify({
          user: data.user,
          timestamp: Date.now()
        }));
        
        return true;
      } else {
        localStorage.removeItem('adminToken');
        sessionStorage.removeItem(VALIDATION_CACHE_KEY);
        setUser(null);
        setIsAuthenticated(false);
        return false;
      }
    } catch (error) {
      localStorage.removeItem('adminToken');
      sessionStorage.removeItem(VALIDATION_CACHE_KEY);
      setUser(null);
      setIsAuthenticated(false);
      return false;
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('adminToken');
      if (token) {
        await validateToken(token);
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      // Validate input with DTO schema
      const inputValidation = AdminLoginDtoSchema.safeParse({ username, password });
      if (!inputValidation.success) {
        return { success: false, error: formatZodError(inputValidation.error) };
      }

      const response = await fetch('/api/nimda/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();

        // Validate response with DTO schema
        const validation = AdminLoginResponseSchema.safeParse(data);
        if (!validation.success) {
          console.error('[useAdminAuth] Invalid login response:', validation.error);
          return { success: false, error: '서버 응답 형식이 올바르지 않습니다.' };
        }

        const validData = validation.data;
        localStorage.setItem('adminToken', validData.accessToken);
        setUser(validData.user);
        setIsAuthenticated(true);

        // 로그인 성공 시 검증 캐시 저장
        sessionStorage.setItem(VALIDATION_CACHE_KEY, JSON.stringify({
          user: validData.user,
          timestamp: Date.now()
        }));

        return { success: true };
      } else {
        const data = await response.json();
        return { success: false, error: data.error || '로그인에 실패했습니다.' };
      }
    } catch (error) {
      return { success: false, error: '네트워크 오류가 발생했습니다.' };
    }
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    sessionStorage.removeItem(VALIDATION_CACHE_KEY);
    setUser(null);
    setIsAuthenticated(false);
    router.push('/');
  };

  const requireAuth = () => {
    if (!loading && !isAuthenticated) {
      router.push('/nimda');
    }
  };

  return {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    requireAuth,
  };
}