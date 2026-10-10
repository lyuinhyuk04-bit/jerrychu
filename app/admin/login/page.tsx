'use client';

import React, { useState } from 'react';
import { useAppState } from '@/lib/store';
import { authenticateAdmin } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { Shield, LogIn, Eye, EyeOff, Lock, User, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function AdminLoginPage() {
  const { login, isAdmin } = useAppState();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="bg-white rounded-3xl p-10 text-center max-w-md w-full shadow-2xl border border-amber-200">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-extrabold text-slate-900 mb-2">이미 어드민 로그인 상태입니다!</h2>
          <p className="text-slate-500 text-sm mb-6">관리자 권한으로 모든 기능을 사용하실 수 있습니다.</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-extrabold rounded-2xl shadow-md transition-all"
          >
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate a short delay for UX
    await new Promise((r) => setTimeout(r, 600));

    const user = authenticateAdmin(email, password);

    if (user) {
      login(user);
      setIsLoading(false);
      router.push('/');
    } else {
      setError('이메일 또는 비밀번호가 올바르지 않습니다. 어드민 계정으로만 로그인 가능합니다.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-amber-200/30 blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-orange-200/30 blur-3xl"></div>
      </div>

      <div className="relative bg-white rounded-3xl max-w-md w-full shadow-2xl border border-amber-200/80 overflow-hidden">
        {/* Top accent bar */}
        <div className="h-2 bg-gradient-to-r from-amber-500 via-amber-400 to-orange-400"></div>

        <div className="p-8 sm:p-10 space-y-6">
          {/* Brand Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-100 border-2 border-amber-300 shadow-lg mb-2">
              <Shield className="w-8 h-8 text-amber-600" />
            </div>
            <h1 className="text-2xl font-black text-slate-900">
              🧀 제리츄 어드민 로그인
            </h1>
            <p className="text-sm text-slate-500 font-medium">
              스트리머/제작자 전용 관리자 접속 페이지입니다.
            </p>
          </div>

          {/* Security Note */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-800 space-y-1">
            <p className="font-extrabold flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              보안 안내
            </p>
            <p className="font-medium text-amber-700">
              이 페이지는 인증된 어드민(스트리머 & 제작자) 2인만 접근 가능합니다. 
              로그인 정보를 타인과 공유하지 마세요.
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-amber-500" />
                어드민 이메일
              </label>
              <input
                type="email"
                required
                placeholder="어드민 이메일 주소를 입력하세요"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 bg-slate-50 text-slate-900 font-medium focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-amber-500" />
                비밀번호
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="어드민 비밀번호를 입력하세요"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 rounded-2xl border-2 border-slate-200 bg-slate-50 text-slate-900 font-medium focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-red-700 font-medium">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-amber-500/30 transition-all hover:-translate-y-0.5 disabled:hover:translate-y-0"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>인증 중...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>어드민 로그인</span>
                  <Shield className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Dev Hint Box */}
          <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-4 text-xs text-slate-500 space-y-1.5">
            <p className="font-extrabold text-slate-600 text-center">🔐 테스트용 어드민 계정 안내</p>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div className="bg-white rounded-xl p-3 border border-slate-200">
                <p className="font-bold text-slate-700 text-[11px] mb-1 flex items-center gap-1">
                  <span>🧀</span> 스트리머 계정
                </p>
                <p className="font-mono text-[10px] text-slate-500">jerrychu@soop.live</p>
                <p className="font-mono text-[10px] text-slate-500">jerry1234!</p>
              </div>
              <div className="bg-white rounded-xl p-3 border border-slate-200">
                <p className="font-bold text-slate-700 text-[11px] mb-1 flex items-center gap-1">
                  <span>⚙️</span> 제작자 계정
                </p>
                <p className="font-mono text-[10px] text-slate-500">producer@jerrychu.com</p>
                <p className="font-mono text-[10px] text-slate-500">admin1234!</p>
              </div>
            </div>
            <p className="text-center text-[10px] text-slate-400 pt-1">
              ⚠️ 실제 배포 시 .env에서 계정 정보를 변경하세요
            </p>
          </div>

          {/* Back link */}
          <div className="text-center">
            <Link href="/" className="text-xs font-bold text-slate-500 hover:text-amber-600 transition-colors hover:underline">
              ← 홈으로 돌아가기 (시청자 Guest 모드)
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
