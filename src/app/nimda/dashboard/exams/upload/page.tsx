'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { flushSync } from 'react-dom';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import AdminLayout from '@/components/admin/AdminLayout';
import dynamic from 'next/dynamic';
import { copyWithoutNotification } from '@/utils/clipboard';
import { removeDuplicateImages } from '@/lib/imageUtils';
import QuestionContent from '@/components/testing/QuestionContent';
import { Question as QuestionType } from '@/types/exam';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import ConfirmToast from '@/components/ConfirmToast';
import SaveStatusToast from '@/components/SaveStatusToast';
import rehypeRaw from 'rehype-raw';
import { createMarkdownComponents } from '@/lib/markdownComponents';
import 'katex/dist/katex.min.css';

// 동적 import로 MDEditor 로드 (SSR 방지)
const MDEditor = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => mod.default),
  { ssr: false }
);

interface ExamInfo {
  grade: number;
  type: 'FULL' | 'HALF' | 'BEGINNER';
  duration: number;
  questionCount: number;
  activatedAt?: Date;
  nextExamNumber?: number;
  // 추가 시험 정보 필드들
  isActive?: boolean;
  status?: string;
  targetQuestions?: number;
  currentQuestions?: number;
}

interface Question {
  questionNum: number;
  content: string;
  imageFiles?: File[];
  imageUrls?: string[];
  imagePaths?: string[];
  answer: string;
  explanation: string;
  answerImageFiles?: File[];
  answerImageUrls?: string[];
  answerImagePaths?: string[];
  videoUrl?: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  hasValidationErrors?: boolean;
  validationErrors?: string[];
}

function ExamUploadPageContent() {
  const { requireAuth } = useAdminAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editExamId = searchParams.get('edit');
  
  const [examInfo, setExamInfo] = useState<ExamInfo>({
    grade: 6,
    type: 'FULL',
    duration: 40,
    questionCount: 40,
    nextExamNumber: 1
  });
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showQuestionForm, setShowQuestionForm] = useState(true);
  const [isBasicInfoCollapsed, setIsBasicInfoCollapsed] = useState(!!editExamId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'question' | 'answer'>('question');
  const [saving, setSaving] = useState(false);
  const [existingExamId, setExistingExamId] = useState<string | null>(null);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [savedQuestions, setSavedQuestions] = useState<Question[]>([]);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isEditMode, setIsEditMode] = useState(!!editExamId);
  const [originalExamId, setOriginalExamId] = useState<string | null>(null);
  const [copiedImageIndex, setCopiedImageIndex] = useState<{type: 'question' | 'answer', index: number} | null>(null);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [imageViewerSrc, setImageViewerSrc] = useState('');
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  
  // 일괄 업로드 관련 state
  const [bulkUploadModalOpen, setBulkUploadModalOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<FileList | null>(null);
  const [parsedProblems, setParsedProblems] = useState<any[]>([]);
  const [bulkUploadLoading, setBulkUploadLoading] = useState(false);
  
  // Toast 관련 state
  const [confirmToast, setConfirmToast] = useState<{
    isVisible: boolean;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
  }>({
    isVisible: false,
    message: '',
    onConfirm: () => {},
  });
  
  const [statusToast, setStatusToast] = useState<{
    isVisible: boolean;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  }>({
    isVisible: false,
    message: '',
    type: 'info',
  });
  const [previewQuestion, setPreviewQuestion] = useState<QuestionType | null>(null);
  const [previewType, setPreviewType] = useState<'question' | 'explanation'>('question');

  // Toast 헬퍼 함수들
  const showStatusToast = (message: string, type: 'success' | 'error' | 'info' | 'warning') => {
    setStatusToast({
      isVisible: true,
      message,
      type,
    });
  };

  const showConfirmToast = (
    message: string, 
    onConfirm: () => void, 
    confirmText = '확인', 
    cancelText = '취소'
  ) => {
    setConfirmToast({
      isVisible: true,
      message,
      onConfirm: () => {
        setConfirmToast(prev => ({ ...prev, isVisible: false }));
        onConfirm();
      },
      confirmText,
      cancelText,
    });
  };

  const closeConfirmToast = () => {
    setConfirmToast(prev => ({ ...prev, isVisible: false }));
    setIsNavigating(false); // 네비게이션 취소 시 로딩 상태 해제
  };

  const closeStatusToast = () => {
    setStatusToast(prev => ({ ...prev, isVisible: false }));
  };

  useEffect(() => {
    requireAuth();
  }, [requireAuth]);

  // 다음 시험 번호 가져오기
  const fetchNextExamNumber = async (grade: number, type: string) => {
    // 매개변수 검증
    if (!grade || !type) {
      console.warn('fetchNextExamNumber: grade 또는 type이 없습니다.', { grade, type });
      return 1;
    }
    
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/nimda/exams/next-number?grade=${grade}&type=${type}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data.nextExamNumber;
      }
      return 1;
    } catch (error) {
      console.error('다음 시험 번호 가져오기 오류:', error);
      return 1;
    }
  };

  // 초기 상태 설정: 새 시험은 기본정보 펼침, 수정은 접힘 - useState 초기값으로 처리하여 애니메이션 방지

  // 문제가 생성되고 사용자가 문제 내용을 입력하기 시작할 때 기본정보 섹션을 자동으로 접기
  useEffect(() => {
    if (questions.length > 0 && !isEditMode) {
      // 문제 내용이 있는 경우에만 접기 (빈 문제 생성 시에는 접지 않음)
      const hasContent = questions.some(q => q.content || q.answer);
      if (hasContent && !isBasicInfoCollapsed) {
        setIsBasicInfoCollapsed(true);
      }
    }
  }, [questions, isEditMode]); // isBasicInfoCollapsed를 의존성에서 제거

  // 학년이나 시험 유형이 변경될 때 다음 시험 번호 가져오기 (새 시험인 경우에만)
  useEffect(() => {
    if (!isEditMode && examInfo.grade && examInfo.type) {
      const updateNextExamNumber = async () => {
        const nextNumber = await fetchNextExamNumber(examInfo.grade, examInfo.type);
        setExamInfo(prev => ({ ...prev, nextExamNumber: nextNumber }));
      };
      updateNextExamNumber();
    }
  }, [examInfo.grade, examInfo.type, isEditMode]);

  // 시험 유형이 변경될 때 문제 수 자동 설정 (새 시험인 경우에만)
  useEffect(() => {
    if (!isEditMode) {
      let defaultQuestionCount = 40; // 기본값: 풀 모고
      
      if (examInfo.type === 'FULL') {
        defaultQuestionCount = 40;
      } else if (examInfo.type === 'HALF') {
        defaultQuestionCount = 20;
      } else if (examInfo.type === 'BEGINNER') {
        defaultQuestionCount = 10;
      }
      
      setExamInfo(prev => ({ ...prev, questionCount: defaultQuestionCount }));
    }
  }, [examInfo.type, isEditMode]);

  // 수정 모드일 때 기존 시험 정보 불러오기
  useEffect(() => {
    if (editExamId) {
      loadExamData(editExamId);
    }
  }, [editExamId]);

  const loadExamData = async (examId: string) => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/nimda/exams/${examId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: '시험 정보를 불러오는데 실패했습니다.' }));
        throw new Error(errorData.error || '시험 정보를 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      const exam = data.exam;

      // 현재 호스트 정보를 가져와서 이미지 URL 변환
      const currentHost = window.location.origin;

      // 이미지 URL을 현재 호스트에 맞게 변환하는 함수 (미리보기용)
      const convertImageUrls = (urls: string[]) => {
        return urls.map(url => {
          // 이미 완전한 URL인 경우 호스트만 교체
          if (url.startsWith('http://') || url.startsWith('https://')) {
            const urlObj = new URL(url);
            return `${currentHost}${urlObj.pathname}`;
          }
          // 상대 경로인 경우 현재 호스트 추가
          return url.startsWith('/') ? `${currentHost}${url}` : `${currentHost}/${url}`;
        });
      };

      // 이미지 경로를 상대 경로로 변환하는 함수 (복사용)
      const convertImagePaths = (urls: string[]) => {
        return urls.map(url => {
          // 이미 완전한 URL인 경우 경로만 추출
          if (url.startsWith('http://') || url.startsWith('https://')) {
            const urlObj = new URL(url);
            return urlObj.pathname;
          }
          // 상대 경로인 경우 그대로 사용
          return url.startsWith('/') ? url : `/${url}`;
        });
      };

      // 작성된 문제들을 먼저 로드
      const loadedQuestions = exam.questions.map((q: any, index: number) => {
        // 중복 이미지 제거 먼저 수행
        const deduplicatedImageUrls = removeDuplicateImages(q.imageUrls || []);
        const deduplicatedAnswerImageUrls = removeDuplicateImages(q.answerImageUrls || []);
        
        // 이미지 URL들을 현재 호스트에 맞게 변환
        const convertedImageUrls = convertImageUrls(deduplicatedImageUrls);
        const convertedAnswerImageUrls = convertImageUrls(deduplicatedAnswerImageUrls);
        // 복사용 상대 경로 변환 (이미 /가 포함되어 있으므로 그대로 사용)
        const convertedImagePaths = deduplicatedImageUrls;
        const convertedAnswerImagePaths = deduplicatedAnswerImageUrls;

        return {
          questionNum: index + 1,
          content: q.content || '',
          answer: q.answer || '',
          explanation: q.explanation || '',
          videoUrl: q.videoUrl || '',
          difficulty: q.difficulty || 'MEDIUM',
          imageFiles: [],
          imageUrls: convertedImageUrls, // 현재 호스트로 변환된 전체 URL (미리보기용)
          imagePaths: convertedImagePaths, // 상대 경로 (복사용)
          answerImageFiles: [],
          answerImageUrls: convertedAnswerImageUrls, // 현재 호스트로 변환된 전체 URL (미리보기용)
          answerImagePaths: convertedAnswerImagePaths, // 상대 경로 (복사용)
          hasValidationErrors: false,
          validationErrors: []
        };
      });

      // 전체 문제 수(targetQuestions)가 현재 작성된 문제 수보다 많은 경우 빈 문제 추가
      const targetQuestionCount = exam.targetQuestions || exam.questions.length;
      while (loadedQuestions.length < targetQuestionCount) {
        loadedQuestions.push({
          questionNum: loadedQuestions.length + 1,
          content: '',
          answer: '',
          explanation: '',
          videoUrl: '',
          difficulty: 'MEDIUM' as const,
          imageFiles: [],
          imageUrls: [],
          imagePaths: [],
          answerImageFiles: [],
          answerImageUrls: [],
          answerImagePaths: [],
          hasValidationErrors: false,
          validationErrors: []
        });
      }

      // 시험 정보의 questionCount를 targetQuestions로 설정
      setExamInfo({
        grade: exam.grade,
        type: exam.type,
        duration: exam.duration,
        questionCount: targetQuestionCount,
        activatedAt: exam.activatedAt ? exam.activatedAt.slice(0, 16) : undefined, // datetime-local 형식으로 변환
        nextExamNumber: exam.examnum // 기존 시험의 회차 번호
      });

      setQuestions(loadedQuestions);
      setIsEditMode(true);
      setOriginalExamId(examId);
      setCurrentQuestionIndex(0);
      setActiveTab('question');
      
    } catch (error) {
      console.error('시험 정보 불러오기 오류:', error);
      setError(error instanceof Error ? error.message : '시험 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 시험 정보가 변경되면 문제 배열 조정 (수정 모드가 아닐 때만)
  useEffect(() => {
    if (!isEditMode) {
      const currentCount = questions.length;
      const targetCount = examInfo.questionCount;
      
      if (currentCount !== targetCount) {
        const newQuestions = [...questions];
        
        // 문제 수가 증가한 경우 또는 초기 로드 시 빈 문제 추가
        if (targetCount > currentCount) {
          for (let i = currentCount; i < targetCount; i++) {
            newQuestions.push({
              questionNum: i + 1,
              content: '',
              answer: '',
              explanation: '',
              videoUrl: '',
              difficulty: 'MEDIUM' as const,
                  imageFiles: [],
              imageUrls: [],
              imagePaths: [],
              answerImageFiles: [],
              answerImageUrls: [],
              answerImagePaths: [],
              hasValidationErrors: false,
              validationErrors: []
            });
          }
        } 
        // 문제 수가 감소한 경우 마지막 문제들 제거
        else if (targetCount < currentCount) {
          newQuestions.splice(targetCount);
        }
        
        setQuestions(newQuestions);
        
        // 현재 문제 인덱스가 범위를 벗어나면 조정
        if (currentQuestionIndex >= targetCount) {
          setCurrentQuestionIndex(Math.max(0, targetCount - 1));
        }
      }
    }
  }, [examInfo.questionCount, isEditMode, questions, currentQuestionIndex]);

  // 초기 로드 시 문제 배열 생성 (새 시험인 경우) - handleQuestionChange에서 자동 처리하므로 더 이상 필요하지 않음
  useEffect(() => {
    if (!isEditMode && questions.length === 0 && examInfo.questionCount > 0) {
      // handleQuestionChange에서 자동으로 questions 배열을 확장하므로 
      // 여기서는 최소한의 초기화만 수행
      if (questions.length === 0) {
        setCurrentQuestionIndex(0);
        setActiveTab('question');
      }
    }
  }, [isEditMode, questions.length, examInfo.questionCount]);


  const handleQuestionChange = (field: keyof Question, value: any) => {
    setQuestions(prev => {
      const updated = [...prev];
      
      // questions 배열이 현재 인덱스만큼 없으면 확장
      while (updated.length <= currentQuestionIndex) {
        updated.push({
          questionNum: updated.length + 1,
          content: '',
          answer: '',
          explanation: '',
          videoUrl: '',
          difficulty: 'MEDIUM' as const,
          imageFiles: [],
          imageUrls: [],
          imagePaths: [],
          answerImageFiles: [],
          answerImageUrls: [],
          answerImagePaths: [],
          hasValidationErrors: false,
          validationErrors: []
        });
      }
      
      // 현재 question이 없으면 기본값으로 초기화
      if (!updated[currentQuestionIndex]) {
        updated[currentQuestionIndex] = {
          questionNum: currentQuestionIndex + 1,
          content: '',
          answer: '',
          explanation: '',
          videoUrl: '',
          difficulty: 'MEDIUM' as const,
          imageFiles: [],
          imageUrls: [],
          imagePaths: [],
          answerImageFiles: [],
          answerImageUrls: [],
          answerImagePaths: [],
          hasValidationErrors: false,
          validationErrors: []
        };
      }
      
      updated[currentQuestionIndex] = {
        ...updated[currentQuestionIndex],
        [field]: value
      };
      
      // 변경된 문제의 유효성 검사 실행
      const errors = validateQuestion(updated[currentQuestionIndex]);
      updated[currentQuestionIndex].hasValidationErrors = errors.length > 0;
      updated[currentQuestionIndex].validationErrors = errors;
      
      return updated;
    });
  };


  // 이미지 뷰어 열기
  const openImageViewer = (src: string) => {
    setImageViewerSrc(src);
    setImageViewerOpen(true);
  };

  // 문제 변경 사항 감지 함수
  const hasQuestionChanged = (currentQuestion: Question, savedQuestion: Question | undefined) => {
    if (!savedQuestion) return !!(currentQuestion.content || currentQuestion.answer);
    
    return (
      currentQuestion.content !== savedQuestion.content ||
      currentQuestion.answer !== savedQuestion.answer ||
      currentQuestion.explanation !== savedQuestion.explanation ||
      currentQuestion.videoUrl !== savedQuestion.videoUrl ||
      currentQuestion.difficulty !== savedQuestion.difficulty ||
      JSON.stringify(currentQuestion.imageFiles?.map(f => f.name) || []) !== JSON.stringify(savedQuestion.imageFiles?.map(f => f.name) || []) ||
      JSON.stringify(currentQuestion.answerImageFiles?.map(f => f.name) || []) !== JSON.stringify(savedQuestion.answerImageFiles?.map(f => f.name) || [])
    );
  };

  // 필수 입력 필드 검증 함수
  const validateQuestion = (question: Question) => {
    const errors: string[] = [];
    
    if (!question.content || question.content.trim() === '') {
      errors.push('문제 내용을 입력하세요.');
    }
    
    if (!question.answer || question.answer.trim() === '') {
      errors.push('정답을 입력하세요.');
    }
    
    
    if (!question.explanation || question.explanation.trim() === '') {
      errors.push('해설을 입력하세요.');
    }
    
    return errors;
  };

  // 모든 문제의 필수 필드 검증
  const validateAllQuestions = () => {
    const updatedQuestions = questions.map(question => {
      const errors = validateQuestion(question);
      return {
        ...question,
        hasValidationErrors: errors.length > 0,
        validationErrors: errors
      };
    });
    
    setQuestions(updatedQuestions);
    return updatedQuestions.every(q => !q.hasValidationErrors);
  };

  // 현재 문제 검증
  const validateCurrentQuestion = () => {
    const currentQuestion = questions[currentQuestionIndex];
    const errors = validateQuestion(currentQuestion);
    
    setQuestions(prev => {
      const updated = [...prev];
      updated[currentQuestionIndex] = {
        ...updated[currentQuestionIndex],
        hasValidationErrors: errors.length > 0,
        validationErrors: errors
      };
      return updated;
    });
    
    return errors.length === 0;
  };

  // 시험 작성 완료 여부 확인
  const isExamCompleted = () => {
    return questions.every(q => q.content && q.answer && q.explanation);
  };

  // 작성된 문제 중 필수 영역 완성 여부 확인
  const hasIncompleteRequiredFields = () => {
    const writtenQuestions = questions.filter(q => q.content || q.answer || q.explanation);
    return writtenQuestions.some(q => !q.content || !q.answer || !q.explanation);
  };

  // 랜덤 해시 생성 함수 (8자리 16진수)
  const generateRandomHash = () => {
    return Math.random().toString(16).substr(2, 8);
  };

  // 예상 서버 경로 생성 함수 (images/exams 구조에 맞게 수정)
  const generateExpectedPath = (questionIndex: number, imageIndex: number, fileName: string, imageType: 'problem' | 'answer' = 'problem') => {
    const fileExtension = fileName.split('.').pop();
    const hash = generateRandomHash();
    const uniqueFileName = `${fileName.split('.')[0]}_${Date.now()}_${hash}.${fileExtension}`;
    
    // images/exams/{grade}/{examType}/{examNumber}/{imageType}/{filename} 구조
    return `/images/exams/${examInfo.grade}/${examInfo.type.toLowerCase()}/${examInfo.nextExamNumber}/${imageType}/${uniqueFileName}`;
  };

  // 페이지 이동 전 검증 및 처리
  const handlePageNavigation = useCallback(async (navigationCallback: () => void) => {
    if (isNavigating || questions.length === 0) {
      navigationCallback();
      return;
    }

    setIsNavigating(true);

    try {
      // 현재 문제 검증
      validateCurrentQuestion();

      // 시험이 완료되었으면 바로 이동
      if (isExamCompleted()) {
        navigationCallback();
        return;
      }

      // 필수 영역이 미완성인 경우
      if (hasIncompleteRequiredFields()) {
        showConfirmToast(
          '필수 영역(문제 내용, 정답, 개념, 해설)을 모두 채우지 않은 문제가 있습니다.\n' +
          '필수 영역을 모두 채우고 이동하시기 바랍니다.\n\n' +
          '그래도 이동하시겠습니까?',
          () => {
            // 확인을 눌렀을 때 navigation 실행
            navigationCallback();
            setIsNavigating(false);
          },
          '이동하기',
          '취소'
        );
        return; // toast를 표시하고 대기
      } else {
        // 필수 영역은 완성되었지만 모든 문제가 완료되지 않은 경우
        showConfirmToast(
          '시험 내용 작성 중에 있습니다.\n' +
          '중간저장하고 이동하시겠습니까?',
          async () => {
            // 확인을 눌렀을 때 중간 저장 후 이동
            try {
              if (isEditMode || existingExamId || questions.some(q => q.content || q.answer)) {
                await handleIntermediateSave();
              }
              navigationCallback();
            } catch (error) {
              showStatusToast('중간저장에 실패했습니다.', 'error');
            } finally {
              setIsNavigating(false);
            }
          },
          '저장하고 이동',
          '취소'
        );
        return; // toast를 표시하고 대기
      }

      navigationCallback();
    } catch (error) {
      console.error('페이지 이동 중 오류:', error);
    } finally {
      setIsNavigating(false);
    }
  }, [isNavigating, questions, currentQuestionIndex, existingExamId, isEditMode, originalExamId]);

  // 페이지 이동 시 브라우저 뒤로가기/새로고침 감지
  useEffect(() => {
    if (questions.length === 0) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isExamCompleted()) return;
      
      e.preventDefault();
      e.returnValue = '작성 중인 시험이 있습니다. 페이지를 떠나시겠습니까?';
      return e.returnValue;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [questions]);

  // 컴포넌트 언마운트 시 모든 blob URL 정리
  useEffect(() => {
    return () => {
      // 모든 문제 이미지의 blob URL 정리
      questions.forEach(question => {
        question.imageUrls?.forEach(url => {
          if (url && url.startsWith('blob:')) {
            URL.revokeObjectURL(url);
          }
        });
        question.answerImageUrls?.forEach(url => {
          if (url && url.startsWith('blob:')) {
            URL.revokeObjectURL(url);
          }
        });
      });
    };
  }, []); // 빈 배열로 컴포넌트 언마운트 시에만 실행

  // 이미 서버에 저장된 파일인지 확인하는 함수
  const isFileAlreadyUploaded = (file: File, imagePaths: string[]): boolean => {
    // 파일명 기반으로 중복 체크 (서버에서 생성한 경로에 원본 파일명이 포함되어 있음)
    const fileName = file.name.replace(/\.[^/.]+$/, ""); // 확장자 제거
    return imagePaths.some(path => {
      const pathParts = path.split('/');
      const serverFileName = pathParts[pathParts.length - 1]; // 파일명 부분 추출
      return serverFileName.includes(fileName) || path.includes(file.name);
    });
  };

  // 중간 저장 함수
  const handleIntermediateSave = async () => {
    try {
      setSaving(true);
      setError('');
      
      const token = localStorage.getItem('adminToken');
      
      const formData = new FormData();
      
      // 수정 모드일 때는 기존 시험 ID 사용
      const examInfoWithId = {
        ...examInfo,
        existingExamId: isEditMode ? originalExamId : existingExamId
      };
      
      formData.append('examInfo', JSON.stringify(examInfoWithId));
      formData.append('questions', JSON.stringify(questions.map(q => ({
        ...q,
        imageFiles: undefined,
        imageUrls: undefined,
        answerImageFiles: undefined,
        answerImageUrls: undefined,
        imagePaths: q.imagePaths || [], // 실제 서버 경로 전송
        answerImagePaths: q.answerImagePaths || [] // 실제 서버 경로 전송
      }))));
      
      // 이미지 파일들 추가 (이미 서버에 저장된 파일 제외)
      questions.forEach((question, qIndex) => {
        // 문제 이미지 파일 처리
        if (question.imageFiles && question.imageFiles.length > 0) {
          const imagePaths = question.imagePaths || [];
          const newFiles = question.imageFiles.filter(file => 
            !isFileAlreadyUploaded(file, imagePaths)
          );
          
          newFiles.forEach((file, imgIndex) => {
            formData.append(`question_${qIndex}_image_${imgIndex}`, file);
          });
          
          console.log(`문제 ${qIndex + 1}: 전체 ${question.imageFiles.length}개 중 ${newFiles.length}개 파일만 전송`);
        }
        
        // 정답 이미지 파일 처리
        if (question.answerImageFiles && question.answerImageFiles.length > 0) {
          const answerImagePaths = question.answerImagePaths || [];
          const newAnswerFiles = question.answerImageFiles.filter(file => 
            !isFileAlreadyUploaded(file, answerImagePaths)
          );
          
          newAnswerFiles.forEach((file, imgIndex) => {
            formData.append(`question_${qIndex}_answer_image_${imgIndex}`, file);
          });
          
          console.log(`정답 ${qIndex + 1}: 전체 ${question.answerImageFiles.length}개 중 ${newAnswerFiles.length}개 파일만 전송`);
        }
      });

      // 수정 모드이거나 기존 시험 ID가 있는 경우 PUT 요청, 새로운 시험은 임시 저장 API 사용
      const url = (isEditMode && originalExamId) || existingExamId
        ? `/api/nimda/exams/${originalExamId || existingExamId}` 
        : '/api/nimda/exams/save';
      
      const method = (isEditMode && originalExamId) || existingExamId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: '중간 저장에 실패했습니다.' }));
        throw new Error(errorData.error || '중간 저장에 실패했습니다.');
      }

      const result = await response.json();
      
      // 수정 모드가 아니고 기존 시험 ID가 없을 때만 existingExamId 업데이트
      if (!isEditMode && !existingExamId && result.examId) {
        setExistingExamId(result.examId);
      }
      
      setLastSavedTime(new Date().toLocaleTimeString());
      
      // 서버에서 반환된 실제 이미지 경로로 업데이트
      if (result.questions && result.questions.length > 0) {
        const updatedQuestions = questions.map((question, index) => {
          const serverQuestion = result.questions[index];
          if (serverQuestion) {
            return {
              ...question,
              // 서버에서 반환된 실제 경로로 업데이트 (imageUrls와 imagePaths는 동일한 값 사용)
              imageUrls: serverQuestion.imageUrls || question.imageUrls,
              imagePaths: serverQuestion.imageUrls || question.imagePaths,
              answerImageUrls: serverQuestion.answerImageUrls || question.answerImageUrls,
              answerImagePaths: serverQuestion.answerImageUrls || question.answerImagePaths,
              // 서버 저장 후 로컬 파일 상태 완전 초기화 (중복 저장 방지)
              imageFiles: [], // 무조건 초기화 - 서버에 저장된 파일은 더 이상 전송하지 않음
              answerImageFiles: [] // 무조건 초기화 - 서버에 저장된 파일은 더 이상 전송하지 않음
            };
          }
          return question;
        });
        setQuestions(updatedQuestions);
      }
      
      // 저장된 데이터 업데이트 (파일 정보 제외하고 데이터만 복사)
      const savedData = questions.map(q => ({
        ...q,
        imageFiles: q.imageFiles ? [...q.imageFiles] : [],
        answerImageFiles: q.answerImageFiles ? [...q.answerImageFiles] : []
      }));
      setSavedQuestions(savedData);
      
    } catch (error) {
      console.error('중간 저장 오류:', error);
      setError(error instanceof Error ? error.message : '중간 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 중간 저장하고 나가기 함수
  const handleSaveAndExit = async () => {
    try {
      await handleIntermediateSave();
      // 저장 성공 후 시험 관리 페이지로 이동
      router.push('/nimda/dashboard/exams');
    } catch (error) {
      console.error('저장하고 나가기 오류:', error);
      // 오류가 있어도 사용자에게 알림은 이미 handleIntermediateSave에서 처리됨
    }
  };

  // 업로드된 시험 데이터를 불러와서 페이지에 자동으로 채우는 함수
  const loadUploadedExamData = async (examId: string, skipExamInfoUpdate = false) => {
    console.log('🔄 [LOAD-EXAM] 시험 데이터 로딩 시작:', examId);
    
    try {
      const token = localStorage.getItem('adminToken');
      console.log('🔑 [LOAD-EXAM] 토큰 상태:', !!token);
      
      console.log('📡 [LOAD-EXAM] API 요청 시작:', `/api/nimda/exams/${examId}`);
      const response = await fetch(`/api/nimda/exams/${examId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('📨 [LOAD-EXAM] API 응답 수신:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (response.ok) {
        const examData = await response.json();
        console.log('🔍 [LOAD-EXAM] API 응답 원본 데이터:', examData);
        console.log('📊 [LOAD-EXAM] 시험 데이터 수신:', examData);
        
        // ✅ [FIX] Backend 응답 구조 수정: {success: true, exam: {...}} 형태
        const actualExamData = examData.exam || examData; // examData.exam으로 접근하도록 수정
        
        // API 응답 데이터 상세 분석
        console.log('🔍 [API-DEBUG] 응답 데이터 상세 분석:');
        console.log('🔍 [API-DEBUG] 원본 응답 구조:', {
          hasSuccess: 'success' in examData,
          hasExam: 'exam' in examData,
          examKeys: actualExamData ? Object.keys(actualExamData) : []
        });
        console.log('🔍 [API-DEBUG] 시험 기본 정보:', {
          id: actualExamData.id,
          grade: actualExamData.grade,
          type: actualExamData.type,
          questionCount: actualExamData.questions?.length || 0 // 소문자 questions
        });
        console.log('🔍 [API-DEBUG] 첫 번째 문제 원본 데이터:', actualExamData.questions?.[0]);
        if (actualExamData.questions?.[0]) {
          console.log('🔍 [API-DEBUG] 첫 번째 문제의 필드들:', Object.keys(actualExamData.questions[0]));
          console.log('🔍 [API-DEBUG] Answer 데이터:', actualExamData.questions[0].answer);
          console.log('🔍 [API-DEBUG] Explanation 데이터:', actualExamData.questions[0].explanation);
        } else {
          console.log('⚠️ [API-DEBUG] 첫 번째 문제에 데이터가 없습니다!');
        }
        
        // 일괄 업로드된 시험 ID 설정 (새 시험 업로드 모드 유지)
        console.log('🔄 [LOAD-EXAM] 업로드 완료된 시험 데이터 로드:', examId);
        setExistingExamId(examId);
        // setIsEditMode(true); // 수정 모드로 전환하지 않고 새 시험 업로드 페이지 상태 유지

        // 문제 데이터 변환 및 설정
        if (actualExamData.questions && actualExamData.questions.length > 0) {
          console.log('📋 [LOAD-EXAM] 문제 데이터 변환 시작:', actualExamData.questions.length, '개 문제');
          
          const transformedQuestions = actualExamData.questions.map((q: any, index: number) => ({
            questionNum: q.questionNum,
            content: q.content || '',
            answer: q.answer || '', // Backend에서 직접 answer 필드로 제공
            explanation: q.explanation || '', // Backend에서 직접 explanation 필드로 제공
            videoUrl: q.videoUrl || '', // Backend에서 직접 videoUrl 필드로 제공
            difficulty: q.difficulty || 'MEDIUM',
              imageFiles: [],
            imageUrls: q.imageUrls || [],
            imagePaths: q.imageUrls || [],
            answerImageFiles: [],
            answerImageUrls: q.answerImageUrls || [], // Backend에서 직접 answerImageUrls 필드로 제공
            answerImagePaths: q.answerImagePaths || [], // Backend에서 직접 answerImagePaths 필드로 제공
            hasValidationErrors: false,
            validationErrors: [],
          }));

          console.log('📋 [LOAD-EXAM] 변환된 문제 데이터:', transformedQuestions.map(q => ({
            questionNum: q.questionNum,
            content: q.content.substring(0, 50) + '...',
            answer: q.answer.substring(0, 30) + '...',
            imageUrls: q.imageUrls?.length || 0,
            answerImageUrls: q.answerImageUrls?.length || 0
          })));

          // React 18 automatic batching 우회하여 즉시 상태 업데이트
          flushSync(() => {
            setQuestions(transformedQuestions);
            setSavedQuestions([...transformedQuestions]); // 저장된 상태도 동기화
          });
          
          console.log('✅ [LOAD-EXAM] 문제 데이터 상태 설정 완료 (flushSync 적용)');
          console.log('🔍 [LOAD-EXAM] 설정된 질문 수:', transformedQuestions.length);
          console.log('🔍 [LOAD-EXAM] 첫 번째 문제 샘플:', {
            content: transformedQuestions[0]?.content?.substring(0, 100) + '...',
            answer: transformedQuestions[0]?.answer,
            imageUrls: transformedQuestions[0]?.imageUrls,
            answerImageUrls: transformedQuestions[0]?.answerImageUrls
          });
          
          // 모든 문제에 대해 유효성 검사 실행
          console.log('🔍 [LOAD-EXAM] 유효성 검사 시작');
          transformedQuestions.forEach((question, index) => {
            const errors = validateQuestion(question);
            question.hasValidationErrors = errors.length > 0;
            question.validationErrors = errors;
            
            if (errors.length > 0) {
              console.log(`⚠️ [LOAD-EXAM] 문제 ${index + 1} 유효성 오류:`, errors);
            }
          });
          console.log('✅ [LOAD-EXAM] 유효성 검사 완료');
          
          // 유효성 검사 결과를 포함한 questions를 다시 state에 적용
          flushSync(() => {
            setQuestions([...transformedQuestions]);
          });
          
          // 첫 번째 문제로 이동
          console.log('🎯 [LOAD-EXAM] 첫 번째 문제로 이동');
          flushSync(() => {
            setCurrentQuestionIndex(0);
            setActiveTab('question');
          });
          console.log('🎯 [LOAD-EXAM] 현재 문제 인덱스 설정:', 0);
          console.log('🎯 [LOAD-EXAM] 활성 탭 설정:', 'question');

          // 첫 번째 문제로 이동 후 실제 폼 필드 값 디버깅
          console.log('🎯 [LOAD-EXAM] 첫 번째 문제로 이동 완료 - 폼 필드 값 확인:');
          const firstQuestion = transformedQuestions[0];
          console.log('📋 [FORM-DEBUG] 첫 번째 문제 데이터:', {
            questionNum: firstQuestion?.questionNum,
            content: firstQuestion?.content,
            answer: firstQuestion?.answer,
            explanation: firstQuestion?.explanation,
            imageUrls: firstQuestion?.imageUrls,
            answerImageUrls: firstQuestion?.answerImageUrls
          });

          // DOM 요소 실제 값 확인 (짧은 지연 후 확인)
          setTimeout(() => {
            console.log('🔍 [DOM-DEBUG] 실제 DOM 요소 값 확인:');
            
            // 마크다운 편집기 (문제 내용)
            const contentEditor = document.querySelector('.w-md-editor-content > div');
            console.log('📝 [DOM-DEBUG] 문제 내용 편집기:', {
              element: !!contentEditor,
              textContent: contentEditor?.textContent?.substring(0, 100) + '...',
              innerHTML: contentEditor?.innerHTML?.substring(0, 100) + '...'
            });
            
            // 정답 입력창
            const answerInput = document.querySelector('input[placeholder*="정답을 입력하세요"]') as HTMLInputElement;
            console.log('💡 [DOM-DEBUG] 정답 입력창:', {
              element: !!answerInput,
              value: answerInput?.value,
              placeholder: answerInput?.placeholder
            });
            
            // 해설 마크다운 편집기
            const explanationEditors = document.querySelectorAll('.w-md-editor-content > div');
            const explanationEditor = explanationEditors[1]; // 두 번째가 해설 편집기
            console.log('📖 [DOM-DEBUG] 해설 편집기:', {
              element: !!explanationEditor,
              textContent: explanationEditor?.textContent?.substring(0, 100) + '...',
              innerHTML: explanationEditor?.innerHTML?.substring(0, 100) + '...'
            });
          }, 500); // 500ms 지연으로 React 렌더링 완료 후 확인
        } else {
          console.log('📋 [LOAD-EXAM] 문제 데이터 없음');
        }
        
        // 시험 기본 정보 업데이트 (일괄 업로드에서 호출될 때는 건너뜀)
        if (!skipExamInfoUpdate) {
          const newExamInfo = {
            grade: actualExamData.grade,
            type: actualExamData.type,
            duration: actualExamData.duration,
            questionCount: actualExamData.questions?.length || 0, // 소문자 questions
            nextExamNumber: actualExamData.examnum, // 회차 정보 설정
            activatedAt: actualExamData.activatedAt ? new Date(actualExamData.activatedAt) : undefined,
            // 기타 시험 정보 필드들도 설정
            isActive: actualExamData.isActive,
            status: actualExamData.status,
            targetQuestions: actualExamData.targetQuestions || actualExamData.questions?.length || 0,
            currentQuestions: actualExamData.currentQuestions || actualExamData.questions?.length || 0,
          };
          console.log('📝 [LOAD-EXAM] 시험 기본 정보 설정 (완전한 정보 포함):', newExamInfo);
          setExamInfo(newExamInfo);
        } else {
          console.log('📝 [LOAD-EXAM] 시험 기본 정보 업데이트 건너뜀 (일괄 업로드 모드)');
        }

        console.log('✅ [LOAD-EXAM] 데이터 로딩 성공');
        
        // 상태 확인을 위한 디버깅 (약간의 지연 후 확인)
        setTimeout(() => {
          console.log('🔍 [DEBUG] 최종 상태 확인:');
          console.log('  - questions 배열 길이:', questions.length);
          console.log('  - currentQuestionIndex:', currentQuestionIndex);
          console.log('  - 현재 문제 데이터:', questions[currentQuestionIndex] ? {
            content: questions[currentQuestionIndex].content?.substring(0, 50) + '...',
            answer: questions[currentQuestionIndex].answer,
            imageUrls: questions[currentQuestionIndex].imageUrls?.length || 0
          } : 'undefined');
          console.log('  - examInfo:', examInfo);
        }, 100);
        
        showStatusToast('업로드된 데이터를 성공적으로 불러왔습니다.', 'success');
        
      } else {
        console.error('❌ [LOAD-EXAM] API 응답 실패');
        const errorText = await response.text();
        console.error('❌ [LOAD-EXAM] 에러 응답 내용:', errorText);
        throw new Error('시험 데이터를 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('💥 [LOAD-EXAM] 데이터 로딩 오류:', error);
      console.error('💥 [LOAD-EXAM] 오류 상세:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      showStatusToast(`데이터 로딩 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`, 'error');
    }
  };

  // 폴더 선택 핸들러
  const handleFolderSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    setSelectedFolder(files);
    
    // problems.json 파일 찾기
    const problemsFile = Array.from(files).find(file => 
      file.name === 'problems.json'
    );
    
    if (problemsFile) {
      try {
        const text = await problemsFile.text();
        const problems = JSON.parse(text);
        setParsedProblems(problems);
        
        showStatusToast('problems.json 파일을 성공적으로 파싱했습니다.', 'success');
      } catch (error) {
        console.error('JSON 파싱 오류:', error);
        setParsedProblems([]);
        showStatusToast('problems.json 파일 파싱 중 오류가 발생했습니다.', 'error');
      }
    } else {
      setParsedProblems([]);
      showStatusToast('problems.json 파일을 찾을 수 없습니다.', 'error');
    }
  };

  // 일괄 업로드 핸들러
  const handleBulkUpload = async () => {
    console.log('🚀 [BULK-UPLOAD] 일괄 업로드 시작');
    
    if (!selectedFolder || parsedProblems.length === 0) {
      console.error('❌ [BULK-UPLOAD] 필수 데이터 누락:', {
        selectedFolder: !!selectedFolder,
        parsedProblemsLength: parsedProblems.length
      });
      return;
    }
    
    setBulkUploadLoading(true);
    
    try {
      // 현재 examInfo 기반으로 최신 nextExamNumber 가져오기
      console.log('🔢 [BULK-UPLOAD] 최신 시험 번호 확인 중...');
      const latestNextNumber = await fetchNextExamNumber(examInfo.grade, examInfo.type);
      
      // 업데이트된 시험 정보 생성
      const updatedExamInfo = {
        ...examInfo,
        nextExamNumber: latestNextNumber,
        questionCount: parsedProblems.length, // 업로드할 문제 수로 설정
      };
      
      console.log('📋 [BULK-UPLOAD] FormData 생성 시작');
      const formData = new FormData();
      
      // 업데이트된 시험 기본 정보 추가
      console.log('📝 [BULK-UPLOAD] 시험 정보 추가:', updatedExamInfo);
      formData.append('examInfo', JSON.stringify(updatedExamInfo));
      
      // problems.json 데이터 추가
      console.log('📊 [BULK-UPLOAD] problems 데이터 추가:', parsedProblems.length, '개 문제');
      formData.append('problems', JSON.stringify(parsedProblems));
      
      // 이미지 파일들 추가
      const imageFiles = Array.from(selectedFolder).filter(file => file.type.startsWith('image/'));
      console.log('🖼️ [BULK-UPLOAD] 이미지 파일 추가:', imageFiles.length, '개 파일');
      imageFiles.forEach((file, index) => {
        console.log(`   - [${index}] ${file.name} (${file.size} bytes)`);
        formData.append('images', file);
      });
      
      // Backend API 호출
      const token = localStorage.getItem('adminToken');
      console.log('🔑 [BULK-UPLOAD] 토큰 상태:', !!token);
      
      console.log('📡 [BULK-UPLOAD] API 요청 시작: /api/nimda/exams/bulk-upload');
      const response = await fetch('/api/nimda/exams/bulk-upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      
      console.log('📨 [BULK-UPLOAD] API 응답 수신:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ [BULK-UPLOAD] API 응답 성공:', result);
        console.log('🔍 [BULK-UPLOAD] result.examId 확인:', {
          hasExamId: 'examId' in result,
          examIdValue: result.examId,
          examIdType: typeof result.examId,
          allResultKeys: Object.keys(result)
        });
        
        showStatusToast('일괄 업로드가 성공적으로 완료되었습니다. 업로드된 내용을 확인하세요.', 'success');
        
        // 현재 페이지의 시험 기본 정보도 업데이트 (시험 정보 섹션에 올바른 값 표시)
        console.log('📝 [BULK-UPLOAD] 현재 페이지 시험 정보 업데이트:', updatedExamInfo);
        setExamInfo(updatedExamInfo);
        
        // examId가 존재하는지 확인 후 데이터 로드
        if (result.examId) {
          console.log('🔄 [BULK-UPLOAD] 업로드된 시험 데이터 로드 시작:', result.examId);
          await loadUploadedExamData(result.examId, true); // skipExamInfoUpdate = true
          console.log('✅ [BULK-UPLOAD] 시험 데이터 로드 완료');
        } else {
          console.error('⚠️ [BULK-UPLOAD] result.examId가 없습니다! API 응답:', result);
        }

        // 현재 상태 최종 확인
        console.log('🔍 [BULK-UPLOAD] 최종 상태 확인:', {
          questionsLength: questions.length,
          currentQuestionIndex,
          activeTab,
          firstQuestionSample: questions[0] ? {
            content: questions[0].content?.substring(0, 50) + '...',
            answer: questions[0].answer,
            explanation: questions[0].explanation?.substring(0, 50) + '...'
          } : null
        });
        
        // 성공적으로 완료된 후 정리 작업
        setBulkUploadModalOpen(false);
        setSelectedFolder(null);
        setParsedProblems([]);
        console.log('🧹 [BULK-UPLOAD] 성공 후 정리 작업 완료');
        
      } else {
        console.error('❌ [BULK-UPLOAD] API 응답 실패');
        const errorText = await response.text();
        console.error('❌ [BULK-UPLOAD] 에러 응답 내용:', errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText || '업로드 실패' };
        }
        
        throw new Error(errorData.message || '업로드 실패');
      }
    } catch (error) {
      console.error('💥 [BULK-UPLOAD] 처리 중 오류:', error);
      console.error('💥 [BULK-UPLOAD] 오류 상세:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      showStatusToast(`일괄 업로드 중 오류가 발생했습니다: ${error.message}`, 'error');
      
      // 에러 발생 시에도 모달 정리
      setBulkUploadModalOpen(false);
      setSelectedFolder(null);
      setParsedProblems([]);
    } finally {
      console.log('🏁 [BULK-UPLOAD] 로딩 상태 정리');
      setBulkUploadLoading(false);
      console.log('🏁 [BULK-UPLOAD] 로딩 정리 완료');
    }
  };

  // 문제 변경 시 자동 저장
  const handleQuestionNavigation = async (newIndex: number) => {
    const currentQuestion = questions[currentQuestionIndex];
    const savedQuestion = savedQuestions[currentQuestionIndex];
    
    // 현재 문제 검증
    validateCurrentQuestion();
    
    // 변경 사항이 있으면 자동 저장 (수정 모드이거나 기존 시험 ID가 있거나 내용이 있는 경우)
    if ((existingExamId || isEditMode || questions.some(q => q.content || q.answer)) && 
        currentQuestion && hasQuestionChanged(currentQuestion, savedQuestion)) {
      await handleIntermediateSave();
    }
    
    setCurrentQuestionIndex(newIndex);
    setActiveTab('question'); // 문제 이동 시 항상 '문제 입력' 탭으로 이동
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const currentQuestion = getCurrentQuestion();
      
      
      const newFiles = Array.from(files);
      const currentImageFiles = currentQuestion?.imageFiles || [];
      const currentImageUrls = currentQuestion?.imageUrls || [];
      const currentImagePaths = currentQuestion?.imagePaths || [];
      
      // 각 파일을 서버에 업로드
      const uploadPromises = newFiles.map(async (file, index) => {
        try {
          const examId = isEditMode ? originalExamId : `${examInfo.type.toLowerCase()}-${examInfo.nextExamNumber?.toString().padStart(2, '0')}`;
          const imageIndex = currentImageFiles.length + index;
          
          const formData = new FormData();
          formData.append('image', file);
          formData.append('examId', String(examId || ''));
          formData.append('questionIndex', currentQuestionIndex.toString());
          formData.append('imageIndex', imageIndex.toString());
          formData.append('imageType', 'question');
          formData.append('examType', examInfo.type);
          formData.append('examNumber', examInfo.nextExamNumber?.toString() || '1');
          formData.append('grade', examInfo.grade.toString());
          
          const token = localStorage.getItem('adminToken');
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/nimda/exams/images/upload`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            body: formData
          });
          
          if (response.ok) {
            const result = await response.json();
            // Backend에서 이미 상대 경로로 반환하므로 직접 사용
            const imagePath = result.imagePath; // 이미 /images/exams/... 형태
            const blobUrl = URL.createObjectURL(file); // 미리보기용 blob URL
            return {
              file,
              url: blobUrl, // 미리보기용 blob URL (즉시 표시)
              path: imagePath, // 복사용 상대 경로 (실제 서버 경로)
              success: true
            };
          } else {
            console.error('이미지 업로드 실패:', response.statusText);
            return {
              file,
              url: URL.createObjectURL(file),
              path: generateExpectedPath(currentQuestionIndex, imageIndex, file.name, 'problem'),
              success: false
            };
          }
        } catch (error) {
          console.error('이미지 업로드 오류:', error);
          return {
            file,
            url: URL.createObjectURL(file),
            path: generateExpectedPath(currentQuestionIndex, currentImageFiles.length + index, file.name, 'problem'),
            success: false
          };
        }
      });
      
      // 모든 업로드가 완료될 때까지 기다림
      const uploadResults = await Promise.all(uploadPromises);
      
      // 업로드 결과를 성공/실패로 분리
      const successfulUploads = uploadResults.filter(r => r.success);
      const failedUploads = uploadResults.filter(r => !r.success);
      
      // 성공한 업로드의 URL과 경로만 추가 (파일 객체는 제외)
      const successUrls = successfulUploads.map(r => r.url);
      const successPaths = successfulUploads.map(r => r.path);
      
      // 실패한 업로드의 파일만 imageFiles에 유지 (재시도 가능하도록)
      const failedFiles = failedUploads.map(r => r.file);
      const failedUrls = failedUploads.map(r => r.url);
      const failedPaths = failedUploads.map(r => r.path);
      
      // 기존 + 성공한 업로드 결과 (중복 제거 적용)
      const allImageUrls = [...currentImageUrls, ...successUrls, ...failedUrls];
      const allImagePaths = [...currentImagePaths, ...successPaths, ...failedPaths];
      
      // 경로 기반으로 중복 제거
      const deduplicatedImagePaths = removeDuplicateImages(allImagePaths);
      
      // 중복 제거된 경로에 맞춰 URL 필터링
      const deduplicatedImageUrls: string[] = [];
      deduplicatedImagePaths.forEach(path => {
        const index = allImagePaths.indexOf(path);
        if (index !== -1) {
          deduplicatedImageUrls.push(allImageUrls[index]);
        }
      });
      
      // imageFiles는 현재 파일 + 실패한 파일만 유지 (성공한 파일은 제외)
      const updatedImageFiles = [...currentImageFiles, ...failedFiles];
      
      handleQuestionChange('imageFiles' as keyof Question, updatedImageFiles);
      handleQuestionChange('imageUrls' as keyof Question, deduplicatedImageUrls);
      handleQuestionChange('imagePaths' as unknown as keyof Question, deduplicatedImagePaths);
    }
  };

  const handleAnswerImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const currentQuestion = getCurrentQuestion();
      
      
      const newFiles = Array.from(files);
      const currentAnswerImageFiles = currentQuestion?.answerImageFiles || [];
      const currentAnswerImageUrls = currentQuestion?.answerImageUrls || [];
      const currentAnswerImagePaths = (currentQuestion as any).answerImagePaths || [];
      
      // 각 파일을 서버에 업로드
      const uploadPromises = newFiles.map(async (file, index) => {
        try {
          const examId = isEditMode ? originalExamId : `${examInfo.type.toLowerCase()}-${examInfo.nextExamNumber?.toString().padStart(2, '0')}`;
          const imageIndex = currentAnswerImageFiles.length + index;
          
          const formData = new FormData();
          formData.append('image', file);
          formData.append('examId', String(examId || ''));
          formData.append('questionIndex', currentQuestionIndex.toString());
          formData.append('imageIndex', imageIndex.toString());
          formData.append('imageType', 'answer');
          formData.append('examType', examInfo.type);
          formData.append('examNumber', examInfo.nextExamNumber?.toString() || '1');
          formData.append('grade', examInfo.grade.toString());
          
          const token = localStorage.getItem('adminToken');
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/nimda/exams/images/upload`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            body: formData
          });
          
          if (response.ok) {
            const result = await response.json();
            // Backend에서 이미 상대 경로로 반환하므로 직접 사용
            const imagePath = result.imagePath; // 이미 /images/exams/... 형태
            const blobUrl = URL.createObjectURL(file); // 미리보기용 blob URL
            return {
              file,
              url: blobUrl, // 미리보기용 blob URL (즉시 표시)
              path: imagePath, // 복사용 상대 경로 (실제 서버 경로)
              success: true
            };
          } else {
            console.error('정답 이미지 업로드 실패:', response.statusText);
            return {
              file,
              url: URL.createObjectURL(file),
              path: generateExpectedPath(currentQuestionIndex, imageIndex, file.name, 'answer'),
              success: false
            };
          }
        } catch (error) {
          console.error('정답 이미지 업로드 오류:', error);
          return {
            file,
            url: URL.createObjectURL(file),
            path: generateExpectedPath(currentQuestionIndex, currentAnswerImageFiles.length + index, file.name, 'answer'),
            success: false
          };
        }
      });
      
      // 모든 업로드가 완료될 때까지 기다림
      const uploadResults = await Promise.all(uploadPromises);
      
      // 업로드 결과를 성공/실패로 분리
      const successfulUploads = uploadResults.filter(r => r.success);
      const failedUploads = uploadResults.filter(r => !r.success);
      
      // 성공한 업로드의 URL과 경로만 추가 (파일 객체는 제외)
      const successUrls = successfulUploads.map(r => r.url);
      const successPaths = successfulUploads.map(r => r.path);
      
      // 실패한 업로드의 파일만 answerImageFiles에 유지 (재시도 가능하도록)
      const failedFiles = failedUploads.map(r => r.file);
      const failedUrls = failedUploads.map(r => r.url);
      const failedPaths = failedUploads.map(r => r.path);
      
      // 기존 + 성공한 업로드 결과 (중복 제거 적용)
      const allAnswerImageUrls = [...currentAnswerImageUrls, ...successUrls, ...failedUrls];
      const allAnswerImagePaths = [...currentAnswerImagePaths, ...successPaths, ...failedPaths];
      
      // 경로 기반으로 중복 제거
      const deduplicatedAnswerImagePaths = removeDuplicateImages(allAnswerImagePaths);
      
      // 중복 제거된 경로에 맞춰 URL 필터링
      const deduplicatedAnswerImageUrls: string[] = [];
      deduplicatedAnswerImagePaths.forEach(path => {
        const index = allAnswerImagePaths.indexOf(path);
        if (index !== -1) {
          deduplicatedAnswerImageUrls.push(allAnswerImageUrls[index]);
        }
      });
      
      // answerImageFiles는 현재 파일 + 실패한 파일만 유지 (성공한 파일은 제외)
      const updatedAnswerImageFiles = [...currentAnswerImageFiles, ...failedFiles];
      
      handleQuestionChange('answerImageFiles', updatedAnswerImageFiles);
      handleQuestionChange('answerImageUrls', deduplicatedAnswerImageUrls);
      handleQuestionChange('answerImagePaths' as unknown as keyof Question, deduplicatedAnswerImagePaths);
    }
  };

  const removeQuestionImage = async (index: number) => {
    const currentQuestion = getCurrentQuestion();
    if (!currentQuestion) return;
    const imagePathToDelete = currentQuestion.imagePaths?.[index];
    
    // 서버에 저장된 이미지 파일이 있는 경우 삭제 시도
    let serverDeletionSuccessful = true;
    if (imagePathToDelete) {
      try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`/api/nimda/images/delete?path=${encodeURIComponent(imagePathToDelete)}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
          console.log('문제 이미지 파일 삭제 완료:', imagePathToDelete);
        } else {
          console.warn('문제 이미지 파일 삭제 실패:', result.error || '알 수 없는 오류');
          // 파일이 존재하지 않는 경우는 삭제 성공으로 간주
          if (response.status === 404 || result.error?.includes('존재하지 않습니다')) {
            console.log('파일이 이미 존재하지 않아 UI에서만 제거합니다.');
          } else {
            serverDeletionSuccessful = false;
            showStatusToast('서버에서 이미지 파일 삭제에 실패했습니다. 다시 시도해주세요.', 'error');
            return; // 서버 삭제 실패 시 UI 삭제도 중단
          }
        }
      } catch (error) {
        console.error('문제 이미지 파일 삭제 요청 실패:', error);
        serverDeletionSuccessful = false;
        showStatusToast('네트워크 오류로 인해 이미지 삭제에 실패했습니다. 다시 시도해주세요.', 'error');
        return; // 네트워크 오류 시 UI 삭제 중단
      }
    }
    
    // 서버 삭제가 성공했거나 서버 파일이 없는 경우에만 UI에서 제거
    if (serverDeletionSuccessful) {
      // blob URL 정리 (메모리 누수 방지)
      const urlToRevoke = currentQuestion.imageUrls?.[index];
      if (urlToRevoke && urlToRevoke.startsWith('blob:')) {
        URL.revokeObjectURL(urlToRevoke);
      }
      
      const newImageFiles = (currentQuestion.imageFiles || []).filter((_, i) => i !== index);
      const newImageUrls = (currentQuestion.imageUrls || []).filter((_, i) => i !== index);
      const newImagePaths = (currentQuestion.imagePaths || []).filter((_, i) => i !== index);
      
      handleQuestionChange('imageFiles' as keyof Question, newImageFiles);
      handleQuestionChange('imageUrls' as keyof Question, newImageUrls);
      handleQuestionChange('imagePaths' as unknown as keyof Question, newImagePaths);
    }
  };

  const removeAnswerImage = async (index: number) => {
    const currentQuestion = getCurrentQuestion();
    if (!currentQuestion) return;
    const imagePathToDelete = currentQuestion.answerImagePaths?.[index];
    
    // 서버에 저장된 이미지 파일이 있는 경우 삭제 시도
    let serverDeletionSuccessful = true;
    if (imagePathToDelete) {
      try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`/api/nimda/images/delete?path=${encodeURIComponent(imagePathToDelete)}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
          console.log('정답 이미지 파일 삭제 완료:', imagePathToDelete);
        } else {
          console.warn('정답 이미지 파일 삭제 실패:', result.error || '알 수 없는 오류');
          // 파일이 존재하지 않는 경우는 삭제 성공으로 간주
          if (response.status === 404 || result.error?.includes('존재하지 않습니다')) {
            console.log('파일이 이미 존재하지 않아 UI에서만 제거합니다.');
          } else {
            serverDeletionSuccessful = false;
            showStatusToast('서버에서 이미지 파일 삭제에 실패했습니다. 다시 시도해주세요.', 'error');
            return; // 서버 삭제 실패 시 UI 삭제도 중단
          }
        }
      } catch (error) {
        console.error('정답 이미지 파일 삭제 요청 실패:', error);
        serverDeletionSuccessful = false;
        showStatusToast('네트워크 오류로 인해 이미지 삭제에 실패했습니다. 다시 시도해주세요.', 'error');
        return; // 네트워크 오류 시 UI 삭제 중단
      }
    }
    
    // 서버 삭제가 성공했거나 서버 파일이 없는 경우에만 UI에서 제거
    if (serverDeletionSuccessful) {
      // blob URL 정리 (메모리 누수 방지)
      const urlToRevoke = currentQuestion.answerImageUrls?.[index];
      if (urlToRevoke && urlToRevoke.startsWith('blob:')) {
        URL.revokeObjectURL(urlToRevoke);
      }
      
      const newAnswerImageFiles = (currentQuestion.answerImageFiles || []).filter((_, i) => i !== index);
      const newAnswerImageUrls = (currentQuestion.answerImageUrls || []).filter((_, i) => i !== index);
      const newAnswerImagePaths = (currentQuestion.answerImagePaths || []).filter((_, i) => i !== index);
      
      handleQuestionChange('answerImageFiles', newAnswerImageFiles);
      handleQuestionChange('answerImageUrls', newAnswerImageUrls);
      handleQuestionChange('answerImagePaths' as unknown as keyof Question, newAnswerImagePaths);
    }
  };

  // 제출 로직을 별도 함수로 분리
  const continueSubmission = async () => {
    try {
      setLoading(true);
    
    const token = localStorage.getItem('adminToken');
    
    // FormData 생성 (이미지 파일 포함)
    const formData = new FormData();
    formData.append('examInfo', JSON.stringify(examInfo));
    formData.append('questions', JSON.stringify(questions.map(q => ({
      ...q,
      imageFiles: undefined, // 파일은 별도로 처리
      imageUrls: undefined,
      answerImageFiles: undefined,
      answerImageUrls: undefined,
      imagePaths: q.imagePaths || [], // 실제 서버 경로 전송
      answerImagePaths: q.answerImagePaths || [] // 실제 서버 경로 전송
    }))));
    
    // 이미지 파일들 추가 (이미 서버에 저장된 파일 제외)
    questions.forEach((question, qIndex) => {
      // 문제 이미지 파일 처리
      if (question.imageFiles && question.imageFiles.length > 0) {
        const imagePaths = question.imagePaths || [];
        const newFiles = question.imageFiles.filter(file => 
          !isFileAlreadyUploaded(file, imagePaths)
        );
        
        newFiles.forEach((file, imgIndex) => {
          formData.append(`question_${qIndex}_image_${imgIndex}`, file);
        });
        
        console.log(`[최종제출] 문제 ${qIndex + 1}: 전체 ${question.imageFiles.length}개 중 ${newFiles.length}개 파일만 전송`);
      }
      
      // 정답 이미지 파일 처리
      if (question.answerImageFiles && question.answerImageFiles.length > 0) {
        const answerImagePaths = question.answerImagePaths || [];
        const newAnswerFiles = question.answerImageFiles.filter(file => 
          !isFileAlreadyUploaded(file, answerImagePaths)
        );
        
        newAnswerFiles.forEach((file, imgIndex) => {
          formData.append(`question_${qIndex}_answer_image_${imgIndex}`, file);
        });
        
        console.log(`[최종제출] 정답 ${qIndex + 1}: 전체 ${question.answerImageFiles.length}개 중 ${newAnswerFiles.length}개 파일만 전송`);
      }
    });

    // 수정 모드인지 새로 생성하는 모드인지 확인
    const url = isEditMode && originalExamId 
      ? `/api/nimda/exams/${originalExamId}` 
      : '/api/nimda/exams/upload';
    
    const method = isEditMode ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: '시험 처리에 실패했습니다.' }));
      throw new Error(errorData.error || '시험 처리에 실패했습니다.');
    }

    const result = await response.json();
    
    // 서버에서 반환된 실제 이미지 경로로 업데이트
    if (result.questions && result.questions.length > 0) {
      const updatedQuestions = questions.map((question, index) => {
        const serverQuestion = result.questions[index];
        if (serverQuestion) {
          return {
            ...question,
            // 서버에서 반환된 실제 경로로 업데이트 (imageUrls와 imagePaths는 동일한 값 사용)
            imageUrls: serverQuestion.imageUrls || question.imageUrls,
            imagePaths: serverQuestion.imageUrls || question.imagePaths,
            answerImageUrls: serverQuestion.answerImageUrls || question.answerImageUrls,
            answerImagePaths: serverQuestion.answerImageUrls || question.answerImagePaths,
            // 서버 저장 후 로컬 파일 상태 완전 초기화 (중복 저장 방지)
            imageFiles: [], // 무조건 초기화 - 서버에 저장된 파일은 더 이상 전송하지 않음
            answerImageFiles: [] // 무조건 초기화 - 서버에 저장된 파일은 더 이상 전송하지 않음
          };
        }
        return question;
      });
      setQuestions(updatedQuestions);
    }
    
    showStatusToast(
      isEditMode ? '시험 수정이 완료되었습니다!' : '시험 업로드가 완료되었습니다!',
      'success'
    );
    
      // 성공 후 적절한 페이지로 리디렉션
      setTimeout(() => {
        router.push('/nimda/dashboard/exams');
      }, 1500);
      
    } catch (error) {
      console.error('Continue submission error:', error);
      const errorMessage = error instanceof Error ? error.message : '시험 처리에 실패했습니다.';
      showStatusToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitExam = async () => {
    try {
      setLoading(true);
      setError('');
      
      // 수정 모드가 아닌 경우에만 모든 문제 검증
      if (!isEditMode) {
        const isValid = validateAllQuestions();
        if (!isValid) {
          setError('모든 필수 입력 필드를 완성해주세요. 미완성 문제는 노란색으로 표시됩니다.');
          setLoading(false);
          return;
        }
      } else {
        // 수정 모드인 경우: 미완성 문제가 있으면 확인 메시지 표시
        const incompleteQuestions = questions.filter(q => !q.content || !q.answer || !q.explanation);
        if (incompleteQuestions.length > 0) {
          showConfirmToast(
            `현재 ${incompleteQuestions.length}개의 문제가 미완성 상태입니다.\n` +
            '미완성 문제:\n' +
            incompleteQuestions.map(q => `- 문제 ${q.questionNum}번`).join('\n') +
            '\n\n그래도 수정 내용을 저장하시겠습니까?',
            async () => {
              // 확인을 누른 경우 제출 계속 진행
              await continueSubmission();
            },
            '저장하기',
            '취소'
          );
          setLoading(false);
          return;
        }
      }
      
      // 검증이 완료된 경우 직접 제출 진행
      await continueSubmission();
    } catch (error) {
      console.error('Exam submit error:', error);
      const errorMessage = error instanceof Error ? error.message : '시험 처리에 실패했습니다.';
      setError(errorMessage);
      showStatusToast(errorMessage, 'error');
      setLoading(false);
    }
  };

  const getCurrentQuestion = (): Question | undefined => {
    const question = questions[currentQuestionIndex];
    // 디버깅용 로그 (너무 자주 호출되므로 조건부로 제한)
    if (Math.random() < 0.1) { // 10% 확률로만 로그 출력
      console.log('🔄 [GET-QUESTION] getCurrentQuestion 호출:', {
        currentIndex: currentQuestionIndex,
        totalQuestions: questions.length,
        hasQuestion: !!question,
        content: question?.content?.substring(0, 50) + '...',
        answer: question?.answer,
        explanation: question?.explanation?.substring(0, 50) + '...'
      });
    }
    return question;
  };

  // 문제 미리보기 데이터 생성
  const convertToPreviewQuestion = (): QuestionType => {
    const currentQuestion = getCurrentQuestion();
    return {
      id: `preview-${currentQuestionIndex}`,
      questionNumber: currentQuestionIndex + 1,
      content: currentQuestion?.content || '',
      condition: '',
      imageUrls: currentQuestion?.imageUrls || [],
      examType: examInfo.type,
      examNum: examInfo.nextExamNumber?.toString() || '1',
      previewType: 'question'
    };
  };

  // 해설 미리보기 데이터 생성
  const convertToPreviewExplanation = (): QuestionType => {
    const currentQuestion = getCurrentQuestion();
    return {
      id: `preview-explanation-${currentQuestionIndex}`,
      questionNumber: currentQuestionIndex + 1,
      content: '',
      explanation: currentQuestion?.explanation || '',
      condition: '', 
      imageUrls: currentQuestion?.answerImageUrls || [],
      examType: examInfo.type,
      examNum: examInfo.nextExamNumber?.toString() || '1',
      previewType: 'explanation'
    };
  };

  // 문제 미리보기 모달 열기
  const handleOpenQuestionPreview = () => {
    const previewData = convertToPreviewQuestion();
    setPreviewQuestion(previewData);
    setPreviewType('question');
    setPreviewModalOpen(true);
  };

  // 해설 미리보기 모달 열기
  const handleOpenExplanationPreview = () => {
    const previewData = convertToPreviewExplanation();
    setPreviewQuestion(previewData);
    setPreviewType('explanation');
    setPreviewModalOpen(true);
  };

  // 미리보기 모달 닫기
  const handleClosePreview = () => {
    setPreviewModalOpen(false);
    setPreviewQuestion(null);
  };

  // ESC 키 처리 (미리보기 모달 및 이미지 뷰어 닫기)
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (previewModalOpen) {
          handleClosePreview();
        } else if (imageViewerOpen) {
          setImageViewerOpen(false);
        }
      }
    };

    if (previewModalOpen || imageViewerOpen) {
      window.addEventListener('keydown', handleEscKey);
      return () => window.removeEventListener('keydown', handleEscKey);
    }
  }, [previewModalOpen, imageViewerOpen]);

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-card rounded-lg shadow border border-default">
          {/* 헤더 */}
          <div className="px-6 py-4 border-b border-default">
            <h1 className="sr-only">{isEditMode ? '시험 수정' : '새 시험 업로드'}</h1>
          </div>

          {error && (
            <div className="px-6 py-4 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
              <div className="text-sm text-red-600 dark:text-red-300">{error}</div>
            </div>
          )}

          <div className="p-6">
            {/* 시험 기본 정보 섹션 - 접을 수 있음 */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-title">시험 기본 정보</h2>
                <div className="flex items-center space-x-4">
                  {/* 일괄 업로드 버튼 - 항상 표시, 클릭 시 자동 접기 */}
                  {!isEditMode && (
                    <button
                      onClick={() => {
                        setIsBasicInfoCollapsed(true); // 자동으로 접기
                        setBulkUploadModalOpen(true);
                      }}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                      </svg>
                      <span>일괄 업로드</span>
                    </button>
                  )}
                  
                  {/* 기존 펼치기/접기 버튼 */}
                  {!isEditMode && (
                    <button
                      onClick={() => setIsBasicInfoCollapsed(!isBasicInfoCollapsed)}
                      className="flex items-center space-x-2 text-body hover:text-title transition-colors"
                    >
                      <span>{isBasicInfoCollapsed ? '펼치기' : '접기'}</span>
                      <svg
                        className={`w-4 h-4 transform transition-transform ${isBasicInfoCollapsed ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              
              {/* 경고 메시지 (새 시험 생성 시에만 표시) */}
              {!isEditMode && (
                <div className="mb-4 text-sm text-red-600 dark:text-red-400">
                  추후 수정이 되지 않습니다. 주의해서 설정해 주세요.
                </div>
              )}
              
              {!isBasicInfoCollapsed && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                    {/* 학년 선택 */}
                    <div>
                      <label className="block text-sm font-medium text-body mb-2">
                        학년
                      </label>
                      <select
                        value={examInfo.grade}
                        onChange={(e) => setExamInfo(prev => ({ ...prev, grade: parseInt(e.target.value) }))}
                        className="w-full px-3 py-2 border border-input bg-card text-title rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      >
                        {[1, 2, 3, 4, 5, 6].map(grade => (
                          <option key={grade} value={grade}>{grade}학년</option>
                        ))}
                      </select>
                    </div>

                    {/* 시험 유형 */}
                    <div>
                      <label className="block text-sm font-medium text-body mb-2">
                        시험 유형
                      </label>
                      <select
                        value={examInfo.type}
                        onChange={(e) => setExamInfo(prev => ({ ...prev, type: e.target.value as ExamInfo['type'] }))}
                        className="w-full px-3 py-2 border border-input bg-card text-title rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      >
                        <option value="FULL">풀</option>
                        <option value="HALF">하프</option>
                        <option value="BEGINNER">비기너</option>
                      </select>
                    </div>

                    {/* 시험 시간 */}
                    <div>
                      <label className="block text-sm font-medium text-body mb-2">
                        시험 시간 (분)
                      </label>
                      <input
                        type="number"
                        value={examInfo.duration}
                        onChange={(e) => setExamInfo(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                        className="w-full px-3 py-2 border border-input bg-card text-title rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        min="1"
                        max="120"
                        required
                      />
                    </div>

                    {/* 문제 수 */}
                    <div>
                      <label className="block text-sm font-medium text-body mb-2">
                        문제 수
                      </label>
                      <select
                        value={examInfo.questionCount}
                        onChange={(e) => setExamInfo(prev => ({ ...prev, questionCount: parseInt(e.target.value) }))}
                        className="w-full px-3 py-2 border border-input bg-card text-title rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      >
                        {Array.from({ length: 50 }, (_, i) => i + 1).map(num => (
                          <option key={num} value={num}>{num}문제</option>
                        ))}
                      </select>
                    </div>

                    {/* 시험 시작 시간 */}
                    <div>
                      <label className="block text-sm font-medium text-body mb-2">
                        시험 시작 시간 (선택사항)
                      </label>
                      <input
                        type="datetime-local"
                        value={examInfo.activatedAt || ''}
                        onChange={(e) => setExamInfo(prev => ({ ...prev, activatedAt: e.target.value }))}
                        className="w-full px-3 py-2 border border-input bg-card text-title rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        min={new Date().toISOString().slice(0, 16)}
                      />
                      <p className="text-xs text-body mt-1">
                        지정하지 않으면 즉시 응시 가능
                      </p>
                    </div>
                  </div>

                </div>
              )}
              
              {/* 접힌 상태일 때 기본 정보 요약 표시 */}
              {isBasicInfoCollapsed && !loading && (
                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex flex-wrap items-center gap-12 text-sm text-body">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-title">학년:</span>
                      <span>{examInfo.grade}학년</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-title">유형:</span>
                      <span>{examInfo.type === 'FULL' ? '풀' : examInfo.type === 'HALF' ? '하프' : '비기너'} 모고</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-title">회차:</span>
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">{examInfo.nextExamNumber}회차</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-title">시간:</span>
                      <span>{examInfo.duration}분</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-title">문제수:</span>
                      <span>{examInfo.questionCount}문제</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-title">시작시간:</span>
                      <span className="whitespace-nowrap">
                        {examInfo.activatedAt 
                          ? new Date(examInfo.activatedAt).toLocaleString('ko-KR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : '즉시 응시 가능'
                        }
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* 로딩 중일 때 기본 정보 요약 대신 로딩 표시 */}
              {isBasicInfoCollapsed && loading && (
                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex items-center justify-center text-sm text-body">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600 dark:border-indigo-400 mr-2"></div>
                    시험 정보를 불러오는 중...
                  </div>
                </div>
              )}
            </div>

            {/* 문제 입력 섹션 */}
            {questions.length > 0 && (
              /* 문제 입력 폼 */
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* 문제 입력 영역 */}
                <div className="lg:col-span-3 space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-title">
                      문제 {currentQuestionIndex + 1} / {examInfo.questionCount}
                    </h2>
                    <div className="flex space-x-2">
                      {/* 미리보기 버튼 제거 - 각 탭의 마크다운 에디터 영역으로 이동 */}
                    </div>
                  </div>


                  {/* 난이도 */}
                  <div>
                    <label className="block text-sm font-medium text-body mb-2">
                      난이도
                    </label>
                    <select
                      value={getCurrentQuestion()?.difficulty || 'MEDIUM'}
                      onChange={(e) => handleQuestionChange('difficulty', e.target.value)}
                      className="w-full px-3 py-2 border border-input bg-card text-title rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="EASY">쉬움</option>
                      <option value="MEDIUM">보통</option>
                      <option value="HARD">어려움</option>
                    </select>
                  </div>



                  {/* 탭 버튼 */}
                  <div className="flex space-x-1 border-b border-default mb-6">
                    <button
                      onClick={() => setActiveTab('question')}
                      className={`px-4 py-2 text-sm font-medium transition-colors ${
                        activeTab === 'question'
                          ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                          : 'text-muted hover:text-body'
                      }`}
                    >
                      문제 입력
                    </button>
                    <button
                      onClick={() => setActiveTab('answer')}
                      className={`px-4 py-2 text-sm font-medium transition-colors ${
                        activeTab === 'answer'
                          ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                          : 'text-muted hover:text-body'
                      }`}
                    >
                      정답 입력
                    </button>
                  </div>

                  {/* 탭 내용 컨테이너 - 고정 높이 */}
                  <div className="min-h-[650px]">
                    {/* 문제 탭 내용 */}
                    {activeTab === 'question' && (
                      <div className="space-y-6">
                        {/* 문제 내용 */}
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <label className="text-sm font-medium text-body">
                              문제 내용
                            </label>
                            <button
                              onClick={handleOpenQuestionPreview}
                              className="flex items-center space-x-1 px-3 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              <span>미리보기</span>
                            </button>
                          </div>
                          <div className="border border-input rounded-md">
                            <MDEditor
                              value={getCurrentQuestion()?.content || ''}
                              onChange={(value) => handleQuestionChange('content', value || '')}
                              preview="edit"
                              height={400}
                              data-color-mode="light"
                            />
                          </div>
                          {getCurrentQuestion()?.validationErrors?.includes('문제 내용을 입력하세요.') && (
                            <div className="text-sm text-red-600 dark:text-red-400 mt-1">
                              문제 내용을 입력하세요.
                            </div>
                          )}
                        </div>

                        {/* 문제 이미지 업로드 */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-body">
                              문제 이미지 (선택사항)
                            </label>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImageUpload}
                            className="w-full px-3 py-2 border border-input bg-card text-title rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          {getCurrentQuestion()?.imageUrls && getCurrentQuestion()!.imageUrls!.length > 0 && (
                            <div className="mt-2 max-h-48 overflow-y-auto">
                              <div className="grid grid-cols-5 gap-3">
                                {getCurrentQuestion()!.imageUrls!.map((url, index) => (
                                  <div key={index} className="relative">
                                    <div className="relative group">
                                      <img
                                        src={url}
                                        alt={`문제 이미지 ${index + 1}`}
                                        className="w-full h-20 object-contain border border-default rounded-lg cursor-pointer bg-muted"
                                        onClick={() => openImageViewer(url)}
                                      />
                                      <button
                                        onClick={() => removeQuestionImage(index)}
                                        className="absolute top-1 right-1 bg-red-500 dark:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 dark:hover:bg-red-500"
                                      >
                                        ×
                                      </button>
                                    </div>
                                    <div className="mt-1 text-xs text-body break-all">
                                      <div className="flex items-center justify-between">
                                        <span className="truncate flex-1">
                                          {getCurrentQuestion()?.imagePaths?.[index] || '경로 생성 오류'}
                                        </span>
                                        <button
                                          onClick={async () => {
                                            const pathToCopy = getCurrentQuestion()?.imagePaths?.[index] || '';
                                            if (pathToCopy) {
                                              await copyWithoutNotification(pathToCopy);
                                              setCopiedImageIndex({type: 'question', index});
                                              setTimeout(() => setCopiedImageIndex(null), 2000);
                                            }
                                          }}
                                          className={`ml-1 px-2 py-1 rounded text-xs transition-colors ${
                                            copiedImageIndex?.type === 'question' && copiedImageIndex?.index === index
                                              ? 'bg-blue-700 dark:bg-blue-800 text-white'
                                              : 'bg-blue-500 dark:bg-blue-600 text-white hover:bg-blue-600 dark:hover:bg-blue-500'
                                          }`}
                                          title="경로 복사"
                                        >
                                          {copiedImageIndex?.type === 'question' && copiedImageIndex?.index === index ? '복사됨' : '복사'}
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 정답 탭 내용 */}
                    {activeTab === 'answer' && (
                      <div className="space-y-6">
                        {/* 정답 */}
                        <div>
                          <label className="block text-sm font-medium text-body mb-2">
                            정답
                          </label>
                          <input
                            type="text"
                            value={getCurrentQuestion()?.answer || ''}
                            onChange={(e) => handleQuestionChange('answer', e.target.value)}
                            className="w-full px-3 py-2 border border-input bg-card text-title rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="정답을 입력하세요 (예: 1, 2, 3, 4, 5)"
                          />
                          <div className="text-sm text-body mt-2">
                            <p>정답을 간단히 입력하세요. 객관식의 경우 번호를, 주관식의 경우 답을 입력하세요.</p>
                          </div>
                          {getCurrentQuestion()?.validationErrors?.includes('정답을 입력하세요.') && (
                            <div className="text-sm text-red-600 dark:text-red-400 mt-1">
                              정답을 입력하세요.
                            </div>
                          )}
                        </div>

                        {/* 해설 */}
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <label className="text-sm font-medium text-body">
                              해설
                            </label>
                            <button
                              onClick={handleOpenExplanationPreview}
                              className="flex items-center space-x-1 px-3 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              <span>미리보기</span>
                            </button>
                          </div>
                          <div className="border border-input rounded-md">
                            <MDEditor
                              value={getCurrentQuestion()?.explanation || ''}
                              onChange={(value) => handleQuestionChange('explanation', value || '')}
                              preview="edit"
                              height={400}
                              data-color-mode="light"
                            />
                          </div>
                          {getCurrentQuestion()?.validationErrors?.includes('해설을 입력하세요.') && (
                            <div className="mt-1 text-sm text-red-600 dark:text-red-400">
                              해설을 입력하세요.
                            </div>
                          )}
                        </div>

                        {/* 정답 이미지 */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-body">
                              정답 이미지 (선택사항)
                            </label>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleAnswerImageUpload}
                            className="w-full px-3 py-2 border border-input bg-card text-title rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          {getCurrentQuestion()?.answerImageUrls && getCurrentQuestion()!.answerImageUrls!.length > 0 && (
                            <div className="mt-2 max-h-48 overflow-y-auto">
                              <div className="grid grid-cols-5 gap-3">
                                {getCurrentQuestion()!.answerImageUrls!.map((url, index) => (
                                  <div key={index} className="relative">
                                    <div className="relative group">
                                      <img
                                        src={url}
                                        alt={`정답 이미지 ${index + 1}`}
                                        className="w-full h-20 object-contain border border-default rounded-lg cursor-pointer bg-muted"
                                        onClick={() => openImageViewer(url)}
                                      />
                                      <button
                                        onClick={() => removeAnswerImage(index)}
                                        className="absolute top-1 right-1 bg-red-500 dark:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 dark:hover:bg-red-500"
                                      >
                                        ×
                                      </button>
                                    </div>
                                    <div className="mt-1 text-xs text-body break-all">
                                      <div className="flex items-center justify-between">
                                        <span className="truncate flex-1">
                                          {getCurrentQuestion()?.answerImagePaths?.[index] || '경로 생성 오류'}
                                        </span>
                                        <button
                                          onClick={async () => {
                                            const pathToCopy = getCurrentQuestion()?.answerImagePaths?.[index] || '';
                                            if (pathToCopy) {
                                              await copyWithoutNotification(pathToCopy);
                                              setCopiedImageIndex({type: 'answer', index});
                                              setTimeout(() => setCopiedImageIndex(null), 2000);
                                            }
                                          }}
                                          className={`ml-1 px-2 py-1 rounded text-xs transition-colors ${
                                            copiedImageIndex?.type === 'answer' && copiedImageIndex?.index === index
                                              ? 'bg-blue-700 dark:bg-blue-800 text-white'
                                              : 'bg-blue-500 dark:bg-blue-600 text-white hover:bg-blue-600 dark:hover:bg-blue-500'
                                          }`}
                                          title="경로 복사"
                                        >
                                          {copiedImageIndex?.type === 'answer' && copiedImageIndex?.index === index ? '복사됨' : '복사'}
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* 해설 동영상 URL */}
                        <div>
                          <label className="block text-sm font-medium text-body mb-2">
                            해설 동영상 URL (선택사항)
                          </label>
                          <input
                            type="url"
                            value={getCurrentQuestion()?.videoUrl || ''}
                            onChange={(e) => handleQuestionChange('videoUrl', e.target.value)}
                            className="w-full px-3 py-2 border border-input bg-card text-title rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="https://..."
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 문제 목록 사이드바 */}
                <div className="lg:col-span-1">
                  <div className="sticky top-4 bg-muted rounded-lg">
                    {/* 사이드바 헤더 */}
                    <div className="p-4 border-b border-default">
                      <h3 className="text-sm font-medium text-title">문제 목록</h3>
                    </div>

                    {/* 문제 목록 */}
                    <div className="p-4">
                      <div className="space-y-2 h-[350px] overflow-y-auto">
                        {questions.map((question, index) => {
                          const isComplete = question.content && question.answer && question.explanation;
                          const hasErrors = question.hasValidationErrors || false;
                          
                          return (
                            <button
                              key={index}
                              onClick={() => handleQuestionNavigation(index)}
                              className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                                index === currentQuestionIndex
                                  ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-600'
                                  : isEditMode 
                                  ? (isComplete 
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50'
                                    : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-900/50 border border-yellow-300 dark:border-yellow-600')
                                  : (hasErrors
                                    ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-900/50 border border-yellow-300 dark:border-yellow-600'
                                    : isComplete
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50'
                                    : 'bg-card text-body hover:bg-hover')
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span>문제 {index + 1}</span>
                                {isEditMode ? (
                                  isComplete ? (
                                    <span className="text-xs text-green-600 dark:text-green-400">✓</span>
                                  ) : (
                                    <span className="text-xs text-yellow-600 dark:text-yellow-400">⚠</span>
                                  )
                                ) : (
                                  <>
                                    {hasErrors && (
                                      <span className="text-xs text-yellow-600 dark:text-yellow-400">⚠</span>
                                    )}
                                    {!hasErrors && isComplete && (
                                      <span className="text-xs text-green-600 dark:text-green-400">✓</span>
                                    )}
                                  </>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 문제 이동 버튼 */}
                    <div className="p-4 border-t border-default">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleQuestionNavigation(Math.max(0, currentQuestionIndex - 1))}
                          disabled={currentQuestionIndex === 0}
                          className="flex-1 px-3 py-2 text-sm bg-card text-body rounded hover:bg-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          ← 이전
                        </button>
                        <button
                          onClick={() => handleQuestionNavigation(Math.min(questions.length - 1, currentQuestionIndex + 1))}
                          disabled={currentQuestionIndex === questions.length - 1}
                          className="flex-1 px-3 py-2 text-sm bg-card text-body rounded hover:bg-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          다음 →
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 하단 액션 버튼 */}
            {questions.length > 0 && (
              <div className="mt-8 flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  {/* 신규 시험 생성 시에만 중간 저장하고 나가기 버튼 표시 */}
                  {!editExamId && (
                    <button
                      onClick={handleSaveAndExit}
                      disabled={saving}
                      className="px-6 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {saving ? '저장 중...' : '중간 저장하고 나가기'}
                    </button>
                  )}
                  <div className="flex items-center space-x-2">
                    {saving && (
                      <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 dark:border-blue-400"></div>
                        <span className="text-sm">저장 중...</span>
                      </div>
                    )}
                    {!saving && lastSavedTime && (
                      <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm">저장됨 ({lastSavedTime})</span>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleSubmitExam}
                  disabled={loading || (!isEditMode && questions.some(q => !q.content || !q.answer))}
                  className="px-6 py-2 bg-green-600 dark:bg-green-700 text-white rounded-md hover:bg-green-700 dark:hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading 
                    ? (isEditMode ? '수정 중...' : '업로드 중...')
                    : (isEditMode ? '시험 수정' : '시험 업로드')
                  }
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 이미지 뷰어 모달 */}
      {imageViewerOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="relative max-w-4xl max-h-[90vh] m-4">
            <img
              src={imageViewerSrc}
              alt="확대 이미지"
              className="max-w-full max-h-full object-contain"
            />
            <button
              onClick={() => setImageViewerOpen(false)}
              className="absolute top-4 right-4 bg-black bg-opacity-50 dark:bg-opacity-70 text-white rounded-full w-8 h-8 flex items-center justify-center text-xl hover:bg-opacity-70 dark:hover:bg-opacity-90"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* 문제 미리보기 모달 */}
      {previewModalOpen && previewQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="relative w-full max-w-4xl max-h-[90vh] m-4 bg-card rounded-lg shadow-lg overflow-hidden">
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between p-4 border-b border-default bg-muted">
              <h3 className="text-lg font-semibold text-title">
                {previewType === 'question' ? '문제 미리보기' : '해설 미리보기'}
              </h3>
              <button
                onClick={handleClosePreview}
                className="p-1 hover:bg-hover rounded-md transition-colors"
              >
                <svg className="w-5 h-5 text-body" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 안내 메시지 */}
            <div className="px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-700">
              <p className="text-sm text-blue-800 dark:text-blue-300 text-center">
                ℹ️ 실제 시험에서 보이는 모습을 미리 확인할 수 있습니다.
              </p>
            </div>
            
            {/* 모달 내용 */}
            <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="w-full max-w-4xl bg-card rounded-lg shadow-sm border-default p-8">
                {previewType === 'question' ? (
                  <QuestionContent question={previewQuestion} />
                ) : (
                  <div className="prose prose-lg max-w-none prose-gray dark:prose-invert prose-headings:text-title prose-p:text-body prose-p:leading-relaxed prose-strong:text-title">
                    <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[rehypeKatex, rehypeRaw]}
                    components={createMarkdownComponents({
                      questionNumber: previewQuestion.questionNumber,
                      imageErrorPrefix: '해설 이미지 로드 실패',
                      blockquoteStyle: 'default'
                    })}
                    >
                      {previewQuestion.explanation || '해설이 입력되지 않았습니다.'}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </div>

            {/* 모달 푸터 */}
            <div className="px-6 py-4 bg-muted border-t border-default">
              <div className="flex justify-end">
                <button
                  onClick={handleClosePreview}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast 컴포넌트들 */}
      <ConfirmToast
        isVisible={confirmToast.isVisible}
        message={confirmToast.message}
        onConfirm={confirmToast.onConfirm}
        onCancel={closeConfirmToast}
        confirmText={confirmToast.confirmText}
        cancelText={confirmToast.cancelText}
      />

      <SaveStatusToast
        isVisible={statusToast.isVisible}
        message={statusToast.message}
        type={statusToast.type}
        onClose={closeStatusToast}
      />

      {/* 일괄 업로드 모달 */}
      {bulkUploadModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-card rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-title">시험 일괄 업로드</h3>
              <button
                onClick={() => setBulkUploadModalOpen(false)}
                className="text-muted hover:text-title"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              {/* 폴더 선택 */}
              <div>
                <label className="block text-sm font-medium text-body mb-2">
                  시험 폴더 선택 (problems.json + images 폴더 포함)
                </label>
                <input
                  type="file"
                  webkitdirectory=""
                  multiple
                  onChange={handleFolderSelect}
                  className="w-full p-2 border border-input rounded-md bg-card text-title"
                />
              </div>
              
              {/* 파싱된 문제 미리보기 */}
              {parsedProblems.length > 0 && (
                <div>
                  <h4 className="font-medium text-title mb-2">감지된 문제: {parsedProblems.length}개</h4>
                  <div className="bg-muted rounded max-h-80 overflow-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="px-2 py-2 text-left text-title">번호</th>
                          <th className="px-2 py-2 text-left text-title">내용</th>
                          <th className="px-2 py-2 text-center text-title">이미지</th>
                          <th className="px-2 py-2 text-center text-title">조건</th>
                          <th className="px-2 py-2 text-center text-title">조건이미지</th>
                          <th className="px-2 py-2 text-center text-title">답</th>
                          <th className="px-2 py-2 text-center text-title">해설</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedProblems.map((problem, idx) => (
                          <tr key={idx} className="border-b border-border hover:bg-background">
                            <td className="px-2 py-2 text-body">{problem.prob_num}</td>
                            <td className="px-2 py-2 text-body max-w-xs">
                              <div className="truncate" title={problem.prob_text}>
                                {problem.prob_text.substring(0, 30)}...
                              </div>
                            </td>
                            <td className="px-2 py-2 text-center">
                              {problem.prob_image && problem.prob_image.trim() !== '' ? (
                                <span className="text-green-600 text-lg font-bold">✓</span>
                              ) : (
                                <span className="text-muted text-lg">-</span>
                              )}
                            </td>
                            <td className="px-2 py-2 text-center">
                              {problem.cond_text && problem.cond_text.length > 0 ? (
                                <span className="text-green-600 text-lg font-bold">✓</span>
                              ) : (
                                <span className="text-muted text-lg">-</span>
                              )}
                            </td>
                            <td className="px-2 py-2 text-center">
                              {problem.cond_image && problem.cond_image.trim() !== '' ? (
                                <span className="text-green-600 text-lg font-bold">✓</span>
                              ) : (
                                <span className="text-muted text-lg">-</span>
                              )}
                            </td>
                            <td className="px-2 py-2 text-center">
                              {problem.prob_ans && problem.prob_ans.trim() !== '' ? (
                                <span className="text-green-600 text-lg font-bold">✓</span>
                              ) : (
                                <span className="text-red-600 text-lg font-bold">✗</span>
                              )}
                            </td>
                            <td className="px-2 py-2 text-center">
                              {problem.prob_sol && problem.prob_sol.trim() !== '' ? (
                                <span className="text-green-600 text-lg font-bold">✓</span>
                              ) : (
                                <span className="text-red-600 text-lg font-bold">✗</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              {/* 업로드 버튼 */}
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setBulkUploadModalOpen(false)}
                  className="px-4 py-2 text-muted hover:text-title"
                >
                  취소
                </button>
                <button
                  onClick={handleBulkUpload}
                  disabled={!selectedFolder || parsedProblems.length === 0 || bulkUploadLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {bulkUploadLoading ? '업로드 중...' : '업로드 시작'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default function ExamUploadPage() {
  return (
    <Suspense fallback={
      <AdminLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-card rounded-lg shadow border border-default">
            <div className="px-6 py-4 border-b border-default">
              <h1 className="text-2xl font-bold text-title">시험 업로드</h1>
            </div>
            <div className="p-6">
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400 mx-auto mb-4"></div>
                <p className="text-body">시험 업로드 페이지를 불러오는 중...</p>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    }>
      <ExamUploadPageContent />
    </Suspense>
  );
}