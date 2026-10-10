'use client';

import React, { useState } from 'react';
import { ScheduleItem } from '@/lib/types';
import { 
  Clock, 
  Calendar as CalendarIcon, 
  Tv, 
  Radio, 
  Sparkles, 
  ExternalLink, 
  ChevronLeft, 
  ChevronRight,
  Plus,
  Edit2
} from 'lucide-react';
import { format, parseISO, addDays, startOfWeek } from 'date-fns';
import { ko } from 'date-fns/locale';
import { FIXED_QUICK_LINKS } from '@/lib/mockData';

interface WeeklyTimelineViewProps {
  schedules: ScheduleItem[];
  isAdmin: boolean;
  onSelectSchedule: (schedule: ScheduleItem) => void;
  onAddSchedule: (defaultDate: string) => void;
}

export const WeeklyTimelineView: React.FC<WeeklyTimelineViewProps> = ({
  schedules,
  isAdmin,
  onSelectSchedule,
  onAddSchedule,
}) => {
  // Reference week: 2026-09-07 (Monday)
  const [weekStart, setWeekStart] = useState(new Date(2026, 8, 7));

  const daysOfWeek = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const categoryBadgeStyle = (category: string) => {
    switch (category) {
      case '소통/잡담': return 'bg-amber-500 text-white';
      case '게임': return 'bg-purple-600 text-white';
      case '쿡방': return 'bg-orange-500 text-white';
      case '야외방송': return 'bg-emerald-600 text-white';
      case '특별합방': return 'bg-pink-600 text-white';
      case '휴방': return 'bg-slate-500 text-white';
      default: return 'bg-blue-600 text-white';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl border border-amber-200/70 dark:border-slate-800">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-orange-500 text-white flex items-center justify-center text-xl shadow-md">
            ⚡
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
              주간 타임라인 & 방송 상세 계획
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {format(weekStart, 'yyyy년 M월 d일', { locale: ko })} ~ {format(addDays(weekStart, 6), 'M월 d일', { locale: ko })} 주간 타임라인
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekStart(addDays(weekStart, -7))}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-amber-100 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setWeekStart(new Date(2026, 8, 7))}
            className="px-3 py-2 text-xs font-bold bg-amber-100 dark:bg-slate-800 text-amber-800 dark:text-amber-300 rounded-xl hover:bg-amber-200 transition-colors"
          >
            이번 주
          </button>
          <button
            onClick={() => setWeekStart(addDays(weekStart, 7))}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-amber-100 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Days List */}
      <div className="space-y-4">
        {daysOfWeek.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const dayNameKo = format(day, 'EEEE', { locale: ko });
          const daySchedules = schedules.filter(
            (s) => s.startTime.split('T')[0] === dateStr
          );
          const isToday = dateStr === '2026-09-09';

          return (
            <div
              key={dateStr}
              className={`p-4 rounded-2xl border transition-all ${
                isToday
                  ? 'border-amber-400 bg-amber-50/40 dark:bg-amber-950/20 shadow-md ring-1 ring-amber-400'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-xl text-xs font-extrabold ${
                      isToday
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {format(day, 'M/d')} ({dayNameKo})
                  </span>
                  {isToday && (
                    <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 animate-pulse">
                      <Radio className="w-3.5 h-3.5 text-red-500" />
                      TODAY Broadcast
                    </span>
                  )}
                </div>

                {isAdmin && (
                  <button
                    onClick={() => onAddSchedule(dateStr)}
                    className="flex items-center gap-1 text-xs font-bold text-amber-700 dark:text-amber-300 hover:text-amber-800 bg-amber-100 dark:bg-slate-700 px-2.5 py-1 rounded-lg transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>일정 등록</span>
                  </button>
                )}
              </div>

              {/* Day Schedules Cards */}
              {daySchedules.length === 0 ? (
                <p className="text-xs text-slate-400 py-2 italic font-medium">
                  등록된 상세 정보가 없습니다. (자유 방송 / 휴방 예정)
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {daySchedules.map((sched) => {
                    const startTime = format(parseISO(sched.startTime), 'HH:mm');
                    const endTime = sched.endTime
                      ? format(parseISO(sched.endTime), 'HH:mm')
                      : '미정';

                    return (
                      <div
                        key={sched.id}
                        onClick={() => onSelectSchedule(sched)}
                        className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
                      >
                        {sched.status === 'live' && (
                          <div className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-bold px-3 py-0.5 rounded-bl-xl flex items-center gap-1 animate-pulse">
                            <Radio className="w-3 h-3" />
                            SOOP LIVE
                          </div>
                        )}

                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${categoryBadgeStyle(
                              sched.category
                            )}`}
                          >
                            {sched.category}
                          </span>
                          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-amber-500" />
                            {startTime} ~ {endTime}
                          </span>
                        </div>

                        <h4 className="font-extrabold text-sm text-slate-900 dark:text-white mb-1 group-hover:text-amber-500 transition-colors">
                          {sched.title}
                        </h4>

                        {sched.description && (
                          <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mb-3">
                            {sched.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                          <a
                            href={FIXED_QUICK_LINKS.soopStation}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg transition-colors"
                          >
                            <Tv className="w-3 h-3" />
                            <span>SOOP 방송 보러가기</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>

                          {isAdmin && (
                            <span className="text-[11px] font-bold text-amber-600 flex items-center gap-0.5 opacity-80 group-hover:opacity-100">
                              <Edit2 className="w-3 h-3" />
                              수정
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
