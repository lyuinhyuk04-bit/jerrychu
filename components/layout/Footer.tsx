'use client';

import React from 'react';
import Link from 'next/link';
import { FIXED_QUICK_LINKS } from '@/lib/mockData';
import { Tv, Coffee, Youtube, FileSpreadsheet, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 mt-20 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Streamer Profile */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-3xl">🧀</span>
              <span className="text-xl font-bold text-white">SOOP 스트리머 제리츄</span>
            </div>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              제리츄님의 공식 방송 일정 관리 및 시청자 소통 웹 플랫폼입니다. 
              월간/주간 방송 스케줄, SOOP 공지사항, 팬아트 갤러리 및 이벤트를 한눈에 확인하세요!
            </p>
            <div className="flex items-center gap-2 text-xs text-amber-400 font-medium">
              <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
              <span>츄츄단 여러분의 따뜻한 관심과 사랑에 늘 감사드립니다.</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white tracking-wider uppercase">공식 링크 모음</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href={FIXED_QUICK_LINKS.soopStation}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-emerald-400 transition-colors"
                >
                  <Tv className="w-3.5 h-3.5 text-emerald-400" />
                  <span>SOOP 방송국 (rariruro)</span>
                </a>
              </li>
              <li>
                <a
                  href={FIXED_QUICK_LINKS.naverCafe}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-green-400 transition-colors"
                >
                  <Coffee className="w-3.5 h-3.5 text-green-400" />
                  <span>네이버 카페 (jerrychu)</span>
                </a>
              </li>
              <li>
                <a
                  href={FIXED_QUICK_LINKS.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-red-400 transition-colors"
                >
                  <Youtube className="w-3.5 h-3.5 text-red-400" />
                  <span>공식 유튜브 (@jerryChu2)</span>
                </a>
              </li>
              <li>
                <a
                  href={FIXED_QUICK_LINKS.googleSheet}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-blue-400 transition-colors"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-blue-400" />
                  <span>통합 공유 구글 시트</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Service Info */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white tracking-wider uppercase">페이지 맵 & 관리</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/schedule" className="hover:text-amber-400 transition-colors">월간 / 주간 일정표</Link></li>
              <li><Link href="/notice" className="hover:text-amber-400 transition-colors">SOOP 공지 생성기</Link></li>
              <li><Link href="/fanart" className="hover:text-amber-400 transition-colors">팬아트 갤러리</Link></li>
              <li><Link href="/events" className="hover:text-amber-400 transition-colors">이벤트 안내 게시판</Link></li>
              <li className="pt-2 border-t border-slate-800">
                <Link href="/admin/login" className="text-amber-400 hover:underline flex items-center gap-1 font-bold">
                  <span>🔒 어드민 관리자 접속</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800 text-center text-xs text-slate-500">
          <p>© 2026 SOOP Streamer Jerrychu. All rights reserved. Built for Jerrychu Streamer & Producer.</p>
        </div>
      </div>
    </footer>
  );
};
