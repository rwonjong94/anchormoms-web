'use client';

export default function QuickStartGuide() {
  const steps = [
    {
      step: 1,
      title: "회원가입",
      description: (
        <div className="space-y-2">
          <div className="font-medium">• 카카오 로그인: 카카오 계정으로 간편하게 로그인</div>
          <div className="font-medium">• 자녀 정보 등록: 이름, 학교 유형, 학년 정보 입력</div>
        </div>
      ),
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      ),
      color: "from-blue-500 to-blue-600"
    },
    {
      step: 2,
      title: "시험 응시",
      description: (
        <div className="space-y-2">
          <div className="font-medium">• 시험 대기: 공지사항 확인 및 환경 설정</div>
          <div className="font-medium">• 시험 시작: 실시간 타이머로 실전 같은 경험</div>
        </div>
      ),
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: "from-green-500 to-green-600"
    },
    {
      step: 3,
      title: "해설 학습",
      description: (
        <div className="space-y-2">
          <div className="font-medium">• 해설지: PDF 형태의 상세한 풀이 과정</div>
          <div className="font-medium">• 동영상: 문제별 영상 해설로 완벽 이해</div>
        </div>
      ),
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "from-purple-500 to-purple-600"
    }
  ];

  return (
    <div className="bg-gray-50 py-12 px-6 rounded-2xl">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">빠른 시험 시작 가이드</h2>
        <p className="text-gray-600">3단계로 완성하는 모의고사 체험</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {steps.map((stepItem, index) => (
          <div key={stepItem.step} className="relative">
            {/* 연결선 (마지막 단계 제외) */}
            {index < steps.length - 1 && (
              <div className="hidden md:block absolute top-12 right-0 w-6 h-0.5 bg-gray-300 z-0 transform translate-x-3"></div>
            )}
            
            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow relative z-10">
              <div className="text-center">
                {/* 단계 번호와 아이콘 */}
                <div className={`w-16 h-16 bg-gradient-to-r ${stepItem.color} text-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                  {stepItem.icon}
                </div>
                
                {/* 단계 정보 */}
                <div className="mb-3">
                  <span className="inline-block bg-gray-100 text-gray-700 text-sm font-medium px-3 py-1 rounded-full mb-2">
                    STEP {stepItem.step}
                  </span>
                  <h3 className="text-xl font-bold text-gray-900">
                    {stepItem.title}
                  </h3>
                </div>
                
                {/* 설명 */}
                <div className="text-gray-600 text-sm leading-relaxed">
                  {stepItem.description}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 시작하기 버튼 */}
      <div className="text-center mt-8">
        <button className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-3 rounded-full font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl">
          지금 시작하기
        </button>
      </div>
    </div>
  );
} 