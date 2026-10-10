'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Calendar, 
  Bell, 
  Image as ImageIcon, 
  Gift, 
  Radio, 
  ExternalLink, 
  Shield, 
  LogOut, 
  Lock,
  Youtube,
  FileSpreadsheet,
  Tv,
  Coffee
} from 'lucide-react';
import { FIXED_QUICK_LINKS } from '@/lib/mockData';
import { useAppState } from '@/lib/store';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { currentUser, isAdmin, logout, isLoaded } = useAppState();

  const navItems = [
    { name: '홈', href: '/', icon: Calendar },
    { name: '일정표', href: '/schedule', icon: Calendar },
    { name: 'SOOP 공지 작성', href: '/notice', icon: Bell },
    { name: '팬아트 갤러리', href: '/fanart', icon: ImageIcon },
    { name: '이벤트 & 시참', href: '/events', icon: Gift },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-amber-200/50 dark:border-slate-800 shadow-sm">
      {/* 🎉 4주년 오리지널 공개 상단 배너 */}
      <div className="bg-gradient-to-r from-blue-400 via-sky-300 to-blue-400 overflow-hidden relative">
        <div className="flex items-center">
          {/* 포스터 썸네일 */}
          <div className="shrink-0 h-14 w-10 overflow-hidden">
            <img
              src="/jerrychu-original-poster.jpg"
              alt="포스터"
              className="h-full w-full object-cover object-top"
            />
          </div>
          {/* 스크롤 마키 텍스트 */}
          <div className="flex-1 overflow-hidden py-2">
            <div className="flex animate-marquee whitespace-nowrap">
              {[...Array(6)].map((_, i) => (
                <span key={i} className="mx-10 flex items-center gap-3 shrink-0 text-white font-extrabold text-sm">
                  <span className="text-base">❄️</span>
                  <span className="text-yellow-100">🎂 4주년 제리츄</span>
                  <span className="bg-white/20 px-2 py-0.5 rounded-full text-white text-xs">D-DAY</span>
                  <span>첫 오리지널 공개!</span>
                  <span className="text-blue-100 font-bold text-xs">10월 11일 오후 2시</span>
                  <span className="text-base">🐭</span>
                  <span className="text-base">✨</span>
                </span>
              ))}
            </div>
          </div>
          {/* 오른쪽 포스터 썸네일 */}
          <div className="shrink-0 h-14 w-10 overflow-hidden">
            <img
              src="/jerrychu-original-poster.jpg"
              alt="포스터"
              className="h-full w-full object-cover object-top"
            />
          </div>
        </div>
      </div>

      {/* Top Banner: Quick Links Bar */}
      <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-orange-400 text-slate-900 text-xs font-semibold py-1.5 px-4 shadow-inner">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          {/* Live Badge */}
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
            </span>
            <span className="bg-slate-900 text-amber-300 text-[11px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
              <Radio className="w-3 h-3 text-red-400 animate-pulse" />
              SOOP LIVE ON
            </span>
            <span className="hidden sm:inline text-slate-900 font-bold">
              제리츄의 짭조름 방송 진행 중!
            </span>
          </div>

          {/* Quick Links Group */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <span className="text-[11px] font-bold text-slate-800 hidden md:inline">
              📍 Official Links:
            </span>
            
            <a
              href={FIXED_QUICK_LINKS.soopStation}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 bg-emerald-700 text-white px-2 py-0.5 rounded hover:bg-emerald-800 transition-colors shadow-xs"
              title="SOOP 방송국 주소"
            >
              <Tv className="w-3 h-3" />
              <span>SOOP 방송국</span>
              <ExternalLink className="w-2.5 h-2.5 opacity-80" />
            </a>

            <a
              href={FIXED_QUICK_LINKS.naverCafe}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 bg-green-600 text-white px-2 py-0.5 rounded hover:bg-green-700 transition-colors shadow-xs"
              title="네이버 카페"
            >
              <Coffee className="w-3 h-3" />
              <span>네이버 카페</span>
              <ExternalLink className="w-2.5 h-2.5 opacity-80" />
            </a>

            <a
              href={FIXED_QUICK_LINKS.youtube}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 bg-red-600 text-white px-2 py-0.5 rounded hover:bg-red-700 transition-colors shadow-xs"
              title="유튜브 채널"
            >
              <Youtube className="w-3 h-3" />
              <span>유튜브</span>
              <ExternalLink className="w-2.5 h-2.5 opacity-80" />
            </a>

            <a
              href={FIXED_QUICK_LINKS.googleSheet}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 bg-blue-600 text-white px-2 py-0.5 rounded hover:bg-blue-700 transition-colors shadow-xs"
              title="구글 시트"
            >
              <FileSpreadsheet className="w-3 h-3" />
              <span>구글 시트</span>
              <ExternalLink className="w-2.5 h-2.5 opacity-80" />
            </a>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-2xl overflow-hidden border-2 border-amber-400 shadow-md group-hover:scale-105 transition-transform duration-300">
              <img
                src="/jerrychu-avatar.jpg"
                alt="제리츄"
                className="w-full h-full object-cover object-top"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white font-sans">
                  제리츄 <span className="text-amber-500">Jerrychu</span>
                </span>
                <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded-md border border-amber-300">
                  SOOP
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                통합 일정표 & 팬 소통 공간
              </p>
            </div>
          </Link>

          {/* Nav Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/30'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-amber-100/60 dark:hover:bg-slate-800 hover:text-amber-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Admin Account Status */}
          <div className="flex items-center gap-3">
            {isLoaded && (
              <>
                {isAdmin ? (
                  <div className="flex items-center gap-2 bg-amber-50 dark:bg-slate-800 border border-amber-300 dark:border-amber-500/40 rounded-xl px-3 py-1.5">
                    <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <div className="text-left text-xs">
                      <p className="font-bold text-slate-900 dark:text-white leading-none">
                        {currentUser?.name}
                      </p>
                      <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                        어드민 권한 활성
                      </p>
                    </div>
                    <button
                      onClick={logout}
                      className="ml-1 p-1 hover:bg-amber-200 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition-colors"
                      title="로그아웃"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <Link
                    href="/admin/login"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-amber-600 bg-slate-100 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl transition-all"
                  >
                    <Lock className="w-3.5 h-3.5 text-amber-500" />
                    <span>어드민 로그인</span>
                  </Link>
                )}
              </>
            )}
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex lg:hidden overflow-x-auto gap-1 py-2 border-t border-slate-100 dark:border-slate-800 scrollbar-none">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 transition-all ${
                  isActive
                    ? 'bg-amber-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
};
