"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const endpoint = isSignup ? "/api/auth/signup" : "/api/auth/login";
      const body = isSignup ? { name, email, password, rememberMe } : { email, password, rememberMe };
      const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || "오류가 발생했습니다"); }
      router.push("/mypage"); router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "오류가 발생했습니다"); } finally { setLoading(false); }
  };

  return (
    <div className="max-w-sm mx-auto py-12 space-y-6">
      <h1 className="text-2xl font-bold text-center text-slate-800">{isSignup ? "회원가입" : "로그인"}</h1>
      {error && <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-red-700 text-sm">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-2xl border border-brand-cream shadow-sm">
        {isSignup && (<div><label className="block text-sm font-medium text-slate-700 mb-1">이름</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full rounded-lg bg-brand-light border border-brand-cream px-3 py-2 text-sm text-slate-800 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary" /></div>)}
        <div><label className="block text-sm font-medium text-slate-700 mb-1">이메일</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full rounded-lg bg-brand-light border border-brand-cream px-3 py-2 text-sm text-slate-800 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary" /></div>
        <div><label className="block text-sm font-medium text-slate-700 mb-1">비밀번호</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full rounded-lg bg-brand-light border border-brand-cream px-3 py-2 text-sm text-slate-800 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary" /></div>
        <label className="flex items-center gap-2 cursor-pointer select-none"><input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="w-4 h-4 rounded border-brand-cream text-brand-primary focus:ring-brand-primary" /><span className="text-sm text-slate-600">자동 로그인</span></label>
        <button type="submit" disabled={loading} className="w-full rounded-lg bg-brand-accent px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-accent/90 disabled:opacity-50 transition-all">{loading ? "처리 중..." : isSignup ? "가입하기" : "로그인"}</button>
      </form>
      <p className="text-center text-sm text-slate-500">{isSignup ? "이미 계정이 있나요?" : "계정이 없나요?"}{" "}<button onClick={() => { setIsSignup(!isSignup); setError(""); }} className="text-brand-primary hover:underline font-medium">{isSignup ? "로그인" : "회원가입"}</button></p>
    </div>
  );
}
