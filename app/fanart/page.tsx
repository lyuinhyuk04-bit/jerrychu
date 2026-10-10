'use client';

import React from 'react';
import { FanArtGallery } from '@/components/fanart/FanArtGallery';
import { useAppState } from '@/lib/store';
import { FIXED_QUICK_LINKS } from '@/lib/mockData';
import { ShieldAlert, ExternalLink, Palette, Star } from 'lucide-react';

export default function FanArtPage() {
  const { fanarts, isAdmin, addFanArt, deleteFanArt, toggleFanArtLike, isLoaded } = useAppState();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-5xl mb-3 animate-bounce-slow">🎨</div>
          <p className="text-slate-500 font-bold">팬아트 갤러리 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-900">🎨 팬아트 갤러리</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">
          츄츄단 팬분들이 정성으로 만들어주신 제리츄 팬아트를 모아볼 수 있는 공간입니다.
        </p>
      </div>

      {/* SOOP 팬아트 게시판 바로가기 배너 */}
      <a
        href={FIXED_QUICK_LINKS.soopFanartBoard}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 rounded-3xl px-6 py-5 shadow-xl transition-all hover:-translate-y-0.5 hover:shadow-2xl"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl shadow-lg shrink-0">
            🎨
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="bg-white/20 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                <Star className="w-2.5 h-2.5 fill-white" /> SOOP 공식 게시판
              </span>
            </div>
            <h2 className="text-lg font-extrabold text-white leading-tight">
              제리츄 SOOP 팬아트 게시판 바로가기
            </h2>
            <p className="text-emerald-100 text-xs font-medium mt-0.5">
              실제 팬아트 원본 게시물을 SOOP 방송국에서 확인하세요! 📺
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-white text-emerald-700 font-extrabold text-sm px-5 py-2.5 rounded-2xl shadow-md group-hover:bg-emerald-50 transition-colors shrink-0">
          <Palette className="w-4 h-4" />
          <span>팬아트 게시판 열기</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </div>
      </a>

      {/* 팬아트 업로드 안내 (게스트용) */}
      {!isAdmin && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex flex-wrap items-center gap-3 text-sm">
          <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
          <span className="text-amber-800 font-medium">
            팬아트를 등록하고 싶으시다면?
          </span>
          <a
            href={FIXED_QUICK_LINKS.soopFanartBoard}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-extrabold text-emerald-700 hover:text-emerald-900 underline underline-offset-2"
          >
            SOOP 팬아트 게시판에 직접 올려주세요!
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      {isAdmin && (
        <div className="bg-slate-100 border border-slate-200 rounded-2xl px-4 py-3 flex items-center gap-2 text-sm text-slate-600 font-medium">
          <ShieldAlert className="w-4 h-4 text-amber-500" />
          <span>어드민 모드: 팬아트 등록/삭제 가능합니다. SOOP 팬아트 게시판 원본 링크와 함께 등록해 주세요.</span>
        </div>
      )}

      <FanArtGallery
        fanarts={fanarts}
        isAdmin={isAdmin}
        onAddFanArt={addFanArt}
        onDeleteFanArt={deleteFanArt}
        onToggleLike={toggleFanArtLike}
      />
    </div>
  );
}
