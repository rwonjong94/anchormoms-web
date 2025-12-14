'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/hooks/useCart';
import ExamLogoutWarningModal from './ExamLogoutWarningModal';

export default function NavigationBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const [showExamWarning, setShowExamWarning] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 컴포넌트가 마운트되었는지 확인
  useEffect(() => {
    setMounted(true);
  }, []);

  // 모바일 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // 햄버거 버튼이나 메뉴 내부를 클릭한 경우가 아니라면 메뉴 닫기
      if (isMobileMenuOpen && !target.closest('.mobile-menu') && !target.closest('.hamburger-button')) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isMobileMenuOpen]);

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/' ? 'text-primary' : 'text-body';
    }
    return pathname.startsWith(path) ? 'text-primary' : 'text-body';
  };

  // 네비게이션 링크 스타일: 활성 시 더 크고 굵게 + 밑줄 강조
  const getDesktopNavLinkClass = (path: string) => {
    const active = path === '/' ? pathname === '/' : pathname.startsWith(path);
    const base = 'inline-flex items-center h-10 px-3 transition-colors border-b-2';
    if (active) {
      return `${base} text-title font-bold text-base border-blue-600`;
    }
    return `${base} text-muted hover:text-primary text-sm font-medium border-transparent`;
  };

  const getMobileNavLinkClass = (path: string) => {
    const active = path === '/' ? pathname === '/' : pathname.startsWith(path);
    const base = 'block px-3 py-2 font-medium rounded-md transition-colors hover:bg-blue-50 border-b-2';
    if (active) {
      return `${base} text-title font-bold text-base border-blue-600`;
    }
    return `${base} text-body hover:text-primary text-base border-transparent`;
  };

  const handleLogout = () => {
    // testing 페이지에서 로그아웃 시 시험 제출 팝업 활용
    if (pathname === '/testing') {
      // testing 페이지의 제출 모달을 열기 위해 커스텀 이벤트 발생
      const submitEvent = new CustomEvent('openSubmitModal', { 
        detail: { source: 'logout' } 
      });
      window.dispatchEvent(submitEvent);
      return;
    }

    // exam/take 페이지에서 로그아웃 시 경고 모달 표시
    if (pathname.includes('/exam/') && pathname.includes('/take')) {
      setShowExamWarning(true);
      return;
    }

    // 모든 경우에 메인페이지로 이동
    logout(true);
  };

  const handleExamLogoutConfirm = () => {
    setShowExamWarning(false);
    logout(true); // 메인페이지로 이동
  };

  // hydration mismatch 방지를 위해 마운트 후에만 렌더링
  if (!mounted) {
    return (
      <nav className="bg-card shadow-sm border-b border-default">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* 왼쪽 네비게이션 메뉴 */}
            <div className="flex items-center space-x-8">
              {/* 로고 - 항상 홈으로 이동 */}
              <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
                <Image
                  src="/mogo_icon_128px.png"
                  alt="Mogo Logo"
                  width={32}
                  height={32}
                  priority
                  className="w-8 h-8"
                />
                <span className="text-xl font-bold text-title">모고</span>
              </Link>
              {/* 메인 메뉴 (답지만 노출) */}
              <div className="hidden md:flex space-x-8">
                <Link 
                  href="/answers" 
                  className="text-muted hover:text-primary px-3 py-2 text-sm font-medium transition-colors"
                >
                  답지
                </Link>
              </div>
            </div>

            {/* 오른쪽 사용자 메뉴 - 로딩 상태 */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="px-4 py-2 text-sm text-body">
                  로그인
                </div>
                <div className="px-4 py-2 text-sm bg-primary text-white rounded-md">
                  회원가입
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-card shadow-sm border-b border-default">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* 왼쪽 네비게이션 메뉴 */}
          <div className="flex items-center space-x-8">
            {/* 로고 - 항상 홈으로 이동 */}
            <Link href="/" className="flex items-center space-x-1 md:space-x-2 hover:opacity-80 transition-opacity">
              <Image
                src="/mogo_icon_128px.png"
                alt="Mogo Logo"
                width={32}
                height={32}
                priority
                className="w-6 h-6 md:w-8 md:h-8"
              />
              <span className="text-lg md:text-xl font-bold text-title">모고</span>
            </Link>
            {/* 메인 메뉴 - 자녀 등록 페이지에서는 숨김 (답지만 노출) */}
            {pathname !== '/auth/register' && (
              <div className="hidden md:flex space-x-8">
                <Link 
                  href="/answers" 
                  className={getDesktopNavLinkClass('/answers')}
                >
                  답지
                </Link>
              </div>
            )}
          </div>

          {/* 모바일 햄버거 메뉴 버튼 */}
          {pathname !== '/auth/register' && (
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="hamburger-button p-2 text-body hover:text-primary transition-colors"
                aria-label="메뉴 열기"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          )}

          {/* 오른쪽 사용자 메뉴 */}
          <div className="flex items-center space-x-2 md:space-x-4">
            {user && pathname !== '/auth/register' ? (
              <>
                {/* 사용자 프로필 이미지 (이름 숨김) */}
                <div className="flex items-center space-x-1 md:space-x-2">
                  {user.profileImage && (
                    <img
                      src={user.profileImage}
                      alt={user.name}
                      className="w-6 h-6 md:w-8 md:h-8 rounded-full"
                    />
                  )}
                  {/* 사용자 이름 숨김 처리 */}
                </div>
                
                {/* 장바구니 버튼 */}
                <Link
                  href="/shopping/cart"
                  className="relative flex items-center justify-center w-8 h-8 md:w-10 md:h-10 text-body hover:text-primary hover:bg-blue-50 transition-colors rounded-lg"
                >
                  <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 12H6L5 9z"/>
                  </svg>
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center min-w-[20px]">
                      {cartCount > 99 ? '99+' : cartCount}
                    </span>
                  )}
                </Link>

                {/* 마이페이지 버튼 */}
                <Link
                  href="/mypage"
                  className={`${isActive('/mypage')} hover:text-primary hover:bg-blue-50 px-2 md:px-4 py-2 text-xs md:text-sm font-medium transition-colors rounded-lg hidden sm:block`}
                >
                  마이페이지
                </Link>
                
                {/* 로그아웃 버튼 */}
                <button
                  onClick={handleLogout}
                  className="px-2 md:px-4 py-1.5 md:py-2 text-xs md:text-sm text-title hover:bg-red-600 hover:text-white transition-colors rounded-lg hidden sm:block"
                >
                  로그아웃
                </button>
                
                {/* 테마 토글 제거됨 */}
              </>
            ) : pathname !== '/auth/register' ? (
              <div className="flex items-center space-x-4">
                <Link
                  href="/auth/login"
                  className="px-4 py-2 text-sm text-body hover:text-title transition-colors"
                >
                  로그인
                </Link>
                <Link
                  href="/auth/signup"
                  className="px-4 py-2 text-sm bg-primary text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  회원가입
                </Link>
                {/* 테마 토글 제거됨 */}
              </div>
            ) : (
              // 자녀 등록 페이지에서는 별도 토글 없음
              <></>
            )}
          </div>
        </div>
      </div>

      {/* 모바일 드롭다운 메뉴 */}
      {isMobileMenuOpen && pathname !== '/auth/register' && (
        <div className="mobile-menu md:hidden bg-card border-t border-default">
          <div className="px-4 pt-2 pb-3 space-y-1">
            {/* 메인 메뉴 (답지만 노출) */}
            <Link
              href="/answers"
              className={getMobileNavLinkClass('/answers')}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              답지
            </Link>
            
            {/* 로그인한 사용자 메뉴 */}
            {user && (
              <>
                <Link
                  href="/mypage"
                  className={`${isActive('/mypage')} block px-3 py-2 text-base font-medium hover:text-primary hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  마이페이지
                </Link>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full text-left block px-3 py-2 text-base font-medium text-title hover:bg-red-600 hover:text-white transition-colors rounded-md"
                >
                  로그아웃
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* 시험 중 로그아웃 경고 모달 */}
      <ExamLogoutWarningModal
        isOpen={showExamWarning}
        onClose={() => setShowExamWarning(false)}
        onConfirm={handleExamLogoutConfirm}
      />
    </nav>
  );
} 