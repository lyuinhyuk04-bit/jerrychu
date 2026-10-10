'use client';

import React, { useState } from 'react';
import { EventItem, EventStatus } from '@/lib/types';
import { 
  Gift, 
  Calendar, 
  Users, 
  ExternalLink, 
  Plus, 
  Trash2, 
  X, 
  CheckCircle2, 
  Clock, 
  Sparkles,
  Coffee,
  Tv
} from 'lucide-react';
import { FIXED_QUICK_LINKS } from '@/lib/mockData';

interface EventBoardProps {
  events: EventItem[];
  isAdmin: boolean;
  onAddEvent: (item: Omit<EventItem, 'id' | 'createdAt'>) => void;
  onDeleteEvent: (id: string) => void;
}

export const EventBoard: React.FC<EventBoardProps> = ({
  events,
  isAdmin,
  onAddEvent,
  onDeleteEvent,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [activeModalEvent, setActiveModalEvent] = useState<EventItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<EventStatus>('active');
  const [startDate, setStartDate] = useState('2026-09-01');
  const [endDate, setEndDate] = useState('2026-09-17');
  const [formUrl, setFormUrl] = useState(FIXED_QUICK_LINKS.naverCafe);
  const [bannerUrl, setBannerUrl] = useState('');

  const filteredEvents =
    selectedStatus === 'all'
      ? events
      : events.filter((e) => e.status === selectedStatus);

  const statusBadge = (s: EventStatus) => {
    switch (s) {
      case 'active':
        return (
          <span className="bg-emerald-500 text-white text-[10px] font-extrabold px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
            🔥 진행 중
          </span>
        );
      case 'upcoming':
        return (
          <span className="bg-amber-500 text-white text-[10px] font-extrabold px-3 py-1 rounded-full flex items-center gap-1">
            <Clock className="w-3 h-3" />
            ⏰ 오픈 예정
          </span>
        );
      case 'ended':
        return (
          <span className="bg-slate-400 text-white text-[10px] font-extrabold px-3 py-1 rounded-full">
            ✅ 종료됨
          </span>
        );
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    onAddEvent({
      title: title.trim(),
      description: description.trim(),
      status,
      startDate,
      endDate,
      formUrl: formUrl.trim() || FIXED_QUICK_LINKS.naverCafe,
      bannerUrl: bannerUrl.trim() || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&auto=format&fit=crop&q=80',
      participantCount: 0,
    });

    setTitle('');
    setDescription('');
    setFormUrl(FIXED_QUICK_LINKS.naverCafe);
    setBannerUrl('');
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-500 to-amber-500 rounded-3xl p-6 text-white shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-3xl">🎁</span>
            <h2 className="text-2xl font-extrabold tracking-tight">
              진행 중인 이벤트 및 시청자 참여 게시판
            </h2>
          </div>
          <p className="text-sm font-medium text-emerald-100 max-w-xl">
            제리츄 방송의 시청자 참여전(발로란트 내전 등), 룰렛 이벤트 및 공모전에 직접 신청하세요!
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isAdmin && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-white text-slate-900 text-xs font-bold rounded-2xl shadow-lg hover:bg-slate-100 transition-all"
            >
              <Plus className="w-4 h-4 text-emerald-600" />
              <span>새 이벤트 등록 (Admin)</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setSelectedStatus('all')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
            selectedStatus === 'all'
              ? 'bg-amber-500 text-white shadow-md'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
          }`}
        >
          전체 이벤트 ({events.length})
        </button>
        <button
          onClick={() => setSelectedStatus('active')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
            selectedStatus === 'active'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
          }`}
        >
          🔥 진행 중 ({events.filter((e) => e.status === 'active').length})
        </button>
        <button
          onClick={() => setSelectedStatus('upcoming')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
            selectedStatus === 'upcoming'
              ? 'bg-amber-600 text-white shadow-md'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
          }`}
        >
          ⏰ 예정 ({events.filter((e) => e.status === 'upcoming').length})
        </button>
      </div>

      {/* Cards Display */}
      {filteredEvents.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
          <p className="text-slate-400 text-sm font-medium">해당 상태의 이벤트가 없습니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((evt) => (
            <div
              key={evt.id}
              className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-lg hover:shadow-2xl transition-all group flex flex-col justify-between"
            >
              {/* Banner Image */}
              <div className="relative h-44 overflow-hidden bg-slate-800">
                <img
                  src={evt.bannerUrl || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80'}
                  alt={evt.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                />
                <div className="absolute top-3 left-3">{statusBadge(evt.status)}</div>

                {isAdmin && (
                  <button
                    onClick={() => {
                      if (confirm('이 이벤트를 삭제하시겠습니까?')) {
                        onDeleteEvent(evt.id);
                      }
                    }}
                    className="absolute top-3 right-3 p-2 bg-slate-900/70 hover:bg-red-600 text-white rounded-xl transition-colors"
                    title="삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Content */}
              <div className="p-6 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-bold mb-1">
                    <Calendar className="w-3.5 h-3.5 text-amber-500" />
                    <span>{evt.startDate} ~ {evt.endDate}</span>
                  </div>

                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-2 leading-snug group-hover:text-amber-500 transition-colors">
                    {evt.title}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                    {evt.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1 font-bold">
                      <Users className="w-4 h-4 text-emerald-500" />
                      현재 {evt.participantCount || 0}명 참여중
                    </span>
                  </div>

                  <button
                    onClick={() => setActiveModalEvent(evt)}
                    className="w-full flex items-center justify-center gap-1.5 py-3 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-2xl shadow-md shadow-amber-500/20 transition-all"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>상세보기 및 참여 신청하기</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Event Detail Modal */}
      {activeModalEvent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-amber-200 dark:border-slate-800 relative">
            <div className="relative h-48 bg-slate-800">
              <img
                src={activeModalEvent.bannerUrl}
                alt={activeModalEvent.title}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setActiveModalEvent(null)}
                className="absolute top-4 right-4 p-2 bg-slate-900/70 text-white rounded-full hover:bg-slate-900 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="absolute bottom-4 left-4">{statusBadge(activeModalEvent.status)}</div>
            </div>

            <div className="p-6 space-y-4">
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                {activeModalEvent.title}
              </h3>

              <div className="bg-amber-50 dark:bg-slate-800 p-3 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-500" />
                <span>진행 기간: {activeModalEvent.startDate} ~ {activeModalEvent.endDate}</span>
              </div>

              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                {activeModalEvent.description}
              </p>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                {activeModalEvent.formUrl && (
                  <a
                    href={activeModalEvent.formUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-green-600 hover:bg-green-700 text-white font-extrabold text-xs rounded-2xl shadow-lg transition-all"
                  >
                    <Coffee className="w-4 h-4" />
                    <span>네이버 카페 / 구글 폼 참여 신청 페이지로 이동</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                <button
                  onClick={() => setActiveModalEvent(null)}
                  className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-2xl"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-amber-200 dark:border-slate-800 relative">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                🎁 새 이벤트 등록 (Admin)
              </h3>
              <button onClick={() => setIsAddModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1">이벤트 제목 *</label>
                <input
                  type="text"
                  required
                  placeholder="예: 🧀 시청자 참여 발로란트 5v5 내전"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">상세 안내 설명 *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="이벤트 내용, 참가 자격 및 진행 방식을 입력하세요."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold mb-1">시작일</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">종료일</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">참여 신청 폼/카페 링크</label>
                <input
                  type="url"
                  placeholder="https://cafe.naver.com/jerrychu/..."
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">배너 이미지 URL</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={bannerUrl}
                  onChange={(e) => setBannerUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold bg-slate-100 dark:bg-slate-800 rounded-xl"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-amber-500 rounded-xl shadow-md"
                >
                  등록하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
