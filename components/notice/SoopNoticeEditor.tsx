'use client';

import React, { useState } from 'react';
import { NoticeItem, ScheduleItem } from '@/lib/types';
import { 
  Copy, 
  Check, 
  Sparkles, 
  Tv, 
  FileText, 
  Pin, 
  Trash2, 
  Plus, 
  Send, 
  Clock, 
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { FIXED_QUICK_LINKS } from '@/lib/mockData';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

interface SoopNoticeEditorProps {
  notices: NoticeItem[];
  schedules: ScheduleItem[];
  isAdmin: boolean;
  onAddNotice: (notice: Omit<NoticeItem, 'id' | 'createdAt'>) => void;
  onDeleteNotice: (id: string) => void;
}

export const SoopNoticeEditor: React.FC<SoopNoticeEditorProps> = ({
  notices,
  schedules,
  isAdmin,
  onAddNotice,
  onDeleteNotice,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [formattedSoopText, setFormattedSoopText] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeNoticeTab, setActiveNoticeTab] = useState<'list' | 'create'>('list');

  // Auto-generate SOOP notice format from current schedules
  const generateFromSchedule = () => {
    const sorted = [...schedules].sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    let template = `[SOOP 방송국 주간 일정 공지 🧀]\n`;
    template += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    template += `안녕하세요! 제리츄입니다 ❤️ 이번 주 방송 일정입니다!\n\n`;

    sorted.forEach((sched) => {
      const dateStr = format(parseISO(sched.startTime), 'M/d (EEE)', { locale: ko });
      const timeStr = format(parseISO(sched.startTime), 'HH:mm');
      template += `📍 ${dateStr}: ${sched.title} (${timeStr}~)\n`;
      if (sched.description) {
        template += `   └ ${sched.description}\n`;
      }
    });

    template += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    template += `네이버 카페: ${FIXED_QUICK_LINKS.naverCafe}\n`;
    template += `유튜브 채널: ${FIXED_QUICK_LINKS.youtube}\n`;
    template += `늘 응원해 주시는 우리 츄츄단 여러분 사랑합니다 🧀✨`;

    setTitle(`🧀 [방송 공지] ${format(new Date(), 'M월 d일')} 방송 일정 안내`);
    setContent('이번 주 방송 일정 공유드립니다! 아래 SOOP 방송국 게시글 양식을 복사하여 사용하세요.');
    setFormattedSoopText(template);
    setActiveNoticeTab('create');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedSoopText || content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    onAddNotice({
      title: title.trim(),
      content: content.trim(),
      formattedSoopText: formattedSoopText || content,
      isPinned,
      author: '제리츄',
    });

    setTitle('');
    setContent('');
    setFormattedSoopText('');
    setIsPinned(false);
    setActiveNoticeTab('list');
  };

  return (
    <div className="space-y-8">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-orange-400 rounded-3xl p-6 text-slate-900 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-3xl">📢</span>
            <h2 className="text-2xl font-extrabold tracking-tight">
              SOOP 방송국 공지사항 작성 & 미리보기
            </h2>
          </div>
          <p className="text-sm font-semibold text-slate-800 max-w-xl">
            일정표 데이터를 한 번의 클릭으로 SOOP 방송국용 게시글 양식으로 자동 변환하고 실시간 미리보기를 통해 작성할 수 있습니다.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isAdmin && (
            <button
              onClick={generateFromSchedule}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-300 text-xs font-bold rounded-2xl shadow-lg transition-all"
            >
              <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
              <span>일정 기반 자동 공지 생성</span>
            </button>
          )}

          <a
            href={FIXED_QUICK_LINKS.soopStation}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-900 text-xs font-bold rounded-2xl shadow-md transition-all"
          >
            <Tv className="w-4 h-4 text-emerald-600" />
            <span>SOOP 방송국 바로가기</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
        </div>
      </div>

      {/* Admin Action Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveNoticeTab('list')}
            className={`px-4 py-2 rounded-xl text-sm font-extrabold transition-all ${
              activeNoticeTab === 'list'
                ? 'bg-amber-500 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            📋 등록된 공지사항 목록 ({notices.length})
          </button>
          {isAdmin && (
            <button
              onClick={() => setActiveNoticeTab('create')}
              className={`px-4 py-2 rounded-xl text-sm font-extrabold transition-all ${
                activeNoticeTab === 'create'
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              ✍️ 새 공지 작성 / 프리뷰
            </button>
          )}
        </div>
      </div>

      {/* Editor & Preview Section (When 'create' active or Admin editing) */}
      {activeNoticeTab === 'create' && isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form Column */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl border border-amber-200/70 dark:border-slate-800 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-500" />
              <span>SOOP 공지 작성 폼</span>
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  공지 제목
                </label>
                <input
                  type="text"
                  required
                  placeholder="예: 🧀 [공지] 9월 2주차 방송 일정 안내"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  기본 설명 및 본문
                </label>
                <textarea
                  rows={3}
                  placeholder="공지 요약글 또는 전달 사항을 작성해 주세요."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                  <span>SOOP 게시판 복사용 텍스트 양식</span>
                  <button
                    type="button"
                    onClick={generateFromSchedule}
                    className="text-[11px] text-amber-600 hover:underline flex items-center gap-1 font-bold"
                  >
                    <Sparkles className="w-3 h-3" />
                    자동 채우기
                  </button>
                </label>
                <textarea
                  rows={8}
                  placeholder="SOOP 방송국에 그대로 붙여넣을 포맷 텍스트..."
                  value={formattedSoopText}
                  onChange={(e) => setFormattedSoopText(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-xs text-slate-900 dark:text-slate-200 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="pinCheck"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="w-4 h-4 text-amber-500 rounded focus:ring-amber-400"
                />
                <label htmlFor="pinCheck" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  상단 고정 공지로 등록
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveNoticeTab('list')}
                  className="px-4 py-2 text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl shadow-md shadow-amber-500/30 transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>공지 등록 저장</span>
                </button>
              </div>
            </form>
          </div>

          {/* Live Preview Column (SOOP Station Post Mockup) */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-2xl border border-slate-800 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
                  <h4 className="text-sm font-extrabold text-emerald-400">
                    SOOP 방송국 실시간 게시글 렌더링 미리보기
                  </h4>
                </div>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 px-3 py-1.5 rounded-xl shadow-md transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? '복사 완료!' : '양식 복사하기'}</span>
                </button>
              </div>

              {/* Station Card UI Header */}
              <div className="bg-slate-800/80 rounded-2xl p-4 mb-4 border border-slate-700/60">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-amber-400 flex items-center justify-center text-2xl font-bold text-slate-900">
                    🧀
                  </div>
                  <div>
                    <h5 className="font-bold text-base text-white">제리츄 (rariruro)</h5>
                    <p className="text-xs text-slate-400">SOOP 베스트 스트리머 | 공지 게시판</p>
                  </div>
                </div>
              </div>

              {/* Notice Title & Formatted Body Preview */}
              <div className="bg-slate-950/70 rounded-2xl p-5 border border-slate-800 font-mono text-xs leading-relaxed space-y-3">
                <h4 className="text-sm font-extrabold text-amber-300 font-sans border-b border-slate-800 pb-2">
                  {title || '공지 제목 미리보기'}
                </h4>
                <pre className="whitespace-pre-wrap font-sans text-slate-300 text-xs leading-relaxed">
                  {formattedSoopText || content || '여기에 텍스트가 실시간으로 표시됩니다.'}
                </pre>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 text-center pt-2 border-t border-slate-800">
              * 위 미리보기를 &apos;양식 복사하기&apos; 버튼으로 복사하여 SOOP 방송국 게시판에 편하게 붙여넣으세요.
            </div>
          </div>
        </div>
      )}

      {/* Notices List Display */}
      <div className="space-y-4">
        {notices.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
            <p className="text-slate-400 text-sm font-medium">등록된 공지사항이 없습니다.</p>
          </div>
        ) : (
          notices.map((notice) => (
            <div
              key={notice.id}
              className={`bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-md border transition-all ${
                notice.isPinned
                  ? 'border-amber-400 bg-amber-50/20 dark:bg-amber-950/10'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  {notice.isPinned && (
                    <span className="bg-amber-500 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <Pin className="w-3 h-3 fill-white" />
                      고정 공지
                    </span>
                  )}
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {notice.title}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {format(parseISO(notice.createdAt), 'yyyy.MM.dd HH:mm')}
                  </span>

                  {isAdmin && (
                    <button
                      onClick={() => {
                        if (confirm('이 공지를 삭제하시겠습니까?')) {
                          onDeleteNotice(notice.id);
                        }
                      }}
                      className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                      title="공지 삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
                {notice.content}
              </p>

              {notice.formattedSoopText && (
                <div className="bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                      📄 SOOP 방송국 복사용 양식
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(notice.formattedSoopText);
                        alert('SOOP 방송국 공지 양식이 클립보드에 복사되었습니다!');
                      }}
                      className="flex items-center gap-1 text-[11px] font-bold text-amber-600 hover:text-amber-700 bg-amber-100 dark:bg-slate-700 px-2.5 py-1 rounded-lg transition-colors"
                    >
                      <Copy className="w-3 h-3" />
                      <span>복사하기</span>
                    </button>
                  </div>
                  <pre className="text-xs font-mono text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                    {notice.formattedSoopText}
                  </pre>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
