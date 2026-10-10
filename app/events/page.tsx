'use client';

import React from 'react';
import { EventBoard } from '@/components/events/EventBoard';
import { useAppState } from '@/lib/store';
import { ShieldAlert } from 'lucide-react';

export default function EventsPage() {
  const { events, isAdmin, addEvent, deleteEvent, isLoaded } = useAppState();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-5xl mb-3">🎁</div>
          <p className="text-slate-500 font-bold">이벤트 게시판 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-900">🎁 이벤트 & 시청자 참여 게시판</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">
          제리츄 방송의 이벤트, 시청자 참여전(발로란트 내전 등), 공모전 정보를 확인하고 신청하세요!
        </p>
      </div>

      {!isAdmin && (
        <div className="bg-slate-100 border border-slate-200 rounded-2xl px-4 py-3 flex items-center gap-2 text-sm text-slate-600 font-medium">
          <ShieldAlert className="w-4 h-4 text-amber-500" />
          <span>이벤트 등록/삭제는 어드민 전용 기능입니다. 현재 이벤트 조회 및 참여 신청 모드입니다.</span>
        </div>
      )}

      <EventBoard
        events={events}
        isAdmin={isAdmin}
        onAddEvent={addEvent}
        onDeleteEvent={deleteEvent}
      />
    </div>
  );
}
