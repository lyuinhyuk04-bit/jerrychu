'use client';

import React, { useState, useEffect } from 'react';
import { ScheduleItem, ScheduleCategory, ScheduleStatus } from '@/lib/types';
import { X, Calendar as CalendarIcon, Clock, Tag, Trash2, Save, Sparkles } from 'lucide-react';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (schedule: Omit<ScheduleItem, 'id' | 'createdAt'>, id?: string) => void;
  onDelete?: (id: string) => void;
  initialData?: ScheduleItem | null;
  defaultDate?: string;
}

const CATEGORIES: ScheduleCategory[] = ['소통/잡담', '게임', '쿡방', '야외방송', '휴방', '특별합방'];

export const ScheduleModal: React.FC<ScheduleModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialData,
  defaultDate,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('20:00');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('23:00');
  const [category, setCategory] = useState<ScheduleCategory>('소통/잡담');
  const [status, setStatus] = useState<ScheduleStatus>('scheduled');
  const [isHoliday, setIsHoliday] = useState(false);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description || '');
      const start = new Date(initialData.startTime);
      setStartDate(start.toISOString().split('T')[0]);
      setStartTime(start.toTimeString().slice(0, 5));
      if (initialData.endTime) {
        const end = new Date(initialData.endTime);
        setEndDate(end.toISOString().split('T')[0]);
        setEndTime(end.toTimeString().slice(0, 5));
      } else {
        setEndDate(start.toISOString().split('T')[0]);
        setEndTime('23:00');
      }
      setCategory(initialData.category);
      setStatus(initialData.status);
      setIsHoliday(initialData.isHoliday);
    } else {
      const today = defaultDate || new Date().toISOString().split('T')[0];
      setTitle('');
      setDescription('');
      setStartDate(today);
      setStartTime('20:00');
      setEndDate(today);
      setEndTime('23:00');
      setCategory('소통/잡담');
      setStatus('scheduled');
      setIsHoliday(false);
    }
  }, [initialData, defaultDate, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startDate) return;

    const startISO = `${startDate}T${startTime}:00+09:00`;
    const endISO = `${endDate || startDate}T${endTime}:00+09:00`;

    onSave(
      {
        title: title.trim(),
        description: description.trim(),
        startTime: startISO,
        endTime: endISO,
        category,
        status,
        isHoliday: category === '휴방' || isHoliday,
      },
      initialData?.id
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-amber-200 dark:border-slate-800 relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📅</span>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {initialData ? '방송 일정 수정' : '새 방송 일정 등록'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              일정 제목 *
            </label>
            <input
              type="text"
              required
              placeholder="예: 🧀 제리츄 저녁 짭조름 소통 & 영도 타임!"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          {/* Category selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-amber-500" />
              <span>방송 카테고리</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setCategory(cat);
                    if (cat === '휴방') setIsHoliday(true);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    category === cat
                      ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30 scale-105'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-amber-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Start Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <CalendarIcon className="w-3.5 h-3.5 text-amber-500" />
                <span>시작 날짜</span>
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (!endDate) setEndDate(e.target.value);
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>시작 시간</span>
              </label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
              />
            </div>
          </div>

          {/* End Time & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                종료 시간 (예상)
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                방송 진행 상태
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ScheduleStatus)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
              >
                <option value="scheduled">방송 예정</option>
                <option value="live">🔴 생방송 진행 중</option>
                <option value="finished">방송 종료</option>
                <option value="cancelled">취소됨</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              상세 설명 및 안내 사항
            </label>
            <textarea
              rows={3}
              placeholder="시청자 참여 정보, 게임 명, 관련 링크 등 안내를 작성하세요."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          {/* Checkboxes */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isHolidayCheck"
              checked={isHoliday}
              onChange={(e) => setIsHoliday(e.target.checked)}
              className="w-4 h-4 text-amber-500 rounded focus:ring-amber-400"
            />
            <label htmlFor="isHolidayCheck" className="text-xs font-bold text-slate-700 dark:text-slate-300">
              휴방일로 표시 (달력에 휴방 아이콘 강조)
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            {initialData && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm('이 일정을 정말 삭제하시겠습니까?')) {
                    onDelete(initialData.id);
                    onClose();
                  }
                }}
                className="flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-xl transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>삭제하기</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl shadow-md shadow-amber-500/30 transition-all"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{initialData ? '수정 저장' : '일정 등록'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
