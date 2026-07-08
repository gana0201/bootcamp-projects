"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Ruler, ShieldCheck } from "lucide-react";

export default function Header() {
  const [user, setUser] = useState<{ name: string } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) setUser(data.user);
      })
      .catch(() => {});
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="p-2.5 bg-brand-primary text-white rounded-xl shadow-md shadow-brand-primary/10">
            <Ruler className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-1.5">
              MeasureMe
              <span className="text-[10px] bg-brand-accent/20 text-brand-dark font-black px-1.5 py-0.5 rounded-md border border-brand-accent/30">
                AI Fit
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">
              비전 기반 AI 핏 컨설팅 시스템
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-4">
          <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-primary" /> 개인정보 보호 적용
          </span>

          {user ? (
            <Link
              href="/mypage"
              className="rounded-xl bg-brand-light/60 border border-brand-cream/60 px-3.5 py-1.5 text-xs font-extrabold text-brand-dark hover:bg-brand-light transition-all"
            >
              {user.name}님
            </Link>
          ) : (
            <Link
              href="/login"
              className="rounded-xl bg-gradient-to-r from-brand-primary to-brand-dark px-4 py-2 text-xs font-extrabold text-white shadow-md shadow-brand-primary/15 hover:from-brand-dark hover:to-brand-primary transition-all active:scale-95"
            >
              로그인
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
