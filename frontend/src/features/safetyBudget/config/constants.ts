/**
 * 산안비 실행예산 모듈의 임계값·상수 정의.
 * 법령에서 유래한 수치(요율, 한도 비율)는 여기 두지 않는다 → regulation.config.ts 참고.
 * 여기 있는 값들은 제품/운영상의 경보 기준일 뿐, 법적 근거가 있는 수치가 아니다.
 */

/** 산안비 비목(사용 항목) 코드. 고용노동부 고시 별표의 사용내역 분류를 따른다. */
export const BUDGET_ITEM_CODES = [
    'LABOR', // 인건비 (안전관리자 등)
    'SAFETY_FACILITY', // 안전시설비
    'PPE', // 개인보호구
    'EDUCATION', // 안전보건교육비
    'TECH_GUIDANCE', // 기술지도비
    'SMART_EQUIPMENT', // 스마트 안전장비
    'HEADQUARTERS_USAGE', // 본사 사용분
] as const;

export type BudgetItemCode = (typeof BUDGET_ITEM_CODES)[number];

/** 비목 코드의 화면 표시용 한글 라벨. */
export const BUDGET_ITEM_CODE_LABELS: Record<BudgetItemCode, string> = {
    LABOR: '인건비',
    SAFETY_FACILITY: '안전시설비',
    PPE: '개인보호구',
    EDUCATION: '안전보건교육비',
    TECH_GUIDANCE: '기술지도비',
    SMART_EQUIPMENT: '스마트 안전장비',
    HEADQUARTERS_USAGE: '본사 사용분',
};

/**
 * 결제 적격 항목으로 인정하는 코드 목록 (F3 적격성 심사용).
 * 고시 개정으로 특정 비목이 일시적으로 인정 제외되면 코드 수정 없이 이 목록만 갱신하면 된다.
 * HEADQUARTERS_USAGE는 여기서는 "적격"이지만, 별도로 금액 상한 심사(F12, checkHeadquartersUsageCap)를 추가로 통과해야 한다.
 */
export const ELIGIBLE_ITEM_CODES: readonly BudgetItemCode[] = [...BUDGET_ITEM_CODES] as const;

/** 불인정 시 등록을 유도할 대체 비목 코드(산안비 원장 밖). */
export const FALLBACK_NON_SAFETY_ITEM_CODE = 'SITE_GENERAL_EXPENSE';

/** 공정률 편차(%p) 기준 경보 단계 임계값. */
export const DEVIATION_ALERT_THRESHOLDS = {
    /** |편차| < CAUTION → 정상 */
    CAUTION: 5,
    /** CAUTION <= |편차| < WARNING → 주의, |편차| >= WARNING → 경고 */
    WARNING: 10,
} as const;

export type AlertLevel = 'normal' | 'caution' | 'warning';

/** 목표 누적 집행률 S-곡선의 기본 형태. 초기 집중형(front-loaded)을 기본값으로 사용. */
export const DEFAULT_S_CURVE_SHAPE = {
    /** 0~1 사이 지수. 1보다 작을수록 초기(공정률 낮은 구간)에 집행을 더 앞당겨 배분한다. */
    frontLoadExponent: 0.7,
} as const;

/** 위험 가중치 합계 검증 시 허용 오차 (부동소수점 오차 보정용). */
export const RISK_WEIGHT_SUM_TOLERANCE = 0.001;

/**
 * 감사 준비도 점수(F11) 가중치. 법적 근거가 있는 수치가 아니라 운영상 판단 기준이며,
 * 화면에는 이 가중치와 산식을 함께 표시해 근거를 투명하게 드러낸다.
 */
export const AUDIT_READINESS_WEIGHTS = {
    documentation: 0.25, // PTW/TBM 연결 비율
    evidenceAttachment: 0.25, // 증빙 링크 첨부율
    suspiciousCount: 0.25, // 목적 외 의심 건수 (적을수록 고득점)
    deviationControl: 0.25, // S-곡선 편차 관리 (작을수록 고득점)
} as const;

/** 목적 외 의심 1건당 감점 점수 (0~100 만점 기준). */
export const SUSPICIOUS_EXPENSE_PENALTY_PER_CASE = 20;

/** 편차 1%p당 감점 점수 (0~100 만점 기준). */
export const DEVIATION_PENALTY_PER_PERCENT_POINT = 5;

/** ResourceCenter.jsx의 현장 목록과 동일한 siteId를 사용한다 (진행 현장이 늘어나면 두 곳 모두 갱신 필요). */
export const SITE_OPTIONS = [
    { id: 'siteA', label: '대광 새마을금고 골프연습장' },
    { id: 'siteB', label: '수원 노유자시설 신축공사' },
    { id: 'siteC', label: '평택 세탁소 시설 신축공사' },
] as const;
