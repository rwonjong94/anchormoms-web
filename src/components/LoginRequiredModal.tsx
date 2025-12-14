'use client';

import { useRouter } from 'next/navigation';

interface LoginRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

export default function LoginRequiredModal({
  isOpen,
  onClose,
  message = "이 페이지에 접근하려면 로그인이 필요합니다."
}: LoginRequiredModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const handleSignup = () => {
    onClose();
    router.push('/auth/signup');
  };

  const handleLogin = () => {
    onClose();
    router.push('/auth/login');
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            로그인이 필요합니다
          </h3>
          <p className="text-gray-600 text-sm">
            {message}
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleSignup}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            회원가입
          </button>
          <button
            onClick={handleLogin}
            className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            로그인
          </button>
          <button
            onClick={handleClose}
            className="w-full px-4 py-2 text-gray-500 hover:text-gray-700 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
} 