"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Ruler, ShieldCheck } from "lucide-react";

export default function Header() {
  const [user, setUser] = useState<{ name: string } | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (res.ok) return res.json();
        setUser(null);
        return null;
      })
      .then((data) => {
        if (data?.user?.name) setUser(data.user);
        else setUser(null);
      })
      .catch(() => setUser(null));
  }, [pathname]);

  return (
    <header className="sticky top-0 z-30 bg-brand-dark backdrop-blur-md border-b border-brand-dark/80 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="p-2.5 bg-brand-primary text-white rounded-xl shadow-md shadow-brand-primary/20">
            <Ruler className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-black text-white tracking-tight flex items-center gap-1.5">
              MeasureMe
              <span className="text-[10px] bg-brand-accent/20 text-brand-accent font-black px-1.5 py-0.5 rounded-md border border-brand-accent/30">
                AI Fit
              </span>
            </h1>
            <p className="text-[11px] text-white/50 font-medium">
              비전 기반 AI 핏 컨설팅 시스템
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-4">
          <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-bold text-white/60 bg-white/10 px-2.5 py-1 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-accent" /> 개인정보 보호 적용
          </span>

          {user && user.name ? (
            <Link
              href="/mypage"
              className="rounded-xl bg-white/10 border border-white/20 px-3.5 py-1.5 text-xs font-extrabold text-white hover:bg-white/20 transition-all"
            >
              {user.name}님
            </Link>
          ) : (
            <Link
              href="/login"
              className="rounded-xl bg-brand-accent px-4 py-2 text-xs font-extrabold text-white shadow-md shadow-brand-accent/20 hover:bg-brand-accent/90 transition-all active:scale-95"
            >
              로그인
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
