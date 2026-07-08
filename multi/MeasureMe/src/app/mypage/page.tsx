"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function MyPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) setUser(data.user);
        else router.push("/login");
      })
      .catch(() => router.push("/login"));
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  if (!user) return null;

  return (
    <div className="max-w-sm mx-auto py-12 space-y-6">
      <h1 className="text-2xl font-bold">마이페이지</h1>
      <div className="rounded-xl bg-white border p-6 space-y-3">
        <p className="text-sm text-gray-600">이름: <strong>{user.name}</strong></p>
        <p className="text-sm text-gray-600">이메일: <strong>{user.email}</strong></p>
      </div>
      <button
        onClick={handleLogout}
        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
      >
        로그아웃
      </button>
    </div>
  );
}
