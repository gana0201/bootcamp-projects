// ============================================
// PassFast App - API 기반 상태 관리
// ============================================

const PassFast = {
  // activeCert는 세션 상태 (페이지 전환 시 유지용, localStorage)
  getActiveCert() {
    const data = localStorage.getItem("pf_active_cert");
    return data ? JSON.parse(data) : null;
  },
  setActiveCert(cert) {
    localStorage.setItem("pf_active_cert", JSON.stringify(cert));
  },
  clearActiveCert() {
    localStorage.removeItem("pf_active_cert");
  },

  // ==========================
  // 카탈로그 API
  // ==========================
  async getCatalog() {
    const res = await fetch("/api/catalog");
    return res.json();
  },
  async getQuestions(certId) {
    const res = await fetch(`/api/catalog/${certId}/questions`);
    return res.json();
  },
  async generateQuestions(certName, certDescription, count, weakSubjects) {
    const res = await fetch("/api/generate/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ certName, certDescription, count: count || 5, weakSubjects: weakSubjects || [] }),
    });
    if (!res.ok) return null;
    return res.json();
  },

  // ==========================
  // 보관함 API
  // ==========================
  async getVault() {
    const res = await fetch("/api/vault");
    return res.json();
  },
  async addToVault(cert) {
    const res = await fetch("/api/vault", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cert_id: cert.cert_id || cert.certId,
        target_date: cert.target_date || cert.date || null,
        target_time: cert.target_time || cert.time || null,
        target_score: cert.target_score || cert.score || 85,
        memo: cert.memo || "",
      }),
    });
    if (res.status === 409) return { duplicate: true };
    if (!res.ok) return { error: true };
    return res.json();
  },
  async removeFromVault(certId) {
    const res = await fetch(`/api/vault/${certId}`, { method: "DELETE" });
    return res.json();
  },

  // ==========================
  // 퀴즈 결과 API
  // ==========================
  async saveQuizResult(result) {
    const res = await fetch("/api/quiz/result", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cert_id: result.certId || result.cert_id,
        total_questions: result.totalQuestions || result.total_questions,
        correct_count: result.correctCount || result.correct_count || 0,
        wrong_count: result.wrongCount || result.wrong_count || 0,
        score_percent: result.scorePercent || result.score_percent || 0,
        passed: result.passed || false,
        answers: result.answers || [],
      }),
    });
    return res.json();
  },
  async getQuizHistory() {
    const res = await fetch("/api/quiz/history");
    return res.json();
  },
  async clearQuizHistory() {
    const res = await fetch("/api/quiz/history", { method: "DELETE" });
    return res.json();
  },

  // ==========================
  // 날짜 유틸
  // ==========================
  formatDate(date) {
    if (!date) return "-";
    const d = new Date(date);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  },
  getDDay(date) {
    if (!date) return "-";
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(date);
    target.setHours(0, 0, 0, 0);
    const diff = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
    return diff;
  },
  getDaysRemaining(date) {
    return this.getDDay(date);
  },

  // ==========================
  // 과목(Subjects) API
  // ==========================
  async getSubjects(certId) {
    const res = await fetch(`/api/catalog/${certId}/subjects`);
    return res.json();
  },

  // ==========================
  // 북마크(Bookmarks) API
  // ==========================
  async getBookmarks() {
    const res = await fetch("/api/bookmarks");
    return res.json();
  },
  async getBookmarksByCert(certId) {
    const res = await fetch(`/api/bookmarks/cert/${certId}`);
    return res.json();
  },
  async addBookmark(questionId, memo) {
    const res = await fetch("/api/bookmarks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question_id: questionId, memo: memo || "" }),
    });
    if (res.status === 409) return { duplicate: true };
    if (!res.ok) return { error: true };
    return res.json();
  },
  async removeBookmark(questionId) {
    const res = await fetch(`/api/bookmarks/${questionId}`, { method: "DELETE" });
    return res.json();
  },
  async isBookmarked(questionId) {
    const res = await fetch(`/api/bookmarks/check/${questionId}`);
    const data = await res.json();
    return data.bookmarked;
  },
};

// ============================================
// UUID 사용자 식별 (브라우저별 자동 발급)
// ============================================
function getUserId() {
  let userId = getCookie("pf_user_id");
  if (!userId) {
    userId = crypto.randomUUID ? crypto.randomUUID() : generateUUID();
    setCookie("pf_user_id", userId, 365 * 5); // 5년 유지
  }
  return userId;
}

function getCookie(name) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
}

function setCookie(name, value, days) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

// 페이지 로드 시 즉시 사용자 ID 확보
const PF_USER_ID = getUserId();

// ============================================
// 공통 네비게이션
// ============================================
function renderNav(activePage) {
  const nav = document.getElementById("main-nav");
  if (!nav) return;
  const links = [
    { href: "index.html", label: "대시보드", icon: "layout-dashboard" },
    { href: "quiz.html", label: "학습 스페이스", icon: "pen-tool" },
    { href: "review.html", label: "오답리포트", icon: "file-text" },
  ];

  nav.innerHTML = "";
  links.forEach((link) => {
    const a = document.createElement("a");
    a.href = link.href;
    a.className =
      "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all " +
      (activePage === link.href
        ? "bg-pf-dark text-white shadow-lg shadow-pf-dark/20"
        : "text-slate-400 hover:text-white hover:bg-white/10");

    if (link.href === "quiz.html") {
      // quiz.html 페이지에서 직접 안내
    }
    a.innerHTML = `<i data-lucide="${link.icon}" class="w-4 h-4"></i> ${link.label}`;
    nav.appendChild(a);
  });

  if (window.lucide) lucide.createIcons();
}

// ============================================
// 페이지 이동
// ============================================
function navigateTo(page) {
  location.href = page;
}

function goToQuiz() {
  location.href = "quiz.html";
}
