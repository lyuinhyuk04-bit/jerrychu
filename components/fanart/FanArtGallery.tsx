'use client';

import React, { useState } from 'react';
import { FanArtItem } from '@/lib/types';
import { 
  Heart, 
  ExternalLink, 
  Plus, 
  Trash2, 
  X, 
  Tag, 
  Image as ImageIcon,
  Coffee,
  Sparkles
} from 'lucide-react';
import { FIXED_QUICK_LINKS } from '@/lib/mockData';

interface FanArtGalleryProps {
  fanarts: FanArtItem[];
  isAdmin: boolean;
  onAddFanArt: (item: Omit<FanArtItem, 'id' | 'createdAt' | 'likes'>) => void;
  onDeleteFanArt: (id: string) => void;
  onToggleLike: (id: string) => void;
}

export const FanArtGallery: React.FC<FanArtGalleryProps> = ({
  fanarts,
  isAdmin,
  onAddFanArt,
  onDeleteFanArt,
  onToggleLike,
}) => {
  const [selectedTag, setSelectedTag] = useState<string>('전체');
  const [activeLightbox, setActiveLightbox] = useState<FanArtItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form states for Admin uploading
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [sourceUrl, setSourceUrl] = useState(FIXED_QUICK_LINKS.naverCafe);
  const [tagsInput, setTagsInput] = useState('팬아트, SD');

  const allTags = ['전체', ...Array.from(new Set(fanarts.flatMap((f) => f.tags)))];

  const filteredFanarts =
    selectedTag === '전체'
      ? fanarts
      : fanarts.filter((f) => f.tags.includes(selectedTag));

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !author.trim() || !imageUrl.trim()) return;

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    onAddFanArt({
      title: title.trim(),
      author: author.trim(),
      imageUrl: imageUrl.trim(),
      sourceUrl: sourceUrl.trim() || FIXED_QUICK_LINKS.naverCafe,
      tags: tags.length > 0 ? tags : ['팬아트'],
    });

    setTitle('');
    setAuthor('');
    setImageUrl('');
    setTagsInput('팬아트');
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-amber-500 rounded-3xl p-6 text-white shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-3xl">🎨</span>
            <h2 className="text-2xl font-extrabold tracking-tight">
              제리츄 팬아트 모아보기 갤러리
            </h2>
          </div>
          <p className="text-sm font-medium text-pink-100 max-w-xl">
            금손 츄츄단 여러분이 직접 정성스레 그려주신 팬아트 모음입니다! 네이버 카페 원본 게시글 바로가기 링크를 제공합니다.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isAdmin && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-white text-slate-900 text-xs font-bold rounded-2xl shadow-lg hover:bg-slate-100 transition-all"
            >
              <Plus className="w-4 h-4 text-purple-600" />
              <span>팬아트 새 작품 등록</span>
            </button>
          )}

          <a
            href={FIXED_QUICK_LINKS.naverCafe}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-900/60 hover:bg-slate-900 text-white text-xs font-bold rounded-2xl border border-white/20 transition-all"
          >
            <Coffee className="w-4 h-4 text-green-400" />
            <span>네이버 카페 팬아트 게시판</span>
            <ExternalLink className="w-3 h-3 text-slate-300" />
          </a>
        </div>
      </div>

      {/* Filter Tags */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0 mr-1">
          태그 필터:
        </span>
        {allTags.map((tag) => (
          <button
            key={tag}
            onClick={() => setSelectedTag(tag)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              selectedTag === tag
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-amber-100'
            }`}
          >
            #{tag}
          </button>
        ))}
      </div>

      {/* Grid Display */}
      {filteredFanarts.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
          <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-500 text-sm font-medium">해당 태그의 팬아트가 없습니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filteredFanarts.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md hover:shadow-xl transition-all group flex flex-col justify-between"
            >
              {/* Image Container */}
              <div
                onClick={() => setActiveLightbox(item)}
                className="relative aspect-4/3 overflow-hidden bg-slate-100 dark:bg-slate-800 cursor-pointer"
              >
                {/* eslint-disable-next-html-extension */}
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                  <span className="text-white text-xs font-bold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    클릭하여 원본 확대 보기
                  </span>
                </div>
              </div>

              {/* Info Container */}
              <div className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white line-clamp-1 group-hover:text-amber-500 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      작가: <span className="font-bold text-amber-600 dark:text-amber-400">{item.author}</span>님
                    </p>
                  </div>

                  {isAdmin && (
                    <button
                      onClick={() => {
                        if (confirm('이 팬아트를 삭제하시겠습니까?')) {
                          onDeleteFanArt(item.id);
                        }
                      }}
                      className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                      title="삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1">
                  {item.tags.map((t) => (
                    <span
                      key={t}
                      className="text-[10px] font-bold bg-amber-50 dark:bg-slate-800 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-md border border-amber-200/60 dark:border-slate-700"
                    >
                      #{t}
                    </span>
                  ))}
                </div>

                {/* Card Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <button
                    onClick={() => onToggleLike(item.id)}
                    className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 hover:text-red-500 font-bold transition-colors"
                  >
                    <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                    <span>{item.likes}</span>
                  </button>

                  {item.sourceUrl && (
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[11px] font-bold text-green-600 dark:text-green-400 hover:underline"
                    >
                      <span>네이버 카페 원본</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {activeLightbox && (
        <div
          onClick={() => setActiveLightbox(null)}
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-slate-700 relative flex flex-col md:flex-row max-h-[90vh]"
          >
            <button
              onClick={() => setActiveLightbox(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-slate-900/60 hover:bg-slate-900 text-white rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="md:w-2/3 bg-black flex items-center justify-center p-2">
              <img
                src={activeLightbox.imageUrl}
                alt={activeLightbox.title}
                className="max-h-[75vh] w-auto object-contain rounded-xl"
              />
            </div>

            <div className="md:w-1/3 p-6 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🎨</span>
                  <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">
                    Fan Art Preview
                  </span>
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-1">
                  {activeLightbox.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                  작성자: <span className="font-bold text-amber-500">{activeLightbox.author}</span>님
                </p>

                <div className="flex flex-wrap gap-1 mt-4">
                  {activeLightbox.tags.map((t) => (
                    <span
                      key={t}
                      className="text-xs font-bold bg-amber-100 dark:bg-slate-800 text-amber-800 dark:text-amber-300 px-2.5 py-1 rounded-lg"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => onToggleLike(activeLightbox.id)}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 dark:bg-slate-800 hover:bg-red-100 text-red-600 font-extrabold rounded-2xl transition-colors"
                >
                  <Heart className="w-5 h-5 fill-red-500 text-red-500" />
                  <span>좋아요 ({activeLightbox.likes})</span>
                </button>

                {activeLightbox.sourceUrl && (
                  <a
                    href={activeLightbox.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-700 text-white font-extrabold rounded-2xl shadow-md transition-colors"
                  >
                    <Coffee className="w-5 h-5" />
                    <span>네이버 카페 게시글 가기</span>
                  </a>
                )}
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
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>🎨 팬아트 신규 등록 (Admin)</span>
              </h3>
              <button onClick={() => setIsAddModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1">작품 제목 *</label>
                <input
                  type="text"
                  required
                  placeholder="예: 치즈 조각을 든 제리츄 🧀"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">작가 닉네임 *</label>
                <input
                  type="text"
                  required
                  placeholder="예: 츄츄단1호"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">이미지 URL *</label>
                <input
                  type="url"
                  required
                  placeholder="https://..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">네이버 카페 출처 URL</label>
                <input
                  type="url"
                  placeholder="https://cafe.naver.com/jerrychu/..."
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">태그 (쉼표 구분)</label>
                <input
                  type="text"
                  placeholder="팬아트, SD, 가을 의상"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
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
