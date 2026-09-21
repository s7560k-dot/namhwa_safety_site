/**
 * 법령·고시에서 유래하는 수치만 모아두는 설정 파일.
 * 값은 반드시 고용노동부 고시 원문·산업안전보건공단 공식 자료로 확인 후 채운다.
 * 확인 전에는 undefined(TODO)로 두고, 이 값을 사용하는 기능은 값이 없으면 계산을 거부해야 한다.
 */

/** 공사종류별 산안비 계상요율표. TODO(고시 확인 필요): 대상액 구간별 요율·기초액. */
export const CALCULATION_RATE_TABLE: unknown = undefined; // TODO(고시 확인 필요)

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
