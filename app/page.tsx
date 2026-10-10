'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Calendar, 
  Bell, 
  Image as ImageIcon, 
  Gift, 
  Tv, 
  Radio, 
  ArrowRight, 
  Clock, 
  Heart, 
  Sparkles,
  Youtube,
  Coffee,
  FileSpreadsheet,
  ExternalLink,
  Shield,
  ChevronRight
} from 'lucide-react';
import { useAppState } from '@/lib/store';
import { FIXED_QUICK_LINKS } from '@/lib/mockData';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

export default function HomePage() {
  const { schedules, notices, fanarts, events, isAdmin, isLoaded } = useAppState();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="text-6xl animate-bounce-slow">🧀</div>
          <p className="text-slate-500 font-bold">제리츄 플랫폼 로딩 중...</p>
        </div>
      </div>
    );
  }

  const todaySchedules = schedules.filter((s) => {
    const sDate = s.startTime.split('T')[0];
    return sDate === '2026-09-09';
  });

  const liveSchedules = schedules.filter((s) => s.status === 'live');
  const upcomingSchedules = schedules
    .filter((s) => s.status === 'scheduled')
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, 5);

  const pinnedNotices = notices.filter((n) => n.isPinned).slice(0, 3);
  const activeEvents = events.filter((e) => e.status === 'active').slice(0, 3);

  const categoryColor = (category: string) => {
    switch (category) {
      case '소통/잡담': return 'bg-amber-100 text-amber-800 border-amber-200';
      case '게임': return 'bg-purple-100 text-purple-800 border-purple-200';
      case '쿡방': return 'bg-orange-100 text-orange-800 border-orange-200';
      case '야외방송': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case '휴방': return 'bg-slate-100 text-slate-600 border-slate-200';
      case '특별합방': return 'bg-pink-100 text-pink-800 border-pink-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">

      {/* 🎉 4주년 오리지널 공개 특별 배너 */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-400 via-sky-300 to-blue-500 shadow-2xl">
        <div className="flex flex-col md:flex-row items-center gap-0">
          {/* 포스터 이미지 */}
          <div className="shrink-0 w-48 md:w-56 self-stretch">
            <img
              src="/jerrychu-original-poster.jpg"
              alt="4주년 제리츄 첫 오리지널 공개 포스터"
              className="w-full h-full object-cover rounded-t-3xl md:rounded-l-3xl md:rounded-tr-none"
            />
          </div>
          {/* 텍스트 영역 */}
          <div className="flex-1 px-8 py-8 text-white space-y-3">
            <div className="flex items-center gap-2">
              <span className="bg-white/20 text-white text-[11px] font-extrabold px-3 py-1 rounded-full animate-pulse">
                🌟 D-DAY
              </span>
              <span className="text-blue-100 text-xs font-bold">10월 11일 오후 2시</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black leading-tight drop-shadow-md">
              🎂 4주년 제리츄<br />
              <span className="text-yellow-200">첫 오리지널 공개!</span>
            </h2>
            <p className="text-blue-100 text-sm font-medium">
              제리츄의 첫 오리지널 캐릭터가 드디어 공개됩니다! 🐭✨<br />
              오늘 오후 2시 SOOP 방송국에서 함께 해주세요!
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <a
                href={FIXED_QUICK_LINKS.soopStation}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-white text-blue-600 font-extrabold text-sm px-5 py-2.5 rounded-2xl shadow-lg hover:bg-blue-50 transition-all hover:-translate-y-0.5"
              >
                📺 방송 보러 가기
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* HERO BANNER */}
      <section className="relative overflow-hidden rounded-3xl bg-cover bg-center bg-[url('/jerrychu-bg.jpg')] p-8 md:p-12 shadow-2xl">
      <div className="absolute inset-0 bg-black/30 pointer-events-none"></div>
        {/* Decorative elements */}
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/10 backdrop-blur-sm"></div>
        <div className="absolute -bottom-10 -left-6 w-32 h-32 rounded-full bg-orange-600/20"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2">
              {liveSchedules.length > 0 ? (
                <span className="flex items-center gap-1.5 bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg animate-pulse">
                  <Radio className="w-3.5 h-3.5" />
                  🔴 지금 SOOP에서 방송 중!
                </span>
              ) : (
                <span className="flex items-center gap-1.5 bg-slate-900/30 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                  <Tv className="w-3.5 h-3.5" />
                  제리츄 방송 준비 중
                </span>
              )}
              {isAdmin && (
                <span className="flex items-center gap-1 bg-slate-900 text-amber-300 text-xs font-bold px-2.5 py-1.5 rounded-full">
                  <Shield className="w-3 h-3" />
                  Admin 모드 활성
                </span>
              )}
            </div>

            <div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900">
                🧀 제리츄 <span className="text-white drop-shadow-md">Jerrychu</span>
              </h1>
              <p className="text-lg font-bold text-slate-800 mt-2">
                SOOP 스트리머 통합 일정표 & 팬 소통 플랫폼
              </p>
              <p className="text-sm text-slate-700 font-medium mt-1">
                월간/주간 방송 스케줄, 공지사항, 팬아트, 이벤트를 한눈에 📅
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 justify-center md:justify-start">
              <a
                href={FIXED_QUICK_LINKS.soopStation}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm rounded-2xl shadow-xl transition-all hover:-translate-y-0.5"
              >
                <Tv className="w-4 h-4 text-emerald-400" />
                SOOP 방송국 바로가기
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </a>
              <Link
                href="/schedule"
                className="inline-flex items-center gap-2 px-5 py-3 bg-white/70 hover:bg-white text-slate-900 font-extrabold text-sm rounded-2xl shadow-md transition-all hover:-translate-y-0.5"
              >
                <Calendar className="w-4 h-4 text-amber-600" />
                방송 일정표 보기
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Avatar + Stats Card */}
          <div className="flex flex-col items-center gap-4 w-full max-w-xs shrink-0">
            {/* Character Avatar */}
            <div className="relative">
              <div className="w-36 h-36 rounded-full overflow-hidden border-4 border-white shadow-2xl ring-4 ring-amber-400/60">
                <img
                  src="/jerrychu-avatar.jpg"
                  alt="제리츄 캐릭터"
                  className="w-full h-full object-cover object-top"
                />
              </div>
              {liveSchedules.length > 0 && (
                <span className="absolute -bottom-1 -right-1 bg-red-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-lg flex items-center gap-0.5 animate-pulse">
                  🔴 LIVE
                </span>
              )}
              <div className="absolute -top-1 -right-1 text-2xl animate-bounce-slow">🧀</div>
            </div>

            {/* Stats Card */}
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-5 shadow-2xl border border-white/60 w-full space-y-3">
              <h3 className="text-sm font-extrabold text-slate-800 pb-2 border-b border-slate-200 text-center">
                📊 이번 달 현황
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: '📅', label: '이번 달 일정', value: `${schedules.length}건` },
                  { icon: '🎨', label: '팬아트 작품', value: `${fanarts.length}점` },
                  { icon: '🎁', label: '진행 중 이벤트', value: `${activeEvents.length}개` },
                  { icon: '📢', label: '등록 공지', value: `${notices.length}건` },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="bg-amber-50 rounded-2xl p-3 text-center space-y-1 border border-amber-100"
                  >
                    <div className="text-xl">{stat.icon}</div>
                    <div className="text-lg font-black text-slate-900">{stat.value}</div>
                    <div className="text-[10px] font-bold text-slate-500">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* QUICK LINKS */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">🔗</span>
          <h2 className="text-xl font-extrabold text-slate-900">공식 채널 빠른 링크</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: <Tv className="w-7 h-7 text-emerald-600" />, label: 'SOOP 방송국', sub: 'rariruro', url: FIXED_QUICK_LINKS.soopStation, bg: 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100', emoji: '📺' },
            { icon: <Coffee className="w-7 h-7 text-green-600" />, label: '네이버 카페', sub: 'jerrychu', url: FIXED_QUICK_LINKS.naverCafe, bg: 'bg-green-50 border-green-200 hover:bg-green-100', emoji: '☕' },
            { icon: <Youtube className="w-7 h-7 text-red-600" />, label: '유튜브 채널', sub: '@jerryChu2', url: FIXED_QUICK_LINKS.youtube, bg: 'bg-red-50 border-red-200 hover:bg-red-100', emoji: '▶️' },
            { icon: <FileSpreadsheet className="w-7 h-7 text-blue-600" />, label: '구글 시트', sub: '통합 일정 시트', url: FIXED_QUICK_LINKS.googleSheet, bg: 'bg-blue-50 border-blue-200 hover:bg-blue-100', emoji: '📊' },
          ].map((link) => (
            <a
              key={link.label}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex flex-col items-center text-center p-6 rounded-3xl border-2 transition-all shadow-sm hover:shadow-lg hover:-translate-y-1 group ${link.bg}`}
            >
              <div className="mb-3 group-hover:scale-110 transition-transform">{link.icon}</div>
              <div className="font-extrabold text-slate-900 text-sm">{link.label}</div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">{link.sub}</div>
              <ExternalLink className="w-3 h-3 text-slate-400 mt-2" />
            </a>
          ))}
        </div>
      </section>

      {/* TODAY'S BROADCAST + UPCOMING SCHEDULE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Today's Schedule */}
        <section className="bg-white rounded-3xl p-6 shadow-xl border border-amber-200/70">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <span className="text-xl">⚡</span>
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">오늘의 방송 일정</h2>
                <p className="text-xs text-slate-400 font-medium">2026년 9월 9일 (화요일)</p>
              </div>
            </div>
            <Link href="/schedule" className="text-xs font-bold text-amber-600 hover:underline flex items-center gap-0.5">
              전체보기 <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {todaySchedules.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              <p>😴 오늘은 등록된 방송 일정이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todaySchedules.map((sched) => (
                <div key={sched.id} className={`p-4 rounded-2xl border ${sched.status === 'live' ? 'border-red-400 bg-red-50 ring-2 ring-red-400 animate-pulse' : 'border-slate-200 bg-slate-50'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md border ${categoryColor(sched.category)}`}>
                      {sched.category}
                    </span>
                    {sched.status === 'live' && (
                      <span className="bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-full font-extrabold flex items-center gap-1">
                        <Radio className="w-3 h-3" /> LIVE
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">{sched.title}</h3>
                  <div className="flex items-center gap-1 text-xs text-slate-500 mt-1 font-medium">
                    <Clock className="w-3 h-3 text-amber-500" />
                    {format(parseISO(sched.startTime), 'HH:mm')}
                    {sched.endTime && ` ~ ${format(parseISO(sched.endTime), 'HH:mm')}`}
                  </div>
                  {sched.description && (
                    <p className="text-xs text-slate-600 mt-1.5 line-clamp-2">{sched.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Upcoming Schedule */}
        <section className="bg-white rounded-3xl p-6 shadow-xl border border-slate-200">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <span className="text-xl">📅</span>
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">예정 방송 일정</h2>
                <p className="text-xs text-slate-400 font-medium">다가오는 방송 순서</p>
              </div>
            </div>
            <Link href="/schedule" className="text-xs font-bold text-amber-600 hover:underline flex items-center gap-0.5">
              전체보기 <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-3">
            {upcomingSchedules.map((sched, idx) => (
              <div key={sched.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-amber-50 transition-colors">
                <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-sm font-extrabold text-amber-700">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-slate-900 truncate">{sched.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${categoryColor(sched.category)}`}>
                      {sched.category}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium flex items-center gap-0.5">
                      <Calendar className="w-3 h-3" />
                      {format(parseISO(sched.startTime), 'M/d(EEE) HH:mm', { locale: ko })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* PINNED NOTICES */}
      {pinnedNotices.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">📢</span>
              <h2 className="text-xl font-extrabold text-slate-900">고정 공지사항</h2>
            </div>
            <Link href="/notice" className="text-xs font-bold text-amber-600 hover:underline flex items-center gap-0.5">
              전체 공지보기 <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-3">
            {pinnedNotices.map((notice) => (
              <div key={notice.id} className="bg-white rounded-3xl p-5 shadow-md border-l-4 border-amber-500 border border-slate-100 flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-amber-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">📌 고정</span>
                    <h3 className="font-extrabold text-slate-900 text-sm">{notice.title}</h3>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2">{notice.content}</p>
                  <p className="text-[11px] text-slate-400 mt-1 font-medium">
                    {format(parseISO(notice.createdAt), 'yyyy.MM.dd', { locale: ko })} | 작성: {notice.author}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ACTIVE EVENTS PREVIEW */}
      {activeEvents.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">🎁</span>
              <h2 className="text-xl font-extrabold text-slate-900">진행 중인 이벤트 & 시참</h2>
            </div>
            <Link href="/events" className="text-xs font-bold text-amber-600 hover:underline flex items-center gap-0.5">
              모두 보기 <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {activeEvents.map((evt) => (
              <Link
                key={evt.id}
                href="/events"
                className="bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-xl border border-slate-100 transition-all group hover:-translate-y-1"
              >
                <div className="h-36 overflow-hidden bg-slate-800 relative">
                  <img
                    src={evt.bannerUrl}
                    alt={evt.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                  />
                  <div className="absolute top-2 left-2">
                    <span className="bg-emerald-500 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                      🔥 진행 중
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-amber-500 transition-colors line-clamp-2">{evt.title}</h3>
                  <p className="text-[11px] text-slate-500 mt-1.5 font-medium">{evt.startDate} ~ {evt.endDate}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* FAN ART PREVIEW */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎨</span>
            <h2 className="text-xl font-extrabold text-slate-900">팬아트 갤러리 최신작</h2>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={FIXED_QUICK_LINKS.soopFanartBoard}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-0.5"
            >
              SOOP 원본 게시판 <ExternalLink className="w-3 h-3" />
            </a>
            <Link href="/fanart" className="text-xs font-bold text-amber-600 hover:underline flex items-center gap-0.5">
              갤러리 전체보기 <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {fanarts.slice(0, 5).map((art) => (
            <Link key={art.id} href="/fanart" className="relative aspect-square rounded-2xl overflow-hidden bg-slate-200 shadow-md group hover:shadow-xl transition-all hover:-translate-y-0.5">
              <img
                src={art.imageUrl}
                alt={art.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-end p-3">
                <p className="text-white text-[11px] font-bold truncate w-full text-center">{art.title}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Heart className="w-3 h-3 text-red-400 fill-red-400" />
                  <span className="text-white text-[10px]">{art.likes}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA STRIP */}
      <section className="bg-slate-900 rounded-3xl p-8 text-center space-y-4 shadow-2xl">
        <div className="text-4xl animate-bounce-slow">🧀</div>
        <h2 className="text-2xl font-black text-white">
          제리츄 방송 보러 <span className="text-amber-400">SOOP</span>으로 오세요!
        </h2>
        <p className="text-sm font-medium text-slate-300">
          매주 다양한 게임, 쿡방, 소통 방송과 이벤트가 여러분을 기다립니다 🎉
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <a
            href={FIXED_QUICK_LINKS.soopStation}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-extrabold rounded-2xl shadow-xl transition-all hover:-translate-y-0.5"
          >
            <Tv className="w-4 h-4" />
            SOOP 방송국 구독하기
          </a>
          <a
            href={FIXED_QUICK_LINKS.naverCafe}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-extrabold rounded-2xl shadow-xl transition-all hover:-translate-y-0.5"
          >
            <Coffee className="w-4 h-4" />
            네이버 카페 가입
          </a>
        </div>
      </section>

    </div>
  );
}
