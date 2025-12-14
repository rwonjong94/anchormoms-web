# 기능 제거 계획 - 6개 기능

제거 대상: **Quiz, Explanations, Solution Videos, Homework Videos, Trophies, Coaching**

---

## 📊 영향도 분석 요약

| 기능 | Frontend 파일 | API 라우트 | Backend | DB 모델 | 복잡도 |
|------|--------------|-----------|---------|---------|--------|
| Quiz | 6개 | 11개 | 3개 | 6개 | 🔴 High |
| Explanations | 5개 | 2개 | 0개 | 0개 | 🟡 Medium |
| Solution Videos | 1개 | 0개 | 0개 | 0개 | 🟢 Low |
| Homework Videos | 2개 | 4개 | 3개 | 1개 | 🟡 Medium |
| Trophies | 1개 | 0개 | 0개 | 0개 | 🟢 Low |
| Coaching | 1개 | 0개 | 0개 | 0개 | 🟢 Low |
| **총합** | **16개** | **17개** | **6개** | **7개** | - |

---

## 🎯 1. Quiz (퀴즈 시스템)

### Frontend 파일 (6개)
```
src/app/quiz/page.tsx (547 lines)
src/app/nimda/dashboard/quiz/page.tsx
src/app/nimda/dashboard/quiz/stats/page.tsx
src/components/quiz/MonopolyBoard.tsx
src/components/sidebars/QuizSidebar.tsx
```

### API 라우트 (11개)
```
src/app/api/quiz/attempt/route.ts
src/app/api/quiz/progress/route.ts
src/app/api/quiz/questions/[type]/route.ts
src/app/api/quiz/questions/route.ts
src/app/api/quiz/sets/[setId]/route.ts
src/app/api/quiz/sets/[setId]/start/route.ts
src/app/api/quiz/sets/available/route.ts
src/app/api/quiz/sets/route.ts
src/app/api/quiz/types/[id]/route.ts
src/app/api/quiz/types/route.ts
```

### Backend 파일 (3개)
```
backend/src/quiz/quiz.controller.ts
backend/src/quiz/quiz.service.ts
backend/src/quiz/quiz.module.ts
```

### Database 모델 (6개)
```prisma
model QuizQuestion
model QuizAttempt
model QuizSet
model QuizSetItem
model QuizSetSession
model QuizType
```

### 참조하는 파일
- `src/components/admin/AdminLayout.tsx:30` - Admin tab navigation
- `src/hooks/usePageAccess.ts` - Page access control

### 제거 단계
1. Frontend 페이지 및 컴포넌트 삭제
2. API 라우트 삭제
3. Backend 모듈 삭제
4. Database migration (모델 제거)
5. Admin 네비게이션에서 제거
6. PageAccess 설정에서 제거

---

## 📚 2. Explanations (해설 기능)

### Frontend 파일 (5개)
```
src/app/explanations/page.tsx (5 lines - redirect only)
src/app/explanation/[id]/video/page.tsx
src/app/explanation/[id]/document/page.tsx
src/app/mypage/explanations/page.tsx
src/app/nimda/dashboard/explanations/page.tsx
src/app/nimda/dashboard/explanations/loading.tsx
src/app/nimda/dashboard/students/[id]/explanations/page.tsx
```

### API 라우트 (2개)
```
src/app/api/explanations/admin/route.ts
src/app/api/explanations/route.ts (추정)
```

### Backend 파일
- 없음 (별도 모듈 없음, 다른 서비스에 통합되어 있을 가능성)

### Database 모델
- 없음 (Explanation 전용 모델 없음)

### 참조하는 파일
- `src/components/MyPageSidebar.tsx:34` - "학생 설명 영상" 메뉴
- `src/components/sidebars/ExamSidebar.tsx:13` - "/explanation" 링크
- `src/components/admin/AdminLayout.tsx:24, 116` - Admin tab
- `src/components/admin/StudentInfoSection.tsx:87` - Student detail tab
- `src/components/PageAccessController.tsx:33` - Page access

### 제거 단계
1. Frontend 페이지 삭제
2. API 라우트 삭제
3. Sidebar/Navigation에서 제거
4. Admin layout에서 탭 제거
5. PageAccess 설정에서 제거

---

## 🎬 3. Solution Videos (해설 영상)

### Frontend 파일 (1개)
```
src/app/solution-videos/page.tsx
```

### API 라우트
- 없음

### Backend 파일
- 없음

### Database 모델
- 없음

### 참조하는 파일
- `src/components/sidebars/ExamSidebar.tsx:16` - "문제풀이 강의" 링크

### 제거 단계
1. Frontend 페이지 삭제
2. ExamSidebar에서 링크 제거

---

## 🎥 4. Homework Videos (숙제 영상)

### Frontend 파일 (2개)
```
src/app/homework-videos/page.tsx (436 lines)
```

### API 라우트 (4개)
```
src/app/api/homework-videos/route.ts
src/app/api/homework-videos/[id]/route.ts
src/app/api/homework-videos/admin/route.ts
```

### Backend 파일 (3개)
```
backend/src/homework-videos/homework-videos.controller.ts
backend/src/homework-videos/homework-videos.service.ts
backend/src/homework-videos/homework-videos.module.ts
```

### Database 모델 (1개)
```prisma
model HomeworkVideo {
  id        String   @id @default(cuid())
  title     String
  videoUrl  String
  studentId String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  Student   Student  @relation(fields: [studentId], references: [id])
}
```

### 참조하는 파일
- (Navigation이나 다른 곳에서 직접 참조 없음, 독립적)

### 제거 단계
1. Frontend 페이지 삭제
2. API 라우트 삭제
3. Backend 모듈 삭제
4. Database migration (HomeworkVideo 모델 제거)

---

## 🏅 5. Trophies (트로피)

### Frontend 파일 (1개)
```
src/app/mypage/trophies/page.tsx
```

### API 라우트
- 없음

### Backend 파일
- 없음

### Database 모델
- 없음 (기능 미구현)

### 참조하는 파일
- `src/components/MyPageSidebar.tsx:39` - "트로피 진열장" 메뉴

### 제거 단계
1. Frontend 페이지 삭제
2. MyPageSidebar에서 메뉴 제거

---

## 🎓 6. Coaching (코칭)

### Frontend 파일 (1개)
```
src/app/coaching/page.tsx (186 lines)
```

### API 라우트
- 없음

### Backend 파일
- 없음

### Database 모델
- 없음

### 참조하는 파일
- `src/components/Footer.tsx:27` - Footer 링크
- `src/components/PageAccessController.tsx:31` - Page access control

### 제거 단계
1. Frontend 페이지 삭제
2. Footer에서 링크 제거
3. PageAccess 설정에서 제거

---

## 🔄 제거 순서 (위험도 낮은 순)

### Phase 1: 독립적 기능 (Backend 없음)
1. ✅ **Trophies** - 가장 단순 (1개 파일)
2. ✅ **Coaching** - 단순 (1개 파일 + Footer 수정)
3. ✅ **Solution Videos** - 단순 (1개 파일 + Sidebar 수정)

### Phase 2: Backend 있지만 DB 없음
4. ✅ **Explanations** - 중간 (Frontend 많지만 DB 없음)

### Phase 3: Backend + DB 있음
5. ⚠️ **Homework Videos** - Backend + DB 있음
6. ⚠️ **Quiz** - 가장 복잡 (Backend + DB + 많은 파일)

---

## ⚠️ 주의사항

### Database Migration 필요
Quiz와 Homework Videos는 데이터베이스 모델이 있으므로:
1. **프로덕션 데이터 백업** 필요
2. Prisma migration 작성
3. Foreign key 제약 확인
4. 관련 데이터 손실 확인

### Student 모델 관계
```prisma
model Student {
  // ...
  HomeworkVideo     HomeworkVideo[]      # 제거 필요
  QuizSetSession    QuizSetSession[]     # 제거 필요
  // ...
}
```

### Backend app.module.ts 수정
제거할 모듈:
```typescript
// backend/src/app.module.ts
imports: [
  QuizModule,            // 제거
  HomeworkVideosModule,  // 제거
]
```

---

## 📈 예상 제거 파일 수

### Frontend
- **페이지**: 16개
- **API 라우트**: 17개
- **컴포넌트**: 2개 (MonopolyBoard, QuizSidebar)
- **수정 파일**: 7개 (Navigation, Sidebars, Admin layout 등)

### Backend
- **모듈**: 2개 (quiz, homework-videos)
- **파일**: 6개 (controllers, services, modules)
- **수정 파일**: 1개 (app.module.ts)

### Database
- **모델**: 7개 (Quiz 관련 6개, HomeworkVideo 1개)
- **Migration**: 1개 필요

### 총 예상 제거 라인 수
- Frontend: ~2,000+ lines
- Backend: ~500+ lines
- **총: 2,500+ lines**

---

## ✅ 실행 계획

### Step 1: Frontend Phase 1 (독립적 기능)
```bash
# Trophies
rm -rf src/app/mypage/trophies
# MyPageSidebar.tsx 수정

# Coaching
rm -rf src/app/coaching
# Footer.tsx, PageAccessController.tsx 수정

# Solution Videos
rm -rf src/app/solution-videos
# ExamSidebar.tsx 수정
```

### Step 2: Frontend Phase 2 (Explanations)
```bash
rm -rf src/app/explanations
rm -rf src/app/explanation
rm -rf src/app/mypage/explanations
rm -rf src/app/nimda/dashboard/explanations
rm -rf src/app/nimda/dashboard/students/[id]/explanations
rm -rf src/app/api/explanations
# AdminLayout.tsx, MyPageSidebar.tsx, StudentInfoSection.tsx, ExamSidebar.tsx 수정
```

### Step 3: Frontend + Backend (Homework Videos)
```bash
# Frontend
rm -rf src/app/homework-videos
rm -rf src/app/api/homework-videos

# Backend
rm -rf backend/src/homework-videos
# backend/src/app.module.ts 수정

# Database
# prisma/schema.prisma에서 HomeworkVideo 모델 제거
# Student 모델에서 HomeworkVideo[] 관계 제거
# npx prisma migrate dev --name remove-homework-videos
```

### Step 4: Frontend + Backend (Quiz)
```bash
# Frontend
rm -rf src/app/quiz
rm -rf src/app/nimda/dashboard/quiz
rm -rf src/app/api/quiz
rm -rf src/components/quiz
rm src/components/sidebars/QuizSidebar.tsx
# AdminLayout.tsx, usePageAccess.ts 수정

# Backend
rm -rf backend/src/quiz
# backend/src/app.module.ts 수정

# Database
# prisma/schema.prisma에서 Quiz 관련 6개 모델 제거
# Student 모델에서 QuizSetSession[] 관계 제거
# npx prisma migrate dev --name remove-quiz-system
```

---

**준비되었습니다! 단계별로 진행하시겠어요?**
