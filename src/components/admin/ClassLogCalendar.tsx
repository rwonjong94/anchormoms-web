'use client';

import { useState, useMemo } from 'react';
import { type ClassLog } from '@/dto';

interface ClassLecture {
  id: string;
  name: string;
  description: string;
  subject: string;
  grade: number;
  schedule: any;
  startDate?: string; // 개강일
  endDate?: string;   // 종강일
  students: Array<{ id: string; name: string; grade: number; school?: string }>;
}

interface ClassLogCalendarProps {
  classes: ClassLecture[];
  classLogs: ClassLog[];
  selectedClassFilter: string;
  onLogClick: (classId: string, date: string, existingLog?: ClassLog) => void;
  currentDate?: Date;
  onDateChange?: (date: Date) => void;
}

// 요일 매핑
const DAY_MAP: Record<string, number> = {
  '일': 0, '월': 1, '화': 2, '수': 3, '목': 4, '금': 5, '토': 6
};

// 수업별 색상
const CLASS_COLORS = [
  { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-300 dark:border-blue-700' },
  { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', border: 'border-green-300 dark:border-green-700' },
  { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-300 dark:border-purple-700' },
  { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-300 dark:border-orange-700' },
  { bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-700 dark:text-pink-300', border: 'border-pink-300 dark:border-pink-700' },
  { bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-700 dark:text-cyan-300', border: 'border-cyan-300 dark:border-cyan-700' },
  { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-300 dark:border-amber-700' },
  { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-300 dark:border-indigo-700' },
];

function parseSchedule(schedule: any): Array<{ day: string; start: string; end: string }> {
  try {
    let scheduleData = schedule;
    if (typeof schedule === 'string') {
      scheduleData = JSON.parse(schedule);
    }
    if (Array.isArray(scheduleData)) {
      return scheduleData.filter(s => s.day && s.start && s.end);
    }
    return [];
  } catch {
    return [];
  }
}

function getClassColor(index: number) {
  return CLASS_COLORS[index % CLASS_COLORS.length];
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isSameDate(date1: string, date2: string): boolean {
  return date1.substring(0, 10) === date2.substring(0, 10);
}

export default function ClassLogCalendar({
  classes,
  classLogs,
  selectedClassFilter,
  onLogClick,
  currentDate: controlledDate,
  onDateChange,
}: ClassLogCalendarProps) {
  const [internalDate, setInternalDate] = useState(new Date());

  // 외부에서 제어하는 경우 외부 상태 사용, 아니면 내부 상태 사용
  const currentDate = controlledDate ?? internalDate;
  const setCurrentDate = (date: Date) => {
    if (onDateChange) {
      onDateChange(date);
    } else {
      setInternalDate(date);
    }
  };

  // 표시할 수업들
  const filteredClasses = useMemo(() => {
    if (selectedClassFilter) {
      return classes.filter(c => c.id === selectedClassFilter);
    }
    return classes;
  }, [classes, selectedClassFilter]);

  // 수업별 색상 인덱스 매핑
  const classColorMap = useMemo(() => {
    const map = new Map<string, number>();
    classes.forEach((c, idx) => {
      map.set(c.id, idx);
    });
    return map;
  }, [classes]);

  // 현재 월의 날짜들
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // 이번 달 첫날과 마지막날
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // 달력에 표시할 시작일 (이전 달 포함)
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    // 달력에 표시할 종료일 (다음 달 포함)
    const endDate = new Date(lastDay);
    const remaining = 6 - lastDay.getDay();
    endDate.setDate(endDate.getDate() + remaining);

    const days: Date[] = [];
    const current = new Date(startDate);
    while (current <= endDate) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  }, [currentDate]);

  // 각 날짜에 해당하는 수업들 계산
  const dayClassMap = useMemo(() => {
    const map = new Map<string, Array<{ classInfo: ClassLecture; scheduleEntry: { day: string; start: string; end: string }; log?: ClassLog }>>();

    calendarDays.forEach(date => {
      const dateStr = formatDate(date);
      const dayOfWeek = date.getDay();
      const entries: Array<{ classInfo: ClassLecture; scheduleEntry: { day: string; start: string; end: string }; log?: ClassLog }> = [];

      filteredClasses.forEach(cls => {
        // 개강일이 없으면 해당 수업은 달력에 표시하지 않음
        if (!cls.startDate) return;

        // 날짜만 비교하기 위해 YYYY-MM-DD 문자열로 변환 (타임존 이슈 방지)
        const startDateStr = cls.startDate.substring(0, 10);

        // 개강일 이전의 날짜는 표시하지 않음 (문자열 비교)
        if (dateStr < startDateStr) return;

        // 종강일이 있고, 종강일 이후의 날짜는 표시하지 않음
        if (cls.endDate) {
          const endDateStr = cls.endDate.substring(0, 10);
          if (dateStr > endDateStr) return;
        }

        const schedules = parseSchedule(cls.schedule);
        schedules.forEach(sched => {
          if (DAY_MAP[sched.day] === dayOfWeek) {
            // 해당 날짜에 이미 작성된 로그가 있는지 확인
            const existingLog = classLogs.find(log =>
              log.classLecture?.id === cls.id && isSameDate(log.date, dateStr)
            );
            entries.push({
              classInfo: cls,
              scheduleEntry: sched,
              log: existingLog,
            });
          }
        });
      });

      if (entries.length > 0) {
        map.set(dateStr, entries);
      }
    });

    return map;
  }, [calendarDays, filteredClasses, classLogs]);

  const goToPrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const isCurrentMonth = (date: Date): boolean => {
    return date.getMonth() === currentDate.getMonth();
  };

  return (
    <div className="bg-card rounded-lg shadow-sm border border-default overflow-hidden">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-default">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-title">
            {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
          </h2>
          <button
            onClick={goToToday}
            className="px-3 py-1 text-sm bg-muted/50 hover:bg-muted text-body rounded-md transition-colors"
          >
            오늘
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={goToPrevMonth}
            className="p-2 hover:bg-muted rounded-md transition-colors"
          >
            <svg className="w-5 h-5 text-body" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={goToNextMonth}
            className="p-2 hover:bg-muted rounded-md transition-colors"
          >
            <svg className="w-5 h-5 text-body" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* 범례 */}
      {filteredClasses.length > 0 && (
        <div className="px-6 py-3 border-b border-default bg-muted/30">
          <div className="flex flex-wrap gap-3 text-xs">
            {filteredClasses.map((cls, idx) => {
              const color = getClassColor(classColorMap.get(cls.id) ?? idx);
              return (
                <div key={cls.id} className="flex items-center gap-1.5">
                  <div className={`w-3 h-3 rounded ${color.bg} ${color.border} border`}></div>
                  <span className="text-body">{cls.name}</span>
                </div>
              );
            })}
            <div className="flex items-center gap-1.5 ml-4 pl-4 border-l border-default">
              <div className="w-3 h-3 rounded bg-green-500"></div>
              <span className="text-body">작성 완료</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded border-2 border-dashed border-gray-400"></div>
              <span className="text-body">미작성</span>
            </div>
          </div>
        </div>
      )}

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 border-b border-default">
        {['일', '월', '화', '수', '목', '금', '토'].map((day, idx) => (
          <div
            key={day}
            className={`py-3 text-center text-sm font-medium ${
              idx === 0 ? 'text-red-500' : idx === 6 ? 'text-blue-500' : 'text-body'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* 달력 그리드 */}
      <div className="grid grid-cols-7">
        {calendarDays.map((date, idx) => {
          const dateStr = formatDate(date);
          const dayEntries = dayClassMap.get(dateStr) || [];
          const dayOfWeek = date.getDay();

          return (
            <div
              key={idx}
              className={`min-h-[120px] border-b border-r border-default p-1 ${
                !isCurrentMonth(date) ? 'bg-muted/30' : ''
              } ${isToday(date) ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}
            >
              {/* 날짜 */}
              <div className={`text-sm mb-1 px-1 ${
                !isCurrentMonth(date) ? 'text-muted' :
                dayOfWeek === 0 ? 'text-red-500' :
                dayOfWeek === 6 ? 'text-blue-500' :
                'text-body'
              } ${isToday(date) ? 'font-bold' : ''}`}>
                {date.getDate()}
              </div>

              {/* 수업 블록들 */}
              <div className="space-y-1">
                {dayEntries.map((entry, entryIdx) => {
                  const colorIdx = classColorMap.get(entry.classInfo.id) ?? 0;
                  const color = getClassColor(colorIdx);
                  const hasLog = !!entry.log;
                  const hasContent = hasLog && entry.log.content && entry.log.content.trim().length > 0;

                  return (
                    <button
                      key={`${entry.classInfo.id}-${entryIdx}`}
                      onClick={() => onLogClick(entry.classInfo.id, dateStr, entry.log)}
                      className={`w-full text-left px-1.5 py-1 rounded text-xs transition-all hover:opacity-80 ${
                        hasContent
                          ? `${color.bg} ${color.text} border ${color.border}`
                          : `border-2 border-dashed ${color.border} ${color.text} opacity-60 hover:opacity-100`
                      }`}
                      title={`${entry.classInfo.name} (${entry.scheduleEntry.start}-${entry.scheduleEntry.end})${hasContent ? ' - 작성 완료' : ' - 클릭하여 작성'}`}
                    >
                      <div className="flex items-center gap-1">
                        {hasContent && (
                          <svg className="w-3 h-3 flex-shrink-0 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                        <span className="truncate font-medium">{entry.classInfo.name}</span>
                      </div>
                      <div className="text-[10px] opacity-75">
                        {entry.scheduleEntry.start}-{entry.scheduleEntry.end}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* 안내 메시지 */}
      {filteredClasses.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-muted">등록된 수업이 없습니다.</p>
        </div>
      )}
    </div>
  );
}
