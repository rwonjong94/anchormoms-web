'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import AdminLayout from '@/components/admin/AdminLayout';

interface ExamData {
  id: string;
  type: string;
  examnum: number;
  grade: number;
  duration: number;
  questionCount: number;
  attemptCount: number;
  correctRate: number;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  status?: string;
  targetQuestions?: number;
  currentQuestions?: number;
  completedQuestions?: number;
  progressPercentage?: number;
  activatedAt?: string | null;
  number?: number | null;
  title?: string | null;
  course?: string | null;
  simpleDifficulty?: number | null;
  hallOfFame?: { name: string; score: number }[];
  answerKey?: Record<string, any>;
}

interface ExamListResponse {
  exams: ExamData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filterOptions?: {
    examnum: number[];
    duration: number[];
    questionCount: number[];
  };
}

interface FilterConfig {
  column: string;
  enabled: boolean;
  sortOrder: 'asc' | 'desc';
  filterValue: string;
  filterOperator?: 'gte' | 'lte'; // 정답률 필터용
}

interface PopupPosition {
  x: number;
  y: number;
}

interface ColumnWidths {
  [key: string]: number;
}

interface ManualScoreRow {
  id: string;
  studentId: string;
  classId?: string | null;
  score: number;
  takenAt: string;
  memo?: string | null;
  student?: { id: string; name: string };
  exam: { id: string; course?: string | null; title?: string | null; examnum?: number | null; type?: string | null; grade?: number | null; duration?: number | null };
}

interface ClassLecture {
  id: string;
  name: string;
  students: { id: string; name: string }[];
}

export default function ExamManagementPage() {
  const { requireAuth } = useAdminAuth();
  const router = useRouter();
  const [exams, setExams] = useState<ExamData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [extraSearch, setExtraSearch] = useState<{ examNumber: string; course: string; name: string }>({ examNumber: '', course: '', name: '' });
  const [filterOptions, setFilterOptions] = useState<{
    examnum: number[];
    duration: number[];
    questionCount: number[];
  }>({
    examnum: [],
    duration: [],
    questionCount: []
  });
  
  // 필터링 설정
  const [filters, setFilters] = useState<Record<string, FilterConfig>>({});
  const [activeFilters, setActiveFilters] = useState<Record<string, FilterConfig>>({});
  
  // 팝업 상태
  const [popupConfig, setPopupConfig] = useState<{
    isOpen: boolean;
    column: string;
    position: PopupPosition;
  }>({
    isOpen: false,
    column: '',
    position: { x: 0, y: 0 }
  });

  // 컬럼 크기 상태
  const [columnWidths, setColumnWidths] = useState<ColumnWidths>({
    number: 80,
    course: 100,
    title: 220,
    questionCount: 100,
    attemptCount: 100,
    correctRate: 110,
    actions: 120,
  });

  const [isResizing, setIsResizing] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState<{ open: boolean; exam?: ExamData }>({ open: false });
  
  // activatedAt 편집 상태
  const [editingActivatedAt, setEditingActivatedAt] = useState<string | null>(null);
  const [tempActivatedAt, setTempActivatedAt] = useState<string>('');

  // 상태 변경 팝업 상태
  const [statusPopup, setStatusPopup] = useState<{
    isOpen: boolean;
    examId: string;
    currentStatus: boolean;
    position: PopupPosition;
  }>({
    isOpen: false,
    examId: '',
    currentStatus: false,
    position: { x: 0, y: 0 }
  });

  // 삭제 확인 팝업 상태
  const [deletePopup, setDeletePopup] = useState<{
    isOpen: boolean;
    examId: string;
    examInfo: string;
  }>({
    isOpen: false,
    examId: '',
    examInfo: ''
  });
  
  // 페이지네이션 상태
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  // 확장/점수 표시 관련 상태
  const [expandedExamId, setExpandedExamId] = useState<string | null>(null);
  const [scoresByExamId, setScoresByExamId] = useState<Record<string, ManualScoreRow[]>>({});
  const [classes, setClasses] = useState<ClassLecture[]>([]);
  const [scoresLoading, setScoresLoading] = useState<Record<string, boolean>>({});
  const [addOpen, setAddOpen] = useState<{ open: boolean; exam?: ExamData }>({ open: false });
  const [addClassId, setAddClassId] = useState<string>('');
  const [addDate, setAddDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [addMemo, setAddMemo] = useState<string>('');
  const [addScores, setAddScores] = useState<Record<string, string>>({});
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [selectedExamMeta, setSelectedExamMeta] = useState<Partial<ExamData> | null>(null);

  // 컬럼 정의
  const columns = [
    { key: 'number', label: '번호', sortable: true, filterable: false },
    { key: 'course', label: '과정', sortable: false, filterable: false },
    { key: 'title', label: '시험 이름', sortable: false, filterable: false },
    { key: 'questionCount', label: '문제 수', sortable: true, filterable: true },
    { key: 'attemptCount', label: '응시자 수', sortable: true, filterable: false },
    { key: 'correctRate', label: '평균 점수', sortable: true, filterable: true },
    { key: 'actions', label: '관리', sortable: false, filterable: false },
  ];

  useEffect(() => {
    requireAuth();
  }, [requireAuth]);

  useEffect(() => {
    fetchExams();
  }, [activeFilters, pagination.page]);

  // 클릭 외부 영역 마우스 이벤트 처리
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusPopup.isOpen) {
        const target = event.target as Element;
        // 팝업 내부 클릭인지 확인
        if (!target.closest('.status-popup')) {
          setStatusPopup(prev => ({ ...prev, isOpen: false }));
        }
      }
    };

    if (statusPopup.isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [statusPopup.isOpen]);

  const fetchExams = async () => {
    try {
      setLoading(true);
      setError(''); // 에러 초기화
      const token = localStorage.getItem('adminToken');
      console.log('Fetching exams with token:', token ? 'Present' : 'Missing');
      
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      // 활성화된 필터 적용
      Object.values(activeFilters).forEach(filter => {
        params.append('sortBy', filter.column);
        params.append('sortOrder', filter.sortOrder);
        
        if (filter.filterValue) {
          if (filter.column === 'type') {
            params.append('type', filter.filterValue);
          } else if (filter.column === 'grade') {
            params.append('grade', filter.filterValue);
          } else if (filter.column === 'examnum') {
            params.append('examnum', filter.filterValue);
          } else if (filter.column === 'duration') {
            params.append('duration', filter.filterValue);
          } else if (filter.column === 'questionCount') {
            params.append('questionCount', filter.filterValue);
          } else if (filter.column === 'status') {
            params.append('status', filter.filterValue);
          } else if (filter.column === 'correctRate') {
            params.append('correctRate', filter.filterValue);
            if (filter.filterOperator) {
              params.append('correctRateOperator', filter.filterOperator);
            }
          } else {
            params.append('search', filter.filterValue);
          }
        }
      });
      // 추가 검색 파라미터
      if (extraSearch.examNumber) params.append('examNumber', extraSearch.examNumber);
      if (extraSearch.course) params.append('course', extraSearch.course);
      if (extraSearch.name) params.append('name', extraSearch.name);

      const response = await fetch(`/api/nimda/exams?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: '서버 오류가 발생했습니다.' }));
        throw new Error(errorData.error || '시험 목록을 불러오는데 실패했습니다.');
      }

      const data: ExamListResponse = await response.json();
      setExams(data.exams || []);
      setPagination(prev => ({ ...prev, ...data.pagination }));
      
      // 필터 옵션 업데이트
      if (data.filterOptions) {
        setFilterOptions(data.filterOptions);
      }
    } catch (err) {
      console.error('Exam fetch error:', err);
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
      // 에러 발생 시에도 빈 배열로 설정하여 테이블 구조 유지
      setExams([]);
    } finally {
      setLoading(false);
    }
  };

  const handleColumnClick = (column: string, event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setPopupConfig({
      isOpen: true,
      column,
      position: {
        x: rect.left,
        y: rect.bottom + 5
      }
    });
    
    // 기존 필터 설정 가져오기
    if (!filters[column]) {
      setFilters(prev => ({
        ...prev,
        [column]: {
          column,
          enabled: false,
          sortOrder: 'desc',
          filterValue: '',
          filterOperator: 'gte'
        }
      }));
    }
  };

  const handleFilterApply = () => {
    const currentFilter = filters[popupConfig.column];
    if (currentFilter) {
      setActiveFilters(prev => ({
        ...prev,
        [popupConfig.column]: { ...currentFilter, enabled: true }
      }));
    }
    setPagination(prev => ({ ...prev, page: 1 }));
    setPopupConfig(prev => ({ ...prev, isOpen: false }));
  };

  const handleFilterReset = () => {
    setFilters(prev => ({
      ...prev,
      [popupConfig.column]: {
        column: popupConfig.column,
        enabled: false,
        sortOrder: 'desc',
        filterValue: '',
        filterOperator: 'gte'
      }
    }));
    setActiveFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[popupConfig.column];
      return newFilters;
    });
    setPagination(prev => ({ ...prev, page: 1 }));
    setPopupConfig(prev => ({ ...prev, isOpen: false }));
  };

  const handleAllFiltersReset = () => {
    setFilters({});
    setActiveFilters({});
    setPagination(prev => ({ ...prev, page: 1 }));
    setError(''); // 에러도 초기화
    // 검색 입력도 초기화하여 학생 관리 페이지와 동작 일치
    setExtraSearch({ examNumber: '', course: '', name: '' });
  };

  const handleRefresh = () => {
    fetchExams();
  };

  const handleFilterChange = (key: string, value: string | number | boolean) => {
    setFilters(prev => ({
      ...prev,
      [popupConfig.column]: {
        ...prev[popupConfig.column],
        [key]: value
      }
    }));
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  // 상태 변경 핸들러
  const handleStatusClick = (examId: string, currentStatus: boolean, event: React.MouseEvent) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    const popupHeight = 88; // 팝업 높이 (p-3 + 2개 버튼 + space-y-2)
    const buttonCenterY = rect.top + rect.height / 2;
    const popupCenterY = popupHeight / 2;
    
    setStatusPopup({
      isOpen: true,
      examId,
      currentStatus,
      position: {
        x: rect.right + 10, // 버튼 오른쪽에 팝업 표시
        y: buttonCenterY - popupCenterY // 버튼 중심과 팝업 중심을 맞춤
      }
    });
  };

  const handleStatusChange = async (examId: string, newStatus: boolean) => {
    console.log('Status change requested:', { examId, newStatus });
    try {
      const token = localStorage.getItem('adminToken');
      console.log('Admin token:', token ? 'Found' : 'Not found');
      
      const response = await fetch(`/api/nimda/exams/${examId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: newStatus })
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: '상태 변경에 실패했습니다.' }));
        console.error('API Error:', errorData);
        throw new Error(errorData.error || '상태 변경에 실패했습니다.');
      }

      const result = await response.json();
      console.log('API Success result:', result);

      // 로컬 상태 즉시 업데이트 (빠른 UI 반응)
      setExams(prevExams => {
        const updatedExams = prevExams.map(exam => 
          exam.id === examId 
            ? { ...exam, isActive: newStatus, updatedAt: new Date().toISOString() }
            : exam
        );
        console.log('Local state updated:', updatedExams.find(e => e.id === examId));
        return updatedExams;
      });

      // 팝업 닫기
      setStatusPopup(prev => ({ ...prev, isOpen: false }));

      // 백그라운드에서 전체 데이터 새로고침 (데이터 일관성 보장)
      setTimeout(() => {
        console.log('Refreshing exam list...');
        fetchExams();
      }, 500);
    } catch (error) {
      console.error('Status change error:', error);
    }
  };

  // 삭제 확인 팝업 열기
  const handleDeleteClick = (examId: string, exam: ExamData) => {
    const examInfo = `${getTypeDisplayName(exam.type)} ${exam.examnum}회차 (${exam.grade}학년)`;
    setDeletePopup({
      isOpen: true,
      examId,
      examInfo
    });
  };

  // 시험 삭제
  const handleDeleteExam = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/nimda/exams/${deletePopup.examId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: '시험 삭제에 실패했습니다.' }));
        throw new Error(errorData.error || '시험 삭제에 실패했습니다.');
      }

      // 로컬 상태에서 삭제된 시험 제거
      setExams(prevExams => prevExams.filter(exam => exam.id !== deletePopup.examId));
      
      // 팝업 닫기
      setDeletePopup({ isOpen: false, examId: '', examInfo: '' });
      
      // 전체 데이터 새로고침
      setTimeout(() => {
        fetchExams();
      }, 500);
    } catch (error) {
      console.error('Exam deletion error:', error);
    }
  };

  // activatedAt 편집 시작
  const handleActivatedAtClick = (examId: string, currentActivatedAt?: string | null) => {
    setEditingActivatedAt(examId);
    // datetime-local 형식으로 변환 (YYYY-MM-DDTHH:mm)
    if (currentActivatedAt) {
      const date = new Date(currentActivatedAt);
      const formatted = date.toISOString().slice(0, 16);
      setTempActivatedAt(formatted);
    } else {
      setTempActivatedAt('');
    }
  };

  // activatedAt 편집 취소
  const handleActivatedAtCancel = () => {
    setEditingActivatedAt(null);
    setTempActivatedAt('');
  };

  // activatedAt 저장
  const handleActivatedAtSave = async (examId: string) => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        console.error('관리자 토큰이 없습니다. 다시 로그인해주세요.');
        return;
      }

      const activatedAtValue = tempActivatedAt ? new Date(tempActivatedAt).toISOString() : null;

      const response = await fetch(`/api/nimda/exams/${examId}/activated-at`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          activatedAt: activatedAtValue
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: '시험 시작 시간 변경에 실패했습니다.' }));
        throw new Error(errorData.error || '시험 시작 시간 변경에 실패했습니다.');
      }

      // 로컬 상태 업데이트
      setExams(prevExams => 
        prevExams.map(exam => 
          exam.id === examId 
            ? { ...exam, activatedAt: activatedAtValue } 
            : exam
        )
      );

      setEditingActivatedAt(null);
      setTempActivatedAt('');
    } catch (error) {
      console.error('Activated at update error:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeDisplayName = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'FULL': '전체',
      'HALF': '하프',
      'BEGINNER': '비기너'
    };
    return typeMap[type] || type;
  };

  const getCellValue = (exprimo: ExamData, column: string): string => {
    switch (column) {
      case 'type':
        return getTypeDisplayName(exprimo.type);
      case 'examnum':
        return String(exprimo.examnum);
      case 'grade':
        return `${exprimo.grade}학년`;
      case 'duration':
        return String(exprimo.duration);
      case 'questionCount': {
        const ak = exprimo.answerKey as Record<string, any> | undefined;
        if (ak && typeof ak === 'object') {
          const answered = Object.values(ak).filter(v => v !== null && v !== undefined && String(v).trim() !== '').length;
          return String(answered);
        }
        const fallback = typeof exprimo.completedQuestions === 'number' ? exprimo.completedQuestions : (exprimo.questionCount ?? 0);
        return String(fallback);
      }
      case 'attemptCount':
        return `${exprimo.attemptCount}`;
      case 'correct':
      case 'correctRate':
        return Number.isFinite(exprimo.correctRate) ? exprimo.correctRate.toFixed(2) : '0.00';
      default:
        return '';
    }
  };

  // 사용되지 않는 함수들 제거됨

  // 상태 표시 관련 함수들
  const getStatusDisplay = (isActive: boolean) => {
    return isActive ? '게시중' : '비공개';
  };

  const getActiveStatusStyle = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
      : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300';
  };


  // 컬럼 크기 조정 핸들러
  const handleMouseDown = (columnKey: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(columnKey);

    const startX = e.clientX;
    const startWidth = columnWidths[columnKey];

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      const newWidth = Math.max(60, startWidth + deltaX);
      setColumnWidths(prev => ({
        ...prev,
        [columnKey]: newWidth
      }));
    };

    const handleMouseUp = () => {
      setIsResizing(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const getFilterOptions = (column: string) => {
    if (column === 'type') {
      return [
        { value: '', label: '전체' },
        { value: 'FULL', label: '전체' },
        { value: 'HALF', label: '하프' },
        { value: 'BEGINNER', label: '비기너' }
      ];
    }
    if (column === 'grade') {
      return [
        { value: '', label: '전체' },
        { value: '1', label: '1학년' },
        { value: '2', label: '2학년' },
        { value: '3', label: '3학년' },
        { value: '4', label: '4학년' },
        { value: '5', label: '5학년' },
        { value: '6', label: '6학년' }
      ];
    }
    if (column === 'isActive') {
      return [
        { value: '', label: '전체' },
        { value: 'true', label: '게시중' },
        { value: 'false', label: '비공개' }
      ];
    }
    if (column === 'examnum') {
      // API에서 가져온 필터 옵션 사용, 없으면 빈 배열 사용
      if (filterOptions.examnum.length === 0) {
        return [{ value: '', label: '전체' }];
      }
      return [
        { value: '', label: '전체' },
        ...filterOptions.examnum.map(num => ({ value: num.toString(), label: `${num}회차` }))
      ];
    }
    if (column === 'duration') {
      // API에서 가져온 필터 옵션 사용, 없으면 빈 배열 사용
      if (filterOptions.duration.length === 0) {
        return [{ value: '', label: '전체' }];
      }
      return [
        { value: '', label: '전체' },
        ...filterOptions.duration.map(duration => ({ value: duration.toString(), label: `${duration}분` }))
      ];
    }
    if (column === 'questionCount') {
      // API에서 가져온 필터 옵션 사용, 없으면 빈 배열 사용
      if (filterOptions.questionCount.length === 0) {
        return [{ value: '', label: '전체' }];
      }
      return [
        { value: '', label: '전체' },
        ...filterOptions.questionCount.map(count => ({ value: count.toString(), label: `${count}문제` }))
      ];
    }
    return [];
  };

  const fetchClasses = async () => {
    try {
      const token = localStorage.getItem('adminToken') || '';
      const resp = await fetch('/api/classes', { headers: { 'Authorization': `Bearer ${token}` } });
      if (!resp.ok) {
        setClasses([]);
        return;
      }
      const data = await resp.json();
      const normalized: ClassLecture[] = (Array.isArray(data) ? data : []).map((c: any) => ({
        id: c.id,
        name: c.name,
        students: (c.students || c.Student || []).map((s: any) => ({ id: s.id, name: s.name })),
      }));
      setClasses(normalized);
    } catch {
      setClasses([]);
    }
  };

  const fetchManualScoresForExam = async (examId: string) => {
    try {
      setScoresLoading(prev => ({ ...prev, [examId]: true }));
      const token = localStorage.getItem('adminToken') || '';
      const resp = await fetch(`/api/nimda/scores/exams/${examId}/manual`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const json = resp.ok ? await resp.json() : [];
      setScoresByExamId(prev => ({ ...prev, [examId]: Array.isArray(json) ? json : [] }));
    } catch {
      setScoresByExamId(prev => ({ ...prev, [examId]: [] }));
    } finally {
      setScoresLoading(prev => ({ ...prev, [examId]: false }));
    }
  };

  const toggleExpand = async (exam: ExamData) => {
    const willOpen = expandedExamId !== exam.id;
    setExpandedExamId(willOpen ? exam.id : null);
    if (willOpen) {
      if (classes.length === 0) await fetchClasses();
      if (!scoresByExamId[exam.id]) {
        await fetchManualScoresForExam(exam.id);
      }
    }
  };

  const addScoresForExam = async (exam: ExamData) => {
    try {
      const token = localStorage.getItem('adminToken') || '';
      if (!token) return;
      if (!addClassId) {
        alert('반을 선택하세요.');
        return;
      }
      const studentsInClass = classes.find(c => c.id === addClassId)?.students || [];
      const entries = studentsInClass
        .map(st => ({ studentId: st.id, scoreStr: (addScores[st.id] ?? '').trim() }))
        .filter(x => x.scoreStr !== '')
        .map(x => ({ studentId: x.studentId, score: Number(x.scoreStr) }))
        .filter(x => !Number.isNaN(x.score));
      if (entries.length === 0) {
        alert('입력된 점수가 없습니다.');
        return;
      }
      let memoToSend = addMemo || '';
      if (!/\[exam:/.test(memoToSend)) {
        const tag = `[exam:${exam.id}${exam.title ? `:${exam.title}` : ''}]`;
        memoToSend = memoToSend ? `${memoToSend} ${tag}` : tag;
      }
      if (exam.course && !/\[course:/.test(memoToSend)) {
        memoToSend = memoToSend ? `${memoToSend} [course:${exam.course}]` : `[course:${exam.course}]`;
      }
      const resp = await fetch('/api/nimda/scores/bulk', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          examId: exam.id,
          classId: addClassId || undefined,
          examType: exam.type,
          grade: exam.grade,
          takenAt: addDate ? `${addDate}T00:00:00` : undefined,
          memo: memoToSend || undefined,
          entries,
        }),
      });
      if (!resp.ok) {
        const txt = await resp.text().catch(() => '');
        alert(`저장 실패 (status ${resp.status})\n${txt?.slice(0, 500)}`);
        return;
      }
      setAddOpen({ open: false });
      setAddClassId('');
      setAddScores({});
      setSelectedExamId('');
      setSelectedExamMeta(null);
      // 저장 후 점수 재조회
      await fetchManualScoresForExam(exam.id);
      // 목록 갱신(시험 정보 갱신)
      await fetchExams();
    } catch (e:any) {
      alert(e?.message || '저장 중 오류가 발생했습니다.');
    }
  };
  
  const fetchExamMetaById = async (examId: string) => {
    try {
      const token = localStorage.getItem('adminToken') || '';
      if (!token || !examId) return;
      const resp = await fetch(`/api/nimda/exams/${examId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!resp.ok) {
        setSelectedExamMeta(null);
        return;
      }
      const data = await resp.json();
      setSelectedExamMeta(data);
    } catch {
      setSelectedExamMeta(null);
    }
  };

  if (loading && exams.length === 0) {
    return (
      <AdminLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400 mx-auto mb-4"></div>
            <p className="text-body">시험 목록을 불러오는 중...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 상단 헤더 (학생 관리 페이지와 통일) */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="sr-only">시험 관리</h1>
          <div className="flex items-center gap-3" />
        </div>

        {/* 간편 생성 (학생 페이지의 '간편 추가' 섹션과 유사 배치) */}
        <div className="mb-6">
          <CreateSimpleExamControls onClickAddScore={() => {
            setAddOpen({ open: true });
            setAddClassId('');
            setAddScores({});
            setAddDate(new Date().toISOString().slice(0,10));
            setAddMemo('');
            if (classes.length === 0) fetchClasses();
          }} />
        </div>

        {/* 필터 및 검색 (학생 관리 페이지와 유사한 카드 구조) */}
        <div className="bg-card rounded-lg border border-default p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-sm text-muted mb-1">시험 번호</label>
              <input
                type="number"
                value={extraSearch.examNumber}
                onChange={(e)=>setExtraSearch(prev=>({...prev, examNumber: e.target.value }))}
                placeholder="예: 12"
                className="w-full px-3 py-2 border border-default rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-card text-title"
              />
            </div>
            <div>
              <label className="block text-sm text-muted mb-1">과정</label>
              <input
                value={extraSearch.course}
                onChange={(e)=>setExtraSearch(prev=>({...prev, course: e.target.value }))}
                placeholder="예: 초5-2"
                className="w-full px-3 py-2 border border-default rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-card text-title"
              />
            </div>
            <div>
              <label className="block text-sm text-muted mb-1">시험 이름</label>
              <input
                value={extraSearch.name}
                onChange={(e)=>setExtraSearch(prev=>({...prev, name: e.target.value }))}
                placeholder="예: 007"
                className="w-full px-3 py-2 border border-default rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-card text-title"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={handleRefresh}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md"
              >
                검색
              </button>
              <button
                onClick={handleAllFiltersReset}
                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md transition-colors"
              >
                필터 초기화
              </button>
            </div>
          </div>
        </div>

        {/* 시험 목록 테이블 */}
        <div className="bg-card rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <colgroup>
                {columns.map((column) => (
                  <col key={column.key} style={{ width: `${columnWidths[column.key]}px` }} />
                ))}
              </colgroup>
              <thead className="bg-muted dark:bg-hover">
                <tr>
                  {columns.map((column, index) => (
                    <th
                      key={column.key}
                      className={`px-4 py-3 text-center text-xs font-medium text-muted uppercase tracking-wider relative border-r border-default ${
                        column.sortable || column.filterable 
                          ? 'cursor-pointer hover:bg-hover dark:hover:bg-muted transition-colors' 
                          : ''
                      }`}
                      onClick={(e) => {
                        if (column.sortable || column.filterable) {
                          handleColumnClick(column.key, e);
                        }
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="truncate">{column.label}</span>
                        {(column.sortable || column.filterable) && (
                          <div className="flex items-center space-x-1">
                            {activeFilters[column.key] && (
                              <span className="text-indigo-600 dark:text-indigo-400">●</span>
                            )}
                            <svg className="w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        )}
                      </div>
                      
                      {/* 리사이징 핸들 */}
              {index < columns.length - 1 && (
                <div
                  className={`absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-indigo-300 dark:hover:bg-indigo-600 ${
                    isResizing === column.key ? 'bg-indigo-500 dark:bg-indigo-400' : ''
                  }`}
                  onMouseDown={(e) => handleMouseDown(column.key, e)}
                />
              )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-default">
                {error ? (
                  <tr>
                    <td colSpan={columns.length} className="px-6 py-8 text-center">
                      <div className="text-red-600 dark:text-red-400 mb-4">
                        <svg className="mx-auto h-12 w-12 text-red-400 dark:text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="mt-2 text-sm font-medium text-red-900 dark:text-red-100">
                          {error}
                        </div>
                        <div className="mt-1 text-sm text-red-700 dark:text-red-200">
                          필터 조건을 확인하거나 새로고침 버튼을 눌러보세요.
                        </div>
                      </div>
                      <div className="flex justify-center space-x-4">
                        <button
                          onClick={handleAllFiltersReset}
                          className="inline-flex items-center px-4 py-2 border border-input rounded-md shadow-sm text-sm font-medium text-body bg-card hover:bg-muted dark:hover:bg-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          필터 초기화
                        </button>
                        <button
                          onClick={handleRefresh}
                          disabled={loading}
                          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 dark:bg-indigo-700 hover:bg-indigo-700 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loading ? (
                            <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          )}
                          다시 시도
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : exams.length === 0 && !loading ? (
                  <tr>
                    <td colSpan={columns.length} className="px-6 py-8 text-center">
                      <div className="text-muted">
                        <svg className="mx-auto h-12 w-12 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div className="mt-2 text-sm font-medium text-title">
                          조건에 맞는 시험이 없습니다.
                        </div>
                        <div className="mt-1 text-sm text-muted">
                          다른 필터 조건을 시도해보세요.
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  exams.map((exam) => {
                    // 시험 완성 상태 확인 (더 정확한 로직)
                    const completedQuestions = exam.completedQuestions || 0;
                    const targetQuestions = exam.targetQuestions || exam.questionCount || 0;
                    const isQuestionComplete = targetQuestions > 0 && completedQuestions >= targetQuestions;
                    const isStatusComplete = exam.status === 'COMPLETED';
                    
                    // 전체적으로 완료된 시험인지 확인
                    const isFullyCompleted = isStatusComplete && isQuestionComplete;
                    const hasIncompleteQuestions = !isQuestionComplete || exam.status === 'DRAFT' || exam.status === 'IN_PROGRESS';
                    
                    // 학생 관리 페이지와 동일한 표 스타일(노란색 배경 제거)
                    const rowClassName = 'hover:bg-hover';
                    
                    return (
                      <>
                      <tr key={exam.id} className={rowClassName} onClick={() => toggleExpand(exam)}>
                        {columns.map((column) => {
                          if (column.key === 'actions') {
                            return (
                              <td key={column.key} className="px-4 py-3 whitespace-nowrap text-center">
                                <div className="flex items-center justify-center space-x-2">
                                  <EditSimpleButton exam={exam} />
                                  <button
                                    onClick={() => handleDeleteClick(exam.id, exam)}
                                    className="inline-flex items-center px-2 py-1 border border-indigo-300 dark:border-indigo-600 text-xs font-medium rounded text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 hover:border-indigo-400 dark:hover:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                                  >
                                    삭제
                                  </button>
                                </div>
                              </td>
                            );
                          }
                          if (column.key === 'number') {
                            return (
                              <td key={column.key} className="px-4 py-3 whitespace-nowrap text-sm text-title text-center">
                                {exam.number != null ? String(exam.number).padStart(3, '0') : '-'}
                              </td>
                            );
                          }
                          if (column.key === 'course') {
                            return (
                              <td key={column.key} className="px-4 py-3 whitespace-nowrap text-sm text-title text-center">
                                {exam.course || '-'}
                              </td>
                            );
                          }
                          if (column.key === 'title') {
                            return (
                              <td key={column.key} className="px-4 py-3 whitespace-nowrap text-sm text-title text-center">
                                {exam.title || '-'}
                              </td>
                            );
                          }
                          if (column.key === 'hallOfFame') {
                            return (
                              <td key={column.key} className="px-4 py-3 whitespace-nowrap text-xs text-title text-center">
                                {Array.isArray(exam.hallOfFame) && exam.hallOfFame.length > 0
                                  ? exam.hallOfFame.map((h, i) => `${h.name} ${h.score}`).slice(0,3).join(', ')
                                  : '-'}
                              </td>
                            );
                          }
                          if (column.key === 'isActive') {
                            return (
                              <td key={column.key} className="px-4 py-3 whitespace-nowrap text-center">
                                <button
                                  onClick={(e) => handleStatusClick(exam.id, exam.isActive, e)}
                                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity ${getActiveStatusStyle(exam.isActive)}`}
                                >
                                  {getStatusDisplay(exam.isActive)}
                                </button>
                              </td>
                            );
                          }
                          if (column.key === 'activatedAt') {
                            return (
                              <td key={column.key} className="px-4 py-3 whitespace-nowrap text-center">
                                {editingActivatedAt === exam.id ? (
                                  <div className="flex items-center justify-center space-x-2 max-w-xs">
                                    <input
                                      type="datetime-local"
                                      value={tempActivatedAt}
                                      onChange={(e) => setTempActivatedAt(e.target.value)}
                                      className="text-xs border border-input bg-card text-title rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                                      min={new Date().toISOString().slice(0, 16)}
                                    />
                                    <button
                                      onClick={() => handleActivatedAtSave(exam.id)}
                                      className="inline-flex items-center justify-center w-6 h-6 text-green-600 dark:text-green-400 hover:text-white hover:bg-green-600 dark:hover:bg-green-500 border border-green-600 dark:border-green-400 rounded transition-colors duration-200 text-xs font-bold"
                                      title="저장"
                                    >
                                      ✓
                                    </button>
                                    <button
                                      onClick={handleActivatedAtCancel}
                                      className="inline-flex items-center justify-center w-6 h-6 text-red-600 dark:text-red-400 hover:text-white hover:bg-red-600 dark:hover:bg-red-500 border border-red-600 dark:border-red-400 rounded transition-colors duration-200 text-xs font-bold"
                                      title="취소"
                                    >
                                      ✗
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => handleActivatedAtClick(exam.id, exam.activatedAt)}
                                    className={`inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium transition-colors duration-200 border ${
                                      exam.activatedAt 
                                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:border-blue-300 dark:hover:border-blue-500' 
                                        : 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-600 hover:bg-green-100 dark:hover:bg-green-900/50 hover:border-green-300 dark:hover:border-green-500'
                                    }`}
                                    title="클릭하여 수정"
                                  >
                                    {exam.activatedAt ? (
                                      <div className="flex items-center space-x-1">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <span>{formatDate(exam.activatedAt)}</span>
                                      </div>
                                    ) : (
                                      <div className="flex items-center space-x-1">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                        <span>즉시 응시 가능</span>
                                      </div>
                                    )}
                                  </button>
                                )}
                              </td>
                            );
                          }
                          return (
                            <td key={column.key} className="px-4 py-3 whitespace-nowrap text-sm text-title text-center">
                              {getCellValue(exam, column.key)}
                            </td>
                          );
                        })}
                      </tr>
                      {expandedExamId === exam.id && (
                        <tr>
                          <td colSpan={columns.length} className="bg-card">
                            <div className="p-4 border-t border-default">
                              {/* 히스토그램 */}
                              <ExamScoresPanel
                                exam={exam}
                                rows={scoresByExamId[exam.id] || []}
                                classes={classes}
                                loading={!!scoresLoading[exam.id]}
                                onChanged={async (examId: string) => {
                                  await fetchManualScoresForExam(examId);
                                  await fetchExams();
                                }}
                              />
                            </div>
                          </td>
                        </tr>
                      )}
                      </>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* 페이지네이션 */}
          {pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-default">
              <div className="flex items-center justify-between">
                <div className="text-sm text-body">
                  {pagination.total}개 중 {((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)}개 표시
                </div>
                <div className="flex space-x-2">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-1 text-sm rounded-md ${
                        page === pagination.page
                          ? 'bg-indigo-600 dark:bg-indigo-700 text-white'
                          : 'bg-card border border-input hover:bg-muted dark:hover:bg-hover'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 상태 변경 팝업 */}
      {statusPopup.isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setStatusPopup(prev => ({ ...prev, isOpen: false }))}
          />
          <div
            className="fixed z-50 bg-card border border-default rounded-lg shadow-lg p-3 w-28 status-popup"
            style={{
              left: statusPopup.position.x, // 버튼 오른쪽에 표시
              top: statusPopup.position.y
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col space-y-2">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleStatusChange(statusPopup.examId, true);
                }}
                className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500 hover:bg-green-600 text-white transition-colors"
              >
                게시하기
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleStatusChange(statusPopup.examId, false);
                }}
                className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500 hover:bg-red-600 text-white transition-colors"
              >
                내리기
              </button>
            </div>
          </div>
        </>
      )}

      {/* 필터링 팝업 */}
      {popupConfig.isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setPopupConfig(prev => ({ ...prev, isOpen: false }))}
          />
          <div
            className="fixed z-50 bg-card border border-default rounded-lg shadow-lg p-4 w-64"
            style={{
              left: popupConfig.position.x,
              top: popupConfig.position.y
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-title">
                {columns.find(c => c.key === popupConfig.column)?.label} 필터
              </h3>
              {activeFilters[popupConfig.column] && (
                <span className="text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded">
                  적용중
                </span>
              )}
            </div>
            
            {/* 정렬 순서 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-body mb-1">
                정렬 순서
              </label>
              <select
                value={filters[popupConfig.column]?.sortOrder || 'desc'}
                onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                className="w-full px-3 py-2 border border-input bg-card text-title rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="desc">내림차순</option>
                <option value="asc">오름차순</option>
              </select>
            </div>

            {/* 필터 값 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-body mb-1">
                필터 값
              </label>
              {popupConfig.column === 'correctRate' ? (
                <div className="flex items-start space-x-2">
                  <div className="flex items-center space-x-2 flex-1">
                    <input
                      type="number"
                      value={filters[popupConfig.column]?.filterValue || ''}
                      onChange={(e) => handleFilterChange('filterValue', e.target.value)}
                      placeholder="정답률 입력..."
                      min="0"
                      max="100"
                      className="flex-1 px-3 py-2 border border-input bg-card text-title rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-muted">%</span>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <button
                      onClick={() => handleFilterChange('filterOperator', 'gte')}
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        filters[popupConfig.column]?.filterOperator === 'gte' || !filters[popupConfig.column]?.filterOperator
                          ? 'bg-indigo-600 dark:bg-indigo-700 text-white'
                          : 'bg-muted dark:bg-hover text-body hover:bg-hover dark:hover:bg-muted'
                      }`}
                    >
                      이상
                    </button>
                    <button
                      onClick={() => handleFilterChange('filterOperator', 'lte')}
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        filters[popupConfig.column]?.filterOperator === 'lte'
                          ? 'bg-indigo-600 dark:bg-indigo-700 text-white'
                          : 'bg-muted dark:bg-hover text-body hover:bg-hover dark:hover:bg-muted'
                      }`}
                    >
                      이하
                    </button>
                  </div>
                </div>
              ) : getFilterOptions(popupConfig.column).length > 0 ? (
                <select
                  value={filters[popupConfig.column]?.filterValue || ''}
                  onChange={(e) => handleFilterChange('filterValue', e.target.value)}
                  className="w-full px-3 py-2 border border-input bg-card text-title rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {getFilterOptions(popupConfig.column).map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={filters[popupConfig.column]?.filterValue || ''}
                  onChange={(e) => handleFilterChange('filterValue', e.target.value)}
                  placeholder="검색어 입력..."
                  className="w-full px-3 py-2 border border-input bg-card text-title rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              )}
            </div>

            {/* 버튼 그룹 */}
            <div className="flex justify-end space-x-2">
              <button
                onClick={handleFilterApply}
                className="px-3 py-1 text-sm bg-indigo-600 dark:bg-indigo-700 text-white rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600"
              >
                적용
              </button>
              <button
                onClick={handleFilterReset}
                className="px-3 py-1 text-sm bg-muted dark:bg-hover text-body rounded-md hover:bg-hover dark:hover:bg-muted"
              >
                초기화
              </button>
              <button
                onClick={() => setPopupConfig(prev => ({ ...prev, isOpen: false }))}
                className="px-3 py-1 text-sm text-body border border-input rounded-md hover:bg-muted dark:hover:bg-hover"
              >
                취소
              </button>
            </div>
          </div>
        </>
      )}

      {/* 삭제 확인 팝업 */}
      {deletePopup.isOpen && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-card rounded-lg p-6 w-96 max-w-md mx-4 border border-default">
              <h3 className="text-lg font-semibold text-title mb-4">시험 삭제 확인</h3>
              <p className="text-body mb-6">
                다음 시험을 삭제하시겠습니까?
                <br />
                <span className="font-medium text-title mt-2 block">
                  {deletePopup.examInfo}
                </span>
              </p>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-md p-3 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400 dark:text-yellow-300" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      <strong>주의:</strong> 시험과 관련된 모든 데이터(문제, 정답, 응시 기록 등)가 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setDeletePopup({ isOpen: false, examId: '', examInfo: '' })}
                  className="px-4 py-2 text-sm font-medium text-body bg-muted dark:bg-hover border border-input rounded-md hover:bg-hover dark:hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleDeleteExam}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 dark:bg-red-700 border border-transparent rounded-md hover:bg-red-700 dark:hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        </>
      )}
      {/* 간단 수정 모달 */}
      {editOpen.open && editOpen.exam && (
        <EditSimpleModal
          exam={editOpen.exam}
          onClose={() => setEditOpen({ open: false })}
          onSaved={() => {
            setEditOpen({ open: false });
            handleRefresh();
          }}
        />
      )}
      {/* 점수 추가 모달 */}
      {addOpen.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onMouseDown={() => setAddOpen({ open: false })}>
          <div className="bg-card border border-default rounded-lg w-full max-w-2xl mx-4 p-4" onMouseDown={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-title">점수 추가</h3>
              <button className="text-muted hover:text-body" onClick={() => setAddOpen({ open: false })}>✕</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs text-muted mb-1">시험 선택</label>
                <div className="grid grid-cols-[1fr_auto] gap-2">
                  <select
                    className="w-full px-3 py-2 border border-input bg-card text-title rounded"
                    value={selectedExamId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setSelectedExamId(id);
                      const found = exams.find(ex => ex.id === id) || null;
                      setSelectedExamMeta(found || null);
                    }}
                  >
                    <option value="">시험을 선택하세요</option>
                    {exams.map(ex => (
                      <option key={ex.id} value={ex.id}>
                        {(ex.course || '과정 없음')} · {(ex.title || String(ex.number ?? '').padStart(3,'0'))}
                      </option>
                    ))}
                  </select>
                  <button
                    className="px-3 py-2 border border-input rounded hover:bg-hover"
                    onClick={() => { if (selectedExamId) fetchExamMetaById(selectedExamId); }}
                    title="다른 페이지의 시험 ID 입력 후 불러오기"
                  >
                    불러오기
                  </button>
                </div>
                {selectedExamMeta && (
                  <div className="mt-2 text-xs text-muted">
                    선택된 시험: <span className="text-title">{selectedExamMeta.course || '과정 없음'} · {selectedExamMeta.title || String(selectedExamMeta.number ?? '').padStart(3,'0')}</span>
                  </div>
                )}
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-muted mb-1">반/그룹</label>
                <select
                  className="w-full px-3 py-2 border border-input bg-card text-title rounded"
                  value={addClassId}
                  onChange={(e) => { setAddClassId(e.target.value); setAddScores({}); }}
                >
                  <option value="">반 선택</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">응시일</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-input bg-card text-title rounded"
                  value={addDate}
                  onChange={(e) => setAddDate(e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-muted mb-1">메모</label>
                <textarea
                  className="w-full px-3 py-2 border border-input bg-card text-title rounded"
                  rows={3}
                  value={addMemo}
                  onChange={(e) => setAddMemo(e.target.value)}
                  placeholder="메모를 입력하세요"
                />
              </div>
            </div>
            <div className="mt-4 border-t border-default pt-3">
              {!addClassId ? (
                <div className="text-xs text-muted">반을 먼저 선택하세요.</div>
              ) : (
                <div className="grid grid-cols-2 gap-2 max-h-64 overflow-auto">
                  {(classes.find((c) => c.id === addClassId)?.students || []).map((st) => (
                    <div key={st.id} className="flex items-center gap-2">
                      <div className="flex-1 text-sm text-title truncate">{st.name}</div>
                      <input
                        className="w-24 px-2 py-1 border border-input bg-card text-title rounded"
                        placeholder="점수"
                        value={addScores[st.id] ?? ''}
                        onChange={(e) => setAddScores((prev) => ({ ...prev, [st.id]: e.target.value }))}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button className="px-4 py-2 rounded border border-input hover:bg-hover" onClick={() => setAddOpen({ open: false })}>취소</button>
              <button
                className="px-4 py-2 rounded bg-primary text-primary-foreground disabled:opacity-60"
                disabled={!selectedExamId || !selectedExamMeta}
                onClick={() => {
                  if (!selectedExamId || !selectedExamMeta) return;
                  const examLike: ExamData = {
                    id: selectedExamId,
                    type: selectedExamMeta.type || 'MANUAL',
                    examnum: selectedExamMeta.examnum as any,
                    grade: (selectedExamMeta.grade as any) ?? 0,
                    duration: selectedExamMeta.duration || 0,
                    questionCount: selectedExamMeta.questionCount || 0,
                    attemptCount: 0,
                    correctRate: 0,
                    createdAt: '',
                    updatedAt: '',
                    isActive: true,
                    status: selectedExamMeta.status,
                    targetQuestions: selectedExamMeta.targetQuestions,
                    currentQuestions: selectedExamMeta.currentQuestions,
                    completedQuestions: selectedExamMeta.completedQuestions,
                    progressPercentage: selectedExamMeta.progressPercentage,
                    activatedAt: (selectedExamMeta as any).activatedAt ?? null,
                    number: selectedExamMeta.number ?? null,
                    title: selectedExamMeta.title ?? null,
                    course: selectedExamMeta.course ?? null,
                    simpleDifficulty: selectedExamMeta.simpleDifficulty ?? null,
                    hallOfFame: [],
                    answerKey: {},
                  };
                  addScoresForExam(examLike);
                }}
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

function ExamScoresPanel({
  exam,
  rows,
  classes,
  loading,
  onChanged,
}: {
  exam: ExamData;
  rows: ManualScoreRow[];
  classes: ClassLecture[];
  loading: boolean;
  onChanged: (examId: string) => void | Promise<void>;
}) {
  const classMap = new Map(classes.map(c => [c.id, c.name]));
  const byClass = new Map<string, ManualScoreRow[]>();
  (rows || []).forEach(r => {
    const key = r.classId || 'NO_CLASS';
    if (!byClass.has(key)) byClass.set(key, []);
    byClass.get(key)!.push(r);
  });
  const scores = (rows || []).map(r => Number(r.score)).filter(v => Number.isFinite(v));
  const histogram = new Array(10).fill(0);
  scores.forEach(raw => {
    const v = Math.max(0, Math.min(100, raw));
    const idx = v === 0 ? 0 : Math.min(9, Math.ceil(v / 10) - 1);
    histogram[idx] += 1;
  });
  const avg = scores.length ? Math.round((scores.reduce((s,v)=>s+v,0)/scores.length)*10)/10 : 0;
  const [editOpen, setEditOpen] = useState<{ open: boolean; classId: string }>({ open: false, classId: '' });
  const [editTakenAt, setEditTakenAt] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [editMemo, setEditMemo] = useState<string>('');
  const [editEntries, setEditEntries] = useState<Record<string, string>>({});

  const openEditForClass = (classId: string, items: ManualScoreRow[]) => {
    setEditOpen({ open: true, classId });
    // 날짜: 가장 최근 takenAt 사용
    const latest = [...items].sort((a,b)=> new Date(b.takenAt).getTime()-new Date(a.takenAt).getTime())[0];
    setEditTakenAt(latest?.takenAt ? new Date(latest.takenAt).toISOString().slice(0,10) : new Date().toISOString().slice(0,10));
    // 메모: 첫 항목 메모 유지
    const baseMemo = (items.find(it => typeof it.memo === 'string' && it.memo)?.memo || '') as string;
    let memoToUse = baseMemo || '';
    if (!/\[exam:/.test(memoToUse)) {
      const tag = `[exam:${exam.id}${exam.title ? `:${exam.title}` : ''}]`;
      memoToUse = memoToUse ? `${memoToUse} ${tag}` : tag;
    }
    if (exam.course && !/\[course:/.test(memoToUse)) {
      memoToUse = memoToUse ? `${memoToUse} [course:${exam.course}]` : `[course:${exam.course}]`;
    }
    setEditMemo(memoToUse);
    // 점수 입력 초기값
    const prepared: Record<string, string> = {};
    items.forEach(it => { prepared[it.studentId] = String(it.score ?? ''); });
    setEditEntries(prepared);
  };

  const saveEdit = async () => {
    if (!editOpen.open || !editOpen.classId) return;
    const token = localStorage.getItem('adminToken') || '';
    const classId = editOpen.classId;
    const studentsInClass = classes.find(c => c.id === classId)?.students || [];
    const entries = studentsInClass
      .map(st => ({ studentId: st.id, scoreStr: (editEntries[st.id] ?? '').trim() }))
      .filter(x => x.scoreStr !== '')
      .map(x => ({ studentId: x.studentId, score: Number(x.scoreStr) }))
      .filter(x => !Number.isNaN(x.score));
    const resp = await fetch(`/api/nimda/scores/exams/${exam.id}/manual/replace-class`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        classId,
        takenAt: editTakenAt ? `${editTakenAt}T00:00:00` : undefined,
        memo: editMemo || undefined,
        examType: exam.type,
        grade: exam.grade,
        entries,
      }),
    });
    if (!resp.ok) {
      const txt = await resp.text().catch(()=> '');
      alert(`수정 실패 (status ${resp.status})\n${txt?.slice(0, 500)}`);
      return;
    }
    setEditOpen({ open: false, classId: '' });
    await onChanged(exam.id);
  };

  const deleteClassScores = async (classId: string) => {
    const ok = confirm('해당 반의 점수를 모두 삭제할까요? 이 작업은 되돌릴 수 없습니다.');
    if (!ok) return;
    const token = localStorage.getItem('adminToken') || '';
    const resp = await fetch(`/api/nimda/scores/exams/${exam.id}/manual?classId=${encodeURIComponent(classId)}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!resp.ok) {
      const txt = await resp.text().catch(()=> '');
      alert(`삭제 실패 (status ${resp.status})\n${txt?.slice(0, 500)}`);
      return;
    }
    await onChanged(exam.id);
  };
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-muted">
          {exam.course || '과정 없음'} · {exam.title || String(exam.number ?? '').padStart(3,'0')}
        </div>
        <div className="text-sm">전체 평균: <span className="font-semibold">{avg}</span></div>
      </div>
      {loading ? (
        <div className="text-sm text-muted">불러오는 중…</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            {/* 반별 표 */}
            {Array.from(byClass.entries()).map(([classId, items]) => (
              <div key={classId} className="mb-4 border border-default rounded">
                <div className="px-3 py-2 bg-muted text-sm font-medium flex items-center justify-between">
                  <span>{classId === 'NO_CLASS' ? '반 미지정' : (classMap.get(classId) || classId)}</span>
                  {classId !== 'NO_CLASS' && (
                    <div className="flex items-center gap-2">
                      <button
                        className="px-2 py-1 text-xs rounded border border-input hover:bg-hover"
                        onClick={() => openEditForClass(classId, items)}
                      >
                        점수 수정
                      </button>
                      <button
                        className="px-2 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700"
                        onClick={() => deleteClassScores(classId)}
                      >
                        삭제
                      </button>
                    </div>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-default">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-muted uppercase tracking-wider">학생</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-muted uppercase tracking-wider">점수</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-muted uppercase tracking-wider">응시일</th>
                      </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-default">
                      {items.map(r => (
                        <tr key={r.id}>
                          <td className="px-3 py-2 text-sm text-title">{r.student?.name || r.studentId}</td>
                          <td className="px-3 py-2 text-sm">{r.score}</td>
                          <td className="px-3 py-2 text-sm">{r.takenAt ? new Date(r.takenAt).toLocaleDateString('ko-KR') : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
          <div>
            {/* 히스토그램 */}
            <div className="bg-card border border-default rounded p-3">
              <div className="text-xs text-muted mb-1">분포(히스토그램)</div>
              <div className="flex items-end gap-1 h-24">
                {histogram.map((c, i) => {
                  const h = Math.round((c / Math.max(1, Math.max(...histogram))) * 100);
                  const lower = i === 0 ? 0 : i * 10 + 1;
                  const upper = (i + 1) * 10;
                  return (
                    <div key={i} className="w-4 bg-indigo-500/20 border border-indigo-500/40 rounded-sm" style={{ height: `${Math.max(8, h)}%` }} title={`${lower}~${upper}점: ${c}명`} />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* 반별 점수 수정 모달 */}
      {editOpen.open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4" onMouseDown={() => setEditOpen({ open: false, classId: '' })}>
          <div className="bg-card border border-default rounded-lg w-full max-w-2xl p-4" onMouseDown={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-title">반 점수 수정</h3>
              <button className="text-muted hover:text-body" onClick={() => setEditOpen({ open: false, classId: '' })}>✕</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-muted mb-1">응시일</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-input bg-card text-title rounded"
                  value={editTakenAt}
                  onChange={(e) => setEditTakenAt(e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-muted mb-1">메모</label>
                <textarea
                  className="w-full px-3 py-2 border border-input bg-card text-title rounded"
                  rows={3}
                  value={editMemo}
                  onChange={(e) => setEditMemo(e.target.value)}
                  placeholder="메모를 입력하세요"
                />
              </div>
            </div>
            <div className="mt-4 border-t border-default pt-3">
              {!editOpen.classId ? (
                <div className="text-xs text-muted">반을 먼저 선택하세요.</div>
              ) : (
                <div className="grid grid-cols-2 gap-2 max-h-64 overflow-auto">
                  {(classes.find((c) => c.id === editOpen.classId)?.students || []).map((st) => (
                    <div key={st.id} className="flex items-center gap-2">
                      <div className="flex-1 text-sm text-title truncate">{st.name}</div>
                      <input
                        className="w-24 px-2 py-1 border border-input bg-card text-title rounded"
                        placeholder="점수"
                        value={editEntries[st.id] ?? ''}
                        onChange={(e) => setEditEntries((prev) => ({ ...prev, [st.id]: e.target.value }))}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button className="px-4 py-2 rounded border border-input hover:bg-hover" onClick={() => setEditOpen({ open: false, classId: '' })}>취소</button>
              <button className="px-4 py-2 rounded bg-primary text-primary-foreground disabled:opacity-60" onClick={saveEdit}>
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
function EditSimpleButton({ exam }: { exam: ExamData }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center px-2 py-1 border border-indigo-300 dark:border-indigo-600 text-xs font-medium rounded text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors"
      >
        수정
      </button>
      {open && (
        <EditSimpleModal
          exam={exam}
          onClose={() => setOpen(false)}
          onSaved={() => setOpen(false)}
        />
      )}
    </>
  );
}

function EditSimpleModal({
  exam,
  onClose,
  onSaved,
}: {
  exam: ExamData;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState<string>(exam.title || String(exam.number ?? '').padStart(3, '0'));
  const [difficulty, setDifficulty] = useState<number>(exam.simpleDifficulty || 1);
  const [answers, setAnswers] = useState<(string | '')[]>(
    (() => {
      const key = (exam as any).answerKey || {};
      const arr: (string | '')[] = [];
      for (let i = 1; i <= 30; i++) {
        arr.push(key?.[i] ?? '');
      }
      return arr;
    })()
  );
  const [saving, setSaving] = useState(false);

  const save = async () => {
    try {
      setSaving(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : '';
      const answerKey: Record<string, string | null> = {};
      answers.forEach((v, idx) => {
        const k = (idx + 1).toString();
        answerKey[k] = v ? v : null;
      });
      const resp = await fetch(`/api/nimda/exams/${exam.id}/simple`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`,
        },
        body: JSON.stringify({ title, difficulty, answerKey }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || '저장 실패');
      }
      onSaved();
    } catch (e:any) {
      alert(e.message || '저장 실패');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
      <div className="bg-card border border-default rounded-lg w-full max-w-2xl max-h-[90vh] overflow-auto">
        <div className="p-4 border-b border-default flex items-center justify-between">
          <h3 className="text-title font-semibold">시험 수정</h3>
          <button onClick={onClose} className="text-muted hover:text-body">✕</button>
        </div>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-muted mb-1">시험 이름</label>
              <input
                value={title}
                onChange={(e)=>setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-input bg-card text-title rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm text-muted mb-1">난이도 (1~9)</label>
              <select
                value={difficulty}
                onChange={(e)=>setDifficulty(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-input bg-card text-title rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {Array.from({length:9},(_,i)=>i+1).map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm text-muted mb-2">답안 (1~30, 비워둘 수 있음)</label>
            <div className="grid grid-cols-5 gap-2">
              {answers.map((val, idx)=>(
                <div key={idx} className="flex items-center gap-2">
                  <span className="w-6 text-xs text-muted">{idx+1}</span>
                  <input
                    value={val}
                    onChange={(e)=>{
                      const next = [...answers];
                      next[idx] = e.target.value;
                      setAnswers(next);
                    }}
                    placeholder=""
                    className="flex-1 px-2 py-1 border border-input bg-card text-title rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="p-4 border-t border-default flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border border-input text-body rounded-md hover:bg-hover">취소</button>
          <button onClick={save} disabled={saving} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md disabled:opacity-60">
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  );
}

// 과정/개수 선택 후 간단 생성 컨트롤
function CreateSimpleExamControls({ onClickAddScore }: { onClickAddScore?: () => void }) {
  const [course, setCourse] = useState<string>('초3-1');
  const [count, setCount] = useState<number>(1);
  const [saving, setSaving] = useState(false);
  const COURSE_OPTIONS = [
    '초3-1','초3-2','초4-1','초4-2','초5-1','초5-2','초6-1','초6-2',
    '중1-1','중1-2','중2-1','중2-2','중3-1','중3-2','고등'
  ];

  const handleCreate = async () => {
    if (!course || count < 1 || count > 20) return;
    try {
      setSaving(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : '';
      const resp = await fetch('/api/nimda/exams/bulk-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`,
        },
        body: JSON.stringify({ course, count }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || '시험 생성 실패');
      }
      // 성공 후 페이지 새로고침 유도(목록 리로드)
      window.location.reload();
    } catch (e:any) {
      alert(e.message || '시험 생성 실패');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-muted/50 border border-default rounded-md p-3">
      <div className="flex flex-col md:flex-row gap-3 md:items-center">
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted">과정</label>
          <select
            value={course}
            onChange={(e)=>setCourse(e.target.value)}
            className="px-3 py-2 border border-input bg-card text-title rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {COURSE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted">개수</label>
          <select
            value={count}
            onChange={(e)=>setCount(parseInt(e.target.value))}
            className="px-3 py-2 border border-input bg-card text-title rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {Array.from({length:20},(_,i)=>i+1).map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div className="md:ml-auto inline-flex items-center gap-2">
          <button
            onClick={handleCreate}
            disabled={saving}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md disabled:opacity-60 inline-flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>{saving ? '생성 중...' : '시험 추가'}</span>
          </button>
          <button
            onClick={onClickAddScore}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md inline-flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
            </svg>
            <span>점수 추가</span>
          </button>
        </div>
      </div>
    </div>
  );
}