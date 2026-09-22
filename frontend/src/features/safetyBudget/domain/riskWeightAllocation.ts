import { WORK_TYPE_RISK_COEFFICIENTS, DEFAULT_RISK_COEFFICIENT } from '../config/riskCoefficient.config';
import type { DetailWorkItem } from './costBreakdownImport';

/** 위험계수 매칭 결과가 포함된 세부공종별 위험가중치 산정 결과. */
export interface RiskWeightAllocationItem {
    discipline: string;
    code: string;
    name: string;
    amount: number;
    riskCoefficient: number;
    /** 위험계수 테이블에 정확히 매칭됐는지 여부. false면 기본계수가 적용된 것이므로 화면에서 검토를 유도해야 한다. */
    matched: boolean;
    /** 정규화된 위험가중치 (0~1, 전체 합=1). */
    riskWeight: number;
}

/** 세부공종명(이미 공백 제거된 정규화 이름)에 대해 위험계수를 찾는다. 실패 시 기본계수를 반환한다. */
export function matchWorkTypeToRiskCoefficient(name: string): { coefficient: number; matched: boolean } {
    const coefficient = WORK_TYPE_RISK_COEFFICIENTS[name];
    if (coefficient === undefined) {
        return { coefficient: DEFAULT_RISK_COEFFICIENT, matched: false };
    }
    return { coefficient, matched: true };
}

/**
 * 세부공종별 금액 × 위험계수를 정규화해 위험가중치(합=1)를 산정한다.
 * riskWeight_i = (amount_i × coefficient_i) / Σ(amount_j × coefficient_j)
 * @param overrides 사용자가 미리보기 화면에서 수동으로 지정한 위험계수 (코드 기준, 매칭 실패 항목 보정용)
 * @throws {Error} 입력이 비어있거나 가중합이 0일 때 (모든 금액이 0인 경우)
 */
export function deriveRiskWeights(
    detailWorkItems: readonly DetailWorkItem[],
    overrides: Readonly<Record<string, number>> = {}
): RiskWeightAllocationItem[] {
    if (detailWorkItems.length === 0) {
        throw new Error('세부공종 데이터가 없어 위험가중치를 산정할 수 없습니다.');
    }

    const withCoefficients = detailWorkItems.map((item) => {
        if (item.code in overrides) {
            return { ...item, coefficient: overrides[item.code], matched: true };
        }
        const { coefficient, matched } = matchWorkTypeToRiskCoefficient(item.name);
        return { ...item, coefficient, matched };
    });

    const weightedSum = withCoefficients.reduce((sum, item) => sum + item.amount * item.coefficient, 0);
    if (weightedSum <= 0) {
        throw new Error('가중 합계가 0입니다. 금액 또는 위험계수를 확인하세요.');
    }

    return withCoefficients.map((item) => ({
        discipline: item.discipline,
        code: item.code,
        name: item.name,
        amount: item.amount,
        riskCoefficient: item.coefficient,
        matched: item.matched,
        riskWeight: (item.amount * item.coefficient) / weightedSum,
    }));
}
