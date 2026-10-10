import type { Metadata } from 'next';
import { Noto_Sans_KR } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ToolsPanel } from '@/components/layout/ToolsPanel';

const notoSansKR = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-noto-sans-kr',
});

export const metadata: Metadata = {
  title: '제리츄 Jerrychu | SOOP 스트리머 통합 팬 소통 플랫폼',
  description: 'SOOP 스트리머 제리츄님의 공식 방송 일정표, SOOP 공지 생성기, 팬아트 갤러리, 이벤트 참여 게시판을 한눈에 확인하세요!',
  keywords: ['제리츄', 'jerrychu', 'SOOP', '스트리머', '일정표', '팬아트', '이벤트'],
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🧀</text></svg>",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning className={notoSansKR.variable}>
      <body className="font-sans antialiased bg-[#faf8f5]" style={{ fontFamily: "var(--font-noto-sans-kr), 'Pretendard', sans-serif" }}>
        <Navbar />
        <ToolsPanel />
        <main className="min-h-screen">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
