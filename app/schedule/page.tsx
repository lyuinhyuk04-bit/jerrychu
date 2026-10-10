'use client';

import React, { useState } from 'react';
import { MonthlyCalendar } from '@/components/calendar/MonthlyCalendar';
import { WeeklyTimelineView } from '@/components/calendar/WeeklyTimelineView';
import { ScheduleModal } from '@/components/calendar/ScheduleModal';
import { useAppState } from '@/lib/store';
import { ScheduleItem } from '@/lib/types';
import { Calendar, Clock, Shield } from 'lucide-react';

export default function SchedulePage() {
  const { schedules, isAdmin, addSchedule, updateSchedule, deleteSchedule, isLoaded } = useAppState();
  const [view, setView] = useState<'monthly' | 'weekly'>('monthly');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleItem | null>(null);
  const [defaultDate, setDefaultDate] = useState<string>('');

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-5xl mb-3 animate-bounce-slow">📅</div>
          <p className="text-slate-500 font-bold">일정표 로딩 중...</p>
        </div>
      </div>
    );
  }

  const handleSelectSchedule = (schedule: ScheduleItem) => {
    setSelectedSchedule(schedule);
    if (isAdmin) {
      setIsModalOpen(true);
    }
  };

  const handleAddSchedule = (date: string) => {
    if (!isAdmin) return;
    setSelectedSchedule(null);
    setDefaultDate(date);
    setIsModalOpen(true);
  };

  const handleSave = (data: Omit<ScheduleItem, 'id' | 'createdAt'>, id?: string) => {
    if (id) {
      updateSchedule(id, data);
    } else {
      addSchedule(data);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900">
            📅 방송 일정표
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            제리츄님의 SOOP 방송 월간/주간 타임라인을 확인하세요!
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isAdmin && (
            <div className="flex items-center gap-1.5 bg-amber-100 border border-amber-300 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-800">
              <Shield className="w-3.5 h-3.5" />
              어드민 편집 모드: 일정 클릭 시 수정 가능
            </div>
          )}

          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              onClick={() => setView('monthly')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                view === 'monthly'
                  ? 'bg-white shadow text-amber-700 border border-amber-200'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              월간 캘린더
            </button>
            <button
              onClick={() => setView('weekly')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                view === 'weekly'
                  ? 'bg-white shadow text-amber-700 border border-amber-200'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              주간 타임라인
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Views */}
      {view === 'monthly' ? (
        <MonthlyCalendar
          schedules={schedules}
          isAdmin={isAdmin}
          onSelectSchedule={handleSelectSchedule}
          onAddSchedule={handleAddSchedule}
        />
      ) : (
        <WeeklyTimelineView
          schedules={schedules}
          isAdmin={isAdmin}
          onSelectSchedule={handleSelectSchedule}
          onAddSchedule={handleAddSchedule}
        />
      )}

      {/* Schedule Detail / Edit Modal */}
      {isModalOpen && (
        <ScheduleModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedSchedule(null);
          }}
          onSave={handleSave}
          onDelete={deleteSchedule}
          initialData={selectedSchedule}
          defaultDate={defaultDate}
        />
      )}

      {/* Guest read-only view detail: show modal info only */}
      {!isAdmin && selectedSchedule && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedSchedule(null)}>
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-amber-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">📅</span>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">{selectedSchedule.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {selectedSchedule.category}
                  </span>
                  <span className="text-xs text-slate-500">
                    {new Date(selectedSchedule.startTime).toLocaleString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>
            {selectedSchedule.description && (
              <p className="text-sm text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-200 leading-relaxed">
                {selectedSchedule.description}
              </p>
            )}
            <button
              onClick={() => setSelectedSchedule(null)}
              className="w-full mt-4 py-3 bg-amber-500 text-white font-bold rounded-2xl hover:bg-amber-600 transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
