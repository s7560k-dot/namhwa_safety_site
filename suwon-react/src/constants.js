export const SITES = {
  siteA: {
    id: 'siteA',
    name: '대광 새마을금고 골프연습장',
    months: 10,
    header: {
      period: '실착공일로부터 10개월 (2025.01 ~ 2025.10)',
      scale: '지하1층 ~ 지상4층 / 49타석 (철골+RC조)',
      goal: '중대재해 ZERO / 무재해 300일 달성'
    },
    constructionData: [
      { name: "가설/토공사", start: 1, duration: 1, color: "bg-grey", label: "가설(EGI)/터파기" },
      { name: "기초/지하골조", start: 2, duration: 1, color: "bg-blue", label: "기초/지하" },
      { name: "지상골조(RC)", start: 3, duration: 3, color: "bg-blue", label: "1F~4F 골조" },
      { name: "철골/철탑공사", start: 3, duration: 2, color: "bg-red", label: "철탑/타석 빔" },
      { name: "마감/창호/방수", start: 6, duration: 2, color: "bg-yellow", label: "내외장/방수" },
      { name: "비계해체/정리", start: 7, duration: 1, color: "bg-warning", label: "비계해체" },
      { name: "부대토목/조경", start: 9, duration: 1, color: "bg-green", label: "포장/조경" },
      { name: "준공/인계", start: 10, duration: 1, color: "bg-dark", label: "준공" }
    ],
    kpiData: [
      { month: 1, process: "가설(EGI), 터파기", risk: "가설물 전도, 협착", activity: "• [평가] 최초 위험성평가\n• [교육] 신규자 특별안전교육", kpi: "교육 이수율 100%", docs: "유해위험방지계획서" },
      { month: 2, process: "기초/지하 골조", risk: "거푸집 붕괴, 질식", activity: "• [평가] 상시 위험성평가\n• [교육] 밀폐공간 특별교육", kpi: "밀폐공간 허가 100%", docs: "콘크리트 타설승인" },
      { month: 3, process: "철탑(60m) 인양", risk: "크레인 전도, 낙하", activity: "• [평가] 철탑 인양 수시 위험성평가\n• [점검] 합동점검: 줄걸이 및 지반상태", kpi: "위험요인 개선율 90%↑", docs: "중량물 작업계획서" },
      { month: 4, process: "지상 골조", risk: "용접 화재, 추락", activity: "• [활동] 화기작업 허가제\n• [TBM] 철골 위 이동 시 생명줄", kpi: "화기작업 승인 100%", docs: "화기작업 허가서" },
      { month: 5, process: "옥상 골조", risk: "단부 추락, 붕괴", activity: "• [교육] 데크플레이트 특별교육\n• [점검] 데크 용접부 확인", kpi: "TBM 참여율 100%", docs: "비계조립 승인서" },
      { month: 6, process: "마감 공사", risk: "중독, 전도", activity: "• [활동] 밀폐공간 프로그램\n• [점검] 우기 대비 점검", kpi: "조치율 100%", docs: "MSDS 교육일지" },
      { month: 7, process: "비계 해체", risk: "추락, 낙하", activity: "• [평가] 해체작업 위험성평가\n• [점검] 하부 통제구역 설정", kpi: "아차사고 5건", docs: "해체 계획서" },
      { month: 8, process: "내부 수장", risk: "사다리 추락", activity: "• [교육] 비상 대피 훈련\n• [TBM] 사다리 전도방지", kpi: "비상훈련 완료", docs: "가설전기 점검표" },
      { month: 9, process: "부대 토목", risk: "장비 충돌", activity: "• [활동] 장비 유도원 배치\n• [점검] 장비 방호장치 확인", kpi: "장비점검 100%", docs: "기계기구 방호" },
      { month: 10, process: "준공 청소", risk: "전도", activity: "• [검토] 무재해 달성 확인\n• [정리] 안전시설물 철거", kpi: "무재해 달성", docs: "안전보건대장" }
    ],
    safetyRows: ["위험성평가", "안전교육", "협의체/회의", "법적점검", "성과측정"]
  },
  siteB: {
    id: "siteB",
    name: "수원 권선 노유자시설",
    months: 16, // Matching the provided HTML (16 months)
    header: {
      period: "실착공일로부터 16개월",
      scale: "지하1층 ~ 지상4층 (노유자시설)",
      goal: "중대재해 ZERO / 무재해 1000일 달성"
    },
    constructionData: [
      { name: "공통가설공사", start: 0, duration: 16, color: "bg-grey", label: "공통가설" },
      { name: "가설공사", start: 2, duration: 5, color: "bg-blue", label: "가설공사" },
      { name: "철근콘크리트", start: 4, duration: 11, color: "bg-red", label: "골조공사" },
      { name: "조적공사", start: 7, duration: 6, color: "bg-blue", label: "조적공사" },
      { name: "미장공사", start: 7, duration: 8, color: "bg-blue", label: "미장공사" },
      { name: "방수공사", start: 7, duration: 8, color: "bg-blue", label: "방수공사" },
      { name: "타일공사", start: 11, duration: 3, color: "bg-yellow", label: "타일공사" },
      { name: "석공사", start: 10, duration: 5, color: "bg-yellow", label: "석공사" },
      { name: "금속공사", start: 10, duration: 5, color: "bg-yellow", label: "금속공사" },
      { name: "창호공사", start: 7, duration: 8, color: "bg-yellow", label: "창호공사" },
      { name: "유리공사", start: 11, duration: 4, color: "bg-yellow", label: "유리공사" },
      { name: "도장공사", start: 10, duration: 5, color: "bg-yellow", label: "도장공사" },
      { name: "수장공사", start: 9, duration: 5, color: "bg-yellow", label: "수장공사" },
      { name: "장애인편의", start: 13, duration: 2, color: "bg-yellow", label: "장애인시설" },
      { name: "E/V공사", start: 11, duration: 4, color: "bg-yellow", label: "승강기" },
      { name: "조경공사", start: 13, duration: 2, color: "bg-green", label: "조경공사" },
      { name: "토목공사", start: 0, duration: 5, color: "bg-blue", label: "토목공사" },
      { name: "부대토목공사", start: 12, duration: 3, color: "bg-green", label: "부대토목" },
      { name: "기계설비공사", start: 4, duration: 11, color: "bg-grey", label: "기계설비" },
      { name: "전기통신공사", start: 4, duration: 11, color: "bg-grey", label: "전기통신" },
      { name: "소방공사", start: 5, duration: 10, color: "bg-grey", label: "소방공사" },
      { name: "준공/인계", start: 15, duration: 1, color: "bg-dark", label: "준공" }
    ],
    kpiData: Array.from({ length: 16 }, (_, i) => ({
      month: i + 1, process: "", risk: "", activity: "", kpi: "", docs: ""
    })),
    safetyRows: ["위험성평가", "안전교육", "협의체/회의", "법적점검", "성과측정"]
  },
  siteC: {
    id: "siteC",
    name: "평택 세탁소 현장 (Humphreys)",
    months: 38,
    header: {
      period: "2024.04.15 ~ 2027.05.21 (38개월)",
      scale: "Quartermaster Laundry/Dry Cleaner Facility (USACE)",
      goal: "Zero Incidents / USACE Safety Standards Compliance"
    },
    constructionData: [
      { name: "착공준비/인허가", start: 0, duration: 4, color: "bg-grey", label: "Initial Docs" },
      { name: "가설공사", start: 2, duration: 4, color: "bg-blue", label: "Temporary Works" },
      { name: "토공사 및 가시설", start: 5, duration: 6, color: "bg-orange", label: "Earthwork" },
      { name: "기초 및 골조공사", start: 10, duration: 18, color: "bg-red", label: "Foundation & RC" },
      { name: "기계/전기설비", start: 15, duration: 22, color: "bg-grey", label: "MEP Works" },
      { name: "내외장 마감공사", start: 25, duration: 12, color: "bg-yellow", label: "Finishing" },
      { name: "시운전 및 준공", start: 36, duration: 2, color: "bg-green", label: "Commissioning" }
    ],
    kpiData: Array.from({ length: 38 }, (_, i) => ({
      month: i + 1, process: "", risk: "", activity: "", kpi: "", docs: ""
    })),
    safetyRows: ["위험성평가", "안전교육", "협의체/회의", "법적점검", "성과측정"]
  }
};

export const ADMIN_PASSWORD = "1234";
