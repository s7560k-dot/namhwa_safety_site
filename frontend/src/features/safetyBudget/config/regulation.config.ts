/**
 * 법령·고시에서 유래하는 수치만 모아두는 설정 파일.
 * 값은 반드시 고용노동부 고시 원문·산업안전보건공단 공식 자료로 확인 후 채운다.
 * 확인 전에는 undefined(TODO)로 두고, 이 값을 사용하는 기능은 값이 없으면 계산을 거부해야 한다.
 */

/** 계상요율표의 공사종류 구분. 고용노동부 고시 별표1 기준 명칭. */
export const CONSTRUCTION_CATEGORIES = ['건축공사', '토목공사', '중건설공사', '특수건설공사'] as const;
export type ConstructionCategory = (typeof CONSTRUCTION_CATEGORIES)[number];

export interface CalculationRateTableEntry {
    /** 대상액 5억원 미만 요율 (%) */
    under5억Rate: number;
    /** 대상액 5억원 이상 50억원 미만 요율 (%) */
    between5And50억Rate: number;
    /** 대상액 5억원 이상 50억원 미만 구간 기초액 (원) */
    between5And50억BaseAmount: number;
    /** 대상액 50억원 이상 요율 (%) */
    over50억Rate: number;
}

/**
 * 공사종류별 산안비 계상요율표.
 * 출처: 고용노동부고시 제2025-11호(건설업 산업안전보건관리비 계상 및 사용기준, 2025.2.12. 시행) 별표1, 2차 출처 대조.
 * TODO(고시 원문 최종 확인 필요): 국가법령정보센터(law.go.kr)에서 별표1 원문 PDF로 한 번 더 대조할 것.
 *   - 실사용 샘플(대광새마을금고 골프연습장 내역서)의 자체 계산값(대상액 5,443,886,601원 × 건축공사 2.37% = 129,020,108원)과
 *     이 표의 건축공사·50억원 이상 요율(2.37%)이 정확히 일치해 신뢰도는 높으나, 공식 원문 대조 전까지는 최종 확정으로 간주하지 않는다.
 */
export const CALCULATION_RATE_TABLE: Record<ConstructionCategory, CalculationRateTableEntry> = {
    건축공사: { under5억Rate: 3.11, between5And50억Rate: 2.28, between5And50억BaseAmount: 4_325_000, over50억Rate: 2.37 },
    토목공사: { under5억Rate: 3.15, between5And50억Rate: 2.53, between5And50억BaseAmount: 3_300_000, over50억Rate: 2.6 },
    중건설공사: { under5억Rate: 3.64, between5And50억Rate: 3.05, between5And50억BaseAmount: 2_975_000, over50억Rate: 3.11 },
    특수건설공사: { under5억Rate: 2.07, between5And50억Rate: 1.59, between5And50억BaseAmount: 2_450_000, over50억Rate: 1.64 },
};

/** 본사 사용분 상한 비율 (계상액 대비, %). TODO(고시 확인 필요). */
export const HEADQUARTERS_USAGE_CAP_RATIO: number | undefined = undefined; // TODO(고시 확인 필요)

/** 스마트 안전장비 구입·임대비 인정 한도 비율 (%). TODO(고시 확인 필요, 자료마다 표기 상이). */
export const SMART_EQUIPMENT_RECOGNITION_CAP_RATIO: number | undefined = undefined; // TODO(고시 확인 필요)

export interface SettlementRefundRule {
    /** 미집행 잔액 중 발주자에게 반환/감액해야 하는 비율 (0~100, %). */
    refundRatioOfUnexecuted: number;
}

/** 공공발주 반환·감액형 정산 규칙. TODO(고시·계약조건 확인 필요). */
export const PUBLIC_SETTLEMENT_RULE: SettlementRefundRule | undefined = undefined; // TODO(고시 확인 필요)

/** 민간 계약형 정산 규칙. 계약서상 사후정산 조항에 따라 값이 달라지므로 프로젝트별 확인 필요. TODO(계약조건 확인 필요). */
export const PRIVATE_SETTLEMENT_RULE: SettlementRefundRule | undefined = undefined; // TODO(계약조건 확인 필요)
