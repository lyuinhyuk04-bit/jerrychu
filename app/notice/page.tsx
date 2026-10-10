'use client';

import React from 'react';
import { SoopNoticeEditor } from '@/components/notice/SoopNoticeEditor';
import { useAppState } from '@/lib/store';
import { ShieldAlert } from 'lucide-react';

export default function NoticePage() {
  const { notices, schedules, isAdmin, addNotice, deleteNotice, isLoaded } = useAppState();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-5xl mb-3">📢</div>
          <p className="text-slate-500 font-bold">공지사항 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-900">📢 SOOP 공지사항</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">
          제리츄 방송국의 공지사항을 확인하고, 어드민은 SOOP 게시판용 양식으로 공지를 직접 작성하세요.
        </p>
      </div>

      {/* Admin only banner */}
      {!isAdmin && (
        <div className="bg-slate-100 border border-slate-200 rounded-2xl px-4 py-3 flex items-center gap-2 text-sm text-slate-600 font-medium">
          <ShieldAlert className="w-4 h-4 text-amber-500" />
          <span>공지 작성 및 수정은 어드민 로그인 후에만 가능합니다. 현재 조회 전용 모드입니다.</span>
        </div>
      )}

      <SoopNoticeEditor
        notices={notices}
        schedules={schedules}
        isAdmin={isAdmin}
        onAddNotice={addNotice}
        onDeleteNotice={deleteNotice}
      />
    </div>
  );
}
