# Anchor Moms Club Frontend - Cleanup Analysis Report

**Date:** 2024-12-14  
**Repository:** anchormoms-web  
**Total Issues Found:** 27+  
**Estimated Cleanup Time:** 30-40 hours

---

## 📊 Executive Summary

The frontend codebase is functional but has accumulated technical debt:
- **336 TypeScript/TSX files** with ~53,298 lines of code
- **2 backup files** with 3,648 lines of dead code
- **Duplicate Google auth components** causing confusion
- **164 files with console statements** for debugging
- **Large monolithic pages** (2,700+ lines) needing decomposition
- **No test infrastructure** - 0 test files found
- **Unused dependencies** flagged by depcheck

---

## 🔴 Critical Issues (Must Fix)

### 1. Backup Files Taking Up Space
**Impact:** 3,648 lines of dead code cluttering the codebase  
**Files:**
- `src/app/nimda/dashboard/quiz/stats/page.tsx.backup` (15,091 lines!)
- `src/app/nimda/dashboard/classes/page.tsx.backup` (937 lines)

**Solution:**
```bash
cd ~/anchormoms-web
rm src/app/nimda/dashboard/quiz/stats/page.tsx.backup
rm src/app/nimda/dashboard/classes/page.tsx.backup
```

### 2. Duplicate Google Authentication Components
**Impact:** Confusion, maintenance burden, 95% code duplication  
**Files:**
- `src/components/GoogleAuthButton.tsx` (55 lines)
- `src/components/GoogleLoginButton.tsx` (44 lines - nearly identical)

**Issue:** Both components do the same thing with minor differences.

**Solution:** Keep `GoogleAuthButton.tsx`, delete `GoogleLoginButton.tsx`, update imports.

### 3. Missing Dependencies (Security Risk)
**Impact:** Package.json doesn't reflect actual usage  
**Found by depcheck:**

```json
Missing dependencies:
- next-auth: used in ./src/types/next-auth.d.ts
- jsonwebtoken: used in ./src/app/api/qbank/sections/route.ts
- @google/generative-ai: used in ./src/app/api/qbank/ocr/route.ts
```

**⚠️ IMPORTANT:** These packages are being used but not in package.json!

**Note from previous security review:**
- `@google/generative-ai` was intentionally removed from frontend
- OCR functionality should be moved to backend API
- `jsonwebtoken` should NOT be in frontend

**Solution:** Either:
1. Move OCR API to backend (recommended)
2. Or add to package.json if keeping temporarily

### 4. Unused Dev Dependencies
**Impact:** Bloated node_modules  

```json
Unused devDependencies:
- @tailwindcss/postcss (but actually used in postcss.config.js)
- tailwindcss (but actually used in tailwind.config.ts)
```

**Note:** Depcheck false positive - these ARE used. Keep them.

---

## 🟠 High Priority Issues (Should Fix)

### 5. Console.log Statements Everywhere
**Impact:** Log pollution, potential data leakage  
**Status:** 164 files contain console statements

**Worst Offenders:**
- `src/components/GoogleLoginButton.tsx` - Lines 13, 16, 23, 26, 34 (5 logs)
- `src/app/nimda/dashboard/columns/write/page.tsx` - Lines 301, 303
- `src/contexts/AuthContext.tsx` - Lines 62, 112, 156 (errors)

**Solution:** Replace with proper logging or remove entirely.

### 6. TODO Comments (Incomplete Features)
**Impact:** Technical debt indicators  

**Found 2+ TODOs:**
1. `src/components/ExamReservationButton.tsx:27`
   ```typescript
   // TODO: API 호출로 test_alarm을 true로 설정
   ```

2. `src/components/ExamTakerCounter.tsx:10`
   ```typescript
   // TODO: 실제 API에서 데이터 가져오기
   ```

**Solution:** Implement or remove TODO comments.

### 7. Monolithic Page Components
**Impact:** Hard to maintain, test, understand  

**Pages exceeding 1000 lines:**
- `nimda/dashboard/exams/upload/page.tsx` - **2,711 lines** (22+ useState!)
- `nimda/dashboard/exams/page.tsx` - **2,038 lines**
- `nimda/dashboard/quiz/page.tsx` - **1,366 lines**
- `nimda/dashboard/students/page.tsx` - **1,122 lines**
- `nimda/dashboard/classes/page.tsx` - **1,029 lines**

**Solution:** Split into smaller components and custom hooks.

### 8. Excessive State Management in Pages
**Impact:** Complex components, hard to debug  

**Pages with too many useState hooks:**
- `exams/upload/page.tsx` - **22+ useState hooks**
- `mypage/settings/page.tsx` - **17 useState hooks**
- `mypage/explanations/page.tsx` - **15 useState hooks**
- `mypage/student-exams/page.tsx` - **12 useState hooks**

**Solution:** Extract to custom hooks:
- Form state → `useForm`
- Toast notifications → `useToast` context
- Modal management → `useModal` context

---

## 🟡 Medium Priority Issues (Consider)

### 9. No Test Infrastructure
**Impact:** Can't verify code changes, regression risks  
**Status:** 0 test files found in entire codebase

**Solution:**
```bash
# Add testing dependencies
npm install -D @testing-library/react @testing-library/jest-dom vitest
```

### 10. Large Component Files
**Impact:** Hard to maintain  

**Components exceeding 600 lines:**
- `admin/CropModal.tsx` - **736 lines**
- `admin/ScheduleEditor.tsx` - **644 lines**
- `admin/AudioUploadModal.tsx` - **636 lines**

**Solution:** Break into smaller sub-components.

### 11. Modal Components Need Consolidation
**Impact:** Duplicate modal patterns  

**7 different modal components:**
- LoginRequiredModal.tsx
- ExamLogoutWarningModal.tsx
- SubmitModal.tsx
- TemplateSelectionModal.tsx
- AudioUploadModal.tsx
- CropModal.tsx
- LectureModal.tsx

**Solution:** Create shared `BaseModal.tsx` component.

### 12. Commented-Out Code
**Impact:** Code clutter  

**Found in:**
- `mypage/settings/page.tsx:36` - "SettingsSection 제거"
- `mypage/settings/page.tsx:47-48` - Homework video state
- `mypage/settings/page.tsx:65-70` - Section management

**Solution:** Remove commented sections after verification.

---

## 🟢 Low Priority Issues (Nice to Have)

### 13. Inconsistent Hook Imports
**Impact:** Minor code style issue  

**Patterns found:**
- `import { useState } from 'react'`
- `import { useState, useEffect } from 'react'`
- Various hook ordering

**Solution:** Standardize import style.

### 14. Missing JSDoc Comments
**Impact:** Poor component documentation  

**Solution:** Add JSDoc to reusable components.

---

## 📋 Cleanup Action Plan

### Phase 1: Quick Wins (2-3 hours)
✅ Safe and quick fixes:

1. **Delete backup files**
   ```bash
   cd ~/anchormoms-web
   rm src/app/nimda/dashboard/quiz/stats/page.tsx.backup
   rm src/app/nimda/dashboard/classes/page.tsx.backup
   ```

2. **Remove duplicate Google auth component**
   ```bash
   # Find which files import GoogleLoginButton
   grep -r "GoogleLoginButton" src/
   # Update imports to use GoogleAuthButton
   # Then delete GoogleLoginButton.tsx
   rm src/components/GoogleLoginButton.tsx
   ```

3. **Clean up console.log in GoogleAuthButton**
   - Remove lines 13, 16, 23, 26, 34 from GoogleLoginButton.tsx

4. **Git commit**
   ```bash
   git add -A
   git commit -m "chore: frontend Phase 1 cleanup"
   git push
   ```

### Phase 2: Code Quality (10-15 hours)
Items requiring code changes:

1. Move OCR API to backend (remove from frontend)
2. Remove console.log statements from 164 files
3. Implement TODO features or remove comments
4. Extract reusable BaseModal component
5. Create useToast and useModal hooks

### Phase 3: Refactoring (15-20 hours)
Major restructuring:

1. Split 2,700-line exam upload page into smaller components
2. Extract custom hooks from pages with 15+ useState
3. Break down 700+ line modals
4. Create shared form components
5. Improve component organization

### Phase 4: Testing (8-10 hours)
1. Setup Vitest/Jest infrastructure
2. Add tests for critical components
3. Add tests for custom hooks
4. Setup E2E testing with Playwright

---

## 🎯 Recommended Next Steps

**Immediate (Do Now):**
1. Run Phase 1 cleanup (backup files, duplicates)
2. Remove console.log statements from auth components
3. Address missing dependencies issue (move OCR to backend)

**This Week:**
1. Extract modal components to BaseModal
2. Create useToast and useModal hooks
3. Start splitting largest pages

**This Month:**
1. Add test infrastructure
2. Refactor pages with 15+ useState hooks
3. Break down monolithic components
4. Write tests for critical paths

**Long Term:**
1. Achieve 80%+ test coverage
2. Add Storybook for component documentation
3. Setup automated code quality checks
4. Implement design system

---

## 📊 Metrics

**Current State:**
- Total Files: 336 TSX/TS files
- Lines of Code: ~53,298
- Backup Files: 2 (3,648 dead lines)
- Test Files: 0
- Console.log: 164 files
- Pages > 1000 lines: 5
- Tech Debt Score: Medium-High

**After Cleanup:**
- Reduced dead code: -3,648 lines
- Better component organization
- Test infrastructure in place
- Improved maintainability
- Professional production code

---

## ✅ Conclusion

The frontend codebase is functional but needs cleanup to be production-ready. Most issues are organizational. Prioritize:

1. **Code Cleanup** - Remove dead code and duplicates
2. **Security** - Move backend functionality out of frontend
3. **Maintainability** - Split large components
4. **Testing** - Add test infrastructure

**Total Estimated Effort:** 30-40 hours over 3-4 weeks

Ready to start Phase 1 cleanup?
