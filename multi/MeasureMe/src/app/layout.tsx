import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "MeasureMe - AI 핏 컨설팅",
  description:
    "비전 기반 크로스 모달 컨설팅 시스템. 전신 사진과 의류 실측 수치를 분석하여 맞춤형 핏 리포트를 제공합니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-gradient-to-br from-brand-light/75 via-white to-brand-cream/60 text-slate-900 antialiased flex flex-col font-sans">
        <Header />
        <main className="flex-1 mx-auto max-w-7xl w-full px-4 md:px-6 lg:px-8 py-8">
          {children}
        </main>
        <footer className="bg-white border-t border-slate-100 py-6 mt-12 px-6">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400 font-medium">
            <span>&copy; 2026 MeasureMe AI. All rights reserved.</span>
            <span className="flex items-center gap-1">패션을 사랑하는 모두를 위해</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
