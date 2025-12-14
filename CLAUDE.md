# CLAUDE.md - Mogo Frontend (Next.js)

> **초등학생을 위한 수학 모의고사 플랫폼 - Frontend Application**
> Next.js 15 + React 19 + Tailwind CSS 기반 웹 애플리케이션

---

## 📋 목차

1. [프로젝트 개요](#프로젝트-개요)
2. [기술 스택](#기술-스택)
3. [프로젝트 구조](#프로젝트-구조)
4. [페이지 구조](#페이지-구조)
5. [컴포넌트 아키텍처](#컴포넌트-아키텍처)
6. [데이터 페칭 (SWR)](#데이터-페칭-swr)
7. [API Routes](#api-routes)
8. [인증 시스템](#인증-시스템)
9. [관리자 페이지](#관리자-페이지)
10. [환경 변수](#환경-변수)
11. [개발 가이드](#개발-가이드)
12. [빌드 및 배포](#빌드-및-배포)

---

## 프로젝트 개요

### 역할 및 책임

이 프론트엔드 애플리케이션은 Mogo 플랫폼의 **사용자 인터페이스와 사용자 경험을 담당**합니다.

**핵심 원칙:**
- ✅ **UI/UX에만 집중** - 비즈니스 로직은 백엔드에 위임
- ✅ **절대 직접 DB 접근 금지** - Prisma Client 사용 불가
- ✅ **모든 데이터는 Backend API를 통해서만 접근**
- ✅ **API Routes는 프록시 역할만** - 인증 토큰 전달 및 에러 처리

### 주요 기능

**사용자 기능:**
- 🎯 모의고사 응시 (타이머, 자동저장, 실시간 채점)
- 📺 강의 영상 시청
- 📄 칼럼 읽기 (마크다운 + KaTeX 수식)
- 🎮 퀴즈 풀이 (모노폴리 보드 UI)
- 📚 경시대회 답안 조회
- 🛒 스토어 (시험지 구매)
- 👤 마이페이지 (학습 기록, 상담 기록)

**관리자 기능:**
- 👨‍🎓 학생/반/성적 관리
- 📝 시험 관리 (생성, 편집, 벌크 업로드)
- 🎙️ 음성 상담 (오디오 업로드, STT, AI 요약)
- 📺 강의/칼럼 관리
- 🛒 스토어 관리
- 📊 퀴즈/문제은행 관리

---

## 기술 스택

### Core Framework
- **Next.js 15.3** - React 기반 풀스택 프레임워크
  - App Router (서버/클라이언트 컴포넌트)
  - Server Actions
  - Streaming SSR
  - Automatic Code Splitting
- **React 19** - UI 라이브러리
- **TypeScript 5** - 정적 타입 시스템

### Styling
- **Tailwind CSS 4** - 유틸리티 기반 CSS
- **@tailwindcss/postcss** - PostCSS 플러그인
- **Lucide React** - 아이콘 라이브러리

### Data Fetching & State
- **SWR 2.3** - 클라이언트 데이터 페칭 및 캐싱
  - Stale-While-Revalidate 전략
  - 자동 재검증
  - Optimistic UI 지원
- **React Context** - 전역 상태 관리 (Auth)

### Content & Markdown
- **@uiw/react-md-editor** - 마크다운 에디터
- **react-markdown** - 마크다운 렌더링
- **rehype-katex** - 수식 렌더링 (LaTeX)
- **remark-gfm** - GitHub Flavored Markdown
- **katex** - 수학 수식 엔진

### PDF & Document
- **pdf-lib** - PDF 생성 (사칙연산)
- **@pdf-lib/fontkit** - 폰트 처리

### AI & OCR (⚠️ 주의: 장기적으로 Backend 이동 권장)
- **Note:** `@google/generative-ai` 패키지는 제거되었습니다
  - OCR 기능(`/api/qbank/ocr`)은 현재 서버사이드 API Route에서 처리
  - 환경 변수(`GEMINI_API_KEY`, `GOOGLE_CLOUD_API_KEY`)를 사용하므로 보안상 문제는 없음
  - 향후 이 기능을 Backend API로 이동하는 것을 권장

### Security (✅ 개선 완료)
- ✅ **보안 패키지 제거 완료**
  - `bcryptjs` - 제거됨 (Frontend에서 불필요)
  - `jsonwebtoken` - 제거됨 (Backend에서만 사용)
  - `@types/bcryptjs` - 제거됨
  - `@types/jsonwebtoken` - 제거됨

### Development Tools
- **ESLint** - 코드 린팅
- **eslint-config-next** - Next.js 린트 규칙

---

## 프로젝트 구조

```
frontend/
├── src/
│   ├── app/                         # Next.js App Router
│   │   ├── layout.tsx               # 루트 레이아웃
│   │   ├── page.tsx                 # 홈페이지
│   │   ├── globals.css              # 전역 스타일
│   │   │
│   │   ├── api/                     # 🔌 API Routes (프록시)
│   │   │   ├── auth/                # 인증 프록시
│   │   │   ├── exams/               # 시험 API
│   │   │   ├── nimda/               # 관리자 API
│   │   │   │   ├── auth/
│   │   │   │   ├── students/
│   │   │   │   ├── exams/
│   │   │   │   ├── scores/
│   │   │   │   ├── columns/
│   │   │   │   ├── images/
│   │   │   │   └── stores/
│   │   │   ├── quiz/
│   │   │   ├── qbank/
│   │   │   ├── cart/
│   │   │   ├── column/
│   │   │   └── homework-videos/
│   │   │
│   │   ├── auth/                    # 🔐 인증 페이지
│   │   │   ├── login/
│   │   │   ├── signup/
│   │   │   ├── register/
│   │   │   └── callback/
│   │   │
│   │   ├── exam/                    # 📝 시험
│   │   │   ├── page.tsx             # 시험 목록
│   │   │   └── [id]/
│   │   │       └── waiting/         # 대기실
│   │   ├── testing/                 # 시험 응시
│   │   │   └── page.tsx
│   │   │
│   │   ├── quiz/                    # 🎯 퀴즈
│   │   │   └── page.tsx
│   │   │
│   │   ├── answers/                 # 📚 경시대회 답안
│   │   │   ├── page.tsx
│   │   │   ├── seongdae/
│   │   │   ├── kmc/
│   │   │   ├── premium-mex/
│   │   │   └── core-more/
│   │   │
│   │   ├── lectures/                # 📺 강의
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │
│   │   ├── column/                  # 📄 칼럼
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │
│   │   ├── homework-videos/         # 🎬 숙제 영상
│   │   │   └── page.tsx
│   │   │
│   │   ├── qbank/                   # 📖 문제은행
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── register/            # 문제 등록
│   │   │   ├── viewer/              # 문제 조회
│   │   │   ├── extract/             # 문제 추출
│   │   │   ├── arithmetic-generator/ # 사칙연산 생성
│   │   │   └── chapters/            # 챕터 관리
│   │   │
│   │   ├── mypage/                  # 👤 마이페이지
│   │   │   ├── layout.tsx           # 사이드바 레이아웃
│   │   │   ├── page.tsx
│   │   │   ├── class-log/
│   │   │   ├── student-exams/
│   │   │   ├── student-arithmetic/
│   │   │   ├── parent-counseling/
│   │   │   ├── trophies/
│   │   │   ├── purchases/
│   │   │   └── settings/
│   │   │
│   │   ├── nimda/                   # 👨‍💼 관리자
│   │   │   ├── page.tsx             # 관리자 로그인
│   │   │   └── dashboard/
│   │   │       ├── page.tsx
│   │   │       ├── students/        # 학생 관리
│   │   │       │   ├── page.tsx
│   │   │       │   └── [id]/        # 학생 상세
│   │   │       │       ├── page.tsx
│   │   │       │       ├── study/
│   │   │       │       ├── scores/
│   │   │       │       ├── exams/
│   │   │       │       ├── arithmetic/
│   │   │       │       ├── counselings/
│   │   │       │       └── roadmap/
│   │   │       ├── classes/         # 반 관리
│   │   │       ├── scores/          # 성적 관리
│   │   │       ├── counselings/     # 상담 관리
│   │   │       ├── exams/           # 시험 관리
│   │   │       ├── lectures/        # 강의 관리
│   │   │       ├── columns/         # 칼럼 관리
│   │   │       ├── problems/        # 문제 관리
│   │   │       ├── quiz/            # 퀴즈 관리
│   │   │       └── stores/          # 스토어 관리
│   │   │
│   │   ├── store/                   # 🛒 스토어
│   │   ├── cart/                    # 장바구니
│   │   └── shopping/                # 구매 내역
│   │
│   ├── components/                  # 재사용 컴포넌트
│   │   ├── ui/                      # UI 프리미티브
│   │   │   ├── Card.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Grid.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── PageContainer.tsx
│   │   │   ├── PageHeader.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── layouts/                 # 레이아웃 컴포넌트
│   │   │   └── WithSidebar.tsx
│   │   │
│   │   ├── sidebars/                # 사이드바들
│   │   │   ├── ExamSidebar.tsx
│   │   │   ├── QuizSidebar.tsx
│   │   │   ├── AnswersSidebar.tsx
│   │   │   ├── StoreSidebar.tsx
│   │   │   └── MyPageSidebar.tsx
│   │   │
│   │   ├── admin/                   # 관리자 전용
│   │   │   ├── AdminLayout.tsx      # 2단 탭 네비게이션
│   │   │   ├── AudioPlayer.tsx
│   │   │   ├── AudioUploadModal.tsx
│   │   │   ├── CounselingTree.tsx
│   │   │   ├── CropModal.tsx
│   │   │   ├── LectureModal.tsx
│   │   │   ├── PdfGenerationPanel.tsx
│   │   │   ├── RoadmapEditor.tsx
│   │   │   ├── RoadmapGrid.tsx
│   │   │   ├── ScheduleEditor.tsx
│   │   │   ├── StudentInfoSection.tsx
│   │   │   └── TemplateSelectionModal.tsx
│   │   │
│   │   ├── testing/                 # 시험 컴포넌트
│   │   │   ├── ExamTimer.tsx
│   │   │   ├── QuestionContent.tsx
│   │   │   ├── QuestionNavigation.tsx
│   │   │   ├── QuestionSidebar.tsx
│   │   │   ├── AnswerInput.tsx
│   │   │   └── SubmitModal.tsx
│   │   │
│   │   ├── quiz/
│   │   │   └── MonopolyBoard.tsx
│   │   │
│   │   └── (shared)/                # 공유 컴포넌트
│   │       ├── NavigationBar.tsx
│   │       ├── GlobalNavigation.tsx
│   │       ├── Footer.tsx
│   │       ├── Toast.tsx
│   │       ├── ConfirmToast.tsx
│   │       ├── GoogleAuthButton.tsx
│   │       ├── LoginRequiredModal.tsx
│   │       └── ...
│   │
│   ├── contexts/                    # React Context
│   │   └── AuthContext.tsx          # 인증 상태 관리
│   │
│   ├── hooks/                       # 커스텀 훅
│   │   ├── useAdminAuth.ts          # 관리자 인증
│   │   ├── useCart.ts               # 장바구니 (SWR)
│   │   └── useExamPapers.ts         # 시험지 (SWR)
│   │
│   ├── types/                       # TypeScript 타입
│   │   ├── exam.ts
│   │   ├── answers.ts
│   │   └── ...
│   │
│   ├── utils/                       # 유틸리티
│   │   └── ...
│   │
│   └── lib/                         # 라이브러리
│       └── ...
│
├── public/                          # 정적 파일
│   ├── images/
│   ├── mogo_icon.png
│   └── favicon.ico
│
├── Dockerfile                       # Docker 이미지
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
├── next.config.ts
└── .eslintrc.json
```

---

## 페이지 구조

### 공개 페이지 (Public Routes)

#### 홈페이지 (`/`)
```typescript
// app/page.tsx
export default function HomePage() {
  return (
    <main>
      <Hero />                    {/* 메인 배너 */}
      <ContestSchedule />         {/* 대회 일정 */}
      <GoogleSignupCTA />         {/* Google 가입 유도 */}
      <KakaoChannelLink />        {/* 카카오톡 채널 */}
      <Features />                {/* 주요 기능 소개 */}
    </main>
  );
}
```

#### 인증 페이지 (`/auth/*`)
```
/auth/login              # 로그인
/auth/signup             # 회원가입
/auth/register           # 사용자 등록 (추가 정보)
/auth/callback           # OAuth 콜백 처리
```

**로그인 페이지:**
```typescript
// app/auth/login/page.tsx
export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card>
        <h1>로그인</h1>
        <GoogleOAuthButton />
        <KakaoOAuthButton />
      </Card>
    </div>
  );
}
```

### 시험 시스템

#### 시험 목록 (`/exam`)
```typescript
// app/exam/page.tsx
'use client';

export default function ExamListPage() {
  const { user } = useAuth();
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [examType, setExamType] = useState<'ALL' | 'FULL' | 'HALF' | 'BEGINNER'>('ALL');

  // Fetch exams with status
  const { data: exams, error } = useSWR(
    selectedStudent ? `/api/exams/with-status?studentId=${selectedStudent.id}` : null,
    fetcher
  );

  return (
    <PageContainer>
      <PageHeader title="모의고사" />

      {/* Student Selector */}
      <StudentSelector
        students={user?.students}
        selected={selectedStudent}
        onChange={setSelectedStudent}
      />

      {/* Type Filter */}
      <ExamTypeFilter value={examType} onChange={setExamType} />

      {/* Exam List */}
      <Grid cols={3}>
        {exams?.map((exam) => (
          <ExamCard
            key={exam.id}
            exam={exam}
            attempt={exam.attempt}
            onStart={() => router.push(`/exam/${exam.id}/waiting`)}
            onViewExplanation={() => router.push(`/explanation/${exam.id}/video`)}
          />
        ))}
      </Grid>
    </PageContainer>
  );
}
```

#### 대기실 (`/exam/[id]/waiting`)
```typescript
// app/exam/[id]/waiting/page.tsx
'use client';

export default function ExamWaitingPage({ params }: { params: { id: string } }) {
  const [exam, setExam] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [timerEnabled, setTimerEnabled] = useState(true);

  useEffect(() => {
    // Fetch exam details
    fetch(`/api/exams/${params.id}`)
      .then(res => res.json())
      .then(setExam);
  }, [params.id]);

  useEffect(() => {
    if (!exam?.activatedAt) return;

    const interval = setInterval(() => {
      const now = new Date();
      const activated = new Date(exam.activatedAt);
      const diff = activated.getTime() - now.getTime();
      setCountdown(Math.max(0, Math.floor(diff / 1000)));
    }, 1000);

    return () => clearInterval(interval);
  }, [exam]);

  const handleStart = () => {
    const examType = exam.type.toLowerCase();
    const examNum = exam.examnum;
    const timer = timerEnabled ? 'on' : 'off';
    router.push(`/testing?examType=${examType}&examNum=${examNum}&timer=${timer}`);
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card>
        <h1>{exam?.title}</h1>
        <ExamInfo exam={exam} />

        {countdown > 0 ? (
          <Countdown seconds={countdown} />
        ) : (
          <Button onClick={handleStart} disabled={countdown > 0}>
            시험 시작하기
          </Button>
        )}

        <label>
          <input
            type="checkbox"
            checked={timerEnabled}
            onChange={(e) => setTimerEnabled(e.target.checked)}
          />
          타이머 사용
        </label>
      </Card>
    </div>
  );
}
```

#### 시험 응시 (`/testing`)
```typescript
// app/testing/page.tsx
'use client';

export default function TestingPage() {
  const searchParams = useSearchParams();
  const examType = searchParams.get('examType');
  const examNum = searchParams.get('examnum');
  const timerEnabled = searchParams.get('timer') === 'on';

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [markedQuestions, setMarkedQuestions] = useState<Set<number>>(new Set());
  const [timeRemaining, setTimeRemaining] = useState(0);

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      saveAnswersToBackend(answers);
    }, 30000);
    return () => clearInterval(interval);
  }, [answers]);

  // Prevent page leave
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
      // Submit via Beacon API
      navigator.sendBeacon('/api/exams/submit', JSON.stringify(answers));
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [answers]);

  return (
    <div className="flex h-screen">
      {/* Question Sidebar */}
      <QuestionSidebar
        questions={questions}
        current={currentQuestion}
        answers={answers}
        marked={markedQuestions}
        onSelectQuestion={setCurrentQuestion}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Timer */}
        {timerEnabled && (
          <ExamTimer
            duration={exam.duration}
            onTimeUp={handleSubmit}
          />
        )}

        {/* Question */}
        <QuestionContent
          question={questions[currentQuestion]}
        />

        {/* Answer Input */}
        <AnswerInput
          value={answers[currentQuestion] || ''}
          onChange={(value) => setAnswers({ ...answers, [currentQuestion]: value })}
        />

        {/* Navigation */}
        <QuestionNavigation
          current={currentQuestion}
          total={questions.length}
          onPrev={() => setCurrentQuestion(currentQuestion - 1)}
          onNext={() => setCurrentQuestion(currentQuestion + 1)}
          onMark={() => toggleMark(currentQuestion)}
        />
      </div>
    </div>
  );
}
```

### 퀴즈 시스템 (`/quiz`)
```typescript
// app/quiz/page.tsx
'use client';

export default function QuizPage() {
  const { user, selectedStudent } = useAuth();
  const [quizTypes, setQuizTypes] = useState([]);
  const [progress, setProgress] = useState(null);

  // Fetch quiz types
  useEffect(() => {
    fetch('/api/quiz/types')
      .then(res => res.json())
      .then(setQuizTypes);
  }, []);

  // Fetch student progress
  useEffect(() => {
    if (selectedStudent) {
      fetch(`/api/quiz/progress?studentId=${selectedStudent.id}`)
        .then(res => res.json())
        .then(setProgress);
    }
  }, [selectedStudent]);

  return (
    <PageContainer>
      <PageHeader title="퀴즈" />

      {/* Monopoly Board UI */}
      <MonopolyBoard
        types={quizTypes}
        progress={progress}
        onSelectType={(type) => router.push(`/quiz/${type.key}`)}
      />

      {/* Progress Stats */}
      <ProgressStats progress={progress} />

      {/* Badges */}
      <BadgesList badges={progress?.badges || []} />
    </PageContainer>
  );
}
```

### 경시대회 답안 (`/answers`)
```typescript
// app/answers/page.tsx
export default function AnswersHubPage() {
  return (
    <WithSidebar sidebar={<AnswersSidebar />}>
      <PageHeader title="경시대회 답안" />

      <Grid cols={2}>
        <CategoryCard
          title="성대경시"
          description="상반기/하반기 답안"
          href="/answers/seongdae"
        />
        <CategoryCard
          title="KMC"
          description="KMC 답안"
          href="/answers/kmc"
        />
        <CategoryCard
          title="Premium MEX"
          description="영역별 답안"
          href="/answers/premium-mex"
        />
        <CategoryCard
          title="CORE/MORE"
          description="CORE/MORE 답안"
          href="/answers/core-more"
        />
      </Grid>
    </WithSidebar>
  );
}
```

### 마이페이지 (`/mypage`)
```typescript
// app/mypage/layout.tsx
export default function MyPageLayout({ children }) {
  return (
    <WithSidebar sidebar={<MyPageSidebar />}>
      {children}
    </WithSidebar>
  );
}

// app/mypage/page.tsx
export default function MyPageDashboard() {
  const { user, selectedStudent } = useAuth();

  return (
    <PageContainer>
      <PageHeader title="마이페이지" />

      <Grid cols={3}>
        <StatsCard title="총 응시 시험" value={stats.totalExams} />
        <StatsCard title="평균 점수" value={stats.averageScore} />
        <StatsCard title="획득 배지" value={stats.totalBadges} />
      </Grid>

      <RecentExams studentId={selectedStudent?.id} />
      <RecentCounselings studentId={selectedStudent?.id} />
    </PageContainer>
  );
}
```

---

## 컴포넌트 아키텍처

### UI 프리미티브 (`components/ui/`)

**Card 컴포넌트:**
```typescript
// components/ui/Card.tsx
interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className, onClick }: CardProps) {
  return (
    <div
      className={`bg-white dark:bg-gray-800 shadow-md rounded-lg border ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: CardProps) {
  return <div className={`px-6 py-4 border-b ${className}`}>{children}</div>;
}

export function CardBody({ children, className }: CardProps) {
  return <div className={`px-6 py-4 ${className}`}>{children}</div>;
}

export function CardFooter({ children, className }: CardProps) {
  return <div className={`px-6 py-4 border-t ${className}`}>{children}</div>;
}
```

**Button 컴포넌트:**
```typescript
// components/ui/Button.tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const baseClasses = 'rounded font-medium transition-colors focus:outline-none focus:ring-2';

  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800 focus:ring-gray-400',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
    ghost: 'hover:bg-gray-100 text-gray-700',
  };

  const sizeClasses = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <LoadingSpinner size="sm" /> : children}
    </button>
  );
}
```

**Grid 컴포넌트:**
```typescript
// components/ui/Grid.tsx
interface GridProps {
  children: React.ReactNode;
  cols?: 1 | 2 | 3 | 4;
  gap?: number;
  className?: string;
}

export function Grid({ children, cols = 3, gap = 4, className }: GridProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  };

  return (
    <div className={`grid ${gridCols[cols]} gap-${gap} ${className}`}>
      {children}
    </div>
  );
}
```

### 시험 컴포넌트 (`components/testing/`)

**ExamTimer:**
```typescript
// components/testing/ExamTimer.tsx
'use client';

interface ExamTimerProps {
  duration: number;          // 시험 시간 (분)
  onTimeUp: () => void;      // 시간 종료 콜백
  onWarning?: (remaining: number) => void;
}

export function ExamTimer({ duration, onTimeUp, onWarning }: ExamTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(duration * 60);
  const [isVisible, setIsVisible] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        const next = prev - 1;

        // Time warnings
        const totalTime = duration * 60;
        if (next === Math.floor(totalTime / 8)) {
          onWarning?.(next);
        }

        // Time up
        if (next <= 0) {
          clearInterval(interval);
          onTimeUp();
          return 0;
        }

        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, duration, onTimeUp, onWarning]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getColorClass = () => {
    const totalTime = duration * 60;
    if (timeRemaining < totalTime / 8) return 'text-red-600';
    if (timeRemaining < totalTime / 4) return 'text-orange-600';
    return 'text-blue-600';
  };

  if (!isVisible) {
    return (
      <button onClick={() => setIsVisible(true)} className="p-2">
        ⏱️ 타이머 보기
      </button>
    );
  }

  return (
    <div className="flex items-center gap-4 p-4 bg-white shadow">
      <div className={`text-2xl font-mono font-bold ${getColorClass()}`}>
        {formatTime(timeRemaining)}
      </div>

      <button onClick={() => setIsPaused(!isPaused)}>
        {isPaused ? '▶️ 재개' : '⏸️ 일시정지'}
      </button>

      <button onClick={() => setIsVisible(false)}>
        👁️ 숨기기
      </button>
    </div>
  );
}
```

**QuestionSidebar:**
```typescript
// components/testing/QuestionSidebar.tsx
interface QuestionSidebarProps {
  questions: Question[];
  current: number;
  answers: Record<number, string>;
  marked: Set<number>;
  onSelectQuestion: (index: number) => void;
}

export function QuestionSidebar({
  questions,
  current,
  answers,
  marked,
  onSelectQuestion
}: QuestionSidebarProps) {
  return (
    <div className="w-64 bg-gray-100 p-4 overflow-y-auto">
      <h3 className="font-bold mb-4">문제 목록</h3>

      <div className="grid grid-cols-5 gap-2">
        {questions.map((q, index) => {
          const isAnswered = answers[index] !== undefined && answers[index] !== '';
          const isMarked = marked.has(index);
          const isCurrent = current === index;

          return (
            <button
              key={index}
              onClick={() => onSelectQuestion(index)}
              className={`
                relative aspect-square rounded flex items-center justify-center font-semibold
                ${isCurrent ? 'ring-2 ring-blue-500' : ''}
                ${isAnswered ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'}
                ${isMarked ? 'border-2 border-yellow-500' : 'border border-gray-300'}
                hover:opacity-80
              `}
            >
              {index + 1}
              {isMarked && (
                <span className="absolute -top-1 -right-1 text-yellow-500">
                  ▲
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 text-sm space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span>답변 완료</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-white border border-gray-300 rounded"></div>
          <span>미완료</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-white border-2 border-yellow-500 rounded"></div>
          <span>마킹됨</span>
        </div>
      </div>
    </div>
  );
}
```

### 관리자 컴포넌트 (`components/admin/`)

**AdminLayout:**
```typescript
// components/admin/AdminLayout.tsx
'use client';

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [tier1Tab, setTier1Tab] = useState('students');
  const [tier2Tab, setTier2Tab] = useState(null);

  const tier1Tabs = [
    { id: 'students', label: '학생 관리', icon: '👨‍🎓' },
    { id: 'classes', label: '반 관리', icon: '🏫' },
    { id: 'scores', label: '성적 관리', icon: '📊' },
    { id: 'counselings', label: '상담 관리', icon: '💬' },
    { id: 'explanations', label: '해설 관리', icon: '📺' },
  ];

  const tier2Tabs = [
    { id: 'lectures', label: '강의 관리', icon: '📺' },
    { id: 'exams', label: '시험 관리', icon: '📝' },
    { id: 'columns', label: '칼럼 관리', icon: '📄' },
    { id: 'problems', label: '문제 관리', icon: '📖' },
    { id: 'stores', label: '스토어 관리', icon: '🛒' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Tier 1 Navigation */}
      <nav className="bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex space-x-1">
            {tier1Tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setTier1Tab(tab.id);
                  setTier2Tab(null);
                }}
                className={`
                  px-4 py-3 font-medium transition-colors
                  ${tier1Tab === tab.id
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                  }
                `}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Tier 2 Navigation */}
      <nav className="bg-gray-100 border-b">
        <div className="container mx-auto px-4">
          <div className="flex space-x-1">
            {tier2Tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setTier2Tab(tab.id)}
                className={`
                  px-3 py-2 text-sm font-medium transition-colors
                  ${tier2Tab === tab.id
                    ? 'bg-white text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                  }
                `}
              >
                <span className="mr-1">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
```

**AudioUploadModal:**
```typescript
// components/admin/AudioUploadModal.tsx
'use client';

interface AudioUploadModalProps {
  studentId: string;
  onSuccess: (counselingId: string) => void;
  onClose: () => void;
}

export function AudioUploadModal({ studentId, onSuccess, onClose }: AudioUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('audio', file);

    try {
      // Upload in chunks for large files
      const response = await fetch(`/api/nimda/students/${studentId}/audio-counselings/upload`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      onSuccess(data.id);
      onClose();
    } catch (error) {
      alert('업로드 실패: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal onClose={onClose}>
      <h2 className="text-xl font-bold mb-4">음성 상담 업로드</h2>

      <div className="mb-4">
        <label className="block mb-2 font-medium">오디오 파일</label>
        <input
          type="file"
          accept="audio/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="w-full"
        />
        {file && (
          <p className="mt-2 text-sm text-gray-600">
            선택된 파일: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
          </p>
        )}
      </div>

      {uploading && (
        <div className="mb-4">
          <div className="w-full bg-gray-200 rounded">
            <div
              className="bg-blue-600 h-2 rounded transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-center mt-1">{progress}%</p>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose} disabled={uploading}>
          취소
        </Button>
        <Button onClick={handleUpload} disabled={!file || uploading} loading={uploading}>
          업로드
        </Button>
      </div>
    </Modal>
  );
}
```

---

## 데이터 페칭 (SWR)

### SWR 기본 사용법

**Fetcher 함수:**
```typescript
// lib/fetcher.ts
export const fetcher = async (url: string) => {
  const token = localStorage.getItem('accessToken');

  const response = await fetch(url, {
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    }
  });

  if (!response.ok) {
    const error = new Error('An error occurred while fetching the data.');
    error.info = await response.json();
    error.status = response.status;
    throw error;
  }

  return response.json();
};
```

**기본 사용:**
```typescript
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';

function ExamList() {
  const { data, error, isLoading } = useSWR('/api/exams', fetcher);

  if (error) return <div>Failed to load</div>;
  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      {data.map((exam) => (
        <ExamCard key={exam.id} exam={exam} />
      ))}
    </div>
  );
}
```

### 커스텀 훅 with SWR

**useCart:**
```typescript
// hooks/useCart.ts
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';

export function useCart() {
  const { data, error, mutate } = useSWR('/api/cart', fetcher, {
    revalidateOnFocus: false,  // 포커스 시 재검증 비활성화
  });

  const { data: count } = useSWR('/api/cart/count', fetcher);

  const addToCart = async (productId: string, quantity = 1) => {
    try {
      const response = await fetch('/api/cart/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({ storeProductId: productId, quantity })
      });

      if (!response.ok) throw new Error('Failed to add to cart');

      // Optimistic update
      mutate();

      return await response.json();
    } catch (error) {
      console.error('Add to cart error:', error);
      throw error;
    }
  };

  const updateCartItem = async (cartId: string, quantity: number) => {
    try {
      const response = await fetch('/api/cart', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({ cartId, quantity })
      });

      if (!response.ok) throw new Error('Failed to update cart');

      mutate();
      return await response.json();
    } catch (error) {
      console.error('Update cart error:', error);
      throw error;
    }
  };

  const removeCartItem = async (cartId: string) => {
    try {
      const response = await fetch(`/api/cart/${cartId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) throw new Error('Failed to remove from cart');

      mutate();
    } catch (error) {
      console.error('Remove from cart error:', error);
      throw error;
    }
  };

  const clearCart = async () => {
    // Remove all items
    if (data) {
      await Promise.all(data.map(item => removeCartItem(item.id)));
    }
  };

  return {
    cart: data,
    cartCount: count?.count || 0,
    isLoading: !error && !data,
    error,
    addToCart,
    updateCartItem,
    removeCartItem,
    clearCart,
    refresh: mutate,
  };
}
```

**useExamPapers:**
```typescript
// hooks/useExamPapers.ts
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';

export function useExamPapers(page = 1, limit = 20) {
  const { data, error, mutate } = useSWR(
    `/api/nimda/stores/exam-papers?page=${page}&limit=${limit}`,
    fetcher
  );

  const createExamPaper = async (data: CreateExamPaperDto) => {
    const token = localStorage.getItem('adminToken');
    const response = await fetch('/api/nimda/stores/exam-papers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) throw new Error('Failed to create exam paper');

    const result = await response.json();
    mutate(); // Refresh list
    return result;
  };

  const updateExamPaper = async (id: string, data: UpdateExamPaperDto) => {
    const token = localStorage.getItem('adminToken');
    const response = await fetch(`/api/nimda/stores/exam-papers/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) throw new Error('Failed to update exam paper');

    const result = await response.json();
    mutate();
    return result;
  };

  const deleteExamPaper = async (id: string) => {
    const token = localStorage.getItem('adminToken');
    const response = await fetch(`/api/nimda/stores/exam-papers/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) throw new Error('Failed to delete exam paper');

    mutate();
  };

  const uploadThumbnail = async (id: string, file: File) => {
    const token = localStorage.getItem('adminToken');
    const formData = new FormData();
    formData.append('thumbnail', file);

    const response = await fetch(`/api/nimda/stores/exam-papers/${id}/thumbnail`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) throw new Error('Failed to upload thumbnail');

    const result = await response.json();
    mutate();
    return result;
  };

  return {
    examPapers: data?.examPapers || [],
    total: data?.total || 0,
    isLoading: !error && !data,
    error,
    createExamPaper,
    updateExamPaper,
    deleteExamPaper,
    uploadThumbnail,
    refresh: mutate,
  };
}
```

### SWR 고급 패턴

**Conditional Fetching:**
```typescript
const { data } = useSWR(
  user ? `/api/cart` : null,  // user가 없으면 fetch 안 함
  fetcher
);
```

**Pagination:**
```typescript
function ExamList() {
  const [page, setPage] = useState(1);
  const { data, error } = useSWR(`/api/exams?page=${page}&limit=20`, fetcher);

  return (
    <>
      <ExamCards exams={data?.exams} />
      <Pagination
        current={page}
        total={data?.total}
        onChange={setPage}
      />
    </>
  );
}
```

**Optimistic Updates:**
```typescript
const { data, mutate } = useSWR('/api/cart', fetcher);

async function addToCart(productId) {
  // Optimistically update UI
  const newItem = { id: 'temp', productId, quantity: 1 };
  mutate([...data, newItem], false);  // false = don't revalidate yet

  try {
    await fetch('/api/cart/add', {
      method: 'POST',
      body: JSON.stringify({ productId })
    });

    // Revalidate after success
    mutate();
  } catch (error) {
    // Rollback on error
    mutate();
  }
}
```

---

## API Routes

### 프록시 패턴

**Frontend API Route의 역할:**
1. ✅ Backend API로 요청 프록시
2. ✅ 인증 토큰 전달
3. ✅ 에러 처리 및 표준화
4. ❌ 비즈니스 로직 처리 (Backend에서만)
5. ❌ 직접 DB 접근 (절대 금지)

**표준 프록시 패턴:**
```typescript
// app/api/exams/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // 1. Get auth token from request
    const authHeader = request.headers.get('Authorization');

    // 2. Forward to backend
    const response = await fetch(`${process.env.BACKEND_URL}/api/exams`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader || '',
        'Content-Type': 'application/json',
      },
    });

    // 3. Get data
    const data = await response.json();

    // 4. Return with same status code
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Backend API 호출 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
```

### API Routes 예시

**시험 API:**
```typescript
// app/api/exams/with-status/route.ts
export async function GET(request: NextRequest) {
  const searchParams = request.URL.searchParams;
  const studentId = searchParams.get('studentId');
  const authHeader = request.headers.get('Authorization');

  const response = await fetch(
    `${process.env.BACKEND_URL}/api/exams/with-status?studentId=${studentId}`,
    {
      headers: {
        'Authorization': authHeader || '',
      }
    }
  );

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}

// app/api/exams/attempts/route.ts
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  const body = await request.json();

  const response = await fetch(`${process.env.BACKEND_URL}/api/exams/attempts`, {
    method: 'POST',
    headers: {
      'Authorization': authHeader || '',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
```

**관리자 API:**
```typescript
// app/api/nimda/auth/route.ts
export async function POST(request: NextRequest) {
  const body = await request.json();

  const response = await fetch(`${process.env.BACKEND_URL}/api/auth/admin/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}

// app/api/nimda/students/route.ts
export async function GET(request: NextRequest) {
  const searchParams = request.URL.searchParams;
  const authHeader = request.headers.get('Authorization');

  const queryString = searchParams.toString();
  const response = await fetch(
    `${process.env.BACKEND_URL}/api/admin/students?${queryString}`,
    {
      headers: {
        'Authorization': authHeader || '',
      }
    }
  );

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
```

**파일 업로드 프록시:**
```typescript
// app/api/nimda/images/upload/route.ts
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  const formData = await request.formData();

  // Forward multipart form data to backend
  const response = await fetch(`${process.env.BACKEND_URL}/api/nimda/images/upload`, {
    method: 'POST',
    headers: {
      'Authorization': authHeader || '',
      // Don't set Content-Type, let fetch handle it for FormData
    },
    body: formData,
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
```

---

## 인증 시스템

### AuthContext

**Context 구조:**
```typescript
// contexts/AuthContext.tsx
'use client';

import { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  profileImage?: string;
  subscription?: string;
  students?: Student[];
}

interface Student {
  id: string;
  name: string;
  grade: number;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  selectedStudent: Student | null;
  loading: boolean;
  login: (data: { accessToken: string; user: User }) => void;
  logout: (redirectToHome?: boolean) => void;
  selectStudent: (student: Student | null) => void;
  refreshUser: () => Promise<void>;
  refreshStudents: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user on mount
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  // Auto-select first student
  useEffect(() => {
    if (user?.students && user.students.length > 0 && !selectedStudent) {
      setSelectedStudent(user.students[0]);
    }
  }, [user, selectedStudent]);

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }

      const data = await response.json();
      setUser(data);
    } catch (error) {
      console.error('Fetch user error:', error);
      logout(false);
    } finally {
      setLoading(false);
    }
  };

  const login = (data: { accessToken: string; user: User }) => {
    localStorage.setItem('accessToken', data.accessToken);
    setUser(data.user);
  };

  const logout = (redirectToHome = true) => {
    // Clear localStorage
    localStorage.removeItem('accessToken');

    // Clear session storage
    sessionStorage.clear();

    // Clear cookies (Google OAuth)
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });

    setUser(null);
    setSelectedStudent(null);

    if (redirectToHome) {
      window.location.href = '/';
    }
  };

  const selectStudent = (student: Student | null) => {
    setSelectedStudent(student);
  };

  const refreshUser = async () => {
    await fetchUser();
  };

  const refreshStudents = async () => {
    const token = localStorage.getItem('accessToken');
    const response = await fetch('/api/users/students', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      const students = await response.json();
      setUser((prev) => prev ? { ...prev, students } : null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        selectedStudent,
        loading,
        login,
        logout,
        selectStudent,
        refreshUser,
        refreshStudents,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

### 관리자 인증

**useAdminAuth:**
```typescript
// hooks/useAdminAuth.ts
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function useAdminAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('adminToken');

    if (!token) {
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }

    // Check session cache (5 minutes)
    const lastValidated = sessionStorage.getItem('adminTokenValidated');
    if (lastValidated) {
      const elapsed = Date.now() - parseInt(lastValidated);
      if (elapsed < 5 * 60 * 1000) {
        setIsAuthenticated(true);
        setLoading(false);
        return;
      }
    }

    // Validate token with backend
    try {
      const response = await fetch('/api/nimda/auth/validate', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setIsAuthenticated(true);
        sessionStorage.setItem('adminTokenValidated', Date.now().toString());
      } else {
        logout();
      }
    } catch (error) {
      console.error('Auth check error:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    const response = await fetch('/api/nimda/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const data = await response.json();
    localStorage.setItem('adminToken', data.accessToken);
    sessionStorage.setItem('adminTokenValidated', Date.now().toString());
    setIsAuthenticated(true);

    return data;
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    sessionStorage.removeItem('adminTokenValidated');
    setIsAuthenticated(false);
    router.push('/nimda');
  };

  const requireAuth = () => {
    if (!loading && !isAuthenticated) {
      router.push('/nimda');
    }
  };

  return {
    isAuthenticated,
    loading,
    login,
    logout,
    requireAuth,
  };
}
```

### 페이지 접근 제어

**Protected Route:**
```typescript
// app/mypage/page.tsx
'use client';

export default function MyPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  if (loading) return <LoadingSpinner />;
  if (!user) return null;

  return <div>마이페이지 콘텐츠</div>;
}
```

**Admin Protected Route:**
```typescript
// app/nimda/dashboard/page.tsx
'use client';

export default function AdminDashboard() {
  const { isAuthenticated, loading, requireAuth } = useAdminAuth();

  useEffect(() => {
    requireAuth();
  }, [isAuthenticated, loading]);

  if (loading) return <LoadingSpinner />;
  if (!isAuthenticated) return null;

  return <div>관리자 대시보드</div>;
}
```

---

## 관리자 페이지

### 학생 관리 (`/nimda/dashboard/students`)

**학생 목록:**
```typescript
// app/nimda/dashboard/students/page.tsx
'use client';

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchStudents();
  }, [page, search]);

  const fetchStudents = async () => {
    const token = localStorage.getItem('adminToken');
    const response = await fetch(
      `/api/nimda/students?page=${page}&search=${search}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    const data = await response.json();
    setStudents(data.students);
  };

  return (
    <AdminLayout>
      <PageHeader title="학생 관리">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 border rounded"
          />
          <Button onClick={() => setViewMode(viewMode === 'table' ? 'card' : 'table')}>
            {viewMode === 'table' ? '카드뷰' : '테이블뷰'}
          </Button>
          <Button onClick={() => router.push('/nimda/dashboard/students/new')}>
            + 학생 추가
          </Button>
        </div>
      </PageHeader>

      {viewMode === 'table' ? (
        <StudentsTable students={students} onRefresh={fetchStudents} />
      ) : (
        <StudentsCardGrid students={students} onRefresh={fetchStudents} />
      )}

      <Pagination
        current={page}
        total={students.length}
        onChange={setPage}
      />
    </AdminLayout>
  );
}
```

**학생 상세 (탭 네비게이션):**
```typescript
// app/nimda/dashboard/students/[id]/page.tsx
'use client';

export default function StudentDetailPage({ params }: { params: { id: string } }) {
  const [tab, setTab] = useState('overview');
  const [student, setStudent] = useState(null);

  useEffect(() => {
    fetchStudent();
  }, [params.id]);

  const fetchStudent = async () => {
    const token = localStorage.getItem('adminToken');
    const response = await fetch(`/api/nimda/students/${params.id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();
    setStudent(data);
  };

  const tabs = [
    { id: 'overview', label: '개요', icon: '📋' },
    { id: 'study', label: '학습 로그', icon: '📚' },
    { id: 'scores', label: '성적', icon: '📊' },
    { id: 'exams', label: '시험 기록', icon: '📝' },
    { id: 'arithmetic', label: '사칙연산', icon: '🔢' },
    { id: 'counselings', label: '상담', icon: '💬' },
    { id: 'roadmap', label: '로드맵', icon: '🗺️' },
  ];

  return (
    <AdminLayout>
      <StudentInfoSection student={student} />

      <nav className="flex gap-2 mb-4">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded ${
              tab === t.id ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            <span className="mr-2">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>

      {tab === 'overview' && <StudentOverview student={student} />}
      {tab === 'study' && <StudyLogs studentId={params.id} />}
      {tab === 'scores' && <ScoreManagement studentId={params.id} />}
      {tab === 'exams' && <ExamRecords studentId={params.id} />}
      {tab === 'arithmetic' && <ArithmeticRecords studentId={params.id} />}
      {tab === 'counselings' && <CounselingManagement studentId={params.id} />}
      {tab === 'roadmap' && <RoadmapEditor studentId={params.id} student={student} />}
    </AdminLayout>
  );
}
```

### 음성 상담 관리

**상담 목록 with STT:**
```typescript
// app/nimda/dashboard/students/[id]/counselings/page.tsx
'use client';

export default function CounselingsPage({ params }: { params: { id: string } }) {
  const [counselings, setCounselings] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const fetchCounselings = async () => {
    const token = localStorage.getItem('adminToken');
    const response = await fetch(
      `/api/nimda/students/${params.id}/audio-counselings`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    const data = await response.json();
    setCounselings(data);
  };

  const handleProcessSTT = async (counselingId: string) => {
    const token = localStorage.getItem('adminToken');

    try {
      const response = await fetch('/api/stt/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          counselingId,
          useQueue: true,
          priority: 'NORMAL'
        })
      });

      if (!response.ok) throw new Error('STT processing failed');

      alert('STT 처리가 시작되었습니다. 잠시 후 결과를 확인하세요.');

      // Poll for status
      const pollStatus = setInterval(async () => {
        const statusRes = await fetch(`/api/stt/status/${counselingId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const status = await statusRes.json();

        if (status.transcriptStatus === 'completed' && status.summaryStatus === 'completed') {
          clearInterval(pollStatus);
          fetchCounselings();
          alert('STT 처리가 완료되었습니다!');
        } else if (status.transcriptStatus === 'failed' || status.summaryStatus === 'failed') {
          clearInterval(pollStatus);
          alert('STT 처리 중 오류가 발생했습니다.');
        }
      }, 5000);
    } catch (error) {
      alert('STT 처리 요청 실패: ' + error.message);
    }
  };

  return (
    <div>
      <Button onClick={() => setShowUploadModal(true)}>
        + 음성 상담 업로드
      </Button>

      <div className="mt-4 space-y-4">
        {counselings.map((counseling) => (
          <Card key={counseling.id}>
            <h3>{counseling.title || '제목 없음'}</h3>
            <p>생성일: {new Date(counseling.createdAt).toLocaleDateString()}</p>

            <div className="flex gap-2 mt-2">
              <Badge variant={counseling.transcriptStatus}>
                Transcript: {counseling.transcriptStatus}
              </Badge>
              <Badge variant={counseling.summaryStatus}>
                Summary: {counseling.summaryStatus}
              </Badge>
            </div>

            <div className="flex gap-2 mt-4">
              {counseling.transcriptStatus === 'pending' && (
                <Button onClick={() => handleProcessSTT(counseling.id)}>
                  STT 처리 시작
                </Button>
              )}
              {counseling.audioUrl && (
                <AudioPlayer src={counseling.audioUrl} />
              )}
              {counseling.transcript && (
                <Button onClick={() => router.push(`/nimda/dashboard/students/${params.id}/counselings/${counseling.id}`)}>
                  상세 보기
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {showUploadModal && (
        <AudioUploadModal
          studentId={params.id}
          onSuccess={fetchCounselings}
          onClose={() => setShowUploadModal(false)}
        />
      )}
    </div>
  );
}
```

---

## 환경 변수

### 필수 환경 변수

**Public 환경 변수 (브라우저에서 접근 가능):**
```bash
NEXT_PUBLIC_API_URL=https://anchormoms.club/api
NEXT_PUBLIC_IMAGE_BASE_URL=https://anchormoms.club
NEXT_PUBLIC_KAKAO_CLIENT_ID=test_client_id
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
NEXT_PUBLIC_GOOGLE_REDIRECT_URI=https://anchormoms.club/api/auth/callback/google
```

**Server-side 환경 변수:**
```bash
# Backend API URL (서버 사이드에서만 사용)
BACKEND_URL=http://backend:3001

# NextAuth (현재 사용 안 함, 향후 고려)
NEXTAUTH_URL=https://anchormoms.club
NEXTAUTH_SECRET=your-nextauth-secret-key

# OAuth Secrets (서버 사이드에서만)
KAKAO_CLIENT_ID=your-kakao-client-id
KAKAO_CLIENT_SECRET=your-kakao-client-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# JWT (⚠️ 제거 권장 - Backend에서만 사용)
JWT_SECRET=supersecret123

# AI APIs (⚠️ Backend로 이동 권장)
GEMINI_API_KEY=your-gemini-api-key
GOOGLE_CLOUD_API_KEY=your-vision-api-key

# Books (QBank)
BOOKS_BASE_DIR=/var/www/books

# App
PORT=3000
NODE_ENV=production
```

### ⚠️ 보안 주의사항

**환경 변수 정리 상태:**

✅ **제거 완료:**
- `DATABASE_URL` - Frontend에 없음 (Backend 전용)
- `JWT_SECRET` - 제거됨 (Backend 전용)

⚠️ **주의 필요 (현재 사용 중):**
```bash
# 서버사이드 API Routes에서만 사용 (브라우저 노출 안 됨)
GEMINI_API_KEY              # /api/qbank/ocr에서 사용
GOOGLE_CLOUD_API_KEY        # /api/qbank/ocr에서 사용
```

**권장사항:**
- ✅ Frontend API Routes는 프록시 역할만 수행
- ✅ 민감한 패키지(`bcryptjs`, `jsonwebtoken`) 제거 완료
- 📋 향후: OCR 기능을 Backend로 완전히 이동
- 📋 `.env.example` 파일 참고하여 환경 변수 설정

---

## 개발 가이드

### 로컬 개발 환경 설정

#### 1. Prerequisites
```bash
# Node.js 18+
node --version

# npm or yarn
npm --version
```

#### 2. 환경 변수 설정
```bash
# .env.local 파일 생성
cp .env.example .env.local

# 필수 값 입력
nano .env.local
```

#### 3. Dependencies 설치
```bash
cd frontend
npm install
```

#### 4. 개발 서버 실행
```bash
# Turbopack으로 실행 (빠른 HMR)
npm run dev

# 또는 일반 모드
next dev
```

브라우저에서 http://localhost:3000 접속

### 새로운 페이지 추가

**App Router 사용:**
```bash
# 새 페이지 생성
mkdir -p src/app/my-feature
touch src/app/my-feature/page.tsx

# 동적 라우트
mkdir -p src/app/my-feature/[id]
touch src/app/my-feature/[id]/page.tsx
```

**페이지 템플릿:**
```typescript
// app/my-feature/page.tsx
'use client';  // 클라이언트 컴포넌트 (상태/이벤트 필요 시)

import { PageContainer, PageHeader } from '@/components/ui';

export default function MyFeaturePage() {
  return (
    <PageContainer>
      <PageHeader title="My Feature" />
      <div>콘텐츠</div>
    </PageContainer>
  );
}
```

### 새로운 컴포넌트 추가

**재사용 가능한 컴포넌트:**
```typescript
// components/ui/MyComponent.tsx
interface MyComponentProps {
  title: string;
  onClick?: () => void;
}

export function MyComponent({ title, onClick }: MyComponentProps) {
  return (
    <div className="p-4 border rounded" onClick={onClick}>
      <h3 className="font-bold">{title}</h3>
    </div>
  );
}
```

**컴포넌트 export 추가:**
```typescript
// components/ui/index.ts
export { MyComponent } from './MyComponent';
```

### 새로운 API Route 추가

```typescript
// app/api/my-feature/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');

  const response = await fetch(`${process.env.BACKEND_URL}/api/my-feature`, {
    headers: {
      'Authorization': authHeader || '',
    }
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  const body = await request.json();

  const response = await fetch(`${process.env.BACKEND_URL}/api/my-feature`, {
    method: 'POST',
    headers: {
      'Authorization': authHeader || '',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
```

### 타입 정의

**타입 파일 생성:**
```typescript
// types/my-feature.ts
export interface MyFeature {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMyFeatureDto {
  title: string;
  description: string;
}

export interface UpdateMyFeatureDto {
  title?: string;
  description?: string;
}
```

### Tailwind CSS 커스텀

**tailwind.config.ts:**
```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        secondary: '#64748B',
        danger: '#EF4444',
      },
      spacing: {
        '128': '32rem',
      },
    },
  },
  plugins: [],
  darkMode: 'class',
};

export default config;
```

---

## 빌드 및 배포

### 프로덕션 빌드

**Next.js 설정 (next.config.ts):**
```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',  // Docker 최적화

  images: {
    domains: ['anchormoms.club'],  // 이미지 최적화 허용 도메인
  },

  // Disable telemetry
  telemetry: {
    disabled: true,
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_IMAGE_BASE_URL: process.env.NEXT_PUBLIC_IMAGE_BASE_URL,
  },
};

export default nextConfig;
```

**빌드 명령:**
```bash
# 프로덕션 빌드
npm run build

# 빌드 결과 확인
ls -la .next/

# 로컬에서 프로덕션 모드 테스트
npm run start
```

### Docker 빌드

**Multi-stage Dockerfile:**
```dockerfile
# Stage 1: Dependencies
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat wget
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Stage 2: Builder
FROM deps AS builder
WORKDIR /app
COPY . .

# Build-time environment variables
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_KAKAO_CLIENT_ID
ARG NEXT_PUBLIC_IMAGE_BASE_URL
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID
ARG NEXT_PUBLIC_GOOGLE_REDIRECT_URI

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_KAKAO_CLIENT_ID=$NEXT_PUBLIC_KAKAO_CLIENT_ID
ENV NEXT_PUBLIC_IMAGE_BASE_URL=$NEXT_PUBLIC_IMAGE_BASE_URL
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_CLIENT_ID
ENV NEXT_PUBLIC_GOOGLE_REDIRECT_URI=$NEXT_PUBLIC_GOOGLE_REDIRECT_URI
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# Stage 3: Runner
FROM node:18-alpine AS runner
RUN apk add --no-cache wget
ENV NODE_ENV=production
WORKDIR /app

# Copy only runtime artifacts
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

RUN mkdir -p /app/public/images

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

CMD ["node", "server.js"]
```

**빌드:**
```bash
docker build -t mogo-frontend:latest .
```

### 성능 최적화

**1. Code Splitting:**
```typescript
// Dynamic import for heavy components
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('@/components/HeavyComponent'), {
  loading: () => <LoadingSpinner />,
  ssr: false,  // Disable SSR if not needed
});
```

**2. Image Optimization:**
```typescript
import Image from 'next/image';

export function OptimizedImage() {
  return (
    <Image
      src="/images/banner.jpg"
      alt="Banner"
      width={1200}
      height={600}
      priority  // For LCP images
      placeholder="blur"
      blurDataURL="data:image/..."
    />
  );
}
```

**3. Font Optimization:**
```typescript
// app/layout.tsx
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }) {
  return (
    <html lang="ko" className={inter.className}>
      <body>{children}</body>
    </html>
  );
}
```

**4. SWR Configuration:**
```typescript
import { SWRConfig } from 'swr';

export function Providers({ children }) {
  return (
    <SWRConfig
      value={{
        refreshInterval: 0,  // Disable auto-refresh
        revalidateOnFocus: false,  // Disable revalidate on focus
        shouldRetryOnError: false,  // Disable auto-retry
        dedupingInterval: 2000,  // Dedupe requests within 2s
      }}
    >
      {children}
    </SWRConfig>
  );
}
```

### 배포 체크리스트

**빌드 전:**
- [ ] 환경 변수 확인 (.env.prod)
- [ ] API URL 확인
- [ ] 이미지 도메인 설정
- [ ] 불필요한 console.log 제거

**빌드 후:**
- [ ] 빌드 에러 없음
- [ ] Bundle size 확인
- [ ] Lighthouse 점수 확인 (Performance, Accessibility, SEO)
- [ ] 주요 페이지 로딩 테스트

**배포 후:**
- [ ] Health check 확인
- [ ] API 연결 확인
- [ ] OAuth 로그인 테스트
- [ ] 이미지 로딩 확인
- [ ] 모바일 반응형 확인

---

## 트러블슈팅

### 일반적인 문제들

**1. Hydration Mismatch**
```
Error: Hydration failed because the initial UI does not match what was rendered on the server.

Solution:
- 클라이언트 전용 코드는 useEffect 안에서 실행
- localStorage 접근은 클라이언트에서만
- 'use client' 디렉티브 사용
```

**2. 환경 변수 접근 불가**
```
Error: process.env.NEXT_PUBLIC_API_URL is undefined

Solution:
- NEXT_PUBLIC_ 접두사 확인
- .env.local 파일 존재 확인
- 개발 서버 재시작
```

**3. Image Optimization Error**
```
Error: Invalid src prop on next/image

Solution:
- next.config.ts에 도메인 추가
- 절대 경로 사용 (/images/...)
- width, height 속성 필수
```

**4. SWR Infinite Loop**
```
Problem: Infinite re-rendering

Solution:
- fetcher 함수 메모이제이션
- 의존성 배열 확인
- revalidateOnFocus 비활성화
```

**5. Build Error (Module not found)**
```
Error: Module not found: Can't resolve '@/components/...'

Solution:
- tsconfig.json paths 확인
- 파일 경로 대소문자 확인
- npm install 재실행
```

---

## 보안 고려사항

### 중요 보안 원칙

1. **환경 변수 보호**
   - `.env.local` 절대 커밋 금지
   - API 키는 서버 사이드에서만 사용
   - Public 환경 변수는 민감하지 않은 정보만

2. **XSS 방지**
   - 사용자 입력 검증
   - dangerouslySetInnerHTML 사용 최소화
   - React가 기본적으로 이스케이핑

3. **CSRF 방지**
   - SameSite 쿠키 설정
   - CORS 설정 검증

4. **인증 토큰 관리**
   - localStorage 사용 (XSS 취약)
   - HttpOnly 쿠키 고려 (향후)
   - 토큰 만료 처리

5. **API 요청 보안**
   - 항상 HTTPS 사용
   - Authorization 헤더 전달
   - 에러 메시지에 민감 정보 포함 금지

---

## 라이선스

MIT License

---

## 문의

- **Email:** rwonjong94@gmail.com
- **GitHub Issues:** [이슈 등록](https://github.com/rwonjong94/mogo/issues)

---

**마지막 업데이트:** 2024년 12월
