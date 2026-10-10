'use client';

import React, { useState } from 'react';
import { ScheduleItem } from '@/lib/types';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  Radio, 
  Coffee, 
  Gamepad2, 
  Tv, 
  Sparkles,
  UtensilsCrossed,
  Trees
} from 'lucide-react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  parseISO 
} from 'date-fns';
import { ko } from 'date-fns/locale';

interface MonthlyCalendarProps {
  schedules: ScheduleItem[];
  isAdmin: boolean;
  onSelectSchedule: (schedule: ScheduleItem) => void;
  onAddSchedule: (defaultDate: string) => void;
}

export const MonthlyCalendar: React.FC<MonthlyCalendarProps> = ({
  schedules,
  isAdmin,
  onSelectSchedule,
  onAddSchedule,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 8, 1)); // 2026년 9월 기본

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday start
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const rows = [];
  let days = [];
  let day = startDate;

  const categoryColor = (category: string) => {
    switch (category) {
      case '소통/잡담': return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/40 dark:text-amber-300';
      case '게임': return 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/40 dark:text-purple-300';
      case '쿡방': return 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/40 dark:text-orange-300';
      case '야외방송': return 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300';
      case '휴방': return 'bg-slate-200 text-slate-700 border-slate-400 dark:bg-slate-800 dark:text-slate-400';
      case '특별합방': return 'bg-pink-100 text-pink-800 border-pink-300 dark:bg-pink-900/40 dark:text-pink-300';
      default: return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case '소통/잡담': return <Coffee className="w-3 h-3 inline mr-1" />;
      case '게임': return <Gamepad2 className="w-3 h-3 inline mr-1" />;
      case '쿡방': return <UtensilsCrossed className="w-3 h-3 inline mr-1" />;
      case '야외방송': return <Trees className="w-3 h-3 inline mr-1" />;
      case '휴방': return <span className="mr-1">😴</span>;
      case '특별합방': return <Sparkles className="w-3 h-3 inline mr-1 text-pink-500" />;
      default: return <Tv className="w-3 h-3 inline mr-1" />;
    }
  };

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      const formattedDate = format(day, 'yyyy-MM-dd');
      const daySchedules = schedules.filter((s) => {
        const sDate = s.startTime.split('T')[0];
        return sDate === formattedDate;
      });

      const isCurrentMonthDay = isSameMonth(day, monthStart);
      const isToday = isSameDay(day, new Date(2026, 8, 9)); // Today reference in demo
      const cloneDay = day;

      days.push(
        <div
          key={formattedDate}
          className={`min-h-[120px] p-2 border border-slate-200/70 dark:border-slate-800/80 transition-all flex flex-col justify-between ${
            !isCurrentMonthDay
              ? 'bg-slate-50/50 dark:bg-slate-900/40 opacity-40'
              : 'bg-white dark:bg-slate-900'
          } ${isToday ? 'ring-2 ring-amber-500 bg-amber-50/30 dark:bg-amber-950/20' : ''}`}
        >
          {/* Day Header */}
          <div className="flex items-center justify-between">
            <span
              className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full ${
                isToday
                  ? 'bg-amber-500 text-white shadow-sm'
                  : i === 0
                  ? 'text-red-500 font-extrabold'
                  : i === 6
                  ? 'text-blue-500 font-bold'
                  : 'text-slate-800 dark:text-slate-200'
              }`}
            >
              {format(day, 'd')}
            </span>

            {isAdmin && isCurrentMonthDay && (
              <button
                onClick={() => onAddSchedule(formattedDate)}
                className="opacity-0 group-hover:opacity-100 hover:opacity-100 p-1 text-amber-600 hover:bg-amber-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                title="일정 추가"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Schedule List Items */}
          <div className="space-y-1.5 mt-1.5 flex-1 overflow-y-auto max-h-[140px] scrollbar-thin">
            {daySchedules.map((sched) => {
              const timeStr = format(parseISO(sched.startTime), 'HH:mm');
              return (
                <div
                  key={sched.id}
                  onClick={() => onSelectSchedule(sched)}
                  className={`p-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all hover:scale-[1.02] shadow-xs ${categoryColor(
                    sched.category
                  )} ${sched.status === 'live' ? 'ring-2 ring-red-500 animate-pulse' : ''}`}
                >
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="text-[10px] font-bold opacity-80 flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5 inline" />
                      {timeStr}
                    </span>
                    {sched.status === 'live' && (
                      <span className="bg-red-600 text-white text-[9px] px-1 rounded font-bold animate-bounce">
                        LIVE
                      </span>
                    )}
                  </div>
                  <div className="font-bold truncate text-[11px] leading-tight">
                    {getCategoryIcon(sched.category)}
                    {sched.title}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
      day = addDays(day, 1);
    }
    rows.push(
      <div key={day.toString()} className="grid grid-cols-7 gap-0">
        {days}
      </div>
    );
    days = [];
  }

  const weekDaysKo = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl border border-amber-200/70 dark:border-slate-800">
      {/* Calendar Top Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-xl shadow-md">
            🗓️
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {format(currentMonth, 'yyyy년 M월', { locale: ko })} 방송 달력
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              제리츄의 월간 방송 스케줄 & 휴방 일정
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-amber-100 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setCurrentMonth(new Date(2026, 8, 1))}
            className="px-3 py-2 text-xs font-bold bg-amber-100 dark:bg-slate-800 text-amber-800 dark:text-amber-300 rounded-xl hover:bg-amber-200 transition-colors"
          >
            이번 달
          </button>
          <button
            onClick={nextMonth}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-amber-100 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {isAdmin && (
            <button
              onClick={() => onAddSchedule(format(new Date(), 'yyyy-MM-dd'))}
              className="ml-2 flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-md shadow-amber-500/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>일정 추가</span>
            </button>
          )}
        </div>
      </div>

      {/* Category Legend Bar */}
      <div className="flex flex-wrap items-center gap-2 mb-4 p-3 bg-amber-50/50 dark:bg-slate-800/50 rounded-2xl border border-amber-100 dark:border-slate-800 text-xs">
        <span className="font-bold text-slate-700 dark:text-slate-300 mr-2">카테고리 구분:</span>
        <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 font-bold">☕ 소통/잡담</span>
        <span className="px-2.5 py-1 rounded-lg bg-purple-100 text-purple-800 font-bold">🎮 게임</span>
        <span className="px-2.5 py-1 rounded-lg bg-orange-100 text-orange-800 font-bold">🍳 쿡방</span>
        <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-bold">🌲 야외방송</span>
        <span className="px-2.5 py-1 rounded-lg bg-pink-100 text-pink-800 font-bold">✨ 특별합방</span>
        <span className="px-2.5 py-1 rounded-lg bg-slate-200 text-slate-700 font-bold">😴 휴방</span>
      </div>

      {/* Week Header */}
      <div className="grid grid-cols-7 gap-0 border-b border-slate-200 dark:border-slate-800 mb-1">
        {weekDaysKo.map((dayName, idx) => (
          <div
            key={dayName}
            className={`py-2 text-center text-xs font-extrabold ${
              idx === 0 ? 'text-red-500' : idx === 6 ? 'text-blue-500' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {dayName}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
        {rows}
      </div>
    </div>
  );
};
