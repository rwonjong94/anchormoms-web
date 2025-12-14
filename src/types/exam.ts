export interface Question {
  id: string;
  questionNumber: number;
  content: string;
  condition?: string;
  imageUrls?: string[];
  explanation?: string;
  previewType?: 'question' | 'explanation';
  examType: string;
  examNum: string;
}

export interface ExamSession {
  examType: string;
  examNum: string;
  studentId?: string;
  startTime: Date;
  duration: number; // minutes
  questions: Question[];
  timerEnabled: boolean;
}

export interface StudentAnswer {
  questionId: string;
  questionNumber: number;
  answer: string;
  timestamp: Date;
}

export interface QuestionStatus {
  questionNumber: number;
  completed: boolean;
  marked: boolean;
}

export interface ExamCache {
  examSession: ExamSession;
  answers: Record<number, StudentAnswer>;
  currentQuestion: number;
  lastSaved: Date;
}

export interface TimerState {
  visible: boolean;
  running: boolean;
  timeRemaining: number; // seconds
} 