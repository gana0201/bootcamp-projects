// ============================================
// Dashboard.js - 대시보드 페이지 렌더링 및 로직
// ============================================

function renderDashboard() {
  return `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>PassFast - 수험 종목 통합 내비게이터</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest"></script>
  </head>
  <body class="bg-slate-50 text-slate-800 font-sans min-h-screen flex flex-col">
    <!-- 네비게이션 바 -->
    <header class="bg-slate-900 text-white sticky top-0 z-50 shadow-md">
      <div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div class="flex items-center space-x-3 cursor-pointer" onclick="navigateTo('index.html')">
          <div class="bg-gradient-to-tr from-indigo-500 to-sky-400 p-2 rounded-xl text-white shadow-md flex items-center justify-center">
            <i data-lucide="zap" class="w-5 h-5 fill-current"></i>
          </div>
          <h1 class="font-extrabold text-lg tracking-tight">PassFast</h1>
        </div>
      </div>
    </header>

    <main class="flex-1 max-w-7xl w-full mx-auto px-6 py-8 space-y-6">
      <!-- 대시보드 영역 -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-xl">
          <span class="bg-indigo-500/20 text-indigo-300 text-xs px-2.5 py-1 rounded-full font-semibold">대시보드 활성 자격증</span>
          <h2 id="display-certificate" class="text-3xl font-black mt-2">선택 대기 중</h2>
          <div class="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-slate-800/60">
            <div><p class="text-[10px] text-slate-400">목표 시험일</p><p id="display-date" class="text-xs font-bold mt-0.5">-</p></div>
            <div><p class="text-[10px] text-slate-400">통계 합격률</p><p id="display-passrate" class="text-xs font-bold text-amber-400 mt-0.5">-</p></div>
          </div>
        </div>
        
        <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div class="text-center bg-slate-50 p-4 rounded-xl">
            <p class="text-xs font-bold text-slate-400">잔여 기간</p>
            <h3 id="display-dday" class="text-4xl font-black text-slate-400 mt-1">D-?</h3>
          </div>
          <button onclick="startLearning()" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl text-xs mt-4">학습 스페이스 입장</button>
        </div>
      </div>

      <!-- 보관함 -->
      <div class="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800">
        <h3 class="font-bold text-sm text-indigo-300 mb-3 flex items-center gap-2">
          <i data-lucide="folder-heart" class="w-4 h-4"></i> 나의 수험 목표 보관함
          <span id="basket-count" class="text-[10px] bg-slate-800 px-2 py-0.5 rounded">0개</span>
        </h3>
        <div id="my-cert-basket" class="grid grid-cols-2 sm:grid-cols-4 gap-3"></div>
      </div>

      <!-- 카탈로그 및 폼 -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white p-6 rounded-2xl border border-slate-200">
          <h3 class="font-bold text-sm mb-4">전체 시험 종목 카탈로그</h3>
          <div id="tab-menu-container" class="space-y-1 mb-4"></div>
          <div id="items-grid-container" class="grid grid-cols-2 gap-2"></div>
        </div>

        <div class="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
          <input type="text" id="input-certificate" readonly class="w-full bg-slate-50 border p-3 rounded-xl font-bold text-indigo-600" placeholder="종목 선택 시 자동입력">
          <input type="date" id="input-date" class="w-full bg-slate-50 border p-3 rounded-xl text-xs">
          <input type="number" id="input-score" value="85" class="w-full bg-slate-50 border p-3 rounded-xl text-xs">
          <input type="text" id="input-memo" class="w-full bg-slate-50 border p-3 rounded-xl text-xs" placeholder="학습 다짐">
          <button onclick="addAndApplyDashboardData()" class="w-full bg-slate-900 text-white font-bold py-3 rounded-xl text-xs">등록 및 대시보드 반영</button>
        </div>
      </div>
    </main>

    <script>
      const MASTER_CERT_DATA = {
        "AI / 데이터 자격": ["프롬프트엔지니어", "빅데이터전문가", "데이터분석준전문가(ADsP)", "SQL개발자(SQLD)"],
        "디지털 소양 교육 자격": ["디지털리터러시지도사", "컴퓨터활용능력 1급", "컴퓨터활용능력 2급"],
        "개발 신기술 / 코딩 자격": ["정보처리기사", "정보처리산업기사", "네트워크관리사 2급"],
      };

      window.onload = function () {
        initVisualCategoryTabs();
        renderBasket();
        // 마지막 활성 자격증 불러오기
        const active = PassFast.getActiveCert();
        if (active) switchActiveDashboard(active);
        lucide.createIcons();
      };

      function renderBasket() {
        const basket = document.getElementById("my-cert-basket");
        const vault = PassFast.getVault();
        document.getElementById("basket-count").innerText = \`\${vault.length}개\`;
        
        basket.innerHTML = vault.length ? "" : '<div class="text-xs text-slate-500 col-span-full">등록된 종목이 없습니다.</div>';
        
        vault.forEach(item => {
          const card = document.createElement("div");
          card.className = "bg-slate-800 p-3 rounded-xl cursor-pointer hover:border-indigo-400 border border-transparent";
          card.onclick = () => switchActiveDashboard(item);
          card.innerHTML = \`<p class="text-xs font-bold truncate">\${item.name}</p><p class="text-[10px] text-slate-400">\${item.date}</p>\`;
          basket.appendChild(card);
        });
      }

      function addAndApplyDashboardData() {
        const name = document.getElementById("input-certificate").value;
        const cert = {
            certId: name, // Quiz.js와 호환되도록 id 필드와 동일하게 사용
            name: name,
            date: document.getElementById("input-date").value,
            score: document.getElementById("input-score").value,
            memo: document.getElementById("input-memo").value
        };
    if (!name || !cert.date) return alert("종목과 날짜를 입력하세요.");
    PassFast.addToVault(cert);
    PassFast.setActiveCert(cert);
    renderBasket();
  switchActiveDashboard(cert);
}

      function switchActiveDashboard(item) {
        PassFast.setActiveCert(item);
        document.getElementById("display-certificate").innerText = item.name;
        document.getElementById("display-date").innerText = item.date;
        document.getElementById("display-dday").innerText = \`D-\${PassFast.getDaysRemaining(item.date)}\`;
        document.getElementById("input-certificate").value = item.name;
        document.getElementById("input-date").value = item.date;
        document.getElementById("input-score").value = item.score;
        document.getElementById("input-memo").value = item.memo;
      }

      function startLearning() {
        const active = PassFast.getActiveCert();
        if (!active) return alert("자격증을 선택하세요.");
        navigateTo('quiz.html');
      }

      // (카탈로그 렌더링 함수들은 이전 로직 그대로 사용)
      function initVisualCategoryTabs() { /* ...생략... */ }
      function renderItemsGrid(category) { /* ...생략... */ }
    </script>
  </body>
</html>`;
}

module.exports = { renderDashboard };
