import { ExamCache, StudentAnswer, ExamSession } from '@/types/exam';

const CACHE_KEY = 'mogo_exam_cache';

export class ExamCacheManager {
  static saveCache(cache: ExamCache): void {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        ...cache,
        lastSaved: new Date().toISOString(),
      }));
    } catch (error) {
      console.error('Failed to save exam cache:', error);
    }
  }

  static loadCache(): ExamCache | null {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      const data = JSON.parse(cached);
      return {
        ...data,
        examSession: {
          ...data.examSession,
          startTime: new Date(data.examSession.startTime),
        },
        lastSaved: new Date(data.lastSaved),
      };
    } catch (error) {
      console.error('Failed to load exam cache:', error);
      return null;
    }
  }

  static clearCache(): void {
    try {
      localStorage.removeItem(CACHE_KEY);
    } catch (error) {
      console.error('Failed to clear exam cache:', error);
    }
  }

  static saveAnswer(questionNumber: number, answer: StudentAnswer): void {
    const cache = this.loadCache();
    if (!cache) return;

    cache.answers[questionNumber] = answer;
    cache.lastSaved = new Date();
    this.saveCache(cache);
  }

  static getAnswer(questionNumber: number): StudentAnswer | null {
    const cache = this.loadCache();
    if (!cache) return null;

    return cache.answers[questionNumber] || null;
  }

  static setCurrentQuestion(questionNumber: number): void {
    const cache = this.loadCache();
    if (!cache) return;

    cache.currentQuestion = questionNumber;
    this.saveCache(cache);
  }

  static initializeCache(examSession: ExamSession): void {
    const cache: ExamCache = {
      examSession,
      answers: {},
      currentQuestion: 1,
      lastSaved: new Date(),
    };
    this.saveCache(cache);
  }
} 