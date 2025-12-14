# Anchor Moms Web - 전체 기능 목록

프론트엔드의 모든 기능을 카테고리별로 정리했습니다.

---

## 📝 1. 시험 관련 기능 (Exam System)

### 사용자 기능
- **시험 응시** (`/exam`, `/exam/[id]/waiting`, `/testing`)
  - 시험 목록 조회 및 필터링 (FULL/HALF/BEGINNER)
  - 시험 대기실 (카운트다운 타이머)
  - 시험 응시 인터페이스
  - 답안 제출 및 실시간 저장
  - API: `/api/exams`, `/api/exams/with-status`, `/api/exams/attempts`, `/api/exams/responses`

### 관리자 기능
- **시험 관리** (`/nimda/dashboard/exams`)
  - 시험 CRUD
  - 문제 업로드 (이미지 포함)
  - 시험 활성화/비활성화
  - 문제 관리
  - API: `/api/nimda/exams/*`

### 성적 관리
- **사용자**: `/mypage/student-exams` - 학생별 시험 기록 조회
- **관리자**: `/nimda/dashboard/scores` - 성적 일괄 등록, 통계
  - API: `/api/nimda/scores/*`

---

## 🎯 2. 퀴즈 기능 (Quiz System)

### 사용자 기능
- **퀴즈** (`/quiz`)
  - 모노폴리 보드 UI
  - 퀴즈 유형별 진행
  - 학생별 진행도 추적
  - API: `/api/quiz/*`

### 관리자 기능
- **퀴즈 관리** (`/nimda/dashboard/quiz`)
  - 퀴즈 세트 관리
  - 퀴즈 통계
  - API: `/api/nimda/quiz/*` (추정)

**관련 파일:**
- Frontend: `src/app/quiz/`, `src/components/quiz/`
- API: `src/app/api/quiz/`

---

## 📚 3. 해설 기능 (Explanations)

### 사용자 기능
- **해설 보기** (`/explanations`, `/explanation/[id]/video`, `/explanation/[id]/document`)
  - 영상 해설
  - 문서 해설
  - API: `/api/explanations`

### 관리자 기능
- **해설 관리** (`/nimda/dashboard/explanations`)
  - 해설 CRUD
  - API: `/api/explanations/admin`, `/api/nimda/explanations/*` (추정)

### 마이페이지
- **내 해설**: `/mypage/explanations` - 사용자별 해설 접근 내역

**관련 파일:**
- Frontend: `src/app/explanations/`, `src/app/explanation/`, `src/app/mypage/explanations/`
- API: `src/app/api/explanations/`

---

## 🎥 4. 강의 기능 (Lectures)

### 사용자 기능
- **강의 시청** (`/lectures`, `/lectures/[id]`)
  - 강의 목록 (카테고리별)
  - 비디오 플레이어
  - API: `/api/lectures/*`

### 관리자 기능
- **강의 관리** (`/nimda/dashboard/lectures`)
  - 강의 CRUD
  - 카테고리 관리
  - 썸네일 업로드
  - 공개/비공개 토글
  - API: 백엔드 `/lectures/*`

**관련 파일:**
- Frontend: `src/app/lectures/`, `src/app/nimda/dashboard/lectures/`
- API: `src/app/api/lectures/`
- Backend: `backend/src/lectures/`

---

## 📝 5. 숙제 영상 (Homework Videos)

### 사용자 기능
- **숙제 영상** (`/homework-videos`)
  - 학생별 숙제 영상 업로드/조회
  - YouTube URL 연동
  - 날짜별 필터링
  - API: `/api/homework-videos/*`

### 관리자 기능
- 관리자 전체 숙제 영상 조회
  - API: `/api/homework-videos/admin`

**관련 파일:**
- Frontend: `src/app/homework-videos/`
- API: `src/app/api/homework-videos/`
- Backend: `backend/src/homework-videos/`

---

## 📖 6. 칼럼 기능 (Columns)

### 사용자 기능
- **칼럼 읽기** (`/column`, `/column/[id]`)
  - 칼럼 목록
  - 칼럼 상세 보기
  - 조회수 카운트
  - API: `/api/column/*`

### 관리자 기능
- **칼럼 관리** (`/nimda/dashboard/columns`, `/nimda/dashboard/columns/write`)
  - 마크다운 에디터
  - 이미지 업로드
  - 카테고리 관리
  - 초안/발행 상태 관리
  - API: `/api/nimda/columns/*`, `/api/nimda/images/*`

**관련 파일:**
- Frontend: `src/app/column/`, `src/app/nimda/dashboard/columns/`
- API: `src/app/api/column/`, `src/app/api/nimda/columns/`
- Backend: `backend/src/columns/`

---

## 🏆 7. 경시대회 답안 (Competition Answers)

### 사용자 기능
- **답안 조회** (`/answers/*`)
  - `/answers/seongdae` - 성대경시 (초기/후기)
  - `/answers/kmc` - KMC
  - `/answers/premium-mex` - Premium MEX (영역별)
  - `/answers/core-more` - CORE/MORE
  - `/answers/kyodae` - 교대경시 (추정)
  - API: `/api/answers/*`

**관련 파일:**
- Frontend: `src/app/answers/`
- API: `src/app/api/answers/`
- Components: `src/components/sidebars/AnswersSidebar.tsx`

---

## 🛒 8. 스토어 기능 (Store & Shopping)

### 사용자 기능
- **상품 조회** (`/store`, `/store/exam-papers/[id]`, `/store/product/[id]`)
  - 시험지 상품 목록
  - 상품 상세 페이지
  - API: `/api/stores/*`

- **장바구니** (`/cart`, `/shopping/cart`)
  - 장바구니 추가/삭제/수량 변경
  - 장바구니 개수 표시
  - API: `/api/cart/*`

- **구매 내역** (`/shopping/purchases`, `/mypage/purchases`)
  - 구매 기록 조회
  - 구매한 상품 접근 권한 확인
  - API: `/api/purchase/*`

### 관리자 기능
- **스토어 관리** (`/nimda/dashboard/stores/exam-papers`)
  - 시험지 상품 CRUD
  - 이미지/썸네일 업로드
  - 첨부 파일 관리
  - 가격/할인가 설정
  - API: `/api/nimda/stores/*`

**관련 파일:**
- Frontend: `src/app/store/`, `src/app/cart/`, `src/app/shopping/`
- API: `src/app/api/stores/`, `src/app/api/cart/`, `src/app/api/purchase/`
- Hooks: `src/hooks/useCart.ts`, `src/hooks/useExamPapers.ts`

---

## 📊 9. 문제은행 (QBank)

### 사용자 기능
- **문제 관리** (`/qbank/*`)
  - `/qbank/register` - 문제 등록
  - `/qbank/viewer` - 문제 뷰어
  - `/qbank/extract` - 문제 추출
  - `/qbank/chapters` - 챕터 관리
  - `/qbank/shared` - 공유 문제
  - `/qbank/arithmetic-generator` - 연산 문제 생성기
  - API: `/api/qbank/*`

### 관리자 기능
- **문제 관리** (`/nimda/dashboard/problems`)
  - 문제 CRUD
  - 챕터/섹션 구조 관리
  - 책별 분류
  - 벌크 업로드 (JSON)
  - OCR 처리
  - PDF 생성 (연산 문제)
  - API: `/api/qbank/*`, `/api/nimda/arithmetic/*`

**관련 파일:**
- Frontend: `src/app/qbank/`, `src/app/nimda/dashboard/problems/`
- API: `src/app/api/qbank/`, `/api/nimda/arithmetic/*`

---

## 🎤 10. 상담 기능 (Counseling)

### 사용자 기능
- **학부모 상담 조회** (`/mypage/parent-counseling`, `/parent-counseling`)
  - 상담 기록 조회
  - API: `/api/counseling-logs/*`

### 관리자 기능
- **상담 관리** (`/nimda/dashboard/counselings`, `/nimda/dashboard/students/[id]/counselings`)
  - 오디오 상담 업로드
  - 오디오 클립 관리 및 트리밍
  - STT 처리 (음성 → 텍스트)
  - AI 요약 생성
  - 상담 트리 시각화
  - API: `/api/nimda/audio-counselings/*`, `/api/nimda/counselings/*`

**관련 파일:**
- Frontend: `src/app/parent-counseling/`, `src/app/mypage/parent-counseling/`, `src/app/nimda/dashboard/counselings/`
- API: `src/app/api/counseling-logs/`, `src/app/api/nimda/audio-counselings/`
- Components: `src/components/admin/AudioPlayer.tsx`, `src/components/admin/CropModal.tsx`, `src/components/admin/CounselingTree.tsx`
- Backend: `backend/src/audio-counseling/`, `backend/src/stt/`

---

## 👨‍🎓 11. 학생 관리 (Student Management)

### 사용자 기능
- **학생 등록/관리** (AuthContext에서 처리)
  - 학생 선택
  - API: `/api/users/students`

### 관리자 기능
- **학생 관리** (`/nimda/dashboard/students`, `/nimda/dashboard/students/[id]/*`)
  - 학생 CRUD
  - 학부모 연결/해제
  - 학생 상세 정보:
    - `/students/[id]/study` - 학습 로그
    - `/students/[id]/scores` - 성적 관리
    - `/students/[id]/exams` - 시험 기록
    - `/students/[id]/arithmetic` - 연산 기록
    - `/students/[id]/explanations` - 해설 추적
    - `/students/[id]/counselings` - 상담 관리
    - `/students/[id]/roadmap` - 학습 로드맵 편집
  - API: `/api/nimda/students/*`

**관련 파일:**
- Frontend: `src/app/nimda/dashboard/students/`
- API: `src/app/api/nimda/students/`, `/api/users/students`
- Components: `src/components/admin/StudentInfoSection.tsx`, `src/components/admin/RoadmapEditor.tsx`, `src/components/admin/ScheduleEditor.tsx`

---

## 📅 12. 수업/일정 관리 (Class & Schedule)

### 사용자 기능
- **수업 로그 조회** (`/class-log`, `/mypage/class-log`)
  - 수업 출석 기록
  - API: `/api/class-logs/*`

### 관리자 기능
- **수업 관리** (`/nimda/dashboard/classes`)
  - 수업 스케줄 관리
  - 학생 등록
  - API: `/api/classes/*`, `/api/class-logs/admin`

**관련 파일:**
- Frontend: `src/app/class-log/`, `src/app/mypage/class-log/`, `src/app/nimda/dashboard/classes/`
- API: `src/app/api/classes/`, `src/app/api/class-logs/`

---

## 🧮 13. 연산 기록 (Arithmetic Records)

### 사용자 기능
- **연산 기록 조회** (`/student-arithmetic`, `/mypage/student-arithmetic`)
  - 학생별 연산 연습 기록
  - API: `/api/arithmetic-records/*`

### 관리자 기능
- **연산 통계** (`/nimda/dashboard/students/[id]/arithmetic`)
  - 학생별 연산 통계
  - PDF 생성 (연산 문제지)
  - API: `/api/arithmetic-records/admin`, `/api/nimda/arithmetic/generate-pdf`

**관련 파일:**
- Frontend: `src/app/student-arithmetic/`, `src/app/mypage/student-arithmetic/`
- API: `src/app/api/arithmetic-records/`
- Components: `src/components/admin/PdfGenerationPanel.tsx`

---

## 🏅 14. 트로피/성취 시스템 (Trophies)

### 사용자 기능
- **트로피 조회** (`/mypage/trophies`)
  - 학생별 성취 트로피
  - (기능 구현 여부 확인 필요)

**관련 파일:**
- Frontend: `src/app/mypage/trophies/`

---

## 🎯 15. 경시대회 정보 (Contests)

### 사용자 기능
- **경시대회 일정** (`/contests`, `/contests/[id]`)
  - 경시대회 목록
  - 대회 상세 정보
  - (Homepage에 일정 표시)

**관련 파일:**
- Frontend: `src/app/contests/`
- Components: `src/components/ContestList.tsx`, `src/components/ContestCard.tsx`

---

## 🎓 16. 학부모 페이지 (Parents)

### 사용자 기능
- **학부모 자료실** (`/parents/downloads`)
  - 다운로드 자료 제공
  - (기능 확인 필요)

**관련 파일:**
- Frontend: `src/app/parents/`

---

## 🎬 17. 해설 영상 (Solution Videos)

### 사용자 기능
- **해설 영상** (`/solution-videos`)
  - 문제 해설 영상 시청
  - (Explanations와 중복 가능성 있음)

**관련 파일:**
- Frontend: `src/app/solution-videos/`

---

## 🎤 18. 코칭 (Coaching)

### 사용자 기능
- **코칭 페이지** (`/coaching`)
  - 코칭 서비스 정보
  - (기능 확인 필요)

**관련 파일:**
- Frontend: `src/app/coaching/`

---

## 👤 19. 마이페이지 공통 기능 (MyPage)

- **대시보드** (`/mypage`)
  - 사용자 개요
- **설정** (`/mypage/settings`, `/settings`)
  - 프로필 설정
  - 알림 설정
  - API: `/api/users/settings`

**관련 파일:**
- Frontend: `src/app/mypage/`, `src/app/settings/`
- Components: `src/components/MyPageSidebar.tsx`

---

## 🔐 20. 인증 시스템 (Authentication)

### 사용자 기능
- **로그인/회원가입** (`/auth/login`, `/auth/signup`, `/auth/register`)
  - Google OAuth
  - Kakao OAuth
  - API: `/api/auth/*` (백엔드 proxy)

### 관리자 기능
- **관리자 로그인** (`/nimda`)
  - 관리자 인증
  - API: `/api/nimda/auth`

**관련 파일:**
- Frontend: `src/app/auth/`, `src/app/nimda/`
- Contexts: `src/contexts/AuthContext.tsx`
- Hooks: `src/hooks/useAdminAuth.ts`
- Components: `src/components/GoogleAuthButton.tsx`, `src/components/KakaoLoginButton.tsx`

---

## 📊 기능별 복잡도 요약

### 🔴 대형 기능 (삭제 시 영향 큼)
1. **시험 시스템** - 핵심 기능, 많은 파일 연관
2. **문제은행 (QBank)** - 독립적이지만 시험과 연관
3. **학생 관리** - 모든 기능의 기반
4. **상담 기능** - STT/AI 통합, 복잡한 구조

### 🟡 중형 기능 (독립적, 삭제 가능)
5. **퀴즈 시스템** - 독립적, 관련 파일 명확
6. **해설 기능** - 시험과 약간 연관
7. **강의 기능** - 독립적
8. **칼럼 기능** - 독립적
9. **숙제 영상** - 독립적
10. **경시대회 답안** - 독립적

### 🟢 소형 기능 (독립적, 쉽게 삭제 가능)
11. **스토어/장바구니** - 독립적
12. **수업/일정 관리** - 중간 독립적
13. **연산 기록** - 독립적
14. **트로피** - 독립적, 구현 여부 확인 필요
15. **경시대회 정보** - 독립적
16. **학부모 페이지** - 독립적, 구현 여부 확인 필요
17. **해설 영상** - 해설과 중복 가능
18. **코칭** - 독립적, 구현 여부 확인 필요

---

## 🎯 삭제 추천 기능 (예시)

사용자가 언급한 기능들을 포함하여 추천:

### 삭제 쉬운 기능 (독립적):
- ✅ **Quiz** - 모노폴리 UI, 독립적 API
- ✅ **Explanations** (해설 기능) - 독립적이지만 시험 결과와 약간 연관
- ✅ **Solution Videos** - Explanations와 중복 가능
- ✅ **Homework Videos** - 독립적
- ✅ **Trophies** - 기능 미구현 가능성
- ✅ **Coaching** - 단일 페이지
- ✅ **Parents Downloads** - 단일 페이지
- ✅ **Contests** - 정보성 페이지

### 삭제 신중한 기능:
- ⚠️ **Columns** - 블로그/콘텐츠 마케팅용
- ⚠️ **Lectures** - 교육 콘텐츠 핵심
- ⚠️ **Store** - 수익 모델
- ⚠️ **QBank** - 문제 관리 핵심 도구
- ⚠️ **Counseling** - 복잡하지만 핵심 기능

---

**어떤 기능들을 제거하시겠어요? 리스트를 알려주시면 영향도 분석 후 제거 계획을 세워드리겠습니다.**
