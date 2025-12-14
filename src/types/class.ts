// 수업 관련 공통 타입 정의

export interface Student {
  id: string;
  name: string;
  grade: number;
  school?: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface ClassLecture {
  id: string;
  name: string;
  description: string;
  subject: string;
  grade: number;
  schedule: any;
  students: Student[];
  createdAt: string;
  updatedAt: string;
}

export interface ClassLog {
  id: string;
  title?: string; // 기존 호환성을 위해 optional로 유지
  content: string;
  homework?: string;
  notice?: string;
  date: string;
  classLecture: ClassLecture;
  createdAt: string;
  updatedAt: string;
}

export interface CounselingLog {
  id: string;
  title: string;
  content: string;
  date: string;
  student?: Student;
  createdAt: string;
  updatedAt: string;
}

export type TabType = '수업 관리' | '수업 일지';
