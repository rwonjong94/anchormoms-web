import useSWR from 'swr';
import { ExamPaper, ExamPaperListResponse, CreateExamPaperDto, UpdateExamPaperDto } from '@/types/exam-paper';

const fetcher = async (url: string) => {
  const token = localStorage.getItem('adminToken');
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch exam papers');
  }

  return response.json();
};

export function useExamPapers(page = 1, limit = 20, type?: string) {
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  
  if (type) {
    queryParams.append('type', type);
  }

  const { data, error, mutate } = useSWR<ExamPaperListResponse>(
    `/api/nimda/stores/exam-papers?${queryParams.toString()}`,
    fetcher
  );

  return {
    examPapers: data?.examPapers || [],
    pagination: data?.pagination,
    loading: !error && !data,
    error,
    mutate,
  };
}

export function useExamPaperTypes() {
  const { data, error, mutate } = useSWR<string[]>(
    '/api/nimda/stores/exam-papers/types',
    fetcher
  );

  return {
    types: data || [],
    loading: !error && !data,
    error,
    mutate,
  };
}

export function useExamPaper(id: string) {
  const { data, error, mutate } = useSWR<ExamPaper>(
    id ? `/api/nimda/stores/exam-papers/${id}` : null,
    fetcher
  );

  return {
    examPaper: data,
    loading: !error && !data,
    error,
    mutate,
  };
}

export async function createExamPaper(data: CreateExamPaperDto): Promise<ExamPaper> {
  const token = localStorage.getItem('adminToken');
  const response = await fetch('/api/nimda/stores/exam-papers', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to create exam paper');
  }

  return response.json();
}

export async function updateExamPaper(id: string, data: UpdateExamPaperDto): Promise<ExamPaper> {
  const token = localStorage.getItem('adminToken');
  const response = await fetch(`/api/nimda/stores/exam-papers/${id}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to update exam paper');
  }

  return response.json();
}

export async function deleteExamPaper(id: string): Promise<void> {
  const token = localStorage.getItem('adminToken');
  const response = await fetch(`/api/nimda/stores/exam-papers/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to delete exam paper');
  }
}

export async function incrementDownloadCount(id: string): Promise<void> {
  const token = localStorage.getItem('adminToken');
  const response = await fetch(`/api/nimda/stores/exam-papers/${id}/download`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to increment download count');
  }
}

export async function uploadThumbnail(id: string, file: File): Promise<{ imagePath: string }> {
  const token = localStorage.getItem('adminToken');
  const formData = new FormData();
  formData.append('thumbnail', file);

  const response = await fetch(`/api/nimda/stores/exam-papers/${id}/upload-thumbnail`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to upload thumbnail');
  }

  return response.json();
}

export async function uploadImage(id: string, file: File): Promise<{ imagePath: string; fileName: string }> {
  const token = localStorage.getItem('adminToken');
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(`/api/nimda/stores/exam-papers/${id}/upload-image`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to upload image');
  }

  return response.json();
}

export async function uploadAttachment(id: string, file: File): Promise<{ filePath: string; fileName: string; fileSize: number }> {
  const token = localStorage.getItem('adminToken');
  const formData = new FormData();
  formData.append('attachment', file);

  const response = await fetch(`/api/nimda/stores/exam-papers/${id}/upload-attachment`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to upload attachment');
  }

  return response.json();
}