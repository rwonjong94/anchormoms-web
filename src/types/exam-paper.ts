export interface ExamPaper {
  id: string;
  type: string;
  title: string;
  subtitle?: string;
  content: string;
  price: number;
  saleRate: number;
  saleStartDate?: string;
  saleEndDate?: string;
  productFile?: string;
  thumbnailImage?: string;
  downloadCount: number;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ExamPaperListResponse {
  examPapers: ExamPaper[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateExamPaperDto {
  type: string;
  title: string;
  subtitle?: string;
  content: string;
  price?: number;
  saleRate?: number;
  saleStartDate?: string;
  saleEndDate?: string;
  productFile?: string;
  thumbnailImage?: string;
}

export type UpdateExamPaperDto = Partial<CreateExamPaperDto>;