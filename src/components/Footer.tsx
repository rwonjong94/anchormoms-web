'use client';

export default function Footer() {
  return (
    <footer className="bg-[rgb(18,23,36)] text-white mt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* 회사 정보 */}
          <div className="md:col-span-2">
            <h3 className="text-lg font-bold text-white mb-4">모고</h3>
            <p className="text-sm text-gray-300 mb-4"></p>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="text-sm text-gray-300">rwonjong94@gmail.com</span>
              </div>
            </div>
          </div>

          {/* 서비스 링크 */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">서비스</h4>
            <ul className="space-y-2">
              <li><a href="/exam" className="text-sm text-gray-300 hover:text-white transition-colors">모의고사</a></li>
              <li><a href="/column" className="text-sm text-gray-300 hover:text-white transition-colors">학습 칼럼</a></li>
              <li><a href="/settings" className="text-sm text-gray-300 hover:text-white transition-colors">설정</a></li>
            </ul>
          </div>

          {/* 고객지원 */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">고객지원</h4>
            <ul className="space-y-2">
              <li><a href="/notices" className="text-sm text-gray-300 hover:text-white transition-colors">공지사항</a></li>
              <li><a href="/faq" className="text-sm text-gray-300 hover:text-white transition-colors">자주 묻는 질문</a></li>
              <li>
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className="text-sm text-gray-300">1588-0000</span>
                </div>
              </li>
              <li><span className="text-xs text-gray-400">평일 09:00 ~ 18:00</span></li>
            </ul>
          </div>
        </div>

        {/* 하단 라인 */}
        <div className="border-t border-gray-600 pt-8 mt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-6">
              <a href="/terms" className="text-xs text-gray-400 hover:text-white transition-colors">이용약관</a>
              <a href="/privacy" className="text-xs text-gray-400 hover:text-white transition-colors font-semibold">개인정보처리방침</a>
              <a href="/business" className="text-xs text-gray-400 hover:text-white transition-colors">사업자정보</a>
            </div>
            <div className="text-xs text-gray-500">
              © 2024 Mogo. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
} 