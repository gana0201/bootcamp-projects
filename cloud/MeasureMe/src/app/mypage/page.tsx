"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { AnalysisResult } from "@/types";

interface HistoryItem {
  id: string;
  userId: string;
  imageUrl: string;
  garmentData: { name: string; category: string; measurements: Record<string, number> };
  bodyAnalysis: object;
  report: {
    fitAnalysis: string;
    fitScore: number;
    sizeRecommendation: string;
    details: Record<string, string>;
    styling: string[];
    cautions: string[];
  };
  createdAt: string;
}

export default function MyPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);

  useEffect(() => {
    async function load() {
      // 유저 정보 확인
      const meRes = await fetch("/api/auth/me");
      if (!meRes.ok) {
        router.push("/login");
        return;
      }
      const meData = await meRes.json();
      setUser(meData.user);

      // 이력 로드
      const histRes = await fetch("/api/history");
      if (histRes.ok) {
        const histData = await histRes.json();
        setHistory(histData.data || []);
      }
      setLoading(false);
    }
    load();
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 프로필 헤더 */}
      <div className="flex items-center justify-between rounded-xl bg-white border p-6">
        <div>
          <h2 className="text-lg font-semibold">{user?.name}님</h2>
          <p className="text-sm text-gray-500">{user?.email}</p>
          <p className="text-xs text-gray-400 mt-1">
            총 {history.length}회 분석 완료
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          로그아웃
        </button>
      </div>

      {/* 분석 이력 */}
      <div>
        <h3 className="font-semibold mb-3">분석 이력</h3>

        {history.length === 0 ? (
          <div className="rounded-xl bg-white border p-8 text-center text-gray-500">
            <p className="text-3xl mb-2">📊</p>
            <p className="text-sm">아직 분석 이력이 없습니다</p>
            <button
              onClick={() => router.push("/")}
              className="mt-3 text-sm text-blue-600 hover:underline"
            >
              첫 분석 시작하기 →
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedItem(selectedItem?.id === item.id ? null : item)}
                className="rounded-xl bg-white border p-4 cursor-pointer hover:border-blue-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">
                      {item.garmentData.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(item.createdAt).toLocaleDateString("ko-KR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-blue-600">
                      {item.report.fitScore}
                    </span>
                    <span className="text-xs text-gray-400">/10</span>
                  </div>
                </div>

                {/* 상세 펼치기 */}
                {selectedItem?.id === item.id && (
                  <div className="mt-4 pt-4 border-t space-y-3">
                    <p className="text-sm text-gray-700">
                      {item.report.fitAnalysis}
                    </p>
                    <div className="rounded-lg bg-blue-50 p-3">
                      <p className="text-sm text-blue-800">
                        💡 {item.report.sizeRecommendation}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(item.report.details).map(([key, val]) => (
                        <div key={key} className="rounded bg-gray-50 p-2">
                          <span className="text-xs text-gray-500">{key}</span>
                          <p className="text-xs text-gray-700">{val}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
