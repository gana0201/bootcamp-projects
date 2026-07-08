// ============================================
// PassFast - DB 초기 데이터 삽입 (Seed)
// 실행: node server/seed.js
// ============================================
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { pool, query } = require("./db");

const CATALOG = [
  // IT (13)
  { id: "excel-pro", name: "엑셀실무전문가 1급", category: "IT", icon: "table", description: "엑셀을 활용한 실무 데이터 처리 및 분석 능력 검증", passing_score: 60, total_questions: 50, exam_time: 60 },
  { id: "computer-pro", name: "컴퓨터전문가 1급", category: "IT", icon: "monitor", description: "컴퓨터 하드웨어/소프트웨어 전반의 전문 지식 검증", passing_score: 60, total_questions: 50, exam_time: 60 },
  { id: "office-info", name: "컴퓨터사무정보처리사 1급", category: "IT", icon: "file-text", description: "사무 환경에서의 컴퓨터 정보처리 능력 평가", passing_score: 60, total_questions: 50, exam_time: 60 },
  { id: "oa-master", name: "컴퓨터OA마스터 1급", category: "IT", icon: "layout-grid", description: "OA 프로그램 활용 능력 종합 검증", passing_score: 60, total_questions: 50, exam_time: 60 },
  { id: "sw-edu", name: "소프트웨어교육지도사 1급", category: "IT", icon: "graduation-cap", description: "SW교육 커리큘럼 설계 및 지도 역량 평가", passing_score: 60, total_questions: 50, exam_time: 60 },
  { id: "bigdata-pro", name: "빅데이터전문가 1급", category: "IT", icon: "bar-chart-2", description: "빅데이터 수집·분석·시각화 전문 역량 검증", passing_score: 60, total_questions: 50, exam_time: 60 },
  { id: "infosec-pro", name: "정보보안전문가 1급", category: "IT", icon: "shield", description: "정보보안 체계 구축 및 운영 전문 능력 평가", passing_score: 60, total_questions: 50, exam_time: 60 },
  { id: "python-pro", name: "파이썬전문가 1급", category: "IT", icon: "code", description: "Python 프로그래밍 및 응용 개발 역량 검증", passing_score: 60, total_questions: 50, exam_time: 60 },
  { id: "network-pro", name: "네트워크전문가 1급", category: "IT", icon: "wifi", description: "네트워크 설계·구축·보안 전문 능력 평가", passing_score: 60, total_questions: 50, exam_time: 60 },
  { id: "digital-crime", name: "디지털범죄예방지도사 1급", category: "IT", icon: "alert-triangle", description: "디지털 범죄 예방 교육 및 지도 역량 검증", passing_score: 60, total_questions: 50, exam_time: 60 },
  { id: "hacking-sec", name: "해킹보안전문가 1급", category: "IT", icon: "lock", description: "모의해킹 및 보안 취약점 분석 전문 능력 평가", passing_score: 60, total_questions: 50, exam_time: 60 },
  { id: "mobile-tutor", name: "모바일디지털튜터 1급", category: "IT", icon: "smartphone", description: "모바일 기기 활용 교육 및 디지털 리터러시 지도", passing_score: 60, total_questions: 50, exam_time: 60 },
  { id: "smart-it", name: "스마트IT컴퓨터지도사 1급", category: "IT", icon: "cpu", description: "스마트 IT 환경 전반의 컴퓨터 교육 지도 능력", passing_score: 60, total_questions: 50, exam_time: 60 },
  // AI 과정 (7)
  { id: "chatgpt-pro", name: "챗GPT전문가 1급", category: "AI 과정", icon: "message-circle", description: "ChatGPT 활용 프롬프트 엔지니어링 및 업무 자동화 역량", passing_score: 60, total_questions: 50, exam_time: 60 },
  { id: "ai-pro", name: "인공지능(AI)전문가 1급", category: "AI 과정", icon: "brain", description: "AI 모델 설계·학습·배포 전반의 전문 역량 검증", passing_score: 60, total_questions: 50, exam_time: 60 },
  { id: "ai-data", name: "AI데이터전문가 1급", category: "AI 과정", icon: "database", description: "AI 학습용 데이터 수집·전처리·품질관리 능력 평가", passing_score: 60, total_questions: 50, exam_time: 60 },
  { id: "ai-marketing", name: "AI마케팅활용전문가 1급", category: "AI 과정", icon: "trending-up", description: "AI 기반 마케팅 전략 수립 및 도구 활용 역량", passing_score: 60, total_questions: 50, exam_time: 60 },
  { id: "metaverse", name: "메타버스지도사 1급", category: "AI 과정", icon: "globe", description: "메타버스 플랫폼 활용 및 콘텐츠 제작 교육 지도", passing_score: 60, total_questions: 50, exam_time: 60 },
  { id: "metaverse-nft", name: "메타버스NFT 1급", category: "AI 과정", icon: "hexagon", description: "NFT 발행·거래 및 메타버스 경제 시스템 이해", passing_score: 60, total_questions: 50, exam_time: 60 },
  { id: "metaverse-sports", name: "메타버스스포츠전문가 1급", category: "AI 과정", icon: "activity", description: "메타버스 기반 스포츠 콘텐츠 기획·운영 역량", passing_score: 60, total_questions: 50, exam_time: 60 },
  // 정보기술 (8)
  { id: "info-tech-pe", name: "정보관리 기술사", category: "정보기술", icon: "award", description: "정보시스템 기획·구축·운영 최고 수준 기술 자격", passing_score: 60, total_questions: 50, exam_time: 120 },
  { id: "info-process", name: "정보처리기사", category: "정보기술", icon: "monitor", description: "소프트웨어 개발 및 정보시스템 구축 전문 자격", passing_score: 60, total_questions: 100, exam_time: 150 },
  { id: "info-process-ind", name: "정보처리산업기사", category: "정보기술", icon: "monitor", description: "정보시스템 운영·유지보수 실무 기술 자격", passing_score: 60, total_questions: 80, exam_time: 120 },
  { id: "computer-sys", name: "컴퓨터시스템기사", category: "정보기술", icon: "server", description: "컴퓨터 시스템 설계·구축·관리 전문 자격", passing_score: 60, total_questions: 80, exam_time: 120 },
  { id: "info-device", name: "정보기기운용기능사", category: "정보기술", icon: "hard-drive", description: "정보기기 설치·운용·정비 실기 기능 자격", passing_score: 60, total_questions: 60, exam_time: 90 },
  { id: "office-auto", name: "사무자동화산업기사", category: "정보기술", icon: "settings", description: "사무자동화 시스템 구축·운영 산업기사 자격", passing_score: 60, total_questions: 80, exam_time: 120 },
  { id: "computer-app-pe", name: "컴퓨터응용시스템기술사", category: "정보기술", icon: "award", description: "컴퓨터 응용시스템 설계·개발 최고 수준 자격", passing_score: 60, total_questions: 50, exam_time: 120 },
  { id: "programming", name: "프로그래밍기능사", category: "정보기술", icon: "code", description: "프로그래밍 언어 활용 코딩 실기 기능 자격", passing_score: 60, total_questions: 60, exam_time: 90 },
  // 전자 (10)
  { id: "3d-printer-dev", name: "3D프린터개발산업기사", category: "전자", icon: "box", description: "3D프린터 하드웨어·소프트웨어 개발 산업기사 자격", passing_score: 60, total_questions: 60, exam_time: 90 },
  { id: "3d-printer-op", name: "3D프린터운용기능사", category: "전자", icon: "box", description: "3D프린터 장비 운용 및 출력물 후처리 기능 자격", passing_score: 60, total_questions: 60, exam_time: 90 },
  { id: "optics-ind", name: "광학기기산업기사", category: "전자", icon: "eye", description: "광학기기 설계·제조·검사 산업기사 자격", passing_score: 60, total_questions: 60, exam_time: 90 },
  { id: "optics-eng", name: "광학기사", category: "전자", icon: "eye", description: "광학 시스템 설계·분석 기사 자격", passing_score: 60, total_questions: 80, exam_time: 120 },
  { id: "robot-mech", name: "로봇기구개발기사", category: "전자", icon: "cog", description: "로봇 기구부 설계·제작 기사 자격", passing_score: 60, total_questions: 80, exam_time: 120 },
  { id: "robot-sw", name: "로봇소프트웨어개발기사", category: "전자", icon: "code", description: "로봇 제어 소프트웨어 개발 기사 자격", passing_score: 60, total_questions: 80, exam_time: 120 },
  { id: "robot-hw", name: "로봇하드웨어개발기사", category: "전자", icon: "cpu", description: "로봇 전자회로·센서 하드웨어 개발 기사 자격", passing_score: 60, total_questions: 80, exam_time: 120 },
  { id: "industrial-ctrl", name: "산업계측제어기술사", category: "전자", icon: "sliders", description: "산업 계측 및 제어 시스템 최고 수준 기술사 자격", passing_score: 60, total_questions: 50, exam_time: 120 },
  { id: "biomedical-eng", name: "의공기사", category: "전자", icon: "heart", description: "의료기기 설계·개발·관리 기사 자격", passing_score: 60, total_questions: 80, exam_time: 120 },
  { id: "biomedical-ind", name: "의공산업기사", category: "전자", icon: "heart", description: "의료기기 운용·유지보수 산업기사 자격", passing_score: 60, total_questions: 60, exam_time: 90 },
];

const QUESTIONS = {
  "excel-pro": [
    { question: "엑셀에서 절대참조를 나타내는 기호는?", choices: ["!", "#", "$", "&"], answer: 2, explanation: "$기호로 행/열을 고정합니다(예: $A$1).", subject: "수식과 함수" },
    { question: "VLOOKUP의 네 번째 인수가 FALSE일 때 의미는?", choices: ["근사값 일치", "정확히 일치", "오름차순", "내림차순"], answer: 1, explanation: "FALSE는 정확히 일치하는 값만 찾습니다.", subject: "수식과 함수" },
    { question: "피벗 테이블의 주요 용도는?", choices: ["차트 생성", "데이터 요약 및 집계", "매크로 실행", "셀 서식"], answer: 1, explanation: "피벗 테이블은 데이터를 다양한 기준으로 요약합니다.", subject: "데이터 분석" },
    { question: "=IF(A1>100,\"초과\",\"이하\")에서 A1=50일 때 결과는?", choices: ["초과", "이하", "50", "오류"], answer: 1, explanation: "50은 100보다 크지 않으므로 '이하'가 반환됩니다.", subject: "수식과 함수" },
    { question: "VBA에서 반복문 키워드는?", choices: ["For...Next", "While...End", "Loop...Until", "Repeat...Done"], answer: 0, explanation: "VBA 기본 반복문은 For...Next입니다.", subject: "매크로/VBA" },
  ],
  "computer-pro": [
    { question: "CPU의 구성요소가 아닌 것은?", choices: ["ALU", "제어장치", "레지스터", "하드디스크"], answer: 3, explanation: "하드디스크는 보조기억장치입니다.", subject: "하드웨어" },
    { question: "RAM의 특징은?", choices: ["비휘발성", "휘발성", "순차접근", "영구저장"], answer: 1, explanation: "RAM은 전원이 꺼지면 데이터가 사라지는 휘발성 메모리입니다.", subject: "하드웨어" },
    { question: "운영체제의 역할이 아닌 것은?", choices: ["메모리 관리", "프로세스 관리", "문서 작성", "파일 관리"], answer: 2, explanation: "문서 작성은 응용프로그램의 역할입니다.", subject: "소프트웨어" },
    { question: "1바이트는 몇 비트인가?", choices: ["4비트", "8비트", "16비트", "32비트"], answer: 1, explanation: "1바이트 = 8비트입니다.", subject: "하드웨어" },
    { question: "SSD가 HDD보다 빠른 이유는?", choices: ["자기 디스크 사용", "반도체 기반 저장", "더 큰 용량", "더 많은 플래터"], answer: 1, explanation: "SSD는 반도체(플래시 메모리) 기반이라 기계적 동작 없이 빠릅니다.", subject: "하드웨어" },
  ],
  "office-info": [
    { question: "워드프로세서에서 '단락'의 정의는?", choices: ["한 문장", "Enter키까지의 텍스트", "한 페이지", "한 줄"], answer: 1, explanation: "단락은 Enter키를 누를 때까지의 텍스트 단위입니다.", subject: "문서처리" },
    { question: "스프레드시트의 셀 주소 'B3'의 의미는?", choices: ["2행 3열", "3행 2열", "B행 3열", "3행 B열"], answer: 3, explanation: "B는 열(2번째), 3은 행을 나타냅니다.", subject: "스프레드시트" },
    { question: "데이터베이스에서 기본키(Primary Key)의 특징은?", choices: ["중복 허용", "NULL 허용", "유일성 보장", "외래키와 동일"], answer: 2, explanation: "기본키는 각 레코드를 유일하게 식별합니다.", subject: "데이터베이스" },
    { question: "프레젠테이션 소프트웨어의 주요 기능은?", choices: ["데이터 계산", "시각적 발표자료 제작", "코드 컴파일", "네트워크 관리"], answer: 1, explanation: "프레젠테이션 SW는 시각적 발표자료를 만드는 도구입니다.", subject: "프레젠테이션" },
    { question: "OA에서 '메일머지'란?", choices: ["이메일 삭제", "문서와 데이터를 결합하여 대량 문서 생성", "메일 암호화", "첨부파일 압축"], answer: 1, explanation: "메일머지는 양식 문서에 데이터를 결합하여 대량 문서를 생성합니다.", subject: "문서처리" },
  ],
  "oa-master": [
    { question: "한글(HWP)에서 표를 삽입하는 단축키는?", choices: ["Ctrl+N,T", "Ctrl+T", "Alt+T", "Ctrl+Insert"], answer: 0, explanation: "한글에서 Ctrl+N,T로 표를 삽입합니다.", subject: "문서작성" },
    { question: "엑셀에서 여러 시트의 같은 셀을 합산하는 함수는?", choices: ["SUM", "SUMIF", "3D SUM", "AGGREGATE"], answer: 2, explanation: "여러 시트에 걸친 합계는 3D 참조(예: =SUM(Sheet1:Sheet3!A1))를 사용합니다.", subject: "스프레드시트" },
    { question: "파워포인트 슬라이드 마스터의 용도는?", choices: ["애니메이션 설정", "전체 슬라이드의 통일된 디자인 적용", "동영상 삽입", "인쇄 설정"], answer: 1, explanation: "슬라이드 마스터는 전체 프레젠테이션의 일관된 레이아웃/디자인을 관리합니다.", subject: "프레젠테이션" },
    { question: "액세스(Access)에서 쿼리의 역할은?", choices: ["데이터 입력 화면", "데이터 검색·추출", "보고서 인쇄", "매크로 실행"], answer: 1, explanation: "쿼리는 조건에 맞는 데이터를 검색하고 추출하는 도구입니다.", subject: "데이터베이스" },
    { question: "OA 환경에서 PDF의 장점은?", choices: ["편집이 쉬움", "어떤 환경에서도 동일하게 표시", "파일 크기가 항상 작음", "동영상 재생 가능"], answer: 1, explanation: "PDF는 OS/기기에 관계없이 동일한 레이아웃으로 표시됩니다.", subject: "문서관리" },
  ],
  "sw-edu": [
    { question: "컴퓨팅 사고력(CT)의 핵심 요소가 아닌 것은?", choices: ["분해", "패턴인식", "추상화", "암기"], answer: 3, explanation: "CT의 핵심은 분해, 패턴인식, 추상화, 알고리즘입니다.", subject: "SW교육론" },
    { question: "스크래치(Scratch)는 어떤 유형의 프로그래밍 도구인가?", choices: ["텍스트 기반", "블록 기반", "기계어", "어셈블리"], answer: 1, explanation: "스크래치는 블록을 조립하여 프로그래밍하는 교육용 도구입니다.", subject: "교육도구" },
    { question: "알고리즘의 조건이 아닌 것은?", choices: ["유한성", "명확성", "무한 반복", "입출력"], answer: 2, explanation: "알고리즘은 반드시 유한한 시간 내에 종료되어야 합니다.", subject: "알고리즘" },
    { question: "언플러그드 활동이란?", choices: ["전원을 끈 컴퓨터 사용", "컴퓨터 없이 CT를 학습하는 활동", "오프라인 게임", "프린터 사용"], answer: 1, explanation: "언플러그드는 컴퓨터 없이 놀이/활동으로 컴퓨팅 개념을 학습합니다.", subject: "SW교육론" },
    { question: "피지컬 컴퓨팅에 사용되는 보드는?", choices: ["그래픽카드", "아두이노", "사운드카드", "공유기"], answer: 1, explanation: "아두이노는 센서/모터를 연결하여 피지컬 컴퓨팅을 구현하는 보드입니다.", subject: "교육도구" },
  ],
  "bigdata-pro": [
    { question: "빅데이터 3V에 해당하지 않는 것은?", choices: ["Volume", "Velocity", "Variety", "Validity"], answer: 3, explanation: "3V는 Volume, Velocity, Variety입니다.", subject: "데이터 수집" },
    { question: "Z-Score 표준화의 결과는?", choices: ["최소0 최대1", "평균0 표준편차1", "모두 양수", "합계100"], answer: 1, explanation: "Z-Score는 평균0, 표준편차1로 변환합니다.", subject: "데이터 전처리" },
    { question: "과적합 방지 방법이 아닌 것은?", choices: ["정규화", "교차검증", "데이터 증가", "모델 복잡도 증가"], answer: 3, explanation: "복잡도 증가는 과적합을 심화시킵니다.", subject: "데이터 분석" },
    { question: "피어슨 상관계수 범위는?", choices: ["0~1", "-1~0", "-1~1", "0~100"], answer: 2, explanation: "-1(음의 상관)~1(양의 상관) 범위입니다.", subject: "데이터 분석" },
    { question: "MapReduce의 Map 단계 역할은?", choices: ["데이터 집계", "데이터를 키-값 쌍으로 변환", "결과 출력", "데이터 정렬"], answer: 1, explanation: "Map은 입력 데이터를 키-값 쌍으로 변환하는 단계입니다.", subject: "데이터 수집" },
  ],
  "infosec-pro": [
    { question: "대칭키 암호화의 특징은?", choices: ["공개키+개인키", "같은 키로 암복호화", "해시 기반", "전자서명 전용"], answer: 1, explanation: "대칭키는 동일한 키로 암호화·복호화합니다.", subject: "정보보안 개론" },
    { question: "SQL Injection 방지법은?", choices: ["입력 길이 제한", "Prepared Statement", "HTTPS", "방화벽"], answer: 1, explanation: "Prepared Statement로 쿼리와 입력값을 분리합니다.", subject: "시스템 보안" },
    { question: "DDoS 공격의 목적은?", choices: ["데이터 탈취", "서비스 마비", "권한 상승", "암호 해독"], answer: 1, explanation: "DDoS는 대량 트래픽으로 서비스를 마비시킵니다.", subject: "네트워크 보안" },
    { question: "ISMS 인증 주관 기관은?", choices: ["KISA", "NIA", "ETRI", "TTA"], answer: 0, explanation: "KISA(한국인터넷진흥원)가 주관합니다.", subject: "법규" },
    { question: "방화벽의 주요 기능은?", choices: ["바이러스 치료", "트래픽 필터링", "데이터 암호화", "백업"], answer: 1, explanation: "방화벽은 규칙에 따라 트래픽을 허용/차단합니다.", subject: "네트워크 보안" },
  ],
  "python-pro": [
    { question: "리스트 마지막 요소 인덱스는?", choices: ["list[0]", "list[-1]", "list[last]", "list.end()"], answer: 1, explanation: "-1 인덱스가 마지막 요소입니다.", subject: "기초 문법" },
    { question: "딕셔너리에서 키 없을 때 기본값 반환 메서드는?", choices: [".find()", ".get()", ".default()", ".fetch()"], answer: 1, explanation: ".get(key, default)는 키 없을 때 기본값을 반환합니다.", subject: "기초 문법" },
    { question: "가상환경 생성 명령어는?", choices: ["pip install venv", "python -m venv myenv", "conda create env", "virtualenv --init"], answer: 1, explanation: "python -m venv 환경이름으로 생성합니다.", subject: "환경 설정" },
    { question: "O(n log n) 정렬 알고리즘은?", choices: ["버블정렬", "삽입정렬", "병합정렬", "선택정렬"], answer: 2, explanation: "병합정렬은 O(n log n)을 보장합니다.", subject: "알고리즘" },
    { question: "CSV 파일을 읽는 pandas 함수는?", choices: ["pd.open_csv()", "pd.read_csv()", "pd.load_csv()", "pd.import_csv()"], answer: 1, explanation: "pd.read_csv()로 읽습니다.", subject: "라이브러리" },
  ],
  "network-pro": [
    { question: "데이터링크 계층 전송 단위는?", choices: ["비트", "프레임", "패킷", "세그먼트"], answer: 1, explanation: "2계층은 프레임 단위입니다.", subject: "네트워크 기초" },
    { question: "서브넷마스크 255.255.255.0의 호스트 수는?", choices: ["256", "254", "255", "128"], answer: 1, explanation: "256-2(네트워크+브로드캐스트)=254개입니다.", subject: "TCP/IP" },
    { question: "HTTP 기본 포트는?", choices: ["21", "22", "80", "443"], answer: 2, explanation: "HTTP=80, HTTPS=443입니다.", subject: "TCP/IP" },
    { question: "ARP의 역할은?", choices: ["MAC→IP", "IP→MAC", "도메인→IP", "포트→서비스"], answer: 1, explanation: "ARP는 IP를 MAC으로 변환합니다.", subject: "TCP/IP" },
    { question: "VLAN 간 통신에 필요한 것은?", choices: ["허브", "리피터", "라우터", "모뎀"], answer: 2, explanation: "다른 VLAN 간 통신에는 라우터(L3)가 필요합니다.", subject: "라우팅" },
  ],
  "digital-crime": [
    { question: "피싱(Phishing)이란?", choices: ["악성코드 설치", "가짜 사이트로 개인정보 탈취", "DDoS 공격", "랜섬웨어 배포"], answer: 1, explanation: "피싱은 신뢰할 수 있는 사이트를 위장하여 정보를 탈취합니다.", subject: "사이버 범죄 유형" },
    { question: "랜섬웨어의 특징은?", choices: ["데이터 삭제", "파일 암호화 후 금전 요구", "네트워크 차단", "하드웨어 파괴"], answer: 1, explanation: "랜섬웨어는 파일을 암호화하고 복호화 대가를 요구합니다.", subject: "악성코드" },
    { question: "디지털 포렌식이란?", choices: ["해킹 기술", "전자적 증거 수집·분석", "방화벽 설정", "백업 수행"], answer: 1, explanation: "디지털 포렌식은 사이버 범죄의 증거를 수집·분석하는 과학입니다.", subject: "포렌식" },
    { question: "스미싱(Smishing)의 매체는?", choices: ["이메일", "문자메시지(SMS)", "전화", "팩스"], answer: 1, explanation: "스미싱은 SMS를 이용한 피싱 공격입니다.", subject: "사이버 범죄 유형" },
    { question: "개인정보보호법에서 민감정보에 해당하는 것은?", choices: ["이름", "전화번호", "건강정보", "주소"], answer: 2, explanation: "건강정보, 사상, 범죄경력 등은 민감정보로 분류됩니다.", subject: "법규" },
  ],
  "hacking-sec": [
    { question: "모의해킹(Penetration Testing)의 목적은?", choices: ["시스템 파괴", "취약점 사전 발견", "데이터 탈취", "서비스 중단"], answer: 1, explanation: "모의해킹은 공격자 관점에서 취약점을 사전에 발견합니다.", subject: "모의해킹" },
    { question: "XSS 공격이란?", choices: ["SQL 주입", "웹페이지에 악성 스크립트 삽입", "버퍼 오버플로우", "패킷 스니핑"], answer: 1, explanation: "XSS는 웹페이지에 스크립트를 삽입하여 사용자를 공격합니다.", subject: "웹 보안" },
    { question: "OWASP Top 10이란?", choices: ["보안 제품 순위", "웹 보안 취약점 상위 10가지", "해킹 도구 목록", "암호 알고리즘"], answer: 1, explanation: "OWASP Top 10은 가장 위험한 웹 보안 취약점 목록입니다.", subject: "웹 보안" },
    { question: "포트 스캐닝 도구는?", choices: ["Photoshop", "Nmap", "Excel", "Chrome"], answer: 1, explanation: "Nmap은 네트워크 포트 스캐닝 도구입니다.", subject: "네트워크 해킹" },
    { question: "제로데이 공격이란?", choices: ["0시에 하는 공격", "패치 전 취약점을 이용한 공격", "하루 만에 끝나는 공격", "무료 공격 도구"], answer: 1, explanation: "제로데이는 패치가 나오기 전의 취약점을 악용합니다.", subject: "취약점 분석" },
  ],
  "mobile-tutor": [
    { question: "안드로이드 앱 설치 파일 확장자는?", choices: [".exe", ".apk", ".dmg", ".ipa"], answer: 1, explanation: "안드로이드는 .apk, iOS는 .ipa를 사용합니다.", subject: "모바일 기초" },
    { question: "모바일 기기의 NFC 기능은?", choices: ["장거리 통신", "근거리 무선 통신", "위성 통신", "적외선 통신"], answer: 1, explanation: "NFC는 약 10cm 이내의 근거리 무선 통신입니다.", subject: "모바일 기술" },
    { question: "QR코드의 특징은?", choices: ["1차원 바코드", "2차원 매트릭스 코드", "음성 코드", "지문 인식"], answer: 1, explanation: "QR코드는 2차원 매트릭스 형태로 많은 정보를 담습니다.", subject: "모바일 활용" },
    { question: "모바일 보안에서 가장 기본적인 조치는?", choices: ["루팅", "화면 잠금 설정", "앱 삭제", "Wi-Fi 끄기"], answer: 1, explanation: "화면 잠금은 분실 시 정보 유출을 막는 기본 보안입니다.", subject: "모바일 보안" },
    { question: "클라우드 스토리지의 장점은?", choices: ["오프라인 전용", "기기 간 데이터 동기화", "속도 항상 빠름", "보안 불필요"], answer: 1, explanation: "클라우드는 여러 기기에서 동일 데이터에 접근할 수 있습니다.", subject: "모바일 활용" },
  ],
  "smart-it": [
    { question: "IoT(사물인터넷)의 핵심 요소가 아닌 것은?", choices: ["센서", "네트워크", "플랫폼", "프린터"], answer: 3, explanation: "IoT는 센서, 네트워크, 플랫폼, 서비스로 구성됩니다.", subject: "스마트 기술" },
    { question: "클라우드 컴퓨팅의 서비스 모델이 아닌 것은?", choices: ["IaaS", "PaaS", "SaaS", "HaaS"], answer: 3, explanation: "주요 모델은 IaaS, PaaS, SaaS입니다.", subject: "클라우드" },
    { question: "AI 스피커의 핵심 기술은?", choices: ["블루투스", "음성인식/자연어처리", "GPS", "NFC"], answer: 1, explanation: "AI 스피커는 음성인식과 NLP로 명령을 이해합니다.", subject: "AI 활용" },
    { question: "스마트홈에서 사용하는 통신 프로토콜은?", choices: ["HTTP", "Zigbee", "FTP", "SMTP"], answer: 1, explanation: "Zigbee는 저전력 근거리 통신으로 스마트홈에 적합합니다.", subject: "스마트 기술" },
    { question: "디지털 리터러시란?", choices: ["프로그래밍 능력", "디지털 기기·정보를 비판적으로 활용하는 능력", "타자 속도", "SNS 팔로워 수"], answer: 1, explanation: "디지털 리터러시는 디지털 환경에서 정보를 이해·활용·평가하는 역량입니다.", subject: "디지털 교육" },
  ],
  "chatgpt-pro": [
    { question: "프롬프트에서 '역할 부여'의 목적은?", choices: ["응답 길이 제한", "특정 관점으로 답변 유도", "오류 방지", "속도 향상"], answer: 1, explanation: "역할을 부여하면 해당 전문가 관점에서 답변합니다.", subject: "프롬프트 엔지니어링" },
    { question: "ChatGPT의 '환각'이란?", choices: ["서버 과부하", "사실 아닌 정보를 사실처럼 생성", "응답 거부", "반복 출력"], answer: 1, explanation: "환각은 존재하지 않는 정보를 그럴듯하게 생성하는 현상입니다.", subject: "윤리와 한계" },
    { question: "Few-shot 프롬프팅이란?", choices: ["질문만 전달", "예시를 포함하여 패턴 유도", "긴 문서 요약", "여러 모델 동시 사용"], answer: 1, explanation: "소수 예시로 원하는 출력 패턴을 유도합니다.", subject: "프롬프트 엔지니어링" },
    { question: "Temperature를 낮추면?", choices: ["더 창의적", "더 일관되고 보수적", "속도 증가", "토큰 감소"], answer: 1, explanation: "낮은 Temperature는 확률 높은 토큰을 선택하여 일관됩니다.", subject: "파라미터" },
    { question: "ChatGPT 업무 활용에 적합한 사례는?", choices: ["실시간 주가 예측", "반복 이메일 초안 작성", "법적 판결", "의료 진단"], answer: 1, explanation: "반복적 텍스트 작업이 가장 적합합니다.", subject: "업무 자동화" },
  ],
  "ai-pro": [
    { question: "지도학습에 해당하는 것은?", choices: ["군집화", "분류", "차원축소", "연관규칙"], answer: 1, explanation: "분류는 레이블된 데이터로 학습하는 지도학습입니다.", subject: "머신러닝" },
    { question: "CNN이 주로 사용되는 분야는?", choices: ["자연어처리", "이미지 인식", "시계열 예측", "추천 시스템"], answer: 1, explanation: "CNN은 합성곱 구조로 이미지 특징 추출에 강합니다.", subject: "딥러닝" },
    { question: "과적합 방지를 위한 기법은?", choices: ["학습률 증가", "드롭아웃", "레이어 추가", "배치 크기 감소"], answer: 1, explanation: "드롭아웃은 학습 시 일부 뉴런을 비활성화하여 과적합을 방지합니다.", subject: "딥러닝" },
    { question: "전이학습(Transfer Learning)이란?", choices: ["데이터 이동", "사전 학습 모델을 다른 작업에 활용", "서버 간 학습", "학습 취소"], answer: 1, explanation: "이미 학습된 모델의 지식을 새 작업에 재활용합니다.", subject: "모델 학습" },
    { question: "혼동행렬에서 Precision이란?", choices: ["실제양성 중 맞춘 비율", "예측양성 중 실제양성 비율", "전체 정확도", "재현율"], answer: 1, explanation: "Precision = TP/(TP+FP), 예측 양성 중 실제 양성 비율입니다.", subject: "모델 평가" },
  ],
  "ai-data": [
    { question: "데이터 레이블링이란?", choices: ["데이터 삭제", "데이터에 정답 태그 부여", "데이터 암호화", "데이터 압축"], answer: 1, explanation: "레이블링은 AI 학습을 위해 데이터에 정답을 표시하는 작업입니다.", subject: "데이터 전처리" },
    { question: "비정형 데이터의 예시는?", choices: ["엑셀 표", "이미지·동영상", "관계형 DB", "CSV 파일"], answer: 1, explanation: "이미지, 동영상, 텍스트 등 고정 형식이 없는 데이터입니다.", subject: "데이터 이해" },
    { question: "데이터 증강(Augmentation)의 목적은?", choices: ["데이터 삭제", "학습 데이터량 확보", "속도 향상", "용량 축소"], answer: 1, explanation: "데이터 증강은 회전, 반전 등으로 학습 데이터를 늘립니다.", subject: "데이터 전처리" },
    { question: "데이터 품질 관리에서 '완전성'이란?", choices: ["빠른 처리", "필수 데이터 누락 없음", "보안 유지", "정확한 형식"], answer: 1, explanation: "완전성은 필요한 데이터가 빠짐없이 존재하는 것입니다.", subject: "품질관리" },
    { question: "개인정보 비식별 처리 기법이 아닌 것은?", choices: ["가명처리", "데이터 마스킹", "원본 공개", "총계처리"], answer: 2, explanation: "원본 공개는 비식별 처리가 아닙니다.", subject: "윤리/법규" },
  ],
  "ai-marketing": [
    { question: "AI 마케팅에서 '개인화 추천'의 기반 기술은?", choices: ["블록체인", "협업 필터링", "VPN", "DNS"], answer: 1, explanation: "협업 필터링은 유사 사용자의 행동 기반으로 추천합니다.", subject: "추천 시스템" },
    { question: "A/B 테스트란?", choices: ["두 그룹에 다른 버전을 보여 성과 비교", "AI 모델 학습", "데이터 백업", "보안 테스트"], answer: 0, explanation: "A/B 테스트는 두 변형을 비교하여 효과적인 것을 선택합니다.", subject: "마케팅 실험" },
    { question: "고객 세그멘테이션에 사용되는 AI 기법은?", choices: ["회귀분석", "군집화(Clustering)", "CNN", "RNN"], answer: 1, explanation: "군집화로 유사 고객을 그룹화하여 세분화합니다.", subject: "고객 분석" },
    { question: "챗봇을 마케팅에 활용하는 주요 이점은?", choices: ["서버 비용 절감", "24시간 고객 응대", "SEO 향상", "광고비 제거"], answer: 1, explanation: "챗봇은 시간 제한 없이 고객 문의를 처리합니다.", subject: "AI 도구 활용" },
    { question: "마케팅에서 CTR이란?", choices: ["고객 이탈률", "광고 클릭률", "전환 비용", "도달 범위"], answer: 1, explanation: "CTR(Click-Through Rate)은 노출 대비 클릭 비율입니다.", subject: "성과 지표" },
  ],
  "metaverse": [
    { question: "메타버스의 4가지 유형에 해당하지 않는 것은?", choices: ["증강현실", "라이프로깅", "미러월드", "블록체인"], answer: 3, explanation: "4유형은 증강현실, 라이프로깅, 미러월드, 가상세계입니다.", subject: "메타버스 개론" },
    { question: "아바타(Avatar)란?", choices: ["AI 로봇", "가상공간에서의 사용자 분신", "VR 장비", "게임 캐릭터만"], answer: 1, explanation: "아바타는 메타버스에서 사용자를 대표하는 가상 존재입니다.", subject: "메타버스 개론" },
    { question: "VR과 AR의 차이는?", choices: ["VR은 일부 가상, AR은 완전 가상", "VR은 완전 가상, AR은 현실에 가상 결합", "동일한 기술", "VR은 2D, AR은 3D"], answer: 1, explanation: "VR은 완전한 가상환경, AR은 현실 위에 가상을 덧씌웁니다.", subject: "XR 기술" },
    { question: "메타버스 플랫폼 예시가 아닌 것은?", choices: ["로블록스", "제페토", "포토샵", "디센트럴랜드"], answer: 2, explanation: "포토샵은 이미지 편집 도구이지 메타버스 플랫폼이 아닙니다.", subject: "플랫폼" },
    { question: "메타버스에서 '월드빌딩'이란?", choices: ["건물 건축", "가상 공간/세계를 설계·구축하는 것", "웹사이트 제작", "코딩"], answer: 1, explanation: "월드빌딩은 메타버스 내 공간을 기획·제작하는 활동입니다.", subject: "콘텐츠 제작" },
  ],
  "metaverse-nft": [
    { question: "NFT란?", choices: ["대체 가능 토큰", "대체 불가능 토큰", "네트워크 토큰", "무료 토큰"], answer: 1, explanation: "NFT(Non-Fungible Token)는 고유한 디지털 자산 증명입니다.", subject: "NFT 기초" },
    { question: "NFT 발행에 사용되는 기술은?", choices: ["AI", "블록체인", "빅데이터", "클라우드"], answer: 1, explanation: "NFT는 블록체인 위에 스마트 컨트랙트로 발행됩니다.", subject: "블록체인" },
    { question: "NFT 마켓플레이스 예시는?", choices: ["아마존", "OpenSea", "넷플릭스", "유튜브"], answer: 1, explanation: "OpenSea는 대표적인 NFT 거래 마켓플레이스입니다.", subject: "NFT 거래" },
    { question: "가스비(Gas Fee)란?", choices: ["연료비", "블록체인 트랜잭션 수수료", "서버 비용", "전기요금"], answer: 1, explanation: "가스비는 블록체인 네트워크 이용 시 지불하는 수수료입니다.", subject: "블록체인" },
    { question: "PFP NFT란?", choices: ["물리적 제품", "프로필 사진용 NFT", "결제 토큰", "게임 아이템"], answer: 1, explanation: "PFP(Profile Picture)는 SNS 프로필에 사용하는 NFT 컬렉션입니다.", subject: "NFT 활용" },
  ],
  "metaverse-sports": [
    { question: "메타버스 스포츠의 예시는?", choices: ["실제 축구", "VR 피트니스 게임", "TV 중계", "신문 기사"], answer: 1, explanation: "VR 기반 피트니스·스포츠 게임이 메타버스 스포츠입니다.", subject: "메타버스 스포츠 개론" },
    { question: "e스포츠와 메타버스 스포츠의 차이는?", choices: ["동일함", "메타버스는 신체 활동 포함 가능", "e스포츠가 더 가상적", "차이 없음"], answer: 1, explanation: "메타버스 스포츠는 VR/AR로 신체 활동을 결합할 수 있습니다.", subject: "메타버스 스포츠 개론" },
    { question: "VR 스포츠에서 모션 트래킹이란?", choices: ["영상 녹화", "사용자 동작을 추적하여 반영", "점수 기록", "음성 인식"], answer: 1, explanation: "모션 트래킹은 센서로 사용자 움직임을 실시간 추적합니다.", subject: "기술" },
    { question: "메타버스 스포츠 콘텐츠 기획 시 고려사항이 아닌 것은?", choices: ["안전성", "몰입감", "접근성", "저작권 침해"], answer: 3, explanation: "기획 시 안전성, 몰입감, 접근성, 재미 요소를 고려합니다.", subject: "콘텐츠 기획" },
    { question: "메타버스 피트니스 플랫폼 예시는?", choices: ["Supernatural", "포토샵", "엑셀", "메모장"], answer: 0, explanation: "Supernatural은 VR 피트니스 플랫폼입니다.", subject: "플랫폼" },
  ],
  "info-tech-pe": [
    { question: "EA(Enterprise Architecture)의 목적은?", choices: ["코딩 표준", "조직의 IT 구조를 체계적으로 관리", "서버 구매", "인사 관리"], answer: 1, explanation: "EA는 비즈니스와 IT의 정렬을 위한 전사적 구조 관리입니다.", subject: "정보전략" },
    { question: "ITIL의 핵심 프로세스가 아닌 것은?", choices: ["인시던트 관리", "변경 관리", "제품 디자인", "문제 관리"], answer: 2, explanation: "ITIL은 IT 서비스 관리 프레임워크입니다.", subject: "IT서비스관리" },
    { question: "BCP(업무연속성계획)의 목적은?", choices: ["비용 절감", "재해 시 핵심 업무 유지", "신규 서비스 개발", "인력 채용"], answer: 1, explanation: "BCP는 재해/위기 상황에서도 핵심 업무를 지속하기 위한 계획입니다.", subject: "위기관리" },
    { question: "SOA란?", choices: ["보안 운영 체계", "서비스 지향 아키텍처", "소프트웨어 개발 방법론", "서버 운영 자동화"], answer: 1, explanation: "SOA는 재사용 가능한 서비스 단위로 시스템을 구성하는 아키텍처입니다.", subject: "정보전략" },
    { question: "데이터 거버넌스란?", choices: ["데이터 삭제 정책", "데이터 품질·보안·관리 체계", "DB 설치", "네트워크 설정"], answer: 1, explanation: "데이터 거버넌스는 조직 데이터의 품질, 보안, 활용을 관리하는 체계입니다.", subject: "데이터관리" },
  ],
  "info-process": [
    { question: "폭포수 모델의 특징은?", choices: ["반복 개발", "순차적 단계 진행", "프로토타입 우선", "애자일 기반"], answer: 1, explanation: "폭포수 모델은 단계를 순차적으로 완료 후 다음으로 진행합니다.", subject: "소프트웨어 설계" },
    { question: "SOLID 중 OCP란?", choices: ["단일 책임", "확장 열림·변경 닫힘", "의존성 역전", "인터페이스 분리"], answer: 1, explanation: "OCP는 확장에는 열려있고 변경에는 닫혀있어야 합니다.", subject: "소프트웨어 설계" },
    { question: "TCP 3-Way Handshake 순서는?", choices: ["SYN→ACK→SYN+ACK", "SYN→SYN+ACK→ACK", "ACK→SYN→SYN+ACK", "SYN+ACK→SYN→ACK"], answer: 1, explanation: "클라이언트 SYN → 서버 SYN+ACK → 클라이언트 ACK입니다.", subject: "네트워크" },
    { question: "3NF의 조건은?", choices: ["원자값", "부분 함수 종속 제거", "이행적 함수 종속 제거", "다치 종속 제거"], answer: 2, explanation: "3NF은 이행적 함수 종속을 제거합니다.", subject: "데이터베이스" },
    { question: "블랙박스 테스트가 아닌 것은?", choices: ["경계값 분석", "동치 분할", "조건/결정 커버리지", "상태 전이"], answer: 2, explanation: "조건/결정 커버리지는 화이트박스 기법입니다.", subject: "테스트" },
  ],
  "info-process-ind": [
    { question: "요구사항 분석 기법이 아닌 것은?", choices: ["인터뷰", "프로토타이핑", "코드 리뷰", "설문조사"], answer: 2, explanation: "코드 리뷰는 구현 단계의 활동입니다.", subject: "요구분석" },
    { question: "ERD의 구성요소가 아닌 것은?", choices: ["엔티티", "관계", "속성", "함수"], answer: 3, explanation: "ERD는 엔티티, 관계, 속성으로 구성됩니다.", subject: "데이터베이스" },
    { question: "형상관리 도구가 아닌 것은?", choices: ["Git", "SVN", "Photoshop", "CVS"], answer: 2, explanation: "Photoshop은 이미지 편집 도구입니다.", subject: "SW공학" },
    { question: "단위테스트의 목적은?", choices: ["전체 시스템 검증", "개별 모듈 검증", "성능 측정", "보안 점검"], answer: 1, explanation: "단위테스트는 개별 모듈/함수를 독립적으로 검증합니다.", subject: "테스트" },
    { question: "UML 다이어그램 종류가 아닌 것은?", choices: ["클래스 다이어그램", "시퀀스 다이어그램", "플로우차트", "유스케이스 다이어그램"], answer: 2, explanation: "플로우차트는 UML이 아닌 일반 순서도입니다.", subject: "SW설계" },
  ],
  "computer-sys": [
    { question: "캐시 메모리의 역할은?", choices: ["영구 저장", "CPU와 주기억장치 속도 차이 완충", "입출력 제어", "네트워크 연결"], answer: 1, explanation: "캐시는 CPU와 RAM 사이의 속도 차이를 줄여줍니다.", subject: "컴퓨터 구조" },
    { question: "RAID 0의 특징은?", choices: ["미러링", "스트라이핑(성능 향상)", "패리티 사용", "3중 복제"], answer: 1, explanation: "RAID 0은 데이터를 분산 저장하여 성능을 높입니다.", subject: "저장장치" },
    { question: "가상 메모리란?", choices: ["클라우드 메모리", "보조기억장치를 주기억장치처럼 사용", "그래픽 메모리", "캐시 확장"], answer: 1, explanation: "가상 메모리는 디스크 공간을 RAM처럼 활용합니다.", subject: "운영체제" },
    { question: "멀티스레드의 장점은?", choices: ["단일 작업", "동시 작업으로 효율 향상", "메모리 절약 불가", "보안 강화"], answer: 1, explanation: "멀티스레드는 여러 작업을 동시 처리하여 효율을 높입니다.", subject: "운영체제" },
    { question: "인터럽트의 역할은?", choices: ["전원 차단", "CPU에게 즉시 처리할 이벤트 알림", "데이터 암호화", "메모리 초기화"], answer: 1, explanation: "인터럽트는 CPU에게 우선 처리할 이벤트를 알립니다.", subject: "컴퓨터 구조" },
  ],
  "info-device": [
    { question: "프린터의 해상도 단위는?", choices: ["Hz", "DPI", "Mbps", "RPM"], answer: 1, explanation: "DPI(Dots Per Inch)는 인쇄 해상도 단위입니다.", subject: "출력장치" },
    { question: "UPS의 역할은?", choices: ["네트워크 연결", "정전 시 전원 공급", "데이터 백업", "냉각"], answer: 1, explanation: "UPS는 정전 시 일시적으로 전원을 공급합니다.", subject: "전원장치" },
    { question: "BIOS의 역할은?", choices: ["앱 설치", "하드웨어 초기화 및 OS 부팅", "인터넷 연결", "파일 관리"], answer: 1, explanation: "BIOS는 전원 투입 시 하드웨어를 초기화하고 OS를 로드합니다.", subject: "시스템" },
    { question: "USB 3.0의 이론적 최대 전송속도는?", choices: ["480Mbps", "5Gbps", "10Gbps", "1Gbps"], answer: 1, explanation: "USB 3.0은 최대 5Gbps(SuperSpeed)입니다.", subject: "인터페이스" },
    { question: "CMOS 배터리의 역할은?", choices: ["CPU 구동", "BIOS 설정 유지", "모니터 밝기", "팬 속도"], answer: 1, explanation: "CMOS 배터리는 전원 없이도 BIOS 설정과 시계를 유지합니다.", subject: "시스템" },
  ],
  "office-auto": [
    { question: "사무자동화의 목적이 아닌 것은?", choices: ["업무 효율 향상", "비용 절감", "인력 증가", "정보 공유 촉진"], answer: 2, explanation: "사무자동화는 인력을 줄이고 효율을 높이는 것이 목적입니다.", subject: "OA 개론" },
    { question: "그룹웨어의 기능이 아닌 것은?", choices: ["전자결재", "일정관리", "게임", "문서공유"], answer: 2, explanation: "그룹웨어는 협업을 위한 전자결재, 일정, 문서공유 등을 제공합니다.", subject: "협업도구" },
    { question: "OCR이란?", choices: ["온라인 코드 리뷰", "광학 문자 인식", "객체 관계 매핑", "출력 제어"], answer: 1, explanation: "OCR은 이미지 속 문자를 텍스트로 변환하는 기술입니다.", subject: "OA 기술" },
    { question: "전자문서의 법적 효력을 위해 필요한 것은?", choices: ["이메일 발송", "전자서명", "프린트 출력", "USB 저장"], answer: 1, explanation: "전자서명이 있어야 전자문서의 법적 효력이 인정됩니다.", subject: "법규" },
    { question: "RPA란?", choices: ["원격 프린터 연결", "로봇 프로세스 자동화", "실시간 분석", "보안 프로토콜"], answer: 1, explanation: "RPA는 소프트웨어 로봇이 반복 업무를 자동 수행하는 기술입니다.", subject: "OA 기술" },
  ],
  "computer-app-pe": [
    { question: "마이크로서비스 아키텍처의 특징은?", choices: ["하나의 큰 서비스", "독립적으로 배포 가능한 소규모 서비스", "단일 DB 필수", "동기 통신만 사용"], answer: 1, explanation: "마이크로서비스는 독립적 배포·확장 가능한 소규모 서비스 집합입니다.", subject: "시스템 아키텍처" },
    { question: "CAP 정리에서 동시에 보장 불가능한 조합은?", choices: ["CA", "CP", "AP", "세 가지 모두"], answer: 3, explanation: "분산 시스템에서 일관성, 가용성, 분할내성을 동시에 모두 보장할 수 없습니다.", subject: "분산시스템" },
    { question: "컨테이너 기술의 대표 도구는?", choices: ["VMware", "Docker", "Excel", "Photoshop"], answer: 1, explanation: "Docker는 컨테이너 기반 가상화의 대표적 도구입니다.", subject: "클라우드/인프라" },
    { question: "CI/CD의 의미는?", choices: ["고객 인터뷰/고객 데이터", "지속적 통합/지속적 배포", "컴퓨터 인터페이스", "중앙 정보 처리"], answer: 1, explanation: "CI/CD는 코드 변경을 자동으로 빌드·테스트·배포하는 프로세스입니다.", subject: "DevOps" },
    { question: "객체지향 설계에서 '캡슐화'란?", choices: ["상속 구현", "데이터와 메서드를 하나로 묶고 외부 은닉", "다형성 적용", "인터페이스 분리"], answer: 1, explanation: "캡슐화는 관련 데이터/기능을 하나로 묶고 외부에서 접근을 제한합니다.", subject: "객체지향" },
  ],
  "programming": [
    { question: "변수란?", choices: ["고정된 값", "데이터를 저장하는 메모리 공간", "함수의 종류", "출력 장치"], answer: 1, explanation: "변수는 프로그램에서 데이터를 저장하고 참조하는 공간입니다.", subject: "프로그래밍 기초" },
    { question: "if-else문의 역할은?", choices: ["반복 실행", "조건에 따른 분기 처리", "함수 정의", "입력 받기"], answer: 1, explanation: "if-else는 조건이 참/거짓에 따라 다른 코드를 실행합니다.", subject: "제어문" },
    { question: "배열의 인덱스는 보통 몇부터 시작하는가?", choices: ["1", "0", "-1", "10"], answer: 1, explanation: "대부분 프로그래밍 언어에서 배열 인덱스는 0부터 시작합니다.", subject: "자료구조" },
    { question: "함수(Function)의 장점은?", choices: ["코드 재사용", "실행 속도 저하", "메모리 낭비", "복잡도 증가"], answer: 0, explanation: "함수는 코드를 재사용하고 프로그램을 모듈화합니다.", subject: "함수" },
    { question: "무한루프란?", choices: ["한 번 실행", "종료 조건 없이 계속 반복", "함수 호출", "변수 선언"], answer: 1, explanation: "무한루프는 종료 조건이 없거나 만족되지 않아 영원히 반복합니다.", subject: "제어문" },
  ],
  "3d-printer-dev": [
    { question: "FDM 방식 3D프린터의 원리는?", choices: ["레이저 소결", "필라멘트 용융 적층", "UV 경화", "분말 접착"], answer: 1, explanation: "FDM은 플라스틱 필라멘트를 녹여 층층이 쌓는 방식입니다.", subject: "프린팅 기술" },
    { question: "G-code란?", choices: ["프로그래밍 언어", "3D프린터 동작 명령어", "설계 파일 형식", "재료 코드"], answer: 1, explanation: "G-code는 프린터의 이동, 온도 등을 제어하는 명령어입니다.", subject: "제어" },
    { question: "STL 파일이란?", choices: ["이미지 파일", "3D 모델의 표면 메시 파일", "음악 파일", "텍스트 파일"], answer: 1, explanation: "STL은 3D 모델을 삼각형 메시로 표현하는 표준 형식입니다.", subject: "모델링" },
    { question: "3D프린터에서 '서포트'의 역할은?", choices: ["속도 향상", "돌출부/공중 구조물 지지", "색상 변경", "소음 감소"], answer: 1, explanation: "서포트는 공중에 뜬 구조물이 무너지지 않도록 임시 지지합니다.", subject: "프린팅 기술" },
    { question: "슬라이서 소프트웨어의 역할은?", choices: ["3D 모델링", "3D모델을 프린터용 레이어로 변환", "사진 편집", "문서 작성"], answer: 1, explanation: "슬라이서는 3D모델을 층별로 나누어 G-code를 생성합니다.", subject: "소프트웨어" },
  ],
  "3d-printer-op": [
    { question: "3D프린팅 전 베드 레벨링의 목적은?", choices: ["속도 조절", "노즐과 베드 간 균일한 간격 확보", "색상 설정", "재료 교체"], answer: 1, explanation: "레벨링으로 첫 층의 접착력과 품질을 확보합니다.", subject: "장비 운용" },
    { question: "출력물 후처리 방법이 아닌 것은?", choices: ["샌딩", "아세톤 증기 처리", "도색", "슬라이싱"], answer: 3, explanation: "슬라이싱은 출력 전 단계이며 후처리가 아닙니다.", subject: "후처리" },
    { question: "노즐 막힘의 주요 원인은?", choices: ["너무 높은 온도", "이물질/탄화된 필라멘트", "베드가 너무 뜨거움", "팬 과속"], answer: 1, explanation: "이물질이나 탄화된 필라멘트가 노즐을 막는 주요 원인입니다.", subject: "유지보수" },
    { question: "PLA 필라멘트의 특징은?", choices: ["높은 내열성", "생분해성/친환경", "투명 전용", "금속 재질"], answer: 1, explanation: "PLA는 옥수수 전분 기반의 생분해성 친환경 소재입니다.", subject: "재료" },
    { question: "인필(Infill)이란?", choices: ["외벽 두께", "출력물 내부 채움 패턴/밀도", "서포트 종류", "베드 온도"], answer: 1, explanation: "인필은 출력물 내부를 얼마나, 어떤 패턴으로 채울지를 결정합니다.", subject: "출력 설정" },
  ],
  "optics-ind": [
    { question: "렌즈의 초점거리란?", choices: ["렌즈 두께", "렌즈에서 초점까지의 거리", "렌즈 지름", "렌즈 무게"], answer: 1, explanation: "초점거리는 렌즈 중심에서 빛이 모이는 초점까지의 거리입니다.", subject: "광학 기초" },
    { question: "볼록렌즈의 특징은?", choices: ["빛을 발산", "빛을 수렴(모음)", "빛을 차단", "빛을 반사"], answer: 1, explanation: "볼록렌즈는 평행광을 한 점(초점)으로 모읍니다.", subject: "광학 기초" },
    { question: "광학기기의 해상력이란?", choices: ["밝기", "두 점을 구별할 수 있는 능력", "배율", "색상 정확도"], answer: 1, explanation: "해상력은 가까이 있는 두 점을 분리하여 관찰하는 능력입니다.", subject: "광학 성능" },
    { question: "코팅(Coating)의 주요 목적은?", choices: ["무게 증가", "반사 방지/투과율 향상", "색상 변경", "경도 감소"], answer: 1, explanation: "렌즈 코팅은 표면 반사를 줄여 투과율을 높입니다.", subject: "제조 공정" },
    { question: "프리즘의 역할은?", choices: ["빛 차단", "빛의 분산/방향 전환", "열 발생", "소리 증폭"], answer: 1, explanation: "프리즘은 빛을 굴절시켜 분산하거나 방향을 바꿉니다.", subject: "광학 부품" },
  ],
  "optics-eng": [
    { question: "스넬의 법칙(굴절 법칙)과 관련된 물리량은?", choices: ["질량", "굴절률", "전압", "저항"], answer: 1, explanation: "스넬의 법칙은 두 매질의 굴절률 비로 굴절각을 결정합니다.", subject: "광학 이론" },
    { question: "광섬유 통신의 원리는?", choices: ["전기 전도", "전반사를 이용한 빛 전송", "자기장", "음파"], answer: 1, explanation: "광섬유는 전반사로 빛을 가두어 장거리 데이터를 전송합니다.", subject: "응용광학" },
    { question: "회절이란?", choices: ["빛이 직진", "빛이 장애물 뒤로 퍼지는 현상", "빛이 반사", "빛이 흡수"], answer: 1, explanation: "회절은 빛이 좁은 틈이나 장애물 주변에서 퍼지는 현상입니다.", subject: "광학 이론" },
    { question: "레이저의 특징이 아닌 것은?", choices: ["단색성", "결맞음(가간섭성)", "지향성", "발산성"], answer: 3, explanation: "레이저는 발산이 적은 높은 지향성을 가집니다.", subject: "레이저" },
    { question: "광학 설계 소프트웨어 예시는?", choices: ["Photoshop", "Zemax", "Word", "Excel"], answer: 1, explanation: "Zemax는 광학 시스템 설계·시뮬레이션 전문 소프트웨어입니다.", subject: "설계" },
  ],
  "robot-mech": [
    { question: "로봇의 자유도(DOF)란?", choices: ["속도", "독립적으로 움직일 수 있는 축의 수", "무게", "크기"], answer: 1, explanation: "DOF는 로봇이 독립적으로 운동할 수 있는 방향의 수입니다.", subject: "로봇 기구학" },
    { question: "로봇 팔의 말단장치(End Effector)란?", choices: ["전원장치", "작업을 수행하는 끝단 도구", "제어기", "센서"], answer: 1, explanation: "End Effector는 그리퍼, 용접기 등 실제 작업을 수행하는 부분입니다.", subject: "기구 설계" },
    { question: "감속기(Reducer)의 역할은?", choices: ["속도 증가", "토크 증가/속도 감소", "전원 공급", "신호 전송"], answer: 1, explanation: "감속기는 모터 회전수를 줄이고 토크를 높입니다.", subject: "구동장치" },
    { question: "관절형(Articulated) 로봇의 특징은?", choices: ["직선 이동만 가능", "여러 회전 관절로 높은 유연성", "고정형", "2축만 사용"], answer: 1, explanation: "관절형 로봇은 여러 회전 관절로 복잡한 동작이 가능합니다.", subject: "로봇 유형" },
    { question: "역기구학(Inverse Kinematics)이란?", choices: ["관절값→말단 위치 계산", "말단 위치→관절값 계산", "속도 계산", "힘 계산"], answer: 1, explanation: "역기구학은 원하는 말단 위치에서 필요한 관절값을 구합니다.", subject: "로봇 기구학" },
  ],
  "robot-sw": [
    { question: "ROS란?", choices: ["로봇 운영체제 프레임워크", "원격 제어 시스템", "로봇 판매 서비스", "3D 모델링 툴"], answer: 0, explanation: "ROS(Robot Operating System)는 로봇 SW 개발 프레임워크입니다.", subject: "로봇 SW 플랫폼" },
    { question: "PID 제어에서 P는?", choices: ["Power", "Proportional(비례)", "Position", "Process"], answer: 1, explanation: "P는 현재 오차에 비례하여 제어하는 비례 제어입니다.", subject: "제어 알고리즘" },
    { question: "SLAM이란?", choices: ["로봇 충전", "동시 위치추정 및 지도작성", "속도 제어", "통신 프로토콜"], answer: 1, explanation: "SLAM은 로봇이 환경 지도를 만들며 동시에 위치를 추정합니다.", subject: "자율주행" },
    { question: "로봇 시뮬레이션 도구 예시는?", choices: ["포토샵", "Gazebo", "엑셀", "파워포인트"], answer: 1, explanation: "Gazebo는 ROS와 연동되는 3D 로봇 시뮬레이터입니다.", subject: "시뮬레이션" },
    { question: "센서 퓨전이란?", choices: ["센서 파괴", "여러 센서 데이터를 결합하여 정확도 향상", "센서 교체", "단일 센서 사용"], answer: 1, explanation: "센서 퓨전은 여러 센서 정보를 결합하여 더 정확한 인식을 합니다.", subject: "센서" },
  ],
  "robot-hw": [
    { question: "서보모터의 특징은?", choices: ["위치 제어 불가", "정밀한 각도/위치 제어 가능", "DC 전원 불필요", "속도만 제어"], answer: 1, explanation: "서보모터는 피드백으로 정밀한 위치/각도를 제어합니다.", subject: "구동부" },
    { question: "IMU 센서가 측정하는 것은?", choices: ["온도", "가속도와 각속도", "거리", "무게"], answer: 1, explanation: "IMU는 관성 측정 장치로 가속도와 각속도를 측정합니다.", subject: "센서" },
    { question: "PCB란?", choices: ["전원 케이블", "인쇄회로기판", "프로그래밍 도구", "로봇 관절"], answer: 1, explanation: "PCB(Printed Circuit Board)는 전자부품을 연결하는 기판입니다.", subject: "전자회로" },
    { question: "엔코더의 역할은?", choices: ["전원 공급", "모터의 회전 위치/속도 측정", "통신", "냉각"], answer: 1, explanation: "엔코더는 모터 축의 회전량을 디지털 신호로 변환합니다.", subject: "센서" },
    { question: "MCU란?", choices: ["대형 컴퓨터", "마이크로 컨트롤러 유닛", "모니터", "메모리 카드"], answer: 1, explanation: "MCU는 로봇 제어에 사용되는 소형 프로세서입니다.", subject: "제어부" },
  ],
  "industrial-ctrl": [
    { question: "PLC란?", choices: ["개인용 컴퓨터", "프로그래머블 로직 컨트롤러", "프린터 장치", "전화 교환기"], answer: 1, explanation: "PLC는 산업 자동화에서 순차/논리 제어를 수행하는 장치입니다.", subject: "제어 시스템" },
    { question: "SCADA 시스템의 역할은?", choices: ["문서 작성", "원격 감시 및 데이터 수집", "게임", "3D 프린팅"], answer: 1, explanation: "SCADA는 산업 시설을 원격으로 감시·제어하는 시스템입니다.", subject: "감시 시스템" },
    { question: "4~20mA 신호의 장점은?", choices: ["높은 전압", "노이즈에 강하고 단선 감지 가능", "무선 전송", "디지털 신호"], answer: 1, explanation: "4~20mA는 0mA(단선)를 감지할 수 있고 노이즈에 강합니다.", subject: "계측" },
    { question: "RTD 온도센서의 원리는?", choices: ["빛 감지", "저항값이 온도에 따라 변화", "압력 측정", "유량 측정"], answer: 1, explanation: "RTD는 온도 변화에 따른 금속 저항 변화를 이용합니다.", subject: "계측" },
    { question: "DCS와 PLC의 주요 차이는?", choices: ["동일 장치", "DCS는 분산 제어, PLC는 순차 제어에 특화", "PLC가 더 비쌈", "DCS는 소형"], answer: 1, explanation: "DCS는 대규모 연속 공정, PLC는 이산 순차 제어에 적합합니다.", subject: "제어 시스템" },
  ],
  "biomedical-eng": [
    { question: "의료기기 등급 분류 중 가장 위험도가 높은 등급은?", choices: ["1등급", "2등급", "3등급", "4등급"], answer: 3, explanation: "4등급은 인체에 직접 삽입되는 등 위험도가 가장 높습니다.", subject: "의료기기 규제" },
    { question: "MRI의 원리는?", choices: ["X선", "자기공명", "초음파", "적외선"], answer: 1, explanation: "MRI는 강한 자기장과 고주파로 인체를 영상화합니다.", subject: "영상의학" },
    { question: "생체신호 중 ECG가 측정하는 것은?", choices: ["뇌파", "심전도", "근전도", "안전도"], answer: 1, explanation: "ECG(Electrocardiogram)는 심장의 전기적 활동을 기록합니다.", subject: "생체계측" },
    { question: "의료기기 GMP란?", choices: ["게임 플랫폼", "제조 및 품질관리 기준", "의사 자격증", "보험 제도"], answer: 1, explanation: "GMP는 의료기기의 제조·품질관리 적합 기준입니다.", subject: "의료기기 규제" },
    { question: "인공심장판막의 소재 조건은?", choices: ["전도성", "생체적합성", "자성", "방사성"], answer: 1, explanation: "체내 삽입 소재는 면역반응을 일으키지 않는 생체적합성이 필수입니다.", subject: "생체재료" },
  ],
  "biomedical-ind": [
    { question: "의료기기 유지보수 시 가장 중요한 것은?", choices: ["외관 청소", "안전성 검증 및 교정", "색상 변경", "소프트웨어 업데이트만"], answer: 1, explanation: "환자 안전을 위해 정기적 안전성 검증과 교정이 최우선입니다.", subject: "유지보수" },
    { question: "제세동기(AED)의 용도는?", choices: ["혈압 측정", "심실세동 시 전기 충격으로 정상 리듬 회복", "체온 측정", "혈당 검사"], answer: 1, explanation: "AED는 심정지 시 전기 충격으로 심장 리듬을 되돌립니다.", subject: "응급장비" },
    { question: "의료기기 세척과 멸균의 차이는?", choices: ["동일", "세척=오염물 제거, 멸균=모든 미생물 사멸", "세척이 더 강력", "멸균은 물 세척"], answer: 1, explanation: "세척은 눈에 보이는 오염 제거, 멸균은 모든 미생물을 사멸시킵니다.", subject: "감염관리" },
    { question: "의료기기 이상 발생 시 첫 번째 조치는?", choices: ["폐기", "사용 중지 및 보고", "계속 사용", "수리 시도"], answer: 1, explanation: "이상 발생 시 즉시 사용을 중지하고 관련 부서에 보고합니다.", subject: "안전관리" },
    { question: "전기안전 검사에서 누설전류 허용 기준은?", choices: ["제한 없음", "환자 접촉부는 매우 낮은 기준 적용", "100mA 이하", "AC만 적용"], answer: 1, explanation: "환자 접촉 의료기기는 엄격한 누설전류 기준이 적용됩니다.", subject: "전기안전" },
  ],
};

async function seed() {
  console.log("[Seed] 시작...");
  try {
    await query("DROP TABLE IF EXISTS bookmarks CASCADE");
    await query("DROP TABLE IF EXISTS quiz_results CASCADE");
    await query("DROP TABLE IF EXISTS questions CASCADE");
    await query("DROP TABLE IF EXISTS subjects CASCADE");
    await query("DROP TABLE IF EXISTS vault CASCADE");
    await query("DROP TABLE IF EXISTS catalog CASCADE");
    console.log("[Seed] 기존 테이블 삭제 완료");

    const schemaPath = path.join(__dirname, "schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf-8");
    await query(schema);
    console.log("[Seed] 스키마 생성 완료");

    for (const cert of CATALOG) {
      await query(
        `INSERT INTO catalog (id, name, category, icon, description, passing_score, total_questions, exam_time) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [cert.id, cert.name, cert.category, cert.icon, cert.description, cert.passing_score, cert.total_questions, cert.exam_time]
      );
    }
    console.log("[Seed] 카탈로그 " + CATALOG.length + "건 삽입 완료");

    // 과목 자동 추출 (문제의 subject 필드에서)
    const subjectMap = {};
    for (const certId in QUESTIONS) {
      const subjects = [...new Set(QUESTIONS[certId].map(q => q.subject).filter(Boolean))];
      for (let i = 0; i < subjects.length; i++) {
        const result = await query(
          `INSERT INTO subjects (cert_id, name, sort_order) VALUES ($1, $2, $3) RETURNING id`,
          [certId, subjects[i], i + 1]
        );
        subjectMap[certId + ":" + subjects[i]] = result.rows[0].id;
      }
    }
    console.log("[Seed] 과목 삽입 완료");

    let totalQ = 0;
    for (const certId in QUESTIONS) {
      for (const q of QUESTIONS[certId]) {
        const subjectId = q.subject ? subjectMap[certId + ":" + q.subject] || null : null;
        await query(
          `INSERT INTO questions (cert_id, subject_id, question, choices, answer, explanation) VALUES ($1,$2,$3,$4,$5,$6)`,
          [certId, subjectId, q.question, JSON.stringify(q.choices), q.answer, q.explanation]
        );
        totalQ++;
      }
    }
    console.log("[Seed] 문제 " + totalQ + "건 삽입 완료");
    console.log("[Seed] 완료!");
  } catch (err) {
    console.error("[Seed] 오류:", err.message);
  } finally {
    await pool.end();
  }
}

seed();
