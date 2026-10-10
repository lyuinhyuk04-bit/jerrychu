'use client';

import React, { useState } from 'react';
import { Wrench, X, ExternalLink, ChevronRight, ChevronLeft } from 'lucide-react';

const TOOLS = [
  {
    id: 'pinball',
    name: '핀볼 룰렛',
    emoji: '🎯',
    description: '핀볼 방식으로 당첨자를 뽑는 룰렛! 참가자 이름을 입력하고 돌려보세요.',
    url: 'https://lazygyu.github.io/roulette/',
    color: 'from-purple-600 to-indigo-600',
    badge: 'bg-purple-100 text-purple-800',
    badgeText: '핀볼',
  },
  {
    id: 'ladder',
    name: '네이버 사다리 타기',
    emoji: '🪜',
    description: '네이버 사다리 타기 미니게임! 최대 8명까지 참여 가능한 공정한 사다리.',
    url: 'https://search.naver.com/search.naver?where=nexearch&sm=top_hty&fbm=0&ie=utf8&query=%EB%84%A4%EC%9D%B4%EB%B2%84+%EC%82%AC%EB%8B%A4%EB%A6%AC&ackey=sv3zrr8v',
    color: 'from-emerald-600 to-teal-600',
    badge: 'bg-emerald-100 text-emerald-800',
    badgeText: '사다리',
  },
  {
    id: 'roulette',
    name: '네이버 돌림판',
    emoji: '🎡',
    description: '네이버 돌림판 미니게임! 원하는 항목을 입력하고 랜덤으로 당첨자를 선택하세요.',
    url: 'https://search.naver.com/search.naver?sm=tab_hty.top&where=nexearch&ssc=tab.nx.all&query=%EB%84%A4%EC%9D%B4%EB%B2%84+%EB%8F%8C%EB%A6%BC%ED%8C%90&oquery=%EB%84%A4%EC%9D%B4%EB%B2%84+%EC%82%AC%EB%8B%A4%EB%A6%AC&tqi=jqZWPsqosZossBlHg3Z-328664&ackey=3d6ycq7k',
    color: 'from-rose-500 to-pink-600',
    badge: 'bg-rose-100 text-rose-800',
    badgeText: '돌림판',
  },
];

export const ToolsPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Toggle Button */}
      <div
        className="fixed right-0 top-1/2 -translate-y-1/2 z-40 flex items-center"
        style={{ filter: 'drop-shadow(-4px 0 12px rgba(0,0,0,0.15))' }}
      >
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label="도구창 열기/닫기"
          className={`
            flex flex-col items-center justify-center gap-1 py-5 px-2 rounded-l-2xl
            bg-gradient-to-b from-amber-500 to-orange-500 text-white
            shadow-xl border-l border-t border-b border-amber-400
            transition-all duration-300 hover:from-amber-400 hover:to-orange-400
            ${isOpen ? 'rounded-l-2xl' : ''}
          `}
        >
          {isOpen ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
          <Wrench className="w-4 h-4 mt-1" />
          <span
            className="text-[10px] font-extrabold tracking-wider"
            style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
          >
            도구창
          </span>
        </button>
      </div>

      {/* Slide-out Panel */}
      <div
        className={`
          fixed right-0 top-0 h-full z-30 flex items-center
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        <div className="w-72 h-full bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
          {/* Panel Header */}
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Wrench className="w-5 h-5 text-white" />
              <div>
                <h2 className="text-base font-extrabold text-white leading-none">도구창</h2>
                <p className="text-[11px] text-amber-100 font-medium mt-0.5">방송 진행 도우미 미니게임</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Hint */}
          <div className="px-4 py-3 bg-amber-50 dark:bg-slate-800 border-b border-amber-100 dark:border-slate-700 shrink-0">
            <p className="text-[11px] text-amber-700 dark:text-amber-300 font-medium leading-relaxed">
              🧀 방송 중 이벤트 당첨자 선정 도구! 클릭하면 새 탭에서 열립니다.
            </p>
          </div>

          {/* Tools List */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {TOOLS.map((tool) => (
              <a
                key={tool.id}
                href={tool.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block group"
              >
                <div className="relative bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm hover:shadow-lg transition-all hover:-translate-y-0.5 p-4 space-y-2">
                  {/* Gradient top accent */}
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${tool.color}`} />

                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-2xl bg-gradient-to-br ${tool.color} shadow-md`}>
                        {tool.emoji}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-sm text-slate-900 dark:text-white group-hover:text-amber-600 transition-colors leading-tight">
                          {tool.name}
                        </h3>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${tool.badge}`}>
                          {tool.badgeText}
                        </span>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-amber-500 transition-colors shrink-0 mt-1" />
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                    {tool.description}
                  </p>

                  <div className={`w-full py-2 rounded-xl bg-gradient-to-r ${tool.color} text-white text-[11px] font-extrabold text-center flex items-center justify-center gap-1.5 group-hover:opacity-90 transition-opacity`}>
                    <span>{tool.emoji}</span>
                    <span>새 탭으로 열기</span>
                    <ExternalLink className="w-3 h-3" />
                  </div>
                </div>
              </a>
            ))}
          </div>

          {/* Panel Footer */}
          <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50 dark:bg-slate-900">
            <p className="text-[10px] text-center text-slate-400 font-medium">
              © 제리츄 방송국 도우미 도구창
            </p>
          </div>
        </div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-slate-900/20 backdrop-blur-[1px]"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};
